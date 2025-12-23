/**
 * وكيل قراءة التفريغ (Breakdown Reading Agent)
 * متخصص في استخراج العناصر الإنتاجية من السيناريوهات
 * 
 * يركز على:
 * - استخراج العناصر الإنتاجية من النص
 * - التصنيف التلقائي للعناصر في الفئات الـ21
 * - توليد أوراق التفريغ مع Color coding
 * - تتبع الأدلة لكل عنصر مُستخرج
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PythonBrainService, ProductionCategory, ProductionElement, Evidence, AgentProvenance } from '../three-read-breakdown-system.js';
import { ClassificationEngine } from '../classification/production-classifier.js';
import { sanitizeLogInput, escapeHtml } from '../utils/security-helpers.js';

// ═══════════════════════════════════════════════════════════════════════════
// نماذج البيانات
// ═══════════════════════════════════════════════════════════════════════════

export interface BreakdownSheet {
  category: ProductionCategory;
  category_name: string;
  color_code: string;
  items: ProductionElement[];
  total_count: number;
  estimated_cost: number;
  priority_level: "high" | "medium" | "low";
  department: string;
}

export interface ExtractionContext {
  scene_id: string;
  scene_header: string;
  scene_content: string;
  previous_elements: ProductionElement[];
  character_list: string[];
  location_info: {
    int_ext: string;
    location: string;
    time_of_day: string;
  };
}

export interface BreakdownResult {
  scene_id: string;
  extraction_timestamp: Date;
  elements: ProductionElement[];
  breakdown_sheets: BreakdownSheet[];
  summary: {
    total_elements: number;
    by_category: Record<ProductionCategory, number>;
    complexity_score: number;
    estimated_budget_impact: "low" | "medium" | "high" | "very_high";
  };
  quality_metrics: {
    extraction_confidence: number;
    evidence_completeness: number;
    classification_accuracy: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// وكيل قراءة التفريغ
// ═══════════════════════════════════════════════════════════════════════════

export class BreakdownReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  private classificationEngine: ClassificationEngine;
  
  // خريطة الألوان للفئات
  private readonly CATEGORY_COLORS: Record<ProductionCategory, string> = {
    // الأفراد (1-5) - درجات الأحمر
    [ProductionCategory.CAST_MEMBERS]: "#FF6B6B",
    [ProductionCategory.EXTRAS_ATMOSPHERE]: "#FF8E8E", 
    [ProductionCategory.EXTRAS_FEATURED]: "#FFB1B1",
    [ProductionCategory.STUNT_PERFORMERS]: "#FF4444",
    [ProductionCategory.ANIMAL_HANDLERS]: "#FF9999",
    
    // الأشياء المحمولة (6-10) - درجات الأزرق
    [ProductionCategory.PROPS_HANDHELD]: "#4ECDC4",
    [ProductionCategory.PROPS_INTERACTIVE]: "#45B7D1",
    [ProductionCategory.WARDROBE_COSTUMES]: "#74B9FF",
    [ProductionCategory.MAKEUP_HAIR]: "#A29BFE",
    [ProductionCategory.SPECIAL_MAKEUP]: "#6C5CE7",
    
    // البيئة والديكور (11-15) - درجات الأخضر
    [ProductionCategory.SET_DRESSING]: "#96CEB4",
    [ProductionCategory.GREENERY_PLANTS]: "#55A3FF",
    [ProductionCategory.VEHICLES_PICTURE]: "#FFEAA7",
    [ProductionCategory.LIVESTOCK_LARGE]: "#FDCB6E",
    [ProductionCategory.SPECIAL_EQUIPMENT]: "#E17055",
    
    // المؤثرات والخدمات (16-21) - درجات البنفسجي والرمادي
    [ProductionCategory.SPECIAL_EFFECTS_SFX]: "#DDA0DD",
    [ProductionCategory.VISUAL_EFFECTS_VFX]: "#B19CD9",
    [ProductionCategory.SOUND_MUSIC]: "#98D8C8",
    [ProductionCategory.SECURITY_SERVICES]: "#95A5A6",
    [ProductionCategory.ADDITIONAL_LABOR]: "#BDC3C7",
    [ProductionCategory.MISCELLANEOUS]: "#CCCCCC"
  };

  // أقسام الإنتاج
  private readonly CATEGORY_DEPARTMENTS: Record<ProductionCategory, string> = {
    [ProductionCategory.CAST_MEMBERS]: "التمثيل",
    [ProductionCategory.EXTRAS_ATMOSPHERE]: "التمثيل",
    [ProductionCategory.EXTRAS_FEATURED]: "التمثيل", 
    [ProductionCategory.STUNT_PERFORMERS]: "المجازفات",
    [ProductionCategory.ANIMAL_HANDLERS]: "الحيوانات",
    [ProductionCategory.PROPS_HANDHELD]: "الدعائم",
    [ProductionCategory.PROPS_INTERACTIVE]: "الدعائم",
    [ProductionCategory.WARDROBE_COSTUMES]: "الأزياء",
    [ProductionCategory.MAKEUP_HAIR]: "المكياج",
    [ProductionCategory.SPECIAL_MAKEUP]: "المكياج الخاص",
    [ProductionCategory.SET_DRESSING]: "الديكور",
    [ProductionCategory.GREENERY_PLANTS]: "الديكور",
    [ProductionCategory.VEHICLES_PICTURE]: "المركبات",
    [ProductionCategory.LIVESTOCK_LARGE]: "الحيوانات",
    [ProductionCategory.SPECIAL_EQUIPMENT]: "المعدات",
    [ProductionCategory.SPECIAL_EFFECTS_SFX]: "المؤثرات الخاصة",
    [ProductionCategory.VISUAL_EFFECTS_VFX]: "المؤثرات البصرية",
    [ProductionCategory.SOUND_MUSIC]: "الصوت",
    [ProductionCategory.SECURITY_SERVICES]: "الأمن",
    [ProductionCategory.ADDITIONAL_LABOR]: "العمالة",
    [ProductionCategory.MISCELLANEOUS]: "متنوعات"
  };

  constructor(model: BaseLanguageModel, pythonService: PythonBrainService) {
    this.model = model;
    this.pythonService = pythonService;
    this.classificationEngine = new ClassificationEngine();
  }

  /**
   * استخراج العناصر الإنتاجية من مشهد
   */
  async extractElements(scriptText: string, sceneId: string): Promise<BreakdownResult> {
    console.log("📋 بدء استخراج العناصر الإنتاجية...");
    
    try {
      // إعداد السياق
      const context = this.prepareExtractionContext(scriptText, sceneId);
      
      // الاستخراج الأولي بـ AI
      const aiElements = await this.extractWithAI(context);
      
      // الاستخراج بمحرك التصنيف
      const classificationElements = this.classificationEngine.classifyMultiple(scriptText, sceneId);
      
      // دمج النتائج
      let allElements = this.mergeExtractionResults(aiElements, classificationElements);
      
      // تحسين بـ Python service إذا متاح
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "prop_classification",
          { 
            scene_id: sceneId,
            extract_all: true,
            include_evidence: true
          }
        );
        
        if (pythonJob.status !== "fallback") {
          const pythonResult = await this.pythonService.waitForCompletion(pythonJob.job_id, 25000);
          allElements = this.enhanceWithPythonResults(allElements, pythonResult);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين بـ Python service:", (pythonError as Error).message);
      }
      
      // إنشاء أوراق التفريغ
      const breakdownSheets = this.generateBreakdownSheets(allElements);
      
      // حساب المقاييس
      const summary = this.calculateSummary(allElements);
      const qualityMetrics = this.calculateQualityMetrics(allElements, scriptText);
      
      const result: BreakdownResult = {
        scene_id: sceneId,
        extraction_timestamp: new Date(),
        elements: allElements,
        breakdown_sheets: breakdownSheets,
        summary,
        quality_metrics: qualityMetrics
      };
      
      console.log(`✅ تم استخراج ${sanitizeLogInput(allElements.length)} عنصر إنتاجي`);
      return result;
      
    } catch (error) {
      console.error("❌ خطأ في استخراج العناصر:", error);
      return this.createFallbackBreakdownResult(scriptText, sceneId);
    }
  }

  /**
   * استخراج العناصر باستخدام AI
   */
  private async extractWithAI(context: ExtractionContext): Promise<ProductionElement[]> {
    const systemPrompt = this.createExtractionSystemPrompt();
    
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(this.formatExtractionPrompt(context))
    ];
    
    const response = await this.model.invoke(messages);
    return this.parseAIExtractionResponse(response.content.toString(), context);
  }

  /**
   * إنشاء prompt النظام للاستخراج
   */
  private createExtractionSystemPrompt(): string {
    return `أنت وكيل متخصص في تفريغ السيناريوهات السينمائية واستخراج العناصر الإنتاجية.

مهمتك: مسح النص بدقة واستخراج جميع العناصر التي تحتاج إلى تحضير أو تجهيز للإنتاج.

الفئات الـ21 للتصنيف:

الأفراد (1-5):
- cast_members: الممثلون الرئيسيون والشخصيات المهمة
- extras_atmosphere: الكومبارس العاديون في الخلفية
- extras_featured: الكومبارس المميزون أو الظاهرون بوضوح
- stunt_performers: مؤدو المجازفات والحركات الخطيرة
- animal_handlers: مدربو ومتعاملو الحيوانات

الأشياء المحمولة (6-10):
- props_handheld: الدعائم التي يحملها أو يستخدمها الممثلون
- props_interactive: الدعائم التي يتفاعل معها الممثلون
- wardrobe_costumes: الملابس والأزياء الخاصة
- makeup_hair: المكياج وتسريحات الشعر العادية
- special_makeup: المكياج الخاص والتأثيرات

البيئة والديكور (11-15):
- set_dressing: أثاث وديكور الموقع
- greenery_plants: النباتات والخضرة الطبيعية أو الصناعية
- vehicles_picture: المركبات الظاهرة في الصورة
- livestock_large: الماشية والحيوانات الكبيرة
- special_equipment: المعدات التقنية أو الخاصة

المؤثرات والخدمات (16-21):
- special_effects_sfx: المؤثرات الخاصة العملية
- visual_effects_vfx: المؤثرات البصرية الرقمية
- sound_music: الموسيقى والمؤثرات الصوتية
- security_services: خدمات الأمن والحماية
- additional_labor: العمالة الإضافية المطلوبة
- miscellaneous: عناصر متنوعة لا تندرج تحت الفئات الأخرى

قواعد الاستخراج:
1. اقرأ النص بعناية واستخرج كل عنصر يحتاج تحضير
2. لا تستخرج الأشياء المذكورة عابراً فقط
3. ركز على العناصر الظاهرة أو المستخدمة فعلياً
4. قدم دليلاً نصياً لكل عنصر مستخرج
5. صنف كل عنصر في الفئة الأنسب
6. اذكر السبب في اختيار الفئة

أخرج النتيجة بصيغة JSON مع قائمة العناصر المستخرجة.`;
  }

  /**
   * تنسيق prompt الاستخراج
   */
  private formatExtractionPrompt(context: ExtractionContext): string {
    return `استخرج العناصر الإنتاجية من هذا المشهد:

معرف المشهد: ${context.scene_id}
ترويسة المشهد: ${context.scene_header}

معلومات الموقع:
- النوع: ${context.location_info.int_ext}
- المكان: ${context.location_info.location}
- الوقت: ${context.location_info.time_of_day}

الشخصيات المعروفة: ${context.character_list.join(', ')}

محتوى المشهد:
${context.scene_content}

استخرج جميع العناصر الإنتاجية المطلوبة مع تصنيفها والدليل النصي لكل عنصر.`;
  }

  /**
   * تحليل استجابة AI
   */
  private parseAIExtractionResponse(responseText: string, context: ExtractionContext): ProductionElement[] {
    const elements: ProductionElement[] = [];
    
    try {
      // محاولة تحليل JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.elements && Array.isArray(parsed.elements)) {
          parsed.elements.forEach((element: any, index: number) => {
            const productionElement = this.createProductionElement(element, context, index);
            if (productionElement) {
              elements.push(productionElement);
            }
          });
        }
      }
    } catch (parseError) {
      console.warn("فشل تحليل JSON، استخدام تحليل نصي:", parseError instanceof Error ? parseError.message : String(parseError));
      // تحليل نصي كبديل
      return this.parseTextualResponse(responseText, context);
    }
    
    return elements;
  }

  /**
   * تحليل نصي كبديل
   */
  private parseTextualResponse(responseText: string, context: ExtractionContext): ProductionElement[] {
    const elements: ProductionElement[] = [];
    const lines = responseText.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10 && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
        // محاولة استخراج عنصر من السطر
        const element = this.extractElementFromLine(trimmed, context, index);
        if (element) {
          elements.push(element);
        }
      }
    });
    
    return elements;
  }

  /**
   * إنشاء عنصر إنتاجي
   */
  private createProductionElement(
    elementData: any, 
    context: ExtractionContext, 
    index: number
  ): ProductionElement | null {
    try {
      const category = this.validateCategory(elementData.category);
      if (!category) return null;
      
      const evidence: Evidence = {
        span_start: elementData.span_start || 0,
        span_end: elementData.span_end || context.scene_content.length,
        text_excerpt: elementData.text_excerpt || elementData.name || "غير محدد",
        rationale: elementData.rationale || `استخراج من المشهد ${context.scene_id}`,
        confidence: Math.min(Math.max(elementData.confidence || 0.7, 0), 1)
      };
      
      const provenance: AgentProvenance = {
        agent_type: "breakdown",
        agent_version: "1.0.0",
        model_used: "ai_extraction",
        prompt_version: "1.0",
        timestamp: new Date()
      };
      
      return {
        id: `${context.scene_id}_${category}_${index}`,
        category,
        name: elementData.name || "عنصر غير مسمى",
        description: elementData.description || `${this.getCategoryName(category)}: ${elementData.name}`,
        scene_id: context.scene_id,
        evidence,
        confidence: evidence.confidence,
        extracted_by: provenance,
        context: {
          scene_context: context.scene_content.substring(0, 200) + "...",
          character_context: this.extractCharacterContext(elementData, context),
          timing_context: context.location_info.time_of_day,
          location_context: `${context.location_info.int_ext} - ${context.location_info.location}`
        },
        dependencies: elementData.dependencies || []
      };
    } catch (error) {
      console.warn("فشل إنشاء عنصر إنتاجي:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * استخراج عنصر من سطر نصي
   */
  private extractElementFromLine(line: string, context: ExtractionContext, index: number): ProductionElement | null {
    // تحليل بسيط للسطر لاستخراج عنصر محتمل
    const keywords = ['يحمل', 'يستخدم', 'يرتدي', 'على الطاولة', 'في يده', 'يقود'];
    
    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        // محاولة استخراج العنصر
        const elementName = this.extractElementName(line, keyword);
        if (elementName) {
          const category = this.guessCategory(elementName, keyword);
          
          return {
            id: `${context.scene_id}_${category}_text_${index}`,
            category,
            name: elementName,
            description: `${this.getCategoryName(category)}: ${elementName}`,
            scene_id: context.scene_id,
            evidence: {
              span_start: 0,
              span_end: line.length,
              text_excerpt: line,
              rationale: `استخراج نصي من الكلمة المفتاحية: ${keyword}`,
              confidence: 0.6
            },
            confidence: 0.6,
            extracted_by: {
              agent_type: "breakdown",
              agent_version: "1.0.0", 
              model_used: "text_extraction",
              prompt_version: "1.0",
              timestamp: new Date()
            },
            context: {
              scene_context: context.scene_content.substring(0, 200) + "...",
              timing_context: context.location_info.time_of_day,
              location_context: `${context.location_info.int_ext} - ${context.location_info.location}`
            },
            dependencies: []
          };
        }
      }
    }
    
    return null;
  }

  /**
   * إعداد سياق الاستخراج
   */
  private prepareExtractionContext(scriptText: string, sceneId: string): ExtractionContext {
    const lines = scriptText.split('\n');
    const sceneHeader = lines.find(line => line.includes('مشهد') || line.includes('scene')) || "غير محدد";
    
    // استخراج معلومات الموقع
    const locationInfo = this.parseLocationInfo(sceneHeader);
    
    // استخراج قائمة الشخصيات
    const characterList = this.extractCharacterList(scriptText);
    
    return {
      scene_id: sceneId,
      scene_header: sceneHeader,
      scene_content: scriptText,
      previous_elements: [],
      character_list: characterList,
      location_info: locationInfo
    };
  }

  /**
   * دمج نتائج الاستخراج
   */
  private mergeExtractionResults(
    aiElements: ProductionElement[], 
    classificationElements: ProductionElement[]
  ): ProductionElement[] {
    const merged = [...aiElements];
    
    // إضافة العناصر من التصنيف التي لم يتم استخراجها بـ AI
    classificationElements.forEach(classElement => {
      const exists = merged.some(aiElement => 
        aiElement.name.toLowerCase() === classElement.name.toLowerCase() &&
        aiElement.category === classElement.category
      );
      
      if (!exists) {
        merged.push(classElement);
      }
    });
    
    return merged;
  }

  /**
   * توليد أوراق التفريغ
   */
  private generateBreakdownSheets(elements: ProductionElement[]): BreakdownSheet[] {
    const sheets: BreakdownSheet[] = [];
    const groupedElements = this.groupElementsByCategory(elements);
    
    Object.entries(groupedElements).forEach(([category, items]) => {
      const productionCategory = category as ProductionCategory;
      
      sheets.push({
        category: productionCategory,
        category_name: this.getCategoryName(productionCategory),
        color_code: this.CATEGORY_COLORS[productionCategory],
        items,
        total_count: items.length,
        estimated_cost: this.estimateCategoryCost(productionCategory, items.length),
        priority_level: this.calculatePriorityLevel(productionCategory, items.length),
        department: this.CATEGORY_DEPARTMENTS[productionCategory]
      });
    });
    
    // ترتيب حسب الأولوية والعدد
    return sheets.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority_level] - priorityOrder[a.priority_level];
      return priorityDiff !== 0 ? priorityDiff : b.total_count - a.total_count;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات التحليل
  // ═══════════════════════════════════════════════════════════════════════

  private validateCategory(category: string): ProductionCategory | null {
    return Object.values(ProductionCategory).includes(category as ProductionCategory) 
      ? category as ProductionCategory 
      : null;
  }

  private getCategoryName(category: ProductionCategory): string {
    const names = {
      [ProductionCategory.CAST_MEMBERS]: "ممثلون رئيسيون",
      [ProductionCategory.EXTRAS_ATMOSPHERE]: "كومبارس خلفية",
      [ProductionCategory.EXTRAS_FEATURED]: "كومبارس مميز",
      [ProductionCategory.STUNT_PERFORMERS]: "مؤدو مجازفات",
      [ProductionCategory.ANIMAL_HANDLERS]: "مدربو حيوانات",
      [ProductionCategory.PROPS_HANDHELD]: "دعائم محمولة",
      [ProductionCategory.PROPS_INTERACTIVE]: "دعائم تفاعلية",
      [ProductionCategory.WARDROBE_COSTUMES]: "أزياء وملابس",
      [ProductionCategory.MAKEUP_HAIR]: "مكياج وشعر",
      [ProductionCategory.SPECIAL_MAKEUP]: "مكياج خاص",
      [ProductionCategory.SET_DRESSING]: "ديكور الموقع",
      [ProductionCategory.GREENERY_PLANTS]: "نباتات وخضرة",
      [ProductionCategory.VEHICLES_PICTURE]: "مركبات",
      [ProductionCategory.LIVESTOCK_LARGE]: "ماشية كبيرة",
      [ProductionCategory.SPECIAL_EQUIPMENT]: "معدات خاصة",
      [ProductionCategory.SPECIAL_EFFECTS_SFX]: "مؤثرات خاصة",
      [ProductionCategory.VISUAL_EFFECTS_VFX]: "مؤثرات بصرية",
      [ProductionCategory.SOUND_MUSIC]: "صوت وموسيقى",
      [ProductionCategory.SECURITY_SERVICES]: "خدمات أمنية",
      [ProductionCategory.ADDITIONAL_LABOR]: "عمالة إضافية",
      [ProductionCategory.MISCELLANEOUS]: "متنوعات"
    };
    
    return names[category] || category;
  }

  private parseLocationInfo(sceneHeader: string): ExtractionContext['location_info'] {
    const intExtMatch = sceneHeader.match(/(داخلي|خارجي|int\.?|ext\.?)/i);
    const timeMatch = sceneHeader.match(/(ليل|نهار|صباح|مساء|day|night|dawn|dusk)/i);
    
    let location = "غير محدد";
    if (intExtMatch && timeMatch) {
      const start = sceneHeader.indexOf(intExtMatch[0]) + intExtMatch[0].length;
      const end = sceneHeader.indexOf(timeMatch[0]);
      location = sceneHeader.substring(start, end).replace(/[-–—]/g, '').trim();
    }
    
    return {
      int_ext: intExtMatch ? intExtMatch[0] : "غير محدد",
      location,
      time_of_day: timeMatch ? timeMatch[0] : "غير محدد"
    };
  }

  private extractCharacterList(scriptText: string): string[] {
    const characterPattern = /^([أ-ي\w\s]{2,30}):/gm;
    const matches = scriptText.match(characterPattern) || [];
    // تنظيف الأسماء من أحرف HTML الخطيرة لمنع XSS (CWE-79, CWE-80)
    return [...new Set(matches.map(m => escapeHtml(m.replace(':', '').trim())))];
  }

  private extractCharacterContext(elementData: any, context: ExtractionContext): string | undefined {
    if (elementData.character) return elementData.character;
    
    // محاولة استخراج الشخصية من السياق
    const nearbyCharacter = context.character_list.find(char => 
      context.scene_content.toLowerCase().includes(char.toLowerCase())
    );
    
    return nearbyCharacter;
  }

  private extractElementName(line: string, keyword: string): string | null {
    const keywordIndex = line.indexOf(keyword);
    if (keywordIndex === -1) return null;
    
    // استخراج الكلمات بعد الكلمة المفتاحية
    const afterKeyword = line.substring(keywordIndex + keyword.length).trim();
    const words = afterKeyword.split(/\s+/);
    
    // أخذ أول كلمة أو كلمتين
    return words.slice(0, 2).join(' ').replace(/[^\u0600-\u06FF\w\s]/g, '').trim();
  }

  private guessCategory(elementName: string, keyword: string): ProductionCategory {
    const actionMap: Record<string, ProductionCategory> = {
      يحمل: ProductionCategory.PROPS_HANDHELD,
      يستخدم: ProductionCategory.PROPS_INTERACTIVE,
      يرتدي: ProductionCategory.WARDROBE_COSTUMES,
      'على الطاولة': ProductionCategory.SET_DRESSING,
      'في يده': ProductionCategory.PROPS_HANDHELD,
      يقود: ProductionCategory.VEHICLES_PICTURE
    };
    
    return actionMap[keyword.toLowerCase()] || ProductionCategory.MISCELLANEOUS;
  }

  private groupElementsByCategory(elements: ProductionElement[]): Record<string, ProductionElement[]> {
    const grouped: Record<string, ProductionElement[]> = {};
    
    elements.forEach(element => {
      if (!grouped[element.category]) {
        grouped[element.category] = [];
      }
      grouped[element.category].push(element);
    });
    
    return grouped;
  }

  private estimateCategoryCost(category: ProductionCategory, itemCount: number): number {
    // تقدير تكلفة تقريبية بناءً على الفئة وعدد العناصر
    const baseCosts = {
      [ProductionCategory.CAST_MEMBERS]: 1000,
      [ProductionCategory.EXTRAS_ATMOSPHERE]: 100,
      [ProductionCategory.EXTRAS_FEATURED]: 200,
      [ProductionCategory.STUNT_PERFORMERS]: 2000,
      [ProductionCategory.ANIMAL_HANDLERS]: 1500,
      [ProductionCategory.PROPS_HANDHELD]: 50,
      [ProductionCategory.PROPS_INTERACTIVE]: 200,
      [ProductionCategory.WARDROBE_COSTUMES]: 300,
      [ProductionCategory.MAKEUP_HAIR]: 150,
      [ProductionCategory.SPECIAL_MAKEUP]: 500,
      [ProductionCategory.SET_DRESSING]: 400,
      [ProductionCategory.GREENERY_PLANTS]: 100,
      [ProductionCategory.VEHICLES_PICTURE]: 3000,
      [ProductionCategory.LIVESTOCK_LARGE]: 2000,
      [ProductionCategory.SPECIAL_EQUIPMENT]: 1000,
      [ProductionCategory.SPECIAL_EFFECTS_SFX]: 2500,
      [ProductionCategory.VISUAL_EFFECTS_VFX]: 3000,
      [ProductionCategory.SOUND_MUSIC]: 800,
      [ProductionCategory.SECURITY_SERVICES]: 600,
      [ProductionCategory.ADDITIONAL_LABOR]: 400,
      [ProductionCategory.MISCELLANEOUS]: 200
    };
    
    return (baseCosts[category] || 200) * itemCount;
  }

  private calculatePriorityLevel(category: ProductionCategory, itemCount: number): "high" | "medium" | "low" {
    const highPriorityCategories = [
      ProductionCategory.CAST_MEMBERS,
      ProductionCategory.STUNT_PERFORMERS,
      ProductionCategory.VEHICLES_PICTURE,
      ProductionCategory.SPECIAL_EFFECTS_SFX,
      ProductionCategory.VISUAL_EFFECTS_VFX
    ];
    
    const mediumPriorityCategories = [
      ProductionCategory.WARDROBE_COSTUMES,
      ProductionCategory.SPECIAL_MAKEUP,
      ProductionCategory.SET_DRESSING,
      ProductionCategory.SPECIAL_EQUIPMENT
    ];
    
    if (highPriorityCategories.includes(category) || itemCount > 5) {
      return "high";
    } else if (mediumPriorityCategories.includes(category) || itemCount > 2) {
      return "medium";
    } else {
      return "low";
    }
  }

  private calculateSummary(elements: ProductionElement[]): BreakdownResult['summary'] {
    const byCategory: Record<ProductionCategory, number> = {} as Record<ProductionCategory, number>;
    
    // تهيئة العدادات
    Object.values(ProductionCategory).forEach(category => {
      byCategory[category] = 0;
    });
    
    // عد العناصر حسب الفئة
    elements.forEach(element => {
      byCategory[element.category]++;
    });
    
    // حساب درجة التعقيد
    const complexityScore = Math.min(elements.length / 20, 1);
    
    // تقدير تأثير الميزانية
    const totalEstimatedCost = Object.entries(byCategory).reduce((sum, [category, count]) => {
      return sum + this.estimateCategoryCost(category as ProductionCategory, count);
    }, 0);
    
    let budgetImpact: "low" | "medium" | "high" | "very_high";
    if (totalEstimatedCost < 5000) budgetImpact = "low";
    else if (totalEstimatedCost < 15000) budgetImpact = "medium";
    else if (totalEstimatedCost < 50000) budgetImpact = "high";
    else budgetImpact = "very_high";
    
    return {
      total_elements: elements.length,
      by_category: byCategory,
      complexity_score: complexityScore,
      estimated_budget_impact: budgetImpact
    };
  }

  private calculateQualityMetrics(elements: ProductionElement[], scriptText: string): BreakdownResult['quality_metrics'] {
    // حساب متوسط الثقة في الاستخراج
    const extractionConfidence = elements.length > 0 
      ? elements.reduce((sum, el) => sum + el.confidence, 0) / elements.length
      : 0;
    
    // حساب اكتمال الأدلة
    const elementsWithGoodEvidence = elements.filter(el => 
      el.evidence.text_excerpt.length > 3 && el.evidence.confidence > 0.5
    ).length;
    const evidenceCompleteness = elements.length > 0 
      ? elementsWithGoodEvidence / elements.length 
      : 0;
    
    // تقدير دقة التصنيف (بناءً على وجود أدلة قوية)
    const wellClassifiedElements = elements.filter(el => 
      el.evidence.rationale.length > 10 && el.confidence > 0.6
    ).length;
    const classificationAccuracy = elements.length > 0 
      ? wellClassifiedElements / elements.length 
      : 0;
    
    return {
      extraction_confidence: extractionConfidence,
      evidence_completeness: evidenceCompleteness,
      classification_accuracy: classificationAccuracy
    };
  }

  private enhanceWithPythonResults(elements: ProductionElement[], pythonResult: any): ProductionElement[] {
    if (!pythonResult || !pythonResult.result) return elements;
    
    const enhancement = pythonResult.result;
    const enhanced = [...elements];
    
    // إضافة عناصر جديدة من Python
    if (enhancement.elements && Array.isArray(enhancement.elements)) {
      enhancement.elements.forEach((pythonElement: any) => {
        const exists = enhanced.some(el => 
          el.name.toLowerCase() === pythonElement.name?.toLowerCase() &&
          el.category === pythonElement.category
        );
        
        if (!exists && pythonElement.name && pythonElement.category) {
          enhanced.push({
            id: `${pythonElement.scene_id || 'scene'}_${pythonElement.category}_python_${enhanced.length}`,
            category: pythonElement.category,
            name: pythonElement.name,
            description: pythonElement.description || `${pythonElement.category}: ${pythonElement.name}`,
            scene_id: pythonElement.scene_id || 'scene_1',
            evidence: {
              span_start: pythonElement.span_start || 0,
              span_end: pythonElement.span_end || 100,
              text_excerpt: pythonElement.text_excerpt || pythonElement.name,
              rationale: pythonElement.rationale || "استخراج بـ Python service",
              confidence: pythonElement.confidence || 0.8
            },
            confidence: pythonElement.confidence || 0.8,
            extracted_by: {
              agent_type: "breakdown",
              agent_version: "1.0.0",
              model_used: "python_service",
              prompt_version: "1.0",
              timestamp: new Date()
            },
            context: {
              scene_context: pythonElement.context || "Python enhancement"
            },
            dependencies: pythonElement.dependencies || []
          });
        }
      });
    }
    
    return enhanced;
  }

  private createFallbackBreakdownResult(scriptText: string, sceneId: string): BreakdownResult {
    // استخراج أساسي بالتصنيف فقط
    const elements = this.classificationEngine.classifyMultiple(scriptText, sceneId);
    const breakdownSheets = this.generateBreakdownSheets(elements);
    const summary = this.calculateSummary(elements);
    const qualityMetrics = this.calculateQualityMetrics(elements, scriptText);
    
    return {
      scene_id: sceneId,
      extraction_timestamp: new Date(),
      elements,
      breakdown_sheets: breakdownSheets,
      summary,
      quality_metrics: qualityMetrics
    };
  }
}

export default BreakdownReadingAgent;