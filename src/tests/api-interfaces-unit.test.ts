/**
 * اختبارات وحدة شاملة لواجهات المستخدم والAPI
 * API Interfaces Unit Tests
 * 
 * تغطي جميع endpoints والواجهات للنظام السينمائي متعدد الوكلاء
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

// استيراد النظام الأساسي
import { CinematicMultiAgentSystem } from '../systems/cinematic-multi-agent-system.js';
import { ObservabilitySystem } from '../systems/observability-system.js';
import { EvidenceTrackingSystem } from '../systems/evidence-tracking-system.js';

// إعداد التطبيق للاختبار
const createTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // إضافة CORS للاختبار
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  return app;
};

describe('اختبارات واجهات المستخدم والAPI', () => {
  let app: express.Application;
  let cinematicSystem: CinematicMultiAgentSystem;
  let observabilitySystem: ObservabilitySystem;
  let evidenceSystem: EvidenceTrackingSystem;

  beforeAll(async () => {
    console.log('🚀 بدء إعداد بيئة الاختبار...');
    
    // إنشاء الأنظمة
    cinematicSystem = new CinematicMultiAgentSystem();
    observabilitySystem = new ObservabilitySystem();
    evidenceSystem = new EvidenceTrackingSystem();
    
    // إعداد التطبيق
    app = createTestApp();
    
    console.log('✅ تم إعداد بيئة الاختبار بنجاح');
  });

  afterAll(async () => {
    console.log('🧹 تنظيف بيئة الاختبار...');
    
    // تنظيف الملفات المؤقتة
    const tempFiles = ['test_upload.txt', 'test_script.txt'];
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    
    console.log('✅ تم تنظيف بيئة الاختبار');
  });

  beforeEach(() => {
    // إعادة تعيين الحالة قبل كل اختبار
    jest.clearAllMocks();
  });

  describe('اختبار Health Check Endpoints', () => {
    test('يجب أن يستجيب /health بنجاح', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    test('يجب أن يستجيب /api/system/health بالتفاصيل', async () => {
      const response = await request(app)
        .get('/api/system/health')
        .expect(200);

      expect(response.body).toHaveProperty('system_health');
      expect(response.body).toHaveProperty('agents');
      expect(response.body).toHaveProperty('models');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('اختبار Script Analysis Endpoints', () => {
    const sampleScript = `
      INT. OFFICE - DAY
      
      JOHN (30s) sits at his desk, typing on a computer.
      
      JOHN
      This is a test scene.
      
      EXT. STREET - DAY
      
      MARY walks down the street, looking happy.
    `;

    test('يجب أن يحلل النص بنجاح عبر /api/analyze/script', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: sampleScript,
          task_type: 'full_analysis',
          complexity: 'medium'
        })
        .expect(200);

      expect(response.body).toHaveProperty('task_id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('result');
      expect(response.body.status).toBe('completed');
    });

    test('يجب أن يرفض النص الفارغ', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: '',
          task_type: 'full_analysis'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('يجب أن يرفض النص الطويل جداً', async () => {
      const longScript = 'A'.repeat(500001); // أكثر من الحد المسموح
      
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: longScript,
          task_type: 'full_analysis'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('طويل جداً');
    });

    test('يجب أن يدعم معاملات متقدمة', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: sampleScript,
          task_type: 'emotional_analysis',
          complexity: 'high',
          requirements: {
            include_evidence: true,
            max_response_time: 300000,
            quality_threshold: 0.9
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('result');
    });
  });

  describe('اختبار File Upload Endpoints', () => {
    test('يجب أن يقبل ملفات نصية صحيحة', async () => {
      // إنشاء ملف مؤقت للاختبار
      const testFileContent = `
        INT. LIVING ROOM - DAY
        
        A cozy living room with a fireplace.
        
        CHARACTER sits reading a book.
      `;
      
      fs.writeFileSync('test_upload.txt', testFileContent);

      const response = await request(app)
        .post('/api/analyze/file')
        .attach('file', 'test_upload.txt')
        .expect(200);

      expect(response.body).toHaveProperty('task_id');
      expect(response.body).toHaveProperty('status');
    });

    test('يجب أن يرفض أنواع الملفات غير المدعومة', async () => {
      const response = await request(app)
        .post('/api/analyze/file')
        .attach('file', Buffer.from('test'), {
          filename: 'test.exe',
          contentType: 'application/x-msdownload'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('يجب أن يرفض الملفات الكبيرة', async () => {
      // إنشاء ملف كبير (أكثر من 10MB)
      const largeContent = 'B'.repeat(11 * 1024 * 1024);
      fs.writeFileSync('large_test.txt', largeContent);

      const response = await request(app)
        .post('/api/analyze/file')
        .attach('file', 'large_test.txt')
        .expect(413);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('اختبار Task Status Endpoints', () => {
    let testTaskId: string;

    beforeEach(async () => {
      // إنشاء مهمة اختبار
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Test script for status checking',
          task_type: 'full_analysis'
        });
      
      testTaskId = response.body.task_id;
    });

    test('يجب أن يعيد حالة مهمة صحيحة', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTaskId}/status`)
        .expect(200);

      expect(response.body).toHaveProperty('task_id', testTaskId);
      expect(response.body).toHaveProperty('status');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(response.body.status);
    });

    test('يجب أن يعيد 404 لمهمة غير موجودة', async () => {
      const response = await request(app)
        .get('/api/tasks/nonexistent-task/status')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('يجب أن يعيد قائمة المهام', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('يجب أن يدعم فلترة المهام حسب الحالة', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed&limit=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('اختبار System Metrics Endpoints', () => {
    test('يجب أن يعيد مقاييس الأداء', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('cpu_usage');
      expect(response.body).toHaveProperty('memory_usage');
      expect(response.body).toHaveProperty('response_time_avg');
      expect(response.body).toHaveProperty('throughput_per_minute');
      expect(response.body).toHaveProperty('error_rate');
    });

    test('يجب أن يعيد حالة الوكلاء', async () => {
      const response = await request(app)
        .get('/api/system/agents')
        .expect(200);

      expect(response.body).toHaveProperty('agents');
      expect(typeof response.body.agents).toBe('object');
    });

    test('يجب أن يعيد حالة النماذج', async () => {
      const response = await request(app)
        .get('/api/system/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(typeof response.body.models).toBe('object');
    });
  });

  describe('اختبار Quick Analysis Endpoints', () => {
    test('يجب أن ينفذ تحليل سريع', async () => {
      const response = await request(app)
        .post('/api/analysis/quick')
        .send({
          scriptContent: 'Quick test analysis',
          analysis_type: 'basic'
        })
        .expect(200);

      expect(response.body).toHaveProperty('result');
      expect(response.body).toHaveProperty('processing_time_ms');
    });

    test('يجب أن يدعم أنواع تحليل مختلفة', async () => {
      const analysisTypes = ['basic', 'detailed', 'comprehensive'];
      
      for (const type of analysisTypes) {
        const response = await request(app)
          .post('/api/analysis/quick')
          .send({
            scriptContent: 'Test for ' + type,
            analysis_type: type
          })
          .expect(200);

        expect(response.body).toHaveProperty('result');
      }
    });
  });

  describe('اختبار Export Functionality', () => {
    let testTaskId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Test script for export',
          task_type: 'full_analysis'
        });
      
      testTaskId = response.body.task_id;
    });

    test('يجب أن يصدر تقرير JSON', async () => {
      // انتظار اكتمال المعالجة
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/reports/${testTaskId}/export?format=json`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    test('يجب أن يصدر تقرير HTML', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/reports/${testTaskId}/export?format=html`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });

    test('يجب أن يرفض تنسيقات غير مدعومة', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .get(`/api/reports/${testTaskId}/export?format=xml`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('يجب أن يرفض تصدير مهمة غير مكتملة', async () => {
      const response = await request(app)
        .get('/api/reports/nonexistent-task/export?format=json')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('اختبار Error Handling', () => {
    test('يجب أن يتعامل مع أخطاء الخادم', async () => {
      // محاكاة خطأ في النظام
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Test script',
          task_type: 'invalid_task_type'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('يجب أن يتعامل مع JSON غير صالح', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('يجب أن يتعامل مع Content-Type خاطئ', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .set('Content-Type', 'text/plain')
        .send('plain text request')
        .expect(415);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('اختبار Real-time Progress Tracking', () => {
    test('يجب أن يوفر تحديثات التقدم', async () => {
      const longScript = `
        ${Array.from({ length: 50 }, (_, i) => `
        INT. SCENE ${i} - DAY
        
        Scene ${i} content with more details.
        
        CHARACTER ${i}
        This is dialogue for scene ${i}.
        `).join('\n')}
      `;

      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: longScript,
          task_type: 'full_analysis',
          complexity: 'high'
        });

      const taskId = response.body.task_id;

      // تتبع التقدم
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        const statusResponse = await request(app)
          .get(`/api/tasks/${taskId}/status`);

        if (statusResponse.body.status === 'completed') {
          expect(statusResponse.body).toHaveProperty('progress');
          expect(statusResponse.body.progress).toBe(100);
          break;
        }

        if (statusResponse.body.status === 'failed') {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
    });
  });

  describe('اختبار Performance وLoad', () => {
    test('يجب أن يتعامل مع عدة طلبات متزامنة', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/analyze/script')
          .send({
            scriptContent: `Test script ${i}`,
            task_type: 'full_analysis'
          })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('task_id');
      });
    });

    test('يجب أن يحافظ على الأداء تحت الضغط', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/system/metrics');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000); // أقل من 5 ثواني
      expect(response.status).toBe(200);
    });
  });

  describe('اختبار Security وValidation', () => {
    test('يجب أن يتحقق من صحة المدخلات', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: null,
          task_type: 'full_analysis'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('يجب أن يدعم CORS بشكل صحيح', async () => {
      const response = await request(app)
        .options('/api/analyze/script')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    test('يجب أن يحد من حجم الطلبات', async () => {
      const largeRequest = {
        scriptContent: 'A'.repeat(2 * 1024 * 1024), // 2MB
        task_type: 'full_analysis'
      };

      const response = await request(app)
        .post('/api/analyze/script')
        .send(largeRequest)
        .expect(413);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('اختبار Integration مع الأنظمة الفرعية', () => {
    test('يجب أن يتكامل مع نظام المراقبة', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Test integration with observability',
          task_type: 'full_analysis'
        });

      const taskId = response.body.task_id;

      // التحقق من تسجيل المقاييس
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const metricsResponse = await request(app)
        .get('/api/system/metrics');

      expect(metricsResponse.body).toHaveProperty('cpu_usage');
      expect(metricsResponse.body).toHaveProperty('memory_usage');
    });

    test('يجب أن يتكامل مع نظام تتبع الأدلة', async () => {
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Test evidence tracking integration',
          task_type: 'full_analysis',
          requirements: {
            include_evidence: true
          }
        });

      expect(response.body).toHaveProperty('task_id');
      
      // التحقق من إنشاء سلاسل الأدلة
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // يمكن إضافة اختبارات إضافية لتتبع الأدلة هنا
    });
  });
});

// اختبارات إضافية للوظائف المتقدمة
describe('اختبارات الوظائف المتقدمة', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('اختبار Batch Processing', () => {
    test('يجب أن يدعم معالجة دفعية', async () => {
      const batchRequest = {
        scripts: [
          { id: 'script1', content: 'First test script' },
          { id: 'script2', content: 'Second test script' },
          { id: 'script3', content: 'Third test script' }
        ],
        task_type: 'full_analysis'
      };

      const response = await request(app)
        .post('/api/analyze/batch')
        .send(batchRequest)
        .expect(200);

      expect(response.body).toHaveProperty('batch_id');
      expect(response.body).toHaveProperty('scripts');
      expect(response.body.scripts).toHaveLength(3);
    });
  });

  describe('اختبار WebSocket للتحديثات المباشرة', () => {
    test('يجب أن يوفر اتصال WebSocket', async () => {
      // هذا اختبار أساسي - يمكن توسيعه باستخدام مكتبة WebSocket
      const response = await request(app)
        .get('/api/websocket/token')
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('url');
    });
  });

  describe('اختبار Advanced Analytics', () => {
    test('يجب أن يوفر تحليلات متقدمة', async () => {
      const response = await request(app)
        .get('/api/analytics/performance?period=24h')
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('trends');
    });
  });
});
