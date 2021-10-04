import { TransactionInstruction } from '@solana/web3.js';
import { Data, Metadata } from './classes';
import { StringPublicKey } from './types';
export declare const extendBorsh: () => void;
export declare const decodeMetadata: (buffer: Buffer) => Metadata;
export declare function updateMetadata(data: Data | undefined, newUpdateAuthority: string | undefined, primarySaleHappened: boolean | null | undefined, mintKey: StringPublicKey, updateAuthority: StringPublicKey, metadataAccountStr?: StringPublicKey): Promise<TransactionInstruction[]>;
