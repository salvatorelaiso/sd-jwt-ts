import { SignJWT, jwtVerify } from 'jose';
export class CompactAsyncJWTCryptoProvider {
    algorithm;
    keyParam;
    signOptions;
    verifyOptions;
    constructor(algorithm, keyParam, signOptions, verifyOptions) {
        this.algorithm = algorithm;
        this.keyParam = keyParam;
        this.signOptions = signOptions;
        this.verifyOptions = verifyOptions;
    }
    async signAsync(header, payload, keyId) {
        const jwt = await new SignJWT(payload)
            .setProtectedHeader({ ...header, kid: keyId ?? header.kid })
            .sign(this.keyParam, this.signOptions);
        return jwt;
    }
    async verifyAsync(jwt) {
        try {
            await jwtVerify(jwt, this.keyParam, this.verifyOptions);
            return {
                verified: true,
            };
        }
        catch (error) {
            return {
                verified: false,
                message: error.message,
            };
        }
    }
}
//# sourceMappingURL=CompactAsyncJWTCryptoProvider.js.map