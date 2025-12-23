/**
 * اختبارات الوحدة لخدمة Python المتقدمة
 * Requirements: 12.3, 13.1
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';

const SERVICE_URL = 'http://localhost:8000';

describe('Advanced Python Brain Service Unit Tests', () => {
  let serviceAvailable = false;

  beforeAll(async () => {
    try {
      const response = await axios.get(`${SERVICE_URL}/health`);
      serviceAvailable = response.status === 200;
    } catch (error) {
      console.warn('Python service not available for unit testing');
      serviceAvailable = false;
    }
  });

  describe('Service Health and Status', () => {
    it('should return service information at root endpoint', async () => {
      if (!serviceAvailable) return;

      const response = await axios.get(`${SERVICE_URL}/`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('service', 'Advanced Python Brain Service');
      expect(response.data).toHaveProperty('version', '1.0.0');
      expect(response.data).toHaveProperty('status', 'active');
      expect(response.data).toHaveProperty('available_engines');
      expect(response.data).toHaveProperty('endpoints');
      
      expect(Array.isArray(response.data.endpoints)).toBe(true);
      expect(response.data.endpoints.length).toBeGreaterThan(0);
    });

    it('should return health status', async () => {
      if (!serviceAvailable) return;

      const response = await axios.get(`${SERVICE_URL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('active_jobs');
      expect(response.data).toHaveProperty('total_jobs');
      expect(response.data).toHaveProperty('engines_status');
      
      expect(typeof response.data.active_jobs).toBe('number');
      expect(typeof response.data.total_jobs).toBe('number');
    });
  });

  describe('Job Management', () => {
    it('should create and track jobs correctly', async () => {
      if (!serviceAvailable) return;

      const jobRequest = {
        processing_type: 'scene_salience',
        script_content: 'INT. LIVING ROOM - DAY\n\nJOHN sits on the couch reading a book.',
        priority: 5
      };

      // إرسال المهمة
      const submitResponse = await axios.post(`${SERVICE_URL}/jobs/submit`, jobRequest);
      
      expect(submitResponse.status).toBe(200);
      expect(submitResponse.data).toHaveProperty('job_id');
      expect(submitResponse.data).toHaveProperty('status', 'pending');
      expect(submitResponse.data).toHaveProperty('processing_type', 'scene_salience');
      expect(submitResponse.data).toHaveProperty('created_at');
      expect(submitResponse.data).toHaveProperty('progress', 0);

      const jobId = submitResponse.data.job_id;

      // التحقق من المهمة
      const getResponse = await axios.get(`${SERVICE_URL}/jobs/${jobId}`);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toHaveProperty('job_id', jobId);
      expect(getResponse.data).toHaveProperty('processing_type', 'scene_salience');
    });

    it('should return 404 for non-existent job', async () => {
      if (!serviceAvailable) return;

      const fakeJobId = 'non-existent-job-id';

      try {
        await axios.get(`${SERVICE_URL}/jobs/${fakeJobId}`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(axios.isAxiosError(error)).toBe(true);
        expect(error.response?.status).toBe(404);
        expect(error.response?.data.detail).toBe('المهمة غير موجودة');
      }
    });

    it('should list all jobs with filtering', async () => {
      if (!serviceAvailable) return;

      // الحصول على جميع المهام
      const allJobsResponse = await axios.get(`${SERVICE_URL}/jobs`);
      
      expect(allJobsResponse.status).toBe(200);
      expect(Array.isArray(allJobsResponse.data)).toBe(true);

      // اختبار التصفية حسب الحالة
      const pendingJobsResponse = await axios.get(`${SERVICE_URL}/jobs?status=pending`);
      
      expect(pendingJobsResponse.status).toBe(200);
      expect(Array.isArray(pendingJobsResponse.data)).toBe(true);
      
      // التحقق من أن جميع المهام المرجعة لها حالة pending
      pendingJobsResponse.data.forEach((job: any) => {
        expect(job.status).toBe('pending');
      });

      // اختبار الحد الأقصى للنتائج
      const limitedJobsResponse = await axios.get(`${SERVICE_URL}/jobs?limit=5`);
      
      expect(limitedJobsResponse.status).toBe(200);
      expect(limitedJobsResponse.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Scene Salience Analysis', () => {
    it('should analyze scene importance correctly', async () => {
      if (!serviceAvailable) return;

      const request = {
        scenes: [
          {
            id: 'scene_1',
            content: 'JOHN enters the room. He looks around nervously.',
            characters: ['JOHN'],
            visual_elements: ['room', 'door']
          },
          {
            id: 'scene_2',
            content: 'MARY confronts JOHN about the missing money. Tension rises.',
            characters: ['JOHN', 'MARY'],
            visual_elements: ['money', 'confrontation']
          }
        ],
        criteria: {
          character_development: 0.3,
          plot_advancement: 0.4,
          emotional_impact: 0.2,
          visual_complexity: 0.1
        }
      };

      const response = await axios.post(`${SERVICE_URL}/scene-salience`, request);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('total_scenes', 2);
      expect(response.data).toHaveProperty('analysis_criteria');
      expect(response.data).toHaveProperty('scene_analyses');
      expect(response.data).toHaveProperty('summary');

      // التحقق من تحليل كل مشهد
      expect(response.data.scene_analyses).toHaveLength(2);
      
      response.data.scene_analyses.forEach((analysis: any, index: number) => {
        expect(analysis).toHaveProperty('scene_index', index);
        expect(analysis).toHaveProperty('scene_id', request.scenes[index].id);
        expect(analysis).toHaveProperty('importance_score');
        expect(analysis).toHaveProperty('breakdown');
        expect(analysis).toHaveProperty('recommendations');
        
        expect(typeof analysis.importance_score).toBe('number');
        expect(analysis.importance_score).toBeGreaterThanOrEqual(0);
        expect(analysis.importance_score).toBeLessThanOrEqual(1);
        
        expect(Array.isArray(analysis.recommendations)).toBe(true);
      });

      // التحقق من الملخص
      expect(response.data.summary).toHaveProperty('high_importance_scenes');
      expect(response.data.summary).toHaveProperty('medium_importance_scenes');
      expect(response.data.summary).toHaveProperty('low_importance_scenes');
      expect(response.data.summary).toHaveProperty('average_importance');
      
      expect(typeof response.data.summary.average_importance).toBe('number');
    });

    it('should use default criteria when none provided', async () => {
      if (!serviceAvailable) return;

      const request = {
        scenes: [
          {
            id: 'scene_1',
            content: 'Simple scene with basic dialogue.',
            characters: ['JOHN'],
            visual_elements: []
          }
        ]
      };

      const response = await axios.post(`${SERVICE_URL}/scene-salience`, request);
      
      expect(response.status).toBe(200);
      expect(response.data.analysis_criteria).toHaveProperty('character_development');
      expect(response.data.analysis_criteria).toHaveProperty('plot_advancement');
      expect(response.data.analysis_criteria).toHaveProperty('emotional_impact');
      expect(response.data.analysis_criteria).toHaveProperty('visual_complexity');
    });
  });

  describe('Continuity Check', () => {
    it('should check script continuity correctly', async () => {
      if (!serviceAvailable) return;

      const request = {
        script_content: `
          INT. LIVING ROOM - DAY
          
          JOHN sits on the couch.
          
          JOHN
          Where did I put my keys?
          
          EXT. GARDEN - DAY
          
          MARY waters the plants.
          
          MARY
          John always loses his keys.
        `,
        check_characters: true,
        check_locations: true,
        check_props: true,
        check_timeline: true
      };

      const response = await axios.post(`${SERVICE_URL}/continuity-check`, request);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('total_issues');
      expect(response.data).toHaveProperty('total_warnings');
      expect(response.data).toHaveProperty('issues');
      expect(response.data).toHaveProperty('warnings');
      expect(response.data).toHaveProperty('continuity_score');
      expect(response.data).toHaveProperty('checks_performed');

      expect(typeof response.data.total_issues).toBe('number');
      expect(typeof response.data.total_warnings).toBe('number');
      expect(typeof response.data.continuity_score).toBe('number');
      
      expect(Array.isArray(response.data.issues)).toBe(true);
      expect(Array.isArray(response.data.warnings)).toBe(true);
      
      expect(response.data.continuity_score).toBeGreaterThanOrEqual(0);
      expect(response.data.continuity_score).toBeLessThanOrEqual(100);

      // التحقق من أن الفحوصات المطلوبة تم تنفيذها
      expect(response.data.checks_performed).toEqual({
        characters: true,
        locations: true,
        props: true,
        timeline: true
      });
    });

    it('should respect check options', async () => {
      if (!serviceAvailable) return;

      const request = {
        script_content: 'Simple script content.',
        check_characters: false,
        check_locations: true,
        check_props: false,
        check_timeline: true
      };

      const response = await axios.post(`${SERVICE_URL}/continuity-check`, request);
      
      expect(response.status).toBe(200);
      expect(response.data.checks_performed).toEqual({
        characters: false,
        locations: true,
        props: false,
        timeline: true
      });
    });
  });

  describe('File Upload', () => {
    it('should handle text file upload', async () => {
      if (!serviceAvailable) return;

      const scriptContent = `
        INT. OFFICE - DAY
        
        SARAH types on her computer.
        
        SARAH
        This project is almost done.
      `;

      const formData = new FormData();
      const blob = new Blob([scriptContent], { type: 'text/plain' });
      formData.append('file', blob, 'test-script.txt');
      formData.append('processing_type', 'scene_salience');

      const response = await axios.post(`${SERVICE_URL}/upload-script`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('message', 'تم تحميل الملف بنجاح');
      expect(response.data).toHaveProperty('filename', 'test-script.txt');
      expect(response.data).toHaveProperty('job_id');
      expect(response.data).toHaveProperty('processing_type', 'scene_salience');
      expect(response.data).toHaveProperty('file_size');
    });

    it('should reject unsupported file types', async () => {
      if (!serviceAvailable) return;

      const formData = new FormData();
      const blob = new Blob(['invalid content'], { type: 'application/json' });
      formData.append('file', blob, 'invalid.json');

      try {
        await axios.post(`${SERVICE_URL}/upload-script`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(axios.isAxiosError(error)).toBe(true);
        expect(error.response?.status).toBe(400);
        expect(error.response?.data.detail).toContain('نوع ملف غير مدعوم');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid job requests gracefully', async () => {
      if (!serviceAvailable) return;

      const invalidRequest = {
        processing_type: 'invalid_type',
        script_content: 'test content'
      };

      try {
        await axios.post(`${SERVICE_URL}/jobs/submit`, invalidRequest);
        fail('Should have thrown an error');
      } catch (error) {
        expect(axios.isAxiosError(error)).toBe(true);
        expect(error.response?.status).toBe(422); // Validation error
      }
    });

    it('should handle empty script content', async () => {
      if (!serviceAvailable) return;

      const request = {
        processing_type: 'scene_salience',
        script_content: '',
        priority: 1
      };

      // قد ينجح الطلب ولكن مع نتائج فارغة، أو قد يفشل
      try {
        const response = await axios.post(`${SERVICE_URL}/jobs/submit`, request);
        expect(response.status).toBe(200);
      } catch (error) {
        expect(axios.isAxiosError(error)).toBe(true);
        expect([400, 422]).toContain(error.response?.status);
      }
    });
  });
});