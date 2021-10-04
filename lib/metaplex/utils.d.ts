import { PublicKey } from '@solana/web3.js';
import { StringPublicKey } from './types';
export declare const findProgramAddressPublicKey: (seeds: (Buffer | Uint8Array)[], programId: PublicKey) => Promise<PublicKey>;
export declare function getProgramAddressForPublicKey({ metadataContractPK, tokenMintPK, }: {
    metadataContractPK?: PublicKey;
    tokenMintPK: PublicKey | StringPublicKey;
}): Promise<StringPublicKey>;
/** Get metaplex mint metadata account address */
export declare const getMetadataAddress: (mint: PublicKey) => Promise<PublicKey>;
