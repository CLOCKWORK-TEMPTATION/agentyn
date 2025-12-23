#!/usr/bin/env node

/**
 * وكيل مدمج يجمع بين LangChain و RAG
 * يدعم الأدوات العادية + البحث في المستندات
 */

import 'dotenv/config';
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import { Calculator } from "@langchain/community/tools/calculator";
import { DynamicTool } from "@langchain/core/tools";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage } from "@langchain/core/messages";
import { SimpleRAGAgent, setupLlamaIndexModel } from './rag-agent.js';
import { advancedTools } from './advanced-tools.js';

// تكوين النماذج المتاحة
const HYBRID_MODELS = {
  anthropic: {
    name: "Anthropic Claude",
    model: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  openai: {
    name: "OpenAI GPT",
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  }
};

/**
 * إنشاء نموذج اللغة حسب الموفر المختار
 */
function createLanguageModel(provider: keyof typeof HYBRID_MODELS): BaseLanguageModel {
  const config = HYBRID_MODELS[provider];
  
  if (!config.apiKey) {
    throw new Error(`مفتاح API مفقود للموفر: ${config.name}`);
  }

  switch (provider) {
    case 'anthropic':
      return new ChatAnthropic({
        model: config.model,
        temperature: 0.7,
        apiKey: config.apiKey,
        maxTokens: 4096,
      });
    
    case 'openai':
      return new ChatOpenAI({
        model: config.model,
        temperature: 0.7,
        apiKey: config.apiKey,
        maxTokens: 4096,
      });
    
    default:
      throw new Error(`موفر غير مدعوم: ${provider}`);
  }
}

/**
 * فئة الوكيل المدمج
 */
class HybridAgent {
  private langchainAgent: any = null;
  private ragAgent: SimpleRAGAgent;
  private provider: keyof typeof HYBRID_MODELS;

  constructor(provider: keyof typeof HYBRID_MODELS) {
    this.provider = provider;
    this.ragAgent = new SimpleRAGAgent();
  }

  /**
   * تهيئة الوكيل المدمج
   */
  async initialize() {
    try {
      console.log(`🤖 تهيئة الوكيل المدمج باستخدام ${HYBRID_MODELS[this.provider].name}...`);
      
      // إعداد RAG
      if (this.provider === 'openai' || process.env.OPENAI_API_KEY) {
        setupLlamaIndexModel();
        
        // تحميل أو إنشاء فهرس RAG
        await this.ragAgent.loadDocuments();
      }
      
      // إنشاء أداة RAG
      const ragTool = new DynamicTool({
        name: "knowledge_search",
        description: "البحث في قاعدة المعرفة المحلية للحصول على معلومات حول الذكاء الاصطناعي والتعلم الآلي ولغات البرمجة. استخدم هذه الأداة عندما يسأل المستخدم عن مواضيع تقنية متخصصة.",
        func: async (query: string) => {
          try {
            if (!this.ragAgent) {
              return "عذراً، قاعدة المعرفة غير متاحة حالياً.";
            }
            
            console.log(`🔍 البحث في قاعدة المعرفة عن: "${query}"`);
            const result = await this.ragAgent.query(query);
            return `📚 من قاعدة المعرفة:\n${result}`;
          } catch (error) {
            return `خطأ في البحث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
          }
        },
      });

      // الأدوات العادية
      const weatherTool = new DynamicTool({
        name: "get_weather",
        description: "الحصول على معلومات الطقس لمدينة معينة.",
        func: async (city: string) => {
          const weatherData: Record<string, string> = {
            "القاهرة": "مشمس، 28°م، رطوبة 45%",
            "الرياض": "حار، 35°م، رطوبة 20%",
            "دبي": "مشمس، 32°م، رطوبة 60%",
            "بيروت": "غائم جزئياً، 25°م، رطوبة 70%",
            "الكويت": "حار، 38°م، رطوبة 25%",
            "الدوحة": "مشمس، 33°م، رطوبة 55%"
          };
          
          const weather = weatherData[city.trim()];
          return weather ? `الطقس في ${city}: ${weather}` : `لا توجد بيانات طقس لـ ${city}`;
        },
      });

      const httpTool = new DynamicTool({
        name: "http_request",
        description: "إرسال طلب HTTP GET لجلب البيانات من URL معين.",
        func: async (url: string) => {
          try {
            const response = await fetch(url, {
              headers: { 'User-Agent': 'HybridAgent/1.0' }
            });
            
            if (!response.ok) {
              return `خطأ HTTP: ${response.status}`;
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
              const data = await response.json();
              return JSON.stringify(data, null, 2);
            } else {
              const text = await response.text();
              return text.length > 2000 ? text.substring(0, 2000) + '...' : text;
            }
          } catch (error) {
            return `خطأ في الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
          }
        },
      });

      // تجميع جميع الأدوات
      const tools = [
        new Calculator(),
        ragTool,
        weatherTool,
        httpTool,
        ...advancedTools // إضافة الأدوات المتقدمة
      ];

      // إنشاء وكيل LangChain
      const llm = createLanguageModel(this.provider);
      
      this.langchainAgent = createReactAgent({
        llm,
        tools,
        checkpointSaver: new MemorySaver(),
      });

      console.log(`✅ تم تهيئة الوكيل المدمج بنجاح`);
      console.log(`🛠️  الأدوات المتاحة: ${tools.map(t => t.name).join(', ')}`);
      
      return true;
      
    } catch (error) {
      console.error(`❌ خطأ في تهيئة الوكيل المدمج:`, error);
      throw error;
    }
  }

  /**
   * تشغيل استعلام على الوكيل المدمج
   */
  async query(question: string) {
    if (!this.langchainAgent) {
      throw new Error("الوكيل غير مُهيأ. يجب استدعاء initialize() أولاً.");
    }

    try {
      console.log(`\n🔍 معالجة الاستعلام: "${question}"`);
      console.log("⏳ جاري التفكير والبحث...\n");
      
      const startTime = Date.now();
      
      // إنشاء thread ID فريد
      const threadId = `hybrid_thread_${Date.now()}`;
      
      const result = await this.langchainAgent.invoke(
        { messages: [new HumanMessage(question)] },
        { configurable: { thread_id: threadId } }
      );
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      // استخراج الرد الأخير
      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage.content;
      
      console.log(`\n✨ الإجابة النهائية:`);
      console.log(`${response}`);
      console.log(`\n⏱️  وقت المعالجة: ${duration} ثانية`);
      
      return response;
      
    } catch (error) {
      console.error(`❌ خطأ في تشغيل الوكيل المدمج:`, error);
      throw error;
    }
  }

  /**
   * إضافة مستند جديد إلى قاعدة المعرفة
   */
  async addKnowledge(filename: string, content: string) {
    try {
      await this.ragAgent.addDocument(filename, content);
      console.log(`📄 تم إضافة معرفة جديدة: ${filename}`);
      return true;
    } catch (error) {
      console.error("❌ خطأ في إضافة المعرفة:", error);
      return false;
    }
  }

  /**
   * الحصول على إحصائيات الوكيل
   */
  getStats() {
    return {
      provider: this.provider,
      providerName: HYBRID_MODELS[this.provider].name,
      ragStats: this.ragAgent.getStats(),
      isInitialized: !!this.langchainAgent,
    };
  }
}

/**
 * اختيار الموفر
 */
function selectHybridProvider(): keyof typeof HYBRID_MODELS {
  const availableProviders = Object.entries(HYBRID_MODELS)
    .filter(([_, config]) => config.apiKey)
    .map(([key, _]) => key as keyof typeof HYBRID_MODELS);
  
  if (availableProviders.length === 0) {
    throw new Error("لا توجد مفاتيح API متاحة. يرجى تعيين ANTHROPIC_API_KEY أو OPENAI_API_KEY");
  }
  
  // أولوية لـ OpenAI لأنه يدعم RAG بشكل أفضل
  if (availableProviders.includes('openai')) {
    return 'openai';
  }
  
  return availableProviders[0];
}

/**
 * الدالة الرئيسية
 */
async function main() {
  try {
    console.log("🚀 بدء تشغيل الوكيل المدمج (LangChain + RAG)");
    console.log("=" .repeat(60));
    
    // اختيار الموفر
    const provider = selectHybridProvider();
    console.log(`📡 الموفر المختار: ${HYBRID_MODELS[provider].name}`);
    
    // إنشاء وتهيئة الوكيل المدمج
    const hybridAgent = new HybridAgent(provider);
    await hybridAgent.initialize();
    
    // عرض الإحصائيات
    const stats = hybridAgent.getStats();
    console.log(`📊 إحصائيات الوكيل:`, stats);
    
    // أسئلة اختبار متنوعة للأدوات المتقدمة
    const testQueries = [
      "ما هو الطقس في القاهرة؟", // أداة الطقس
      "احسب 25 * 17 + 100", // حاسبة
      "ما هو الذكاء الاصطناعي؟", // RAG
      "اقرأ ملف package.json", // قراءة ملف
      "ابحث عن جميع ملفات TypeScript في المشروع", // Glob
      "ابحث عن كلمة 'agent' في ملفات المشروع", // Grep
      "أنشئ ملف test.txt يحتوي على 'مرحبا بالعالم'", // كتابة ملف
      "اجلب معلومات من https://api.github.com/users/octocat", // HTTP
      "أنشئ قائمة مهام بعنوان 'مشروع الوكلاء' مع 3 مهام", // TODO
      "نفذ الأمر: dir", // Bash (Windows)
      "استخدم مهارة analyze_code على ملف src/index.ts", // Skill
      "نفذ الأمر المختصر /status", // Slash Command
    ];
    
    console.log(`\n🧪 تشغيل ${testQueries.length} اختبارات متنوعة...\n`);
    
    for (let i = 0; i < testQueries.length; i++) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🧪 اختبار ${i + 1}/${testQueries.length}`);
      console.log(`${'='.repeat(70)}`);
      
      await hybridAgent.query(testQueries[i]);
      
      // توقف قصير بين الاختبارات
      if (i < testQueries.length - 1) {
        console.log("\n⏸️  توقف لثانيتين...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 تم الانتهاء من جميع اختبارات الوكيل المدمج بنجاح!`);
    
  } catch (error) {
    console.error("💥 خطأ في الوكيل المدمج:", error);
    process.exit(1);
  }
}

// تشغيل التطبيق إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { HybridAgent, selectHybridProvider };