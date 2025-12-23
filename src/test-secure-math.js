/**
 * Test script for the SecureMathEvaluator
 */

import { SecureMathEvaluator } from './utils/secure-math-evaluator.js';

// Test cases
const testCases = [
  // Valid mathematical expressions
  { input: '2 + 2', expected: 4 },
  { input: '10 * 5', expected: 50 },
  { input: 'sqrt(16)', expected: 4 },
  { input: 'pow(2, 3)', expected: 8 },
  { input: 'sin(0)', expected: 0 },
  { input: 'PI', expected: Math.PI },
  { input: 'abs(-5)', expected: 5 },
  { input: 'max(10, 20)', expected: 20 },
  
  // Invalid/dangerous expressions
  { input: 'eval("alert(1)")', shouldThrow: true },
  { input: 'Function("return 1")', shouldThrow: true },
  { input: 'console.log("test")', shouldThrow: true },
  { input: 'process.exit(0)', shouldThrow: true },
  { input: '__proto__', shouldThrow: true },
  { input: 'window.location', shouldThrow: true },
];

console.log('Testing SecureMathEvaluator...\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  try {
    const result = SecureMathEvaluator.evaluate(testCase.input);
    
    if (testCase.shouldThrow) {
      console.log(`❌ FAIL: "${testCase.input}" should have thrown an error`);
      failed++;
    } else if (Math.abs(result - testCase.expected) < 0.0001) {
      console.log(`✅ PASS: "${testCase.input}" = ${result}`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${testCase.input}" expected ${testCase.expected}, got ${result}`);
      failed++;
    }
  } catch (error) {
    if (testCase.shouldThrow) {
      console.log(`✅ PASS: "${testCase.input}" correctly threw error: ${error.message}`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${testCase.input}" threw unexpected error: ${error.message}`);
      failed++;
    }
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
