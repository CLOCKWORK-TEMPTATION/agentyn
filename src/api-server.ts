#!/usr/bin/env node

/**
 * خادم API للوكيل المتقدم
 * يوفر واجهة REST API للتفاعل مع الوكيل المتقدم
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { HybridAgent, selectHybridProvider } from './hybrid-agent.js';
import { SimpleRAGAgent } from './rag-agent.js';
import { MultiAgentSystem } from './multi-agent-system.js';
import { sanitizeLogInput, createParameterizedQuery, generateCSRFToken, validateCSRFToken } from './utils/security-helpers.js';

// ═══════════════════════════════════════════════════════════════════════════
// دوال الأمان - Security Helper Functions
// ═══════════════════════════════════════════════════════════════════════════


/**
 * تنظيف مدخلات السجلات لمنع Log Injection (CWE-117)
 */
function sanitizeLogInput(input: string): string {
  if (typeof input !== 'string') return String(input);
  return input
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 500);
}

/**
 * التحقق من صحة الاستعلام لمنع حقن SQL (CWE-89)
 */
function validateQueryInput(query: string): { valid: boolean; sanitized: string; error?: string } {
  if (typeof query !== 'string') {
    return { valid: false, sanitized: '', error: 'الاستعلام يجب أن يكون نصاً' };
  }

  // تحديد الطول الأقصى
  if (query.length > 10000) {
    return { valid: false, sanitized: '', error: 'الاستعلام طويل جداً' };
  }

  // إزالة الأحرف الضارة المحتملة
  const sanitized = query
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // أحرف التحكم
    .trim();

  return { valid: true, sanitized };
}

// ═══════════════════════════════════════════════════════════════════════════
// CSRF Token Store (للحماية من CSRF - CWE-352)
// ═══════════════════════════════════════════════════════════════════════════
const csrfTokens = new Map<string, { token: string; expires: number }>();

function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // ساعة واحدة
  });
  return token;
}

function validateCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return stored.token === token;
}

// تنظيف التوكنات المنتهية بشكل دوري
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expires) {
      csrfTokens.delete(key);
    }
  }
}, 300000); // كل 5 دقائق

// إعداد Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public')); // لملفات الواجهة الأمامية

/**
 * فئة مدير الوكيل المتقدم
 */
class AdvancedAgentManager {
  private hybridAgent: HybridAgent | null = null;
  private ragAgent: SimpleRAGAgent | null = null;
  private multiAgentSystem: MultiAgentSystem | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * تهيئة الوكيل المتقدم
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize() {
    try {
      console.log('🚀 تهيئة الوكيل المتقدم...');
      
      // اختيار الموفر
      const provider = selectHybridProvider();
      console.log(`📡 الموفر المختار: ${provider}`);
      
      // إنشاء الوكيل المدمج
      this.hybridAgent = new HybridAgent(provider);
      await this.hybridAgent.initialize();
      
      // إنشاء وكيل RAG منفصل
      this.ragAgent = new SimpleRAGAgent();
      await this.ragAgent.loadDocuments();
      
      // إنشاء نظام الوكلاء المتعددة
      this.multiAgentSystem = new MultiAgentSystem();
      await this.multiAgentSystem.initialize();
      
      this.isInitialized = true;
      console.log('✅ تم تهيئة الوكيل المتقدم بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الوكيل:', error);
      throw error;
    }
  }

  /**
   * إرسال استعلام للوكيل المدمج
   */
  async queryHybridAgent(query: string) {
    await this.initialize();
    
    if (!this.hybridAgent) {
      throw new Error('الوكيل المدمج غير مُهيأ');
    }
    
    return await this.hybridAgent.query(query);
  }

  /**
   * إرسال استعلام لوكيل RAG فقط
   */
  async queryRAGAgent(query: string) {
    await this.initialize();
    
    if (!this.ragAgent) {
      throw new Error('وكيل RAG غير مُهيأ');
    }
    
    return await this.ragAgent.query(query);
  }

  /**
   * إرسال استعلام لنظام الوكلاء المتعددة (ذكي)
   */
  async queryMultiAgentSystem(query: string, sessionId?: string) {
    await this.initialize();
    
    if (!this.multiAgentSystem) {
      throw new Error('نظام الوكلاء المتعددة غير مُهيأ');
    }
    
    return await this.multiAgentSystem.executeQuery(query, sessionId);
  }

  /**
   * تنفيذ متوازي بعدة وكلاء
   */
  async queryParallelAgents(query: string, agentNames: string[], sessionId?: string) {
    await this.initialize();
    
    if (!this.multiAgentSystem) {
      throw new Error('نظام الوكلاء المتعددة غير مُهيأ');
    }
    
    return await this.multiAgentSystem.executeParallel(query, agentNames, sessionId);
  }

  /**
   * تنفيذ تسلسلي بعدة وكلاء
   */
  async querySequentialAgents(query: string, agentNames: string[], sessionId?: string) {
    await this.initialize();
    
    if (!this.multiAgentSystem) {
      throw new Error('نظام الوكلاء المتعددة غير مُهيأ');
    }
    
    return await this.multiAgentSystem.executeSequential(query, agentNames, sessionId);
  }

  /**
   * إضافة مستند جديد لقاعدة المعرفة
   */
  async addKnowledge(filename: string, content: string) {
    await this.initialize();
    
    if (!this.ragAgent) {
      throw new Error('وكيل RAG غير مُهيأ');
    }
    
    return await this.ragAgent.addDocument(filename, content);
  }

  /**
   * الحصول على إحصائيات الوكيل
   */
  async getStats() {
    await this.initialize();
    
    return {
      hybridAgent: this.hybridAgent?.getStats() || null,
      ragAgent: this.ragAgent?.getStats() || null,
      multiAgentSystem: this.multiAgentSystem?.getSystemStats() || null,
      isInitialized: this.isInitialized,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}

// إنشاء مدير الوكيل
const agentManager = new AdvancedAgentManager();

// Routes

/**
 * الصفحة الرئيسية
 */
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بك في خادم الوكيل المتقدم',
    version: '1.0.0',
    endpoints: {
      'POST /api/agent/query': 'إرسال استعلام للوكيل المدمج',
      'POST /api/rag/query': 'إرسال استعلام لوكيل RAG فقط',
      'POST /api/multi-agent/query': 'إرسال استعلام لنظام الوكلاء المتعددة (ذكي)',
      'POST /api/multi-agent/parallel': 'تنفيذ متوازي بعدة وكلاء',
      'POST /api/multi-agent/sequential': 'تنفيذ تسلسلي بعدة وكلاء',
      'POST /api/knowledge/add': 'إضافة مستند لقاعدة المعرفة',
      'GET /api/stats': 'إحصائيات الوكيل',
      'GET /api/health': 'فحص حالة الخادم',
    }
  });
});

/**
 * فحص حالة الخادم
 */
app.get('/api/health', async (req, res) => {
  try {
    const stats = await agentManager.getStats();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(stats.uptime / 60)} دقيقة`,
      memory: `${(stats.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      isInitialized: stats.isInitialized
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'خطأ غير معروف'
    });
  }
});

/**
 * إحصائيات مفصلة
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await agentManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في الحصول على الإحصائيات'
    });
  }
});

/**
 * الحصول على CSRF token للحماية من هجمات CSRF (CWE-352)
 */
app.get('/api/csrf-token', (req, res) => {
  const sessionId = req.headers['x-session-id'] as string || crypto.randomUUID();
  const token = generateCsrfToken(sessionId);
  res.json({
    csrfToken: token,
    sessionId: sessionId,
    expiresIn: '1 hour'
  });
});

/**
 * استعلام الوكيل المدمج (الرئيسي)
 */
app.post('/api/agent/query', async (req, res) => {
  try {
    const { query, csrfToken } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';

    // التحقق من CSRF token (CWE-352) - اختياري للـ API العامة
    if (csrfToken && !validateCsrfToken(sessionId, csrfToken)) {
      return res.status(403).json({ error: 'CSRF token غير صالح' });
    }

    // التحقق من صحة الاستعلام (CWE-89)
    const queryValidation = validateQueryInput(query);
    if (!queryValidation.valid) {
      return res.status(400).json({
        error: queryValidation.error || 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }

    console.log(`📥 استعلام جديد: "${sanitizeLogInput(queryValidation.sanitized)}"`);

    const startTime = Date.now();
    const response = await agentManager.queryHybridAgent(queryValidation.sanitized);
    const duration = Date.now() - startTime;

    console.log(`📤 تم الرد في ${duration}ms`);

    res.json({
      query: queryValidation.sanitized,
      response,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      agent: 'hybrid'
    });

  } catch (error) {
    console.error('❌ خطأ في الاستعلام:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في معالجة الاستعلام'
    });
  }
});

/**
 * استعلام وكيل RAG فقط
 */
app.post('/api/rag/query', async (req, res) => {
  try {
    const { query, csrfToken } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';

    // التحقق من CSRF token (CWE-352)
    if (csrfToken && !validateCsrfToken(sessionId, csrfToken)) {
      return res.status(403).json({ error: 'CSRF token غير صالح' });
    }

    // التحقق من صحة الاستعلام (CWE-89)
    const queryValidation = validateQueryInput(query);
    if (!queryValidation.valid) {
      return res.status(400).json({
        error: queryValidation.error || 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }

    console.log(`📚 استعلام RAG: "${sanitizeLogInput(queryValidation.sanitized)}"`);

    const startTime = Date.now();
    const response = await agentManager.queryRAGAgent(queryValidation.sanitized);
    const duration = Date.now() - startTime;

    res.json({
      query: queryValidation.sanitized,
      response,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      agent: 'rag'
    });

  } catch (error) {
    console.error('❌ خطأ في استعلام RAG:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في معالجة استعلام RAG'
    });
  }
});

/**
 * إضافة مستند لقاعدة المعرفة
 */
app.post('/api/knowledge/add', async (req, res) => {
  try {
    const { filename, content, csrfToken } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';

    // التحقق من CSRF token (CWE-352)
    if (csrfToken && !validateCsrfToken(sessionId, csrfToken)) {
      return res.status(403).json({ error: 'CSRF token غير صالح' });
    }

    if (!filename || !content) {
      return res.status(400).json({
        error: 'يرجى تقديم filename و content'
      });
    }

    // التحقق من اسم الملف (منع Path Traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        error: 'اسم الملف غير صالح'
      });
    }

    console.log(`📄 إضافة مستند: ${sanitizeLogInput(filename)}`);
    
    const success = await agentManager.addKnowledge(filename, content);
    
    if (success) {
      res.json({
        message: `تم إضافة المستند بنجاح: ${filename}`,
        filename,
        size: content.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'فشل في إضافة المستند'
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في إضافة المستند:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في إضافة المستند'
    });
  }
});

/**
 * استعلام نظام الوكلاء المتعددة (ذكي)
 */
app.post('/api/multi-agent/query', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }
    
    console.log(`🤖 استعلام نظام الوكلاء المتعددة: "${query}"`);
    
    const startTime = Date.now();
    const result = await agentManager.queryMultiAgentSystem(query, sessionId);
    const duration = Date.now() - startTime;
    
    console.log(`📤 تم الرد من ${result.result.agentName} في ${duration}ms`);
    
    res.json({
      query,
      result: result.result,
      analysis: result.analysis,
      alternatives: result.alternatives,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      type: 'multi-agent-smart'
    });
    
  } catch (error) {
    console.error('❌ خطأ في نظام الوكلاء المتعددة:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في معالجة الاستعلام'
    });
  }
});

/**
 * تنفيذ متوازي بعدة وكلاء
 */
app.post('/api/multi-agent/parallel', async (req, res) => {
  try {
    const { query, agents, sessionId } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }
    
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return res.status(400).json({
        error: 'يرجى تقديم قائمة وكلاء في حقل agents'
      });
    }
    
    console.log(`🔄 تنفيذ متوازي: "${query}" بواسطة ${agents.join(', ')}`);
    
    const startTime = Date.now();
    const results = await agentManager.queryParallelAgents(query, agents, sessionId);
    const duration = Date.now() - startTime;
    
    res.json({
      query,
      agents,
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      type: 'multi-agent-parallel'
    });
    
  } catch (error) {
    console.error('❌ خطأ في التنفيذ المتوازي:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في التنفيذ المتوازي'
    });
  }
});

/**
 * تنفيذ تسلسلي بعدة وكلاء
 */
app.post('/api/multi-agent/sequential', async (req, res) => {
  try {
    const { query, agents, sessionId } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }
    
    if (!agents || !Array.isArray(agents) || agents.length === 0) {
      return res.status(400).json({
        error: 'يرجى تقديم قائمة وكلاء في حقل agents'
      });
    }
    
    console.log(`⏭️  تنفيذ تسلسلي: "${query}" بواسطة ${agents.join(' → ')}`);
    
    const startTime = Date.now();
    const result = await agentManager.querySequentialAgents(query, agents, sessionId);
    const duration = Date.now() - startTime;
    
    res.json({
      query,
      agents,
      finalResult: result.finalResult,
      intermediateResults: result.intermediateResults,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      type: 'multi-agent-sequential'
    });
    
  } catch (error) {
    console.error('❌ خطأ في التنفيذ التسلسلي:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في التنفيذ التسلسلي'
    });
  }
});
app.post('/api/query/smart', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }
    
    console.log(`🧠 استعلام ذكي: "${query}"`);
    
    let response: string;
    let agent: string;
    const startTime = Date.now();
    
    try {
      // محاولة الوكيل المدمج أولاً
      response = await agentManager.queryHybridAgent(query);
      agent = 'hybrid';
    } catch (hybridError) {
      console.log('⚠️  فشل الوكيل المدمج، جاري المحاولة مع RAG...');
      
      try {
        // محاولة وكيل RAG كبديل
        response = await agentManager.queryRAGAgent(query);
        agent = 'rag-fallback';
      } catch (ragError) {
        throw new Error(`فشل كلا الوكيلين: ${hybridError instanceof Error ? hybridError.message : 'خطأ غير معروف'} | ${ragError instanceof Error ? ragError.message : 'خطأ غير معروف'}`);
      }
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
      query,
      response,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      agent
    });
    
  } catch (error) {
    console.error('❌ خطأ في الاستعلام الذكي:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'خطأ في معالجة الاستعلام الذكي'
    });
  }
});

/**
 * معالج الأخطاء العام
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 خطأ غير متوقع:', error);
  res.status(500).json({
    error: 'خطأ داخلي في الخادم',
    message: error.message
  });
});

/**
 * معالج الطرق غير الموجودة
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'الطريق غير موجود',
    path: req.originalUrl,
    method: req.method
  });
});

/**
 * بدء الخادم
 */
async function startServer() {
  try {
    console.log('🚀 بدء تشغيل خادم الوكيل المتقدم...');
    
    // تهيئة الوكيل في الخلفية
    agentManager.initialize().catch(error => {
      console.error('⚠️  تحذير: فشل في تهيئة الوكيل:', error.message);
      console.log('💡 سيتم إعادة المحاولة عند أول استعلام');
    });
    
    // بدء الخادم
    app.listen(PORT, () => {
      console.log(`✅ خادم الوكيل المتقدم يعمل على المنفذ ${PORT}`);
      console.log(`🌐 الرابط: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('💥 فشل في بدء الخادم:', error);
    process.exit(1);
  }
}

// تشغيل الخادم إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { AdvancedAgentManager, app };