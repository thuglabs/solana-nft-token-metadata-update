"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMetadata = exports.decodeMetadata = exports.extendBorsh = void 0;
const tslib_1 = require("tslib");
const web3_js_1 = require("@solana/web3.js");
const borsh_1 = require("borsh");
const bs58_1 = (0, tslib_1.__importDefault)(require("bs58"));
const classes_1 = require("./classes");
const constants_1 = require("../constants");
const extendBorsh = () => {
    borsh_1.BinaryReader.prototype.readPubkey = function () {
        const reader = this;
        const array = reader.readFixedArray(32);
        return new web3_js_1.PublicKey(array);
    };
    borsh_1.BinaryWriter.prototype.writePubkey = function (value) {
        const writer = this;
        writer.writeFixedArray(value.toBuffer());
    };
    borsh_1.BinaryReader.prototype.readPubkeyAsString = function () {
        const reader = this;
        const array = reader.readFixedArray(32);
        return bs58_1.default.encode(array);
    };
    borsh_1.BinaryWriter.prototype.writePubkeyAsString = function (value) {
        const writer = this;
        writer.writeFixedArray(bs58_1.default.decode(value));
    };
};
exports.extendBorsh = extendBorsh;
(0, exports.extendBorsh)();
const decodeMetadata = (buffer) => {
    const metadata = (0, borsh_1.deserializeUnchecked)(classes_1.METADATA_SCHEMA, classes_1.Metadata, buffer);
    metadata.data.name = metadata.data.name.replace(/\0/g, '');
    metadata.data.symbol = metadata.data.symbol.replace(/\0/g, '');
    metadata.data.uri = metadata.data.uri.replace(/\0/g, '');
    metadata.data.name = metadata.data.name.replace(/\0/g, '');
    return metadata;
};
exports.decodeMetadata = decodeMetadata;
async function updateMetadata(data, newUpdateAuthority, primarySaleHappened, mintKey, updateAuthority, metadataAccountStr) {
    const metadataProgramId = constants_1.METAPLEX;
    const instructions = [];
    const metadataAccount = new web3_js_1.PublicKey(metadataAccountStr) ||
        (await web3_js_1.PublicKey.findProgramAddress([
            Buffer.from('metadata'),
            new web3_js_1.PublicKey(metadataProgramId).toBuffer(),
            new web3_js_1.PublicKey(mintKey).toBuffer(),
        ], metadataProgramId))[0];
    const value = new classes_1.UpdateMetadataArgs({
        data,
        updateAuthority: !newUpdateAuthority ? undefined : newUpdateAuthority,
        primarySaleHappened: primarySaleHappened === null || primarySaleHappened === undefined ? null : primarySaleHappened,
    });
    const txnData = Buffer.from((0, borsh_1.serialize)(classes_1.METADATA_SCHEMA, value));
    const keys = [
        {
            pubkey: metadataAccount,
            isSigner: false,
            isWritable: true,
        },
        {
            pubkey: new web3_js_1.PublicKey(updateAuthority),
            isSigner: true,
            isWritable: false,
        },
    ];
    instructions.push(new web3_js_1.TransactionInstruction({
        keys,
        programId: new web3_js_1.PublicKey(metadataProgramId),
        data: txnData,
    }));
    return instructions;
}
exports.updateMetadata = updateMetadata;
//# sourceMappingURL=metadata.js.map