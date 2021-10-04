"use strict";
/* NOTE: this is a partial rewrite from metaplex js code

         https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/common
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadataAddress = exports.getProgramAddressForPublicKey = exports.findProgramAddressPublicKey = void 0;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../constants");
const types_1 = require("./types");
const findProgramAddressPublicKey = async (seeds, programId) => {
    const result = await web3_js_1.PublicKey.findProgramAddress(seeds, programId);
    return result[0];
};
exports.findProgramAddressPublicKey = findProgramAddressPublicKey;
// metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
async function getProgramAddressForPublicKey({ metadataContractPK = constants_1.METAPLEX, tokenMintPK, }) {
    const tokenMintPublicKey = tokenMintPK
        ? new web3_js_1.PublicKey(tokenMintPK)
        : tokenMintPK;
    const publicKeyForMint = await (0, exports.findProgramAddressPublicKey)([
        Buffer.from(types_1.METADATA_PREFIX),
        metadataContractPK.toBuffer(),
        tokenMintPublicKey.toBuffer(),
        Buffer.from(types_1.EDITION),
    ], metadataContractPK);
    return publicKeyForMint.toString();
}
exports.getProgramAddressForPublicKey = getProgramAddressForPublicKey;
/** Get metaplex mint metadata account address */
const getMetadataAddress = async (mint) => {
    return (await web3_js_1.PublicKey.findProgramAddress([Buffer.from('metadata'), constants_1.METAPLEX.toBuffer(), mint.toBuffer()], constants_1.METAPLEX))[0];
};
exports.getMetadataAddress = getMetadataAddress;
//# sourceMappingURL=utils.js.map