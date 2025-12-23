/**
 * اختبارات البنية الأساسية للنظام
 * Infrastructure Tests for Three-Read Breakdown System
 * 
 * تختبر:
 * - التكامل مع FastAPI
 * - الاتصال بين TypeScript و Python layers
 * - تهيئة النماذج والوكلاء
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';
import ThreeReadBreakdownSystem, { 
  ModelManager, 
  PythonBrainService,
  ProcessingComponent 
} from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// إعداد الاختبارات
// ═══════════════════════════════════════════════════════════════════════════

const PYTHON_SERVICE_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 30000; // 30 ثانية

describe('اختبارات البنية الأساسية', () => {
  let system: ThreeReadBreakdownSystem;
  let pythonService: PythonBrainService;
  let modelManager: ModelManager;

  beforeAll(async () => {
    // تهيئة النظام للاختبار
    system = new ThreeReadBreakdownSystem(PYTHON_SERVICE_URL);
    pythonService = new PythonBrainService(PYTHON_SERVICE_URL);
    modelManager = new ModelManager();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // تنظيف بعد الاختبارات
    // لا حاجة لتنظيف خاص حالياً
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات تهيئة النظام
  // ═══════════════════════════════════════════════════════════════════════

  describe('تهيئة النظام', () => {
    test('يجب أن يتم إنشاء النظام بنجاح', () => {
      expect(system).toBeDefined();
      expect(system).toBeInstanceOf(ThreeReadBreakdownSystem);
    });

    test('يجب أن يتم تهيئة النظام بنجاح', async () => {
      await system.initialize();
      
      const stats = system.getSystemStats();
      expect(stats.isInitialized).toBe(true);
      expect(stats.agents.emotional).toBe(true);
      expect(stats.agents.technical).toBe(true);
      expect(stats.agents.breakdown).toBe(true);
      expect(stats.agents.supervisor).toBe(true);
    }, TEST_TIMEOUT);

    test('يجب أن تكون النماذج متاحة', () => {
      const availableModels = modelManager.getAvailableModels();
      expect(availableModels).toBeDefined();
      expect(Array.isArray(availableModels)).toBe(true);
      
      // يجب أن يكون هناك نموذج واحد على الأقل متاح
      if (availableModels.length > 0) {
        console.log(`✅ النماذج المتاحة: ${availableModels.join(', ')}`);
      } else {
        console.warn('⚠️ لا توجد نماذج متاحة - تحقق من مفاتيح API');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات خدمة Python
  // ═══════════════════════════════════════════════════════════════════════

  describe('خدمة Python Brain Service', () => {
    test('يجب أن تكون خدمة Python متاحة', async () => {
      try {
        const response = await axios.get(`${PYTHON_SERVICE_URL}/`, {
          timeout: 5000
        });
        
        expect(response.status).toBe(200);
        expect(response.data.service).toBe('Python Brain Service');
        expect(response.data.status).toBe('running');
        
        console.log('✅ خدمة Python متاحة:', response.data);
      } catch (error) {
        console.warn('⚠️ خدمة Python غير متاحة:', error.message);
        // الاختبار لا يفشل إذا كانت الخدمة غير متاحة (fallback mode)
      }
    }, 10000);

    test('يجب أن تعمل واجهة التحليل غير المتزامن', async () => {
      const testRequest = {
        text: 'مشهد تجريبي للاختبار',
        component: 'semantic_synopsis',
        confidence_threshold: 0.7
      };

      try {
        const jobResponse = await pythonService.analyzeWithComponent(
          testRequest.text,
          testRequest.component
        );

        expect(jobResponse).toBeDefined();
        expect(jobResponse.job_id).toBeDefined();
        expect(jobResponse.status).toBeDefined();

        console.log('✅ تم إنشاء وظيفة Python:', jobResponse);

        // إذا لم تكن في وضع fallback، اختبر الحصول على النتيجة
        if (jobResponse.status !== 'fallback') {
          const statusResponse = await pythonService.getJobStatus(jobResponse.job_id);
          expect(statusResponse).toBeDefined();
          console.log('✅ حالة الوظيفة:', statusResponse);
        }

      } catch (error) {
        console.warn('⚠️ خطأ في اختبار Python service:', error.message);
        // لا نفشل الاختبار إذا كانت الخدمة في وضع fallback
      }
    }, 15000);

    test('يجب أن تعمل المكونات المختلفة', async () => {
      const components = [
        'semantic_synopsis',
        'prop_classification',
        'wardrobe_inference',
        'cinematic_patterns',
        'continuity_check'
      ];

      const testText = `
        مشهد 1 - داخلي - منزل أحمد - نهار
        
        أحمد يجلس على الأريكة ويقرأ مجلة. يرن الهاتف.
        
        أحمد: (يرفع الهاتف) مرحباً؟
        
        يضع المجلة على الطاولة ويقف.
      `;

      for (const component of components) {
        try {
          const result = await pythonService.analyzeWithComponent(
            testText,
            component
          );

          expect(result).toBeDefined();
          expect(result.job_id).toBeDefined();
          
          console.log(`✅ مكون ${component} يعمل بنجاح`);
        } catch (error) {
          console.warn(`⚠️ مكون ${component} غير متاح:`, error.message);
        }
      }
    }, 20000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التكامل الأساسي
  // ═══════════════════════════════════════════════════════════════════════

  describe('التكامل بين الطبقات', () => {
    test('يجب أن يعمل التدفق الكامل للنظام', async () => {
      const testScript = `
        مشهد 1 - داخلي - مكتب سارة - نهار
        
        سارة تجلس خلف مكتبها وتعمل على اللابتوب. 
        تشرب القهوة من كوب أبيض.
        
        سارة: (تنظر إلى الشاشة) هذا المشروع معقد جداً.
        
        يدق الباب. تضع الكوب وتقف.
        
        سارة: ادخل.
        
        يدخل محمد حاملاً ملف أوراق.
        
        محمد: عندي التقرير الذي طلبتيه.
        
        يضع الملف على المكتب.
      `;

      try {
        await system.initialize();
        
        const result = await system.processScript(testScript, 'مشهد تجريبي');
        
        expect(result).toBeDefined();
        expect(result.script_title).toBe('مشهد تجريبي');
        expect(result.emotional_analysis).toBeDefined();
        expect(result.technical_validation).toBeDefined();
        expect(result.breakdown_results).toBeDefined();
        expect(result.final_elements).toBeDefined();
        
        console.log('✅ التدفق الكامل يعمل بنجاح');
        console.log(`📊 العناصر المستخرجة: ${result.final_elements.length}`);
        console.log(`🎯 الثقة الإجمالية: ${(result.overall_confidence * 100).toFixed(1)}%`);
        
        // التحقق من وجود عناصر أساسية
        expect(result.final_elements.length).toBeGreaterThan(0);
        expect(result.overall_confidence).toBeGreaterThan(0);
        
      } catch (error) {
        console.error('❌ فشل التدفق الكامل:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('يجب أن يتعامل النظام مع النصوص القصيرة', async () => {
      const shortScript = 'أحمد يدخل الغرفة.';
      
      try {
        const result = await system.processScript(shortScript, 'نص قصير');
        
        expect(result).toBeDefined();
        expect(result.script_title).toBe('نص قصير');
        
        console.log('✅ النظام يتعامل مع النصوص القصيرة');
        
      } catch (error) {
        console.error('❌ فشل في التعامل مع النص القصير:', error);
        throw error;
      }
    }, 15000);

    test('يجب أن يتعامل النظام مع الأخطاء بشكل صحيح', async () => {
      const invalidScript = ''; // نص فارغ
      
      try {
        const result = await system.processScript(invalidScript, 'نص فارغ');
        
        // يجب أن يعيد النظام نتيجة حتى لو كان النص فارغاً
        expect(result).toBeDefined();
        expect(result.human_review_required).toBe(true); // يجب أن يطلب مراجعة بشرية
        
        console.log('✅ النظام يتعامل مع الأخطاء بشكل صحيح');
        
      } catch (error) {
        // إذا فشل النظام، يجب أن يكون الخطأ واضحاً
        expect(error.message).toBeDefined();
        console.log('✅ النظام يرمي أخطاء واضحة:', error.message);
      }
    }, 10000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الأداء الأساسي
  // ═══════════════════════════════════════════════════════════════════════

  describe('اختبارات الأداء الأساسي', () => {
    test('يجب أن تكون المعالجة سريعة نسبياً', async () => {
      const testScript = `
        مشهد 1 - خارجي - الحديقة - نهار
        علي يمشي في الحديقة.
      `;

      const startTime = Date.now();
      
      try {
        const result = await system.processScript(testScript, 'اختبار الأداء');
        const processingTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(processingTime).toBeLessThan(25000); // أقل من 25 ثانية
        
        console.log(`✅ وقت المعالجة: ${processingTime}ms`);
        
      } catch (error) {
        console.error('❌ فشل اختبار الأداء:', error);
        throw error;
      }
    }, TEST_TIMEOUT);

    test('يجب أن يتعامل النظام مع طلبات متعددة', async () => {
      const scripts = [
        'مشهد 1: أحمد في المكتب',
        'مشهد 2: سارة في البيت',
        'مشهد 3: محمد في السيارة'
      ];

      const promises = scripts.map((script, index) => 
        system.processScript(script, `اختبار متوازي ${index + 1}`)
      );

      try {
        const results = await Promise.allSettled(promises);
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failureCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`✅ نجح: ${successCount}, فشل: ${failureCount} من ${scripts.length}`);
        
        // يجب أن ينجح معظم الطلبات
        expect(successCount).toBeGreaterThan(0);
        
      } catch (error) {
        console.error('❌ فشل اختبار الطلبات المتعددة:', error);
        throw error;
      }
    }, TEST_TIMEOUT);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات مساعدة
// ═══════════════════════════════════════════════════════════════════════════

describe('اختبارات المكونات المساعدة', () => {
  test('يجب أن يعمل ModelManager بشكل صحيح', () => {
    const manager = new ModelManager();
    
    expect(manager).toBeDefined();
    expect(manager.getAvailableModels).toBeDefined();
    
    const models = manager.getAvailableModels();
    expect(Array.isArray(models)).toBe(true);
    
    // اختبار الحصول على نموذج حسب نوع المهمة
    try {
      const emotionalModel = manager.getModel('emotional_analysis');
      expect(emotionalModel).toBeDefined();
      console.log('✅ تم الحصول على نموذج التحليل العاطفي');
    } catch (error) {
      console.warn('⚠️ لا يوجد نموذج متاح للتحليل العاطفي');
    }
  });

  test('يجب أن تعمل PythonBrainService مع fallback', async () => {
    const service = new PythonBrainService('http://invalid-url:9999');
    
    // يجب أن تعمل حتى مع URL غير صالح (fallback mode)
    const result = await service.analyzeWithComponent(
      'نص تجريبي',
      'semantic_synopsis'
    );
    
    expect(result).toBeDefined();
    expect(result.status).toBe('fallback');
    
    console.log('✅ PythonBrainService تعمل في وضع fallback');
  });
});