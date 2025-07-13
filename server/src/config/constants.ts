export const DEFAULT_PORT = 4000;
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
export const DEFAULT_TEMPERATURE = 0.3;
export const DEFAULT_MAX_TOKENS = 4000;

export const SUPPORTED_FORMATS = ['json', 'markdown', 'html'] as const;
export const SUPPORTED_TONES = ['technical', 'friendly', 'formal'] as const;
export const SUPPORTED_VERBOSITY = ['minimal', 'standard', 'detailed'] as const;

export const DEFAULT_BRANCH = 'main';
export const DEFAULT_OUTPUT_FORMAT = 'json';
export const DEFAULT_TONE = 'friendly';
export const DEFAULT_VERBOSITY = 'standard';

export const API_ENDPOINTS = {
  HEALTH: '/health',
  CONFIG: '/api/config',
  ANALYZE: '/api/analyze',
  DOWNLOAD: '/api/download/:id',
  HISTORY: '/api/history',
  DELETE: '/api/analysis/:id',
  SWAGGER_JSON: '/api/swagger.json',
  SWAGGER_UI: '/api/docs'
} as const; 