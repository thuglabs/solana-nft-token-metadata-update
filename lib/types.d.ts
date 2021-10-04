export interface NftAttribute {
    trait_type: string;
    value: string;
}
export interface NftFile {
    type: string;
    uri: string;
}
export interface NftCreator {
    address: string;
    share: number;
}
export interface Nft {
    name: string;
    symbol: string;
    description: string;
    seller_fee_basis_points: number;
    external_url: string;
    attributes: NftAttribute[];
    collection: {
        name: string;
        family: string;
    };
    properties: {
        files: NftFile[];
        category: string;
        maxSupply: number;
        creators: NftCreator[];
    };
    image: string;
}
export interface CacheItem {
    imageUri: string;
    link: string;
    name: string;
    onChain: boolean;
}
export interface CacheItems {
    items: {
        [key: string]: CacheItem;
    };
}
