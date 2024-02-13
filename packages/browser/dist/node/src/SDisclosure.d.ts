import { JSONValue } from './utils/types.js';
export declare class SDisclosure {
    readonly disclosure: string;
    readonly salt: string;
    readonly key: string;
    readonly value: JSONValue;
    constructor(disclosure: string, salt: string, key: string, value: JSONValue);
    static parse(disclosure: string): SDisclosure;
}
//# sourceMappingURL=SDisclosure.d.ts.map