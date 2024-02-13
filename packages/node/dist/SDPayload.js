import { fromString, toString } from 'uint8arrays';
import { SDJwt } from './SDJwt.js';
import { SDMap } from './SDMap.js';
import { SDisclosure } from './SDisclosure.js';
import { createHash, getRandomValues } from 'crypto';
import { DecoyMode } from './DecoyMode.js';
import { isJSONObject, isSDDigestsValue } from './utils/eval.js';
export class SDPayload {
    undisclosedPayload;
    digestedDisclosures;
    /**
     * Flat list of parsed disclosures, appended to the JWT token.
     */
    sDisclosures;
    /**
     * Full payload, with all (selected) disclosures resolved recursively.
     */
    fullPayload;
    /**
     * SDMap regenerated from undisclosed payload and disclosures.
     */
    sdMap;
    /**
     * Create SD payload object, based on undisclosed payload and digested disclosures.
     * @param undisclosedPayload undisclosed payload JSON object, as contained in the JWT body.
     * @param digestedDisclosures digested disclosures, as appended to the JWT.
     */
    constructor(undisclosedPayload, digestedDisclosures = new Map()) {
        this.undisclosedPayload = undisclosedPayload;
        this.digestedDisclosures = digestedDisclosures;
        this.sDisclosures = Array.from(digestedDisclosures.values());
        this.fullPayload = this.disclosePayloadRecursively(undisclosedPayload, null)[0];
        this.sdMap = SDMap.regenerateSDMap(undisclosedPayload, digestedDisclosures);
    }
    disclosePayloadRecursively(payload, verificationDisclosureMap) {
        const disclosedPayload = {};
        for (const [key, value] of Object.entries(payload)) {
            if (key === SDJwt.DIGESTS_KEY) {
                if (!isSDDigestsValue(value))
                    throw new Error(`SD-JWT contains invalid ${SDJwt.DIGESTS_KEY} field`);
                for (const digest of value) {
                    const [unveiledDisclosure, mutatedVerificationDisclosureMap] = this.unveilDisclosureIfPresent(digest, verificationDisclosureMap) || [undefined, verificationDisclosureMap];
                    verificationDisclosureMap = mutatedVerificationDisclosureMap;
                    unveiledDisclosure && (disclosedPayload[unveiledDisclosure[0]] = unveiledDisclosure[1]);
                }
            }
            disclosedPayload[key] =
                value && isJSONObject(value)
                    ? (function (that) {
                        const [disclosedValue, mutatedVerificationDisclosureMap] = that.disclosePayloadRecursively(value, verificationDisclosureMap);
                        verificationDisclosureMap = mutatedVerificationDisclosureMap;
                        return disclosedValue;
                    })(this)
                    : value;
        }
        delete disclosedPayload[SDJwt.DIGESTS_KEY];
        delete disclosedPayload[SDJwt.DIGESTS_ALG_KEY];
        return [disclosedPayload, verificationDisclosureMap];
    }
    unveilDisclosureIfPresent(digest, verificationDisclosureMap) {
        const sDisclosure = verificationDisclosureMap?.has(digest)
            ? verificationDisclosureMap.get(digest)
            : this.digestedDisclosures.get(digest) ||
                Array.from(this.digestedDisclosures.values()).find((sd) => sd.key === digest);
        if (!sDisclosure)
            return undefined;
        verificationDisclosureMap?.delete(digest) ||
            verificationDisclosureMap?.delete(SDPayload.digest(Array.from(this.digestedDisclosures.values()).find((sd) => sd.key === digest)?.disclosure));
        return sDisclosure.value && isJSONObject(sDisclosure.value)
            ? (function (that) {
                const [disclosedValue, mutatedVerificationDisclosureMap] = that.disclosePayloadRecursively(sDisclosure.value, verificationDisclosureMap);
                verificationDisclosureMap = mutatedVerificationDisclosureMap;
                return [[sDisclosure.key, disclosedValue], verificationDisclosureMap];
            })(this)
            : [[sDisclosure.key, sDisclosure.value], verificationDisclosureMap];
    }
    filterDisclosures(currPayloadObject, sdMap) {
        if (currPayloadObject[SDJwt.DIGESTS_KEY] && !isSDDigestsValue(currPayloadObject[SDJwt.DIGESTS_KEY]))
            throw new Error(`Invalid ${SDJwt.DIGESTS_KEY} format found`);
        return new Set(Object.entries(currPayloadObject)
            .filter(([key, value]) => value &&
            isJSONObject(value) &&
            sdMap.has(key) &&
            sdMap.get(key).children &&
            sdMap.get(key).children.size > 0)
            .flatMap(([key, value]) => {
            const childSDMap = sdMap.get(key).children;
            return Array.from(this.filterDisclosures(value, childSDMap).entries()).flat();
        })
            .concat(currPayloadObject[SDJwt.DIGESTS_KEY]
            ?.filter((digest) => this.digestedDisclosures.has(digest) ||
            Array.from(this.digestedDisclosures.values()).find((sd) => sd.key === digest))
            ?.map((digest) => this.digestedDisclosures.get(digest) ||
            Array.from(this.digestedDisclosures.values()).find((sd) => sd.key === digest))
            ?.filter((sd) => sdMap.get(sd.key)?.sd)
            ?.flatMap((sd) => [sd.disclosure].concat(sd.value &&
            isJSONObject(sd.value) &&
            sdMap.get(sd.key).children &&
            sdMap.get(sd.key).children.size > 0
            ? Array.from(this.filterDisclosures(sd.value, sdMap.get(sd.key).children).entries()).flat()
            : [])) || []));
    }
    /**
     * Payload with selectively disclosed fields and undisclosed fields filtered out.
     * @param sdMap Map of selectively disclosable fields.
     */
    withSelectiveDisclosures(sdMap) {
        const selectedDisclosures = this.filterDisclosures(this.undisclosedPayload, sdMap);
        return new SDPayload(this.undisclosedPayload, Array.from(this.digestedDisclosures.entries())
            .filter(([, sd]) => selectedDisclosures.has(sd.disclosure))
            .reduce((map, [digest, sd]) => map.set(digest, sd), new Map()));
    }
    /**
     * Payload with all selectively disclosable fields filtered out (all fields undisclosed).
     */
    withoutSelectiveDisclosures() {
        return new SDPayload(this.undisclosedPayload, new Map());
    }
    /**
     * Verify digests in JWT payload match with disclosures appended to JWT.
     */
    verifyDisclosures() {
        const [, mutableDigestedDisclosures] = this.disclosePayloadRecursively(this.undisclosedPayload, new Map(this.digestedDisclosures.entries()));
        return mutableDigestedDisclosures?.size === 0;
    }
    static digest(value) {
        return createHash('sha256').update(value).digest('base64url');
    }
    static generateSalt() {
        return toString(getRandomValues(new Uint8Array(16)), 'base64url');
    }
    static generateDisclosure(key, value) {
        const salt = SDPayload.generateSalt();
        const disclosure = toString(fromString(JSON.stringify([salt, key, value]), 'utf-8'), 'base64url');
        return new SDisclosure(disclosure, salt, key, value);
    }
    static digestSDClaim(key, value, digestsToDisclosures) {
        const disclosure = SDPayload.generateDisclosure(key, value);
        const digest = SDPayload.digest(disclosure.disclosure);
        return [SDPayload.digest(disclosure.disclosure), digestsToDisclosures.set(digest, disclosure)];
    }
    static removeSDFields(payload, sdMap) {
        return Object.fromEntries(Object.entries(payload)
            .filter(([key]) => !sdMap.has(key) || !sdMap.get(key).sd)
            .map(([key, value]) => [
            key,
            value &&
                isJSONObject(value) &&
                sdMap.has(key) &&
                sdMap.get(key).children &&
                sdMap.get(key).children.size > 0
                ? SDPayload.removeSDFields(value, sdMap.get(key).children || new SDMap(new Map()))
                : value,
        ]));
    }
    static generateSDPayload(payload, sdMap, digestsToDisclosures) {
        const sdPayload = SDPayload.removeSDFields(payload, sdMap);
        const digests = new Set(Object.keys(Object.fromEntries(Object.entries(payload)
            // iterate over all fields that are selectively disclosable and / or have nested selectively disclosable fields
            .filter(([key]) => (sdMap.has(key) && sdMap.get(key).sd) ||
            (sdMap.get(key)?.children && (sdMap.get(key)?.children?.size || 0) > 0))
            .map(([key, value]) => {
            // if field is not an object, digest it, otherwise recursively generate digests, disclosures, if applicable
            return (value && !isJSONObject(value)) ||
                !sdMap.get(key)?.children ||
                sdMap.get(key).children.size === 0
                ? (function () {
                    const [digest, digestedDisclosures] = SDPayload.digestSDClaim(key, value, digestsToDisclosures);
                    digestsToDisclosures = digestedDisclosures;
                    return [key, digest];
                })()
                : (function () {
                    // nested properties could be selectively disclosable, so recursively generate digests, disclosures, if applicable
                    const [nestedSDPayload, digestedDisclosures] = SDPayload.generateSDPayload(value, sdMap.get(key).children, digestsToDisclosures);
                    digestsToDisclosures = digestedDisclosures;
                    // compute digest of nested selectively disclosable fields, if applicable
                    return sdMap.has(key) && sdMap.get(key).sd
                        ? (function () {
                            const [digest, digestedDisclosures] = SDPayload.digestSDClaim(key, nestedSDPayload, digestsToDisclosures);
                            digestsToDisclosures = digestedDisclosures;
                            return [key, digest];
                        })()
                        : (function () {
                            // object is not selectively disclosable, so assign nested selectively disclosable fields as is
                            sdPayload[key] = nestedSDPayload;
                            return [key, null];
                        })();
                })();
        })
            .filter(([, digest]) => digest !== null))));
        // otherwise, append digests to payload
        sdPayload[SDJwt.DIGESTS_KEY] = Array.from(digests)
            .concat(sdMap.decoyMode !== DecoyMode.NONE && sdMap.decoys > 0
            ? (function () {
                const numDecoys = (function () {
                    switch (sdMap.decoyMode) {
                        case DecoyMode.RANDOM:
                            return Math.floor(Math.random() * sdMap.decoys) + 1;
                        case DecoyMode.FIXED:
                            return sdMap.decoys;
                        default:
                            return 0;
                    }
                })();
                const withDecoys = Array(numDecoys)
                    .fill('')
                    .map(() => SDPayload.digest(SDPayload.generateSalt()));
                return withDecoys;
            })()
            : [])
            .sort(() => Math.random() - 0.5);
        // define digests alg
        sdPayload[SDJwt.DIGESTS_ALG_KEY] = 'sha-256';
        return [sdPayload, digestsToDisclosures];
    }
    /**
     * Create SD payload object, based on full payload and disclosure map.
     * @param fullPayload full payload JSON object, with all fields contained.
     * @param disclosureMap disclosure map, containing selectively disclosable fields, per payload field recursively, decoy mode and number of decoys for issuance.
     */
    static createSDPayload(fullPayload, disclosureMap) {
        const [undisclosedPayload, digestedDisclosures] = this.generateSDPayload(fullPayload, disclosureMap, new Map());
        return new SDPayload(undisclosedPayload, digestedDisclosures);
    }
    /**
     * Create SD payload object, based on full payload and undisclosed payload.
     * @param fullPayload full payload JSON object, with all fields contained.
     * @param undisclosedPayload undisclosed payload JSON object, with selectively disclosable fields omitted.
     * @param decoyMode decoy mode for issuance, if applicable, generate decoys for this hierarchical level randomly or fixed, set to NONE to disable decoys or for parsed SD-JWTs. Unused for presentation.
     * @param decoys number of decoys for issuance, if applicable, number for fixed mode, maximum number for random mode, for decoy digests to add for this hierarchical level, set to 0 to disable decoys or for parsed SD-JWTs. Unused for presentation.
     */
    static createSDPayloadFromFullAndUndisclosedPayload(fullPayload, undisclosedPayload, decoyMode = DecoyMode.NONE, decoys = 0) {
        return this.createSDPayload(fullPayload, SDMap.generateSDMap(fullPayload, undisclosedPayload, decoyMode, decoys));
    }
    /**
     * Parse SD payload from JWT body and disclosure strings appended to JWT.
     * @param jwtBody undisclosed JWT body payload.
     * @param disclosures disclosure strings appended to JWT.
     */
    static parse(jwtBody, disclosures) {
        return new SDPayload(JSON.parse(toString(fromString(jwtBody, 'base64url'), 'utf-8')), Array.from(disclosures)
            .map((disclosure) => {
            return SDisclosure.parse(disclosure);
        })
            .reduce((map, sd) => map.set(SDPayload.digest(sd.disclosure), sd), new Map()));
    }
}
//# sourceMappingURL=SDPayload.js.map