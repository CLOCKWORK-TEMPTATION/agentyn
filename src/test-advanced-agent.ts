#!/usr/bin/env node

/**
 * اختبار شامل للوكيل المتقدم مع جميع الأدوات
 */

import 'dotenv/config';
import { HybridAgent } from './hybrid-agent.js';

/**
 * تنظيف المدخلات لمنع حقن السجلات (CWE-117)
 */
function sanitizeLogInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  return input
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .substring(0, 1000);
}

async function testAdvancedAgent() {
  try {
    console.log("🚀 بدء اختبار الوكيل المتقدم مع جميع الأدوات");
    console.log("=" .repeat(70));
    
    // إنشاء وتهيئة الوكيل المتقدم
    const agent = new HybridAgent('openai'); // أو 'anthropic'
    await agent.initialize();
    
    // عرض الإحصائيات
    const stats = agent.getStats();
    console.log(`📊 إحصائيات الوكيل:`, stats);
    
    // اختبارات شاملة لجميع الأدوات
    const advancedTests = [
      {
        category: "🧮 الحسابات والطقس",
        tests: [
          "احسب الجذر التربيعي لـ 144 مضروب في 5",
          "ما هو الطقس في دبي؟"
        ]
      },
      {
        category: "📚 قاعدة المعرفة (RAG)",
        tests: [
          "ما هي أنواع التعلم الآلي؟",
          "اشرح لي الفرق بين Python و JavaScript في مجال AI"
        ]
      },
      {
        category: "📁 إدارة الملفات",
        tests: [
          "اقرأ ملف package.json",
          "أنشئ ملف test-output.txt يحتوي على 'اختبار الوكيل المتقدم - تم بنجاح!'",
          "ابحث عن جميع ملفات .ts في المشروع"
        ]
      },
      {
        category: "🔍 البحث والتحليل",
        tests: [
          "ابحث عن كلمة 'agent' في ملفات المشروع",
          "ابحث عن جميع ملفات JSON"
        ]
      },
      {
        category: "💻 تنفيذ الأوامر",
        tests: [
          "نفذ الأمر: echo 'مرحبا من الوكيل المتقدم'",
          "نفذ الأمر: dir src"
        ]
      },
      {
        category: "🌐 الويب والشبكة",
        tests: [
          "اجلب معلومات من https://api.github.com/users/octocat",
          "ابحث على الويب عن 'TypeScript LangChain'"
        ]
      },
      {
        category: "📋 المهام والمهارات",
        tests: [
          "أنشئ قائمة مهام بعنوان 'تطوير الوكلاء' مع المهام: تصميم الهيكل، كتابة الكود، الاختبار",
          "استخدم مهارة analyze_code على ملف src/index.ts"
        ]
      },
      {
        category: "⚡ الأوامر المختصرة",
        tests: [
          "نفذ الأمر المختصر /status",
          "نفذ الأمر المختصر /info"
        ]
      }
    ];
    
    let totalTests = 0;
    let successfulTests = 0;
    
    for (const category of advancedTests) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`${category.category}`);
      console.log(`${'='.repeat(70)}`);
      
      for (let i = 0; i < category.tests.length; i++) {
        const test = category.tests[i];
        totalTests++;
        
        console.log(`\n🧪 اختبار ${totalTests}: ${sanitizeLogInput(test)}`);
        console.log("-".repeat(50));
        
        try {
          const startTime = Date.now();
          const response = await agent.query(test);
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);
          
          console.log(`✅ نجح الاختبار (${duration}s)`);
          console.log(`📤 الاستجابة: ${sanitizeLogInput(response.substring(0, 200))}${response.length > 200 ? '...' : ''}`);
          successfulTests++;
          
        } catch (error) {
          console.log(`❌ فشل الاختبار: ${sanitizeLogInput(error instanceof Error ? error.message : 'خطأ غير معروف')}`);
        }
        
        // توقف قصير بين الاختبارات
        if (i < category.tests.length - 1 || category !== advancedTests[advancedTests.length - 1]) {
          console.log("\n⏸️  توقف لثانيتين...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // تقرير نهائي
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 تقرير الاختبارات النهائي`);
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ الاختبارات الناجحة: ${successfulTests}/${totalTests}`);
    console.log(`📈 معدل النجاح: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    if (successfulTests === totalTests) {
      console.log(`🎉 جميع الاختبارات نجحت! الوكيل المتقدم يعمل بكامل طاقته.`);
    } else {
      console.log(`⚠️  ${totalTests - successfulTests} اختبار فشل. يرجى مراجعة الأخطاء أعلاه.`);
    }
    
    // عرض قائمة الأدوات المتاحة
    console.log(`\n📋 الأدوات المتاحة في الوكيل المتقدم:`);
    const toolsList = [
      "🧮 Calculator - حاسبة رياضية متقدمة",
      "📚 Knowledge Search - البحث في قاعدة المعرفة",
      "🌤️  Weather - معلومات الطقس",
      "🌐 HTTP Request - طلبات الويب",
      "📖 Read File - قراءة الملفات",
      "✏️  Write File - كتابة الملفات", 
      "📝 Edit File - تعديل الملفات",
      "💻 Bash Execute - تنفيذ أوامر النظام",
      "🔍 Glob Search - البحث عن الملفات",
      "🔎 Grep Search - البحث في المحتوى",
      "🌐 Web Fetch - جلب محتوى الويب",
      "🔍 Web Search - البحث على الويب",
      "📋 Todo Write - إنشاء قوائم المهام",
      "🎯 Skill Execute - تنفيذ المهارات المخصصة",
      "⚡ Slash Command - الأوامر المختصرة"
    ];
    
    toolsList.forEach(tool => console.log(`   ${sanitizeLogInput(tool)}`));
    
    console.log(`\n🎯 الوكيل المتقدم جاهز للاستخدام مع ${toolsList.length} أداة متقدمة!`);
    
  } catch (error) {
    console.error("💥 خطأ في اختبار الوكيل المتقدم:", error);
    process.exit(1);
  }
}

// تشغيل الاختبار
if (import.meta.url === `file://${process.argv[1]}`) {
  testAdvancedAgent();
}

export { testAdvancedAgent };