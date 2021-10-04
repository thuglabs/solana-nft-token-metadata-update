/* NOTE: this is a partial rewrite from metaplex js code

         https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/common
*/

import { PublicKey } from '@solana/web3.js';

import { METAPLEX } from '../constants';
import { EDITION, METADATA_PREFIX, StringPublicKey } from './types';

export const findProgramAddressPublicKey = async (
    seeds: (Buffer | Uint8Array)[],
    programId: PublicKey,
): Promise<PublicKey> => {
    const result = await PublicKey.findProgramAddress(seeds, programId);
    return result[0];
};

// metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
export async function getProgramAddressForPublicKey({
    metadataContractPK = METAPLEX,
    tokenMintPK,
}: {
    metadataContractPK?: PublicKey;
    tokenMintPK: PublicKey | StringPublicKey;
}): Promise<StringPublicKey> {
    const tokenMintPublicKey = (tokenMintPK as StringPublicKey)
        ? new PublicKey(tokenMintPK as string)
        : (tokenMintPK as PublicKey);

    const publicKeyForMint = await findProgramAddressPublicKey(
        [
            Buffer.from(METADATA_PREFIX),
            metadataContractPK.toBuffer(),
            tokenMintPublicKey.toBuffer(),
            Buffer.from(EDITION),
        ],
        metadataContractPK,
    );

    return publicKeyForMint.toString();
}

/** Get metaplex mint metadata account address */
export const getMetadataAddress = async (mint: PublicKey): Promise<PublicKey> => {
    return (
        await PublicKey.findProgramAddress([Buffer.from('metadata'), METAPLEX.toBuffer(), mint.toBuffer()], METAPLEX)
    )[0];
};
