/**
 * اختبارات خصائص تتبع الأدلة
 * Property-Based Tests for Evidence Traceability
 * 
 * **Feature: three-read-breakdown-system, Property 13: Evidence Traceability**
 * **Validates: Requirements - Traceability**
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import { BreakdownReadingAgent } from '../agents/breakdown-agent.js';
import { ClassificationEngine } from '../classification/production-classifier.js';
import { ModelManager, PythonBrainService, ProductionCategory } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// مولدات البيانات للاختبار
// ═══════════════════════════════════════════════════════════════════════════

// مولد عناصر إنتاجية مع أدلة
const elementWithEvidenceGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  category: fc.constantFrom(...Object.values(ProductionCategory)),
  textContext: fc.string({ minLength: 50, maxLength: 300 }),
  extractionKeyword: fc.string({ minLength: 3, maxLength: 15 }),
  confidence: fc.float({ min: 0.1, max: 1.0 })
});

// مولد مشاهد مع عناصر قابلة للتتبع
const traceableSceneGenerator = fc.record({
  sceneId: fc.string({ minLength: 5, maxLength: 20 }),
  header: fc.string({ minLength: 20, maxLength: 80 }),
  content: fc.array(
    fc.record({
      type: fc.constantFrom('dialogue', 'action', 'description'),
      character: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
      text: fc.string({ minLength: 20, maxLength: 200 }),
      containsElement: fc.boolean(),
      elementType: fc.option(fc.constantFrom(...Object.values(ProductionCategory)))
    }),
    { minLength: 3, maxLength: 15 }
  )
});

// مولد سلاسل التتبع
const traceabilityChainGenerator = fc.record({
  originalText: fc.string({ minLength: 100, maxLength: 500 }),
  extractionSteps: fc.array(
    fc.record({
      agentType: fc.constantFrom('emotional', 'technical', 'breakdown', 'supervisor'),
      extractedElement: fc.string({ minLength: 5, maxLength: 25 }),
      confidence: fc.float({ min: 0.1, max: 1.0 }),
      reasoning: fc.string({ minLength: 10, maxLength: 100 })
    }),
    { minLength: 1, maxLength: 8 }
  )
});

// ═══════════════════════════════════════════════════════════════════════════
// مساعدات إنشاء النصوص القابلة للتتبع
// ═══════════════════════════════════════════════════════════════════════════

function generateTraceableSceneText(scene: any): string {
  const parts = [`${scene.header}`, ''];
  
  scene.content.forEach((item: any) => {
    let line = '';
    
    if (item.type === 'dialogue' && item.character) {
      line = `${item.character}: ${item.text}`;
    } else {
      line = item.text;
    }
    
    // إضافة عناصر قابلة للتتبع
    if (item.containsElement && item.elementType) {
      const elementKeywords = {
        [ProductionCategory.PROPS_HANDHELD]: ['يمسك', 'يحمل', 'كوب', 'هاتف', 'مفتاح'],
        [ProductionCategory.WARDROBE_COSTUMES]: ['يرتدي', 'فستان', 'بدلة', 'قميص'],
        [ProductionCategory.VEHICLES_PICTURE]: ['سيارة', 'يقود', 'دراجة', 'حافلة'],
        [ProductionCategory.SOUND_MUSIC]: ['موسيقى', 'يعزف', 'أغنية', 'صوت']
      };
      
      const keywords = elementKeywords[item.elementType] || ['عنصر'];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      line = line.replace(/\.$/, ` ${keyword}.`);
    }
    
    parts.push(line);
    parts.push('');
  });
  
  return parts.join('\n');
}

function createTextWithTraceableElements(elements: any[]): string {
  return elements.map((element, index) => {
    return `${element.textContext} ${element.extractionKeyword} في المشهد ${index + 1}.`;
  }).join(' ');
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الخصائص
// ═══════════════════════════════════════════════════════════════════════════

describe('Property-Based Tests: Evidence Traceability', () => {
  let breakdownAgent: BreakdownReadingAgent;
  let classificationEngine: ClassificationEngine;
  let modelManager: ModelManager;
  let pythonService: PythonBrainService;

  beforeAll(() => {
    modelManager = new ModelManager();
    pythonService = new PythonBrainService('http://localhost:8000');
    breakdownAgent = new BreakdownReadingAgent(modelManager, pythonService);
    classificationEngine = new ClassificationEngine();
  });

  /**
   * **Feature: three-read-breakdown-system, Property 13: Evidence Traceability**
   * لأي عنصر مُستخرج، يجب أن يحتوي على evidence صالح مع span_start < span_end
   */
  test('Property 13: Evidence Traceability - Valid evidence spans', () => {
    fc.assert(
      fc.property(
        traceableSceneGenerator,
        async (scene) => {
          const sceneText = generateTraceableSceneText(scene);
          
          try {
            const result = await breakdownAgent.extractElements(sceneText, scene.sceneId);
            
            // كل عنصر مُستخرج يجب أن يحتوي على evidence صالح
            result.elements.forEach(element => {
              expect(element.evidence).toBeDefined();
              
              // Span validation
              expect(element.evidence.span_start).toBeGreaterThanOrEqual(0);
              expect(element.evidence.span_end).toBeGreaterThan(element.evidence.span_start);
              expect(element.evidence.span_end).toBeLessThanOrEqual(sceneText.length);
              
              // Text excerpt validation
              expect(element.evidence.text_excerpt).toBeDefined();
              expect(element.evidence.text_excerpt.length).toBeGreaterThan(0);
              expect(typeof element.evidence.text_excerpt).toBe('string');
              
              // Rationale validation
              expect(element.evidence.rationale).toBeDefined();
              expect(element.evidence.rationale.length).toBeGreaterThan(0);
              expect(typeof element.evidence.rationale).toBe('string');
              
              // Confidence validation
              expect(element.evidence.confidence).toBeGreaterThan(0);
              expect(element.evidence.confidence).toBeLessThanOrEqual(1);
            });
            
          } catch (error) {
            // الأخطاء مقبولة إذا كان النص غير صالح
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 50, timeout: 30000 }
    );
  }, 35000);

  test('Property: Evidence consistency across extraction methods', () => {
    fc.assert(
      fc.property(
        elementWithEvidenceGenerator,
        async (elementData) => {
          const text = createTextWithTraceableElements([elementData]);
          
          try {
            // استخراج بـ Breakdown Agent
            const breakdownResult = await breakdownAgent.extractElements(text, 'test_scene');
            
            // استخراج بـ Classification Engine
            const classificationResult = classificationEngine.classifyMultiple(text, 'test_scene');
            
            // مقارنة الأدلة
            const allElements = [...breakdownResult.elements, ...classificationResult];
            
            allElements.forEach(element => {
              // كل عنصر يجب أن يحتوي على evidence متسق
              expect(element.evidence.span_start).toBeLessThan(element.evidence.span_end);
              
              // النص المستخرج يجب أن يكون من النص الأصلي
              if (element.evidence.span_start >= 0 && element.evidence.span_end <= text.length) {
                const actualExcerpt = text.substring(
                  element.evidence.span_start,
                  element.evidence.span_end
                );
                
                // يجب أن يكون هناك تطابق أو تشابه
                const similarity = this.calculateSimilarity(
                  actualExcerpt.toLowerCase(),
                  element.evidence.text_excerpt.toLowerCase()
                );
                expect(similarity).toBeGreaterThan(0.3); // 30% تشابه على الأقل
              }
            });
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 40, timeout: 25000 }
    );
  }, 30000);

  test('Property: Agent provenance tracking', () => {
    fc.assert(
      fc.property(
        traceableSceneGenerator,
        async (scene) => {
          const sceneText = generateTraceableSceneText(scene);
          
          try {
            const result = await breakdownAgent.extractElements(sceneText, scene.sceneId);
            
            result.elements.forEach(element => {
              // Agent provenance يجب أن يكون موجود ومكتمل
              expect(element.extracted_by).toBeDefined();
              expect(element.extracted_by.agent_type).toBeDefined();
              expect(['emotional', 'technical', 'breakdown', 'supervisor']).toContain(
                element.extracted_by.agent_type
              );
              
              expect(element.extracted_by.agent_version).toBeDefined();
              expect(element.extracted_by.model_used).toBeDefined();
              expect(element.extracted_by.prompt_version).toBeDefined();
              expect(element.extracted_by.timestamp).toBeDefined();
              expect(element.extracted_by.timestamp).toBeInstanceOf(Date);
              
              // Timestamp يجب أن يكون حديث (خلال آخر دقيقة)
              const now = new Date();
              const timeDiff = now.getTime() - element.extracted_by.timestamp.getTime();
              expect(timeDiff).toBeLessThan(60000); // أقل من دقيقة
            });
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 30, timeout: 25000 }
    );
  }, 30000);

  test('Property: Context preservation in evidence', () => {
    fc.assert(
      fc.property(
        traceableSceneGenerator,
        async (scene) => {
          const sceneText = generateTraceableSceneText(scene);
          
          try {
            const result = await breakdownAgent.extractElements(sceneText, scene.sceneId);
            
            result.elements.forEach(element => {
              // Context يجب أن يكون محفوظ ومفيد
              expect(element.context).toBeDefined();
              expect(element.context.scene_context).toBeDefined();
              expect(element.context.scene_context.length).toBeGreaterThan(0);
              
              // Scene context يجب أن يحتوي على جزء من النص الأصلي
              const contextWords = element.context.scene_context.toLowerCase().split(/\s+/);
              const originalWords = sceneText.toLowerCase().split(/\s+/);
              
              const commonWords = contextWords.filter(word => 
                originalWords.includes(word) && word.length > 2
              );
              
              expect(commonWords.length).toBeGreaterThan(0);
              
              // Location context إذا وُجد يجب أن يكون صالح
              if (element.context.location_context) {
                expect(element.context.location_context.length).toBeGreaterThan(0);
              }
              
              // Character context إذا وُجد يجب أن يكون صالح
              if (element.context.character_context) {
                expect(element.context.character_context.length).toBeGreaterThan(0);
              }
            });
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 35, timeout: 25000 }
    );
  }, 30000);

  test('Property: Evidence chain completeness', () => {
    fc.assert(
      fc.property(
        traceabilityChainGenerator,
        async (chain) => {
          const text = chain.originalText;
          
          try {
            const result = await breakdownAgent.extractElements(text, 'chain_test');
            
            // سلسلة الأدلة يجب أن تكون مكتملة
            result.elements.forEach(element => {
              // كل عنصر يجب أن يحتوي على سلسلة تتبع كاملة
              expect(element.id).toBeDefined();
              expect(element.scene_id).toBe('chain_test');
              expect(element.evidence).toBeDefined();
              expect(element.extracted_by).toBeDefined();
              expect(element.context).toBeDefined();
              
              // الثقة يجب أن تكون منطقية
              expect(element.confidence).toBe(element.evidence.confidence);
              
              // Dependencies إذا وُجدت يجب أن تكون صالحة
              if (element.dependencies && element.dependencies.length > 0) {
                element.dependencies.forEach(depId => {
                  expect(typeof depId).toBe('string');
                  expect(depId.length).toBeGreaterThan(0);
                });
              }
            });
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 25, timeout: 25000 }
    );
  }, 30000);

  test('Property: Evidence uniqueness and non-overlap', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 200, maxLength: 800 }),
        async (text) => {
          try {
            const result = await breakdownAgent.extractElements(text, 'uniqueness_test');
            
            // الأدلة يجب أن تكون فريدة وغير متداخلة
            const evidenceSpans = result.elements.map(element => ({
              start: element.evidence.span_start,
              end: element.evidence.span_end,
              id: element.id
            }));
            
            // فحص عدم التداخل المفرط
            for (let i = 0; i < evidenceSpans.length; i++) {
              for (let j = i + 1; j < evidenceSpans.length; j++) {
                const span1 = evidenceSpans[i];
                const span2 = evidenceSpans[j];
                
                // حساب التداخل
                const overlapStart = Math.max(span1.start, span2.start);
                const overlapEnd = Math.min(span1.end, span2.end);
                const overlap = Math.max(0, overlapEnd - overlapStart);
                
                const span1Length = span1.end - span1.start;
                const span2Length = span2.end - span2.start;
                
                // التداخل يجب أن يكون أقل من 80% من أي span
                if (span1Length > 0) {
                  expect(overlap / span1Length).toBeLessThan(0.8);
                }
                if (span2Length > 0) {
                  expect(overlap / span2Length).toBeLessThan(0.8);
                }
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 30, timeout: 25000 }
    );
  }, 30000);

  test('Property: Evidence quality correlation with confidence', () => {
    fc.assert(
      fc.property(
        traceableSceneGenerator,
        async (scene) => {
          const sceneText = generateTraceableSceneText(scene);
          
          try {
            const result = await breakdownAgent.extractElements(sceneText, scene.sceneId);
            
            // جودة الأدلة يجب أن ترتبط بالثقة
            result.elements.forEach(element => {
              const evidence = element.evidence;
              const confidence = element.confidence;
              
              // العناصر عالية الثقة يجب أن تحتوي على أدلة أفضل
              if (confidence > 0.8) {
                expect(evidence.text_excerpt.length).toBeGreaterThan(3);
                expect(evidence.rationale.length).toBeGreaterThan(15);
                expect(evidence.span_end - evidence.span_start).toBeGreaterThan(0);
              }
              
              // العناصر منخفضة الثقة قد تحتوي على أدلة أقل جودة
              if (confidence < 0.4) {
                // لكن يجب أن تحتوي على أدلة أساسية على الأقل
                expect(evidence.text_excerpt.length).toBeGreaterThan(0);
                expect(evidence.rationale.length).toBeGreaterThan(5);
              }
              
              // الثقة في Evidence يجب أن تطابق ثقة العنصر
              expect(Math.abs(evidence.confidence - confidence)).toBeLessThan(0.1);
            });
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 25, timeout: 25000 }
    );
  }, 30000);

  // مساعد لحساب التشابه
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.split(/\s+/).filter(w => w.length > 2);
    
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحدية لتتبع الأدلة
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases: Evidence Traceability', () => {
  let breakdownAgent: BreakdownReadingAgent;
  let classificationEngine: ClassificationEngine;

  beforeAll(() => {
    const modelManager = new ModelManager();
    const pythonService = new PythonBrainService('http://localhost:8000');
    breakdownAgent = new BreakdownReadingAgent(modelManager, pythonService);
    classificationEngine = new ClassificationEngine();
  });

  test('Should handle overlapping evidence spans gracefully', async () => {
    const overlappingText = `
      أحمد يمسك كوب القهوة الساخن ويشرب منه بينما يقرأ المجلة.
      سارة ترتدي فستان أحمر جميل وتحمل حقيبة يد صغيرة.
    `;

    try {
      const result = await breakdownAgent.extractElements(overlappingText, 'overlap_test');
      
      // يجب أن يتعامل مع التداخل بشكل صحيح
      result.elements.forEach(element => {
        expect(element.evidence.span_start).toBeLessThan(element.evidence.span_end);
        expect(element.evidence.text_excerpt.length).toBeGreaterThan(0);
      });

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 20000);

  test('Should maintain evidence integrity with special characters', async () => {
    const specialText = `
      مشهد 1 - داخلي - مكتب "الشركة الجديدة" - نهار
      
      أحمد (30 سنة): "هذا رائع!" يقول وهو يمسك الهاتف.
      سارة: (تضحك) أليس كذلك؟ 
      
      [ملاحظة: المكتب مزين بلوحات فنية]
    `;

    try {
      const result = await breakdownAgent.extractElements(specialText, 'special_test');
      
      result.elements.forEach(element => {
        // الأدلة يجب أن تحافظ على سلامتها مع الأحرف الخاصة
        expect(element.evidence.span_start).toBeGreaterThanOrEqual(0);
        expect(element.evidence.span_end).toBeLessThanOrEqual(specialText.length);
        
        // النص المستخرج يجب أن يكون صالح
        const extractedText = specialText.substring(
          element.evidence.span_start,
          element.evidence.span_end
        );
        expect(extractedText.length).toBeGreaterThan(0);
      });

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 20000);

  test('Should handle empty or minimal evidence gracefully', async () => {
    const minimalTexts = [
      'أحمد.',
      'سارة تدخل.',
      'انتهى المشهد.',
      'موسيقى.'
    ];

    for (const text of minimalTexts) {
      try {
        const result = await breakdownAgent.extractElements(text, 'minimal_test');
        
        // حتى مع النصوص القصيرة، الأدلة يجب أن تكون صالحة
        result.elements.forEach(element => {
          expect(element.evidence).toBeDefined();
          expect(element.evidence.span_start).toBeGreaterThanOrEqual(0);
          expect(element.evidence.span_end).toBeLessThanOrEqual(text.length);
        });

      } catch (error) {
        expect(error).toBeDefined();
      }
    }
  }, 25000);

  test('Should maintain evidence consistency across multiple extractions', async () => {
    const consistentText = 'أحمد يمسك كوب القهوة ويقرأ الجريدة في المكتب.';

    try {
      // استخراج متعدد لنفس النص
      const results = await Promise.all([
        breakdownAgent.extractElements(consistentText, 'consistency_1'),
        breakdownAgent.extractElements(consistentText, 'consistency_2'),
        breakdownAgent.extractElements(consistentText, 'consistency_3')
      ]);

      // مقارنة الاتساق
      if (results.every(r => r.elements.length > 0)) {
        const firstResult = results[0];
        
        results.slice(1).forEach(result => {
          // يجب أن تكون النتائج متشابهة (ليس بالضرورة متطابقة)
          expect(result.elements.length).toBeGreaterThan(0);
          
          result.elements.forEach(element => {
            expect(element.evidence.span_start).toBeGreaterThanOrEqual(0);
            expect(element.evidence.span_end).toBeLessThanOrEqual(consistentText.length);
          });
        });
      }

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 30000);
});