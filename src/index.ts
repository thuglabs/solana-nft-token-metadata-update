#!/usr/bin/env node
import { program } from 'commander';
import { PublicKey, Connection } from '@solana/web3.js';
import { loadData, getImageUrl, getMultipleAccounts, saveMetaData, ArweaveLink } from './utils';
import { Metadata, Data, Creator } from './metaplex/classes';
import { getMetadataAddress } from './metaplex/utils';
import { decodeMetadata, updateMetadata } from './metaplex/metadata';
import { MetadataContainer } from './data-types';
import { CANDY_MACHINE_3D } from './constants';

// const RPC_CLUSTER = 'https://solana-api.projectserum.com';
const RPC_CLUSTER = 'https://api.devnet.solana.com';

program.version('0.0.1');

program
    .command('download-metadata')
    // .argument('<directory>', 'Directory containing images named from 0-n', (val) => val)
    // .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    // .option('-k, --key <path>', `Arweave wallet location`, '--Arweave wallet not provided')
    // .option('-c, --cache-name <string>', 'Cache file name', 'temp')
    .action(async () => {
        const data = loadData().slice(0, 20);
        if (!data) {
            throw new Error('You need provide both token list and updated metadata json files');
        }

        const connection = new Connection(RPC_CLUSTER);

        console.log('Get the token metadata from the chain');
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
            console.log('Decoded ', mintMetaData.data.name);
            const mintKey = intermediateResult[metaKey];
            // console.log('mintMetaData', mintMetaData);

            // only get Soldiers
            if (mintMetaData?.data.creators && mintMetaData?.data.creators[0].address === CANDY_MACHINE_3D.toBase58()) {
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

const defaultCacheFilePath = 'data/metadata-cache.json';
const defaultArweaveLinksPath = 'data/arweave-links.json';
program
    .command('update')
    // .argument('<directory>', 'Directory containing images named from 0-n', (val) => val)
    // .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    // .option('-k, --key <path>', `Arweave wallet location`, '--Arweave wallet not provided')
    .option('-c, --cache-name <string>', 'Cache file name', `./${defaultCacheFilePath}`)
    .option('-ar, --arweave-links-name <string>', 'Updated arweaeve links file name', `./${defaultArweaveLinksPath}`)
    .action(async (_directory, cmd) => {
        const { cacheName, arweaveLinksName } = cmd.opts();

        const metadataPath = cacheName ?? `../${defaultCacheFilePath}`;

        const metadataCurrent: TokenDetailsCurrent[] = Object.entries(loadData(metadataPath)).map(
            ([mint, metadata]: [string, any]) => {
                const index = parseInt(metadata.mintMetaData.data.name.split('#')[1]);
                return {
                    mint,
                    index,
                    metadata,
                };
            },
        );

        // console.log('metadataCurrent', metadataCurrent);

        const arweaveLinksPath = arweaveLinksName ?? `../${defaultArweaveLinksPath}`;
        const arweaveJson = loadData(arweaveLinksPath) as ArweaveLink[];

        if (!metadataCurrent || !arweaveJson) {
            throw new Error('You need provide both token list and updated metadata json files');
        }

        // console.log('arweaveJson', arweaveJson);

        const metadataUpdated = metadataCurrent.map((el) => {
            const arweaveLinks = arweaveJson.find((a) => parseInt(a.index) === el.index);
            const uri = arweaveLinks.uri;
            const imageUri = arweaveLinks.imageUri;

            return {
                ...el,
                metadata: {
                    ...el.metadata,
                    mintMetaData: {
                        ...el.metadata.mintMetaData,
                        uri,
                    },
                    uri,
                    imageUri,
                },
            };
        });

        const connection = new Connection(RPC_CLUSTER);

        console.log('result >>> ', metadataUpdated);

        // next wee need to update using updateMetadata
        for (const el of metadataUpdated) {
            const updatedUri = el.metadata.uri;
            const { data, primarySaleHappened, updateAuthority } = el.metadata.mintMetaData;
            const mintKey = el.metadata.metaKey;
            const newUpdateAuthority = undefined;
            // const metadataAccountStr = "";

            const creators = data.creators.map(
                (el) =>
                    new Creator({
                        ...el,
                    }),
            );

            const updatedData = new Data({
                name: data.name,
                symbol: 'SLDR3D',
                uri: updatedUri,
                creators,
                sellerFeeBasisPoints: data.sellerFeeBasisPoints,
            });
            // console.log('value', updatedData);
            try {
                const tx = await updateMetadata(
                    updatedData,
                    newUpdateAuthority,
                    primarySaleHappened,
                    mintKey,
                    updateAuthority,
                    // metadataAccountStr,
                );

                console.log('tx', tx);

                // const txid = await sendTransactionWithRetry(connection, wallet, updateInstructions, updateSigners);

                // await connection.confirmTransaction(txid, 'max');
            } catch (error) {
                console.warn(`Items: ${el.index} failed to update with error:`, error.message);
            }
        }
    });

program.parse(process.argv);
