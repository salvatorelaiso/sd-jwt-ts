import { fromString, toString } from 'uint8arrays';
import { SDPayload } from './SDPayload.js';
import { defaultVerificationResult } from './VerificationResult.js';
export class SDJwt extends Object {
    jwt;
    header;
    sdPayload;
    holderJwt;
    isPresentation;
    static DIGESTS_KEY = '_sd';
    static DIGESTS_ALG_KEY = '_sd_alg';
    static SEPARATOR = '~';
    static SD_JWT_PATTERN = '^(?<sdjwt>(?<header>[A-Za-z0-9-_]+).(?<body>[A-Za-z0-9-_]+).(?<signature>[A-Za-z0-9-_]+))(?<disclosures>(~([A-Za-z0-9-_]+))+)?(~(?<holderjwt>([A-Za-z0-9-_]+).([A-Za-z0-9-_]+).([A-Za-z0-9-_]+))?)?$';
    /**
     * Encoded disclosures, included in this SD-JWT.
     */
    disclosures;
    disclosureObjects;
    undisclosedPayload;
    fullPayload;
    digestedDisclosures;
    sdMap;
    /**
     * The algorithm used to sign this SD-JWT, e.g. 'ES256K-R', 'EdDSA, included in the header.
     */
    algorithm;
    /**
     * The key id of the key used to sign this SD-JWT, included in the header.
     */
    keyId;
    /**
     * the signature key in JWK format, included in the header, if present.
     */
    jwk;
    constructor(jwt, header, sdPayload, holderJwt, isPresentation = false) {
        super();
        this.jwt = jwt;
        this.header = header;
        this.sdPayload = sdPayload;
        this.holderJwt = holderJwt;
        this.isPresentation = isPresentation;
        this.disclosures = new Set(sdPayload.sDisclosures.map((sd) => sd.disclosure));
        this.disclosureObjects = sdPayload.sDisclosures;
        this.undisclosedPayload = sdPayload.undisclosedPayload;
        this.fullPayload = sdPayload.fullPayload;
        this.digestedDisclosures = sdPayload.digestedDisclosures;
        this.sdMap = sdPayload.sdMap;
        this.algorithm = header.alg
            ? header.alg
            : (function () {
                throw new Error('Invalid SD-JWT');
            })();
        this.keyId = header.kid ? header.kid : undefined;
        this.jwk = header.jwk ? header.jwk : undefined;
    }
    toString() {
        return this.toFormattedString(this.isPresentation);
    }
    toFormattedString(formatForPresentation) {
        return [this.jwt]
            .concat(this.disclosures.size > 0 ? [...this.disclosures] : [])
            .concat(this.holderJwt ? [this.holderJwt] : formatForPresentation ? [''] : [])
            .join(SDJwt.SEPARATOR);
    }
    /**
     * Present SD-JWT with selection of disclosures.
     * @param sdMap selective disclosure map, indicating whether to disclose each disclosure in the presentation, per field.
     * @param withHolderJwt optional holder JWT as holder binding to include in the SD-JWT presentation.
     */
    present(sdMap, withHolderJwt) {
        return new SDJwt(this.jwt, this.header, sdMap ? this.sdPayload.withSelectiveDisclosures(sdMap) : this.sdPayload.withoutSelectiveDisclosures(), withHolderJwt, true);
    }
    /**
     * Present SD-JWT with either all disclosures or none.
     */
    presentAll(discloseAll, withHolderJwt) {
        return new SDJwt(this.jwt, this.header, discloseAll ? this.sdPayload : this.sdPayload.withoutSelectiveDisclosures(), withHolderJwt || this.holderJwt, true);
    }
    /**
     * Verify SD-JWT by checking the signature and matching the disclosures against the digests in the payload.
     * @param jwtCryptoProvider synchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    verify(jwtCryptoProvider, options) {
        const jwtVerificationResult = jwtCryptoProvider.verify(this.jwt, options);
        return defaultVerificationResult(this, jwtVerificationResult.verified, jwtVerificationResult.verified && this.sdPayload.verifyDisclosures(), jwtVerificationResult.message);
    }
    /**
     * Verify SD-JWT by checking the signature and matching the disclosures against the digests in the payload.
     * @param jwtCryptoProvider asynchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    async verifyAsync(jwtCryptoProvider, options) {
        const jwtVerificationResult = await jwtCryptoProvider.verifyAsync(this.jwt, options);
        return defaultVerificationResult(this, jwtVerificationResult.verified, jwtVerificationResult.verified && this.sdPayload.verifyDisclosures(), jwtVerificationResult.message);
    }
    /**
     * Parse SD-JWT from string.
     * @param sdJwt SD-JWT string to parse.
     */
    static parse(sdJwt) {
        const match = sdJwt.match(SDJwt.SD_JWT_PATTERN) ||
            (function () {
                throw new Error('Invalid SD-JWT');
            })();
        const header = JSON.parse(toString(fromString(match.groups.header, 'base64'), 'utf-8'));
        const disclosures = new Set(match.groups.disclosures?.replace(/^~+|~+$/g, '')?.split(SDJwt.SEPARATOR) || []);
        const holderJwt = match.groups.holderjwt;
        const sdPayload = SDPayload.parse(match.groups.body, disclosures);
        return new SDJwt(sdJwt, header, sdPayload, holderJwt);
    }
    /**
     * Parse SD-JWT from string and verify it.
     * @param sdJwt SD-JWT string to parse and verify.
     * @param jwtCryptoProvider synchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    static parseAndVerify(sdJwt, jwtCryptoProvider, options) {
        return SDJwt.parse(sdJwt).verify(jwtCryptoProvider, options);
    }
    /**
     * Parse SD-JWT from string and verify it.
     * @param sdJwt SD-JWT string to parse and verify.
     * @param jwtCryptoProvider asynchronous JWT crypto provider to use for signature verification, that implements standard JWT signing and verification.
     * @param options optional pass-through options.
     */
    static async parseAndVerifyAsync(sdJwt, jwtCryptoProvider, options) {
        return await SDJwt.parse(sdJwt).verifyAsync(jwtCryptoProvider, options);
    }
    static createFromSignedJWT(signedJwt, sdPayload, withHolderJwt) {
        const sdJwt = SDJwt.parse(signedJwt);
        return new SDJwt(signedJwt, sdJwt.header, sdPayload, withHolderJwt);
    }
    /**
     * Sign given payload as SD-JWT, using given JWT crypto provider, with optional key ID and pass-through options.
     * @param sdPayload payload with selective disclosures to sign.
     * @param jwtCryptoProvider synchronous JWT crypto provider to use for signing, that implements standard JWT signing and verification.
     * @param keyId optional key ID of the signing key to be used, if required by the underlying crypto library.
     * @param withHolderJwt optional holder JWT as holder binding to include in the SD-JWT.
     * @param options optional pass-through options.
     */
    static sign(sdPayload, jwtCryptoProvider, keyId = null, withHolderJwt = null, typ = 'JWT', options) {
        return SDJwt.createFromSignedJWT(jwtCryptoProvider.sign(sdPayload.undisclosedPayload, keyId, typ, options), sdPayload, withHolderJwt);
    }
    /**
     * Sign given payload as SD-JWT, using given JWT crypto provider, with optional key ID and pass-through options.
     * @param sdPayload payload with selective disclosures to sign.
     * @param jwtCryptoProvider asynchronous JWT crypto provider to use for signing, that implements standard JWT signing and verification.
     * @param keyId optional key ID of the signing key to be used, if required by the underlying crypto library.
     * @param withHolderJwt optional holder JWT as holder binding to include in the SD-JWT.
     * @param options optional pass-through options.
     */
    static async signAsync(header, sdPayload, jwtCryptoProvider, keyId = null, withHolderJwt = null, options) {
        return SDJwt.createFromSignedJWT(await jwtCryptoProvider.signAsync(header, sdPayload.undisclosedPayload, keyId, options), sdPayload, withHolderJwt);
    }
    /**
     * Check whether given JWT is an SD-JWT.
     * @param value JWT to check.
     */
    static isSDJwt(value) {
        return value.match(SDJwt.SD_JWT_PATTERN) !== null;
    }
}
//# sourceMappingURL=SDJwt.js.map