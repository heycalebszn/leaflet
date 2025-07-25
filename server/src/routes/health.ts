import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Leaflet Documentation Generator'
  });
}; 