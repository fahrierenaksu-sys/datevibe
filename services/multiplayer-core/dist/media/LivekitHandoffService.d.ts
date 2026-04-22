import type { MediaSessionToken, MiniRoom } from "@datevibe/contracts";
export interface LivekitHandoffOptions {
    livekitUrl?: string;
}
export declare class LivekitHandoffService {
    private readonly livekitUrl;
    constructor(options?: LivekitHandoffOptions);
    issueToken(miniRoom: MiniRoom, userId: string): MediaSessionToken;
}
//# sourceMappingURL=LivekitHandoffService.d.ts.map