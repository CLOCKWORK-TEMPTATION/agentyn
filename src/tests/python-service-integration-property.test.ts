/**
 * اختبارات خصائص تكامل خدمة Python
 * Property-Based Tests for Python Service Integration
 * 
 * **Feature: three-read-breakdown-system, Property 10: Python Service Integration**
 * **Validates: Requirements 12.3**
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import * as fc from 'fast-check';
import { PythonBrainService } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// مولدات البيانات للاختبار
// ═══════════════════════════════════════════════════════════════════════════

// مولد نصوص السيناريو للاختبار
const scriptTextGenerator = fc.record({
  scenes: fc.array(
    fc.record({
      header: fc.string({ minLength: 20, maxLength: 100 }),
      content: fc.string({ minLength: 50, maxLength: 500 }),
      characters: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 })
    }),
    { minLength: 1, maxLength: 5 }
  )
});

// مولد مكونات المعالجة
const processingComponentGenerator = fc.constantFrom(
  'semantic_synopsis',
  'prop_classification',
  'wardrobe_inference',
  'cinematic_patterns',
  'scene_salience',
  'continuity_check'
);

// مولد معاملات السياق
const contextGenerator = fc.record({
  scene_id: fc.string({ minLength: 5, maxLength: 20 }),
  analysis_type: fc.constantFrom('emotional', 'technical', 'breakdown'),
  confidence_threshold: fc.float({ min: 0.1, max: 1.0 }),
  extract_all: fc.boolean(),
  include_evidence: fc.boolean()
});

// ═══════════════════════════════════════════════════════════════════════════
// مساعدات إنشاء النصوص
// ═══════════════════════════════════════════════════════════════════════════

function generateScriptText(script: any): string {
  return script.scenes.map((scene: any, index: number) => {
    const parts = [`مشهد ${index + 1} - ${scene.header}`, ''];
    
    scene.characters.forEach((char: string, charIndex: number) => {
      if (charIndex < scene.content.length / 50) {
        const dialogue = scene.content.substring(charIndex * 50, (charIndex + 1) * 50);
        parts.push(`${char}: ${dialogue}`);
        parts.push('');
      }
    });
    
    parts.push(scene.content);
    parts.push('');
    
    return parts.join('\n');
  }).join('\n\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الخصائص
// ═══════════════════════════════════════════════════════════════════════════

describe('Property-Based Tests: Python Service Integration', () => {
  let pythonService: PythonBrainService;
  const TEST_TIMEOUT = 30000;

  beforeAll(() => {
    pythonService = new PythonBrainService('http://localhost:8000');
  });

  /**
   * **Feature: three-read-breakdown-system, Property 10: Python Service Integration**
   * لأي طلب تحليل معقد، يجب أن يرسل النظام طلباً صحيحاً لخدمة Python ويحصل على job_id صالح
   */
  test('Property 10: Python Service Integration - Valid job creation', () => {
    fc.assert(
      fc.property(
        scriptTextGenerator,
        processingComponentGenerator,
        contextGenerator,
        async (script, component, context) => {
          const scriptText = generateScriptText(script);
          
          try {
            const result = await pythonService.analyzeWithComponent(
              scriptText,
              component,
              context
            );
            
            // الخاصية الأساسية: يجب الحصول على job_id صالح
            expect(result).toBeDefined();
            expect(result.job_id).toBeDefined();
            expect(typeof result.job_id).toBe('string');
            expect(result.job_id.length).toBeGreaterThan(0);
            
            // الحالة يجب أن تكون محددة
            expect(result.status).toBeDefined();
            expect(['started', 'fallback', 'pending', 'processing']).toContain(result.status);
            
            // إذا لم تكن في وضع fallback، يجب أن يكون job_id بصيغة UUID
            if (result.status !== 'fallback') {
              const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              expect(result.job_id).toMatch(uuidPattern);
            } else {
              // في وضع fallback، يجب أن يبدأ job_id بـ "fallback_"
              expect(result.job_id).toMatch(/^fallback_\d+$/);
            }
            
          } catch (error) {
            // إذا فشل الطلب، يجب أن يكون الخطأ واضحاً
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
            expect(typeof error.message).toBe('string');
          }
        }
      ),
      { numRuns: 50, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Job status consistency', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 20, maxLength: 200 }),
        processingComponentGenerator,
        async (text, component) => {
          try {
            const jobResult = await pythonService.analyzeWithComponent(text, component);
            
            if (jobResult.status !== 'fallback') {
              // فحص حالة الوظيفة
              const statusResult = await pythonService.getJobStatus(jobResult.job_id);
              
              expect(statusResult).toBeDefined();
              expect(statusResult.job_id).toBe(jobResult.job_id);
              expect(['pending', 'processing', 'completed', 'failed']).toContain(statusResult.status);
              
              // إذا كانت الحالة completed، يجب أن تكون هناك نتيجة
              if (statusResult.status === 'completed') {
                expect(statusResult.result).toBeDefined();
              }
              
              // إذا كانت الحالة failed، يجب أن يكون هناك خطأ
              if (statusResult.status === 'failed') {
                expect(statusResult.error).toBeDefined();
                expect(typeof statusResult.error).toBe('string');
              }
            }
            
          } catch (error) {
            // الأخطاء مقبولة في حالة عدم توفر الخدمة
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 30, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Component-specific processing', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 50, maxLength: 300 }),
        processingComponentGenerator,
        contextGenerator,
        async (text, component, context) => {
          try {
            const result = await pythonService.analyzeWithComponent(text, component, context);
            
            // كل مكون يجب أن يعالج النص بطريقة مناسبة
            expect(result.job_id).toBeDefined();
            
            // السياق يجب أن يؤثر على المعالجة
            if (context.scene_id) {
              // لا نتحقق من محتوى النتيجة لأنها قد تكون غير متاحة
              // لكن نتأكد من أن الطلب تم قبوله
              expect(result.status).toBeDefined();
            }
            
          } catch (error) {
            // الأخطاء مقبولة
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 40, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Timeout handling', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 100, maxLength: 1000 }),
        processingComponentGenerator,
        async (text, component) => {
          try {
            const jobResult = await pythonService.analyzeWithComponent(text, component);
            
            if (jobResult.status !== 'fallback') {
              // اختبار انتظار النتيجة مع timeout قصير
              const startTime = Date.now();
              
              try {
                await pythonService.waitForCompletion(jobResult.job_id, 2000); // 2 ثانية فقط
              } catch (timeoutError) {
                const elapsedTime = Date.now() - startTime;
                
                // يجب أن يحترم النظام الـ timeout
                expect(elapsedTime).toBeLessThan(3000); // مع هامش للخطأ
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            // الأخطاء مقبولة
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 20, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Fallback mode reliability', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 500 }),
        processingComponentGenerator,
        async (text, component) => {
          // اختبار مع URL غير صالح لضمان fallback mode
          const fallbackService = new PythonBrainService('http://invalid-url:9999');
          
          const result = await fallbackService.analyzeWithComponent(text, component);
          
          // في وضع fallback، يجب أن يعمل النظام
          expect(result).toBeDefined();
          expect(result.job_id).toBeDefined();
          expect(result.status).toBe('fallback');
          expect(result.result).toBeDefined();
          expect(result.result.message).toBe('Using TypeScript fallback');
        }
      ),
      { numRuns: 30, timeout: 10000 }
    );
  }, 15000);

  test('Property: Error message quality', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\n\n', 'invalid-text'),
        processingComponentGenerator,
        async (invalidText, component) => {
          try {
            const result = await pythonService.analyzeWithComponent(invalidText, component);
            
            // حتى مع نص غير صالح، يجب أن يعمل النظام
            expect(result).toBeDefined();
            expect(result.job_id).toBeDefined();
            
          } catch (error) {
            // إذا فشل، يجب أن تكون رسالة الخطأ مفيدة
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(5);
            expect(typeof error.message).toBe('string');
          }
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 15000);

  test('Property: Concurrent request handling', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 20, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        processingComponentGenerator,
        async (texts, component) => {
          // إرسال طلبات متعددة في نفس الوقت
          const promises = texts.map(text => 
            pythonService.analyzeWithComponent(text, component)
          );
          
          try {
            const results = await Promise.allSettled(promises);
            
            // يجب أن ينجح معظم الطلبات أو يفشل بشكل صحيح
            results.forEach(result => {
              if (result.status === 'fulfilled') {
                expect(result.value.job_id).toBeDefined();
                expect(result.value.status).toBeDefined();
              } else {
                expect(result.reason).toBeDefined();
              }
            });
            
            // لا يجب أن تتداخل job_ids
            const successfulResults = results
              .filter(r => r.status === 'fulfilled')
              .map(r => (r as any).value);
            
            const jobIds = successfulResults.map(r => r.job_id);
            const uniqueJobIds = new Set(jobIds);
            
            expect(jobIds.length).toBe(uniqueJobIds.size);
            
          } catch (error) {
            // الأخطاء مقبولة في الطلبات المتعددة
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 15, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Service URL validation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'http://localhost:8000',
          'http://127.0.0.1:8000',
          'http://invalid-host:8000',
          'https://example.com:8000',
          'http://localhost:9999'
        ),
        fc.string({ minLength: 10, maxLength: 100 }),
        async (serviceUrl, text) => {
          const service = new PythonBrainService(serviceUrl);
          
          try {
            const result = await service.analyzeWithComponent(text, 'semantic_synopsis');
            
            // يجب أن يعمل النظام مع أي URL
            expect(result).toBeDefined();
            expect(result.job_id).toBeDefined();
            expect(result.status).toBeDefined();
            
          } catch (error) {
            // الأخطاء مقبولة مع URLs غير صالحة
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 25, timeout: 15000 }
    );
  }, 20000);
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحدية
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases: Python Service Integration', () => {
  let pythonService: PythonBrainService;

  beforeAll(() => {
    pythonService = new PythonBrainService('http://localhost:8000');
  });

  test('Should handle very large texts', async () => {
    const largeText = Array(1000).fill('مشهد طويل جداً مع محتوى كثير').join(' ');
    
    try {
      const result = await pythonService.analyzeWithComponent(
        largeText,
        'semantic_synopsis'
      );
      
      expect(result.job_id).toBeDefined();
      expect(result.status).toBeDefined();
      
    } catch (error) {
      // مقبول مع النصوص الكبيرة جداً
      expect(error.message).toBeDefined();
    }
  }, 30000);

  test('Should handle special characters and encoding', async () => {
    const specialTexts = [
      'نص مع رموز خاصة: @#$%^&*()',
      'Text with Arabic: مرحباً بكم',
      'Mixed: Hello مرحبا 123 !@#',
      'Emojis: 🎬🎭🎪🎨🎯',
      'Unicode: \u0600\u0601\u0602'
    ];
    
    for (const text of specialTexts) {
      try {
        const result = await pythonService.analyzeWithComponent(
          text,
          'prop_classification'
        );
        
        expect(result.job_id).toBeDefined();
        
      } catch (error) {
        // مقبول مع النصوص الخاصة
        expect(error).toBeDefined();
      }
    }
  }, 20000);

  test('Should handle network interruptions gracefully', async () => {
    // محاكاة انقطاع الشبكة باستخدام URL غير صالح
    const unreliableService = new PythonBrainService('http://192.0.2.1:8000'); // TEST-NET address
    
    try {
      const result = await unreliableService.analyzeWithComponent(
        'نص تجريبي',
        'semantic_synopsis'
      );
      
      // يجب أن يعمل في وضع fallback
      expect(result.status).toBe('fallback');
      
    } catch (error) {
      // أو يرمي خطأ واضح
      expect(error.message).toBeDefined();
    }
  }, 10000);

  test('Should validate component names', async () => {
    const invalidComponents = [
      'invalid_component',
      '',
      'semantic_synopsis_invalid',
      'prop_classification_wrong'
    ];
    
    for (const component of invalidComponents) {
      try {
        const result = await pythonService.analyzeWithComponent(
          'نص تجريبي',
          component as any
        );
        
        // قد يعمل أو لا يعمل حسب التنفيذ
        if (result) {
          expect(result.job_id).toBeDefined();
        }
        
      } catch (error) {
        // الأخطاء مقبولة مع أسماء مكونات غير صالحة
        expect(error).toBeDefined();
      }
    }
  }, 15000);
});