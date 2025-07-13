import { Request, Response } from 'express';
import { swaggerConfig } from '../config/swagger';
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  SUPPORTED_FORMATS,
  SUPPORTED_TONES,
  SUPPORTED_VERBOSITY
} from '../config/constants';

export const getConfig = (req: Request, res: Response) => {
  res.json({
    apiKey: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    supportedFormats: SUPPORTED_FORMATS,
    supportedTones: SUPPORTED_TONES,
    supportedVerbosity: SUPPORTED_VERBOSITY,
    swagger: swaggerConfig
  });
}; 