import { Request, Response } from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

export const deleteAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const outputDir = path.join(__dirname, '../../output', id);
    
    if (fs.existsSync(outputDir)) {
      await fs.remove(outputDir);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Analysis not found' });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete analysis' });
  }
}; 