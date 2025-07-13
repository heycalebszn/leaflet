#!/usr/bin/env node

import './cli';

// Export main classes for programmatic use
export { DocumentationGenerator } from './services/documentation-generator';
export { FileAnalyzer } from './services/file-analyzer';
export { AIService } from './services/ai-service';
export * from './types';