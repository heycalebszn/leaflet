#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import { DocumentationGenerator } from './services/documentation-generator';
import { AIConfig, DocumentationConfig } from './types';

const program = new Command();

program
  .name('leaflet')
  .description('AI-Powered Documentation Generator')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze a project and generate documentation')
  .argument('<project-path>', 'Path to the project directory')
  .option('-o, --output <path>', 'Output path for documentation', './docs')
  .option('-f, --format <format>', 'Output format (json, markdown, html)', 'json')
  .option('-t, --tone <tone>', 'Documentation tone (technical, friendly, formal)', 'friendly')
  .option('-v, --verbosity <level>', 'Verbosity level (minimal, standard, detailed)', 'standard')
  .option('--api-docs', 'Include API documentation', false)
  .option('--setup-guide', 'Include setup guide', false)
  .option('--inline-comments', 'Include inline code comments', false)
  .option('--templates', 'Generate documentation templates', false)
  .option('--api-key <key>', 'Google Gemini API key')
  .option('--model <model>', 'Gemini model to use (gemini-1.5-flash, gemini-1.5-pro)', process.env.GEMINI_MODEL || 'gemini-1.5-flash')
  .action(async (projectPath: string, options: any) => {
    const spinner = ora('Initializing...').start();
    
    try {
      // Validate project path
      const resolvedPath = path.resolve(projectPath);
      if (!require('fs').existsSync(resolvedPath)) {
        spinner.fail('Project path does not exist');
        process.exit(1);
      }

      // Get API key from environment or command line
      const apiKey = options.apiKey || process.env.GEMINI_API_KEY || 'AIzaSyC_pLMzO0VZTwg3627yLMDRSjZ9ntN80bA';
      
      if (!apiKey) {
        spinner.fail('Gemini API key is required. Set GEMINI_API_KEY environment variable or use --api-key option');
        process.exit(1);
      }

      spinner.text = 'Setting up AI configuration...';
      
      const aiConfig: AIConfig = {
        apiKey,
        model: options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        temperature: 0.3,
        maxTokens: 4000
      };

      const docConfig: DocumentationConfig = {
        outputFormat: options.format as 'json' | 'markdown' | 'html',
        template: 'default',
        includeInline: options.inlineComments,
        includeApiDocs: options.apiDocs,
        includeSetupGuide: options.setupGuide,
        tone: options.tone as 'technical' | 'friendly' | 'formal',
        verbosity: options.verbosity as 'minimal' | 'standard' | 'detailed'
      };

      spinner.text = 'Creating documentation generator...';
      const generator = new DocumentationGenerator(resolvedPath, aiConfig, docConfig);

      spinner.text = 'Generating documentation...';
      const result = await generator.generateDocumentation();

      if (!result.success) {
        spinner.fail(`Documentation generation failed: ${result.error}`);
        process.exit(1);
      }

      spinner.succeed(`Documentation generated successfully in ${result.processingTime}ms`);

      // Save documentation
      const outputPath = path.resolve(options.output);
      await generator.saveDocumentation(result.data!, outputPath);

      // Generate templates if requested
      if (options.templates) {
        const templateDir = path.join(outputPath, 'templates');
        await generator.generateTemplates(result.data!, templateDir);
      }

      console.log(chalk.green('\n✅ Documentation generation complete!'));
      console.log(chalk.blue(`📁 Output: ${outputPath}`));
      console.log(chalk.blue(`📊 Project: ${result.data!.projectName}`));
      console.log(chalk.blue(`📝 Description: ${result.data!.description}`));
      console.log(chalk.blue(`🔧 Technologies: ${result.data!.technology.join(', ')}`));
      console.log(chalk.blue(`📄 Files analyzed: ${result.data!.structure.totalFiles}`));
      console.log(chalk.blue(`📏 Total lines: ${result.data!.structure.totalLines}`));

    } catch (error) {
      spinner.fail(`Error: ${error}`);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    console.log(chalk.blue('🔧 Leaflet Configuration'));
    console.log(chalk.gray('API Key:'), process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
    console.log(chalk.gray('Default Model:'), process.env.GEMINI_MODEL || 'gemini-1.5-flash');
    console.log(chalk.gray('Default Temperature:'), '0.3');
    console.log(chalk.gray('Max Tokens:'), '4000');
  });

program
  .command('templates')
  .description('Generate documentation templates')
  .argument('<project-path>', 'Path to the project directory')
  .option('-o, --output <path>', 'Output directory for templates', './templates')
  .action(async (projectPath: string, options: any) => {
    const spinner = ora('Generating templates...').start();
    
    try {
      const resolvedPath = path.resolve(projectPath);
      const outputDir = path.resolve(options.output);
      
      // Create a minimal configuration for template generation
      const aiConfig: AIConfig = {
        apiKey: process.env.GEMINI_API_KEY || 'AIzaSyC_pLMzO0VZTwg3627yLMDRSjZ9ntN80bA',
        model: options.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        temperature: 0.3,
        maxTokens: 4000
      };

      const docConfig: DocumentationConfig = {
        outputFormat: 'markdown',
        template: 'default',
        includeInline: true,
        includeApiDocs: true,
        includeSetupGuide: true,
        tone: 'friendly',
        verbosity: 'standard'
      };

      const generator = new DocumentationGenerator(resolvedPath, aiConfig, docConfig);
      const result = await generator.generateDocumentation();

      if (!result.success) {
        spinner.fail(`Template generation failed: ${result.error}`);
        process.exit(1);
      }

      await generator.generateTemplates(result.data!, outputDir);
      spinner.succeed(`Templates generated in: ${outputDir}`);

    } catch (error) {
      spinner.fail(`Error: ${error}`);
      process.exit(1);
    }
  });

// Handle errors
program.exitOverride((err: any) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  } else {
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
});

program.parse(process.argv); 