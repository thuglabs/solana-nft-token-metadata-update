#!/usr/bin/env node
import { program } from 'commander';
import { PublicKey, Connection } from '@solana/web3.js';
import { loadData, getImageUrl, getMultipleAccounts } from './utils';
import { Metadata } from './metaplex/classes';
import { getMetadataAddress } from './metaplex/utils';
import { decodeMetadata } from './metaplex/metadata';
import { MetadataContainer } from './data-types';
import { CANDY_MACHINE_3D } from './constants';

program.version('0.0.1');

program
    .command('upload')
    // .argument('<directory>', 'Directory containing images named from 0-n', (val) => val)
    // .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    // .option('-k, --key <path>', `Arweave wallet location`, '--Arweave wallet not provided')
    // .option('-c, --cache-name <string>', 'Cache file name', 'temp')
    .action(async () => {
        const data = [loadData()[0]];
        const connection = new Connection('https://solana-api.projectserum.com');

        const intermediateResult: { [key: string]: string } = {};
        for (let index = 0; index < data.length; index++) {
            const key = data[index];
            const metaKey = await getMetadataAddress(new PublicKey(key));
            intermediateResult[metaKey.toBase58()] = key;
        }
        const rawMetas = await getMultipleAccounts(connection, Object.keys(intermediateResult), 'finalized');

        const result: MetadataContainer = {};

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
            const mintKey = intermediateResult[metaKey];

            // only get Soldiers
            if (mintMetaData?.data.creators && mintMetaData?.data.creators[0].address === CANDY_MACHINE_3D.toBase58()) {
                result[mintKey] = {
                    metaKey,
                    mintMetaData,
                    name: mintMetaData?.data.name,
                    uri: mintMetaData?.data.uri,
                    imageUri: mintMetaData && getImageUrl(mintMetaData),
                };
            }
        }

        // at this point we have the metadata loaded from the chain
        console.log('result >>> ', result);
        // next wee need to update using updateMetadata
    });

program.parse(process.argv);
