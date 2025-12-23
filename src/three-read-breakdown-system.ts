#!/usr/bin/env node

/**
 * نظام Multi-Agent للتفريغ السينمائي بمنهجية القراءات الثلاث
 * Three-Read Breakdown System
 * 
 * يطبق منهجية القراءات الثلاث:
 * 1. القراءة العاطفية (Emotional Reading)
 * 2. القراءة التقنية (Technical Reading) 
 * 3. قراءة التفريغ (Breakdown Reading)
 * 4. الإشراف والتحكيم (Supervision)
 */

import 'dotenv/config';
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { DynamicTool } from "@langchain/core/tools";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";
import axios from 'axios';

// ═══════════════════════════════════════════════════════════════════════════
// نماذج البيانات (Data Models)
// ═══════════════════════════════════════════════════════════════════════════

export enum ProductionCategory {
  // 1-5: الأفراد
  CAST_MEMBERS = "cast_members",
  EXTRAS_ATMOSPHERE = "extras_atmosphere", 
  EXTRAS_FEATURED = "extras_featured",
  STUNT_PERFORMERS = "stunt_performers",
  ANIMAL_HANDLERS = "animal_handlers",
  
  // 6-10: الأشياء المحمولة
  PROPS_HANDHELD = "props_handheld",
  PROPS_INTERACTIVE = "props_interactive",
  WARDROBE_COSTUMES = "wardrobe_costumes",
  MAKEUP_HAIR = "makeup_hair",
  SPECIAL_MAKEUP = "special_makeup",
  
  // 11-15: البيئة والديكور
  SET_DRESSING = "set_dressing",
  GREENERY_PLANTS = "greenery_plants", 
  VEHICLES_PICTURE = "vehicles_picture",
  LIVESTOCK_LARGE = "livestock_large",
  SPECIAL_EQUIPMENT = "special_equipment",
  
  // 16-21: المؤثرات والخدمات
  SPECIAL_EFFECTS_SFX = "special_effects_sfx",
  VISUAL_EFFECTS_VFX = "visual_effects_vfx",
  SOUND_MUSIC = "sound_music",
  SECURITY_SERVICES = "security_services",
  ADDITIONAL_LABOR = "additional_labor",
  MISCELLANEOUS = "miscellaneous"
}

export interface Evidence {
  span_start: number;
  span_end: number;
  text_excerpt: string;
  rationale: string;
  confidence: number;
}

export interface AgentProvenance {
  agent_type: "emotional" | "technical" | "breakdown" | "supervisor";
  agent_version: string;
  model_used: string;
  prompt_version: string;
  timestamp: Date;
}

export interface ProductionElement {
  id: string;
  category: ProductionCategory;
  name: string;
  description: string;
  scene_id: string;
  
  // Evidence & Traceability
  evidence: Evidence;
  confidence: number;
  extracted_by: AgentProvenance;
  
  // Context
  context: {
    scene_context: string;
    character_context?: string;
    timing_context?: string;
    location_context?: string;
  };
  dependencies: string[]; // IDs of related elements
}

export interface EmotionalAnalysis {
  overall_tone: string;
  emotional_arcs: Array<{
    character: string;
    emotion: string;
    intensity: number;
    trigger: string;
  }>;
  pacing_rhythm: {
    tempo: "slow" | "medium" | "fast";
    tension_curve: number[];
    climax_points: number[];
  };
  key_moments: Array<{
    timestamp: string;
    description: string;
    emotional_weight: number;
  }>;
  audience_engagement: number;
  director_vision: string;
}

export interface TechnicalValidation {
  is_valid: boolean;
  errors: Array<{
    type: string;
    message: string;
    line_number?: number;
    severity: "warning" | "error" | "critical";
  }>;
  warnings: Array<{
    type: string;
    message: string;
    suggestion: string;
  }>;
  scene_headers: Array<{
    scene_number: string;
    int_ext: string;
    location: string;
    time_of_day: string;
    is_valid: boolean;
    issues: string[];
  }>;
  character_consistency: {
    characters: string[];
    inconsistencies: Array<{
      character: string;
      issue: string;
      scenes: string[];
    }>;
  };
}

export interface BreakdownResult {
  scene_id: string;
  elements: ProductionElement[];
  breakdown_sheets: Array<{
    category: ProductionCategory;
    items: ProductionElement[];
    color_code: string;
  }>;
  summary: {
    total_elements: number;
    by_category: Record<ProductionCategory, number>;
    complexity_score: number;
  };
}

export interface SupervisorDecision {
  conflict_id: string;
  agents_involved: string[];
  conflict_type: string;
  resolution: "prefer_original_text" | "merge_results" | "request_human_review" | "escalate";
  final_decision: any;
  confidence: number;
  reasoning: string[];
}

export interface FinalBreakdownReport {
  script_title: string;
  total_scenes: number;
  processing_timestamp: Date;
  
  // Results from each agent
  emotional_analysis: EmotionalAnalysis;
  technical_validation: TechnicalValidation;
  breakdown_results: BreakdownResult[];
  
  // Supervisor decisions
  conflicts_resolved: SupervisorDecision[];
  final_elements: ProductionElement[];
  
  // Quality metrics
  overall_confidence: number;
  human_review_required: boolean;
  
  // Export formats
  html_report: string;
  json_data: string;
  pdf_ready: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// إعدادات النماذج (Model Configuration)
// ═══════════════════════════════════════════════════════════════════════════

interface ModelConfig {
  name: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  specialization: string[];
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  "claude-4-sonnet": {
    name: "Claude 4 Sonnet",
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.3,
    maxTokens: 4096,
    specialization: ["analysis", "reasoning", "technical"]
  },
  "gpt-4o": {
    name: "GPT-4o",
    provider: "openai", 
    model: "gpt-4o",
    temperature: 0.4,
    maxTokens: 4096,
    specialization: ["creative", "semantic", "synthesis"]
  },
  "gemini-pro": {
    name: "Gemini Pro",
    provider: "google",
    model: "gemini-pro",
    temperature: 0.5,
    maxTokens: 4096,
    specialization: ["creative", "multimodal", "generation"]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// خدمة Python المتقدمة (Python Brain Service Interface)
// ═══════════════════════════════════════════════════════════════════════════

export class PythonBrainService {
  private baseUrl: string;
  
  constructor(baseUrl: string = "http://localhost:8000") {
    this.baseUrl = baseUrl;
  }
  
  async analyzeWithComponent(
    text: string, 
    component: string, 
    context?: any
  ): Promise<{
    job_id: string;
    result?: any;
    status: string;
  }> {
    try {
      const response = await axios.post(`${this.baseUrl}/analyze/async`, {
        text,
        component,
        context,
        confidence_threshold: 0.7
      });
      
      return response.data;
    } catch (error) {
      console.warn(`Python service unavailable: ${(error as Error).message}`);
      return {
        job_id: `fallback_${Date.now()}`,
        status: "fallback",
        result: { message: "Using TypeScript fallback" }
      };
    }
  }
  
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      return { status: "failed", error: (error as Error).message };
    }
  }
  
  async waitForCompletion(jobId: string, maxWaitMs: number = 30000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getJobStatus(jobId);
      
      if (status.status === "completed") {
        return status.result;
      } else if (status.status === "failed") {
        throw new Error(`Python processing failed: ${status.error}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error("Python processing timeout");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// مدير النماذج (Model Manager)
// ═══════════════════════════════════════════════════════════════════════════

export class ModelManager {
  private models: Map<string, BaseLanguageModel> = new Map();
  
  constructor() {
    this.initializeModels();
  }
  
  private initializeModels() {
    for (const [key, config] of Object.entries(MODEL_CONFIGS)) {
      try {
        const model = this.createModel(config);
        this.models.set(key, model);
        console.log(`✓ تم تهيئة النموذج: ${config.name}`);
      } catch (error) {
        console.warn(`⚠️ فشل تهيئة النموذج ${config.name}: ${(error as Error).message}`);
      }
    }
  }
  
  private createModel(config: ModelConfig): BaseLanguageModel {
    const apiKey = process.env[`${config.provider.toUpperCase()}_API_KEY`];
    
    if (!apiKey) {
      throw new Error(`مفتاح API مفقود للموفر: ${config.provider}`);
    }
    
    switch (config.provider) {
      case "anthropic":
        return new ChatAnthropic({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey
        });
        
      case "openai":
        return new ChatOpenAI({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey
        });
        
      case "google":
        return new ChatGoogleGenerativeAI({
          model: config.model,
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          apiKey
        });
        
      default:
        throw new Error(`موفر غير مدعوم: ${config.provider}`);
    }
  }
  
  getModel(taskType: string): BaseLanguageModel {
    // اختيار النموذج الأنسب حسب نوع المهمة
    const modelSelectionRules = {
      "semantic_analysis": "gpt-4o",
      "classification": "claude-4-sonnet", 
      "creative_generation": "gemini-pro",
      "technical_validation": "claude-4-sonnet",
      "emotional_analysis": "gpt-4o",
      "supervision": "claude-4-sonnet"
    };
    
    const preferredModel = (modelSelectionRules as any)[taskType] || "claude-4-sonnet";
    
    // Fallback chain
    const fallbackChain = [preferredModel, "claude-4-sonnet", "gpt-4o", "gemini-pro"];
    
    for (const modelKey of fallbackChain) {
      const model = this.models.get(modelKey);
      if (model) {
        return model;
      }
    }
    
    throw new Error("لا توجد نماذج متاحة");
  }
  
  getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// الوكيل العاطفي (Emotional Reading Agent)
// ═══════════════════════════════════════════════════════════════════════════

export class EmotionalReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  
  constructor(modelManager: ModelManager, pythonService: PythonBrainService) {
    this.model = modelManager.getModel("emotional_analysis");
    this.pythonService = pythonService;
  }
  
  async analyzeNarrative(scriptText: string): Promise<EmotionalAnalysis> {
    console.log("🎭 بدء التحليل العاطفي للسيناريو...");
    
    const systemPrompt = `أنت وكيل متخصص في القراءة العاطفية للسيناريوهات السينمائية.

مهمتك: تحليل التدفق السردي والإيقاع العاطفي للقصة دون التركيز على العناصر التقنية أو الإنتاجية.

القواعد الصارمة:
1. اقرأ النص كمشاهد وليس كمنتج
2. ركز على التدفق السردي والإيقاع واللحظات العاطفية
3. لا تدون أي ملاحظات تقنية أو إنتاجية
4. لا تذكر: props, wardrobe, sfx, vfx, breakdown
5. حدد رؤية المخرج والمشاعر المستهدفة

أخرج النتيجة بصيغة JSON مع الحقول التالية:
- overall_tone: النبرة العامة للقصة
- emotional_arcs: الأقواس العاطفية للشخصيات
- pacing_rhythm: إيقاع المشاهد
- key_moments: اللحظات المحورية
- audience_engagement: مستوى تفاعل الجمهور المتوقع (0-1)
- director_vision: رؤية المخرج المقترحة`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`حلل هذا السيناريو عاطفياً:\n\n${scriptText}`)
      ];
      
      const response = await this.model.invoke(messages);
      
      // محاولة تحليل JSON
      let analysisResult;
      try {
        const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("لم يتم العثور على JSON في الاستجابة");
        }
      } catch (parseError) {
        // Fallback: إنشاء تحليل أساسي
        analysisResult = this.createFallbackEmotionalAnalysis(response.content.toString());
      }
      
      // تحسين النتائج باستخدام Python service إذا كان متاحاً
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "semantic_synopsis",
          { analysis_type: "emotional" }
        );
        
        if (pythonJob.status !== "fallback") {
          const pythonResult = await this.pythonService.waitForCompletion(pythonJob.job_id, 15000);
          // دمج النتائج
          analysisResult = this.mergeEmotionalAnalysis(analysisResult, pythonResult);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين بـ Python service:", (pythonError as Error).message);
      }
      
      console.log("✅ تم إكمال التحليل العاطفي");
      return analysisResult;
      
    } catch (error) {
      console.error("❌ خطأ في التحليل العاطفي:", error);
      throw error;
    }
  }
  
  private createFallbackEmotionalAnalysis(responseText: string): EmotionalAnalysis {
    return {
      overall_tone: "درامي متوسط",
      emotional_arcs: [
        {
          character: "الشخصية الرئيسية",
          emotion: "قلق",
          intensity: 0.7,
          trigger: "الأحداث المحيطة"
        }
      ],
      pacing_rhythm: {
        tempo: "medium",
        tension_curve: [0.3, 0.5, 0.7, 0.6, 0.8],
        climax_points: [3, 5]
      },
      key_moments: [
        {
          timestamp: "منتصف القصة",
          description: "لحظة تحول مهمة",
          emotional_weight: 0.8
        }
      ],
      audience_engagement: 0.7,
      director_vision: "التركيز على الجانب الإنساني والعاطفي للشخصيات"
    };
  }
  
  private mergeEmotionalAnalysis(base: any, enhancement: any): EmotionalAnalysis {
    // دمج ذكي للنتائج
    return {
      ...base,
      audience_engagement: Math.max(base.audience_engagement || 0.5, enhancement?.engagement || 0.5),
      director_vision: enhancement?.director_notes || base.director_vision
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// الوكيل التقني (Technical Reading Agent)  
// ═══════════════════════════════════════════════════════════════════════════

export class TechnicalReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  
  constructor(modelManager: ModelManager, pythonService: PythonBrainService) {
    this.model = modelManager.getModel("technical_validation");
    this.pythonService = pythonService;
  }
  
  async validateFormatting(scriptText: string): Promise<TechnicalValidation> {
    console.log("🔧 بدء الفحص التقني للسيناريو...");
    
    const systemPrompt = `أنت وكيل متخصص في الفحص التقني للسيناريوهات السينمائية.

مهمتك: فحص التنسيق واكتشاف الأخطاء الهيكلية دون التركيز على المحتوى العاطفي.

التحقق من:
1. اتساق ترويسات المشاهد (INT/EXT + Location + DAY/NIGHT)
2. تحديد المواقع والتوقيت بوضوح
3. عدم وجود فساد في البيانات أو تكرار في الشخصيات والمواقع
4. صحة تنسيق الحوار والوصف
5. التسلسل المنطقي للمشاهد

أخرج النتيجة بصيغة JSON مع الحقول التالية:
- is_valid: هل السيناريو صالح تقنياً
- errors: قائمة الأخطاء المكتشفة
- warnings: التحذيرات والاقتراحات
- scene_headers: تحليل ترويسات المشاهد
- character_consistency: فحص اتساق الشخصيات`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`افحص هذا السيناريو تقنياً:\n\n${scriptText}`)
      ];
      
      const response = await this.model.invoke(messages);
      
      // تحليل الاستجابة
      let validationResult;
      try {
        const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          validationResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("لم يتم العثور على JSON في الاستجابة");
        }
      } catch (parseError) {
        validationResult = this.createFallbackValidation(scriptText);
      }
      
      // تحسين بـ Python service
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "continuity_check",
          { validation_type: "technical" }
        );
        
        if (pythonJob.status !== "fallback") {
          const pythonResult = await this.pythonService.waitForCompletion(pythonJob.job_id, 15000);
          validationResult = this.mergeTechnicalValidation(validationResult, pythonResult);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين التقني بـ Python service:", (pythonError as Error).message);
      }
      
      console.log("✅ تم إكمال الفحص التقني");
      return validationResult;
      
    } catch (error) {
      console.error("❌ خطأ في الفحص التقني:", error);
      throw error;
    }
  }
  
  private createFallbackValidation(scriptText: string): TechnicalValidation {
    // فحص أساسي للتنسيق
    const sceneHeaders = this.extractSceneHeaders(scriptText);
    const characters = this.extractCharacters(scriptText);
    
    return {
      is_valid: sceneHeaders.length > 0,
      errors: sceneHeaders.length === 0 ? [
        {
          type: "structure",
          message: "لم يتم العثور على ترويسات مشاهد صالحة",
          severity: "critical"
        }
      ] : [],
      warnings: [
        {
          type: "format",
          message: "يُنصح بمراجعة تنسيق السيناريو",
          suggestion: "التأكد من اتباع المعايير القياسية"
        }
      ],
      scene_headers: sceneHeaders.map((header, index) => ({
        scene_number: (index + 1).toString(),
        int_ext: this.extractIntExt(header),
        location: this.extractLocation(header),
        time_of_day: this.extractTimeOfDay(header),
        is_valid: true,
        issues: []
      })),
      character_consistency: {
        characters,
        inconsistencies: []
      }
    };
  }
  
  private extractSceneHeaders(text: string): string[] {
    const headerPattern = /^(?:مشهد|scene)\s*\d+/gim;
    return text.match(headerPattern) || [];
  }
  
  private extractCharacters(text: string): string[] {
    const charPattern = /^([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s]{1,30}):/gm;
    const matches = text.match(charPattern) || [];
    return [...new Set(matches.map(m => m.replace(':', '').trim()))];
  }
  
  private extractIntExt(header: string): string {
    if (/خارجي|ext/i.test(header)) return "خارجي (EXT)";
    if (/داخلي|int/i.test(header)) return "داخلي (INT)";
    return "غير محدد";
  }
  
  private extractLocation(header: string): string {
    // استخراج الموقع من الترويسة
    const cleaned = header.replace(/^(مشهد|scene)\s*\d+\s*[:\-–—]?\s*/i, '');
    const parts = cleaned.split(/[-–—|]/).map(p => p.trim()).filter(p => p);
    return parts.find(p => !/(داخلي|خارجي|int|ext|ليل|نهار|day|night)/i.test(p)) || "غير محدد";
  }
  
  private extractTimeOfDay(header: string): string {
    if (/ليل|night/i.test(header)) return "ليل";
    if (/نهار|day/i.test(header)) return "نهار";
    return "غير محدد";
  }
  
  private mergeTechnicalValidation(base: any, enhancement: any): TechnicalValidation {
    return {
      ...base,
      is_valid: base.is_valid && (enhancement?.validation_passed !== false),
      errors: [...(base.errors || []), ...(enhancement?.errors || [])],
      warnings: [...(base.warnings || []), ...(enhancement?.warnings || [])]
    };
  }
}

console.log("✅ تم تحميل نظام Multi-Agent للتفريغ السينمائي");
// ═══════════════════════════════════════════════════════════════════════════
// وكيل قراءة التفريغ (Breakdown Reading Agent)
// ═══════════════════════════════════════════════════════════════════════════

export class BreakdownReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  
  constructor(modelManager: ModelManager, pythonService: PythonBrainService) {
    this.model = modelManager.getModel("classification");
    this.pythonService = pythonService;
  }
  
  async extractElements(scriptText: string, sceneId: string): Promise<BreakdownResult> {
    console.log("📋 بدء استخراج العناصر الإنتاجية...");
    
    const systemPrompt = `أنت وكيل متخصص في تفريغ السيناريوهات السينمائية واستخراج العناصر الإنتاجية.

مهمتك: مسح النص وعزل العناصر الإنتاجية وتصنيفها في الفئات الـ21 القياسية.

الفئات الـ21:
الأفراد (1-5):
- cast_members: الممثلون الرئيسيون
- extras_atmosphere: الكومبارس العاديون
- extras_featured: الكومبارس المميزون
- stunt_performers: المجازفات
- animal_handlers: مدربو الحيوانات

الأشياء المحمولة (6-10):
- props_handheld: الدعائم المحمولة
- props_interactive: الدعائم التفاعلية
- wardrobe_costumes: الأزياء والملابس
- makeup_hair: المكياج والشعر
- special_makeup: المكياج الخاص

البيئة والديكور (11-15):
- set_dressing: ديكور الموقع
- greenery_plants: النباتات والخضرة
- vehicles_picture: المركبات
- livestock_large: الماشية والحيوانات الكبيرة
- special_equipment: المعدات الخاصة

المؤثرات والخدمات (16-21):
- special_effects_sfx: المؤثرات الخاصة
- visual_effects_vfx: المؤثرات البصرية
- sound_music: الصوت والموسيقى
- security_services: الأمن
- additional_labor: العمالة الإضافية
- miscellaneous: متنوعات

أخرج النتيجة بصيغة JSON مع:
- scene_id: معرف المشهد
- elements: قائمة العناصر المستخرجة
- breakdown_sheets: تجميع العناصر حسب الفئة
- summary: ملخص إحصائي`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`استخرج العناصر الإنتاجية من هذا المشهد:\n\nScene ID: ${sceneId}\n\n${scriptText}`)
      ];
      
      const response = await this.model.invoke(messages);
      
      let breakdownResult;
      try {
        const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          breakdownResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("لم يتم العثور على JSON في الاستجابة");
        }
      } catch (parseError) {
        breakdownResult = this.createFallbackBreakdown(scriptText, sceneId);
      }
      
      // تحسين بـ Python service
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "prop_classification",
          { scene_id: sceneId, extract_all: true }
        );
        
        if (pythonJob.status !== "fallback") {
          const pythonResult = await this.pythonService.waitForCompletion(pythonJob.job_id, 20000);
          breakdownResult = this.mergeBreakdownResults(breakdownResult, pythonResult);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين بـ Python service:", (pythonError as Error).message);
      }
      
      console.log("✅ تم إكمال استخراج العناصر");
      return breakdownResult;
      
    } catch (error) {
      console.error("❌ خطأ في استخراج العناصر:", error);
      throw error;
    }
  }
  
  private createFallbackBreakdown(scriptText: string, sceneId: string): BreakdownResult {
    const elements: ProductionElement[] = [];
    
    // استخراج أساسي للعناصر
    const characters = this.extractBasicCharacters(scriptText);
    const props = this.extractBasicProps(scriptText);
    
    // إضافة الشخصيات
    characters.forEach((char, index) => {
      elements.push({
        id: `${sceneId}_cast_${index}`,
        category: ProductionCategory.CAST_MEMBERS,
        name: char,
        description: `الممثل: ${char}`,
        scene_id: sceneId,
        evidence: {
          span_start: 0,
          span_end: scriptText.length,
          text_excerpt: char,
          rationale: "استخراج من الحوار",
          confidence: 0.8
        },
        confidence: 0.8,
        extracted_by: {
          agent_type: "breakdown",
          agent_version: "1.0.0",
          model_used: "fallback",
          prompt_version: "1.0",
          timestamp: new Date()
        },
        context: {
          scene_context: scriptText.substring(0, 200) + "..."
        },
        dependencies: []
      });
    });
    
    // إضافة الدعائم
    props.forEach((prop, index) => {
      elements.push({
        id: `${sceneId}_prop_${index}`,
        category: ProductionCategory.PROPS_HANDHELD,
        name: prop,
        description: `دعمة: ${prop}`,
        scene_id: sceneId,
        evidence: {
          span_start: 0,
          span_end: scriptText.length,
          text_excerpt: prop,
          rationale: "استخراج من النص",
          confidence: 0.7
        },
        confidence: 0.7,
        extracted_by: {
          agent_type: "breakdown",
          agent_version: "1.0.0",
          model_used: "fallback",
          prompt_version: "1.0",
          timestamp: new Date()
        },
        context: {
          scene_context: scriptText.substring(0, 200) + "..."
        },
        dependencies: []
      });
    });
    
    // تجميع حسب الفئة
    const breakdown_sheets = this.groupElementsByCategory(elements);
    
    return {
      scene_id: sceneId,
      elements,
      breakdown_sheets,
      summary: {
        total_elements: elements.length,
        by_category: this.countByCategory(elements),
        complexity_score: Math.min(elements.length / 10, 1)
      }
    };
  }
  
  private extractBasicCharacters(text: string): string[] {
    const charPattern = /^([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s]{1,30}):/gm;
    const matches = text.match(charPattern) || [];
    return [...new Set(matches.map(m => m.replace(':', '').trim()))];
  }
  
  private extractBasicProps(text: string): string[] {
    const propKeywords = [
      'ظرف', 'هاتف', 'موبايل', 'لابتوب', 'حاسب', 'مجلة', 'حقيبة', 
      'كأس', 'كوب', 'مفتاح', 'نظارة', 'ساعة', 'صورة', 'كاسيت'
    ];
    
    const foundProps: string[] = [];
    const textLower = text.toLowerCase();
    
    propKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        foundProps.push(keyword);
      }
    });
    
    return foundProps;
  }
  
  private groupElementsByCategory(elements: ProductionElement[]): Array<{
    category: ProductionCategory;
    items: ProductionElement[];
    color_code: string;
  }> {
    const colorCodes = {
      [ProductionCategory.CAST_MEMBERS]: "#FF6B6B",
      [ProductionCategory.PROPS_HANDHELD]: "#4ECDC4",
      [ProductionCategory.WARDROBE_COSTUMES]: "#45B7D1",
      [ProductionCategory.SET_DRESSING]: "#96CEB4",
      [ProductionCategory.VEHICLES_PICTURE]: "#FFEAA7",
      [ProductionCategory.SPECIAL_EFFECTS_SFX]: "#DDA0DD",
      [ProductionCategory.SOUND_MUSIC]: "#98D8C8"
    };
    
    const grouped = new Map<ProductionCategory, ProductionElement[]>();
    
    elements.forEach(element => {
      if (!grouped.has(element.category)) {
        grouped.set(element.category, []);
      }
      grouped.get(element.category)!.push(element);
    });
    
    return Array.from(grouped.entries()).map(([category, items]) => ({
      category,
      items,
      color_code: colorCodes[category] || "#CCCCCC"
    }));
  }
  
  private countByCategory(elements: ProductionElement[]): Record<ProductionCategory, number> {
    const counts = {} as Record<ProductionCategory, number>;
    
    Object.values(ProductionCategory).forEach(category => {
      counts[category] = 0;
    });
    
    elements.forEach(element => {
      counts[element.category]++;
    });
    
    return counts;
  }
  
  private mergeBreakdownResults(base: any, enhancement: any): BreakdownResult {
    // دمج النتائج من Python service
    const enhancedElements = enhancement?.elements || [];
    const baseElements = base.elements || [];
    
    // دمج العناصر مع تجنب التكرار
    const allElements = [...baseElements];
    enhancedElements.forEach(enhElement => {
      const exists = baseElements.some(baseEl => 
        baseEl.name === enhElement.name && baseEl.category === enhElement.category
      );
      if (!exists) {
        allElements.push(enhElement);
      }
    });
    
    return {
      ...base,
      elements: allElements,
      breakdown_sheets: this.groupElementsByCategory(allElements),
      summary: {
        total_elements: allElements.length,
        by_category: this.countByCategory(allElements),
        complexity_score: Math.min(allElements.length / 10, 1)
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// الوكيل المشرف (Supervisor Agent)
// ═══════════════════════════════════════════════════════════════════════════

export class SupervisorAgent {
  private model: BaseLanguageModel;
  private rules: SupervisorRule[];
  
  constructor(modelManager: ModelManager) {
    this.model = modelManager.getModel("supervision");
    this.initializeRules();
  }
  
  private initializeRules() {
    this.rules = [
      {
        id: "emotional_vs_technical_conflict",
        name: "تضارب بين التحليل العاطفي والتقني",
        priority: 1,
        condition: {
          type: "conflict",
          agents_involved: ["emotional", "technical"]
        },
        action: {
          type: "prefer_original_text",
          parameters: { reason: "النص الأصلي له الأولوية في التضارب" }
        },
        confidence_threshold: 0.8
      },
      {
        id: "low_confidence_element",
        name: "عنصر بثقة منخفضة",
        priority: 2,
        condition: {
          type: "low_confidence",
          agents_involved: ["breakdown"]
        },
        action: {
          type: "request_human_review",
          parameters: { review_type: "element_verification" }
        },
        confidence_threshold: 0.6
      },
      {
        id: "missing_evidence",
        name: "عنصر بدون دليل كافٍ",
        priority: 3,
        condition: {
          type: "missing_evidence",
          agents_involved: ["breakdown"]
        },
        action: {
          type: "escalate",
          parameters: { escalation_type: "evidence_required" }
        },
        confidence_threshold: 0.5
      }
    ];
  }
  
  async arbitrateConflicts(
    emotionalResult: EmotionalAnalysis,
    technicalResult: TechnicalValidation,
    breakdownResult: BreakdownResult
  ): Promise<{
    decisions: SupervisorDecision[];
    finalReport: FinalBreakdownReport;
  }> {
    console.log("⚖️ بدء عملية التحكيم والإشراف...");
    
    const decisions: SupervisorDecision[] = [];
    
    // فحص التضارب بين النتائج
    const conflicts = this.detectConflicts(emotionalResult, technicalResult, breakdownResult);
    
    for (const conflict of conflicts) {
      const decision = await this.resolveConflict(conflict);
      decisions.push(decision);
    }
    
    // بناء التقرير النهائي
    const finalReport = await this.generateFinalReport(
      emotionalResult,
      technicalResult,
      breakdownResult,
      decisions
    );
    
    console.log("✅ تم إكمال التحكيم والإشراف");
    return { decisions, finalReport };
  }
  
  private detectConflicts(
    emotional: EmotionalAnalysis,
    technical: TechnicalValidation,
    breakdown: BreakdownResult
  ): Array<{
    id: string;
    type: string;
    agents: string[];
    description: string;
    data: any;
  }> {
    const conflicts = [];
    
    // تضارب 1: مشاكل تقنية vs تحليل عاطفي إيجابي
    if (!technical.is_valid && emotional.audience_engagement > 0.7) {
      conflicts.push({
        id: `conflict_${Date.now()}_1`,
        type: "technical_vs_emotional",
        agents: ["technical", "emotional"],
        description: "التحليل العاطفي إيجابي لكن هناك مشاكل تقنية",
        data: { technical_errors: technical.errors, engagement: emotional.audience_engagement }
      });
    }
    
    // تضارب 2: عناصر بثقة منخفضة
    const lowConfidenceElements = breakdown.elements.filter(el => el.confidence < 0.6);
    if (lowConfidenceElements.length > 0) {
      conflicts.push({
        id: `conflict_${Date.now()}_2`,
        type: "low_confidence_elements",
        agents: ["breakdown"],
        description: `${lowConfidenceElements.length} عنصر بثقة منخفضة`,
        data: { elements: lowConfidenceElements }
      });
    }
    
    // تضارب 3: عدم وجود أدلة كافية
    const noEvidenceElements = breakdown.elements.filter(el => 
      !el.evidence.text_excerpt || el.evidence.text_excerpt.length < 3
    );
    if (noEvidenceElements.length > 0) {
      conflicts.push({
        id: `conflict_${Date.now()}_3`,
        type: "missing_evidence",
        agents: ["breakdown"],
        description: `${noEvidenceElements.length} عنصر بدون دليل كافٍ`,
        data: { elements: noEvidenceElements }
      });
    }
    
    return conflicts;
  }
  
  private async resolveConflict(conflict: any): Promise<SupervisorDecision> {
    // العثور على القاعدة المناسبة
    const applicableRule = this.rules.find(rule => {
      if (rule.condition.type === "conflict" && conflict.type.includes("vs")) {
        return rule.condition.agents_involved.every(agent => 
          conflict.agents.includes(agent)
        );
      }
      if (rule.condition.type === "low_confidence" && conflict.type === "low_confidence_elements") {
        return true;
      }
      if (rule.condition.type === "missing_evidence" && conflict.type === "missing_evidence") {
        return true;
      }
      return false;
    });
    
    if (!applicableRule) {
      // قاعدة افتراضية
      return {
        conflict_id: conflict.id,
        agents_involved: conflict.agents,
        conflict_type: conflict.type,
        resolution: "escalate",
        final_decision: { action: "human_review_required" },
        confidence: 0.5,
        reasoning: ["لم يتم العثور على قاعدة مناسبة", "يتطلب مراجعة بشرية"]
      };
    }
    
    // تطبيق القاعدة
    let finalDecision;
    let confidence = applicableRule.confidence_threshold;
    let reasoning = [`تم تطبيق القاعدة: ${applicableRule.name}`];
    
    switch (applicableRule.action.type) {
      case "prefer_original_text":
        finalDecision = {
          action: "prefer_original",
          rationale: applicableRule.action.parameters.reason
        };
        reasoning.push("تم إعطاء الأولوية للنص الأصلي");
        break;
        
      case "request_human_review":
        finalDecision = {
          action: "human_review",
          review_type: applicableRule.action.parameters.review_type
        };
        reasoning.push("تم طلب مراجعة بشرية");
        break;
        
      case "escalate":
        finalDecision = {
          action: "escalate",
          escalation_type: applicableRule.action.parameters.escalation_type
        };
        reasoning.push("تم تصعيد المشكلة");
        break;
        
      default:
        finalDecision = { action: "no_action" };
        reasoning.push("لا يوجد إجراء محدد");
    }
    
    return {
      conflict_id: conflict.id,
      agents_involved: conflict.agents,
      conflict_type: conflict.type,
      resolution: applicableRule.action.type,
      final_decision: finalDecision,
      confidence,
      reasoning
    };
  }
  
  private async generateFinalReport(
    emotional: EmotionalAnalysis,
    technical: TechnicalValidation,
    breakdown: BreakdownResult,
    decisions: SupervisorDecision[]
  ): Promise<FinalBreakdownReport> {
    
    // حساب الثقة الإجمالية
    const overallConfidence = this.calculateOverallConfidence(emotional, technical, breakdown, decisions);
    
    // تحديد ما إذا كانت المراجعة البشرية مطلوبة
    const humanReviewRequired = decisions.some(d => 
      d.final_decision.action === "human_review" || d.final_decision.action === "escalate"
    ) || overallConfidence < 0.7;
    
    // دمج العناصر النهائية
    const finalElements = breakdown.elements.filter(element => {
      // إزالة العناصر التي تم رفضها في القرارات
      const rejectedDecision = decisions.find(d => 
        d.conflict_type === "low_confidence_elements" && 
        d.final_decision.action === "human_review"
      );
      
      if (rejectedDecision && element.confidence < 0.6) {
        return false; // يتطلب مراجعة بشرية
      }
      
      return true;
    });
    
    return {
      script_title: "سيناريو غير مسمى",
      total_scenes: 1, // سيتم تحديثه في النظام الرئيسي
      processing_timestamp: new Date(),
      
      emotional_analysis: emotional,
      technical_validation: technical,
      breakdown_results: [breakdown],
      
      conflicts_resolved: decisions,
      final_elements: finalElements,
      
      overall_confidence: overallConfidence,
      human_review_required: humanReviewRequired,
      
      html_report: "", // سيتم توليده لاحقاً
      json_data: JSON.stringify({
        emotional,
        technical,
        breakdown,
        decisions
      }, null, 2),
      pdf_ready: !humanReviewRequired && overallConfidence > 0.8
    };
  }
  
  private calculateOverallConfidence(
    emotional: EmotionalAnalysis,
    technical: TechnicalValidation,
    breakdown: BreakdownResult,
    decisions: SupervisorDecision[]
  ): number {
    let confidence = 0.0;
    
    // وزن التحليل العاطفي (20%)
    confidence += emotional.audience_engagement * 0.2;
    
    // وزن التحليل التقني (30%)
    const technicalScore = technical.is_valid ? 1.0 : 0.3;
    confidence += technicalScore * 0.3;
    
    // وزن التفريغ (30%)
    const avgElementConfidence = breakdown.elements.length > 0 
      ? breakdown.elements.reduce((sum, el) => sum + el.confidence, 0) / breakdown.elements.length
      : 0.5;
    confidence += avgElementConfidence * 0.3;
    
    // وزن قرارات الإشراف (20%)
    const avgDecisionConfidence = decisions.length > 0
      ? decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
      : 0.8;
    confidence += avgDecisionConfidence * 0.2;
    
    return Math.min(confidence, 1.0);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// النظام الرئيسي متعدد الوكلاء (Multi-Agent System)
// ═══════════════════════════════════════════════════════════════════════════

export class ThreeReadBreakdownSystem {
  private modelManager: ModelManager;
  private pythonService: PythonBrainService;
  
  private emotionalAgent: EmotionalReadingAgent;
  private technicalAgent: TechnicalReadingAgent;
  private breakdownAgent: BreakdownReadingAgent;
  private supervisorAgent: SupervisorAgent;
  
  private isInitialized = false;
  
  constructor(pythonServiceUrl?: string) {
    console.log("🚀 تهيئة نظام Multi-Agent للتفريغ السينمائي...");
    
    this.modelManager = new ModelManager();
    this.pythonService = new PythonBrainService(pythonServiceUrl);
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log("🔧 إنشاء الوكلاء المتخصصين...");
      
      // إنشاء الوكلاء
      this.emotionalAgent = new EmotionalReadingAgent(this.modelManager, this.pythonService);
      this.technicalAgent = new TechnicalReadingAgent(this.modelManager, this.pythonService);
      this.breakdownAgent = new BreakdownReadingAgent(this.modelManager, this.pythonService);
      this.supervisorAgent = new SupervisorAgent(this.modelManager);
      
      console.log("✅ تم إنشاء جميع الوكلاء بنجاح:");
      console.log("   🎭 الوكيل العاطفي (Emotional Agent)");
      console.log("   🔧 الوكيل التقني (Technical Agent)");
      console.log("   📋 وكيل التفريغ (Breakdown Agent)");
      console.log("   ⚖️ الوكيل المشرف (Supervisor Agent)");
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error("❌ فشل في تهيئة النظام:", error);
      throw error;
    }
  }
  
  async processScript(scriptText: string, scriptTitle?: string): Promise<FinalBreakdownReport> {
    await this.initialize();
    
    console.log("=" .repeat(70));
    console.log("🎬 بدء معالجة السيناريو بمنهجية القراءات الثلاث");
    console.log("=" .repeat(70));
    
    const startTime = Date.now();
    
    try {
      // المرحلة 1: القراءة العاطفية
      console.log("\n📖 المرحلة 1: القراءة العاطفية");
      console.log("-".repeat(50));
      const emotionalResult = await this.emotionalAgent.analyzeNarrative(scriptText);
      
      // المرحلة 2: القراءة التقنية
      console.log("\n🔍 المرحلة 2: القراءة التقنية");
      console.log("-".repeat(50));
      const technicalResult = await this.technicalAgent.validateFormatting(scriptText);
      
      // المرحلة 3: قراءة التفريغ
      console.log("\n📋 المرحلة 3: قراءة التفريغ");
      console.log("-".repeat(50));
      const sceneId = "scene_1"; // سيتم تحسينه لدعم مشاهد متعددة
      const breakdownResult = await this.breakdownAgent.extractElements(scriptText, sceneId);
      
      // المرحلة 4: الإشراف والتحكيم
      console.log("\n⚖️ المرحلة 4: الإشراف والتحكيم");
      console.log("-".repeat(50));
      const { decisions, finalReport } = await this.supervisorAgent.arbitrateConflicts(
        emotionalResult,
        technicalResult,
        breakdownResult
      );
      
      // تحديث التقرير النهائي
      finalReport.script_title = scriptTitle || "سيناريو غير مسمى";
      finalReport.html_report = this.generateHTMLReport(finalReport);
      
      const processingTime = (Date.now() - startTime) / 1000;
      
      console.log("\n" + "=" .repeat(70));
      console.log("🎉 تم إكمال المعالجة بنجاح!");
      console.log(`⏱️ وقت المعالجة: ${processingTime.toFixed(2)} ثانية`);
      console.log(`🎯 الثقة الإجمالية: ${(finalReport.overall_confidence * 100).toFixed(1)}%`);
      console.log(`📊 العناصر المستخرجة: ${finalReport.final_elements.length}`);
      console.log(`⚠️ المراجعة البشرية مطلوبة: ${finalReport.human_review_required ? 'نعم' : 'لا'}`);
      console.log("=" .repeat(70));
      
      return finalReport;
      
    } catch (error) {
      console.error("❌ فشل في معالجة السيناريو:", error);
      throw error;
    }
  }
  
  private generateHTMLReport(report: FinalBreakdownReport): string {
    const timestamp = report.processing_timestamp.toLocaleString('ar-EG');
    
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير التفريغ السينمائي - ${report.script_title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #007bff; font-size: 2.5em; margin-bottom: 10px; }
        .subtitle { color: #666; font-size: 1.2em; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .section-title { color: #007bff; font-size: 1.5em; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
        .metric { display: inline-block; margin: 10px 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 0.9em; }
        .element { margin: 10px 0; padding: 10px; background: #f8f9fa; border-right: 4px solid #007bff; }
        .confidence { font-weight: bold; }
        .confidence.high { color: #28a745; }
        .confidence.medium { color: #ffc107; }
        .confidence.low { color: #dc3545; }
        .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .alert.warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">تقرير التفريغ السينمائي</h1>
            <p class="subtitle">${report.script_title}</p>
            <p class="subtitle">تم الإنشاء: ${timestamp}</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">📊 الملخص التنفيذي</h2>
            <div class="metric">
                <div class="metric-value">${(report.overall_confidence * 100).toFixed(1)}%</div>
                <div class="metric-label">الثقة الإجمالية</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.final_elements.length}</div>
                <div class="metric-label">العناصر المستخرجة</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.conflicts_resolved.length}</div>
                <div class="metric-label">التضاربات المحلولة</div>
            </div>
            
            ${report.human_review_required ? 
                '<div class="alert warning">⚠️ تتطلب هذه النتائج مراجعة بشرية قبل الاستخدام في الإنتاج</div>' :
                '<div class="alert success">✅ النتائج جاهزة للاستخدام في الإنتاج</div>'
            }
        </div>
        
        <div class="section">
            <h2 class="section-title">🎭 التحليل العاطفي</h2>
            <p><strong>النبرة العامة:</strong> ${report.emotional_analysis.overall_tone}</p>
            <p><strong>مستوى التفاعل:</strong> ${(report.emotional_analysis.audience_engagement * 100).toFixed(1)}%</p>
            <p><strong>رؤية المخرج:</strong> ${report.emotional_analysis.director_vision}</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">🔧 التحليل التقني</h2>
            <p><strong>صحة التنسيق:</strong> ${report.technical_validation.is_valid ? '✅ صالح' : '❌ يحتاج إصلاح'}</p>
            <p><strong>عدد الأخطاء:</strong> ${report.technical_validation.errors.length}</p>
            <p><strong>عدد التحذيرات:</strong> ${report.technical_validation.warnings.length}</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">📋 العناصر الإنتاجية</h2>
            ${report.final_elements.map(element => `
                <div class="element">
                    <strong>${element.name}</strong> (${element.category})
                    <br><small>${element.description}</small>
                    <br><span class="confidence ${this.getConfidenceClass(element.confidence)}">
                        الثقة: ${(element.confidence * 100).toFixed(1)}%
                    </span>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2 class="section-title">⚖️ قرارات الإشراف</h2>
            ${report.conflicts_resolved.map(decision => `
                <div class="element">
                    <strong>النزاع:</strong> ${decision.conflict_type}
                    <br><strong>القرار:</strong> ${decision.resolution}
                    <br><strong>المبرر:</strong> ${decision.reasoning.join(', ')}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
  
  private getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }
  
  getSystemStats() {
    return {
      isInitialized: this.isInitialized,
      availableModels: this.modelManager?.getAvailableModels() || [],
      agents: {
        emotional: !!this.emotionalAgent,
        technical: !!this.technicalAgent,
        breakdown: !!this.breakdownAgent,
        supervisor: !!this.supervisorAgent
      },
      pythonServiceConnected: this.pythonService ? true : false
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// نماذج إضافية (Additional Interfaces)
// ═══════════════════════════════════════════════════════════════════════════

interface SupervisorRule {
  id: string;
  name: string;
  priority: number;
  condition: {
    type: "conflict" | "inconsistency" | "missing_evidence" | "low_confidence";
    agents_involved: string[];
    element_categories?: ProductionCategory[];
    custom_logic?: string;
  };
  action: {
    type: "prefer_original_text" | "request_human_review" | "merge_results" | "escalate";
    parameters: Record<string, any>;
    fallback_action?: any;
  };
  confidence_threshold: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// تصدير النظام (Export)
// ═══════════════════════════════════════════════════════════════════════════

export default ThreeReadBreakdownSystem;

console.log("🎉 تم تحميل نظام Multi-Agent للتفريغ السينمائي بالكامل");
