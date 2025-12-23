#!/usr/bin/env node

/**
 * خادم API محسن للوكيل المتقدم
 * Enhanced API Server with Better Security
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { HybridAgent, selectHybridProvider } from './hybrid-agent.js';
import { SimpleRAGAgent } from './rag-agent.js';
import { MultiAgentSystem } from './multi-agent-system.js';
import { 
  sanitizeLogInput, 
  generateCSRFToken, 
  validateCSRFToken,
  sanitizeInput,
  generateCSPHeader,
  RateLimiter
} from './utils/security-helpers-fixed.js';

// ═══════════════════════════════════════════════════════════════════════════
// Security Configuration
// ═══════════════════════════════════════════════════════════════════════════

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'تم تجاوز حد الطلبات المسموحة',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 API requests per minute
  message: 'تم تجاوز حد طلبات API المسموحة',
});

// CSRF Token Store with Redis-like interface (in-memory for demo)
class TokenStore {
  private tokens = new Map<string, { token: string; expires: number; encrypted: boolean }>();
  
  set(sessionId: string, token: string, ttl: number = 3600000): void {
    this.tokens.set(sessionId, {
      token,
      expires: Date.now() + ttl,
      encrypted: true
    });
  }
  
  get(sessionId: string): string | null {
    const stored = this.tokens.get(sessionId);
    if (!stored || Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return null;
    }
    return stored.token;
  }
  
  delete(sessionId: string): void {
    this.tokens.delete(sessionId);
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.tokens.entries()) {
      if (now > value.expires) {
        this.tokens.delete(key);
      }
    }
  }
}

const csrfTokenStore = new TokenStore();

// Cleanup expired tokens every 5 minutes
setInterval(() => csrfTokenStore.cleanup(), 300000);

/**
 * Enhanced query validation
 */
function validateQueryInput(query: string): { valid: boolean; sanitized: string; error?: string } {
  if (typeof query !== 'string') {
    return { valid: false, sanitized: '', error: 'الاستعلام يجب أن يكون نصاً' };
  }

  if (query.length > 10000) {
    return { valid: false, sanitized: '', error: 'الاستعلام طويل جداً (الحد الأقصى 10,000 حرف)' };
  }

  if (query.trim().length === 0) {
    return { valid: false, sanitized: '', error: 'الاستعلام فارغ' };
  }

  const sanitized = sanitizeInput(query, 10000);
  return { valid: true, sanitized };
}

// Express app setup
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(generalLimiter);
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Additional JSON validation
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.static('public', {
  maxAge: '1d',
  etag: false,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

/**
 * Enhanced Agent Manager
 */
class EnhancedAgentManager {
  private hybridAgent: HybridAgent | null = null;
  private ragAgent: SimpleRAGAgent | null = null;
  private multiAgentSystem: MultiAgentSystem | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();

  async initialize() {
    if (this.isInitialized) return;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize() {
    try {
      console.log('🚀 تهيئة الوكيل المحسن...');
      
      const provider = selectHybridProvider();
      console.log(`📡 الموفر المختار: ${provider}`);
      
      this.hybridAgent = new HybridAgent(provider);
      await this.hybridAgent.initialize();
      
      this.ragAgent = new SimpleRAGAgent();
      await this.ragAgent.loadDocuments();
      
      this.multiAgentSystem = new MultiAgentSystem();
      await this.multiAgentSystem.initialize();
      
      this.isInitialized = true;
      console.log('✅ تم تهيئة الوكيل المحسن بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الوكيل:', error);
      this.errorCount++;
      throw error;
    }
  }

  async queryHybridAgent(query: string) {
    await this.initialize();
    if (!this.hybridAgent) throw new Error('الوكيل المدمج غير مُهيأ');
    
    this.requestCount++;
    try {
      return await this.hybridAgent.query(query);
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  async queryRAGAgent(query: string) {
    await this.initialize();
    if (!this.ragAgent) throw new Error('وكيل RAG غير مُهيأ');
    
    this.requestCount++;
    try {
      return await this.ragAgent.query(query);
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  async queryMultiAgentSystem(query: string, sessionId?: string) {
    await this.initialize();
    if (!this.multiAgentSystem) throw new Error('نظام الوكلاء المتعددة غير مُهيأ');
    
    this.requestCount++;
    try {
      return await this.multiAgentSystem.executeQuery(query, sessionId);
    } catch (error) {
      this.errorCount++;
      throw error;
    }
  }

  getStats() {
    const uptime = Date.now() - this.startTime;
    const memory = process.memoryUsage();
    
    return {
      isInitialized: this.isInitialized,
      uptime: Math.floor(uptime / 1000),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
      memory: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      hybridAgent: this.hybridAgent?.getStats() || null,
      ragAgent: this.ragAgent?.getStats() || null,
      multiAgentSystem: this.multiAgentSystem?.getSystemStats() || null,
    };
  }
}

const agentManager = new EnhancedAgentManager();

// ═══════════════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * الصفحة الرئيسية
 */
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بك في خادم الوكيل المتقدم المحسن',
    version: '2.0.0',
    security: 'Enhanced',
    endpoints: {
      'POST /api/agent/query': 'إرسال استعلام للوكيل المدمج',
      'POST /api/rag/query': 'إرسال استعلام لوكيل RAG فقط',
      'POST /api/multi-agent/query': 'إرسال استعلام لنظام الوكلاء المتعددة (ذكي)',
      'GET /api/stats': 'إحصائيات مفصلة',
      'GET /api/health': 'فحص حالة الخادم',
      'GET /api/csrf-token': 'الحصول على CSRF token',
    }
  });
});

/**
 * فحص حالة الخادم المحسن
 */
app.get('/api/health', async (req, res) => {
  try {
    const stats = agentManager.getStats();
    const healthStatus = {
      status: stats.errorRate === '0%' || parseFloat(stats.errorRate) < 10 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(stats.uptime / 60)} دقيقة`,
      memory: `${stats.memory.used} MB`,
      isInitialized: stats.isInitialized,
      requestCount: stats.requestCount,
      errorRate: stats.errorRate
    };

    res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? sanitizeLogInput(error.message) : 'خطأ غير معروف'
    });
  }
});

/**
 * إحصائيات مفصلة
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = agentManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? sanitizeLogInput(error.message) : 'خطأ في الحصول على الإحصائيات'
    });
  }
});

/**
 * الحصول على CSRF token محسن
 */
app.get('/api/csrf-token', (req, res) => {
  try {
    const sessionId = sanitizeInput(req.headers['x-session-id'] as string || crypto.randomUUID(), 100);
    const token = generateCSRFToken();
    
    csrfTokenStore.set(sessionId, token);
    
    res.json({
      csrfToken: token,
      sessionId: sessionId,
      expiresIn: '1 hour'
    });
  } catch (error) {
    res.status(500).json({
      error: 'خطأ في إنشاء CSRF token'
    });
  }
});

/**
 * استعلام الوكيل المدمج المحسن
 */
app.post('/api/agent/query', apiLimiter, async (req, res) => {
  try {
    const { query, csrfToken } = req.body;
    const sessionId = sanitizeInput(req.headers['x-session-id'] as string || 'default', 100);

    // CSRF validation (optional for public API)
    if (csrfToken) {
      const storedToken = csrfTokenStore.get(sessionId);
      if (!storedToken || !validateCSRFToken(csrfToken, storedToken)) {
        return res.status(403).json({ error: 'CSRF token غير صالح' });
      }
    }

    // Enhanced query validation
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
      response: sanitizeInput(response, 50000), // Limit response size
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      agent: 'hybrid-enhanced'
    });

  } catch (error) {
    console.error('❌ خطأ في الاستعلام:', error);
    res.status(500).json({
      error: error instanceof Error ? sanitizeLogInput(error.message) : 'خطأ في معالجة الاستعلام'
    });
  }
});

/**
 * استعلام وكيل RAG المحسن
 */
app.post('/api/rag/query', apiLimiter, async (req, res) => {
  try {
    const { query, csrfToken } = req.body;
    const sessionId = sanitizeInput(req.headers['x-session-id'] as string || 'default', 100);

    if (csrfToken) {
      const storedToken = csrfTokenStore.get(sessionId);
      if (!storedToken || !validateCSRFToken(csrfToken, storedToken)) {
        return res.status(403).json({ error: 'CSRF token غير صالح' });
      }
    }

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
      response: sanitizeInput(response, 50000),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      agent: 'rag-enhanced'
    });

  } catch (error) {
    console.error('❌ خطأ في استعلام RAG:', error);
    res.status(500).json({
      error: error instanceof Error ? sanitizeLogInput(error.message) : 'خطأ في معالجة استعلام RAG'
    });
  }
});

/**
 * استعلام نظام الوكلاء المتعددة المحسن
 */
app.post('/api/multi-agent/query', apiLimiter, async (req, res) => {
  try {
    const { query, sessionId: requestSessionId } = req.body;
    
    const queryValidation = validateQueryInput(query);
    if (!queryValidation.valid) {
      return res.status(400).json({
        error: queryValidation.error || 'يرجى تقديم استعلام صحيح في حقل query'
      });
    }
    
    const sessionId = sanitizeInput(requestSessionId || `session_${Date.now()}`, 100);
    
    console.log(`🤖 استعلام نظام الوكلاء المتعددة: "${sanitizeLogInput(queryValidation.sanitized)}"`);
    
    const startTime = Date.now();
    const result = await agentManager.queryMultiAgentSystem(queryValidation.sanitized, sessionId);
    const duration = Date.now() - startTime;
    
    console.log(`📤 تم الرد من ${sanitizeLogInput(result.result.agentName)} في ${duration}ms`);
    
    res.json({
      query: queryValidation.sanitized,
      result: {
        ...result.result,
        response: sanitizeInput(result.result.response, 50000)
      },
      analysis: result.analysis,
      alternatives: result.alternatives?.map(alt => ({
        ...alt,
        response: sanitizeInput(alt.response, 10000)
      })),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      type: 'multi-agent-smart-enhanced'
    });
    
  } catch (error) {
    console.error('❌ خطأ في نظام الوكلاء المتعددة:', error);
    res.status(500).json({
      error: error instanceof Error ? sanitizeLogInput(error.message) : 'خطأ في معالجة الاستعلام'
    });
  }
});

/**
 * معالج الأخطاء العام المحسن
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 خطأ غير متوقع:', error);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'خطأ داخلي في الخادم',
    message: isDevelopment ? sanitizeLogInput(error.message) : 'حدث خطأ غير متوقع',
    timestamp: new Date().toISOString()
  });
});

/**
 * معالج الطرق غير الموجودة
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'الطريق غير موجود',
    path: sanitizeLogInput(req.originalUrl),
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

/**
 * بدء الخادم المحسن
 */
async function startEnhancedServer() {
  try {
    console.log('🚀 بدء تشغيل خادم الوكيل المتقدم المحسن...');
    
    // Initialize agent in background
    agentManager.initialize().catch(error => {
      console.error('⚠️  تحذير: فشل في تهيئة الوكيل:', error.message);
      console.log('💡 سيتم إعادة المحاولة عند أول استعلام');
    });
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ خادم الوكيل المتقدم المحسن يعمل على المنفذ ${PORT}`);
      console.log(`🌐 الرابط: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🛡️  الحماية الأمنية: مفعلة`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 إيقاف الخادم...');
      server.close(() => {
        console.log('✅ تم إيقاف الخادم بنجاح');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('💥 فشل في بدء الخادم:', error);
    process.exit(1);
  }
}

// Start server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startEnhancedServer();
}

export { EnhancedAgentManager, app };