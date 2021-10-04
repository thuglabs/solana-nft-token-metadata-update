export declare type StringPublicKey = string;
export declare const EDITION = "edition";
export declare const METADATA_PREFIX = "metadata";
export declare const MAX_AUCTION_DATA_EXTENDED_SIZE: number;
export declare const MAX_NAME_LENGTH = 32;
export declare const MAX_SYMBOL_LENGTH = 10;
export declare const MAX_URI_LENGTH = 200;
export declare const MAX_CREATOR_LIMIT = 5;
export declare const EDITION_MARKER_BIT_SIZE = 248;
export declare const MAX_CREATOR_LEN: number;
export declare const MAX_METADATA_LEN: number;
export declare enum MetadataKey {
    Uninitialized = 0,
    MetadataV1 = 4,
    EditionV1 = 1,
    MasterEditionV1 = 2,
    MasterEditionV2 = 6,
    EditionMarker = 7
}
export declare enum MetadataCategory {
    Audio = "audio",
    Video = "video",
    Image = "image",
    VR = "vr"
}
export declare type MetadataFile = {
    uri: string;
    type: string;
};
export declare type FileOrString = MetadataFile | string;
