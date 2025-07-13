import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

// Import route handlers
import {
  healthCheck,
  getConfig,
  analyzeProject,
  downloadAnalysis,
  getHistory,
  deleteAnalysis,
  getSwaggerJson,
  getSwaggerUI
} from './routes';

// Import constants
import { DEFAULT_PORT, API_ENDPOINTS } from './config/constants';

const app = express();
const PORT = process.env.PORT || DEFAULT_PORT;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get(API_ENDPOINTS.HEALTH, healthCheck);
app.get(API_ENDPOINTS.CONFIG, getConfig);
app.post(API_ENDPOINTS.ANALYZE, analyzeProject);
app.get(API_ENDPOINTS.DOWNLOAD, downloadAnalysis);
app.get(API_ENDPOINTS.HISTORY, getHistory);
app.delete(API_ENDPOINTS.DELETE, deleteAnalysis);

// Swagger routes
app.get(API_ENDPOINTS.SWAGGER_JSON, getSwaggerJson);
app.get(API_ENDPOINTS.SWAGGER_UI, getSwaggerUI);

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Leaflet API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}${API_ENDPOINTS.HEALTH}`);
  console.log(`🔧 API docs: http://localhost:${PORT}${API_ENDPOINTS.CONFIG}`);
  console.log(`📚 Swagger UI: http://localhost:${PORT}${API_ENDPOINTS.SWAGGER_UI}`);
  console.log(`📄 Swagger JSON: http://localhost:${PORT}${API_ENDPOINTS.SWAGGER_JSON}`);
});

export default app; 