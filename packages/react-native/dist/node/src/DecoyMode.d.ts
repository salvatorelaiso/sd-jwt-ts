import { JSONValue } from './utils/types.js';
/**
 * Mode for adding decoy digests on SD-JWT issuance.
 * NONE: no decoy digests are added
 * FIXED: a fixed number of decoy digests are added
 * RANDOM: a random number of decoy digests are added
 */
export declare enum DecoyMode {
    NONE = "NONE",// literal string value + ordinal value (0)
    FIXED = "FIXED",// literal string value + ordinal value (1)
    RANDOM = "RANDOM"
}
export declare const fromJSON: (json: JSONValue) => DecoyMode;
//# sourceMappingURL=DecoyMode.d.ts.map