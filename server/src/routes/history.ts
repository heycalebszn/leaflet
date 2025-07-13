import { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

export const getHistory = async (req: Request, res: Response) => {
  try {
    const outputDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) {
      return res.json([]);
    }

    const dirs = await fs.readdir(outputDir);
    const history = [];

    for (const dir of dirs) {
      const dirPath = path.join(outputDir, dir);
      const stats = await fs.stat(dirPath);
      
      try {
        const analysisFile = path.join(dirPath, 'analysis.json');
        if (fs.existsSync(analysisFile)) {
          const analysis = await fs.readJson(analysisFile);
          history.push({
            id: dir,
            projectName: analysis.projectName,
            description: analysis.description,
            technologies: analysis.technology,
            createdAt: stats.birthtime,
            downloadUrl: `/api/download/${dir}`
          });
        }
      } catch (error) {
        console.warn(`Could not read analysis for ${dir}:`, error);
      }
    }

    res.json(history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
}; 