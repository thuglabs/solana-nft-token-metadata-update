#!/usr/bin/env node
import { program } from 'commander';
import { PublicKey, Connection, clusterApiUrl, Cluster, Transaction } from '@solana/web3.js';
import {
    loadData,
    getImageUrl,
    getMultipleAccounts,
    saveMetaData,
    MetaplexCacheJson,
    loadWalletKey,
    MetadataCacheContent,
    sendSignedTransaction,
} from './utils';
import { Metadata, Data, Creator } from './metaplex/classes';
import { getMetadataAddress } from './metaplex/utils';
import { decodeMetadata, updateMetadataInstruction } from './metaplex/metadata';
import { MetadataContainer } from './data-types';
import { CANDY_MACHINE_ID } from './constants';

const RPC_CLUSTER_API = 'https://solana-api.projectserum.com';
// const RPC_CLUSTER_API = 'https://api.devnet.solana.com';
const RPC_CLUSTER = RPC_CLUSTER_API;

const getConnection = (env: string) => {
    const cluster = env === 'mainnet-beta' ? RPC_CLUSTER : clusterApiUrl(env as Cluster);
    const connection = new Connection(cluster);
    return connection;
};

program.version('0.0.1');

program
    .command('download-metadata')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .action(async (_directory, cmd) => {
        const { env } = cmd.opts();
        const data = loadData() as string[];
        if (!data) {
            throw new Error('You need provide both token list and updated metadata json files');
        }

        const connection = getConnection(env);

        console.log(`Reading metadata for: ${data.length} items`);
        console.log('Get the token metadata from the chain...');
        const intermediateResult: { [key: string]: string } = {};
        for (let index = 0; index < data.length; index++) {
            const key = data[index];
            const metaKey = await getMetadataAddress(new PublicKey(key));
            intermediateResult[metaKey.toBase58()] = key;
        }
        const rawMetas = await getMultipleAccounts(connection, Object.keys(intermediateResult), 'finalized');

        const result: MetadataContainer = {};

        console.log('Decode the token metadata, this WILL take a while');
        for (let index = 0; index < rawMetas.keys.length; index++) {
            const metaKey = rawMetas.keys[index];
            const metaAccount = rawMetas.array[index];
            if (!metaAccount) {
                continue;
            }

            let mintMetaData: Metadata | undefined = undefined;
            try {
                mintMetaData = decodeMetadata(metaAccount.data);
            } catch {
                // do nothing
            }
            console.log(`Decoded #${index}: ${mintMetaData.data.name}`);
            const mintKey = intermediateResult[metaKey];
            console.log('mintMetaData', mintMetaData);

            // only get NFTs from collection
            if (mintMetaData?.data.creators && mintMetaData?.data.creators[0].address === CANDY_MACHINE_ID.toBase58()) {
                result[mintKey] = {
                    metaKey,
                    mintMetaData,
                    name: mintMetaData?.data.name,
                    uri: mintMetaData?.data.uri,
                    imageUri: mintMetaData && (await getImageUrl(mintMetaData)),
                };
            }
        }

        console.log('Save the metadata loaded from the chain');

        // at this point we have the metadata loaded from the chain
        saveMetaData(JSON.stringify(result, null, 2));

        console.log('result >>> ', result);
    });

type TokenDetailsCurrent = {
    mint: string;
    index: number;
    metadata: any;
};

const defaultCacheFilePath = 'data/current-metadata-cache.json';
const defaultArweaveLinksPath = 'data/mainnet-beta-temp.json';
program
    .command('update')
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-c, --cache-name <string>', 'Cache file name', `./${defaultCacheFilePath}`)
    .option('-ar, --arweave-links <string>', 'Updated arweaeve links file name', `./${defaultArweaveLinksPath}`)
    .option('-k, --keypair <path>', 'Solana wallet location', '--keypair not provided')
    .action(async (_directory, cmd) => {
        const { cacheName, arweaveLinks, env, keypair } = cmd.opts();

        const metadataPath = cacheName ?? `../${defaultCacheFilePath}`;
        const walletKeyPair = loadWalletKey(keypair);
        console.log(`Running on '${env}' network`);

        const metadataCacheJson = loadData(metadataPath) as MetadataCacheContent;
        const metadataCurrent: TokenDetailsCurrent[] = Object.entries(metadataCacheJson).map(
            ([mint, metadata]: [string, any]) => {
                const numberInTheName = metadata.mintMetaData.data.name.match(/\d+/)[0];
                const index = parseInt(numberInTheName);
                return {
                    mint,
                    index,
                    metadata,
                };
            },
        );
        // console.log('metadataCurrent', metadataCurrent[0]);

        const arweaveLinksPath = arweaveLinks ?? `../${defaultArweaveLinksPath}`;
        const arweaveJson = loadData(arweaveLinksPath) as MetaplexCacheJson;

        const arweaveData = Object.entries(arweaveJson?.items).map(([key, value]) => {
            return {
                ...value,
                index: parseInt(key),
            };
        });
        // console.log('arweaveData', arweaveData);

        if (!metadataCurrent || !arweaveData?.length) {
            throw new Error('You need provide both token list and updated metadata json files');
        }

        // console.log('metadataCurrent', metadataCurrent);

        const metadataUpdated = metadataCurrent.reduce((acc, el) => {
            const arweaveLinks = arweaveData.find((a) => a.index === el.index);
            // console.log('arweaveLinks', arweaveLinks);

            if (!arweaveLinks) {
                console.log(`Can't find arweave link for ${el.index}. Skipping.`);
                return acc;
            }

            const uri = arweaveLinks.link;

            const elUpdated = {
                ...el,
                metadata: {
                    ...el.metadata,
                    mintMetaData: {
                        ...el.metadata.mintMetaData,
                        uri,
                    },
                    uri,
                },
            };

            return [...acc, elUpdated];
        }, []);

        console.log('Number of items to be updated: ', metadataUpdated.length);

        // const nftItemToFix = 'TOKEN_ADDRESS_TO_UPDATE_AS_SINGLE_ITEM';
        // const metadataUpdatedFiltered = metadataUpdated.filter((el) => el.mint === nftItemToFix);

        const metadataUpdatedFiltered = metadataUpdated.slice(0, 10000);

        // console.log('metadataUpdatedFiltered', metadataUpdatedFiltered);
        // return;

        const connection = getConnection(env);

        // console.log('result >>> ', metadataUpdated);

        // failed to update tokens will be stored here and output at the end
        const failed = [];

        // next wee need to update using updateMetadataInstruction
        for (const [index, el] of metadataUpdatedFiltered.entries()) {
            const updatedUri = el.metadata.uri;
            const { data, primarySaleHappened, updateAuthority } = el.metadata.mintMetaData;
            const mintKey = el.metadata.mintMetaData.mint;
            const newUpdateAuthority = updateAuthority;

            const creators = data.creators.map(
                (el) =>
                    new Creator({
                        ...el,
                    }),
            );

            const updatedData = new Data({
                name: data.name,
                symbol: data?.symbol,
                uri: updatedUri,
                creators: [...creators],
                sellerFeeBasisPoints: data.sellerFeeBasisPoints,
            });

            // console.log('updatedData', updatedData);

            console.log(`Updating token #${index} ${mintKey}...`);

            try {
                const instruction = await updateMetadataInstruction(
                    updatedData,
                    newUpdateAuthority,
                    primarySaleHappened,
                    mintKey,
                    updateAuthority,
                    // metadataAccountStr,
                );

                // console.log('instruction', instruction);
                const tx = new Transaction().add(instruction);

                tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
                tx.feePayer = walletKeyPair.publicKey;

                tx.sign(walletKeyPair, walletKeyPair);
                // console.log('tx', tx);

                const { txid, slot } = await sendSignedTransaction({
                    connection,
                    signedTransaction: tx,
                });

                console.log('✅ Tx was successful! ID: ', txid, slot);
            } catch (error) {
                failed.push(mintKey);
                console.warn(`🚫 Items: ${el.index} failed to update with error:`, error.message);
            }
        }

        console.log(`${metadataUpdatedFiltered.length} items have been updated!`);

        if (failed.length) {
            console.log('🚫 List of failed to update tokens: ', failed);
            console.log('Try rerun script on this tokens only.');
        } else {
            console.log('🚫 No failed transactions. Life is good! 😎');
        }
    });

program.parse(process.argv);
