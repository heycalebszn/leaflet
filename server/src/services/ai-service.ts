import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
import { AIConfig, ProjectAnalysis, FileStructure } from '../types';

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  async analyzeProject(fileStructure: FileStructure, sourceCode: string): Promise<Partial<ProjectAnalysis>> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.config.model || DEFAULT_GEMINI_MODEL,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      }
    });

    const prompt = this.buildAnalysisPrompt(fileStructure, sourceCode);
    
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`Attempting AI analysis (${retries} retries left)...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return this.parseAnalysisResponse(text);
      } catch (error: any) {
        retries--;
        console.error(`AI analysis attempt failed (${retries} retries left):`, error.message);
        
        // Check if it's a rate limit error
        if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
          if (retries > 0) {
            console.log('Rate limited, waiting 30 seconds before retry...');
            await new Promise(resolve => setTimeout(resolve, 30000));
            continue;
          } else {
            throw new Error(`Rate limit exceeded after retries. Please try again later.`);
          }
        }
        
        // For other errors, throw immediately
        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }
    
    throw new Error('AI analysis failed after all retries');
  }

  async generateDocumentation(analysis: ProjectAnalysis, config: any): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: this.config.model || DEFAULT_GEMINI_MODEL,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
      }
    });

    const prompt = this.buildDocumentationPrompt(analysis, config);
    
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Documentation generation failed:', error);
      throw new Error(`Documentation generation failed: ${error}`);
    }
  }

  private buildAnalysisPrompt(fileStructure: FileStructure, sourceCode: string): string {
    return `
You are an expert software engineer analyzing a codebase. Your task is to analyze the project structure and source code, then return ONLY a valid JSON object with no additional text, comments, or explanations.

Project Structure:
${JSON.stringify(fileStructure, null, 2)}

Source Code Sample:
${sourceCode}

Return ONLY a valid JSON object with this exact structure:
{
  "projectName": "string",
  "description": "detailed description of what this project does",
  "technology": ["array of technologies/frameworks used"],
  "entryPoints": ["main entry points of the application"],
  "dependencies": [
    {
      "name": "dependency name",
      "version": "version string",
      "type": "production|development|peer",
      "description": "what this dependency is used for"
    }
  ],
  "documentation": [
    {
      "type": "readme|api|setup|contributing|inline",
      "title": "section title",
      "content": "detailed content for this section",
      "priority": 1-5,
      "files": ["relevant files"]
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. Do not include any other text, markdown formatting, or explanations.
`;
  }

  private buildDocumentationPrompt(analysis: ProjectAnalysis, config: any): string {
    return `
Based on the following project analysis, generate comprehensive documentation in ${config.outputFormat} format.

Project Analysis:
${JSON.stringify(analysis, null, 2)}

Documentation Configuration:
- Tone: ${config.tone}
- Verbosity: ${config.verbosity}
- Include inline comments: ${config.includeInline}
- Include API docs: ${config.includeApiDocs}
- Include setup guide: ${config.includeSetupGuide}

Generate documentation that:
1. Explains what the project does and why it exists
2. Provides clear setup and installation instructions
3. Documents the API and key functions
4. Includes usage examples
5. Explains the project structure and architecture
6. Provides contribution guidelines if applicable

Use a ${config.tone} tone and ${config.verbosity} level of detail.
`;
  }

  private parseAnalysisResponse(response: string): Partial<ProjectAnalysis> {
    try {
      console.log('Raw AI response:', response.substring(0, 500) + '...');
      
      // Clean the response - remove any markdown formatting
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response. Full response:', response);
        throw new Error('No JSON found in AI response');
      }
      
      const jsonString = jsonMatch[0];
      console.log('Extracted JSON:', jsonString.substring(0, 500) + '...');
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Full response was:', response);
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }
} 