#!/usr/bin/env node

import { build } from 'vite';
import { readFileSync, writeFileSync } from 'fs';

async function buildApp() {
  try {
    // Build with Vite
    await build();
    
    // Create the Cloudflare Pages worker file
    const workerContent = `
import app from '../src/index.tsx';

export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  }
};
`;
    
    writeFileSync('dist/_worker.js', workerContent);
    
    // Create routes configuration
    const routesContent = JSON.stringify({
      "version": 1,
      "include": ["/*"],
      "exclude": ["/static/*"]
    }, null, 2);
    
    writeFileSync('dist/_routes.json', routesContent);
    
    console.log('✅ Build completato con successo!');
    console.log('📁 File generati in ./dist/');
    
  } catch (error) {
    console.error('❌ Errore durante il build:', error);
    process.exit(1);
  }
}

buildApp();