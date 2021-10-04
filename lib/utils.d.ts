import { AccountInfo } from '@solana/web3.js';
import { Metadata } from './metaplex/classes';
export declare const loadData: (file?: string) => string[];
export declare function chunks<T>(array: T[], size: number): T[][];
export declare const getMultipleAccounts: (connection: any, keys: string[], commitment: string) => Promise<{
    keys: string[];
    array: AccountInfo<Buffer>[];
}>;
export declare const getImageUrl: (meta: Metadata) => Promise<string>;
