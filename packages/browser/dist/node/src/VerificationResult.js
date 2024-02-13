export const defaultVerificationResult = (sdJwt, signatureVerified, disclosuresVerified, message) => {
    return {
        sdJwt,
        signatureVerified,
        disclosuresVerified,
        message,
        verified: signatureVerified && disclosuresVerified,
    };
};
//# sourceMappingURL=VerificationResult.js.map