export function isJSONObject(obj) {
    return obj && typeof obj === 'object' && !Array.isArray(obj);
}
export function isSDDigestsValue(value) {
    return Array.isArray(value) && value.every((v) => typeof v === 'string');
}
//# sourceMappingURL=eval.js.map