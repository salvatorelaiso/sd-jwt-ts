import { DecoyMode, fromJSON as DecoyModefromJSON } from './DecoyMode.js';
import { SDField } from './SDField.js';
import { SDJwt } from './SDJwt.js';
import { isJSONObject } from './utils/eval.js';
export class SDMap extends Map {
    fields;
    decoyMode;
    decoys;
    _size;
    get size() {
        return this._size;
    }
    constructor(fields, decoyMode = DecoyMode.NONE, decoys = 0) {
        super();
        this.fields = fields;
        this.decoyMode = decoyMode;
        this.decoys = decoys;
        this._size = fields.size;
        this.entries = fields.entries.bind(fields);
        this.keys = fields.keys.bind(fields);
        this.values = fields.values.bind(fields);
        this.get = fields.get.bind(fields);
        this.has = fields.has.bind(fields);
        this[Symbol.iterator] = fields[Symbol.iterator].bind(fields);
        this.set = function (key, value) {
            throw new Error('SDMap is immutable');
        };
        this.delete = function (key) {
            throw new Error('SDMap is immutable');
        };
        this.clear = function () {
            throw new Error('SDMap is immutable');
        };
    }
    prettyPrint() {
        return JSON.stringify(this, null, 2);
    }
    toJSON() {
        return {
            fields: this.fields.size ? Object.fromEntries(this.fields) : null,
            decoyMode: this.decoyMode.valueOf(),
            decoys: this.decoys,
        };
    }
    /**
     * Generate SDMap by comparing the fully disclosed payload with the undisclosed payload.
     */
    static generateSDMap(fullPayload, undisclosedPayload, decoyMode = DecoyMode.NONE, decoys = 0) {
        const fields = new Map();
        for (const [key, value] of Object.entries(fullPayload)) {
            const sd = typeof undisclosedPayload?.[key] === 'undefined' || !(key in undisclosedPayload);
            fields.set(key, new SDField(sd, value && isJSONObject(value) && undisclosedPayload[key] && isJSONObject(undisclosedPayload[key])
                ? SDMap.generateSDMap(value, undisclosedPayload[key], decoyMode, decoys)
                : null));
        }
        return new SDMap(fields, decoyMode, decoys);
    }
    /**
     * Generate SDMap based on set of simplified JSON paths.
     */
    static generateSDMapFromJSONPaths(jsonPaths, decoyMode = DecoyMode.NONE, decoys = 0) {
        return SDMap.doGenerateSDMap(jsonPaths, decoyMode, decoys, new Set(jsonPaths), '');
    }
    static doGenerateSDMap(jsonPaths, decoyMode = DecoyMode.NONE, decoys, sdPaths, parent) {
        const pathMap = jsonPaths
            .map((path) => {
            const [first, ...rest] = path.split('.');
            if (!first)
                throw new Error('Invalid JSON path');
            if (rest.length === 0)
                return { first, second: '' };
            return { first, second: rest.join('.') };
        })
            .reduce((acc, { first, second }) => {
            if (!acc.has(first))
                acc.set(first, []);
            if (second)
                acc.set(first, [...acc.get(first), second]);
            return acc;
        }, new Map());
        const fields = Array.from(pathMap.entries()).reduce((acc, [key, value]) => {
            const currentPath = [parent, key].filter(Boolean).join('.');
            acc.set(key, new SDField(sdPaths.has(currentPath), value.length ? SDMap.doGenerateSDMap(value, decoyMode, decoys, sdPaths, currentPath) : null));
            return acc;
        }, new Map());
        return new SDMap(fields, decoyMode, decoys);
    }
    static regenerateSDField(sd, value, digestedDisclosure) {
        return new SDField(sd, value && isJSONObject(value) ? SDMap.regenerateSDMap(value, digestedDisclosure) : null);
    }
    /**
     * Regenerate SDMap recursively, from undisclosed payload and digested disclosures map.
     * Used for parsing SD-JWTs.
     */
    static regenerateSDMap(undisclosedPayload, digestedDisclosures) {
        return new SDMap(new Map((undisclosedPayload[SDJwt.DIGESTS_KEY]
            ?.filter((sdEntry) => Array.from(digestedDisclosures.values()).find((sd) => sd.key === sdEntry))
            ?.map((sdEntry) => Array.from(digestedDisclosures.values()).find((sd) => sd.key === sdEntry))
            ?.map((sd) => [sd.key, SDMap.regenerateSDField(true, sd.value, digestedDisclosures)]) || []).concat(Object.entries(undisclosedPayload)
            .filter(([key]) => key !== SDJwt.DIGESTS_KEY)
            .map(([key, value]) => [key, SDMap.regenerateSDField(false, value, digestedDisclosures)]))), DecoyMode.FIXED, // parse will always be called with a decoyMode of FIXED, as number of decoys is known
        undisclosedPayload[SDJwt.DIGESTS_KEY]?.filter((sdEntry) => !Array.from(digestedDisclosures.values()).find((sd) => sd.key === sdEntry))?.length || 0);
    }
    static fromJSON(json) {
        return new SDMap(new Map(Object.entries(json?.['fields'] ?? new Map()).map(([key, value]) => [
            key,
            SDField.fromJSON(value),
        ])), json?.['decoyMode'] ? DecoyModefromJSON(json['decoyMode']) : DecoyMode.NONE, typeof json?.['decoys'] === 'number' ? json['decoys'] : 0);
    }
    static fromJSONString(json) {
        return SDMap.fromJSON(JSON.parse(json));
    }
}
//# sourceMappingURL=SDMap.js.map