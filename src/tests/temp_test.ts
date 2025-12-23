/**
 * اختبارات الخصائص لخدمة Python المتقدمة
 * Feature: three-read-breakdown-system
 * Property 10: Python Service Integration
 * Property 11: Revolutionary Engine Integration
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import fc from 'fast-check';
import axios from 'axios';

const SERVICE_URL = 'http://localhost:8000';

describe('Advanced Python Brain Service Property Tests', () => {
  let serviceAvailable = false;
  const activeRequests: AbortController[] = [];

  beforeAll(async () => {
    try {
      const response = await axios.get(`${SERVICE_URL}/health`);
      serviceAvailable = response.status === 200;
    } catch (error) {
      console.warn('Python service not available for testing');
      serviceAvailable = false;
    }
  });

  afterEach(() => {
    // إلغاء جميع الطلبات النشطة لمنع تسرب الموارد
    activeRequests.forEach(controller => {
      try {
        controller.abort();
      } catch (error) {
        // تجاهل الأخطاء في الإلغاء
      }
    });
    activeRequests.length = 0;
  });

  afterAll(() => {
    // تنظيف اتصالات axios
    axios.defaults.adapter = undefined;
  });

  /**
   * Property 10: Python Service Integration
   * Validates: Requirements 12.3
   */
  it('**Feature: three-read-breakdown-system, Property 10: Python Service Integration**', async () => {
    if (!serviceAvailable) {
      console.warn('Skipping test - Python service not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          processing_type: fc.constantFrom(
            'scene_salience',
            'continuity_check',
            'full_analysis'
          ),
          script_content: fc.string({ minLength: 50, maxLength: 1000 }),
          priority: fc.integer({ min: 1, max: 10 })
        }),
        async (jobRequest) => {
          const abortController = new AbortController();
          activeRequests.push(abortController);

          try {
            // إرسال مهمة للخدمة
            const submitResponse = await axios.post(`${SERVICE_URL}/jobs/submit`, jobRequest, {
              signal: abortController.signal,
              timeout: 10000 // 10 ثوانٍ كحد أقصى
            });

            expect(submitResponse.status).toBe(200);
            expect(submitResponse.data).toHaveProperty('job_id');
            expect(submitResponse.data.status).toBe('pending');

            const jobId = submitResponse.data.job_id;

            // انتظار قصير للمعالجة
            await new Promise(resolve => setTimeout(resolve, 1000));

            // التحقق من حالة المهمة
            const statusResponse = await axios.get(`${SERVICE_URL}/jobs/${jobId}`, {
              signal: abortController.signal,
              timeout: 10000 // 10 ثوانٍ كحد أقصى
            });
            expect(statusResponse.status).toBe(200);
            expect(['pending', 'processing', 'completed', 'failed']).toContain(
              statusResponse.data.status
            );

            // التحقق من بنية الاستجابة
            expect(statusResponse.data).toHaveProperty('job_id', jobId);
            expect(statusResponse.data).toHaveProperty('processing_type', jobRequest.processing_type);
            expect(statusResponse.data).toHaveProperty('created_at');
          } finally {
            // إزالة الطلب من القائمة النشطة عند الانتهاء
            const index = activeRequests.indexOf(abortController);
            if (index > -1) {
              activeRequests.splice(index, 1);
            }
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 11: Revolutionary Engine Integration
   * Validates: Requirements 13.1
   */
  it('**Feature: three-read-breakdown-system, Property 11: Revolutionary Engine Integration**', async () => {
    if (!serviceAvailable) {
      console.warn('Skipping test - Python service not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          processing_type: fc.constant('revolutionary_breakdown'),
          script_content: fc.string({ minLength: 100, maxLength: 2000 }),
          options: fc.record({
            analysis_depth: fc.constantFrom('basic', 'detailed', 'comprehensive'),
            include_metadata: fc.boolean()
          })
        }),
        async (jobRequest) => {
          const abortController = new AbortController();
          activeRequests.push(abortController);

          try {
            const response = await axios.post(`${SERVICE_URL}/jobs/submit`, jobRequest, {
              signal: abortController.signal,
              timeout: 10000 // 10 ثوانٍ كحد أقصى
            });

            if (response.status === 200) {
              // إذا كان النظام الثوري متاحاً
              expect(response.data).toHaveProperty('job_id');
              expect(response.data.processing_type).toBe('revolutionary_breakdown');

              const jobId = response.data.job_id;

              // انتظار المعالجة
              await new Promise(resolve => setTimeout(resolve, 2000));

              const statusResponse = await axios.get(`${SERVICE_URL}/jobs/${jobId}`, {
                signal: abortController.signal,
                timeout: 10000 // 10 ثوانٍ كحد أقصى
              });

              if (statusResponse.data.status === 'completed') {
                expect(statusResponse.data.result).toHaveProperty('engine', 'revolutionary');
                expect(statusResponse.data.result).toHaveProperty('result');
              }
            }
          } catch (error) {
            // إذا لم يكن النظام الثوري متاحاً، يجب أن نحصل على خطأ 503
            if (axios.isAxiosError(error) && error.response?.status === 503) {
              expect(error.response.data.detail).toContain('Revolutionary Breakdown Engine غير متاح');
            } else {
              throw error;
            }
          } finally {
            // إزالة الطلب من القائمة النشطة عند الانتهاء
            const index = activeRequests.indexOf(abortController);
            if (index > -1) {
              activeRequests.splice(index, 1);
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should handle scene salience analysis correctly', async () => {
    if (!serviceAvailable) return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          scenes: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              content: fc.string({ minLength: 10, maxLength: 500 }),
              characters: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          criteria: fc.record({
            character_development: fc.float({ min: 0, max: 1 }),
            plot_advancement: fc.float({ min: 0, max: 1 }),
            emotional_impact: fc.float({ min: 0, max: 1 }),
            visual_complexity: fc.float({ min: 0, max: 1 })
          })
        }),
        async (request) => {
          const abortController = new AbortController();
          activeRequests.push(abortController);

          try {
            const response = await axios.post(`${SERVICE_URL}/scene-salience`, request, {
              signal: abortController.signal,
              timeout: 10000 // 10 ثوانٍ كحد أقصى
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('total_scenes', request.scenes.length);
            expect(response.data).toHaveProperty('scene_analyses');
            expect(response.data).toHaveProperty('summary');

            // التحقق من أن كل مشهد له تحليل
            expect(response.data.scene_analyses).toHaveLength(request.scenes.length);

            response.data.scene_analyses.forEach((analysis: any, index: number) => {
              expect(analysis).toHaveProperty('scene_index', index);
              expect(analysis).toHaveProperty('importance_score');
              expect(analysis.importance_score).toBeGreaterThanOrEqual(0);
              expect(analysis.importance_score).toBeLessThanOrEqual(1);
            });
          } finally {
            // إزالة الطلب من القائمة النشطة عند الانتهاء
            const index = activeRequests.indexOf(abortController);
            if (index > -1) {
              activeRequests.splice(index, 1);
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should handle scene salience analysis correctly', async () => {
    if (!serviceAvailable) return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          scenes: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              content: fc.string({ minLength: 10, maxLength: 500 }),
              characters: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          criteria: fc.record({
            character_development: fc.float({ min: 0, max: 1 }),
            plot_advancement: fc.float({ min: 0, max: 1 }),
            emotional_impact: fc.float({ min: 0, max: 1 }),
            visual_complexity: fc.float({ min: 0, max: 1 })
          })
        }),
        async (request) => {
          const abortController = new AbortController();
          activeRequests.push(abortController);

          try {
            const response = await axios.post(`${SERVICE_URL}/scene-salience`, request, {
              signal: abortController.signal,
              timeout: 10000 // 10 ثوانٍ كحد أقصى
            });

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('total_scenes', request.scenes.length);
            expect(response.data).toHaveProperty('scene_analyses');
            expect(response.data).toHaveProperty('summary');

            // التحقق من أن كل مشهد له تحليل
            expect(response.data.scene_analyses).toHaveLength(request.scenes.length);

            response.data.scene_analyses.forEach((analysis: any, index: number) => {
              expect(analysis).toHaveProperty('scene_index', index);
              expect(analysis).toHaveProperty('importance_score');
              expect(analysis.importance_score).toBeGreaterThanOrEqual(0);
              expect(analysis.importance_score).toBeLessThanOrEqual(1);
            });
          } finally {
            // إزالة الطلب من القائمة النشطة عند الانتهاء
            const index = activeRequests.indexOf(abortController);
            if (index > -1) {
              activeRequests.splice(index, 1);
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });
});
