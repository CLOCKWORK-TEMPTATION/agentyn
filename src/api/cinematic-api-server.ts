/**
 * خادم API للتفريغ السينمائي
 * Cinematic Breakdown API Server
 * 
 * يوفر واجهات RESTful للتحليل السينمائي متعدد الوكلاء
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CinematicMultiAgentSystem } from '../systems/cinematic-multi-agent-system.js';
import { CinematicTask } from '../systems/cinematic-multi-agent-system.js';

// واجهة مبسطة للملف المرفوع
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// واجهة الطلب مع الملف
interface FileRequest extends Request {
  file?: UploadedFile;
  files?: UploadedFile | UploadedFile[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// إعداد التخزين المؤقت للملفات (مبسط)
const upload = {
  single: (fieldName: string) => {
    return (req: FileRequest, res: Response, next: NextFunction) => {
      // محاكاة رفع الملف للاختبار
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        req.file = {
          fieldname: fieldName,
          originalname: 'test.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1024,
          destination: 'uploads/',
          filename: 'test.txt',
          path: 'uploads/test.txt',
          buffer: Buffer.from('test content')
        };
      }
      next();
    };
  }
};

// إعداد CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// إعداد JSON parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// إعداد الملفات الثابتة
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../../reports')));

// تهيئة النظام متعدد الوكلاء
let cinematicSystem: CinematicMultiAgentSystem;

async function initializeSystem() {
  try {
    cinematicSystem = new CinematicMultiAgentSystem();
    console.log('✅ تم تهيئة نظام الوكلاء المتعددة بنجاح');
  } catch (error) {
    console.error('❌ خطأ في تهيئة النظام:', error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// middleware للتحقق من النظام
// ═══════════════════════════════════════════════════════════════════════════

function checkSystemHealth(req: Request, res: Response, next: NextFunction) {
  if (!cinematicSystem) {
    return res.status(503).json({
      error: 'النظام غير جاهز',
      message: 'النظام متعدد الوكلاء لم يتم تهيئته بعد'
    });
  }
  next();
}

// ═══════════════════════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════════════════════

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بك في API التفريغ السينمائي',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      analyze_script: '/api/analyze/script',
      analyze_file: '/api/analyze/file',
      task_status: '/api/tasks/:taskId',
      system_metrics: '/api/system/metrics',
      agent_status: '/api/system/agents'
    },
    documentation: 'https://github.com/your-repo/cinematic-breakdown-api'
  });
});

// فحص صحة النظام
app.get('/api/health', async (req, res) => {
  try {
    const health = await cinematicSystem.healthCheck();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system_health: health
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: (error as Error).message
    });
  }
});

// تحليل نص السيناريو
app.post('/api/analyze/script', checkSystemHealth, async (req, res) => {
  try {
    const { 
      scriptContent, 
      task_type = 'full_analysis',
      complexity = 'medium',
      requirements = {}
    } = req.body;

    if (!scriptContent || typeof scriptContent !== 'string') {
      return res.status(400).json({
        error: 'محتوى السيناريو مطلوب'
      });
    }

    if (scriptContent.length > 500000) {
      return res.status(400).json({
        error: 'النص طويل جداً (الحد الأقصى 500,000 حرف)'
      });
    }

    const taskId = `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: CinematicTask = {
      task_id: taskId,
      task_type,
      script_content,
      requirements: {
        complexity,
        max_response_time: requirements.max_response_time || 300000, // 5 دقائق
        quality_threshold: requirements.quality_threshold || 0.8,
        include_python_service: requirements.include_python_service !== false
      },
      context: {
        user_preferences: requirements.user_preferences,
        production_context: requirements.production_context
      }
    };

    console.log(`🎬 بدء تحليل سيناريو جديد: ${taskId}`);

    // تنفيذ التحليل
    const result = await cinematicSystem.processCinematicTask(task);

    res.json({
      task_id: taskId,
      success: result.success,
      result: result.result,
      execution_summary: result.execution_summary,
      agent_results: result.agent_results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في تحليل السيناريو:', error);
    res.status(500).json({
      error: 'خطأ في معالجة الطلب',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// تحليل ملف السيناريو
app.post('/api/analyze/file', checkSystemHealth, upload.single('script_file'), async (req: FileRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'ملف السيناريو مطلوب'
      });
    }

    const { task_type = 'full_analysis', complexity = 'medium' } = req.body;

    // قراءة محتوى الملف
    const fs = await import('fs/promises');
    const scriptContent = req.file.buffer.toString('utf-8');

    const taskId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: CinematicTask = {
      task_id: taskId,
      task_type,
      script_content,
      requirements: {
        complexity,
        max_response_time: 300000,
        quality_threshold: 0.8,
        include_python_service: true
      },
      context: {
        user_preferences: {
          file_info: {
            original_name: req.file.originalname,
            size: req.file.size,
            mime_type: req.file.mimetype
          }
        }
      }
    };

    console.log(`🎬 بدء تحليل ملف سيناريو: ${taskId}`);

    // تنفيذ التحليل
    const result = await cinematicSystem.processCinematicTask(task);

    // حذف الملف المؤقت (إذا كان موجوداً)
    if (req.file.path) {
      await fs.unlink(req.file.path).catch(console.warn);
    }

    res.json({
      task_id: taskId,
      success: result.success,
      result: result.result,
      execution_summary: result.execution_summary,
      agent_results: result.agent_results,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('خطأ في تحليل ملف السيناريو:', error);
    res.status(500).json({
      error: 'خطأ في معالجة الملف',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// الحصول على حالة مهمة
app.get('/api/tasks/:taskId', checkSystemHealth, (req, res) => {
  try {
    const { taskId } = req.params;
    const history = cinematicSystem.getTaskHistory(100);
    
    const task = history.find(t => t.task_id === taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'المهمة غير موجودة'
      });
    }

    res.json({
      task_id: taskId,
      task_status: task.success ? 'completed' : 'failed',
      execution_time: task.duration,
      agents_used: task.agents_used,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'خطأ في استرجاع حالة المهمة',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// الحصول على مقاييس النظام
app.get('/api/system/metrics', checkSystemHealth, (req, res) => {
  try {
    const metrics = cinematicSystem.getSystemMetrics();
    const health = cinematicSystem.getAgentStatus();
    
    res.json({
      performance_metrics: metrics,
      agent_health: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'خطأ في استرجاع مقاييس النظام',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// الحصول على حالة الوكلاء
app.get('/api/system/agents', checkSystemHealth, (req, res) => {
  try {
    const agentStatus = cinematicSystem.getAgentStatus();
    
    res.json({
      agents: agentStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'خطأ في استرجاع حالة الوكلاء',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// تحليل سريع (للاختبار)
app.post('/api/analyze/quick', checkSystemHealth, async (req, res) => {
  try {
    const { script_content } = req.body;

    if (!script_content) {
      return res.status(400).json({
        error: 'محتوى السيناريو مطلوب'
      });
    }

    const taskId = `quick_${Date.now()}`;
    
    const task: CinematicTask = {
      task_id: taskId,
      task_type: 'emotional_analysis',
      script_content: script_content.substring(0, 5000), // أول 5000 حرف فقط
      requirements: {
        complexity: 'low',
        max_response_time: 30000, // 30 ثانية
        quality_threshold: 0.6,
        include_python_service: false
      }
    };

    const result = await cinematicSystem.processCinematicTask(task);

    res.json({
      task_id: taskId,
      success: result.success,
      result: result.result,
      execution_summary: result.execution_summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'خطأ في التحليل السريع',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// تصدير تقرير
app.get('/api/export/report/:taskId', checkSystemHealth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { format = 'json' } = req.query;

    const history = cinematicSystem.getTaskHistory(100);
    const task = history.find(t => t.task_id === taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'المهمة غير موجودة'
      });
    }

    // هنا يمكن إضافة منطق تصدير التقرير الفعلي
    res.json({
      message: 'تصدير التقرير قيد التطوير',
      task_id: taskId,
      format
    });

  } catch (error) {
    res.status(500).json({
      error: 'خطأ في تصدير التقرير',
      message: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════════════════════════════

// معالج الأخطاء العام
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('خطأ في الخادم:', error);
  
  // معالجة أخطاء الملفات
  if (error.message.includes('حجم الملف')) {
    return res.status(400).json({
      error: 'حجم الملف كبير جداً'
    });
  }
  
  res.status(500).json({
    error: 'خطأ داخلي في الخادم',
    message: process.env.NODE_ENV === 'development' ? error.message : 'حدث خطأ غير متوقع'
  });
});

// معالج المسارات غير الموجودة
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'المسار غير موجود',
    available_endpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/analyze/script',
      'POST /api/analyze/file',
      'GET /api/tasks/:taskId',
      'GET /api/system/metrics',
      'GET /api/system/agents',
      'POST /api/analyze/quick'
    ]
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Server Startup
// ═══════════════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    await initializeSystem();
    
    app.listen(PORT, () => {
      console.log(`\n🎬 خادم API التفريغ السينمائي يعمل على المنفذ ${PORT}`);
      console.log(`📡 API متاح على: http://localhost:${PORT}`);
      console.log(`🔍 فحص الصحة: http://localhost:${PORT}/api/health`);
      console.log(`📚 الوثائق: http://localhost:${PORT}/`);
      console.log(`⏰ وقت البدء: ${new Date().toLocaleString('ar-SA')}`);
    });
    
  } catch (error) {
    console.error('❌ فشل في بدء الخادم:', error);
    process.exit(1);
  }
}

// بدء الخادم
startServer();

// ═══════════════════════════════════════════════════════════════════════════
// Graceful Shutdown
// ═══════════════════════════════════════════════════════════════════════════

process.on('SIGTERM', () => {
  console.log('📴 تم استلام إشارة SIGTERM، جاري إغلاق الخادم...');
  if (cinematicSystem) {
    cinematicSystem.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 تم استلام إشارة SIGINT، جاري إغلاق الخادم...');
  if (cinematicSystem) {
    cinematicSystem.destroy();
  }
  process.exit(0);
});

export default app;
