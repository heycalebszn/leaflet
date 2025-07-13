import * as fs from 'fs-extra';
import * as path from 'path';
import { FileAnalyzer } from './file-analyzer';
import { AIService } from './ai-service';
import { 
  ProjectAnalysis, 
  AIConfig, 
  DocumentationConfig, 
  AnalysisResult 
} from '../types';

export class DocumentationGenerator {
  private fileAnalyzer: FileAnalyzer;
  private aiService: AIService;
  private config: DocumentationConfig;

  constructor(
    projectPath: string,
    aiConfig: AIConfig,
    config: DocumentationConfig
  ) {
    this.fileAnalyzer = new FileAnalyzer(projectPath);
    this.aiService = new AIService(aiConfig);
    this.config = config;
  }

  async generateDocumentation(): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Analyzing project structure...');
      const { fileStructure, metadata } = await this.fileAnalyzer.analyzeProject();
      
      console.log('📝 Extracting source code sample...');
      const sourceCodeSample = await this.fileAnalyzer.getSourceCodeSample();
      
      console.log('🤖 Running AI analysis...');
      const aiAnalysis = await this.aiService.analyzeProject(fileStructure, sourceCodeSample);
      
      console.log('📊 Compiling project analysis...');
      const projectAnalysis: ProjectAnalysis = {
        projectName: aiAnalysis.projectName || path.basename(process.cwd()),
        description: aiAnalysis.description || 'No description available',
        technology: aiAnalysis.technology || [],
        structure: fileStructure,
        dependencies: aiAnalysis.dependencies || [],
        entryPoints: aiAnalysis.entryPoints || [],
        documentation: aiAnalysis.documentation || [],
        metadata
      };
      
      console.log('📄 Generating documentation...');
      const documentation = await this.aiService.generateDocumentation(projectAnalysis, this.config);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        data: projectAnalysis,
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      };
    }
  }

  async saveDocumentation(analysis: ProjectAnalysis, outputPath: string): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(outputPath));
      
      if (this.config.outputFormat === 'json') {
        await fs.writeJson(outputPath, analysis, { spaces: 2 });
      } else {
        const documentation = await this.aiService.generateDocumentation(analysis, this.config);
        await fs.writeFile(outputPath, documentation, 'utf-8');
      }
      
      console.log(`✅ Documentation saved to: ${outputPath}`);
    } catch (error) {
      throw new Error(`Failed to save documentation: ${error}`);
    }
  }

  async generateTemplates(analysis: ProjectAnalysis, outputDir: string): Promise<void> {
    try {
      await fs.ensureDir(outputDir);
      
      // Generate README template
      const readmeContent = this.generateReadmeTemplate(analysis);
      await fs.writeFile(path.join(outputDir, 'README.md'), readmeContent, 'utf-8');
      
      // Generate API documentation template
      if (this.config.includeApiDocs) {
        const apiContent = this.generateApiTemplate(analysis);
        await fs.writeFile(path.join(outputDir, 'API.md'), apiContent, 'utf-8');
      }
      
      // Generate setup guide template
      if (this.config.includeSetupGuide) {
        const setupContent = this.generateSetupTemplate(analysis);
        await fs.writeFile(path.join(outputDir, 'SETUP.md'), setupContent, 'utf-8');
      }
      
      // Generate contributing guide template
      const contributingContent = this.generateContributingTemplate(analysis);
      await fs.writeFile(path.join(outputDir, 'CONTRIBUTING.md'), contributingContent, 'utf-8');
      
      console.log(`✅ Templates generated in: ${outputDir}`);
    } catch (error) {
      throw new Error(`Failed to generate templates: ${error}`);
    }
  }

  private generateReadmeTemplate(analysis: ProjectAnalysis): string {
    return `# ${analysis.projectName}

${analysis.description}

## Features

${analysis.technology.map(tech => `- ${tech}`).join('\n')}

## Quick Start

\`\`\`bash
# Installation
npm install

# Development
npm run dev

# Build
npm run build
\`\`\`

## Project Structure

\`\`\`
${this.formatDirectoryTree(analysis.structure.root)}
\`\`\`

## Documentation

- [API Documentation](./API.md)
- [Setup Guide](./SETUP.md)
- [Contributing](./CONTRIBUTING.md)

## License

${analysis.metadata.license || 'MIT'}
`;
  }

  private generateApiTemplate(analysis: ProjectAnalysis): string {
    return `# API Documentation

## Overview

This document describes the API for ${analysis.projectName}.

## Entry Points

${analysis.entryPoints.map(entry => `- \`${entry}\``).join('\n')}

## Dependencies

${analysis.dependencies.map(dep => 
  `- **${dep.name}** (${dep.version}) - ${dep.description || 'No description'}`
).join('\n')}

## Architecture

The project uses the following technologies:
${analysis.technology.map(tech => `- ${tech}`).join('\n')}

## Key Components

${analysis.documentation
  .filter(doc => doc.type === 'api')
  .map(doc => `### ${doc.title}\n\n${doc.content}`)
  .join('\n\n')}
`;
  }

  private generateSetupTemplate(analysis: ProjectAnalysis): string {
    return `# Setup Guide

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ${analysis.projectName}
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Configure environment:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start development server:
\`\`\`bash
npm run dev
\`\`\`

## Configuration

${analysis.documentation
  .filter(doc => doc.type === 'setup')
  .map(doc => `### ${doc.title}\n\n${doc.content}`)
  .join('\n\n')}
`;
  }

  private generateContributingTemplate(analysis: ProjectAnalysis): string {
    return `# Contributing

Thank you for your interest in contributing to ${analysis.projectName}!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: \`npm install\`
4. Create a feature branch: \`git checkout -b feature/your-feature\`
5. Make your changes
6. Run tests: \`npm test\`
7. Commit your changes: \`git commit -m 'Add feature'\`
8. Push to your fork: \`git push origin feature/your-feature\`
9. Create a Pull Request

## Code Style

- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## Project Structure

${this.formatDirectoryTree(analysis.structure.root)}

## Questions?

Open an issue or reach out to the maintainers.
`;
  }

  private formatDirectoryTree(node: any, indent: string = ''): string {
    let result = '';
    
    if (node.type === 'directory') {
      result += `${indent}📁 ${node.name}/\n`;
      if (node.children) {
        for (const child of node.children) {
          result += this.formatDirectoryTree(child, indent + '  ');
        }
      }
    } else {
      result += `${indent}📄 ${node.name}\n`;
    }
    
    return result;
  }
} 