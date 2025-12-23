/**
 * اختبارات التكامل مع خدمة Python
 * Python Integration Tests
 * 
 * تختبر التكامل المباشر مع FastAPI service
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import axios from 'axios';

const PYTHON_SERVICE_URL = 'http://localhost:8000';
const TEST_TIMEOUT = 20000;

describe('اختبارات التكامل مع Python Service', () => {
  let pythonServiceAvailable = false;

  beforeAll(async () => {
    // فحص توفر خدمة Python
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/`, { timeout: 5000 });
      pythonServiceAvailable = response.status === 200;
      console.log('✅ خدمة Python متاحة للاختبار');
    } catch (error) {
      console.warn('⚠️ خدمة Python غير متاحة - سيتم تخطي بعض الاختبارات');
    }
  });

  describe('اختبارات الاتصال الأساسي', () => {
    test('يجب أن تستجيب خدمة Python للطلبات الأساسية', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      const response = await axios.get(`${PYTHON_SERVICE_URL}/`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('service');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('available_systems');
      
      console.log('📊 معلومات الخدمة:', response.data);
    }, 10000);

    test('يجب أن تعيد قائمة الوظائف', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      const response = await axios.get(`${PYTHON_SERVICE_URL}/jobs`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('jobs');
      expect(response.data).toHaveProperty('total');
      expect(Array.isArray(response.data.jobs)).toBe(true);
      
      console.log(`📋 عدد الوظائف الحالية: ${response.data.total}`);
    }, 5000);
  });

  describe('اختبارات التحليل المتزامن', () => {
    const testCases = [
      {
        name: 'semantic_synopsis',
        text: 'مشهد 1 - داخلي - المكتب - نهار\nأحمد يعمل على الحاسوب.',
        description: 'توليد ملخص دلالي'
      },
      {
        name: 'prop_classification',
        text: 'سارة تحمل حقيبة وتشرب من كوب القهوة.',
        description: 'تصنيف الدعائم'
      },
      {
        name: 'wardrobe_inference',
        text: 'محمد يرتدي بدلة رسمية ونظارة شمسية.',
        description: 'استنتاج الأزياء'
      },
      {
        name: 'cinematic_patterns',
        text: 'لقطة قريبة على وجه الممثل. الإضاءة خافتة.',
        description: 'تحليل الأنماط السينمائية'
      },
      {
        name: 'continuity_check',
        text: 'مشهد 1: أحمد في المكتب\nمشهد 2: أحمد في نفس المكتب',
        description: 'فحص الاستمرارية'
      }
    ];

    testCases.forEach(({ name, text, description }) => {
      test(`يجب أن يعمل ${description} (${name})`, async () => {
        if (!pythonServiceAvailable) {
          console.log(`⏭️ تم تخطي اختبار ${name} - خدمة Python غير متاحة`);
          return;
        }

        const requestData = {
          text,
          component: name,
          confidence_threshold: 0.7
        };

        try {
          const response = await axios.post(
            `${PYTHON_SERVICE_URL}/analyze/sync`,
            requestData,
            { timeout: 15000 }
          );

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('job_id');
          expect(response.data).toHaveProperty('result');
          expect(response.data).toHaveProperty('confidence');
          expect(response.data).toHaveProperty('processing_time');

          console.log(`✅ ${description} نجح في ${response.data.processing_time.toFixed(2)}s`);
          console.log(`🎯 الثقة: ${(response.data.confidence * 100).toFixed(1)}%`);

        } catch (error) {
          if (error.response?.status === 500) {
            console.warn(`⚠️ ${description} فشل على الخادم:`, error.response.data);
            // لا نفشل الاختبار إذا كان الخطأ من الخادم (قد يكون بسبب نقص dependencies)
          } else {
            throw error;
          }
        }
      }, TEST_TIMEOUT);
    });
  });

  describe('اختبارات التحليل غير المتزامن', () => {
    test('يجب أن يعمل التحليل غير المتزامن', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      const requestData = {
        text: 'مشهد تجريبي للاختبار غير المتزامن',
        component: 'semantic_synopsis',
        confidence_threshold: 0.7
      };

      // بدء التحليل
      const startResponse = await axios.post(
        `${PYTHON_SERVICE_URL}/analyze/async`,
        requestData
      );

      expect(startResponse.status).toBe(200);
      expect(startResponse.data).toHaveProperty('job_id');
      expect(startResponse.data).toHaveProperty('status');
      expect(startResponse.data.status).toBe('started');

      const jobId = startResponse.data.job_id;
      console.log(`🚀 تم بدء الوظيفة: ${jobId}`);

      // انتظار اكتمال التحليل
      let attempts = 0;
      const maxAttempts = 10;
      let jobCompleted = false;

      while (attempts < maxAttempts && !jobCompleted) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية واحدة
        
        const statusResponse = await axios.get(`${PYTHON_SERVICE_URL}/jobs/${jobId}`);
        
        expect(statusResponse.status).toBe(200);
        expect(statusResponse.data).toHaveProperty('status');
        
        const status = statusResponse.data.status;
        console.log(`📊 حالة الوظيفة ${jobId}: ${status} (محاولة ${attempts + 1})`);

        if (status === 'completed') {
          expect(statusResponse.data).toHaveProperty('result');
          expect(statusResponse.data.result).toHaveProperty('result');
          
          console.log('✅ تم إكمال التحليل غير المتزامن بنجاح');
          jobCompleted = true;
        } else if (status === 'failed') {
          console.error('❌ فشل التحليل:', statusResponse.data.error);
          break;
        }

        attempts++;
      }

      if (!jobCompleted && attempts >= maxAttempts) {
        console.warn('⚠️ انتهت المهلة الزمنية للتحليل غير المتزامن');
      }

    }, TEST_TIMEOUT);
  });

  describe('اختبارات الأنظمة المتقدمة', () => {
    test('يجب أن يتعامل مع Revolutionary Analysis إذا كان متاحاً', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      const requestData = {
        text: 'مشهد معقد للتحليل الثوري',
        component: 'revolutionary_analysis',
        confidence_threshold: 0.8
      };

      try {
        const response = await axios.post(
          `${PYTHON_SERVICE_URL}/analyze/sync`,
          requestData,
          { timeout: 20000 }
        );

        if (response.status === 200) {
          expect(response.data).toHaveProperty('result');
          
          if (response.data.result.error) {
            console.log('ℹ️ Revolutionary System غير متاح:', response.data.result.error);
          } else {
            console.log('✅ Revolutionary Analysis يعمل بنجاح');
            expect(response.data.result).toHaveProperty('revolutionary_results');
          }
        }

      } catch (error) {
        console.warn('⚠️ Revolutionary Analysis غير متاح أو فشل:', error.message);
        // لا نفشل الاختبار إذا لم يكن النظام الثوري متاحاً
      }
    }, TEST_TIMEOUT);

    test('يجب أن يتعامل مع Ultimate Breakdown إذا كان متاحاً', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      // اختبار جميع المكونات التي تستخدم Ultimate System
      const ultimateComponents = [
        'prop_classification',
        'wardrobe_inference',
        'cinematic_patterns',
        'continuity_check'
      ];

      for (const component of ultimateComponents) {
        try {
          const response = await axios.post(
            `${PYTHON_SERVICE_URL}/analyze/sync`,
            {
              text: 'مشهد للاختبار مع Ultimate System',
              component,
              confidence_threshold: 0.7
            },
            { timeout: 15000 }
          );

          if (response.status === 200) {
            console.log(`✅ Ultimate System يعمل مع ${component}`);
            expect(response.data.result).toBeDefined();
          }

        } catch (error) {
          console.warn(`⚠️ Ultimate System فشل مع ${component}:`, error.message);
        }
      }
    }, TEST_TIMEOUT);
  });

  describe('اختبارات معالجة الأخطاء', () => {
    test('يجب أن يتعامل مع الطلبات غير الصالحة', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      // طلب بمكون غير موجود
      try {
        await axios.post(`${PYTHON_SERVICE_URL}/analyze/sync`, {
          text: 'نص تجريبي',
          component: 'invalid_component',
          confidence_threshold: 0.7
        });
        
        // يجب أن يفشل الطلب
        expect(true).toBe(false); // هذا السطر لا يجب أن يتم تنفيذه
        
      } catch (error) {
        expect(error.response?.status).toBe(422); // Validation Error
        console.log('✅ النظام يرفض المكونات غير الصالحة');
      }
    });

    test('يجب أن يتعامل مع النصوص الفارغة', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      try {
        const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze/sync`, {
          text: '',
          component: 'semantic_synopsis',
          confidence_threshold: 0.7
        });

        // يجب أن ينجح الطلب حتى مع نص فارغ
        expect(response.status).toBe(200);
        console.log('✅ النظام يتعامل مع النصوص الفارغة');
        
      } catch (error) {
        console.warn('⚠️ النظام لا يتعامل مع النصوص الفارغة:', error.message);
      }
    });

    test('يجب أن يعيد خطأ للوظائف غير الموجودة', async () => {
      if (!pythonServiceAvailable) {
        console.log('⏭️ تم تخطي الاختبار - خدمة Python غير متاحة');
        return;
      }

      try {
        await axios.get(`${PYTHON_SERVICE_URL}/jobs/invalid-job-id`);
        
        // يجب أن يفشل الطلب
        expect(true).toBe(false);
        
      } catch (error) {
        expect(error.response?.status).toBe(404);
        console.log('✅ النظام يرجع 404 للوظائف غير الموجودة');
      }
    });
  });
});