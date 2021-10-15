import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {
    AccountInfo,
    Keypair,
    Transaction,
    Connection,
    TransactionSignature,
    SimulatedTransactionResponse,
    Commitment,
    RpcResponseAndContext,
    SignatureStatus,
} from '@solana/web3.js';
import { Metadata } from './metaplex/classes';

const DATA_DIRECTORY = '../src/data/';
const METADATA_FILE = 'metadata-cache.json';

type Creator = {
    address: string;
    verified: number;
    share: number;
};

export type TokenMeta = {
    metaKey: string;
    mintMetaData: {
        key: number;
        updateAuthority: string;
        mint: string;
        data: {
            name: string;
            symbol: string;
            uri: string;
            sellerFeeBasisPoints: number;
            creators: Creator[];
        };
        primarySaleHappened: number;
        isMutable: number;
    };
    name: string;
    uri: string;
    imageUri: string;
};

export type MetadataCacheContent = {
    [key: string]: TokenMeta;
};

export type ArweaveLinks = {
    [index: string]: {
        link: string;
        name: string;
        imageUri?: string;
    };
};

export type MetaplexCacheJson = {
    program: unknown;
    items: ArweaveLinks;
};

type JsonFileContent = string[] | MetadataCacheContent | MetaplexCacheJson;

export const loadData = (file = `${DATA_DIRECTORY}3d-soldiers.json`): JsonFileContent => {
    const defaultJson = [];
    const thePath = path.resolve(__dirname, file);
    try {
        return fs.existsSync(thePath) ? JSON.parse(fs.readFileSync(thePath).toString()) : defaultJson;
    } catch {
        return defaultJson;
    }
};

export const saveMetaData = (metadata: string, directory = DATA_DIRECTORY, fileName = METADATA_FILE): void => {
    const theDirectory = path.resolve(__dirname, directory);
    if (!fs.existsSync(theDirectory)) {
        fs.mkdirSync(theDirectory);
    }
    const thePath = path.resolve(__dirname, directory, fileName);
    fs.writeFileSync(thePath, metadata);
};

export function chunks<T>(array: T[], size: number): T[][] {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) =>
        array.slice(index * size, (index + 1) * size),
    );
}

export const getMultipleAccounts = async (connection: any, keys: string[], commitment: string) => {
    const result = await Promise.all(
        chunks(keys, 99).map((chunk) => getMultipleAccountsCore(connection, chunk, commitment)),
    );

    const array = result
        .map(
            (a) =>
                a.array
                    .map((acc) => {
                        if (!acc) {
                            return undefined;
                        }

                        const { data, ...rest } = acc;
                        const obj = {
                            ...rest,
                            data: Buffer.from(data[0], 'base64'),
                        } as AccountInfo<Buffer>;
                        return obj;
                    })
                    .filter((_) => _) as AccountInfo<Buffer>[],
        )
        .flat();
    return { keys, array };
};

const getMultipleAccountsCore = async (connection: any, keys: string[], commitment: string) => {
    const args = connection._buildArgs([keys], commitment, 'base64');

    const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
    if (unsafeRes.error) {
        throw new Error('failed to get info about account ' + unsafeRes.error.message);
    }

    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value as AccountInfo<string[]>[];
        return { keys, array };
    }

    // TODO: fix
    throw new Error();
};

export const getImageUrl = async (meta: Metadata): Promise<string> => {
    return await fetch(meta.data.uri).then((result) => {
        return result.json().then((json) => {
            return (json as any).image;
        });
    });
};

/**
 * Load wallet from local file
 */
export function loadWalletKey(keypair): Keypair {
    if (!keypair || keypair == '') {
        throw new Error('Keypair is required!');
    }
    const loaded = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString())));

    console.log(`wallet public key: ${loaded.publicKey}`);
    return loaded;
}

export const getUnixTs = () => {
    return new Date().getTime() / 1000;
};

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_TIMEOUT = 15000;

export async function sendSignedTransaction({
    signedTransaction,
    connection,
    timeout = DEFAULT_TIMEOUT,
}: {
    signedTransaction: Transaction;
    connection: Connection;
    sendingMessage?: string;
    sentMessage?: string;
    successMessage?: string;
    timeout?: number;
}): Promise<{ txid: string; slot: number }> {
    const rawTransaction = signedTransaction.serialize();
    const startTime = getUnixTs();
    let slot = 0;
    const txid: TransactionSignature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
    });

    console.log('Started awaiting confirmation for', txid);

    let done = false;
    (async () => {
        while (!done && getUnixTs() - startTime < timeout) {
            connection.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
            });
            await sleep(500);
        }
    })();
    try {
        const confirmation = await awaitTransactionSignatureConfirmation(txid, timeout, connection, 'recent', true);

        if (!confirmation) throw new Error('Timed out awaiting confirmation on transaction');

        if (confirmation.err) {
            console.error(confirmation.err);
            throw new Error('Transaction failed: Custom instruction error');
        }

        slot = confirmation?.slot || 0;
    } catch (err) {
        console.error('Timeout Error caught', err);
        if (err.timeout) {
            throw new Error('Timed out awaiting confirmation on transaction');
        }
        let simulateResult: SimulatedTransactionResponse | null = null;
        try {
            simulateResult = (await simulateTransaction(connection, signedTransaction, 'single')).value;
        } catch (e) {}
        if (simulateResult && simulateResult.err) {
            if (simulateResult.logs) {
                for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
                    const line = simulateResult.logs[i];
                    if (line.startsWith('Program log: ')) {
                        throw new Error('Transaction failed: ' + line.slice('Program log: '.length));
                    }
                }
            }
            throw new Error(JSON.stringify(simulateResult.err));
        }
        // throw new Error('Transaction failed');
    } finally {
        done = true;
    }

    console.log('Latency', txid, getUnixTs() - startTime);
    return { txid, slot };
}

async function simulateTransaction(
    connection: Connection,
    transaction: Transaction,
    commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
    // @ts-ignore
    transaction.recentBlockhash = await connection._recentBlockhash(
        // @ts-ignore
        connection._disableBlockhashCaching,
    );

    const signData = transaction.serializeMessage();
    // @ts-ignore
    const wireTransaction = transaction._serialize(signData);
    const encodedTransaction = wireTransaction.toString('base64');
    const config: any = { encoding: 'base64', commitment };
    const args = [encodedTransaction, config];

    // @ts-ignore
    const res = await connection._rpcRequest('simulateTransaction', args);
    if (res.error) {
        throw new Error('failed to simulate transaction: ' + res.error.message);
    }
    return res.result;
}

async function awaitTransactionSignatureConfirmation(
    txid: TransactionSignature,
    timeout: number,
    connection: Connection,
    commitment: Commitment = 'recent',
    queryStatus = false,
): Promise<SignatureStatus | null | void> {
    let done = false;
    let status: SignatureStatus | null | void = {
        slot: 0,
        confirmations: 0,
        err: null,
    };
    let subId = 0;
    status = await new Promise(async (resolve, reject) => {
        setTimeout(() => {
            if (done) {
                return;
            }
            done = true;
            console.log('Rejecting for timeout...');
            reject({ timeout: true });
        }, timeout);
        try {
            subId = connection.onSignature(
                txid,
                (result, context) => {
                    done = true;
                    status = {
                        err: result.err,
                        slot: context.slot,
                        confirmations: 0,
                    };
                    if (result.err) {
                        console.log('Rejected via websocket', result.err);
                        reject(status);
                    } else {
                        console.log('Resolved via websocket', result);
                        resolve(status);
                    }
                },
                commitment,
            );
        } catch (e) {
            done = true;
            console.error('WS error in setup', txid, e);
        }
        while (!done && queryStatus) {
            // eslint-disable-next-line no-loop-func
            (async () => {
                try {
                    const signatureStatuses = await connection.getSignatureStatuses([txid]);
                    status = signatureStatuses && signatureStatuses.value[0];
                    if (!done) {
                        if (!status) {
                            console.log('REST null result for', txid, status);
                        } else if (status.err) {
                            console.log('REST error for', txid, status);
                            done = true;
                            reject(status.err);
                        } else if (!status.confirmations) {
                            console.log('REST no confirmations for', txid, status);
                        } else {
                            console.log('REST confirmation for', txid, status);
                            done = true;
                            resolve(status);
                        }
                    }
                } catch (e) {
                    if (!done) {
                        console.log('REST connection error: txid', txid, e);
                    }
                }
            })();
            await sleep(2000);
        }
    });

    //@ts-ignore
    if (connection._signatureSubscriptions[subId]) connection.removeSignatureListener(subId);
    done = true;
    console.log('Returning status', status);
    return status;
}
