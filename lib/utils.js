"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageUrl = exports.getMultipleAccounts = exports.chunks = exports.loadData = void 0;
const tslib_1 = require("tslib");
const fs_1 = (0, tslib_1.__importDefault)(require("fs"));
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const node_fetch_1 = (0, tslib_1.__importDefault)(require("node-fetch"));
const loadData = (file = '../src/data/3d-soldiers.json') => {
    const defaultJson = [];
    const thePath = path_1.default.resolve(__dirname, file);
    try {
        return fs_1.default.existsSync(thePath) ? JSON.parse(fs_1.default.readFileSync(thePath).toString()) : defaultJson;
    }
    catch {
        return defaultJson;
    }
};
exports.loadData = loadData;
function chunks(array, size) {
    return Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) => array.slice(index * size, (index + 1) * size));
}
exports.chunks = chunks;
const getMultipleAccounts = async (connection, keys, commitment) => {
    const result = await Promise.all(chunks(keys, 99).map((chunk) => getMultipleAccountsCore(connection, chunk, commitment)));
    const array = result
        .map((a) => a.array
        .map((acc) => {
        if (!acc) {
            return undefined;
        }
        const { data, ...rest } = acc;
        const obj = {
            ...rest,
            data: Buffer.from(data[0], 'base64'),
        };
        return obj;
    })
        .filter((_) => _))
        .flat();
    return { keys, array };
};
exports.getMultipleAccounts = getMultipleAccounts;
const getMultipleAccountsCore = async (connection, keys, commitment) => {
    const args = connection._buildArgs([keys], commitment, 'base64');
    const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
    if (unsafeRes.error) {
        throw new Error('failed to get info about account ' + unsafeRes.error.message);
    }
    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value;
        return { keys, array };
    }
    // TODO: fix
    throw new Error();
};
const getImageUrl = async (meta) => {
    return await (0, node_fetch_1.default)(meta.data.uri).then((result) => {
        return result.json().then((json) => {
            return json.image;
        });
    });
};
exports.getImageUrl = getImageUrl;
//# sourceMappingURL=utils.js.map