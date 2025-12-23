#!/usr/bin/env node

/**
 * نظام الوكلاء المتعددة (Multi-Agent System)
 * يدير عدة وكلاء متخصصين يعملون معاً لحل المهام المعقدة
 */

import 'dotenv/config';
import { DynamicTool } from "@langchain/core/tools";
import { HybridAgent } from './hybrid-agent.js';
import { GoogleADKHybridAgent } from './google-adk-integration.js';
import { sanitizeLogInput } from './utils/security-helpers.js';

/**
 * أنواع الوكلاء المتخصصين
 */
interface SpecializedAgent {
  name: string;
  role: string;
  agent: HybridAgent | GoogleADKHybridAgent;
  expertise: string[];
  priority: number;
}

/**
 * نتيجة تنفيذ الوكيل
 */
interface AgentResult {
  agentName: string;
  success: boolean;
  response: string;
  executionTime: number;
  confidence: number;
  error?: Error;
  duration?: string;
}

/**
 * مدير النظام متعدد الوكلاء
 */
class MultiAgentSystem {
  private agents: Map<string, SpecializedAgent> = new Map();
  private isInitialized = false;

  constructor() {
    console.log('🤖 إنشاء نظام الوكلاء المتعددة...');
  }

  /**
   * تهيئة النظام وإنشاء الوكلاء المتخصصين
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 تهيئة نظام الوكلاء المتعددة...');

    try {
      // 1. وكيل البحث والمعلومات
      const researchAgent = new HybridAgent('openai');
      await researchAgent.initialize();
      
      this.agents.set('researcher', {
        name: 'researcher',
        role: 'باحث ومحلل معلومات',
        agent: researchAgent,
        expertise: ['بحث', 'تحليل', 'معلومات', 'إحصائيات', 'أخبار'],
        priority: 1
      });

      // 2. وكيل البرمجة والتطوير
      const codeAgent = new HybridAgent('anthropic');
      await codeAgent.initialize();
      
      this.agents.set('developer', {
        name: 'developer',
        role: 'مطور ومبرمج',
        agent: codeAgent,
        expertise: ['برمجة', 'كود', 'تطوير', 'debugging', 'algorithms'],
        priority: 2
      });

      // 3. وكيل الكتابة والمحتوى
      const writerAgent = new GoogleADKHybridAgent();
      await writerAgent.initialize();
      
      this.agents.set('writer', {
        name: 'writer',
        role: 'كاتب ومحرر محتوى',
        agent: writerAgent,
        expertise: ['كتابة', 'تحرير', 'محتوى', 'مقالات', 'وثائق'],
        priority: 3
      });

      // 4. وكيل التحليل والحسابات
      const analystAgent = new HybridAgent('openai');
      await analystAgent.initialize();
      
      this.agents.set('analyst', {
        name: 'analyst',
        role: 'محلل بيانات ومالي',
        agent: analystAgent,
        expertise: ['تحليل', 'حسابات', 'رياضيات', 'إحصاء', 'بيانات'],
        priority: 4
      });

      // 5. وكيل إدارة الملفات والنظام
      const systemAgent = new HybridAgent('anthropic');
      await systemAgent.initialize();
      
      this.agents.set('system', {
        name: 'system',
        role: 'مدير النظام والملفات',
        agent: systemAgent,
        expertise: ['ملفات', 'نظام', 'إدارة', 'تنظيم', 'أوامر'],
        priority: 5
      });

      this.isInitialized = true;
      console.log(`✅ تم تهيئة ${this.agents.size} وكلاء متخصصين بنجاح`);
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة نظام الوكلاء المتعددة:', error);
      throw error;
    }
  }

  /**
   * تعقيم المدخلات من الأكواد الخطرة
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/[<>"'`]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 10000);
  }

  /**
   * تحليل الاستعلام لاختيار الوكيل الأنسب
   */
  private analyzeQuery(query: string): {
    bestAgent: string;
    confidence: number;
    category: string;
    instructions: string;
    alternativeAgents: string[];
  } {
    const lowerQuery = this.sanitizeInput(query).toLowerCase();
    const scores: Map<string, number> = new Map();
    
    // حساب نقاط التطابق لكل وكيل
    for (const [agentName, agent] of this.agents) {
      let score = 0;
      
      // تطابق الكلمات المفتاحية
      for (const expertise of agent.expertise) {
        if (lowerQuery.includes(expertise.toLowerCase())) {
          score += 10;
        }
      }
      
      // تطابق جزئي للكلمات
      for (const expertise of agent.expertise) {
        const words = expertise.toLowerCase().split(' ');
        for (const word of words) {
          if (lowerQuery.includes(word) && word.length > 2) {
            score += 3;
          }
        }
      }
      
      // أولوية الوكيل (كلما قل الرقم، زادت الأولوية)
      score += (6 - agent.priority);
      
      scores.set(agentName, score);
    }
    
    // ترتيب الوكلاء حسب النقاط
    const sortedAgents = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a);
    
    const bestAgent = sortedAgents[0][0];
    const bestScore = sortedAgents[0][1];
    const confidence = Math.min(bestScore / 15, 1); // تحويل إلى نسبة مئوية
    
    const alternativeAgents = sortedAgents
      .slice(1, 3)
      .map(([name]) => name);
    
    const agentInfo = this.agents.get(bestAgent);
    const category = agentInfo?.role || 'غير محدد';
    const instructions = `تم اختيار ${agentInfo?.role || 'غير محدد'} بناءً على تطابق الكلمات المفتاحية: ${agentInfo?.expertise?.join(', ') || 'لا يوجد'}`;
    
    return {
      bestAgent,
      confidence,
      category,
      instructions,
      alternativeAgents
    };
  }

  /**
   * تنفيذ استعلام بواسطة الوكيل الأنسب
   */
  async executeQuery(query: string, sessionId?: string): Promise<{
    result: AgentResult;
    analysis: any;
    alternatives?: AgentResult[];
  }> {
    await this.initialize();
    
    const sanitizedQuery = this.sanitizeInput(query);
    console.log(`\n🔍 تحليل الاستعلام: "${sanitizeLogInput(query)}"`);
    
    // تحليل الاستعلام
    const analysis = this.analyzeQuery(sanitizedQuery);
    console.log(`🎯 الوكيل المختار: ${sanitizeLogInput(analysis.bestAgent)}`);
    console.log(`📊 الثقة: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`🏷️  التصنيف: ${sanitizeLogInput(analysis.category)}`);
    console.log(`📝 التعليمات: ${sanitizeLogInput(analysis.instructions)}`);
    
    // تنفيذ الاستعلام بالوكيل الأساسي
    const primaryResult = await this.executeWithAgent(analysis.bestAgent, sanitizedQuery, sessionId);
    
    // إذا فشل الوكيل الأساسي أو كانت الثقة منخفضة، جرب البدائل
    let alternatives: AgentResult[] = [];
    
    if (!primaryResult.success || analysis.confidence < 0.7) {
      console.log('⚠️  الثقة منخفضة أو فشل الوكيل الأساسي، جاري تجربة البدائل...');
      
      for (const altAgent of analysis.alternativeAgents.slice(0, 2)) {
        try {
          const altResult = await this.executeWithAgent(altAgent, sanitizedQuery, sessionId);
          alternatives.push(altResult);
          
          // إذا نجح البديل، استخدمه كنتيجة أساسية
          if (altResult.success && altResult.confidence > primaryResult.confidence) {
            console.log(`✨ البديل ${sanitizeLogInput(altAgent)} حقق نتيجة أفضل`);
            break;
          }
        } catch (error) {
          console.warn(`⚠️  فشل البديل ${sanitizeLogInput(altAgent)}:`, (error as Error).message);
        }
      }
    }
    
    return {
      result: primaryResult,
      analysis,
      alternatives
    };
  }

  /**
   * تنفيذ استعلام بوكيل محدد
   */
  private async executeWithAgent(agentName: string, query: string, sessionId?: string): Promise<AgentResult> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`الوكيل غير موجود: ${agentName}`);
    }
    
    const startTime = Date.now();
    
    try {
      console.log(`🤖 تنفيذ بواسطة ${sanitizeLogInput(agent.role)}...`);
      
      let response: string;
      
      // تحديد نوع الوكيل وطريقة التنفيذ
      if (agent.agent instanceof GoogleADKHybridAgent) {
        if (sessionId) {
          const result = await agent.agent.smartQuery(query, sessionId);
          response = result.response;
        } else {
          const result = await agent.agent.smartQuery(query);
          response = result.response;
        }
      } else if (agent.agent instanceof HybridAgent) {
        response = await agent.agent.query(query);
      } else {
        throw new Error(`نوع وكيل غير مدعوم: ${typeof agent.agent}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      // تقييم جودة الاستجابة
      const confidence = this.evaluateResponse(response, query);
      
      console.log(`✅ ${agent.role} أنهى المهمة في ${executionTime}ms`);
      
      return {
        agentName,
        success: true,
        response,
        executionTime,
        confidence,
        duration: `${executionTime}ms`
      };
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.log(`❌ فشل ${agent.role}: ${(error as Error).message}`);
      
      return {
        agentName,
        success: false,
        response: `خطأ في ${agent.role}: ${(error as Error).message}`,
        executionTime,
        confidence: 0,
        error: error as Error
      };
    }
  }

  /**
   * تقييم جودة الاستجابة
   */
  private evaluateResponse(response: string, query: string): number {
    let confidence = 0.5; // قيمة أساسية
    
    // طول الاستجابة (استجابات أطول عادة أفضل)
    if (response.length > 100) confidence += 0.1;
    if (response.length > 500) confidence += 0.1;
    
    // وجود معلومات مفيدة
    if (response.includes('✅') || response.includes('📊') || response.includes('💡')) {
      confidence += 0.1;
    }
    
    // عدم وجود رسائل خطأ
    if (!response.includes('خطأ') && !response.includes('فشل') && !response.includes('❌')) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * تنفيذ متوازي لعدة وكلاء (للمهام المعقدة)
   */
  async executeParallel(query: string, agentNames: string[], sessionId?: string): Promise<AgentResult[]> {
    await this.initialize();
    
    console.log(`\n🔄 تنفيذ متوازي للاستعلام: "${sanitizeLogInput(query)}"`);
    console.log(`🤖 الوكلاء: ${agentNames.map(a => sanitizeLogInput(a)).join(', ')}`);
    
    const promises = agentNames.map(agentName => 
      this.executeWithAgent(agentName, query, sessionId)
    );
    
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          agentName: agentNames[index],
          success: false,
          response: `خطأ في التنفيذ المتوازي: ${result.reason}`,
          executionTime: 0,
          confidence: 0
        };
      }
    });
  }

  /**
   * تنفيذ تسلسلي (كل وكيل يبني على نتيجة السابق)
   */
  async executeSequential(query: string, agentNames: string[], sessionId?: string): Promise<{
    finalResult: AgentResult;
    intermediateResults: AgentResult[];
  }> {
    await this.initialize();
    
    console.log(`\n⏭️  تنفيذ تسلسلي للاستعلام: "${sanitizeLogInput(query)}"`);
    console.log(`🤖 الوكلاء بالترتيب: ${agentNames.map(a => sanitizeLogInput(a)).join(' → ')}`);
    
    const intermediateResults: AgentResult[] = [];
    let currentQuery = query;
    let finalResult: AgentResult;
    
    for (let i = 0; i < agentNames.length; i++) {
      const agentName = agentNames[i];
      console.log(`\n📍 المرحلة ${i + 1}/${agentNames.length}: ${sanitizeLogInput(agentName)}`);
      
      const result = await this.executeWithAgent(agentName, currentQuery, sessionId);
      intermediateResults.push(result);
      
      if (!result.success) {
        console.log(`⚠️  فشل في المرحلة ${i + 1}، إيقاف التسلسل`);
        console.log(`❌ الخطأ: ${sanitizeLogInput((result.error as Error).message)}`);
        finalResult = result;
        break;
      }
      
      // استخدام نتيجة الوكيل الحالي كمدخل للوكيل التالي
      if (i < agentNames.length - 1) {
        currentQuery = `بناءً على النتيجة السابقة: "${result.response.substring(0, 200)}..."، ${query}`;
      }
      
      finalResult = result;
    }
    
    return {
      finalResult: finalResult!,
      intermediateResults
    };
  }

  /**
   * الحصول على إحصائيات النظام
   */
  getSystemStats() {
    return {
      totalAgents: this.agents.size,
      isInitialized: this.isInitialized,
      agents: Array.from(this.agents.values()).map(agent => ({
        name: agent.name,
        role: agent.role,
        expertise: agent.expertise,
        priority: agent.priority,
        stats: agent.agent.getStats ? agent.agent.getStats() : null
      }))
    };
  }

  /**
   * إضافة وكيل جديد للنظام
   */
  async addAgent(name: string, role: string, agent: HybridAgent | GoogleADKHybridAgent, expertise: string[], priority: number = 10) {
    if (this.agents.has(name)) {
      throw new Error(`الوكيل موجود بالفعل: ${name}`);
    }
    
    await agent.initialize();
    
    this.agents.set(name, {
      name,
      role,
      agent,
      expertise,
      priority
    });
    
    console.log(`✅ تم إضافة وكيل جديد: ${role}`);
  }

  /**
   * حذف وكيل من النظام
   */
  removeAgent(name: string): boolean {
    const deleted = this.agents.delete(name);
    if (deleted) {
      console.log(`🗑️  تم حذف الوكيل: ${name}`);
    }
    return deleted;
  }
}

/**
 * الدالة الرئيسية للاختبار
 */
async function main() {
  try {
    console.log('🚀 بدء تشغيل نظام الوكلاء المتعددة');
    console.log('=' .repeat(70));
    
    // إنشاء النظام
    const multiAgentSystem = new MultiAgentSystem();
    await multiAgentSystem.initialize();
    
    // عرض إحصائيات النظام
    const stats = multiAgentSystem.getSystemStats();
    console.log('\n📊 إحصائيات النظام:');
    console.log(`🤖 عدد الوكلاء: ${stats.totalAgents}`);
    console.log('👥 الوكلاء المتاحون:');
    stats.agents.forEach(agent => {
      console.log(`   • ${agent.role} - التخصص: ${agent.expertise.join(', ')}`);
    });
    
    // اختبارات متنوعة
    const testQueries = [
      {
        query: "ابحث عن آخر أخبار الذكاء الاصطناعي في 2024",
        type: "single",
        sessionId: "session_1"
      },
      {
        query: "اكتب كود Python لحساب الأعداد الأولية",
        type: "single",
        sessionId: "session_2"
      },
      {
        query: "احسب متوسط الأرقام: 15, 23, 31, 47, 52",
        type: "single",
        sessionId: "session_3"
      },
      {
        query: "أنشئ مقال عن فوائد الطاقة المتجددة",
        type: "single",
        sessionId: "session_4"
      },
      {
        query: "اقرأ ملف package.json وحلل التبعيات",
        type: "single",
        sessionId: "session_5"
      },
      {
        query: "ابحث عن معلومات حول React وأنشئ مثال بسيط",
        type: "parallel",
        agents: ["researcher", "developer"],
        sessionId: "session_6"
      },
      {
        query: "ابحث عن موضوع مثير للاهتمام، ثم اكتب مقال عنه، ثم راجعه",
        type: "sequential",
        agents: ["researcher", "writer", "analyst"],
        sessionId: "session_7"
      }
    ];
    
    console.log(`\n🧪 تشغيل ${testQueries.length} اختبارات متنوعة...\n`);
    
    for (let i = 0; i < testQueries.length; i++) {
      const test = testQueries[i];
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🧪 اختبار ${i + 1}/${testQueries.length} - ${test.type.toUpperCase()}`);
      console.log(`📝 الاستعلام: "${test.query}"`);
      console.log(`🆔 الجلسة: ${test.sessionId}`);
      console.log(`${'='.repeat(70)}`);
      
      const startTime = Date.now();
      
      try {
        if (test.type === "single") {
          // تنفيذ بوكيل واحد (ذكي)
          const result = await multiAgentSystem.executeQuery(test.query, test.sessionId);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          
          console.log(`\n📤 النتيجة:`);
          console.log(`🤖 الوكيل: ${sanitizeLogInput(result.result.agentName)}`);
          console.log(`⏱️  المدة: ${sanitizeLogInput(result.result.duration)}s`);
          console.log(`📊 الثقة: ${(result.result.confidence * 100).toFixed(1)}%`);
          console.log(`\n📝 الاستجابة: ${sanitizeLogInput(result.result.response.substring(0, 200))}...`);
          console.log(`💭 التحليل: ${result.analysis.reasoning}`);
          console.log(`\n📝 الاستجابة:`);
          console.log(result.result.response);
          
          if (result.alternatives && result.alternatives.length > 0) {
            console.log(`\n🔄 البدائل المجربة: ${result.alternatives.length}`);
          }
          
        } else if (test.type === "parallel") {
          // تنفيذ متوازي
          const results = await multiAgentSystem.executeParallel(test.query, test.agents!, test.sessionId);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          
          console.log(`\n📤 النتائج المتوازية:`);
          console.log(`⏱️  المدة الإجمالية: ${sanitizeLogInput(duration)}s`);
          console.log(`\n📊 النتائج (${results.length}):`);
          results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${sanitizeLogInput(result.agentName || 'فشل')}:`);
            if (result.success) {
              console.log(`   ✅ نجح - الثقة: ${(result.confidence * 100).toFixed(1)}%`);
              console.log(`   📝 الاستجابة: ${sanitizeLogInput(result.response.substring(0, 150))}...`);
            }
          });
          
        } else if (test.type === "sequential") {
          // تنفيذ تسلسلي
          const result = await multiAgentSystem.executeSequential(test.query, test.agents!, test.sessionId);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);
          
          console.log(`\n📤 النتيجة التسلسلية:`);
          console.log(`⏱️  المدة الإجمالية: ${duration}s`);
          console.log(`🔗 المراحل: ${result.intermediateResults.length}`);
          
          result.intermediateResults.forEach((stepResult, index) => {
            console.log(`\n📍 المرحلة ${index + 1}: ${stepResult.agentName}`);
            console.log(`✅ النجاح: ${stepResult.success ? 'نعم' : 'لا'}`);
            console.log(`⏱️  الوقت: ${stepResult.executionTime}ms`);
          });
          
          console.log(`\n🎯 النتيجة النهائية:`);
          console.log(result.finalResult.response);
        }
        
      } catch (error) {
        console.log(`❌ خطأ في الاختبار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      }
      
      // توقف بين الاختبارات
      if (i < testQueries.length - 1) {
        console.log("\n⏸️  توقف لثانيتين...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 تم الانتهاء من جميع اختبارات نظام الوكلاء المتعددة!`);
    
    // إحصائيات نهائية
    const finalStats = multiAgentSystem.getSystemStats();
    console.log(`\n📈 الإحصائيات النهائية:`);
    console.log(`🤖 إجمالي الوكلاء: ${finalStats.totalAgents}`);
    console.log(`✅ النظام مُهيأ: ${finalStats.isInitialized ? 'نعم' : 'لا'}`);
    
  } catch (error) {
    console.error('💥 خطأ في نظام الوكلاء المتعددة:', error);
    process.exit(1);
  }
}

// تشغيل التطبيق إذا تم استدعاؤه مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MultiAgentSystem, SpecializedAgent, AgentResult };