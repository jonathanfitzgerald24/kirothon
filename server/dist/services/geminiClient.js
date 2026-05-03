"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiClient = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiClient {
    constructor() {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey)
            throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    getModel(model) {
        return this.client.getGenerativeModel({ model });
    }
    async generateContent(model, prompt) {
        const generativeModel = this.getModel(model);
        const result = await generativeModel.generateContent(prompt);
        const response = result.response;
        return response.text();
    }
}
// Singleton instance
exports.geminiClient = new GeminiClient();
//# sourceMappingURL=geminiClient.js.map