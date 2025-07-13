// Example usage of Leaflet documentation generator

const { DocumentationGenerator } = require('./dist/main.js');

async function generateDocs() {
  const aiConfig = {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyCKuvC46LCoQZeLprao0OfTy0a3TPQUd_w',
    model: 'gemini-1.5-pro',
    temperature: 0.3,
    maxTokens: 4000
  };

  const docConfig = {
    outputFormat: 'json',
    template: 'default',
    includeInline: true,
    includeApiDocs: true,
    includeSetupGuide: true,
    tone: 'friendly',
    verbosity: 'standard'
  };

  try {
    const generator = new DocumentationGenerator('./src', aiConfig, docConfig);
    const result = await generator.generateDocumentation();
    
    if (result.success) {
      console.log('✅ Documentation generated successfully!');
      console.log('Project:', result.data.projectName);
      console.log('Description:', result.data.description);
      console.log('Technologies:', result.data.technology.join(', '));
      console.log('Files analyzed:', result.data.structure.totalFiles);
      console.log('Processing time:', result.processingTime + 'ms');
      
      // Save to file
      await generator.saveDocumentation(result.data, './docs/analysis.json');
      console.log('📁 Documentation saved to ./docs/analysis.json');
    } else {
      console.error('❌ Failed to generate documentation:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateDocs(); 