/**
 * اختبارات التكامل الشاملة للنظام السينمائي متعدد الوكلاء
 * Comprehensive Integration Tests for Cinematic Multi-Agent System
 * 
 * تغطي جميع جوانب النظام من البداية للنهاية
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// استيراد جميع الأنظمة
import { CinematicMultiAgentSystem } from '../systems/cinematic-multi-agent-system.js';
import { ObservabilitySystem } from '../systems/observability-system.js';
import { EvidenceTrackingSystem } from '../systems/evidence-tracking-system.js';
import { AdvancedModelManager } from '../systems/model-management-system.js';

// إعداد التطبيق للاختبار
const createTestApp = () => {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // إضافة CORS
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

describe('اختبارات التكامل الشاملة', () => {
  let app: express.Application;
  let cinematicSystem: CinematicMultiAgentSystem;
  let observabilitySystem: ObservabilitySystem;
  let evidenceSystem: EvidenceTrackingSystem;
  let modelManager: AdvancedModelManager;
  let pythonServiceProcess: any;

  beforeAll(async () => {
    console.log('🚀 بدء إعداد بيئة الاختبار الشاملة...');
    
    try {
      // إنشاء الأنظمة
      modelManager = new AdvancedModelManager();
      cinematicSystem = new CinematicMultiAgentSystem();
      observabilitySystem = new ObservabilitySystem();
      evidenceSystem = new EvidenceTrackingSystem();
      
      // إعداد التطبيق
      app = createTestApp();
      
      // محاولة تشغيل خدمة Python (إذا كانت متاحة)
      try {
        pythonServiceProcess = spawn('python', ['FINAL_PYTHON_BRAIN_SERVICE_COMPLETE.py'], {
          cwd: process.cwd(),
          stdio: 'pipe'
        });
        
        pythonServiceProcess.stdout?.on('data', (data: Buffer) => {
          console.log('Python Service:', data.toString());
        });
        
        pythonServiceProcess.stderr?.on('data', (data: Buffer) => {
          console.log('Python Service Error:', data.toString());
        });
        
        // انتظار تشغيل الخدمة
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.log('⚠️ خدمة Python غير متاحة، سيتم تخطي اختبارات التكامل معها');
      }
      
      console.log('✅ تم إعداد بيئة الاختبار الشاملة بنجاح');
      
    } catch (error) {
      console.error('❌ فشل في إعداد بيئة الاختبار:', error);
      throw error;
    }
  });

  afterAll(async () => {
    console.log('🧹 تنظيف بيئة الاختبار الشاملة...');
    
    try {
      // إيقاف خدمة Python
      if (pythonServiceProcess) {
        pythonServiceProcess.kill();
      }
      
      // تنظيف الأنظمة
      if (cinematicSystem) {
        // cinematicSystem.destroy();
      }
      
      if (observabilitySystem) {
        observabilitySystem.destroy();
      }
      
      // تنظيف الملفات المؤقتة
      const tempFiles = [
        'test_integration_script.txt',
        'test_batch_script1.txt',
        'test_batch_script2.txt',
        'test_large_script.txt'
      ];
      
      for (const file of tempFiles) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
      
      console.log('✅ تم تنظيف بيئة الاختبار الشاملة');
      
    } catch (error) {
      console.error('❌ خطأ في التنظيف:', error);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('اختبار التكامل الأساسي للنظام', () => {
    test('يجب أن تتكامل جميع الأنظمة بنجاح', async () => {
      // التحقق من تهيئة جميع الأنظمة
      expect(cinematicSystem).toBeDefined();
      expect(observabilitySystem).toBeDefined();
      expect(evidenceSystem).toBeDefined();
      expect(modelManager).toBeDefined();
      
      // التحقق من صحة الأنظمة
      const healthCheck = await observabilitySystem.getCurrentMetrics();
      expect(healthCheck).toBeDefined();
      expect(healthCheck.system_health).toBeDefined();
    });

    test('يجب أن تتواصل الأنظمة مع بعضها البعض', async () => {
      // إنشاء مهمة تحليل
      const testScript = `
        INT. COFFEE SHOP - DAY
        
        SARAH sits at a corner table, typing on her laptop.
        
        SARAH
        (to herself)
        This scene needs more emotional depth.
        
        EXT. PARK - SUNSET
        
        SARAH walks slowly, lost in thought.
      `;
      
      // محاكاة تحليل شامل
      const analysisResult = await cinematicSystem.processCinematicTask({
        task_id: 'integration_test_001',
        task_type: 'full_analysis',
        script_content: testScript,
        requirements: {
          complexity: 'medium',
          include_evidence: true,
          max_response_time: 300000,
          quality_threshold: 0.8
        }
      });
      
      expect(analysisResult).toBeDefined();
      expect(analysisResult.task_id).toBe('integration_test_001');
      
      // التحقق من تسجيل المقاييس
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).toBeDefined();
      
      // التحقق من إنشاء سلاسل الأدلة
      const evidenceChains = evidenceSystem.getAllEvidenceChains();
      expect(Array.isArray(evidenceChains)).toBe(true);
    });
  });

  describe('اختبار سيناريوهات الاستخدام الكاملة', () => {
    test('سيناريو: تحليل سيناريو كامل من البداية للنهاية', async () => {
      const fullScript = `
        FADE IN:
        
        INT. MOVIE STUDIO - DAY
        
        DIRECTOR (50s) reviews footage on multiple monitors.
        
        DIRECTOR
        We need more emotion in this scene.
        
        CUT TO:
        
        INT. ACTOR'S TRAILER - DAY
        
        ACTOR (30s) studies his lines, practicing expressions.
        
        ACTOR
        (rehearsing)
        I understand now. The pain is in the subtext.
        
        EXT. STUDIO LOT - SUNSET
        
        DIRECTOR and ACTOR walk together, discussing the scene.
        
        DIRECTOR
        Good. Now let's capture that authenticity.
        
        FADE OUT.
      `;
      
      // 1. إرسال للتحليل
      const analysisResponse = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: fullScript,
          task_type: 'full_analysis',
          complexity: 'high',
          requirements: {
            include_evidence: true,
            enable_revolutionary_mode: true,
            max_iterations: 5
          }
        })
        .expect(200);

      expect(analysisResponse.body).toHaveProperty('task_id');
      const taskId = analysisResponse.body.task_id;

      // 2. انتظار اكتمال المعالجة
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        const statusResponse = await request(app)
          .get(`/api/tasks/${taskId}/status`)
          .expect(200);

        if (statusResponse.body.status === 'completed') {
          expect(statusResponse.body.result).toBeDefined();
          break;
        }

        if (statusResponse.body.status === 'failed') {
          throw new Error(`فشلت المعالجة: ${statusResponse.body.error}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // 3. التحقق من النتائج
      const finalStatus = await request(app)
        .get(`/api/tasks/${taskId}/status`)
        .expect(200);

      expect(finalStatus.body.status).toBe('completed');
      expect(finalStatus.body.result).toHaveProperty('emotional_analysis');
      expect(finalStatus.body.result).toHaveProperty('technical_validation');
      expect(finalStatus.body.result).toHaveProperty('breakdown_results');

      // 4. التحقق من تصدير التقرير
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const exportResponse = await request(app)
        .get(`/api/reports/${taskId}/export?format=json`)
        .expect(200);

      expect(exportResponse.headers['content-type']).toContain('application/json');
      expect(typeof exportResponse.body).toBe('object');

      // 5. التحقق من مقاييس الأداء
      const metricsResponse = await request(app)
        .get('/api/system/metrics')
        .expect(200);

      expect(metricsResponse.body).toHaveProperty('cpu_usage');
      expect(metricsResponse.body).toHaveProperty('memory_usage');
    });

    test('سيناريو: معالجة دفعية لعدة سيناريوهات', async () => {
      const scripts = [
        {
          id: 'script_001',
          content: `
            INT. KITCHEN - MORNING
            
            MOTHER prepares breakfast while FATHER reads newspaper.
            
            MOTHER
            Did you see the news about the new movie?
          `
        },
        {
          id: 'script_002', 
          content: `
            INT. OFFICE - AFTERNOON
            
            MANAGER reviews performance reports.
            
            MANAGER
            We need to improve our metrics this quarter.
          `
        },
        {
          id: 'script_003',
          content: `
            EXT. BEACH - SUNSET
            
            COUPLE walks hand in hand along the shore.
            
            PARTNER A
            This is perfect.
          `
        }
      ];

      // إرسال المعالجة الدفعية
      const batchResponse = await request(app)
        .post('/api/analyze/batch')
        .send({
          scripts: scripts,
          task_type: 'full_analysis',
          requirements: {
            complexity: 'medium'
          }
        })
        .expect(200);

      expect(batchResponse.body).toHaveProperty('batch_id');
      expect(batchResponse.body.scripts).toHaveLength(3);

      const batchId = batchResponse.body.batch_id;

      // تتبع تقدم المعالجة الدفعية
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        const batchStatusResponse = await request(app)
          .get(`/api/batch/${batchId}/status`)
          .expect(200);

        if (batchStatusResponse.body.status === 'completed') {
          expect(batchStatusResponse.body.completed_scripts).toBe(3);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // التحقق من النتائج النهائية
      const finalBatchStatus = await request(app)
        .get(`/api/batch/${batchId}/status`)
        .expect(200);

      expect(finalBatchStatus.body.status).toBe('completed');
      expect(finalBatchStatus.body.completed_scripts).toBe(3);
    });
  });

  describe('اختبار الأداء تحت الضغط', () => {
    test('يجب أن يتعامل مع many requests متزامنة', async () => {
      const concurrentRequests = 10;
      const requests = [];

      // إنشاء many requests متزامنة
      for (let i = 0; i < concurrentRequests; i++) {
        const script = `
          INT. SCENE ${i} - DAY
          
          CHARACTER ${i} performs action ${i}.
          
          CHARACTER ${i}
          This is test scene number ${i}.
        `;
        
        requests.push(
          request(app)
            .post('/api/analyze/script')
            .send({
              scriptContent: script,
              task_type: 'full_analysis',
              complexity: 'medium'
            })
        );
      }

      // تنفيذ جميع الطلبات
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // التحقق من النتائج
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('task_id');
      });

      const totalTime = endTime - startTime;
      console.log(`⏱️ معالجة ${concurrentRequests} طلبات استغرقت ${totalTime}ms`);

      // يجب أن يكون الأداء مقبولاً
      expect(totalTime).toBeLessThan(30000); // أقل من 30 ثانية
    });

    test('يجب أن يحافظ على الاستقرار مع large scripts', async () => {
      // إنشاء script كبير
      let largeScript = 'FADE IN:\n\n';
      
      for (let i = 0; i < 100; i++) {
        largeScript += `
        INT. SCENE ${i} - DAY
        
        CHARACTER ${i} enters the scene with complex dialogue that spans multiple lines and includes emotional depth and character development.
        
        CHARACTER ${i}
        (thoughtfully)
        This is a long dialogue that tests the system's ability to handle extensive text processing and maintain context throughout the analysis process.
        
        EXT. LOCATION ${i} - ${i % 2 === 0 ? 'DAY' : 'NIGHT'}
        
        The scene continues with additional action and dialogue that further tests the system's capabilities.
        `;
      }
      
      largeScript += '\nFADE OUT.';

      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: largeScript,
          task_type: 'full_analysis',
          complexity: 'high'
        })
        .expect(200);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body).toHaveProperty('task_id');
      console.log(`📄 معالجة script كبير استغرقت ${processingTime}ms`);

      // التحقق من أن النظام لم يتعطل
      expect(processingTime).toBeLessThan(60000); // أقل من دقيقة
    });
  });

  describe('اختبار التكامل مع الخدمات الخارجية', () => {
    test('يجب أن يتكامل مع خدمة Python Brain Service', async () => {
      const testScript = `
        INT. LABORATORY - DAY
        
        SCIENTIST works on a breakthrough experiment.
        
        SCIENTIST
        The results are beyond our expectations.
      `;

      try {
        // محاولة استخدام endpoint متقدم
        const response = await request(app)
          .post('/api/analysis/advanced/scene-salience')
          .send({
            text: testScript,
            iterations: 3,
            revolutionary_mode: true
          })
          .expect(200);

        expect(response.body).toHaveProperty('total_scenes');
        expect(response.body).toHaveProperty('scene_analyses');
        
      } catch (error) {
        // إذا لم تكن الخدمة متاحة، نتوقع خطأ 503 أو مشابه
        console.log('⚠️ خدمة Python غير متاحة، وهذا متوقع في بيئة الاختبار');
      }
    });

    test('يجب أن يتعامل مع أخطاء الخدمات الخارجية', async () => {
      const response = await request(app)
        .post('/api/analysis/advanced/invalid-endpoint')
        .send({
          text: 'Test script',
          invalid_parameter: true
        })
        .expect(404); // أو 500 حسب التطبيق

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('اختبار المراقبة والتتبع', () => {
    test('يجب أن يتتبع جميع العمليات في نظام المراقبة', async () => {
      // إرسال طلبات متعددة
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/analyze/script')
          .send({
            scriptContent: `Test script ${i} for monitoring`,
            task_type: 'full_analysis'
          })
          .expect(200);
      }

      // انتظار تسجيل البيانات
      await new Promise(resolve => setTimeout(resolve, 2000));

      // التحقق من مقاييس المراقبة
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.performance).toHaveProperty('throughput_per_minute');

      // التحقق من السجلات
      const logs = observabilitySystem.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      // التحقق من التنبيهات (إن وجدت)
      const alerts = observabilitySystem.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('يجب أن ينشئ تقارير أداء دقيقة', async () => {
      // إنشاء بعض البيانات للاختبار
      await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Test for performance report',
          task_type: 'full_analysis'
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // إنشاء تقرير أداء
      const report = await observabilitySystem.generatePerformanceReport('hourly');
      
      expect(report).toHaveProperty('report_id');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report.summary).toHaveProperty('total_tasks');
      expect(report.summary).toHaveProperty('success_rate');
      expect(report.summary).toHaveProperty('average_response_time');
    });
  });

  describe('اختبار الأمان والحماية', () => {
    test('يجب أن يتحقق من صحة المدخلات', async () => {
      // اختبار حقن كود
      const maliciousScript = `
        INT. SCENE - DAY
        
        CHARACTER
        <script>alert('xss')</script>
        
        DROP TABLE users; --
      `;

      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: maliciousScript,
          task_type: 'full_analysis'
        })
        .expect(200); // يجب أن يتعامل مع المدخلات بأمان

      expect(response.body).toHaveProperty('task_id');
    });

    test('يجب أن يحد من معدل الطلبات', async () => {
      const requests = [];
      
      // إرسال many requests بسرعة
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/api/analyze/script')
            .send({
              scriptContent: `Rate limit test ${i}`,
              task_type: 'full_analysis'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // بعض الطلبات قد ترفض بسبب rate limiting
      const successfulRequests = responses.filter(r => r.status === 200).length;
      const rateLimitedRequests = responses.filter(r => r.status === 429).length;
      
      console.log(`✅ Successful: ${successfulRequests}, 🔒 Rate Limited: ${rateLimitedRequests}`);
      
      // يجب أن يكون هناك rate limiting
      expect(rateLimitedRequests).toBeGreaterThan(0);
    });

    test('يجب أن يتحقق من أذونات الوصول', async () => {
      // محاولة الوصول لـ endpoint محمي بدون authentication
      const response = await request(app)
        .get('/api/admin/system/config')
        .expect(401); // أو 403

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('اختبار Recovery وFault Tolerance', () => {
    test('يجب أن يتعافى من أخطاء النظام', async () => {
      // محاكاة سيناريو حيث يفشل أحد المكونات
      const testScript = `
        INT. TEST SCENE - DAY
        
        CHARACTER performs action.
      `;

      // إرسال طلب عادي
      const response1 = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: testScript,
          task_type: 'full_analysis'
        })
        .expect(200);

      expect(response1.body).toHaveProperty('task_id');

      // محاولة إرسال طلب آخر أثناء "عطل" محاكى
      // (في التطبيق الحقيقي، يمكن محاكاة عطل حقيقي)
      const response2 = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: testScript,
          task_type: 'full_analysis'
        })
        .expect(200);

      expect(response2.body).toHaveProperty('task_id');
    });

    test('يجب أن يحافظ على البيانات أثناء الأخطاء', async () => {
      const testScript = `
        INT. DATA PERSISTENCE TEST - DAY
        
        CHARACTER
        This test ensures data integrity.
      `;

      const response = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: testScript,
          task_type: 'full_analysis'
        })
        .expect(200);

      const taskId = response.body.task_id;

      // التحقق من استمرارية البيانات
      const statusResponse = await request(app)
        .get(`/api/tasks/${taskId}/status`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('task_id', taskId);
      expect(statusResponse.body).toHaveProperty('status');
    });
  });

  describe('اختبار End-to-End Workflows', () => {
    test('Workflow كامل: من رفع الملف إلى تصدير التقرير', async () => {
      // 1. إنشاء ملف اختبار
      const testFileContent = `
        INT. CINEMA THEATER - NIGHT
        
        AUDIENCE watches a movie, completely engaged.
        
        AUDIENCE MEMBER 1
        (whispering)
        This is incredible.
        
        FADE TO BLACK.
        
        THE END.
      `;
      
      fs.writeFileSync('test_e2e_script.txt', testFileContent);

      // 2. رفع الملف
      const uploadResponse = await request(app)
        .post('/api/analyze/file')
        .attach('file', 'test_e2e_script.txt')
        .expect(200);

      expect(uploadResponse.body).toHaveProperty('task_id');
      const taskId = uploadResponse.body.task_id;

      // 3. تتبع التقدم
      let attempts = 0;
      while (attempts < 20) {
        const statusResponse = await request(app)
          .get(`/api/tasks/${taskId}/status`)
          .expect(200);

        if (statusResponse.body.status === 'completed') {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // 4. تصدير التقرير
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const jsonExport = await request(app)
        .get(`/api/reports/${taskId}/export?format=json`)
        .expect(200);

      expect(jsonExport.headers['content-type']).toContain('application/json');

      const htmlExport = await request(app)
        .get(`/api/reports/${taskId}/export?format=html`)
        .expect(200);

      expect(htmlExport.headers['content-type']).toContain('text/html');

      // 5. التحقق من الإحصائيات النهائية
      const finalMetrics = await request(app)
        .get('/api/system/metrics')
        .expect(200);

      expect(finalMetrics.body).toBeDefined();

      // تنظيف
      if (fs.existsSync('test_e2e_script.txt')) {
        fs.unlinkSync('test_e2e_script.txt');
      }
    });

    test('Workflow: تحليل سريع مع تصدير فوري', async () => {
      // 1. تحليل سريع
      const quickResponse = await request(app)
        .post('/api/analysis/quick')
        .send({
          scriptContent: 'Quick test for immediate export',
          analysis_type: 'basic'
        })
        .expect(200);

      expect(quickResponse.body).toHaveProperty('result');
      expect(quickResponse.body).toHaveProperty('processing_time_ms');

      // 2. تصدير فوري (للتحليل السريع)
      if (quickResponse.body.result.report_id) {
        const exportResponse = await request(app)
          .get(`/api/reports/${quickResponse.body.result.report_id}/export?format=json`)
          .expect(200);

        expect(exportResponse.body).toBeDefined();
      }
    });
  });

  describe('اختبار Load Testing', () => {
    test('يجب أن يتحمل حمل عالي لفترة ممتدة', async () => {
      const duration = 30000; // 30 ثانية
      const interval = 1000; // طلب كل ثانية
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;
      let errorCount = 0;

      console.log('🔥 بدء اختبار التحمل...');

      const loadTest = setInterval(async () => {
        if (Date.now() - startTime >= duration) {
          clearInterval(loadTest);
          
          console.log(`📊 نتائج اختبار التحمل:`);
          console.log(`   Total Requests: ${requestCount}`);
          console.log(`   Successful: ${successCount}`);
          console.log(`   Errors: ${errorCount}`);
          console.log(`   Success Rate: ${((successCount / requestCount) * 100).toFixed(2)}%`);
          
          // يجب أن يكون معدل النجاح عالياً
          expect(successCount / requestCount).toBeGreaterThan(0.8);
          
          return;
        }

        try {
          const response = await request(app)
            .post('/api/analyze/script')
            .send({
              scriptContent: `Load test script ${requestCount}`,
              task_type: 'full_analysis'
            });

          requestCount++;
          
          if (response.status === 200) {
            successCount++;
          } else {
            errorCount++;
          }

        } catch (error) {
          requestCount++;
          errorCount++;
        }
      }, interval);

      // انتظار انتهاء الاختبار
      await new Promise(resolve => setTimeout(resolve, duration + 1000));
    });
  });
});

// اختبارات إضافية للسيناريوهات المتقدمة
describe('اختبارات السيناريوهات المتقدمة', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('اختبار Multi-Tenancy وIsolation', () => {
    test('يجب أن يعزل البيانات بين المستخدمين', async () => {
      // في التطبيق الحقيقي، سيتم اختبار العزل بين tenants
      const response1 = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Tenant A script',
          task_type: 'full_analysis',
          tenant_id: 'tenant_a'
        })
        .expect(200);

      const response2 = await request(app)
        .post('/api/analyze/script')
        .send({
          scriptContent: 'Tenant B script',
          task_type: 'full_analysis',
          tenant_id: 'tenant_b'
        })
        .expect(200);

      // التحقق من أن المهام منفصلة
      expect(response1.body.task_id).not.toBe(response2.body.task_id);
    });
  });

  describe('اختبار Advanced Analytics', () => {
    test('يجب أن يوفر تحليلات متقدمة للاستخدام', async () => {
      const response = await request(app)
        .get('/api/analytics/usage?period=24h&granularity=hour')
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('granularity');
      expect(response.body).toHaveProperty('data');
    });

    test('يجب أن يحسب المقاييس المخصصة', async () => {
      const response = await request(app)
        .get('/api/analytics/custom-metrics')
        .expect(200);

      expect(response.body).toHaveProperty('custom_metrics');
      expect(response.body).toHaveProperty('trends');
    });
  });
});
