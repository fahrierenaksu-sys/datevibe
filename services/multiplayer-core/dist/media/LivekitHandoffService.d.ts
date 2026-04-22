import type { MediaSessionToken, MiniRoom } from "@datevibe/contracts";
export interface LivekitHandoffOptions {
    livekitUrl?: string;
    apiKey?: string;
    apiSecret?: string;
    tokenTtlSeconds?: number;
}
export declare class LivekitHandoffService {
    private readonly livekitUrl;
    private readonly apiKey?;
    private readonly apiSecret?;
    private readonly tokenTtlSeconds;
    constructor(options?: LivekitHandoffOptions);
    issueToken(miniRoom: MiniRoom, userId: string): MediaSessionToken;
    private createToken;
}
//# sourceMappingURL=LivekitHandoffService.d.ts.map