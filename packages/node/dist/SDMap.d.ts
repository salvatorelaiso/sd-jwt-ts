import { DecoyMode } from './DecoyMode.js';
import { SDField } from './SDField.js';
import { SDisclosure } from './SDisclosure.js';
import { JSONObject, UndisclosedPayload } from './utils/types.js';
export declare class SDMap extends Map<string, SDField> {
    readonly fields: ReadonlyMap<string, SDField>;
    readonly decoyMode: DecoyMode;
    readonly decoys: number;
    private readonly _size;
    get size(): number;
    constructor(fields: ReadonlyMap<string, SDField>, decoyMode?: DecoyMode, decoys?: number);
    prettyPrint(): string;
    toJSON(): {
        readonly fields: {
            [k: string]: SDField;
        } | null;
        readonly decoyMode: string;
        readonly decoys: number;
    };
    /**
     * Generate SDMap by comparing the fully disclosed payload with the undisclosed payload.
     */
    static generateSDMap(fullPayload: JSONObject, undisclosedPayload: JSONObject, decoyMode?: DecoyMode, decoys?: number): SDMap;
    /**
     * Generate SDMap based on set of simplified JSON paths.
     */
    static generateSDMapFromJSONPaths(jsonPaths: string[], decoyMode?: DecoyMode, decoys?: number): SDMap;
    private static doGenerateSDMap;
    private static regenerateSDField;
    /**
     * Regenerate SDMap recursively, from undisclosed payload and digested disclosures map.
     * Used for parsing SD-JWTs.
     */
    static regenerateSDMap(undisclosedPayload: UndisclosedPayload, digestedDisclosures: ReadonlyMap<string, SDisclosure>): SDMap;
    static fromJSON(json: JSONObject): SDMap;
    static fromJSONString(json: string): SDMap;
}
//# sourceMappingURL=SDMap.d.ts.map