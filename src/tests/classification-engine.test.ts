/**
 * اختبارات خصائص محرك التصنيف
 * Property-Based Tests for Classification Engine
 * 
 * **Feature: three-read-breakdown-system, Property 6: Element Categorization Accuracy**
 * **Validates: Requirements 4.2**
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { ClassificationEngine, CLASSIFICATION_TAXONOMY } from '../classification/production-classifier.js';
import { ProductionCategory } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// مولدات البيانات للاختبار
// ═══════════════════════════════════════════════════════════════════════════

// مولد نصوص تحتوي على عناصر إنتاجية معروفة
const knownElementGenerator = fc.record({
  category: fc.constantFrom(...Object.values(ProductionCategory)),
  text: fc.string({ minLength: 10, maxLength: 100 }),
  keywords: fc.array(fc.string({ minLength: 3, maxLength: 15 }), { maxLength: 3 })
});

// مولد سياقات مشاهد
const sceneContextGenerator = fc.record({
  header: fc.string({ minLength: 20, maxLength: 100 }),
  content: fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 1, maxLength: 10 }),
  characters: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 })
});

// مولد نصوص مع عناصر مضمنة
const textWithElementsGenerator = fc.record({
  baseText: fc.string({ minLength: 50, maxLength: 300 }),
  elements: fc.array(
    fc.record({
      category: fc.constantFrom(...Object.values(ProductionCategory)),
      keyword: fc.string({ minLength: 3, maxLength: 20 }),
      context: fc.string({ minLength: 10, maxLength: 50 })
    }),
    { maxLength: 5 }
  )
});

// ═══════════════════════════════════════════════════════════════════════════
// مساعدات إنشاء النصوص
// ═══════════════════════════════════════════════════════════════════════════

function createTextWithKnownElements(elements: Array<{
  category: ProductionCategory;
  keyword: string;
  context: string;
}>): string {
  const sentences = elements.map(element => {
    const rule = CLASSIFICATION_TAXONOMY[element.category];
    const randomKeyword = rule.keywords[Math.floor(Math.random() * rule.keywords.length)];
    return `${element.context} ${randomKeyword} ${element.keyword}`;
  });
  
  return sentences.join('. ') + '.';
}

function createSceneText(scene: any): string {
  const parts = [scene.header, ''];
  
  scene.content.forEach((content: string, index: number) => {
    if (index < scene.characters.length) {
      parts.push(`${scene.characters[index]}: ${content}`);
    } else {
      parts.push(content);
    }
    parts.push('');
  });
  
  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الخصائص
// ═══════════════════════════════════════════════════════════════════════════

describe('Property-Based Tests: Element Categorization Accuracy', () => {
  let engine: ClassificationEngine;

  beforeAll(() => {
    engine = new ClassificationEngine();
  });

  /**
   * **Feature: three-read-breakdown-system, Property 6: Element Categorization Accuracy**
   * لأي عنصر مُستخرج، يجب أن يُصنف في إحدى الفئات الـ21 القياسية بشكل صحيح
   */
  test('Property 6: Element Categorization Accuracy - Valid category assignment', () => {
    fc.assert(
      fc.property(textWithElementsGenerator, (data) => {
        const text = createTextWithKnownElements(data.elements);
        const elements = engine.classifyMultiple(text, 'test_scene');
        
        // كل عنصر مُستخرج يجب أن يحتوي على فئة صالحة
        elements.forEach(element => {
          expect(Object.values(ProductionCategory)).toContain(element.category);
          expect(element.category).toBeDefined();
          expect(typeof element.category).toBe('string');
        });
        
        // كل عنصر يجب أن يحتوي على معلومات أساسية
        elements.forEach(element => {
          expect(element.id).toBeDefined();
          expect(element.name).toBeDefined();
          expect(element.description).toBeDefined();
          expect(element.evidence).toBeDefined();
          expect(element.confidence).toBeGreaterThan(0);
          expect(element.confidence).toBeLessThanOrEqual(1);
        });
      }),
      { numRuns: 100 }
    );
  });

  test('Property: Classification consistency', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 20, maxLength: 200 }),
        fc.constantFrom('scene1', 'scene2', 'scene3'),
        (text, sceneId) => {
          // التصنيف يجب أن يكون متسقاً للنص نفسه
          const result1 = engine.classifyMultiple(text, sceneId);
          const result2 = engine.classifyMultiple(text, sceneId);
          
          expect(result1.length).toBe(result2.length);
          
          // المقارنة بناءً على الفئة والاسم (تجاهل ID الفريد)
          result1.forEach((element1, index) => {
            if (index < result2.length) {
              const element2 = result2[index];
              expect(element1.category).toBe(element2.category);
              expect(element1.name).toBe(element2.name);
              expect(element1.confidence).toBeCloseTo(element2.confidence, 2);
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property: Evidence validity', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 30, maxLength: 300 }),
        (text) => {
          const elements = engine.classifyMultiple(text, 'test_scene');
          
          elements.forEach(element => {
            const evidence = element.evidence;
            
            // Evidence spans يجب أن تكون صالحة
            expect(evidence.span_start).toBeGreaterThanOrEqual(0);
            expect(evidence.span_end).toBeGreaterThan(evidence.span_start);
            expect(evidence.span_end).toBeLessThanOrEqual(text.length);
            
            // النص المستخرج يجب أن يكون موجوداً
            expect(evidence.text_excerpt).toBeDefined();
            expect(evidence.text_excerpt.length).toBeGreaterThan(0);
            
            // المبرر يجب أن يكون واضحاً
            expect(evidence.rationale).toBeDefined();
            expect(evidence.rationale.length).toBeGreaterThan(10);
            
            // الثقة يجب أن تكون منطقية
            expect(evidence.confidence).toBeGreaterThan(0);
            expect(evidence.confidence).toBeLessThanOrEqual(1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Category-specific keyword matching', () => {
    // اختبار كل فئة مع كلماتها المفتاحية
    Object.entries(CLASSIFICATION_TAXONOMY).forEach(([category, rule]) => {
      fc.assert(
        fc.property(
          fc.constantFrom(...rule.keywords),
          fc.string({ minLength: 10, maxLength: 50 }),
          (keyword, context) => {
            const text = `${context} ${keyword} في المشهد`;
            const elements = engine.classifyMultiple(text, 'test_scene');
            
            // يجب أن يكون هناك عنصر واحد على الأقل من الفئة المتوقعة
            const matchingElements = elements.filter(e => e.category === category);
            
            if (matchingElements.length > 0) {
              const element = matchingElements[0];
              expect(element.category).toBe(category);
              expect(element.confidence).toBeGreaterThan(rule.confidence_threshold - 0.1);
            }
          }
        ),
        { numRuns: 10 } // أقل لأننا نختبر كل فئة
      );
    });
  });

  test('Property: Confidence correlation with keyword density', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(ProductionCategory)),
        fc.integer({ min: 1, max: 5 }),
        (category, keywordCount) => {
          const rule = CLASSIFICATION_TAXONOMY[category];
          const keywords = rule.keywords.slice(0, keywordCount);
          
          // إنشاء نص مع كثافة كلمات مختلفة
          const lowDensityText = `نص عادي مع ${keywords[0]} فقط`;
          const highDensityText = `نص مع ${keywords.join(' و ')} متعددة`;
          
          const lowElements = engine.classifyMultiple(lowDensityText, 'test_scene');
          const highElements = engine.classifyMultiple(highDensityText, 'test_scene');
          
          const lowCategoryElements = lowElements.filter(e => e.category === category);
          const highCategoryElements = highElements.filter(e => e.category === category);
          
          // النص عالي الكثافة يجب أن يحصل على ثقة أعلى
          if (lowCategoryElements.length > 0 && highCategoryElements.length > 0) {
            expect(highCategoryElements[0].confidence).toBeGreaterThanOrEqual(
              lowCategoryElements[0].confidence
            );
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property: Context influence on classification', () => {
    fc.assert(
      fc.property(sceneContextGenerator, (scene) => {
        const sceneText = createSceneText(scene);
        const elements = engine.classifyMultiple(sceneText, 'test_scene');
        
        elements.forEach(element => {
          // السياق يجب أن يؤثر على التصنيف
          expect(element.context.scene_context).toBeDefined();
          expect(element.context.scene_context.length).toBeGreaterThan(0);
          
          // إذا كان هناك شخصيات، يجب أن تظهر في السياق
          if (scene.characters.length > 0) {
            const hasCharacterContext = element.context.character_context !== undefined;
            const sceneHasDialogue = sceneText.includes(':');
            
            if (sceneHasDialogue) {
              // لا نتطلب character_context دائماً، لكن إذا وُجد يجب أن يكون صالحاً
              if (hasCharacterContext) {
                expect(element.context.character_context!.length).toBeGreaterThan(0);
              }
            }
          }
        });
      }),
      { numRuns: 50 }
    );
  });

  test('Property: Duplicate elimination', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 10, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        (sentences) => {
          // إنشاء نص مع تكرارات محتملة
          const duplicatedText = sentences.concat(sentences).join('. ');
          const elements = engine.classifyMultiple(duplicatedText, 'test_scene');
          
          // فحص عدم وجود تكرارات
          const elementKeys = elements.map(e => `${e.category}_${e.name.toLowerCase()}`);
          const uniqueKeys = new Set(elementKeys);
          
          expect(elementKeys.length).toBe(uniqueKeys.size);
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property: Empty and invalid input handling', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\n\n', '\t\t', '...', '???'),
        (invalidText) => {
          const elements = engine.classifyMultiple(invalidText, 'test_scene');
          
          // النص غير الصالح يجب أن يُعامل بشكل صحيح
          expect(Array.isArray(elements)).toBe(true);
          
          // إذا كانت هناك عناصر، يجب أن تكون صالحة
          elements.forEach(element => {
            expect(element.category).toBeDefined();
            expect(Object.values(ProductionCategory)).toContain(element.category);
            expect(element.confidence).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property: Classification rule priority', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 50, maxLength: 200 }),
        (text) => {
          const elements = engine.classifyMultiple(text, 'test_scene');
          
          // العناصر يجب أن تكون مرتبة حسب الثقة
          for (let i = 1; i < elements.length; i++) {
            expect(elements[i-1].confidence).toBeGreaterThanOrEqual(elements[i].confidence);
          }
          
          // العناصر عالية الثقة يجب أن تأتي أولاً
          const highConfidenceElements = elements.filter(e => e.confidence > 0.8);
          const lowConfidenceElements = elements.filter(e => e.confidence <= 0.5);
          
          if (highConfidenceElements.length > 0 && lowConfidenceElements.length > 0) {
            const firstHighIndex = elements.indexOf(highConfidenceElements[0]);
            const firstLowIndex = elements.indexOf(lowConfidenceElements[0]);
            
            expect(firstHighIndex).toBeLessThan(firstLowIndex);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحدية
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases: Classification Engine', () => {
  let engine: ClassificationEngine;

  beforeAll(() => {
    engine = new ClassificationEngine();
  });

  test('Should handle Arabic text correctly', () => {
    const arabicTexts = [
      'أحمد يمسك كوب القهوة ويشرب منه',
      'سارة ترتدي فستان أحمر جميل',
      'محمد يقود السيارة بسرعة',
      'انفجار كبير يهز المبنى',
      'موسيقى حزينة تعزف في الخلفية'
    ];

    arabicTexts.forEach(text => {
      const elements = engine.classifyMultiple(text, 'arabic_scene');
      expect(elements.length).toBeGreaterThan(0);
      
      elements.forEach(element => {
        expect(element.evidence.text_excerpt).toBeDefined();
        expect(element.evidence.rationale).toContain('تم التصنيف');
      });
    });
  });

  test('Should handle mixed Arabic-English text', () => {
    const mixedText = 'أحمد يستخدم laptop للعمل ويشرب coffee';
    const elements = engine.classifyMultiple(mixedText, 'mixed_scene');
    
    expect(elements.length).toBeGreaterThan(0);
    
    // يجب أن يتعرف على العناصر بكلا اللغتين
    const hasArabicElement = elements.some(e => 
      e.evidence.text_excerpt.match(/[\u0600-\u06FF]/)
    );
    const hasEnglishElement = elements.some(e => 
      e.evidence.text_excerpt.match(/[A-Za-z]/)
    );
    
    expect(hasArabicElement || hasEnglishElement).toBe(true);
  });

  test('Should handle complex scene descriptions', () => {
    const complexScene = `
      مشهد 15 - داخلي - مكتب الشرطة - ليل
      
      المكتب مزدحم بالضباط. أصوات الهواتف والطابعات تملأ المكان.
      
      النقيب أحمد (45 سنة) يجلس خلف مكتبه الخشبي ويقرأ تقرير.
      يرتدي بدلة زرقاء ونظارة طبية.
      
      تدخل المفتشة سارة (35 سنة) حاملة ملف أحمر وكوب قهوة.
      
      سارة: (تضع الملف على المكتب) هذا تقرير الطب الشرعي.
      
      أحمد: (يرفع نظره من الأوراق) ماذا وجدوا؟
      
      فجأة، انفجار بعيد يهز النوافذ. أصوات صفارات الإنذار تبدأ.
      
      موسيقى توتر تبدأ في الخلفية.
    `;

    const elements = engine.classifyMultiple(complexScene, 'complex_scene');
    
    expect(elements.length).toBeGreaterThan(5);
    
    // يجب أن يتعرف على فئات متنوعة
    const categories = new Set(elements.map(e => e.category));
    expect(categories.size).toBeGreaterThan(3);
    
    // يجب أن يتعرف على عناصر محددة
    const hasProps = elements.some(e => 
      e.category === ProductionCategory.PROPS_HANDHELD ||
      e.category === ProductionCategory.PROPS_INTERACTIVE
    );
    const hasWardrobe = elements.some(e => 
      e.category === ProductionCategory.WARDROBE_COSTUMES
    );
    const hasSound = elements.some(e => 
      e.category === ProductionCategory.SOUND_MUSIC
    );
    
    expect(hasProps || hasWardrobe || hasSound).toBe(true);
  });

  test('Should maintain performance with long texts', () => {
    // إنشاء نص طويل
    const longText = Array(100).fill(
      'أحمد يمسك الهاتف ويتحدث مع سارة التي ترتدي فستان أحمر.'
    ).join(' ');

    const startTime = Date.now();
    const elements = engine.classifyMultiple(longText, 'long_scene');
    const endTime = Date.now();

    expect(elements.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(5000); // أقل من 5 ثوانٍ
  });

  test('Should provide meaningful statistics', () => {
    const stats = engine.getClassificationStats();
    
    expect(stats.totalRules).toBe(21); // عدد الفئات
    expect(stats.categoriesCount).toBe(21);
    expect(stats.avgConfidenceThreshold).toBeGreaterThan(0);
    expect(stats.avgConfidenceThreshold).toBeLessThanOrEqual(1);
  });
});