#!/usr/bin/env node

/**
 * وكيل ذكي باستخدام LangChain.js
 * يدعم Anthropic Claude و OpenAI GPT مع أدوات مخصصة
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

// ====================================
// CWE-117 Prevention: تعقيم السجلات
// ====================================
function sanitizeLogInput(input: any): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .substring(0, 500);
}

// ====================================
// CWE-918 Prevention: قائمة بيضاء للنطاقات
// ====================================
const ALLOWED_DOMAINS = [
  'api.github.com',
  'api.openai.com',
  'jsonplaceholder.typicode.com',
  'httpbin.org',
  'api.weather.gov'
];

function isUrlAllowed(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    // منع الوصول للشبكات الداخلية
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.local')) {
      return false;
    }
    // فقط HTTPS للأمان
    if (url.protocol !== 'https:') {
      return false;
    }
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// تكوين النماذج المتاحة
const MODELS = {
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
function createLanguageModel(provider: keyof typeof MODELS): BaseLanguageModel {
  const config = MODELS[provider];
  
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
 * أداة الطقس المخصصة
 */
const weatherTool = new DynamicTool({
  name: "get_weather",
  description: "الحصول على معلومات الطقس لمدينة معينة. استخدم هذه الأداة عندما يسأل المستخدم عن الطقس.",
  func: async (city: string) => {
    // محاكاة بيانات الطقس - في التطبيق الحقيقي ستستخدم API حقيقي
    const weatherData: Record<string, string> = {
      "القاهرة": "مشمس، 28°م، رطوبة 45%",
      "الرياض": "حار، 35°م، رطوبة 20%",
      "دبي": "مشمس، 32°م، رطوبة 60%",
      "بيروت": "غائم جزئياً، 25°م، رطوبة 70%",
      "الكويت": "حار، 38°م، رطوبة 25%",
      "الدوحة": "مشمس، 33°م، رطوبة 55%"
    };
    
    const weather = weatherData[city.trim()];
    if (weather) {
      return `الطقس في ${city}: ${weather}`;
    } else {
      return `عذراً، لا توجد بيانات طقس متاحة لمدينة "${city}". المدن المتاحة: ${Object.keys(weatherData).join(', ')}`;
    }
  },
});

/**
 * أداة طلبات HTTP
 */
const httpTool = new DynamicTool({
  name: "http_request",
  description: "إرسال طلب HTTP GET لجلب البيانات من URL معين (فقط من النطاقات المسموحة).",
  func: async (url: string) => {
    try {
      // CWE-918 Prevention: التحقق من URL
      if (!isUrlAllowed(url)) {
        return `❌ URL غير مسموح به. النطاقات المسموحة: ${ALLOWED_DOMAINS.join(', ')}`;
      }

      console.log(`🌐 إرسال طلب HTTP إلى: ${sanitizeLogInput(url)}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LangChain-Agent/1.0'
        }
      });
      
      if (!response.ok) {
        return `خطأ HTTP: ${response.status} - ${response.statusText}`;
      }
      
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return JSON.stringify(data, null, 2);
      } else {
        const text = await response.text();
        // قطع النص إذا كان طويلاً جداً
        const sanitizedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
        return sanitizeLogInput(sanitizedText);
      }
    } catch (error) {
      return `خطأ في الطلب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
    }
  },
});

/**
 * أداة معالجة النصوص
 */
const textProcessorTool = new DynamicTool({
  name: "text_processor",
  description: "معالجة النصوص بعمليات مختلفة: count_words (عد الكلمات), count_chars (عد الأحرف), reverse (عكس النص), uppercase (أحرف كبيرة), lowercase (أحرف صغيرة). الصيغة: operation:text",
  func: async (input: string) => {
    const [operation, ...textParts] = input.split(':');
    const text = textParts.join(':').trim();
    
    if (!text) {
      return sanitizeLogInput("يرجى تقديم النص للمعالجة. الصيغة: operation:text");
    }
    
    switch (operation.toLowerCase()) {
      case 'count_words':
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        return `عدد الكلمات في النص: ${wordCount}`;
      
      case 'count_chars':
        return `عدد الأحرف في النص: ${text.length}`;
      
      case 'reverse':
        return `النص المعكوس: ${text.split('').reverse().join('')}`;
      
      case 'uppercase':
        return `النص بأحرف كبيرة: ${text.toUpperCase()}`;
      
      case 'lowercase':
        return `النص بأحرف صغيرة: ${text.toLowerCase()}`;
      
      default:
        return `عملية غير مدعومة: ${operation}. العمليات المتاحة: count_words, count_chars, reverse, uppercase, lowercase`;
    }
  },
});

/**
 * إنشاء وكيل LangChain
 */
async function createAgent(provider: keyof typeof MODELS) {
  try {
    console.log(`🤖 إنشاء وكيل باستخدام ${MODELS[provider].name}...`);
    
    // إنشاء نموذج اللغة
    const llm = createLanguageModel(provider);
    
    // تجميع الأدوات
    const tools = [
      new Calculator(),
      weatherTool,
      httpTool,
      textProcessorTool
    ];
    
    // إنشاء الوكيل مع LangGraph
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: new MemorySaver(),
    });
    
    console.log(`✅ تم إنشاء الوكيل بنجاح باستخدام ${MODELS[provider].name}`);
    console.log(`🛠️  الأدوات المتاحة: ${tools.map(t => t.name).join(', ')}`);
    
    return agent;
    
  } catch (error) {
    console.error(`❌ خطأ في إنشاء الوكيل:`, error);
    throw error;
  }
}

/**
 * تشغيل الوكيل مع استعلام
 */
async function runAgent(agent: any, query: string) {
  try {
    console.log(`\n🔍 معالجة الاستعلام: "${sanitizeLogInput(query)}"`);
    console.log("⏳ جاري التفكير...\n");
    
    const startTime = Date.now();
    
    // إنشاء thread ID فريد
    const threadId = `thread_${Date.now()}`;
    
    const result = await agent.invoke(
      { messages: [new HumanMessage(query)] },
      { configurable: { thread_id: threadId } }
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // استخراج الرد الأخير
    const lastMessage = result.messages[result.messages.length - 1];
    const response = lastMessage.content;
    
    console.log(`\n✨ الإجابة النهائية:`);
    console.log(`${sanitizeLogInput(response)}`);
    console.log(`\n⏱️  وقت المعالجة: ${duration} ثانية`);
    
    return response;
    
  } catch (error) {
    console.error(`❌ خطأ في تشغيل الوكيل:`, error);
    throw error;
  }
}

/**
 * اختيار الموفر
 */
function selectProvider(): keyof typeof MODELS {
  const availableProviders = Object.entries(MODELS)
    .filter(([_, config]) => config.apiKey)
    .map(([key, _]) => key as keyof typeof MODELS);
  
  if (availableProviders.length === 0) {
    throw new Error("لا توجد مفاتيح API متاحة. يرجى تعيين ANTHROPIC_API_KEY أو OPENAI_API_KEY");
  }
  
  // اختيار أول موفر متاح
  return availableProviders[0];
}

/**
 * الدالة الرئيسية
 */
async function main() {
  try {
    console.log("🚀 بدء تشغيل وكيل LangChain.js");
    console.log("=" .repeat(50));
    
    // اختيار الموفر
    const provider = selectProvider();
    console.log(`📡 الموفر المختار: ${MODELS[provider].name}`);
    
    // إنشاء الوكيل
    const agent = await createAgent(provider);
    
    // أمثلة للاختبار
    const testQueries = [
      "ما هو الطقس في القاهرة؟",
      "احسب 15 * 23 + 45",
      "عد الكلمات في هذا النص: مرحباً بك في عالم الذكاء الاصطناعي",
      "اجلب معلومات من https://api.github.com/users/octocat"
    ];
    
    console.log(`\n🧪 تشغيل ${testQueries.length} اختبارات...\n`);
    
    for (let i = 0; i < testQueries.length; i++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 اختبار ${i + 1}/${testQueries.length}`);
      console.log(`${'='.repeat(60)}`);
      
      await runAgent(agent, testQueries[i]);
      
      // توقف قصير بين الاختبارات
      if (i < testQueries.length - 1) {
        console.log("\n⏸️  توقف لثانيتين...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 تم الانتهاء من جميع الاختبارات بنجاح!`);
    
  } catch (error) {
    console.error("💥 خطأ في التطبيق الرئيسي:", error);
    process.exit(1);
  }
}

// تشغيل التطبيق إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createAgent, runAgent, MODELS };