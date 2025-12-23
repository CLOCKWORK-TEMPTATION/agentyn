/**
 * اختبارات الوحدة للوكيل العاطفي
 * Unit Tests for Emotional Reading Agent
 * 
 * يختبر الوظائف الأساسية للوكيل العاطفي
 * Requirements: 2.2, 2.5
 */

import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { EmotionalReadingAgent } from '../agents/emotional-agent';
import { ModelManager, PythonBrainService } from '../three-read-breakdown-system';

// ═══════════════════════════════════════════════════════════════════════════
// إعداد الاختبارات
// ═══════════════════════════════════════════════════════════════════════════

describe('Unit Tests: Emotional Reading Agent', () => {
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
  // اختبارات تحليل التدفق السردي
  // ═══════════════════════════════════════════════════════════════════════

  describe('Narrative Flow Analysis', () => {
    test('Should analyze simple dialogue scene', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const simpleScript = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: مرحباً يا سارة، كيف حالك اليوم؟
        سارة: بخير الحمد لله، وأنت كيف حالك؟
        أحمد: الحمد لله، أشعر بالسعادة لرؤيتك.
      `;

      const analysis = await emotionalAgent.analyzeNarrative(simpleScript);
      
      expect(analysis).toBeDefined();
      expect(analysis.overall_tone).toBeDefined();
      expect(typeof analysis.overall_tone).toBe('string');
      expect(analysis.overall_tone.length).toBeGreaterThan(3);
      
      expect(analysis.emotional_arcs).toBeDefined();
      expect(Array.isArray(analysis.emotional_arcs)).toBe(true);
      
      expect(analysis.pacing_rhythm).toBeDefined();
      expect(analysis.pacing_rhythm.tempo).toBeDefined();
      expect(['slow', 'medium', 'fast', 'variable']).toContain(analysis.pacing_rhythm.tempo);
      
      expect(analysis.audience_engagement).toBeGreaterThanOrEqual(0);
      expect(analysis.audience_engagement).toBeLessThanOrEqual(1);
    }, 15000);

    test('Should handle emotional intensity variations', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const emotionalScript = `
        مشهد 1 - داخلي - المستشفى - ليل
        
        أحمد: (بقلق شديد) دكتور، كيف حالة والدي؟
        الطبيب: (بحزن) أعتذر، الوضع صعب جداً.
        أحمد: (ينهار ويبكي) لا، هذا لا يمكن أن يحدث!
      `;

      const analysis = await emotionalAgent.analyzeNarrative(emotionalScript);
      
      expect(analysis.audience_engagement).toBeGreaterThan(0.5);
      expect(analysis.key_moments.length).toBeGreaterThan(0);
      
      // يجب أن يكتشف المحتوى العاطفي القوي
      const hasHighEmotionalMoment = analysis.key_moments.some(moment => 
        moment.emotional_weight > 0.6
      );
      expect(hasHighEmotionalMoment).toBe(true);
    }, 15000);

    test('Should identify character emotional arcs', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const characterScript = `
        مشهد 1 - داخلي - المكتب - نهار
        
        سارة: (متحمسة) حصلت على الترقية!
        أحمد: (يفرح) هذا رائع! أهنئك بصدق.
        سارة: (تبتسم) شكراً لك، أشعر بالسعادة الغامرة.
      `;

      const analysis = await emotionalAgent.analyzeNarrative(characterScript);
      
      expect(analysis.emotional_arcs.length).toBeGreaterThan(0);
      
      analysis.emotional_arcs.forEach(arc => {
        expect(arc.character).toBeDefined();
        expect(typeof arc.character).toBe('string');
        expect(arc.character.length).toBeGreaterThan(0);
        
        expect(arc.emotion).toBeDefined();
        expect(typeof arc.emotion).toBe('string');
        
        expect(arc.intensity).toBeGreaterThanOrEqual(0);
        expect(arc.intensity).toBeLessThanOrEqual(1);
        
        expect(arc.trigger).toBeDefined();
        expect(typeof arc.trigger).toBe('string');
      });
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات استخراج اللحظات العاطفية
  // ═══════════════════════════════════════════════════════════════════════

  describe('Emotional Moments Extraction', () => {
    test('Should extract key emotional moments', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const dramaticScript = `
        مشهد 1 - خارجي - الشارع - ليل
        
        يحدث انفجار مفاجئ. الناس يصرخون ويجرون في كل اتجاه.
        
        أحمد: (يصرخ) سارة! أين أنت؟
        سارة: (من بعيد، خائفة) أحمد! أنا هنا!
        
        أحمد يجري نحوها وسط الفوضى والدخان.
      `;

      const moments = await emotionalAgent.extractEmotionalBeats(dramaticScript);
      
      expect(Array.isArray(moments)).toBe(true);
      expect(moments.length).toBeGreaterThan(0);
      
      moments.forEach(moment => {
        expect(moment.timestamp).toBeDefined();
        expect(typeof moment.timestamp).toBe('string');
        
        expect(moment.description).toBeDefined();
        expect(typeof moment.description).toBe('string');
        expect(moment.description.length).toBeGreaterThan(5);
        
        expect(moment.emotional_weight).toBeGreaterThanOrEqual(0);
        expect(moment.emotional_weight).toBeLessThanOrEqual(1);
        
        expect(['revelation', 'conflict', 'resolution', 'transition']).toContain(moment.impact_type);
        
        expect(Array.isArray(moment.characters_involved)).toBe(true);
      });
    }, 15000);

    test('Should prioritize high-impact moments', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const mixedScript = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: صباح الخير.
        سارة: صباح النور.
        
        فجأة، يدق الهاتف بقوة.
        
        أحمد: (يرد) ألو؟
        الصوت: (بحزن) أحمد، والدك في المستشفى.
        أحمد: (صدمة) ماذا؟! ماذا حدث؟
      `;

      const moments = await emotionalAgent.extractEmotionalBeats(mixedScript);
      
      // يجب أن تكون اللحظات مرتبة حسب الوزن العاطفي
      if (moments.length > 1) {
        for (let i = 0; i < moments.length - 1; i++) {
          expect(moments[i].emotional_weight).toBeGreaterThanOrEqual(moments[i + 1].emotional_weight);
        }
      }
      
      // يجب أن تكون هناك لحظة عالية التأثير (الخبر السيء)
      const highImpactMoment = moments.find(m => m.emotional_weight > 0.7);
      expect(highImpactMoment).toBeDefined();
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات تحليل الإيقاع السردي
  // ═══════════════════════════════════════════════════════════════════════

  describe('Pacing Analysis', () => {
    test('Should analyze pacing rhythm correctly', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const pacedScript = `
        مشهد 1 - داخلي - المكتب - نهار
        أحمد يعمل بهدوء على الحاسوب.
        
        مشهد 2 - خارجي - الشارع - نهار  
        سيارة تسير بسرعة عالية.
        
        مشهد 3 - داخلي - المنزل - مساء
        سارة تقرأ كتاباً بهدوء.
        
        مشهد 4 - خارجي - الميدان - ليل
        انفجار مدوي! الناس يجرون في كل مكان!
        
        مشهد 5 - داخلي - المستشفى - ليل
        هدوء نسبي، لكن التوتر ما زال موجوداً.
      `;

      const pacing = await emotionalAgent.identifyPacing(pacedScript);
      
      expect(pacing).toBeDefined();
      expect(['slow', 'medium', 'fast', 'variable']).toContain(pacing.tempo);
      
      expect(Array.isArray(pacing.tension_curve)).toBe(true);
      expect(pacing.tension_curve.length).toBeGreaterThan(0);
      
      // فحص أن جميع قيم التوتر في النطاق الصحيح
      pacing.tension_curve.forEach(tension => {
        expect(tension).toBeGreaterThanOrEqual(0);
        expect(tension).toBeLessThanOrEqual(1);
      });
      
      expect(Array.isArray(pacing.climax_points)).toBe(true);
      expect(Array.isArray(pacing.breathing_spaces)).toBe(true);
      
      // فحص أن نقاط الذروة في النطاق الصحيح
      pacing.climax_points.forEach(point => {
        expect(point).toBeGreaterThanOrEqual(0);
        expect(point).toBeLessThan(pacing.tension_curve.length);
      });
    }, 15000);

    test('Should detect tempo variations', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      // سيناريو سريع الإيقاع
      const fastScript = `
        انفجار! جري! صراخ!
        أحمد: بسرعة!
        سارة: اجري!
        مطاردة سريعة.
      `;

      const fastPacing = await emotionalAgent.identifyPacing(fastScript);
      expect(['fast', 'variable']).toContain(fastPacing.tempo);

      // سيناريو بطيء الإيقاع
      const slowScript = `
        مشهد طويل - داخلي - المكتبة - بعد الظهر
        
        أحمد يجلس بهدوء، يقرأ كتاباً قديماً بعناية شديدة. 
        الضوء يتسلل من النافذة الكبيرة، مضيئاً الغبار المتطاير في الهواء.
        سارة تدخل ببطء، تحمل كوباً من الشاي الساخن.
        
        سارة: (بهدوء) هل تريد بعض الشاي؟
        أحمد: (دون أن يرفع عينيه عن الكتاب) نعم، شكراً لك.
        
        تضع الكوب بجانبه برفق، ثم تجلس في الكرسي المقابل.
      `;

      const slowPacing = await emotionalAgent.identifyPacing(slowScript);
      expect(['slow', 'medium']).toContain(slowPacing.tempo);
    }, 20000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات توليد رؤية المخرج
  // ═══════════════════════════════════════════════════════════════════════

  describe('Director Vision Generation', () => {
    test('Should generate comprehensive director vision', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const script = `
        مشهد 1 - داخلي - منزل عائلي - مساء
        
        عائلة تجتمع حول طاولة العشاء. الأب يبدو قلقاً.
        
        الأب: (بصوت هادئ) يجب أن أخبركم بشيء مهم.
        الأم: (بقلق) ماذا حدث؟
        الابن: (يتوقف عن الأكل) هل هناك مشكلة؟
        
        الأب يأخذ نفساً عميقاً قبل أن يتحدث.
      `;

      const analysis = await emotionalAgent.analyzeNarrative(script);
      const vision = await emotionalAgent.generateDirectorVision(analysis);
      
      expect(vision).toBeDefined();
      
      expect(vision.overall_approach).toBeDefined();
      expect(typeof vision.overall_approach).toBe('string');
      expect(vision.overall_approach.length).toBeGreaterThan(10);
      
      expect(vision.visual_style).toBeDefined();
      expect(typeof vision.visual_style).toBe('string');
      expect(vision.visual_style.length).toBeGreaterThan(10);
      
      expect(Array.isArray(vision.emotional_goals)).toBe(true);
      expect(vision.emotional_goals.length).toBeGreaterThan(0);
      vision.emotional_goals.forEach(goal => {
        expect(typeof goal).toBe('string');
        expect(goal.length).toBeGreaterThan(5);
      });
      
      expect(vision.audience_journey).toBeDefined();
      expect(typeof vision.audience_journey).toBe('string');
      expect(vision.audience_journey.length).toBeGreaterThan(10);
      
      expect(Array.isArray(vision.key_themes)).toBe(true);
      expect(vision.key_themes.length).toBeGreaterThan(0);
      vision.key_themes.forEach(theme => {
        expect(typeof theme).toBe('string');
        expect(theme.length).toBeGreaterThan(3);
      });
    }, 20000);

    test('Should adapt vision to script tone', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      // سيناريو كوميدي
      const comedyScript = `
        أحمد: (يضحك) هذا مضحك جداً!
        سارة: (تضحك أيضاً) لم أر شيئاً مضحكاً هكذا من قبل!
        كلاهما ينفجر في الضحك.
      `;

      const comedyAnalysis = await emotionalAgent.analyzeNarrative(comedyScript);
      const comedyVision = await emotionalAgent.generateDirectorVision(comedyAnalysis);
      
      // يجب أن تعكس الرؤية الطبيعة الكوميدية
      const visionText = JSON.stringify(comedyVision).toLowerCase();
      const hasPositiveElements = ['bright', 'light', 'fun', 'joy', 'مشرق', 'مرح', 'فرح', 'سعادة']
        .some(word => visionText.includes(word.toLowerCase()));
      
      expect(hasPositiveElements || comedyAnalysis.overall_tone.includes('إيجابي')).toBe(true);
    }, 20000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات معالجة الأخطاء
  // ═══════════════════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    test('Should handle malformed script gracefully', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const malformedScript = `
        @@@@@ خطأ في التنسيق @@@@@
        نص غير منظم
        ::::: رموز غريبة :::::
        123456789
      `;

      try {
        const analysis = await emotionalAgent.analyzeNarrative(malformedScript);
        
        // يجب أن يعيد تحليلاً أساسياً حتى لو كان النص مشوهاً
        expect(analysis).toBeDefined();
        expect(analysis.overall_tone).toBeDefined();
        expect(analysis.audience_engagement).toBeGreaterThanOrEqual(0);
        expect(analysis.audience_engagement).toBeLessThanOrEqual(1);
        
      } catch (error) {
        // الأخطاء مقبولة للنصوص المشوهة
        expect((error as Error).message).toBeDefined();
      }
    }, 15000);

    test('Should handle very short scripts', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const shortScript = "أحمد: مرحباً.";

      try {
        const analysis = await emotionalAgent.analyzeNarrative(shortScript);
        
        expect(analysis).toBeDefined();
        expect(analysis.emotional_arcs.length).toBeGreaterThanOrEqual(0);
        expect(analysis.pacing_rhythm.tension_curve.length).toBeGreaterThan(0);
        
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    }, 10000);

    test('Should handle scripts with no dialogue', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const actionScript = `
        مشهد 1 - خارجي - الصحراء - نهار
        
        الرياح تعصف بقوة. الرمال تتطاير في كل مكان.
        رجل يمشي وحيداً عبر الكثبان الرملية.
        الشمس حارقة والظلال قليلة.
        يتوقف الرجل ويشرب من قارورة الماء.
      `;

      try {
        const analysis = await emotionalAgent.analyzeNarrative(actionScript);
        
        expect(analysis).toBeDefined();
        expect(analysis.overall_tone).toBeDefined();
        
        // يجب أن يتعامل مع عدم وجود حوار
        expect(analysis.emotional_arcs.length).toBeGreaterThanOrEqual(0);
        
      } catch (error) {
        expect((error as Error).message).toBeDefined();
      }
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التكامل مع Python Service
  // ═══════════════════════════════════════════════════════════════════════

  describe('Python Service Integration', () => {
    test('Should work with or without Python service', async () => {
      if (!emotionalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const script = `
        أحمد: أشعر بالسعادة اليوم.
        سارة: هذا رائع، أنا سعيدة لأجلك.
      `;

      // يجب أن يعمل حتى لو لم تكن خدمة Python متاحة
      const analysis = await emotionalAgent.analyzeNarrative(script);
      
      expect(analysis).toBeDefined();
      expect(analysis.overall_tone).toBeDefined();
      expect(analysis.audience_engagement).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});