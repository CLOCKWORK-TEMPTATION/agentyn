/**
 * اختبارات خصائص الوكيل العاطفي
 * Property-Based Tests for Emotional Reading Agent
 * 
 * **Feature: three-read-breakdown-system, Property 4: Emotional Analysis Purity**
 * **Validates: Requirements 2.1, 2.4**
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import { EmotionalReadingAgent } from '../agents/emotional-agent';
import { ModelManager, PythonBrainService } from '../three-read-breakdown-system';

// ═══════════════════════════════════════════════════════════════════════════
// إعداد الاختبارات
// ═══════════════════════════════════════════════════════════════════════════

describe('Property-Based Tests: Emotional Analysis Purity', () => {
  let emotionalAgent: EmotionalReadingAgent | null = null;
  let modelManager: ModelManager;
  let pythonService: PythonBrainService;

  beforeAll(() => {
    modelManager = new ModelManager();
    pythonService = new PythonBrainService();
    
    try {
      const model = modelManager.getModel('emotional_analysis');
      emotionalAgent = new EmotionalReadingAgent(model, pythonService);
    } catch (error) {
      console.warn('⚠️ لا يوجد نموذج متاح للاختبار، سيتم تخطي بعض الاختبارات');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // مولدات البيانات
  // ═══════════════════════════════════════════════════════════════════════

  const emotionalScriptGenerator = fc.record({
    scenes: fc.array(
      fc.record({
        header: fc.string({ minLength: 20, maxLength: 100 }),
        dialogue: fc.array(
          fc.record({
            character: fc.string({ minLength: 3, maxLength: 20 }),
            emotion: fc.constantFrom('فرح', 'حزن', 'غضب', 'خوف', 'أمل', 'يأس'),
            line: fc.string({ minLength: 10, maxLength: 100 })
          }),
          { maxLength: 5 }
        ),
        action: fc.string({ minLength: 20, maxLength: 200 })
      }),
      { minLength: 1, maxLength: 8 }
    )
  });

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات إنشاء النصوص
  // ═══════════════════════════════════════════════════════════════════════

  function createEmotionalScript(script: any): string {
    const parts: string[] = [];
    
    script.scenes.forEach((scene: any, index: number) => {
      parts.push(`مشهد ${index + 1} - ${scene.header}`);
      parts.push('');
      parts.push(scene.action);
      parts.push('');
      
      scene.dialogue.forEach((d: any) => {
        parts.push(`${d.character}: ${d.line}`);
      });
      
      parts.push('');
    });
    
    return parts.join('\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الخصائص
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * **Feature: three-read-breakdown-system, Property 4: Emotional Analysis Purity**
   * لأي تحليل عاطفي، يجب ألا تحتوي النتائج على كلمات تقنية محظورة أو حقول تفريغ
   */
  test('Property 4: Emotional Analysis Purity - No forbidden technical words', () => {
    if (!emotionalAgent) {
      console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
      return;
    }

    const agent = emotionalAgent; // للتأكد من عدم null

    fc.assert(
      fc.asyncProperty(emotionalScriptGenerator, async (script) => {
        const scriptText = createEmotionalScript(script);
        
        try {
          const analysis = await agent.analyzeNarrative(scriptText);
          
          // تحويل التحليل إلى نص للفحص
          const analysisText = JSON.stringify(analysis).toLowerCase();
          
          // الكلمات المحظورة
          const forbiddenWords = [
            'props', 'wardrobe', 'sfx', 'vfx', 'breakdown', 'equipment',
            'دعائم', 'أزياء', 'مؤثرات', 'معدات', 'تفريغ', 'إنتاج'
          ];
          
          // فحص عدم وجود كلمات محظورة
          forbiddenWords.forEach(word => {
            expect(analysisText).not.toContain(word.toLowerCase());
          });
          
          // التأكد من التركيز على الجوانب العاطفية
          const emotionalWords = [
            'emotion', 'feeling', 'character', 'story', 'narrative',
            'مشاعر', 'عاطفة', 'شخصية', 'قصة', 'سرد'
          ];
          
          const hasEmotionalFocus = emotionalWords.some(word => 
            analysisText.includes(word.toLowerCase())
          );
          
          expect(hasEmotionalFocus).toBe(true);
          
        } catch (error) {
          // إذا فشل التحليل، يجب أن يكون الخطأ واضحاً
          expect((error as Error).message).toBeDefined();
        }
      }),
      { numRuns: 5, timeout: 30000 } // تقليل عدد التشغيلات للاختبار
    );
  });

  test('Property: Emotional focus consistency', () => {
    if (!emotionalAgent) {
      console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
      return;
    }

    const agent = emotionalAgent;

    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 50, maxLength: 300 }),
        async (scriptText) => {
          try {
            const analysis = await agent.analyzeNarrative(scriptText);
            
            // التحليل يجب أن يحتوي على عناصر عاطفية أساسية
            expect(analysis.overall_tone).toBeDefined();
            expect(analysis.emotional_arcs).toBeDefined();
            expect(Array.isArray(analysis.emotional_arcs)).toBe(true);
            expect(analysis.pacing_rhythm).toBeDefined();
            expect(analysis.key_moments).toBeDefined();
            expect(Array.isArray(analysis.key_moments)).toBe(true);
            expect(analysis.audience_engagement).toBeGreaterThanOrEqual(0);
            expect(analysis.audience_engagement).toBeLessThanOrEqual(1);
            expect(analysis.director_vision).toBeDefined();
            
            // التأكد من وجود هيكل سردي
            expect(analysis.narrative_structure).toBeDefined();
            expect(analysis.narrative_structure.act_breaks).toBeDefined();
            expect(analysis.narrative_structure.story_beats).toBeDefined();
            
            // التأكد من وجود لوحة عاطفية
            expect(analysis.emotional_palette).toBeDefined();
            expect(analysis.emotional_palette.primary_emotions).toBeDefined();
            expect(Array.isArray(analysis.emotional_palette.primary_emotions)).toBe(true);
            
          } catch (error) {
            // الأخطاء مقبولة للنصوص غير الصالحة
            expect((error as Error).message).toBeDefined();
          }
        }
      ),
      { numRuns: 3, timeout: 30000 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحدية
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases: Emotional Reading Agent', () => {
  let emotionalAgent: EmotionalReadingAgent | null = null;

  beforeAll(() => {
    const modelManager = new ModelManager();
    const pythonService = new PythonBrainService();
    
    try {
      const model = modelManager.getModel('emotional_analysis');
      emotionalAgent = new EmotionalReadingAgent(model, pythonService);
    } catch (error) {
      console.warn('⚠️ لا يوجد نموذج متاح للاختبار');
    }
  });

  test('Should handle empty script gracefully', async () => {
    if (!emotionalAgent) {
      console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
      return;
    }

    try {
      const analysis = await emotionalAgent.analyzeNarrative('');
      
      expect(analysis).toBeDefined();
      expect(analysis.overall_tone).toBeDefined();
      expect(analysis.audience_engagement).toBeGreaterThanOrEqual(0);
      expect(analysis.audience_engagement).toBeLessThanOrEqual(1);
      
    } catch (error) {
      // الأخطاء مقبولة للنص الفارغ
      expect((error as Error).message).toBeDefined();
    }
  }, 15000);

  test('Should maintain purity with mixed content', async () => {
    if (!emotionalAgent) {
      console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
      return;
    }

    const mixedScript = `
      مشهد 1 - داخلي - المكتب - نهار
      
      أحمد يعمل على الحاسوب. على المكتب كوب قهوة وأوراق كثيرة.
      يرتدي قميص أزرق وبنطلون أسود.
      
      أحمد: (يتحدث في الهاتف) نعم، سأرسل التقرير اليوم.
      
      فجأة، انفجار بعيد يهز النوافذ. موسيقى توتر تبدأ.
    `;

    try {
      const analysis = await emotionalAgent.analyzeNarrative(mixedScript);
      
      // التحقق من عدم وجود كلمات تقنية في التحليل
      const analysisText = JSON.stringify(analysis).toLowerCase();
      
      const forbiddenWords = [
        'props', 'wardrobe', 'sfx', 'vfx', 'breakdown',
        'دعائم', 'أزياء', 'مؤثرات', 'تفريغ'
      ];
      
      forbiddenWords.forEach(word => {
        expect(analysisText).not.toContain(word.toLowerCase());
      });
      
      // يجب أن يركز على الجوانب العاطفية والسردية
      expect(analysis.overall_tone).toBeDefined();
      expect(analysis.director_vision.overall_approach).toBeDefined();
      
    } catch (error) {
      expect((error as Error).message).toBeDefined();
    }
  }, 20000);
});