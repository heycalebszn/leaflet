import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RepoImporter {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
  }

  async importRepository(repoUrl: string, branch: string = 'main'): Promise<string> {
    try {
      // Create temp directory if it doesn't exist
      await fs.ensureDir(this.tempDir);
      
      // Generate unique directory name
      const timestamp = Date.now();
      const repoName = this.extractRepoName(repoUrl);
      const targetDir = path.join(this.tempDir, `${repoName}-${timestamp}`);
      
      console.log(`📥 Cloning repository: ${repoUrl}`);
      console.log(`📍 Target directory: ${targetDir}`);
      
      // Clone the repository
      await execAsync(`git clone --depth 1 --branch ${branch} ${repoUrl} "${targetDir}"`);
      
      // Remove .git directory to save space
      const gitDir = path.join(targetDir, '.git');
      if (await fs.pathExists(gitDir)) {
        await fs.remove(gitDir);
      }
      
      console.log(`✅ Repository imported successfully: ${targetDir}`);
      return targetDir;
      
    } catch (error) {
      console.error('Failed to import repository:', error);
      throw new Error(`Failed to import repository: ${error}`);
    }
  }

  async importLocalDirectory(dirPath: string): Promise<string> {
    try {
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      // Create temp directory if it doesn't exist
      await fs.ensureDir(this.tempDir);
      
      // Generate unique directory name
      const timestamp = Date.now();
      const dirName = path.basename(dirPath);
      const targetDir = path.join(this.tempDir, `${dirName}-${timestamp}`);
      
      console.log(`📁 Copying local directory: ${dirPath}`);
      console.log(`📍 Target directory: ${targetDir}`);
      
      // Copy the directory
      await fs.copy(dirPath, targetDir);
      
      console.log(`✅ Local directory imported successfully: ${targetDir}`);
      return targetDir;
      
    } catch (error) {
      console.error('Failed to import local directory:', error);
      throw new Error(`Failed to import local directory: ${error}`);
    }
  }

  async cleanupTempFiles(): Promise<void> {
    try {
      const tempFiles = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const file of tempFiles) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          console.log(`🗑️ Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  private extractRepoName(repoUrl: string): string {
    // Extract repo name from various URL formats
    const url = repoUrl.replace(/\.git$/, '');
    const parts = url.split('/');
    return parts[parts.length - 1] || 'unknown-repo';
  }

  async validateRepository(repoUrl: string): Promise<boolean> {
    try {
      // Try to get repository info without cloning
      await execAsync(`git ls-remote --heads ${repoUrl}`);
      return true;
    } catch (error) {
      return false;
    }
  }
} 