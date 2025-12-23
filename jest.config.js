/**
 * إعداد Jest للاختبارات
 * Jest Configuration for Three-Read Breakdown System Tests
 */

export default {
  // البيئة
  testEnvironment: 'node',
  
  // الملفات المدعومة
  extensionsToTreatAsEsm: ['.ts'],
  
  // تحويل TypeScript
  preset: 'ts-jest/presets/default-esm',
  
  // مجلدات الاختبارات
  testMatch: [
    '**/src/tests/**/*.test.ts',
    '**/tests/**/*.test.ts',
    '**/__tests__/**/*.test.ts'
  ],
  
  // تجاهل الملفات
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // إعداد الوحدات
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // مهلة زمنية للاختبارات
  testTimeout: 30000,
  
  // تقارير التغطية
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // ملفات الإعداد
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  
  // متغيرات البيئة للاختبار
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // إعدادات إضافية
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // تحويل الملفات
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2022'
      }
    }]
  }
};