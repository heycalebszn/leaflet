export interface ProjectAnalysis {
  projectName: string;
  description: string;
  technology: string[];
  structure: FileStructure;
  dependencies: Dependency[];
  entryPoints: string[];
  documentation: DocumentationSection[];
  metadata: ProjectMetadata;
}

export interface FileStructure {
  root: DirectoryNode;
  totalFiles: number;
  totalLines: number;
  languageBreakdown: Record<string, number>;
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: DirectoryNode[];
  size?: number;
  language?: string;
  complexity?: number;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer';
  description?: string;
}

export interface DocumentationSection {
  type: 'readme' | 'api' | 'setup' | 'contributing' | 'inline';
  title: string;
  content: string;
  priority: number;
  files?: string[];
}

export interface ProjectMetadata {
  createdAt: Date;
  lastModified: Date;
  version: string;
  license?: string;
  repository?: string;
  author?: string;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface DocumentationConfig {
  outputFormat: 'json' | 'markdown' | 'html';
  template: string;
  includeInline: boolean;
  includeApiDocs: boolean;
  includeSetupGuide: boolean;
  tone: 'technical' | 'friendly' | 'formal';
  verbosity: 'minimal' | 'standard' | 'detailed';
}

export interface AnalysisResult {
  success: boolean;
  data?: ProjectAnalysis;
  error?: string;
  processingTime: number;
} 