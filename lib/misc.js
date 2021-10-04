"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doUpload = exports.getImageType = exports.saveCache = exports.loadCache = exports.cachePath = exports.sleep = exports.EXTENSION_JSON = exports.EXTENSION_IMAGE = exports.EXTENSION_GIF = exports.EXTENSION_WEBP = exports.EXTENSION_JPG = exports.EXTENSION_JPEG = exports.EXTENSION_PNG = exports.CACHE_PATH = exports.ARWEAVE_PROTOCOL = exports.ARWEAVE_URI = void 0;
const tslib_1 = require("tslib");
const fs_1 = (0, tslib_1.__importDefault)(require("fs"));
const path_1 = (0, tslib_1.__importDefault)(require("path"));
exports.ARWEAVE_URI = 'arweave.net';
exports.ARWEAVE_PROTOCOL = 'https';
exports.CACHE_PATH = './.cache';
const ENV = 'devnet';
const CACHE_NAME = 'temp';
exports.EXTENSION_PNG = '.png';
exports.EXTENSION_JPEG = '.jpeg';
exports.EXTENSION_JPG = '.jpg';
exports.EXTENSION_WEBP = '.webp';
exports.EXTENSION_GIF = '.gif';
exports.EXTENSION_IMAGE = [exports.EXTENSION_PNG, exports.EXTENSION_JPEG, exports.EXTENSION_JPG, exports.EXTENSION_GIF, exports.EXTENSION_WEBP];
exports.EXTENSION_JSON = '.json';
const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.sleep = sleep;
function cachePath(env = ENV, cacheName = CACHE_NAME) {
    if (!fs_1.default.existsSync(exports.CACHE_PATH)) {
        fs_1.default.mkdirSync(exports.CACHE_PATH);
    }
    return path_1.default.join(exports.CACHE_PATH, `${env}-${cacheName}.json`);
}
exports.cachePath = cachePath;
function loadCache(cacheName, env) {
    const path = cachePath(env, cacheName);
    const defaultJson = { items: {} };
    try {
        return fs_1.default.existsSync(path) ? JSON.parse(fs_1.default.readFileSync(path).toString()) : { items: {} };
    }
    catch {
        return defaultJson;
    }
}
exports.loadCache = loadCache;
function saveCache(cacheName, env, cacheContent) {
    fs_1.default.writeFileSync(cachePath(env, cacheName), JSON.stringify(cacheContent));
}
exports.saveCache = saveCache;
const getImageType = (filename) => {
    if (filename.endsWith(exports.EXTENSION_PNG)) {
        return 'image/png';
    }
    else if (filename.endsWith(exports.EXTENSION_JPEG) || filename.endsWith(exports.EXTENSION_JPG)) {
        return 'image/jpeg';
    }
    else if (filename.endsWith(exports.EXTENSION_GIF)) {
        return 'image/gif';
    }
    else if (filename.endsWith(exports.EXTENSION_WEBP)) {
        return 'image/webp';
    }
    else {
        throw new Error('Image type not supported');
    }
};
exports.getImageType = getImageType;
const doUpload = async (arweave, data, fileType, jwk, isUploadByChunk = false) => {
    const tx = await arweave.createTransaction({ data: data }, jwk);
    tx.addTag('Content-Type', fileType);
    await arweave.transactions.sign(tx, jwk);
    if (isUploadByChunk) {
        const uploader = await arweave.transactions.getUploader(tx);
        while (!uploader.isComplete) {
            await uploader.uploadChunk();
            console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
        }
    }
    await arweave.transactions.post(tx);
    return tx;
};
exports.doUpload = doUpload;
//# sourceMappingURL=misc.js.map