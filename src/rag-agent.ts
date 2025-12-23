#!/usr/bin/env node

/**
 * وكيل RAG (Retrieval-Augmented Generation) مبسط
 * يدعم تحميل المستندات والاستعلام الذكي عنها
 */

import 'dotenv/config';
import {
  Document,
  VectorStoreIndex,
  Settings,
} from "llamaindex";
import * as fs from 'fs';
import * as path from 'path';

// إعداد النماذج المتاحة
const RAG_MODELS = {
  openai: {
    name: "OpenAI GPT",
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  }
};

/**
 * إعداد نموذج LlamaIndex
 */
function setupLlamaIndexModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("يتطلب RAG مفتاح OpenAI API للعمل");
  }

  // LlamaIndex يستخدم OpenAI افتراضياً
  Settings.llm = {
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1,
    maxTokens: 4096,
  } as any;
}

/**
 * فئة وكيل RAG مبسط
 */
class SimpleRAGAgent {
  private index: VectorStoreIndex | null = null;
  private documentsPath: string;

  constructor(documentsPath: string = './documents') {
    this.documentsPath = documentsPath;
  }

  /**
   * إنشاء مجلد المستندات إذا لم يكن موجوداً
   */
  private ensureDocumentsDirectory() {
    if (!fs.existsSync(this.documentsPath)) {
      fs.mkdirSync(this.documentsPath, { recursive: true });
      console.log(`📁 تم إنشاء مجلد المستندات: ${this.documentsPath}`);
      
      // إنشاء ملفات مثال
      this.createSampleDocuments();
    }
  }

  /**
   * إنشاء مستندات مثال للاختبار
   */
  private createSampleDocuments() {
    const sampleDocs = [
      {
        filename: 'ai-basics.txt',
        content: `الذكاء الاصطناعي: مقدمة شاملة

الذكاء الاصطناعي (AI) هو مجال في علوم الحاسوب يهدف إلى إنشاء أنظمة قادرة على أداء مهام تتطلب عادة ذكاءً بشرياً.

أنواع الذكاء الاصطناعي:
1. الذكاء الاصطناعي الضيق (ANI): متخصص في مهمة واحدة
2. الذكاء الاصطناعي العام (AGI): قادر على أداء أي مهمة فكرية
3. الذكاء الاصطناعي الفائق (ASI): يتجاوز القدرات البشرية

تطبيقات الذكاء الاصطناعي:
- معالجة اللغات الطبيعية
- الرؤية الحاسوبية  
- التعلم الآلي
- الروبوتات
- الألعاب الذكية

التحديات:
- الأخلاقيات والخصوصية
- التحيز في البيانات
- الشفافية والتفسير
- الأمان والموثوقية`
      },
      {
        filename: 'machine-learning.txt',
        content: `التعلم الآلي: الأساسيات والتطبيقات

التعلم الآلي هو فرع من الذكاء الاصطناعي يمكّن الحاسوب من التعلم والتحسن من التجربة دون برمجة صريحة.

أنواع التعلم الآلي:

1. التعلم المُشرف عليه (Supervised Learning):
   - يستخدم بيانات مُصنفة مسبقاً
   - أمثلة: التصنيف، التنبؤ
   - خوارزميات: الشجرة القرارية، SVM، الشبكات العصبية

2. التعلم غير المُشرف عليه (Unsupervised Learning):
   - يعمل على بيانات غير مُصنفة
   - أمثلة: التجميع، تقليل الأبعاد
   - خوارزميات: K-means، PCA، DBSCAN

3. التعلم المُعزز (Reinforcement Learning):
   - يتعلم من خلال التفاعل مع البيئة
   - أمثلة: الألعاب، الروبوتات
   - خوارزميات: Q-Learning، Policy Gradient

خطوات مشروع التعلم الآلي:
1. جمع البيانات
2. تنظيف وتحضير البيانات
3. اختيار النموذج
4. تدريب النموذج
5. تقييم الأداء
6. النشر والمراقبة`
      },
      {
        filename: 'programming-languages.txt',
        content: `لغات البرمجة الشائعة في الذكاء الاصطناعي

Python:
- الأكثر شيوعاً في مجال الذكاء الاصطناعي
- مكتبات قوية: TensorFlow, PyTorch, scikit-learn
- سهولة التعلم والاستخدام
- مجتمع كبير ودعم واسع

JavaScript/TypeScript:
- متزايد الشعبية في AI
- مكتبات: TensorFlow.js, Brain.js
- يعمل في المتصفح والخادم
- مناسب للتطبيقات التفاعلية

R:
- متخصص في الإحصاء وتحليل البيانات
- مكتبات إحصائية متقدمة
- ممتاز للبحث والتحليل
- واجهات رسومية قوية

Java:
- أداء عالي وموثوقية
- مكتبات: Weka, DL4J, MOA
- مناسب للتطبيقات المؤسسية
- منصة متعددة الأنظمة

C++:
- أداء فائق السرعة
- مناسب للحوسبة عالية الأداء
- مكتبات: OpenCV, Caffe
- يستخدم في الأنظمة المدمجة

اختيار اللغة يعتمد على:
- نوع المشروع
- متطلبات الأداء
- خبرة الفريق
- النظام البيئي المتاح`
      }
    ];

    sampleDocs.forEach(doc => {
      const filePath = path.join(this.documentsPath, doc.filename);
      fs.writeFileSync(filePath, doc.content, 'utf8');
      console.log(`📄 تم إنشاء مستند مثال: ${doc.filename}`);
    });
  }

  /**
   * تحميل المستندات وإنشاء الفهرس
   */
  async loadDocuments() {
    try {
      console.log("📚 بدء تحميل المستندات...");
      
      // التأكد من وجود مجلد المستندات
      this.ensureDocumentsDirectory();
      
      // قراءة المستندات يدوياً
      const documents: Document[] = [];
      const files = fs.readdirSync(this.documentsPath).filter(f => f.endsWith('.txt'));
      
      for (const file of files) {
        const filePath = path.join(this.documentsPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        documents.push(new Document({ text: content, id_: file }));
      }
      
      if (documents.length === 0) {
        throw new Error(`لا توجد مستندات في المجلد: ${this.documentsPath}`);
      }
      
      console.log(`📖 تم العثور على ${documents.length} مستند`);
      
      // إنشاء الفهرس
      console.log("🔍 إنشاء الفهرس المتجه...");
      this.index = await VectorStoreIndex.fromDocuments(documents);
      
      console.log(`✅ تم إنشاء الفهرس بنجاح من ${documents.length} مستند`);
      
      return documents.length;
      
    } catch (error) {
      console.error("❌ خطأ في تحميل المستندات:", error);
      throw error;
    }
  }

  /**
   * استعلام بسيط
   */
  async query(question: string) {
    if (!this.index) {
      throw new Error("لا يوجد فهرس. يجب تحميل المستندات أولاً.");
    }

    try {
      console.log(`🔍 البحث عن: "${question}"`);
      
      const queryEngine = this.index.asQueryEngine({
        similarityTopK: 3, // أفضل 3 نتائج
      });
      
      const response = await queryEngine.query({
        query: question,
      });
      
      return response.toString();
      
    } catch (error) {
      console.error("❌ خطأ في الاستعلام:", error);
      throw error;
    }
  }

  /**
   * إضافة مستند جديد
   */
  async addDocument(filename: string, content: string) {
    try {
      // حفظ المستند في مجلد المستندات
      const filePath = path.join(this.documentsPath, filename);
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`📄 تم إضافة مستند جديد: ${filename}`);
      
      // إعادة بناء الفهرس
      await this.loadDocuments();
      
      return true;
      
    } catch (error) {
      console.error("❌ خطأ في إضافة المستند:", error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الفهرس
   */
  getStats() {
    const documentsCount = fs.existsSync(this.documentsPath) 
      ? fs.readdirSync(this.documentsPath).filter(f => f.endsWith('.txt')).length 
      : 0;

    return {
      documentsCount,
      indexExists: !!this.index,
      documentsPath: this.documentsPath,
    };
  }
}

/**
 * الدالة الرئيسية لاختبار RAG
 */
async function main() {
  try {
    console.log("🚀 بدء تشغيل وكيل RAG المبسط");
    console.log("=" .repeat(50));
    
    // إعداد النموذج
    setupLlamaIndexModel();
    console.log(`📡 الموفر المختار: OpenAI GPT-4o`);
    
    // إنشاء وكيل RAG
    const ragAgent = new SimpleRAGAgent();
    
    // تحميل المستندات وإنشاء فهرس
    await ragAgent.loadDocuments();
    
    // عرض الإحصائيات
    const stats = ragAgent.getStats();
    console.log(`📊 الإحصائيات:`, stats);
    
    // أسئلة اختبار
    const testQueries = [
      "ما هو الذكاء الاصطناعي؟",
      "اشرح لي أنواع التعلم الآلي",
      "ما هي أفضل لغة برمجة للذكاء الاصطناعي؟",
      "كيف يعمل التعلم المُعزز؟",
      "ما الفرق بين Python و JavaScript في مجال AI؟"
    ];
    
    console.log(`\n🧪 تشغيل ${testQueries.length} استعلامات RAG...\n`);
    
    for (let i = 0; i < testQueries.length; i++) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🧪 استعلام ${i + 1}/${testQueries.length}`);
      console.log(`${'='.repeat(60)}`);
      
      const startTime = Date.now();
      
      const response = await ragAgent.query(testQueries[i]);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n✨ الإجابة:`);
      console.log(response);
      console.log(`\n⏱️  وقت الاستعلام: ${duration} ثانية`);
      
      // توقف قصير بين الاستعلامات
      if (i < testQueries.length - 1) {
        console.log("\n⏸️  توقف لثانيتين...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 تم الانتهاء من جميع استعلامات RAG بنجاح!`);
    
  } catch (error) {
    console.error("💥 خطأ في تطبيق RAG:", error);
    process.exit(1);
  }
}

// تشغيل التطبيق إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SimpleRAGAgent, setupLlamaIndexModel };