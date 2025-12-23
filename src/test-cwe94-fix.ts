/**
 * Security test for CWE-94 fix
 * Verifies that the SecureMathParser prevents code injection
 */

import { SecureMathParser } from './utils/secure-math-parser.js';

// Security test cases for CWE-94
const securityTests = [
  // Valid mathematical expressions
  { input: '2 + 2', shouldPass: true },
  { input: 'sqrt(16)', shouldPass: true },
  { input: 'sin(PI/2)', shouldPass: true },
  { input: 'pow(2, 8)', shouldPass: true },
  { input: 'abs(-42)', shouldPass: true },
  { input: 'max(10, 20, 30)', shouldPass: true },
  { input: 'floor(3.14159)', shouldPass: true },
  
  // Code injection attempts (should fail)
  { input: 'eval("alert(1)")', shouldPass: false },
  { input: 'Function("return 1")', shouldPass: false },
  { input: 'new Function("return 1")', shouldPass: false },
  { input: 'constructor.constructor("return 1")', shouldPass: false },
  { input: '__proto__.polluted', shouldPass: false },
  { input: 'prototype.polluted', shouldPass: false },
  { input: 'window.location', shouldPass: false },
  { input: 'document.cookie', shouldPass: false },
  { input: 'process.env', shouldPass: false },
  { input: 'global.process', shouldPass: false },
  { input: 'require("fs")', shouldPass: false },
  { input: 'import("fs")', shouldPass: false },
  { input: 'console.log("test")', shouldPass: false },
  { input: 'setTimeout(() => {}, 0)', shouldPass: false },
  { input: 'setInterval(() => {}, 0)', shouldPass: false },
  { input: 'fetch("http://evil.com")', shouldPass: false },
  { input: '(()=>{return 1})()', shouldPass: false },
  { input: 'x=>x', shouldPass: false },
  { input: '{a:1}', shouldPass: false },
  { input: '[1,2,3]', shouldPass: false },
  { input: '`malicious`', shouldPass: false },
  { input: '"string".constructor', shouldPass: false },
  { input: '1..constructor', shouldPass: false },
  { input: '1["constructor"]', shouldPass: false },
  { input: 'throw new Error()', shouldPass: false },
  { input: 'try{}catch(e){}', shouldPass: false },
  { input: 'if(1){}', shouldPass: false },
  { input: 'for(;;){}', shouldPass: false },
  { input: 'while(1){}', shouldPass: false },
  { input: 'do{}while(1)', shouldPass: false },
  { input: 'switch(1){}', shouldPass: false },
  { input: 'function x(){}', shouldPass: false },
  { input: 'class X{}', shouldPass: false },
  { input: 'var x=1', shouldPass: false },
  { input: 'let x=1', shouldPass: false },
  { input: 'const x=1', shouldPass: false },
  { input: 'delete x', shouldPass: false },
  { input: 'typeof x', shouldPass: false },
  { input: 'instanceof Object', shouldPass: false },
  { input: 'in Object', shouldPass: false },
  { input: 'void 0', shouldPass: false },
  { input: 'yield 1', shouldPass: false },
  { input: 'await 1', shouldPass: false },
  { input: 'async()=>1', shouldPass: false },
  { input: 'return 1', shouldPass: false },
  { input: 'break', shouldPass: false },
  { input: 'continue', shouldPass: false },
  { input: 'debugger', shouldPass: false },
  { input: 'with({})', shouldPass: false },
  { input: 'label: x', shouldPass: false },
  { input: 'goto x', shouldPass: false },
  { input: 'export default', shouldPass: false },
  { input: 'import * from', shouldPass: false },
  { input: 'from "fs"', shouldPass: false },
  { input: 'as x', shouldPass: false },
  { input: 'of x', shouldPass: false }
];

console.log('🔒 Testing CWE-94 Security Fix\n');

let passed = 0;
let failed = 0;

for (const test of securityTests) {
  try {
    const result = SecureMathParser.evaluate(test.input);
    
    if (test.shouldPass) {
      console.log(`✅ PASS: "${test.input}" = ${result}`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${test.input}" should have been rejected but returned ${result}`);
      failed++;
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log(`✅ PASS: "${test.input}" correctly rejected: ${(error as Error).message}`);
      passed++;
    } else {
      console.log(`❌ FAIL: "${test.input}" should have passed but threw: ${(error as Error).message}`);
      failed++;
    }
  }
}

console.log(`\n📊 Security Test Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🔒 Security Score: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All security tests passed! CWE-94 has been successfully fixed.');
} else {
  console.log('\n⚠️ Some security tests failed. Review the implementation.');
}

// Performance test
console.log('\n⚡ Performance Test:');
const start = performance.now();
for (let i = 0; i < 1000; i++) {
  SecureMathParser.evaluate('sin(PI/4) + cos(PI/4) + sqrt(2) * pow(2, 3)');
}
const end = performance.now();
console.log(`1000 evaluations took ${(end - start).toFixed(2)}ms`);
console.log(`Average: ${((end - start) / 1000).toFixed(4)}ms per evaluation`);
