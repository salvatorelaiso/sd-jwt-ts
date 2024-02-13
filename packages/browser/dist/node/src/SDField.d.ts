import { SDMap } from './SDMap.js';
export declare class SDField {
    readonly sd: boolean;
    readonly children: SDMap | null;
    constructor(sd: boolean, children?: SDMap | null);
    toJSON(): string;
    static fromJSON(json: string): SDField;
}
//# sourceMappingURL=SDField.d.ts.map