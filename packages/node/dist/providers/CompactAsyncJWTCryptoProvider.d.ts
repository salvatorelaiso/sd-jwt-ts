import { JWTVerifyOptions, KeyLike, SignOptions } from 'jose';
import { AsyncJWTCryptoProvider } from '../AsyncJWTCryptoProvider.js';
import { JSONObject } from '../utils/types.js';
import { JWTVerificationResult } from '../VerificationResult.js';
export declare class CompactAsyncJWTCryptoProvider implements AsyncJWTCryptoProvider {
    private readonly algorithm;
    private readonly keyParam;
    private readonly signOptions?;
    private readonly verifyOptions?;
    constructor(algorithm: string, keyParam: KeyLike | Uint8Array, signOptions?: SignOptions | undefined, verifyOptions?: JWTVerifyOptions | undefined);
    signAsync(header: any, payload: JSONObject, keyId?: string | null): Promise<string>;
    verifyAsync(jwt: string): Promise<JWTVerificationResult>;
}
//# sourceMappingURL=CompactAsyncJWTCryptoProvider.d.ts.map