/**
 * Lighthouse Performance Testing Script
 * 
 * This script runs Lighthouse audits on the application to measure performance improvements.
 * 
 * Usage:
 * 1. Start the dev server: npm start
 * 2. Run this script: node lighthouse-test.js
 * 
 * Requirements:
 * npm install -g lighthouse
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const urls = [
  'http://localhost:4200',           // Home page
  'http://localhost:4200/hotels',    // Hotel list
  'http://localhost:4200/search',    // Search page
];

const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options, config);

  await chrome.kill();

  return runnerResult.lhr;
}

async function main() {
  console.log('🚀 Starting Lighthouse Performance Tests...\n');

  const results = [];

  for (const url of urls) {
    console.log(`📊 Testing: ${url}`);
    
    try {
      const result = await runLighthouse(url);
      
      const metrics = {
        url,
        performanceScore: Math.round(result.categories.performance.score * 100),
        firstContentfulPaint: result.audits['first-contentful-paint'].displayValue,
        speedIndex: result.audits['speed-index'].displayValue,
        largestContentfulPaint: result.audits['largest-contentful-paint'].displayValue,
        timeToInteractive: result.audits['interactive'].displayValue,
        totalBlockingTime: result.audits['total-blocking-time'].displayValue,
        cumulativeLayoutShift: result.audits['cumulative-layout-shift'].displayValue,
      };

      results.push(metrics);

      console.log(`  ✅ Performance Score: ${metrics.performanceScore}/100`);
      console.log(`  ⏱️  First Contentful Paint: ${metrics.firstContentfulPaint}`);
      console.log(`  ⏱️  Speed Index: ${metrics.speedIndex}`);
      console.log(`  ⏱️  Largest Contentful Paint: ${metrics.largestContentfulPaint}`);
      console.log(`  ⏱️  Time to Interactive: ${metrics.timeToInteractive}`);
      console.log(`  ⏱️  Total Blocking Time: ${metrics.totalBlockingTime}`);
      console.log(`  📐 Cumulative Layout Shift: ${metrics.cumulativeLayoutShift}\n`);
    } catch (error) {
      console.error(`  ❌ Error testing ${url}:`, error.message);
    }
  }

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(__dirname, `lighthouse-results-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n📄 Results saved to: ${outputPath}`);
  console.log('\n✨ Performance testing complete!');
}

main().catch(console.error);
