#!/usr/bin/env node

/**
 * Wait for Vite dev server to be ready before Tauri starts
 * This prevents white screen issues by ensuring the server is up
 */

const http = require('http');

const PORT = 3000;
const HOST = '127.0.0.1';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1 second

function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function waitForVite() {
  console.log(`Waiting for Vite dev server at http://${HOST}:${PORT}...`);
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const isReady = await checkServer();
      if (isReady) {
        console.log(`✅ Vite dev server is ready at http://${HOST}:${PORT}`);
        process.exit(0);
      }
    } catch (err) {
      // Server not ready yet
    }
    
    if (i < MAX_RETRIES - 1) {
      process.stdout.write(`Attempt ${i + 1}/${MAX_RETRIES}...\r`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  console.error(`❌ Vite dev server did not become ready after ${MAX_RETRIES} attempts`);
  console.error(`   Make sure Vite is running on http://${HOST}:${PORT}`);
  process.exit(1);
}

waitForVite();


