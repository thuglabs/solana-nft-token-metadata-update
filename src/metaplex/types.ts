/* NOTE: these are all types pulled from the metaplex repo under
         the js commons folder:
         https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/common
*/

export type StringPublicKey = string;

export const EDITION = 'edition';
export const METADATA_PREFIX = 'metadata';

export const MAX_AUCTION_DATA_EXTENDED_SIZE = 8 + 9 + 2 + 200;

export const MAX_NAME_LENGTH = 32;
export const MAX_SYMBOL_LENGTH = 10;
export const MAX_URI_LENGTH = 200;
export const MAX_CREATOR_LIMIT = 5;
export const EDITION_MARKER_BIT_SIZE = 248;
export const MAX_CREATOR_LEN = 32 + 1 + 1;
export const MAX_METADATA_LEN =
    1 +
    32 +
    32 +
    MAX_NAME_LENGTH +
    MAX_SYMBOL_LENGTH +
    MAX_URI_LENGTH +
    MAX_CREATOR_LIMIT * MAX_CREATOR_LEN +
    2 +
    1 +
    1 +
    198;

export enum MetadataKey {
    Uninitialized = 0,
    MetadataV1 = 4,
    EditionV1 = 1,
    MasterEditionV1 = 2,
    MasterEditionV2 = 6,
    EditionMarker = 7,
}

export enum MetadataCategory {
    Audio = 'audio',
    Video = 'video',
    Image = 'image',
    VR = 'vr',
}

export type MetadataFile = {
    uri: string;
    type: string;
};

export type FileOrString = MetadataFile | string;
