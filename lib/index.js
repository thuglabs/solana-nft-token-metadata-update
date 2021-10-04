#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("./utils");
const utils_2 = require("./metaplex/utils");
const metadata_1 = require("./metaplex/metadata");
const constants_1 = require("./constants");
commander_1.program.version('0.0.1');
commander_1.program
    .command('upload')
    // .argument('<directory>', 'Directory containing images named from 0-n', (val) => val)
    // .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    // .option('-k, --key <path>', `Arweave wallet location`, '--Arweave wallet not provided')
    // .option('-c, --cache-name <string>', 'Cache file name', 'temp')
    .action(async () => {
    const data = [(0, utils_1.loadData)()[0]];
    const connection = new web3_js_1.Connection('https://solana-api.projectserum.com');
    const intermediateResult = {};
    for (let index = 0; index < data.length; index++) {
        const key = data[index];
        const metaKey = await (0, utils_2.getMetadataAddress)(new web3_js_1.PublicKey(key));
        intermediateResult[metaKey.toBase58()] = key;
    }
    const rawMetas = await (0, utils_1.getMultipleAccounts)(connection, Object.keys(intermediateResult), 'finalized');
    const result = {};
    for (let index = 0; index < rawMetas.keys.length; index++) {
        const metaKey = rawMetas.keys[index];
        const metaAccount = rawMetas.array[index];
        if (!metaAccount) {
            continue;
        }
        let mintMetaData = undefined;
        try {
            mintMetaData = (0, metadata_1.decodeMetadata)(metaAccount.data);
        }
        catch {
            // do nothing
        }
        const mintKey = intermediateResult[metaKey];
        // only get Soldiers
        if (mintMetaData?.data.creators && mintMetaData?.data.creators[0].address === constants_1.CANDY_MACHINE_3D.toBase58()) {
            result[mintKey] = {
                metaKey,
                mintMetaData,
                name: mintMetaData?.data.name,
                uri: mintMetaData?.data.uri,
                imageUri: mintMetaData && (0, utils_1.getImageUrl)(mintMetaData),
            };
        }
    }
    // at this point we have the metadata loaded from the chain
    console.log('result >>> ', result);
    // next wee need to update using updateMetadata
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map