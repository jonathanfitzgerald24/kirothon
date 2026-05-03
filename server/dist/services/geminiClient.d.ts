import { GenerativeModel } from '@google/generative-ai';
export type GeminiModel = 'gemini-1.5-pro' | 'gemini-1.5-flash';
declare class GeminiClient {
    private client;
    constructor();
    getModel(model: GeminiModel): GenerativeModel;
    generateContent(model: GeminiModel, prompt: string): Promise<string>;
}
export declare const geminiClient: GeminiClient;
export {};
//# sourceMappingURL=geminiClient.d.ts.map