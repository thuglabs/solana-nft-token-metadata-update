import { Metadata } from './metaplex/classes';
export interface MetadataContainerInner {
    metaKey: string;
    mintMetaData?: Metadata;
    name?: string;
    uri?: string;
    imageUri?: Promise<string>;
}
export interface MetadataContainer {
    /** the key is the mint account address for the metadata */
    [key: string]: MetadataContainerInner;
}
