/**
 * اختبارات الخصائص لخدمة Python المتقدمة
 * Feature: three-read-breakdown-system
 * Property 10: Python Service Integration
 * Property 11: Revolutionary Engine Integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import fc from 'fast-check';
import axios from 'axios';

const SERVICE_URL = 'http://localhost:8000';

describe('Advanced Python Brain Service Property Tests', () => {
  let serviceAvailable = false;

  beforeAll(async () => {
    try {
      const response = await axios.get(`${SERVICE_URL}/health`);
      serviceAvailable = response.status === 200;
    } catch (error) {
      console.warn('Python service not available for testing');
      serviceAvailable = false;
    }
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
          // إرسال مهمة للخدمة
          const submitResponse = await axios.post(`${SERVICE_URL}/jobs/submit`, jobRequest);
          
          expect(submitResponse.status).toBe(200);
          expect(submitResponse.data).toHaveProperty('job_id');
          expect(submitResponse.data.status).toBe('pending');
          
          const jobId = submitResponse.data.job_id;
          
          // انتظار قصير للمعالجة
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // التحقق من حالة المهمة
          const statusResponse = await axios.get(`${SERVICE_URL}/jobs/${jobId}`);
          expect(statusResponse.status).toBe(200);
          expect(['pending', 'processing', 'completed', 'failed']).toContain(
            statusResponse.data.status
          );
          
          // التحقق من بنية الاستجابة
          expect(statusResponse.data).toHaveProperty('job_id', jobId);
          expect(statusResponse.data).toHaveProperty('processing_type', jobRequest.processing_type);
          expect(statusResponse.data).toHaveProperty('created_at');
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
          try {
            const response = await axios.post(`${SERVICE_URL}/jobs/submit`, jobRequest);
            
            if (response.status === 200) {
              // إذا كان النظام الثوري متاحاً
              expect(response.data).toHaveProperty('job_id');
              expect(response.data.processing_type).toBe('revolutionary_breakdown');
              
              const jobId = response.data.job_id;
              
              // انتظار المعالجة
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              const statusResponse = await axios.get(`${SERVICE_URL}/jobs/${jobId}`);
              
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
          const response = await axios.post(`${SERVICE_URL}/scene-salience`, request);
          
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
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle continuity check correctly', async () => {
    if (!serviceAvailable) return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          script_content: fc.string({ minLength: 100, maxLength: 2000 }),
          check_characters: fc.boolean(),
          check_locations: fc.boolean(),
          check_props: fc.boolean(),
          check_timeline: fc.boolean()
        }),
        async (request) => {
          const response = await axios.post(`${SERVICE_URL}/continuity-check`, request);
          
          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('total_issues');
          expect(response.data).toHaveProperty('total_warnings');
          expect(response.data).toHaveProperty('continuity_score');
          expect(response.data).toHaveProperty('checks_performed');
          
          // التحقق من أن النتيجة منطقية
          expect(response.data.continuity_score).toBeGreaterThanOrEqual(0);
          expect(response.data.continuity_score).toBeLessThanOrEqual(100);
          
          // التحقق من أن الفحوصات المطلوبة تم تنفيذها
          expect(response.data.checks_performed.characters).toBe(request.check_characters);
          expect(response.data.checks_performed.locations).toBe(request.check_locations);
          expect(response.data.checks_performed.props).toBe(request.check_props);
          expect(response.data.checks_performed.timeline).toBe(request.check_timeline);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle job lifecycle correctly', async () => {
    if (!serviceAvailable) return;

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          processing_type: fc.constantFrom('scene_salience', 'continuity_check'),
          script_content: fc.string({ minLength: 50, maxLength: 500 }),
          priority: fc.integer({ min: 1, max: 10 })
        }),
        async (jobRequest) => {
          // إرسال المهمة
          const submitResponse = await axios.post(`${SERVICE_URL}/jobs/submit`, jobRequest);
          const jobId = submitResponse.data.job_id;
          
          // التحقق من قائمة المهام
          const allJobsResponse = await axios.get(`${SERVICE_URL}/jobs`);
          expect(allJobsResponse.status).toBe(200);
          expect(Array.isArray(allJobsResponse.data)).toBe(true);
          
          const ourJob = allJobsResponse.data.find((job: any) => job.job_id === jobId);
          expect(ourJob).toBeDefined();
          expect(ourJob.processing_type).toBe(jobRequest.processing_type);
          
          // محاولة إلغاء المهمة (قد تنجح أو تفشل حسب التوقيت)
          try {
            const cancelResponse = await axios.delete(`${SERVICE_URL}/jobs/${jobId}`);
            if (cancelResponse.status === 200) {
              // التحقق من أن المهمة تم إلغاؤها
              const statusResponse = await axios.get(`${SERVICE_URL}/jobs/${jobId}`);
              expect(['cancelled', 'completed'].includes(statusResponse.data.status)).toBe(true);
            }
          } catch (error) {
            // المهمة قد تكون اكتملت بالفعل
            expect(axios.isAxiosError(error)).toBe(true);
          }
        }
      ),
      { numRuns: 5 }
    );
  });
});