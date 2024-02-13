import { fromString, toString } from 'uint8arrays';
export class SDisclosure {
    disclosure;
    salt;
    key;
    value;
    constructor(disclosure, salt, key, value) {
        this.disclosure = disclosure;
        this.salt = salt;
        this.key = key;
        this.value = value;
    }
    static parse(disclosure) {
        const [salt, key, value] = JSON.parse(toString(fromString(disclosure, 'base64url'), 'utf-8'));
        if (typeof salt !== 'string' ||
            typeof key !== 'string' ||
            (typeof value !== 'object' &&
                typeof value !== 'string' &&
                typeof value !== 'number' &&
                typeof value !== 'boolean')) {
            throw new Error('Invalid selective disclosure');
        }
        return new SDisclosure(disclosure, salt, key, value);
    }
}
//# sourceMappingURL=SDisclosure.js.map