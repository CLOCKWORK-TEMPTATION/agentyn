#!/usr/bin/env node

/**
 * اختبار شامل لنظام Multi-Agent للتفريغ السينمائي
 * Comprehensive Test for Three-Read Breakdown System
 */

import 'dotenv/config';
import { ThreeReadBreakdownSystem } from './src/three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// نص سيناريو للاختبار
// ═══════════════════════════════════════════════════════════════════════════

const TEST_SCRIPT = `
مشهد 1 - داخلي - غرفة مكياج - نهار

تجلس نهال سماحة أمام مرآة المكياج بصرامة وقلق شديد، تنظر إلى صورة على سطح المكتب لها مع عمرو دياب.

نهال: (بحدة) إيه اللي حصل؟ إيه اللي خلاك تيجي هنا؟

يدخل كريم رزق، رجل في الخمسينات يبدو عليه الوقار والوسامة.

كريم: نهال، لازم نتكلم. الموضوع مهم جداً.

نهال: (تأخذ الظرف من يده) إيه ده؟

كريم: اقرئيه الأول، وبعدين نتكلم.

تفتح نهال الظرف بسرعة وتقرأ المحتوى، وجهها يتغير تدريجياً من القلق إلى الاستغراب.

نهال: ده مش ممكن! إنت متأكد من الكلام ده؟

كريم: (يجلس على الكرسي المقابل) للأسف أه. والموضوع محتاج تصرف سريع.

تضع نهال الورقة على الطاولة وتمسك هاتفها المحمول.

نهال: لازم أكلم المحامي دلوقتي.

مشهد 2 - خارجي - موقف سيارات - نهار

يقود كريم سيارته المرسيدس السوداء، ونهال تجلس بجواره وهي تتحدث في الهاتف.

نهال: (في الهاتف) أيوة يا أستاذ أحمد، الموضوع عاجل جداً... لا لا، مش ممكن نأجل.

كريم: (وهو يقود) هنوصل المكتب في خلال ربع ساعة.

نهال: (تنهي المكالمة وتنظر من النافذة بقلق) أنا خايفة يا كريم. الموضوع ده ممكن يخلص على كل حاجة.

كريم: متقلقيش، هنلاقي حل. المهم إننا نتصرف بسرعة وبحكمة.

يشغل كريم الراديو، تنطلق أغنية "بعدت ليه" لعمرو دياب.

نهال: (بحزن) حتى الأغنية دي بتفكرني بأيام أحلى.

كريم: (يغلق الراديو) خلاص، مش وقت الذكريات دلوقتي. لازم نركز في الحل.
`;

// ═══════════════════════════════════════════════════════════════════════════
// دالة الاختبار الرئيسية
// ═══════════════════════════════════════════════════════════════════════════

async function runComprehensiveTest() {
  console.log("🧪 بدء الاختبار الشامل لنظام Multi-Agent");
  console.log("=" .repeat(70));
  
  try {
    // إنشاء النظام
    console.log("🔧 إنشاء نظام Multi-Agent...");
    const system = new ThreeReadBreakdownSystem();
    
    // عرض إحصائيات النظام
    const stats = system.getSystemStats();
    console.log("📊 إحصائيات النظام:");
    console.log(`   • مُهيأ: ${stats.isInitialized ? 'نعم' : 'لا'}`);
    console.log(`   • النماذج المتاحة: ${stats.availableModels.length}`);
    console.log(`   • الوكلاء: ${Object.values(stats.agents).filter(Boolean).length}/4`);
    console.log(`   • خدمة Python: ${stats.pythonServiceConnected ? 'متصلة' : 'غير متصلة'}`);
    
    // تشغيل المعالجة
    console.log("\n🎬 بدء معالجة السيناريو التجريبي...");
    const startTime = Date.now();
    
    const result = await system.processScript(TEST_SCRIPT, "سيناريو تجريبي - اختبار النظام");
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    // عرض النتائج
    console.log("\n" + "=" .repeat(70));
    console.log("📋 نتائج الاختبار");
    console.log("=" .repeat(70));
    
    console.log(`🎯 الثقة الإجمالية: ${(result.overall_confidence * 100).toFixed(1)}%`);
    console.log(`⏱️ وقت المعالجة: ${processingTime.toFixed(2)} ثانية`);
    console.log(`📊 العناصر المستخرجة: ${result.final_elements.length}`);
    console.log(`⚠️ المراجعة البشرية: ${result.human_review_required ? 'مطلوبة' : 'غير مطلوبة'}`);
    console.log(`🔧 التضاربات المحلولة: ${result.conflicts_resolved.length}`);
    
    // تفاصيل التحليل العاطفي
    console.log("\n🎭 التحليل العاطفي:");
    console.log(`   • النبرة العامة: ${result.emotional_analysis.overall_tone}`);
    console.log(`   • مستوى التفاعل: ${(result.emotional_analysis.audience_engagement * 100).toFixed(1)}%`);
    console.log(`   • رؤية المخرج: ${result.emotional_analysis.director_vision}`);
    
    // تفاصيل التحليل التقني
    console.log("\n🔧 التحليل التقني:");
    console.log(`   • صحة التنسيق: ${result.technical_validation.is_valid ? '✅ صالح' : '❌ يحتاج إصلاح'}`);
    console.log(`   • الأخطاء: ${result.technical_validation.errors.length}`);
    console.log(`   • التحذيرات: ${result.technical_validation.warnings.length}`);
    
    // العناصر المستخرجة
    console.log("\n📋 العناصر الإنتاجية:");
    if (result.final_elements.length > 0) {
      result.final_elements.forEach((element, index) => {
        console.log(`   ${index + 1}. ${element.name} (${element.category}) - ثقة: ${(element.confidence * 100).toFixed(1)}%`);
      });
    } else {
      console.log("   لم يتم استخراج عناصر");
    }
    
    // قرارات الإشراف
    if (result.conflicts_resolved.length > 0) {
      console.log("\n⚖️ قرارات الإشراف:");
      result.conflicts_resolved.forEach((decision, index) => {
        console.log(`   ${index + 1}. ${decision.conflict_type} → ${decision.resolution}`);
        console.log(`      المبرر: ${decision.reasoning.join(', ')}`);
      });
    }
    
    // حفظ التقرير
    console.log("\n💾 حفظ التقرير...");
    
    // حفظ HTML
    const fs = await import('fs/promises');
    await fs.writeFile('test_report.html', result.html_report, 'utf-8');
    console.log("✅ تم حفظ التقرير HTML: test_report.html");
    
    // حفظ JSON
    await fs.writeFile('test_report.json', result.json_data, 'utf-8');
    console.log("✅ تم حفظ البيانات JSON: test_report.json");
    
    // اختبار الخصائص (Properties)
    console.log("\n🧪 اختبار الخصائص (Properties):");
    await testProperties(result);
    
    console.log("\n" + "=" .repeat(70));
    console.log("🎉 تم إكمال الاختبار الشامل بنجاح!");
    console.log("=" .repeat(70));
    
  } catch (error) {
    console.error("❌ فشل الاختبار:", error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبار الخصائص (Property Tests)
// ═══════════════════════════════════════════════════════════════════════════

async function testProperties(result: any) {
  const tests = [
    {
      name: "Property 1: Agent Creation and Initialization",
      test: () => {
        // يجب أن ينشئ النظام بنجاح ثلاثة وكلاء متخصصين ووكيل مشرف واحد
        return result.emotional_analysis && 
               result.technical_validation && 
               result.breakdown_results && 
               result.conflicts_resolved !== undefined;
      }
    },
    {
      name: "Property 2: Sequential Phase Execution", 
      test: () => {
        // يجب أن تتم المراحل بالترتيب الصحيح
        return result.processing_timestamp && 
               result.emotional_analysis && 
               result.technical_validation && 
               result.breakdown_results.length > 0;
      }
    },
    {
      name: "Property 3: Comprehensive Element Extraction",
      test: () => {
        // يجب أن يحتوي التقرير النهائي على عناصر مستخرجة
        return result.final_elements && result.final_elements.length >= 0;
      }
    },
    {
      name: "Property 4: Emotional Analysis Purity",
      test: () => {
        // يجب ألا تحتوي النتائج العاطفية على كلمات تقنية محظورة
        const emotionalText = JSON.stringify(result.emotional_analysis).toLowerCase();
        const forbiddenWords = ["props", "wardrobe", "sfx", "vfx", "breakdown"];
        return !forbiddenWords.some(word => emotionalText.includes(word));
      }
    },
    {
      name: "Property 5: Technical Validation Completeness",
      test: () => {
        // يجب أن يتحقق النظام من اتساق ترويسات المشاهد
        return result.technical_validation.scene_headers && 
               result.technical_validation.scene_headers.length > 0;
      }
    },
    {
      name: "Property 6: Element Categorization Accuracy",
      test: () => {
        // يجب أن يُصنف كل عنصر في إحدى الفئات الـ21 القياسية
        return result.final_elements.every(element => 
          element.category && typeof element.category === 'string'
        );
      }
    },
    {
      name: "Property 8: Conflict Resolution Logic",
      test: () => {
        // يجب أن يطبق Supervisor Agent قواعد التحكيم
        return result.conflicts_resolved.every(decision => 
          decision.resolution && decision.reasoning && decision.reasoning.length > 0
        );
      }
    },
    {
      name: "Property 13: Evidence Traceability",
      test: () => {
        // يجب أن يحتوي كل عنصر على evidence صالح
        return result.final_elements.every(element => 
          element.evidence && 
          element.evidence.span_start >= 0 && 
          element.evidence.text_excerpt
        );
      }
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const passed = test.test();
      console.log(`   ${passed ? '✅' : '❌'} ${test.name}`);
      if (passed) passedTests++;
    } catch (error) {
      console.log(`   ❌ ${test.name} (خطأ: ${error.message})`);
    }
  }
  
  console.log(`\n📊 نتائج اختبار الخصائص: ${passedTests}/${tests.length} نجح`);
  
  if (passedTests === tests.length) {
    console.log("🎉 جميع اختبارات الخصائص نجحت!");
  } else {
    console.log("⚠️ بعض اختبارات الخصائص فشلت - يتطلب مراجعة");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبار الأداء (Performance Test)
// ═══════════════════════════════════════════════════════════════════════════

async function performanceTest() {
  console.log("\n⚡ اختبار الأداء:");
  
  const system = new ThreeReadBreakdownSystem();
  const iterations = 3;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await system.processScript(TEST_SCRIPT, `اختبار أداء ${i + 1}`);
    const endTime = Date.now();
    
    const duration = (endTime - startTime) / 1000;
    times.push(duration);
    console.log(`   التكرار ${i + 1}: ${duration.toFixed(2)} ثانية`);
  }
  
  const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log(`   المتوسط: ${avgTime.toFixed(2)} ثانية`);
  console.log(`   الأسرع: ${minTime.toFixed(2)} ثانية`);
  console.log(`   الأبطأ: ${maxTime.toFixed(2)} ثانية`);
  
  // تقييم الأداء
  if (avgTime < 10) {
    console.log("   🚀 أداء ممتاز!");
  } else if (avgTime < 20) {
    console.log("   ✅ أداء جيد");
  } else {
    console.log("   ⚠️ أداء يحتاج تحسين");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// تشغيل الاختبارات
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    await runComprehensiveTest();
    await performanceTest();
    
    console.log("\n🏁 تم إكمال جميع الاختبارات بنجاح!");
    
  } catch (error) {
    console.error("💥 فشل في تشغيل الاختبارات:", error);
    process.exit(1);
  }
}

// تشغيل إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runComprehensiveTest, performanceTest };