export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Leaflet Documentation Generator API',
    description: 'AI-powered documentation generator that analyzes repositories and generates comprehensive documentation',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check if the API is running',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    service: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/config': {
      get: {
        summary: 'Get API configuration',
        description: 'Returns current API settings and supported options',
        responses: {
          '200': {
            description: 'Configuration details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    apiKey: { type: 'string' },
                    model: { type: 'string' },
                    temperature: { type: 'number' },
                    maxTokens: { type: 'number' },
                    supportedFormats: { type: 'array', items: { type: 'string' } },
                    supportedTones: { type: 'array', items: { type: 'string' } },
                    supportedVerbosity: { type: 'array', items: { type: 'string' } },
                    swagger: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/analyze': {
      post: {
        summary: 'Analyze a project',
        description: 'Import a repository, scan files, and generate documentation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  projectPath: {
                    type: 'string',
                    description: 'Path to the project directory'
                  },
                  repoUrl: {
                    type: 'string',
                    description: 'GitHub/GitLab repository URL to clone and analyze'
                  },
                  branch: {
                    type: 'string',
                    default: 'main',
                    description: 'Branch to clone (default: main)'
                  },
                  outputFormat: {
                    type: 'string',
                    enum: ['json', 'markdown', 'html'],
                    default: 'json'
                  },
                  tone: {
                    type: 'string',
                    enum: ['technical', 'friendly', 'formal'],
                    default: 'friendly'
                  },
                  verbosity: {
                    type: 'string',
                    enum: ['minimal', 'standard', 'detailed'],
                    default: 'standard'
                  },
                  includeApiDocs: {
                    type: 'boolean',
                    default: false
                  },
                  includeSetupGuide: {
                    type: 'boolean',
                    default: false
                  },
                  includeInline: {
                    type: 'boolean',
                    default: false
                  },
                  apiKey: {
                    type: 'string',
                    description: 'Optional API key override'
                  },
                  hostOnLeaflet: {
                    type: 'boolean',
                    description: 'If true, host the generated documentation on Leaflet and return a hosted URL',
                    default: false
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Analysis completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        projectName: { type: 'string' },
                        description: { type: 'string' },
                        technology: { type: 'array', items: { type: 'string' } },
                        structure: { type: 'object' },
                        dependencies: { type: 'array' },
                        entryPoints: { type: 'array', items: { type: 'string' } },
                        documentation: { type: 'array' },
                        metadata: { type: 'object' }
                      }
                    },
                    processingTime: { type: 'number' },
                    outputPath: { type: 'string' },
                    downloadUrl: { type: 'string' },
                    importedPath: { type: 'string' },
                    hostedUrl: { type: 'string', nullable: true, description: 'URL to the hosted documentation if hostOnLeaflet was true' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request - missing project path or invalid parameters'
          },
          '500': {
            description: 'Internal server error - AI analysis failed'
          }
        }
      }
    },
    '/api/download/{id}': {
      get: {
        summary: 'Download analysis results',
        description: 'Get the generated documentation for a specific analysis',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Analysis ID'
          }
        ],
        responses: {
          '200': {
            description: 'Analysis results',
            content: {
              'application/json': {
                schema: { type: 'object' }
              }
            }
          },
          '404': {
            description: 'Analysis not found'
          }
        }
      }
    },
    '/api/history': {
      get: {
        summary: 'Get analysis history',
        description: 'List all previous analyses',
        responses: {
          '200': {
            description: 'List of analyses',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      projectName: { type: 'string' },
                      description: { type: 'string' },
                      technologies: { type: 'array', items: { type: 'string' } },
                      createdAt: { type: 'string' },
                      downloadUrl: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/analysis/{id}': {
      delete: {
        summary: 'Delete analysis',
        description: 'Delete a specific analysis and its files',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Analysis ID'
          }
        ],
        responses: {
          '200': {
            description: 'Analysis deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Analysis not found'
          }
        }
      }
    }
  }
}; 