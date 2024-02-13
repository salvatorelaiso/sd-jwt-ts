import { AsyncJWTCryptoProvider } from './AsyncJWTCryptoProvider.js';
import { JWTCryptoProvider } from './JWTCryptoProvider.js';
import { SDMap } from './SDMap.js';
import { SDPayload } from './SDPayload.js';
import { SDisclosure } from './SDisclosure.js';
import { VerificationResult } from './VerificationResult.js';
import { JSONObject, JSONWebKey, UndisclosedPayload } from './utils/types.js';
export declare class SDJwt extends Object {
    readonly jwt: string;
    protected readonly header: JSONObject;
    protected readonly sdPayload: SDPayload;
    readonly holderJwt?: string | null | undefined;
    protected readonly isPresentation: boolean;
    static readonly DIGESTS_KEY: "_sd";
    static readonly DIGESTS_ALG_KEY: "_sd_alg";
    static readonly SEPARATOR: "~";
    static readonly SD_JWT_PATTERN: "^(?<sdjwt>(?<header>[A-Za-z0-9-_]+).(?<body>[A-Za-z0-9-_]+).(?<signature>[A-Za-z0-9-_]+))(?<disclosures>(~([A-Za-z0-9-_]+))+)?(~(?<holderjwt>([A-Za-z0-9-_]+).([A-Za-z0-9-_]+).([A-Za-z0-9-_]+))?)?$";
    /**
     * Encoded disclosures, included in this SD-JWT.
     */
    readonly disclosures: ReadonlySet<string>;
    readonly disclosureObjects: SDisclosure[];
    readonly undisclosedPayload: UndisclosedPayload;
    readonly fullPayload: JSONObject;
    readonly digestedDisclosures: ReadonlyMap<string, SDisclosure>;
    readonly sdMap: SDMap;
    /**
     * The algorithm used to sign this SD-JWT, e.g. 'ES256K-R', 'EdDSA, included in the header.
     */
    readonly algorithm: string;
    /**
     * The key id of the key used to sign this SD-JWT, included in the header.
     */
    readonly keyId?: string;
    /**
     * the signature key in JWK format, included in the header, if present.
     */
    readonly jwk?: JSONWebKey;
    constructor(jwt: string, header: JSONObject, sdPayload: SDPayload, holderJwt?: string | null | undefined, isPresentation?: boolean);
    toString(): string;
    toFormattedString(formatForPresentation: boolean): string;
    /**
     * Present SD-JWT with selection of disclosures.
     * @param sdMap selective disclosure map, indicating whether to disclose each disclosure in the presentation, per field.
     * @param withHolderJwt optional holder JWT as holder binding to include in the SD-JWT presentation.
     */
    present(sdMap?: SDMap | null, withHolderJwt?: string | null): SDJwt;
    /**
     * Present SD-JWT with either all disclosures or none.
     */
    presentAll(discloseAll: boolean, withHolderJwt?: string | null): SDJwt;
    /**
     * Verify SD-JWT by checking the signature and matching the disclosures against the digests in the payload.
     * @param jwtCryptoProvider synchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    verify(jwtCryptoProvider: JWTCryptoProvider, options?: any): VerificationResult<SDJwt>;
    /**
     * Verify SD-JWT by checking the signature and matching the disclosures against the digests in the payload.
     * @param jwtCryptoProvider asynchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    verifyAsync(jwtCryptoProvider: AsyncJWTCryptoProvider, options?: any): Promise<VerificationResult<SDJwt>>;
    /**
     * Parse SD-JWT from string.
     * @param sdJwt SD-JWT string to parse.
     */
    static parse(sdJwt: string): SDJwt;
    /**
     * Parse SD-JWT from string and verify it.
     * @param sdJwt SD-JWT string to parse and verify.
     * @param jwtCryptoProvider synchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    static parseAndVerify(sdJwt: string, jwtCryptoProvider: JWTCryptoProvider, options?: any): VerificationResult<SDJwt>;
    /**
     * Parse SD-JWT from string and verify it.
     * @param sdJwt SD-JWT string to parse and verify.
     * @param jwtCryptoProvider asynchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    static parseAndVerifyAsync(sdJwt: string, jwtCryptoProvider: AsyncJWTCryptoProvider, options?: any): Promise<VerificationResult<SDJwt>>;
    private static createFromSignedJWT;
    /**
     * Sign given payload as SD-JWT, using given JWT crypto provider, with optional key ID and pass-through options.
     * @param sdPayload payload with selective disclosures to sign.
     * @param jwtCryptoProvider synchronous JWT crypto provider to use for signing, that implements standard JWT signing and verification.
     * @param keyId optional key ID of the signing key to be used, if required by the underlying crypto library.
     * @param withHolderJwt optional holder JWT as holder binding to include in the SD-JWT.
     * @param options optional pass-through options.
     */
    static sign(sdPayload: SDPayload, jwtCryptoProvider: JWTCryptoProvider, keyId?: string | undefined | null, withHolderJwt?: string | undefined | null, typ?: string, options?: any): SDJwt;
    /**
     * Sign given payload as SD-JWT, using given JWT crypto provider, with optional key ID and pass-through options.
     * @param sdPayload payload with selective disclosures to sign.
     * @param jwtCryptoProvider asynchronous JWT crypto provider to use for signing, that implements standard JWT signing and verification.
     * @param keyId optional key ID of the signing key to be used, if required by the underlying crypto library.
     * @param withHolderJwt optional holder JWT as holder binding to include in the SD-JWT.
     * @param options optional pass-through options.
     */
    static signAsync(header: {
        [x: string]: any;
    }, sdPayload: SDPayload, jwtCryptoProvider: AsyncJWTCryptoProvider, keyId?: string | undefined | null, withHolderJwt?: string | undefined | null, options?: any): Promise<SDJwt>;
    /**
     * Check whether given JWT is an SD-JWT.
     * @param value JWT to check.
     */
    static isSDJwt(value: string): boolean;
}
//# sourceMappingURL=SDJwt.d.ts.map