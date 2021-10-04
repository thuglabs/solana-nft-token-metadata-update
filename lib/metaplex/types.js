"use strict";
/* NOTE: these are all types pulled from the metaplex repo under
         the js commons folder:
         https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/common
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataCategory = exports.MetadataKey = exports.MAX_METADATA_LEN = exports.MAX_CREATOR_LEN = exports.EDITION_MARKER_BIT_SIZE = exports.MAX_CREATOR_LIMIT = exports.MAX_URI_LENGTH = exports.MAX_SYMBOL_LENGTH = exports.MAX_NAME_LENGTH = exports.MAX_AUCTION_DATA_EXTENDED_SIZE = exports.METADATA_PREFIX = exports.EDITION = void 0;
exports.EDITION = 'edition';
exports.METADATA_PREFIX = 'metadata';
exports.MAX_AUCTION_DATA_EXTENDED_SIZE = 8 + 9 + 2 + 200;
exports.MAX_NAME_LENGTH = 32;
exports.MAX_SYMBOL_LENGTH = 10;
exports.MAX_URI_LENGTH = 200;
exports.MAX_CREATOR_LIMIT = 5;
exports.EDITION_MARKER_BIT_SIZE = 248;
exports.MAX_CREATOR_LEN = 32 + 1 + 1;
exports.MAX_METADATA_LEN = 1 +
    32 +
    32 +
    exports.MAX_NAME_LENGTH +
    exports.MAX_SYMBOL_LENGTH +
    exports.MAX_URI_LENGTH +
    exports.MAX_CREATOR_LIMIT * exports.MAX_CREATOR_LEN +
    2 +
    1 +
    1 +
    198;
var MetadataKey;
(function (MetadataKey) {
    MetadataKey[MetadataKey["Uninitialized"] = 0] = "Uninitialized";
    MetadataKey[MetadataKey["MetadataV1"] = 4] = "MetadataV1";
    MetadataKey[MetadataKey["EditionV1"] = 1] = "EditionV1";
    MetadataKey[MetadataKey["MasterEditionV1"] = 2] = "MasterEditionV1";
    MetadataKey[MetadataKey["MasterEditionV2"] = 6] = "MasterEditionV2";
    MetadataKey[MetadataKey["EditionMarker"] = 7] = "EditionMarker";
})(MetadataKey = exports.MetadataKey || (exports.MetadataKey = {}));
var MetadataCategory;
(function (MetadataCategory) {
    MetadataCategory["Audio"] = "audio";
    MetadataCategory["Video"] = "video";
    MetadataCategory["Image"] = "image";
    MetadataCategory["VR"] = "vr";
})(MetadataCategory = exports.MetadataCategory || (exports.MetadataCategory = {}));
//# sourceMappingURL=types.js.map