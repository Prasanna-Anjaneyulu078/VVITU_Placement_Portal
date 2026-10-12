const { GoogleGenAI } = require('@google/genai');

class GeminiService {
  constructor() {
    // Initialize Google GenAI client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    
    // We use the new SDK format
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-init' });
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.embeddingModel = 'gemini-embedding-2';
  }

  async generateEmbedding(text) {
    if (!text) return null;
    try {
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: text,
      });
      return response.embeddings[0].values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  async generateGroundedResponse(prompt, contextChunks, userQuestion, structuredContext) {
    try {
      let fullContext = `SYSTEM INSTRUCTIONS:\n${prompt}\n\n`;
      
      if (structuredContext) {
        fullContext += `STRUCTURED DATABASE CONTEXT (Trustworthy):\n${structuredContext}\n\n`;
      }
      
      if (contextChunks && contextChunks.length > 0) {
        fullContext += `RETRIEVED CONTEXT (Reference Data):\n`;
        contextChunks.forEach((chunk, index) => {
          fullContext += `--- Source ${index + 1} [${chunk.document.type}: ${chunk.document.title}] ---\n`;
          fullContext += `${chunk.content}\n\n`;
        });
      } else {
        fullContext += `RETRIEVED CONTEXT: No specific context found in the knowledge base.\n\n`;
      }

      fullContext += `USER QUESTION:\n${userQuestion}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: fullContext,
        config: {
            temperature: 0.2,
        }
      });

      return response.text;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }
}

module.exports = new GeminiService();
