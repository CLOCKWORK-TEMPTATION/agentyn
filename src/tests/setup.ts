/**
 * إعداد الاختبارات
 * Test Setup for Three-Read Breakdown System
 */

import 'dotenv/config';

// إعداد متغيرات البيئة للاختبار
process.env.NODE_ENV = 'test';

// إعداد مهلة زمنية افتراضية أطول للاختبارات
jest.setTimeout(30000);

// إعداد console للاختبارات
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// تخصيص رسائل console للاختبارات
console.error = (...args: any[]) => {
  // تجاهل بعض الأخطاء المتوقعة في الاختبارات
  const message = args.join(' ');
  
  if (
    message.includes('Python service unavailable') ||
    message.includes('مفتاح API مفقود') ||
    message.includes('فشل تهيئة النموذج')
  ) {
    // هذه أخطاء متوقعة في بيئة الاختبار
    return;
  }
  
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  const message = args.join(' ');
  
  if (
    message.includes('Python service unavailable') ||
    message.includes('لا توجد نماذج متاحة') ||
    message.includes('فشل التحسين')
  ) {
    // هذه تحذيرات متوقعة في بيئة الاختبار
    return;
  }
  
  originalConsoleWarn(...args);
};

// إعداد global mocks إذا لزم الأمر
global.fetch = global.fetch || require('node-fetch');

// تنظيف بعد كل اختبار
afterEach(() => {
  // تنظيف أي موارد مفتوحة
  jest.clearAllTimers();
});

// تنظيف بعد جميع الاختبارات
afterAll(() => {
  // استعادة console الأصلي
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

console.log('🧪 تم إعداد بيئة الاختبارات للنظام');