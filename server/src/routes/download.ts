import { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

export const downloadAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const outputDir = path.join(__dirname, '../../output', id);
    
    if (!fs.existsSync(outputDir)) {
      return res.status(404).json({ error: 'Documentation not found' });
    }

    // For now, just return the JSON file
    const analysisFile = path.join(outputDir, 'analysis.json');
    if (fs.existsSync(analysisFile)) {
      const analysis = await fs.readJson(analysisFile);
      res.json(analysis);
    } else {
      res.status(404).json({ error: 'Analysis file not found' });
    }

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download documentation' });
  }
}; 