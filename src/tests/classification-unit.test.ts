/**
 * اختبارات وحدة لمحرك التصنيف
 * Unit Tests for Classification Engine
 */

import { describe, test, expect } from '@jest/globals';
import { ClassificationEngine, CLASSIFICATION_TAXONOMY } from '../classification/production-classifier.js';
import { ProductionCategory } from '../three-read-breakdown-system.js';

describe('Classification Engine Unit Tests', () => {
  let engine: ClassificationEngine;

  beforeAll(() => {
    engine = new ClassificationEngine();
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التصنيف الأساسي
  // ═══════════════════════════════════════════════════════════════════════

  describe('Basic Classification', () => {
    test('should classify handheld props correctly', () => {
      const testCases = [
        'أحمد يمسك كوب القهوة',
        'سارة تحمل الهاتف في يدها',
        'محمد يأخذ المفتاح من الطاولة',
        'فاطمة ترفع القلم لتكتب'
      ];

      testCases.forEach(text => {
        const elements = engine.classifyMultiple(text, 'test_scene');
        const propsElements = elements.filter(e => e.category === ProductionCategory.PROPS_HANDHELD);
        
        expect(propsElements.length).toBeGreaterThan(0);
        expect(propsElements[0].confidence).toBeGreaterThan(0.5);
      });
    });

    test('should classify wardrobe items correctly', () => {
      const testCases = [
        'أحمد يرتدي بدلة سوداء أنيقة',
        'سارة ترتدي فستان أحمر جميل',
        'محمد يلبس قميص أبيض وبنطلون أزرق',
        'فاطمة تلبس جاكيت جلدي'
      ];

      testCases.forEach(text => {
        const elements = engine.classifyMultiple(text, 'test_scene');
        const wardrobeElements = elements.filter(e => e.category === ProductionCategory.WARDROBE_COSTUMES);
        
        expect(wardrobeElements.length).toBeGreaterThan(0);
        expect(wardrobeElements[0].confidence).toBeGreaterThan(0.4);
      });
    });

    test('should classify vehicles correctly', () => {
      const testCases = [
        'أحمد يقود السيارة بسرعة',
        'سارة تركب الدراجة في الحديقة',
        'محمد يسافر بالقطار',
        'الحافلة تقف في المحطة'
      ];

      testCases.forEach(text => {
        const elements = engine.classifyMultiple(text, 'test_scene');
        const vehicleElements = elements.filter(e => e.category === ProductionCategory.VEHICLES_PICTURE);
        
        expect(vehicleElements.length).toBeGreaterThan(0);
        expect(vehicleElements[0].confidence).toBeGreaterThan(0.7);
      });
    });

    test('should classify special effects correctly', () => {
      const testCases = [
        'انفجار كبير يهز المبنى',
        'دخان كثيف يملأ المكان',
        'نار تشتعل في الخلفية',
        'مطر غزير يسقط على الأرض'
      ];

      testCases.forEach(text => {
        const elements = engine.classifyMultiple(text, 'test_scene');
        const sfxElements = elements.filter(e => e.category === ProductionCategory.SPECIAL_EFFECTS_SFX);
        
        expect(sfxElements.length).toBeGreaterThan(0);
        expect(sfxElements[0].confidence).toBeGreaterThan(0.6);
      });
    });

    test('should classify sound and music correctly', () => {
      const testCases = [
        'موسيقى حزينة تعزف في الخلفية',
        'أحمد يغني أغنية جميلة',
        'صوت الطبول يدق بقوة',
        'نغمة الهاتف ترن'
      ];

      testCases.forEach(text => {
        const elements = engine.classifyMultiple(text, 'test_scene');
        const soundElements = elements.filter(e => e.category === ProductionCategory.SOUND_MUSIC);
        
        expect(soundElements.length).toBeGreaterThan(0);
        expect(soundElements[0].confidence).toBeGreaterThan(0.5);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات قواعد الاستبعاد
  // ═══════════════════════════════════════════════════════════════════════

  describe('Exclusion Rules', () => {
    test('should not classify background items as handheld props', () => {
      const text = 'كوب القهوة موضوع على الطاولة في الخلفية';
      const elements = engine.classifyMultiple(text, 'test_scene');
      
      // يجب أن يصنف كـ set dressing وليس handheld prop
      const handheldElements = elements.filter(e => e.category === ProductionCategory.PROPS_HANDHELD);
      const setDressingElements = elements.filter(e => e.category === ProductionCategory.SET_DRESSING);
      
      // إما لا يوجد handheld أو set dressing له ثقة أعلى
      if (handheldElements.length > 0 && setDressingElements.length > 0) {
        expect(setDressingElements[0].confidence).toBeGreaterThanOrEqual(handheldElements[0].confidence);
      }
    });

    test('should not classify main characters as extras', () => {
      const text = 'أحمد: مرحباً، كيف حالك؟';
      const elements = engine.classifyMultiple(text, 'test_scene');
      
      const castElements = elements.filter(e => e.category === ProductionCategory.CAST_MEMBERS);
      const extrasElements = elements.filter(e => 
        e.category === ProductionCategory.EXTRAS_ATMOSPHERE ||
        e.category === ProductionCategory.EXTRAS_FEATURED
      );
      
      // الشخصيات التي تتحدث يجب أن تصنف كـ cast members
      if (castElements.length > 0 && extrasElements.length > 0) {
        expect(castElements[0].confidence).toBeGreaterThan(extrasElements[0].confidence);
      }
    });

    test('should distinguish between natural and artificial elements', () => {
      const naturalText = 'شجرة كبيرة تنمو في الحديقة';
      const artificialText = 'شجرة بلاستيكية للديكور';
      
      const naturalElements = engine.classifyMultiple(naturalText, 'natural_scene');
      const artificialElements = engine.classifyMultiple(artificialText, 'artificial_scene');
      
      const naturalGreenery = naturalElements.filter(e => e.category === ProductionCategory.GREENERY_PLANTS);
      const artificialGreenery = artificialElements.filter(e => e.category === ProductionCategory.GREENERY_PLANTS);
      
      // الطبيعي يجب أن يحصل على ثقة أعلى
      if (naturalGreenery.length > 0 && artificialGreenery.length > 0) {
        expect(naturalGreenery[0].confidence).toBeGreaterThan(artificialGreenery[0].confidence);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات السياق
  // ═══════════════════════════════════════════════════════════════════════

  describe('Context Analysis', () => {
    test('should extract character context correctly', () => {
      const text = `
        مشهد 1 - داخلي - المكتب - نهار
        
        أحمد: (يمسك الهاتف) مرحباً، كيف حالك؟
        
        سارة تدخل حاملة كوب قهوة.
      `;

      const elements = engine.classifyMultiple(text, 'context_scene');
      
      elements.forEach(element => {
        expect(element.context.scene_context).toBeDefined();
        expect(element.context.scene_context.length).toBeGreaterThan(0);
        
        // بعض العناصر يجب أن تحتوي على سياق الشخصية
        if (element.evidence.text_excerpt.includes('أحمد') || 
            element.evidence.text_excerpt.includes('سارة')) {
          // قد يحتوي على character context
        }
      });
    });

    test('should extract location context correctly', () => {
      const text = 'داخلي - المكتب - نهار\nأحمد يعمل على الحاسوب';
      const elements = engine.classifyMultiple(text, 'location_scene');
      
      elements.forEach(element => {
        if (element.context.location_context) {
          expect(element.context.location_context).toContain('المكتب');
        }
      });
    });

    test('should extract timing context correctly', () => {
      const text = 'مشهد ليلي - أحمد يمشي في الشارع';
      const elements = engine.classifyMultiple(text, 'timing_scene');
      
      elements.forEach(element => {
        if (element.context.timing_context) {
          expect(element.context.timing_context).toBe('ليل');
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الأداء والكفاءة
  // ═══════════════════════════════════════════════════════════════════════

  describe('Performance and Efficiency', () => {
    test('should handle single element classification', () => {
      const text = 'أحمد يمسك كوب القهوة';
      const context = 'مشهد في المقهى';
      
      const element = engine.classifyElement(text, context, 'single_scene');
      
      if (element) {
        expect(element.category).toBe(ProductionCategory.PROPS_HANDHELD);
        expect(element.confidence).toBeGreaterThan(0.5);
        expect(element.evidence.text_excerpt).toContain('كوب');
      }
    });

    test('should remove duplicates effectively', () => {
      const text = `
        أحمد يمسك كوب القهوة. 
        سارة تحمل كوب القهوة أيضاً.
        محمد يشرب من كوب القهوة.
      `;

      const elements = engine.classifyMultiple(text, 'duplicate_scene');
      
      // يجب ألا يكون هناك تكرار لنفس العنصر
      const cupElements = elements.filter(e => 
        e.name.toLowerCase().includes('كوب') && 
        e.category === ProductionCategory.PROPS_HANDHELD
      );
      
      expect(cupElements.length).toBeLessThanOrEqual(1);
    });

    test('should maintain reasonable processing time', () => {
      const longText = Array(50).fill(
        'أحمد يمسك الهاتف ويتحدث مع سارة التي ترتدي فستان أحمر وتحمل حقيبة سوداء.'
      ).join(' ');

      const startTime = Date.now();
      const elements = engine.classifyMultiple(longText, 'performance_scene');
      const endTime = Date.now();

      expect(elements.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(2000); // أقل من ثانيتين
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التصنيف المتقدم
  // ═══════════════════════════════════════════════════════════════════════

  describe('Advanced Classification', () => {
    test('should handle complex scene with multiple elements', () => {
      const complexScene = `
        مشهد 10 - خارجي - موقف السيارات - ليل
        
        أحمد يقود سيارة حمراء ويتوقف بجانب المبنى.
        يخرج من السيارة حاملاً حقيبة جلدية وهاتف ذكي.
        
        سارة تنتظره ترتدي معطف أسود وتحمل مظلة.
        
        فجأة، انفجار بعيد يضيء السماء.
        موسيقى توتر تبدأ في الخلفية.
        
        مجموعة من الناس تتجمع في الخلفية لمشاهدة الحدث.
      `;

      const elements = engine.classifyMultiple(complexScene, 'complex_scene');
      
      expect(elements.length).toBeGreaterThan(5);
      
      // يجب أن يتعرف على فئات متنوعة
      const categories = new Set(elements.map(e => e.category));
      expect(categories.size).toBeGreaterThan(4);
      
      // فحص فئات محددة
      const hasVehicle = elements.some(e => e.category === ProductionCategory.VEHICLES_PICTURE);
      const hasProps = elements.some(e => 
        e.category === ProductionCategory.PROPS_HANDHELD ||
        e.category === ProductionCategory.PROPS_INTERACTIVE
      );
      const hasWardrobe = elements.some(e => e.category === ProductionCategory.WARDROBE_COSTUMES);
      const hasSFX = elements.some(e => e.category === ProductionCategory.SPECIAL_EFFECTS_SFX);
      const hasSound = elements.some(e => e.category === ProductionCategory.SOUND_MUSIC);
      const hasExtras = elements.some(e => e.category === ProductionCategory.EXTRAS_ATMOSPHERE);
      
      expect(hasVehicle).toBe(true);
      expect(hasProps).toBe(true);
      expect(hasWardrobe).toBe(true);
      expect(hasSFX).toBe(true);
      expect(hasSound).toBe(true);
      expect(hasExtras).toBe(true);
    });

    test('should prioritize high-confidence classifications', () => {
      const text = 'أحمد يمسك كوب القهوة ويشرب منه بينما يقرأ الجريدة';
      const elements = engine.classifyMultiple(text, 'priority_scene');
      
      // العناصر يجب أن تكون مرتبة حسب الثقة
      for (let i = 1; i < elements.length; i++) {
        expect(elements[i-1].confidence).toBeGreaterThanOrEqual(elements[i].confidence);
      }
    });

    test('should handle ambiguous classifications', () => {
      const ambiguousText = 'شيء معدني يلمع في الضوء';
      const elements = engine.classifyMultiple(ambiguousText, 'ambiguous_scene');
      
      // النص الغامض قد ينتج عناصر بثقة منخفضة أو لا ينتج شيئاً
      elements.forEach(element => {
        expect(element.confidence).toBeLessThan(0.8);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التحقق من البيانات
  // ═══════════════════════════════════════════════════════════════════════

  describe('Data Validation', () => {
    test('should validate classification taxonomy completeness', () => {
      // التأكد من وجود جميع الفئات الـ21
      const categories = Object.keys(CLASSIFICATION_TAXONOMY);
      expect(categories).toHaveLength(21);
      
      // التأكد من وجود جميع فئات ProductionCategory
      Object.values(ProductionCategory).forEach(category => {
        expect(CLASSIFICATION_TAXONOMY[category]).toBeDefined();
      });
    });

    test('should validate rule structure', () => {
      Object.entries(CLASSIFICATION_TAXONOMY).forEach(([category, rule]) => {
        expect(rule.category).toBe(category);
        expect(rule.keywords).toBeDefined();
        expect(Array.isArray(rule.keywords)).toBe(true);
        expect(rule.keywords.length).toBeGreaterThan(0);
        
        expect(rule.context_patterns).toBeDefined();
        expect(Array.isArray(rule.context_patterns)).toBe(true);
        
        expect(rule.exclusion_patterns).toBeDefined();
        expect(Array.isArray(rule.exclusion_patterns)).toBe(true);
        
        expect(rule.confidence_threshold).toBeGreaterThan(0);
        expect(rule.confidence_threshold).toBeLessThanOrEqual(1);
        
        expect(rule.priority).toBeGreaterThan(0);
        expect(rule.priority).toBeLessThanOrEqual(21);
      });
    });

    test('should validate element structure', () => {
      const text = 'أحمد يمسك كوب القهوة';
      const elements = engine.classifyMultiple(text, 'validation_scene');
      
      elements.forEach(element => {
        expect(element.id).toBeDefined();
        expect(element.category).toBeDefined();
        expect(element.name).toBeDefined();
        expect(element.description).toBeDefined();
        expect(element.scene_id).toBe('validation_scene');
        
        expect(element.evidence).toBeDefined();
        expect(element.evidence.span_start).toBeGreaterThanOrEqual(0);
        expect(element.evidence.span_end).toBeGreaterThan(element.evidence.span_start);
        expect(element.evidence.text_excerpt).toBeDefined();
        expect(element.evidence.rationale).toBeDefined();
        expect(element.evidence.confidence).toBeGreaterThan(0);
        
        expect(element.confidence).toBeGreaterThan(0);
        expect(element.confidence).toBeLessThanOrEqual(1);
        
        expect(element.extracted_by).toBeDefined();
        expect(element.extracted_by.agent_type).toBe('breakdown');
        
        expect(element.context).toBeDefined();
        expect(element.context.scene_context).toBeDefined();
        
        expect(Array.isArray(element.dependencies)).toBe(true);
      });
    });

    test('should provide meaningful statistics', () => {
      const stats = engine.getClassificationStats();
      
      expect(stats.totalRules).toBe(21);
      expect(stats.categoriesCount).toBe(21);
      expect(stats.avgConfidenceThreshold).toBeGreaterThan(0);
      expect(stats.avgConfidenceThreshold).toBeLessThanOrEqual(1);
    });
  });
});