import { isJSONObject } from './utils/eval.js';
/**
 * Mode for adding decoy digests on SD-JWT issuance.
 * NONE: no decoy digests are added
 * FIXED: a fixed number of decoy digests are added
 * RANDOM: a random number of decoy digests are added
 */
export var DecoyMode;
(function (DecoyMode) {
    DecoyMode["NONE"] = "NONE";
    DecoyMode["FIXED"] = "FIXED";
    DecoyMode["RANDOM"] = "RANDOM";
})(DecoyMode || (DecoyMode = {}));
export const fromJSON = (json) => {
    if (isJSONObject(json)) {
        return typeof json?.['name']?.valueOf() === 'string'
            ? json['name']
            : (function () {
                throw new Error('Invalid decoy mode');
            })();
    }
    switch (json) {
        case DecoyMode.NONE:
        case DecoyMode.FIXED:
        case DecoyMode.RANDOM:
            return json;
        default:
            throw new Error('Invalid decoy mode');
    }
};
//# sourceMappingURL=DecoyMode.js.map