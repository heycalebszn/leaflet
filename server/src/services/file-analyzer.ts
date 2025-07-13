import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { FileStructure, DirectoryNode, ProjectMetadata } from '../types';

export class FileAnalyzer {
  private projectPath: string;
  private ignorePatterns: string[];

  constructor(projectPath: string, ignorePatterns: string[] = []) {
    this.projectPath = projectPath;
    this.ignorePatterns = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      '*.log',
      '*.lock',
      ...ignorePatterns
    ];
  }

  async analyzeProject(): Promise<{ fileStructure: FileStructure; metadata: ProjectMetadata }> {
    const startTime = Date.now();
    
    try {
      // Get all files in the project
      const files = await this.getAllFiles();
      
      // Build directory tree
      const root = this.buildDirectoryTree(files);
      
      // Analyze file statistics
      const stats = await this.analyzeFileStats(files);
      
      // Get project metadata
      const metadata = await this.getProjectMetadata();
      
      const fileStructure: FileStructure = {
        root,
        totalFiles: stats.totalFiles,
        totalLines: stats.totalLines,
        languageBreakdown: stats.languageBreakdown
      };

      return { fileStructure, metadata };
    } catch (error) {
      throw new Error(`Failed to analyze project: ${error}`);
    }
  }

  async getSourceCodeSample(maxSize: number = 50000): Promise<string> {
    const codeFiles = await this.getCodeFiles();
    let sample = '';
    let totalSize = 0;

    for (const file of codeFiles) {
      if (totalSize >= maxSize) break;
      
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileSize = content.length;
        
        if (totalSize + fileSize <= maxSize) {
          sample += `\n// File: ${path.relative(this.projectPath, file)}\n`;
          sample += content;
          totalSize += fileSize;
        } else {
          // Add partial content
          const remainingSize = maxSize - totalSize;
          sample += `\n// File: ${path.relative(this.projectPath, file)} (partial)\n`;
          sample += content.substring(0, remainingSize);
          break;
        }
      } catch (error) {
        console.warn(`Could not read file ${file}: ${error}`);
      }
    }

    return sample;
  }

  private async getAllFiles(): Promise<string[]> {
    const patterns = ['**/*'];
    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: this.projectPath,
        ignore: this.ignorePatterns,
        absolute: true,
        nodir: true
      });
      files.push(...matches);
    }

    return files;
  }

  private async getCodeFiles(): Promise<string[]> {
    const codeExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs',
      '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala'
    ];

    const allFiles = await this.getAllFiles();
    return allFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return codeExtensions.includes(ext);
    });
  }

  private buildDirectoryTree(files: string[]): DirectoryNode {
    const root: DirectoryNode = {
      name: path.basename(this.projectPath),
      type: 'directory',
      path: this.projectPath,
      children: []
    };

    const fileMap = new Map<string, DirectoryNode>();

    for (const file of files) {
      const relativePath = path.relative(this.projectPath, file);
      const parts = relativePath.split(path.sep);
      
      let currentPath = this.projectPath;
      let parentNode = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const fullPath = path.join(currentPath, part);
        
        if (!fileMap.has(fullPath)) {
          const isFile = i === parts.length - 1;
          const node: DirectoryNode = {
            name: part,
            type: isFile ? 'file' : 'directory',
            path: fullPath,
            children: isFile ? undefined : []
          };
          
          fileMap.set(fullPath, node);
          parentNode.children!.push(node);
        }
        
        parentNode = fileMap.get(fullPath)!;
        currentPath = fullPath;
      }
    }

    return root;
  }

  private async analyzeFileStats(files: string[]): Promise<{
    totalFiles: number;
    totalLines: number;
    languageBreakdown: Record<string, number>;
  }> {
    let totalLines = 0;
    const languageBreakdown: Record<string, number> = {};

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n').length;
        const ext = path.extname(file).toLowerCase();
        
        totalLines += lines;
        languageBreakdown[ext] = (languageBreakdown[ext] || 0) + lines;
      } catch (error) {
        console.warn(`Could not analyze file ${file}: ${error}`);
      }
    }

    return {
      totalFiles: files.length,
      totalLines,
      languageBreakdown
    };
  }

  private async getProjectMetadata(): Promise<ProjectMetadata> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const gitPath = path.join(this.projectPath, '.git');
    
    let version = '1.0.0';
    let license: string | undefined;
    let repository: string | undefined;
    let author: string | undefined;

    try {
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        version = packageJson.version || version;
        license = packageJson.license;
        repository = packageJson.repository?.url || packageJson.repository;
        author = packageJson.author;
      }
    } catch (error) {
      console.warn('Could not read package.json:', error);
    }

    const stats = await fs.stat(this.projectPath);
    const hasGit = await fs.pathExists(gitPath);

    return {
      createdAt: stats.birthtime,
      lastModified: stats.mtime,
      version,
      license,
      repository,
      author
    };
  }
} 