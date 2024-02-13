import { SDMap } from './SDMap.js';
import { SDisclosure } from './SDisclosure.js';
import { JSONObject, UndisclosedPayload } from './utils/types.js';
import { DecoyMode } from './DecoyMode.js';
export declare class SDPayload {
    readonly undisclosedPayload: UndisclosedPayload;
    readonly digestedDisclosures: ReadonlyMap<string, SDisclosure>;
    /**
     * Flat list of parsed disclosures, appended to the JWT token.
     */
    readonly sDisclosures: SDisclosure[];
    /**
     * Full payload, with all (selected) disclosures resolved recursively.
     */
    readonly fullPayload: JSONObject;
    /**
     * SDMap regenerated from undisclosed payload and disclosures.
     */
    readonly sdMap: SDMap;
    /**
     * Create SD payload object, based on undisclosed payload and digested disclosures.
     * @param undisclosedPayload undisclosed payload JSON object, as contained in the JWT body.
     * @param digestedDisclosures digested disclosures, as appended to the JWT.
     */
    private constructor();
    private disclosePayloadRecursively;
    private unveilDisclosureIfPresent;
    private filterDisclosures;
    /**
     * Payload with selectively disclosed fields and undisclosed fields filtered out.
     * @param sdMap Map of selectively disclosable fields.
     */
    withSelectiveDisclosures(sdMap: SDMap): SDPayload;
    /**
     * Payload with all selectively disclosable fields filtered out (all fields undisclosed).
     */
    withoutSelectiveDisclosures(): SDPayload;
    /**
     * Verify digests in JWT payload match with disclosures appended to JWT.
     */
    verifyDisclosures(): boolean;
    private static digest;
    private static generateSalt;
    private static generateDisclosure;
    private static digestSDClaim;
    private static removeSDFields;
    private static generateSDPayload;
    /**
     * Create SD payload object, based on full payload and disclosure map.
     * @param fullPayload full payload JSON object, with all fields contained.
     * @param disclosureMap disclosure map, containing selectively disclosable fields, per payload field recursively, decoy mode and number of decoys for issuance.
     */
    static createSDPayload(fullPayload: JSONObject, disclosureMap: SDMap): SDPayload;
    /**
     * Create SD payload object, based on full payload and undisclosed payload.
     * @param fullPayload full payload JSON object, with all fields contained.
     * @param undisclosedPayload undisclosed payload JSON object, with selectively disclosable fields omitted.
     * @param decoyMode decoy mode for issuance, if applicable, generate decoys for this hierarchical level randomly or fixed, set to NONE to disable decoys or for parsed SD-JWTs. Unused for presentation.
     * @param decoys number of decoys for issuance, if applicable, number for fixed mode, maximum number for random mode, for decoy digests to add for this hierarchical level, set to 0 to disable decoys or for parsed SD-JWTs. Unused for presentation.
     */
    static createSDPayloadFromFullAndUndisclosedPayload(fullPayload: JSONObject, undisclosedPayload: JSONObject, decoyMode?: DecoyMode, decoys?: number): SDPayload;
    /**
     * Parse SD payload from JWT body and disclosure strings appended to JWT.
     * @param jwtBody undisclosed JWT body payload.
     * @param disclosures disclosure strings appended to JWT.
     */
    static parse(jwtBody: string, disclosures: Set<string>): SDPayload;
}
//# sourceMappingURL=SDPayload.d.ts.map