/**
 * k6 Load Testing Script for Hotel Booking API
 * 
 * This script tests the performance of the backend API under load.
 * 
 * Installation:
 * - Windows: choco install k6
 * - macOS: brew install k6
 * - Linux: See https://k6.io/docs/getting-started/installation/
 * 
 * Usage:
 * k6 run load-test.js
 * 
 * Test Scenarios:
 * - Ramp up to 50 users over 30 seconds
 * - Maintain 50 users for 1 minute
 * - Ramp down to 0 users over 30 seconds
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    errors: ['rate<0.1'],             // Custom error rate below 10%
  },
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
  // Test 1: Get all hotels (should be cached)
  let response = http.get(`${BASE_URL}/hotels`);
  check(response, {
    'hotels list status is 200': (r) => r.status === 200,
    'hotels list response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get specific hotel (should be cached)
  response = http.get(`${BASE_URL}/hotels/1`);
  check(response, {
    'hotel detail status is 200': (r) => r.status === 200,
    'hotel detail response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Search hotels
  response = http.get(`${BASE_URL}/hotels/search?city=New York`);
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}========================================\n`;
  summary += `${indent}Load Test Results Summary\n`;
  summary += `${indent}========================================\n\n`;

  // HTTP metrics
  summary += `${indent}HTTP Metrics:\n`;
  summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `${indent}  Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += `${indent}  Average Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max Duration: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;

  // Virtual Users
  summary += `${indent}Virtual Users:\n`;
  summary += `${indent}  Max VUs: ${data.metrics.vus_max.values.max}\n`;
  summary += `${indent}  Average VUs: ${data.metrics.vus.values.value.toFixed(2)}\n\n`;

  // Checks
  summary += `${indent}Checks:\n`;
  summary += `${indent}  Passed: ${data.metrics.checks.values.passes}\n`;
  summary += `${indent}  Failed: ${data.metrics.checks.values.fails}\n`;
  summary += `${indent}  Pass Rate: ${((data.metrics.checks.values.passes / (data.metrics.checks.values.passes + data.metrics.checks.values.fails)) * 100).toFixed(2)}%\n\n`;

  summary += `${indent}========================================\n`;

  return summary;
}
