/* NOTE: these are all types pulled from the metaplex repo under
         the js commons folder:

         https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/common
*/

import BN from 'bn.js';

import { StringPublicKey, EDITION_MARKER_BIT_SIZE, MetadataKey, FileOrString, MetadataCategory } from './types';

import { getProgramAddressForPublicKey } from './utils';

export class MasterEditionV1 {
    key: MetadataKey;
    supply: BN;
    maxSupply?: BN;
    /// Can be used to mint tokens that give one-time permission to mint a single limited edition.
    printingMint: StringPublicKey;
    /// If you don't know how many printing tokens you are going to need, but you do know
    /// you are going to need some amount in the future, you can use a token from this mint.
    /// Coming back to token metadata with one of these tokens allows you to mint (one time)
    /// any number of printing tokens you want. This is used for instance by Auction Manager
    /// with participation NFTs, where we dont know how many people will bid and need participation
    /// printing tokens to redeem, so we give it ONE of these tokens to use after the auction is over,
    /// because when the auction begins we just dont know how many printing tokens we will need,
    /// but at the end we will. At the end it then burns this token with token-metadata to
    /// get the printing tokens it needs to give to bidders. Each bidder then redeems a printing token
    /// to get their limited editions.
    oneTimePrintingAuthorizationMint: StringPublicKey;

    constructor(args: {
        key: MetadataKey;
        supply: BN;
        maxSupply?: BN;
        printingMint: StringPublicKey;
        oneTimePrintingAuthorizationMint: StringPublicKey;
    }) {
        this.key = MetadataKey.MasterEditionV1;
        this.supply = args.supply;
        this.maxSupply = args.maxSupply;
        this.printingMint = args.printingMint;
        this.oneTimePrintingAuthorizationMint = args.oneTimePrintingAuthorizationMint;
    }
}

export class MasterEditionV2 {
    key: MetadataKey;
    supply: BN;
    maxSupply?: BN;

    constructor(args: { key: MetadataKey; supply: BN; maxSupply?: BN }) {
        this.key = MetadataKey.MasterEditionV2;
        this.supply = args.supply;
        this.maxSupply = args.maxSupply;
    }
}

export class EditionMarker {
    key: MetadataKey;
    ledger: number[];

    constructor(args: { key: MetadataKey; ledger: number[] }) {
        this.key = MetadataKey.EditionMarker;
        this.ledger = args.ledger;
    }

    editionTaken(edition: number): boolean {
        const editionOffset = edition % EDITION_MARKER_BIT_SIZE;
        const indexOffset = Math.floor(editionOffset / 8);

        if (indexOffset > 30) {
            throw Error('bad index for edition');
        }

        const positionInBitsetFromRight = 7 - (editionOffset % 8);

        const mask = Math.pow(2, positionInBitsetFromRight);

        const appliedMask = this.ledger[indexOffset] & mask;

        return appliedMask != 0;
    }
}

export class Edition {
    key: MetadataKey;
    /// Points at MasterEdition struct
    parent: StringPublicKey;
    /// Starting at 0 for master record, this is incremented for each edition minted.
    edition: BN;

    constructor(args: { key: MetadataKey; parent: StringPublicKey; edition: BN }) {
        this.key = MetadataKey.EditionV1;
        this.parent = args.parent;
        this.edition = args.edition;
    }
}
export class Creator {
    address: StringPublicKey;
    verified: boolean;
    share: number;

    constructor(args: { address: StringPublicKey; verified: boolean; share: number }) {
        this.address = args.address;
        this.verified = args.verified;
        this.share = args.share;
    }
}

export class Data {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;

    constructor(args: {
        name: string;
        symbol: string;
        uri: string;
        sellerFeeBasisPoints: number;
        creators: Creator[] | null;
    }) {
        this.name = args.name;
        this.symbol = args.symbol;
        this.uri = args.uri;
        this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
        this.creators = args.creators;
    }
}

export class Metadata {
    key: MetadataKey;
    updateAuthority: StringPublicKey;
    mint: StringPublicKey;
    data: Data;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number | null;

    // set lazy
    masterEdition?: StringPublicKey;
    edition?: StringPublicKey;

    constructor(args: {
        updateAuthority: StringPublicKey;
        mint: StringPublicKey;
        data: Data;
        primarySaleHappened: boolean;
        isMutable: boolean;
        editionNonce: number | null;
    }) {
        this.key = MetadataKey.MetadataV1;
        this.updateAuthority = args.updateAuthority;
        this.mint = args.mint;
        this.data = args.data;
        this.primarySaleHappened = args.primarySaleHappened;
        this.isMutable = args.isMutable;
        this.editionNonce = args.editionNonce;
    }

    public async init(): Promise<void> {
        const edition = await getProgramAddressForPublicKey({
            tokenMintPK: this.mint,
        });
        this.edition = edition;
        this.masterEdition = edition;
    }
}

export interface IMetadataExtension {
    name: string;
    symbol: string;

    creators: Creator[] | null;
    description: string;
    // preview image absolute URI
    image: string;
    animation_url?: string;

    // stores link to item on meta
    external_url: string;

    seller_fee_basis_points: number;

    properties: {
        files?: FileOrString[];
        category: MetadataCategory;
        maxSupply?: number;
        creators?: {
            address: string;
            shares: number;
        }[];
    };
}

export class UpdateMetadataArgs {
    instruction = 1;
    data: Data | null;
    // Not used by this app, just required for instruction
    updateAuthority: StringPublicKey | null;
    primarySaleHappened: boolean | null;

    constructor(args: { data?: Data; updateAuthority?: string; primarySaleHappened: boolean | null }) {
        this.data = args.data ? args.data : null;
        this.updateAuthority = args.updateAuthority ? args.updateAuthority : null;
        this.primarySaleHappened = args.primarySaleHappened;
    }
}

class CreateMetadataArgs {
    instruction: 0;
    data: Data;
    isMutable: boolean;

    constructor(args: { data: Data; isMutable: boolean }) {
        this.data = args.data;
        this.isMutable = args.isMutable;
    }
}

class CreateMasterEditionArgs {
    instruction: 10;
    maxSupply: BN | null;
    constructor(args: { maxSupply: BN | null }) {
        this.maxSupply = args.maxSupply;
    }
}

class MintPrintingTokensArgs {
    instruction: 9;
    supply: BN;

    constructor(args: { supply: BN }) {
        this.supply = args.supply;
    }
}

export const METADATA_SCHEMA = new Map<any, any>([
    [
        CreateMetadataArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['data', Data],
                ['isMutable', 'u8'], // bool
            ],
        },
    ],
    [
        UpdateMetadataArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['data', { kind: 'option', type: Data }],
                ['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
                ['primarySaleHappened', { kind: 'option', type: 'u8' }],
            ],
        },
    ],

    [
        CreateMasterEditionArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['maxSupply', { kind: 'option', type: 'u64' }],
            ],
        },
    ],
    [
        MintPrintingTokensArgs,
        {
            kind: 'struct',
            fields: [
                ['instruction', 'u8'],
                ['supply', 'u64'],
            ],
        },
    ],
    [
        MasterEditionV1,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['supply', 'u64'],
                ['maxSupply', { kind: 'option', type: 'u64' }],
                ['printingMint', 'pubkeyAsString'],
                ['oneTimePrintingAuthorizationMint', 'pubkeyAsString'],
            ],
        },
    ],
    [
        MasterEditionV2,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['supply', 'u64'],
                ['maxSupply', { kind: 'option', type: 'u64' }],
            ],
        },
    ],
    [
        Edition,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['parent', 'pubkeyAsString'],
                ['edition', 'u64'],
            ],
        },
    ],
    [
        Data,
        {
            kind: 'struct',
            fields: [
                ['name', 'string'],
                ['symbol', 'string'],
                ['uri', 'string'],
                ['sellerFeeBasisPoints', 'u16'],
                ['creators', { kind: 'option', type: [Creator] }],
            ],
        },
    ],
    [
        Creator,
        {
            kind: 'struct',
            fields: [
                ['address', 'pubkeyAsString'],
                ['verified', 'u8'],
                ['share', 'u8'],
            ],
        },
    ],
    [
        Metadata,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['updateAuthority', 'pubkeyAsString'],
                ['mint', 'pubkeyAsString'],
                ['data', Data],
                ['primarySaleHappened', 'u8'], // bool
                ['isMutable', 'u8'], // bool
            ],
        },
    ],
    [
        EditionMarker,
        {
            kind: 'struct',
            fields: [
                ['key', 'u8'],
                ['ledger', [31]],
            ],
        },
    ],
]);
