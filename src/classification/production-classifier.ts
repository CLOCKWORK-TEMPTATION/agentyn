/**
 * محرك التصنيف الثابت للفئات الـ21
 * Production Classification Engine
 * 
 * يصنف العناصر الإنتاجية إلى 21 فئة قياسية
 * مع دعم Evidence tracking لكل عنصر مُصنف
 */

import { ProductionCategory, Evidence, ProductionElement } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// قواعد التصنيف
// ═══════════════════════════════════════════════════════════════════════════

export interface ClassificationRule {
  category: ProductionCategory;
  keywords: string[];
  context_patterns: RegExp[];
  exclusion_patterns: RegExp[];
  confidence_threshold: number;
  priority: number;
}

// قاموس التصنيف الثابت الشامل
export const CLASSIFICATION_TAXONOMY: Record<ProductionCategory, ClassificationRule> = {
  // ═══════════════════════════════════════════════════════════════════════
  // الأفراد (1-5)
  // ═══════════════════════════════════════════════════════════════════════
  
  [ProductionCategory.CAST_MEMBERS]: {
    category: ProductionCategory.CAST_MEMBERS,
    keywords: ["ممثل", "بطل", "بطلة", "شخصية", "دور", "يؤدي", "تؤدي"],
    context_patterns: [
      /^([أ-ي\w\s]+):/gm, // أسماء الشخصيات متبوعة بنقطتين
      /\b(يقول|تقول|يتحدث|تتحدث)\b/g
    ],
    exclusion_patterns: [/\b(كومبارس|إضافي|خلفية)\b/g],
    confidence_threshold: 0.8,
    priority: 1
  },

  [ProductionCategory.EXTRAS_ATMOSPHERE]: {
    category: ProductionCategory.EXTRAS_ATMOSPHERE,
    keywords: ["كومبارس", "إضافيين", "خلفية", "جمهور", "حشد", "مارة"],
    context_patterns: [
      /\b(في الخلفية|حول المكان|يملأون|جمهور)\b/g,
      /\b(عدد من|مجموعة من|حشد من)\b/g
    ],
    exclusion_patterns: [/\b(رئيسي|مهم|يتحدث|حوار)\b/g],
    confidence_threshold: 0.7,
    priority: 2
  },

  [ProductionCategory.EXTRAS_FEATURED]: {
    category: ProductionCategory.EXTRAS_FEATURED,
    keywords: ["كومبارس مميز", "إضافي مهم", "شخصية ثانوية", "دور صغير"],
    context_patterns: [
      /\b(يظهر|تظهر|يمر|تمر|يقف|تقف)\b/g,
      /\b(في المقدمة|واضح|مميز)\b/g
    ],
    exclusion_patterns: [/\b(حوار|يتحدث|رئيسي)\b/g],
    confidence_threshold: 0.6,
    priority: 3
  },

  [ProductionCategory.STUNT_PERFORMERS]: {
    category: ProductionCategory.STUNT_PERFORMERS,
    keywords: ["مجازفة", "حركة خطيرة", "قفز", "سقوط", "عراك", "مطاردة", "انفجار"],
    context_patterns: [
      /\b(يقفز|يسقط|يتعارك|يطارد|ينفجر)\b/g,
      /\b(حركة|مشهد عنف|خطير|مثير)\b/g
    ],
    exclusion_patterns: [/\b(بسيط|عادي|آمن)\b/g],
    confidence_threshold: 0.8,
    priority: 4
  },

  [ProductionCategory.ANIMAL_HANDLERS]: {
    category: ProductionCategory.ANIMAL_HANDLERS,
    keywords: ["مدرب حيوانات", "حيوان", "كلب", "قطة", "حصان", "طائر"],
    context_patterns: [
      /\b(كلب|قطة|حصان|طائر|حيوان)\b/g,
      /\b(يدرب|مدرب|يتعامل مع)\b/g
    ],
    exclusion_patterns: [/\b(لعبة|مجسم|رسم)\b/g],
    confidence_threshold: 0.9,
    priority: 5
  },

  // ═══════════════════════════════════════════════════════════════════════
  // الأشياء المحمولة (6-10)
  // ═══════════════════════════════════════════════════════════════════════

  [ProductionCategory.PROPS_HANDHELD]: {
    category: ProductionCategory.PROPS_HANDHELD,
    keywords: ["يمسك", "يحمل", "يأخذ", "في يده", "في يدها", "يرفع", "يضع"],
    context_patterns: [
      /\b(ظرف|هاتف|مفتاح|كأس|كوب|قلم|ورقة|مجلة|كتاب)\b/g,
      /\b(يمسك|يحمل|يأخذ|يرفع|يضع)\s+\w+/g
    ],
    exclusion_patterns: [/\b(على الطاولة|في الخلفية|معلق|ثابت)\b/g],
    confidence_threshold: 0.7,
    priority: 6
  },

  [ProductionCategory.PROPS_INTERACTIVE]: {
    category: ProductionCategory.PROPS_INTERACTIVE,
    keywords: ["يستخدم", "يشغل", "يفتح", "يغلق", "يضغط", "يلمس"],
    context_patterns: [
      /\b(حاسوب|لابتوب|تلفزيون|راديو|آلة|جهاز)\b/g,
      /\b(يستخدم|يشغل|يفتح|يغلق|يضغط)\s+\w+/g
    ],
    exclusion_patterns: [/\b(معطل|مكسور|للديكور)\b/g],
    confidence_threshold: 0.8,
    priority: 7
  },

  [ProductionCategory.WARDROBE_COSTUMES]: {
    category: ProductionCategory.WARDROBE_COSTUMES,
    keywords: ["يرتدي", "ترتدي", "ملابس", "زي", "فستان", "بدلة", "قميص", "بنطلون"],
    context_patterns: [
      /\b(يرتدي|ترتدي|يلبس|تلبس)\b/g,
      /\b(فستان|بدلة|قميص|بنطلون|جاكيت|معطف)\b/g
    ],
    exclusion_patterns: [/\b(عادي|يومي|غير مهم)\b/g],
    confidence_threshold: 0.6,
    priority: 8
  },

  [ProductionCategory.MAKEUP_HAIR]: {
    category: ProductionCategory.MAKEUP_HAIR,
    keywords: ["مكياج", "شعر", "تسريحة", "لحية", "شارب", "أحمر شفاه"],
    context_patterns: [
      /\b(مكياج|شعر|تسريحة|لحية|شارب)\b/g,
      /\b(جميل|أنيق|مرتب|مصفف)\b/g
    ],
    exclusion_patterns: [/\b(طبيعي|عادي|بدون)\b/g],
    confidence_threshold: 0.7,
    priority: 9
  },

  [ProductionCategory.SPECIAL_MAKEUP]: {
    category: ProductionCategory.SPECIAL_MAKEUP,
    keywords: ["مكياج خاص", "تأثيرات", "جروح", "دم", "وحش", "كبر السن"],
    context_patterns: [
      /\b(جرح|دم|ندبة|حرق|وحش|مخيف)\b/g,
      /\b(مكياج خاص|تأثيرات|تحويل)\b/g
    ],
    exclusion_patterns: [/\b(بسيط|عادي|طبيعي)\b/g],
    confidence_threshold: 0.9,
    priority: 10
  },

  // ═══════════════════════════════════════════════════════════════════════
  // البيئة والديكور (11-15)
  // ═══════════════════════════════════════════════════════════════════════

  [ProductionCategory.SET_DRESSING]: {
    category: ProductionCategory.SET_DRESSING,
    keywords: ["أثاث", "طاولة", "كرسي", "سرير", "خزانة", "رف", "لوحة", "ستارة"],
    context_patterns: [
      /\b(طاولة|كرسي|سرير|خزانة|رف|لوحة|ستارة)\b/g,
      /\b(في الغرفة|في المكان|موضوع|مرتب)\b/g
    ],
    exclusion_patterns: [/\b(يحمل|يمسك|يستخدم)\b/g],
    confidence_threshold: 0.6,
    priority: 11
  },

  [ProductionCategory.GREENERY_PLANTS]: {
    category: ProductionCategory.GREENERY_PLANTS,
    keywords: ["نبات", "شجرة", "زهرة", "عشب", "حديقة", "أوراق", "أغصان"],
    context_patterns: [
      /\b(نبات|شجرة|زهرة|عشب|حديقة|أوراق)\b/g,
      /\b(أخضر|طبيعي|نامي|متفتح)\b/g
    ],
    exclusion_patterns: [/\b(صناعي|بلاستيك|مجسم)\b/g],
    confidence_threshold: 0.8,
    priority: 12
  },

  [ProductionCategory.VEHICLES_PICTURE]: {
    category: ProductionCategory.VEHICLES_PICTURE,
    keywords: ["سيارة", "دراجة", "حافلة", "شاحنة", "قارب", "طائرة", "قطار"],
    context_patterns: [
      /\b(سيارة|دراجة|حافلة|شاحنة|قارب|طائرة|قطار)\b/g,
      /\b(يقود|تقود|يركب|تركب|يسافر)\b/g
    ],
    exclusion_patterns: [/\b(لعبة|مجسم|صورة)\b/g],
    confidence_threshold: 0.9,
    priority: 13
  },

  [ProductionCategory.LIVESTOCK_LARGE]: {
    category: ProductionCategory.LIVESTOCK_LARGE,
    keywords: ["بقرة", "حصان", "خروف", "ماعز", "جمل", "حمار", "ماشية"],
    context_patterns: [
      /\b(بقرة|حصان|خروف|ماعز|جمل|حمار|ماشية)\b/g,
      /\b(حيوان كبير|مزرعة|راعي)\b/g
    ],
    exclusion_patterns: [/\b(صغير|أليف|منزلي)\b/g],
    confidence_threshold: 0.9,
    priority: 14
  },

  [ProductionCategory.SPECIAL_EQUIPMENT]: {
    category: ProductionCategory.SPECIAL_EQUIPMENT,
    keywords: ["معدات خاصة", "آلة", "جهاز", "أدوات", "تقنية", "معقدة"],
    context_patterns: [
      /\b(معدات|آلة|جهاز|أدوات|تقنية|معقدة)\b/g,
      /\b(متخصصة|خاصة|تقنية|علمية)\b/g
    ],
    exclusion_patterns: [/\b(بسيطة|عادية|يومية)\b/g],
    confidence_threshold: 0.8,
    priority: 15
  },

  // ═══════════════════════════════════════════════════════════════════════
  // المؤثرات والخدمات (16-21)
  // ═══════════════════════════════════════════════════════════════════════

  [ProductionCategory.SPECIAL_EFFECTS_SFX]: {
    category: ProductionCategory.SPECIAL_EFFECTS_SFX,
    keywords: ["انفجار", "دخان", "نار", "مطر", "ثلج", "رياح", "ضباب"],
    context_patterns: [
      /\b(انفجار|دخان|نار|مطر|ثلج|رياح|ضباب)\b/g,
      /\b(مؤثر|تأثير|خاص|مثير)\b/g
    ],
    exclusion_patterns: [/\b(طبيعي|حقيقي|عادي)\b/g],
    confidence_threshold: 0.8,
    priority: 16
  },

  [ProductionCategory.VISUAL_EFFECTS_VFX]: {
    category: ProductionCategory.VISUAL_EFFECTS_VFX,
    keywords: ["مؤثرات بصرية", "كمبيوتر جرافيك", "خدع", "سحر", "خيال علمي"],
    context_patterns: [
      /\b(مؤثرات بصرية|جرافيك|خدع|سحر|خيال)\b/g,
      /\b(رقمي|افتراضي|مستحيل|خارق)\b/g
    ],
    exclusion_patterns: [/\b(حقيقي|طبيعي|بسيط)\b/g],
    confidence_threshold: 0.9,
    priority: 17
  },

  [ProductionCategory.SOUND_MUSIC]: {
    category: ProductionCategory.SOUND_MUSIC,
    keywords: ["موسيقى", "أغنية", "صوت", "نغمة", "آلة موسيقية", "مؤثرات صوتية"],
    context_patterns: [
      /\b(موسيقى|أغنية|صوت|نغمة|آلة موسيقية)\b/g,
      /\b(يعزف|تعزف|يغني|تغني|يسمع)\b/g
    ],
    exclusion_patterns: [/\b(صمت|هدوء|بدون صوت)\b/g],
    confidence_threshold: 0.7,
    priority: 18
  },

  [ProductionCategory.SECURITY_SERVICES]: {
    category: ProductionCategory.SECURITY_SERVICES,
    keywords: ["أمن", "حارس", "شرطة", "حماية", "مراقبة", "كاميرا أمان"],
    context_patterns: [
      /\b(أمن|حارس|شرطة|حماية|مراقبة)\b/g,
      /\b(يحرس|يراقب|يحمي|يؤمن)\b/g
    ],
    exclusion_patterns: [/\b(عادي|مدني|بدون)\b/g],
    confidence_threshold: 0.8,
    priority: 19
  },

  [ProductionCategory.ADDITIONAL_LABOR]: {
    category: ProductionCategory.ADDITIONAL_LABOR,
    keywords: ["عمال", "فنيين", "مساعدين", "طاقم", "عمالة", "خدمات"],
    context_patterns: [
      /\b(عمال|فنيين|مساعدين|طاقم|عمالة)\b/g,
      /\b(يعمل|تعمل|يساعد|تساعد|يخدم)\b/g
    ],
    exclusion_patterns: [/\b(ممثل|شخصية|دور)\b/g],
    confidence_threshold: 0.6,
    priority: 20
  },

  [ProductionCategory.MISCELLANEOUS]: {
    category: ProductionCategory.MISCELLANEOUS,
    keywords: ["متنوعات", "أخرى", "إضافية", "مختلفة", "متفرقة"],
    context_patterns: [
      /\b(متنوعات|أخرى|إضافية|مختلفة|متفرقة)\b/g,
      /\b(غير محدد|غير واضح|مختلط)\b/g
    ],
    exclusion_patterns: [],
    confidence_threshold: 0.3,
    priority: 21
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// محرك التصنيف الرئيسي
// ═══════════════════════════════════════════════════════════════════════════

export class ClassificationEngine {
  private rules: ClassificationRule[];

  constructor() {
    // ترتيب القواعد حسب الأولوية
    this.rules = Object.values(CLASSIFICATION_TAXONOMY)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * تصنيف عنصر واحد
   */
  classifyElement(
    text: string, 
    context: string, 
    sceneId: string
  ): ProductionElement | null {
    const classifications = this.analyzeText(text, context);
    
    if (classifications.length === 0) {
      return null;
    }

    // اختيار أفضل تصنيف
    const bestClassification = classifications[0];
    
    return {
      id: `${sceneId}_${bestClassification.category}_${Date.now()}`,
      category: bestClassification.category,
      name: bestClassification.extractedText,
      description: bestClassification.description,
      scene_id: sceneId,
      evidence: bestClassification.evidence,
      confidence: bestClassification.confidence,
      extracted_by: {
        agent_type: "breakdown",
        agent_version: "1.0.0",
        model_used: "classification_engine",
        prompt_version: "1.0",
        timestamp: new Date()
      },
      context: {
        scene_context: context.substring(0, 200) + "...",
        character_context: this.extractCharacterContext(text, context),
        timing_context: this.extractTimingContext(context),
        location_context: this.extractLocationContext(context)
      },
      dependencies: []
    };
  }

  /**
   * تصنيف متعدد للنص الكامل
   */
  classifyMultiple(
    text: string, 
    sceneId: string
  ): ProductionElement[] {
    const elements: ProductionElement[] = [];
    const sentences = this.splitIntoSentences(text);
    
    sentences.forEach((sentence, index) => {
      const element = this.classifyElement(sentence, text, sceneId);
      if (element) {
        element.id = `${sceneId}_${element.category}_${index}`;
        elements.push(element);
      }
    });

    // إزالة التكرارات
    return this.removeDuplicates(elements);
  }

  /**
   * تحليل النص وإرجاع جميع التصنيفات المحتملة
   */
  private analyzeText(text: string, context: string): Array<{
    category: ProductionCategory;
    confidence: number;
    evidence: Evidence;
    extractedText: string;
    description: string;
  }> {
    const results: Array<{
      category: ProductionCategory;
      confidence: number;
      evidence: Evidence;
      extractedText: string;
      description: string;
    }> = [];

    for (const rule of this.rules) {
      const match = this.matchRule(rule, text, context);
      if (match && match.confidence >= rule.confidence_threshold) {
        results.push({
          category: rule.category,
          confidence: match.confidence,
          evidence: match.evidence,
          extractedText: match.extractedText,
          description: this.generateDescription(rule.category, match.extractedText)
        });
      }
    }

    // ترتيب حسب الثقة
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * مطابقة قاعدة واحدة مع النص
   */
  private matchRule(
    rule: ClassificationRule, 
    text: string, 
    context: string
  ): {
    confidence: number;
    evidence: Evidence;
    extractedText: string;
  } | null {
    let confidence = 0;
    let matchedKeywords: string[] = [];
    let matchedPatterns: string[] = [];
    let extractedText = "";

    // فحص الكلمات المفتاحية
    const textLower = text.toLowerCase();
    const contextLower = context.toLowerCase();
    
    for (const keyword of rule.keywords) {
      if (textLower.includes(keyword.toLowerCase()) || 
          contextLower.includes(keyword.toLowerCase())) {
        confidence += 0.3;
        matchedKeywords.push(keyword);
        
        if (!extractedText && textLower.includes(keyword.toLowerCase())) {
          extractedText = this.extractAroundKeyword(text, keyword);
        }
      }
    }

    // فحص الأنماط السياقية
    for (const pattern of rule.context_patterns) {
      const matches = text.match(pattern) || context.match(pattern);
      if (matches) {
        confidence += 0.2;
        matchedPatterns.push(matches[0]);
        
        if (!extractedText) {
          extractedText = matches[0];
        }
      }
    }

    // فحص أنماط الاستبعاد
    for (const exclusionPattern of rule.exclusion_patterns) {
      if (text.match(exclusionPattern) || context.match(exclusionPattern)) {
        confidence -= 0.4;
      }
    }

    // تأكد من وجود نص مستخرج
    if (!extractedText) {
      extractedText = matchedKeywords[0] || matchedPatterns[0] || text.substring(0, 20);
    }

    if (confidence <= 0) {
      return null;
    }

    // إنشاء الدليل
    const evidence: Evidence = {
      span_start: text.indexOf(extractedText),
      span_end: text.indexOf(extractedText) + extractedText.length,
      text_excerpt: extractedText,
      rationale: this.generateRationale(rule.category, matchedKeywords, matchedPatterns),
      confidence: Math.min(confidence, 1.0)
    };

    return {
      confidence: Math.min(confidence, 1.0),
      evidence,
      extractedText
    };
  }

  /**
   * استخراج النص حول الكلمة المفتاحية
   */
  private extractAroundKeyword(text: string, keyword: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return keyword;

    const start = Math.max(0, index - 10);
    const end = Math.min(text.length, index + keyword.length + 10);
    
    return text.substring(start, end).trim();
  }

  /**
   * توليد المبرر للتصنيف
   */
  private generateRationale(
    category: ProductionCategory, 
    keywords: string[], 
    patterns: string[]
  ): string {
    const reasons = [];
    
    if (keywords.length > 0) {
      reasons.push(`كلمات مفتاحية: ${keywords.join(', ')}`);
    }
    
    if (patterns.length > 0) {
      reasons.push(`أنماط سياقية: ${patterns.length} نمط`);
    }
    
    return `تم التصنيف كـ ${category} بناءً على: ${reasons.join(' و ')}`;
  }

  /**
   * توليد وصف للعنصر
   */
  private generateDescription(category: ProductionCategory, extractedText: string): string {
    const categoryNames = {
      [ProductionCategory.CAST_MEMBERS]: "ممثل رئيسي",
      [ProductionCategory.EXTRAS_ATMOSPHERE]: "كومبارس خلفية",
      [ProductionCategory.EXTRAS_FEATURED]: "كومبارس مميز",
      [ProductionCategory.STUNT_PERFORMERS]: "مؤدي مجازفات",
      [ProductionCategory.ANIMAL_HANDLERS]: "مدرب حيوانات",
      [ProductionCategory.PROPS_HANDHELD]: "دعمة محمولة",
      [ProductionCategory.PROPS_INTERACTIVE]: "دعمة تفاعلية",
      [ProductionCategory.WARDROBE_COSTUMES]: "زي/ملابس",
      [ProductionCategory.MAKEUP_HAIR]: "مكياج وشعر",
      [ProductionCategory.SPECIAL_MAKEUP]: "مكياج خاص",
      [ProductionCategory.SET_DRESSING]: "ديكور الموقع",
      [ProductionCategory.GREENERY_PLANTS]: "نباتات وخضرة",
      [ProductionCategory.VEHICLES_PICTURE]: "مركبة",
      [ProductionCategory.LIVESTOCK_LARGE]: "ماشية كبيرة",
      [ProductionCategory.SPECIAL_EQUIPMENT]: "معدات خاصة",
      [ProductionCategory.SPECIAL_EFFECTS_SFX]: "مؤثرات خاصة",
      [ProductionCategory.VISUAL_EFFECTS_VFX]: "مؤثرات بصرية",
      [ProductionCategory.SOUND_MUSIC]: "صوت وموسيقى",
      [ProductionCategory.SECURITY_SERVICES]: "خدمات أمنية",
      [ProductionCategory.ADDITIONAL_LABOR]: "عمالة إضافية",
      [ProductionCategory.MISCELLANEOUS]: "متنوعات"
    };

    return `${categoryNames[category]}: ${extractedText}`;
  }

  /**
   * تقسيم النص إلى جمل
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?؟।]/)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }

  /**
   * إزالة العناصر المكررة
   */
  private removeDuplicates(elements: ProductionElement[]): ProductionElement[] {
    const seen = new Set<string>();
    return elements.filter(element => {
      const key = `${element.category}_${element.name.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * استخراج سياق الشخصية
   */
  private extractCharacterContext(text: string, context: string): string | undefined {
    const characterMatch = context.match(/^([أ-ي\w\s]+):/m);
    return characterMatch ? characterMatch[1].trim() : undefined;
  }

  /**
   * استخراج سياق التوقيت
   */
  private extractTimingContext(context: string): string | undefined {
    const timingMatch = context.match(/\b(نهار|ليل|صباح|مساء|ظهر|فجر|غروب)\b/i);
    return timingMatch ? timingMatch[1] : undefined;
  }

  /**
   * استخراج سياق الموقع
   */
  private extractLocationContext(context: string): string | undefined {
    const locationMatch = context.match(/\b(داخلي|خارجي|int|ext)\s*[-–—]?\s*([^-–—\n]+)/i);
    return locationMatch ? locationMatch[2].trim() : undefined;
  }

  /**
   * الحصول على إحصائيات التصنيف
   */
  getClassificationStats(): {
    totalRules: number;
    categoriesCount: number;
    avgConfidenceThreshold: number;
  } {
    const thresholds = this.rules.map(r => r.confidence_threshold);
    const avgThreshold = thresholds.reduce((a, b) => a + b, 0) / thresholds.length;

    return {
      totalRules: this.rules.length,
      categoriesCount: Object.keys(ProductionCategory).length,
      avgConfidenceThreshold: avgThreshold
    };
  }
}

export default ClassificationEngine;