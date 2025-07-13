import { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DocumentationGenerator } from '../services/documentation-generator';
import { RepoImporter } from '../services/repo-importer';
import { AIConfig, DocumentationConfig } from '../types';
import {
  DEFAULT_BRANCH,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_TONE,
  DEFAULT_VERBOSITY,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_GEMINI_MODEL
} from '../config/constants';

const repoImporter = new RepoImporter();

export const analyzeProject = async (req: Request, res: Response) => {
  try {
    const {
      projectPath,
      repoUrl,
      branch = DEFAULT_BRANCH,
      outputFormat = DEFAULT_OUTPUT_FORMAT,
      tone = DEFAULT_TONE,
      verbosity = DEFAULT_VERBOSITY,
      includeApiDocs = false,
      includeSetupGuide = false,
      includeInline = false,
      apiKey
    } = req.body;

    // Get API key from request or environment
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY || 'AIzaSyDym_c56JeumZ4dMbVRmF-dNped4mkE6mA';

    if (!geminiApiKey) {
      return res.status(400).json({ 
        error: 'Gemini API key is required' 
      });
    }

    let finalProjectPath = projectPath;

    // If repoUrl is provided, import the repository
    if (repoUrl) {
      console.log(`🔄 Importing repository: ${repoUrl}`);
      try {
        finalProjectPath = await repoImporter.importRepository(repoUrl, branch);
      } catch (error) {
        return res.status(400).json({ 
          error: `Failed to import repository: ${error}` 
        });
      }
    } else if (projectPath) {
      // If it's a local path, copy it to temp directory
      if (fs.existsSync(projectPath)) {
        console.log(`🔄 Importing local directory: ${projectPath}`);
        try {
          finalProjectPath = await repoImporter.importLocalDirectory(projectPath);
        } catch (error) {
          return res.status(400).json({ 
            error: `Failed to import local directory: ${error}` 
          });
        }
      } else {
        return res.status(400).json({ 
          error: 'Project path does not exist' 
        });
      }
    } else {
      return res.status(400).json({ 
        error: 'Either projectPath or repoUrl is required' 
      });
    }

    // Configure AI and documentation settings
    const aiConfig: AIConfig = {
      apiKey: geminiApiKey,
      model: req.body.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS
    };

    const docConfig: DocumentationConfig = {
      outputFormat: outputFormat as 'json' | 'markdown' | 'html',
      template: 'default',
      includeInline,
      includeApiDocs,
      includeSetupGuide,
      tone: tone as 'technical' | 'friendly' | 'formal',
      verbosity: verbosity as 'minimal' | 'standard' | 'detailed'
    };

    // Generate documentation
    const generator = new DocumentationGenerator(finalProjectPath, aiConfig, docConfig);
    const result = await generator.generateDocumentation();

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error,
        processingTime: result.processingTime
      });
    }

    // Save documentation to output directory
    const outputDir = path.join(__dirname, '../../output', Date.now().toString());
    await fs.ensureDir(outputDir);
    
    const outputPath = path.join(outputDir, `analysis.${outputFormat}`);
    await generator.saveDocumentation(result.data!, outputPath);

    // Generate templates if requested
    if (req.body.generateTemplates) {
      const templateDir = path.join(outputDir, 'templates');
      await generator.generateTemplates(result.data!, templateDir);
    }

    // Optionally host documentation on Leaflet
    let hostedUrl = null;
    if (req.body.hostOnLeaflet) {
      const hostedId = path.basename(outputDir);
      const hostedDir = path.join(__dirname, '../../hosted_docs', hostedId);
      await fs.ensureDir(hostedDir);
      // Copy all output files to hosted_docs/{hostedId}/
      await fs.copy(outputDir, hostedDir);
      hostedUrl = `/docs/${hostedId}/analysis.${outputFormat}`;
    }

    res.json({
      success: true,
      data: result.data,
      processingTime: result.processingTime,
      outputPath,
      downloadUrl: `/api/download/${path.basename(outputDir)}`,
      importedPath: finalProjectPath,
      hostedUrl
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now()
    });
  }
}; 