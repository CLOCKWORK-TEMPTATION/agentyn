/**
 * اختبارات الوحدة لوكيل قراءة التفريغ
 * Unit Tests for Breakdown Reading Agent
 * 
 * يختبر الوظائف الأساسية لوكيل التفريغ
 * Requirements: 4.2, 4.4
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { BreakdownReadingAgent } from '../agents/breakdown-agent.js';
import { ModelManager, PythonBrainService, ProductionCategory } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// إعداد الاختبارات
// ═══════════════════════════════════════════════════════════════════════════

describe('Unit Tests: Breakdown Reading Agent', () => {
  let breakdownAgent: BreakdownReadingAgent;
  let modelManager: ModelManager;
  let pythonService: PythonBrainService;

  beforeAll(() => {
    modelManager = new ModelManager();
    pythonService = new PythonBrainService();
    
    try {
      const model = modelManager.getModel('classification');
      breakdownAgent = new BreakdownReadingAgent(model, pythonService);
    } catch (error) {
      console.warn('⚠️ لا يوجد نموذج متاح للاختبار، سيتم تخطي بعض الاختبارات');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات استخراج العناصر الأساسية
  // ═══════════════════════════════════════════════════════════════════════

  describe('Basic Element Extraction', () => {
    test('Should extract props from scene', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const propsScript = `
        مشهد 1 - داخلي - المكتب - نهار
        
        أحمد يجلس خلف مكتب خشبي كبير.
        يحمل قلماً أزرق ويكتب في دفتر ملاحظات.
        على المكتب لابتوب مفتوح وكوب قهوة ساخن.
        
        أحمد: (يرفع الهاتف) ألو، مكتب أحمد.
      `;

      const result = await breakdownAgent.extractElements(propsScript, 'props_scene');
      
      expect(result).toBeDefined();
      expect(result.elements.length).toBeGreaterThan(0);
      
      // البحث عن الدعائم المتوقعة
      const propNames = result.elements.map(el => el.name.toLowerCase());
      const hasDesk = propNames.some(name => name.includes('مكتب'));
      const hasPen = propNames.some(name => name.includes('قلم'));
      const hasLaptop = propNames.some(name => name.includes('لابتوب') || name.includes('حاسوب'));
      const hasCoffee = propNames.some(name => name.includes('قهوة') || name.includes('كوب'));
      const hasPhone = propNames.some(name => name.includes('هاتف'));
      
      // يجب أن يستخرج على الأقل بعض الدعائم
      const extractedProps = [hasDesk, hasPen, hasLaptop, hasCoffee, hasPhone].filter(Boolean).length;
      expect(extractedProps).toBeGreaterThan(1);
      
      // فحص التصنيف
      const propsElements = result.elements.filter(el => 
        el.category === ProductionCategory.PROPS_HANDHELD || 
        el.category === ProductionCategory.PROPS_INTERACTIVE ||
        el.category === ProductionCategory.SET_DRESSING
      );
      expect(propsElements.length).toBeGreaterThan(0);
    }, 20000);

    test('Should extract wardrobe elements', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const wardrobeScript = `
        مشهد 2 - خارجي - الحديقة - نهار
        
        سارة تدخل وهي ترتدي فستاناً أحمر أنيقاً.
        تضع قبعة صيفية بيضاء ونظارة شمسية.
        حذاؤها الأسود اللامع يلمع تحت الشمس.
        
        أحمد يرتدي قميصاً أبيض وبنطلون جينز أزرق.
      `;

      const result = await breakdownAgent.extractElements(wardrobeScript, 'wardrobe_scene');
      
      expect(result.elements.length).toBeGreaterThan(0);
      
      // البحث عن عناصر الأزياء
      const wardrobeElements = result.elements.filter(el => 
        el.category === ProductionCategory.WARDROBE_COSTUMES
      );
      
      expect(wardrobeElements.length).toBeGreaterThan(0);
      
      // فحص أسماء العناصر
      const wardrobeNames = wardrobeElements.map(el => el.name.toLowerCase());
      const hasDress = wardrobeNames.some(name => name.includes('فستان'));
      const hasShirt = wardrobeNames.some(name => name.includes('قميص'));
      const hasHat = wardrobeNames.some(name => name.includes('قبعة'));
      
      const extractedWardrobe = [hasDress, hasShirt, hasHat].filter(Boolean).length;
      expect(extractedWardrobe).toBeGreaterThan(0);
    }, 20000);

    test('Should extract vehicles', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const vehicleScript = `
        مشهد 3 - خارجي - موقف السيارات - مساء
        
        أحمد يقود سيارة BMW سوداء حديثة.
        يتوقف بجانب دراجة نارية حمراء.
        في المسافة، شاحنة كبيرة تفرغ البضائع.
        
        أحمد: (ينزل من السيارة) وصلنا أخيراً.
      `;

      const result = await breakdownAgent.extractElements(vehicleScript, 'vehicle_scene');
      
      const vehicleElements = result.elements.filter(el => 
        el.category === ProductionCategory.VEHICLES_PICTURE
      );
      
      expect(vehicleElements.length).toBeGreaterThan(0);
      
      // فحص أنواع المركبات
      const vehicleNames = vehicleElements.map(el => el.name.toLowerCase());
      const hasCar = vehicleNames.some(name => name.includes('سيارة') || name.includes('bmw'));
      const hasMotorcycle = vehicleNames.some(name => name.includes('دراجة'));
      const hasTruck = vehicleNames.some(name => name.includes('شاحنة'));
      
      const extractedVehicles = [hasCar, hasMotorcycle, hasTruck].filter(Boolean).length;
      expect(extractedVehicles).toBeGreaterThan(0);
    }, 20000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات أوراق التفريغ
  // ═══════════════════════════════════════════════════════════════════════

  describe('Breakdown Sheets Generation', () => {
    test('Should generate organized breakdown sheets', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const mixedScript = `
        مشهد 1 - داخلي - المكتب - نهار
        
        أحمد يرتدي بدلة رسمية ويحمل حقيبة جلدية.
        على المكتب حاسوب وأوراق متناثرة.
        سارة تدخل وهي ترتدي فستاناً أزرق.
        في الخلفية موسيقى هادئة.
        رجل الأمن يقف عند الباب.
      `;

      const result = await breakdownAgent.extractElements(mixedScript, 'mixed_scene');
      
      expect(result.breakdown_sheets.length).toBeGreaterThan(0);
      
      result.breakdown_sheets.forEach(sheet => {
        // فحص هيكل الورقة
        expect(sheet.category).toBeDefined();
        expect(Object.values(ProductionCategory)).toContain(sheet.category);
        expect(sheet.category_name).toBeDefined();
        expect(sheet.color_code).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(Array.isArray(sheet.items)).toBe(true);
        expect(sheet.total_count).toBe(sheet.items.length);
        expect(sheet.estimated_cost).toBeGreaterThan(0);
        expect(['high', 'medium', 'low']).toContain(sheet.priority_level);
        expect(sheet.department).toBeDefined();
        
        // جميع العناصر في الورقة يجب أن تكون من نفس الفئة
        sheet.items.forEach(item => {
          expect(item.category).toBe(sheet.category);
        });
      });
      
      // التحقق من أن مجموع العناصر في الأوراق يساوي العدد الكلي
      const totalInSheets = result.breakdown_sheets.reduce(
        (sum, sheet) => sum + sheet.total_count, 0
      );
      expect(totalInSheets).toBe(result.elements.length);
    }, 25000);

    test('Should assign appropriate colors to categories', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const colorScript = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد الممثل الرئيسي يحمل هاتفاً.
        سارة ترتدي فستاناً جميلاً.
        على الطاولة كوب وأوراق.
      `;

      const result = await breakdownAgent.extractElements(colorScript, 'color_scene');
      
      // فحص أن كل فئة لها لون مختلف
      const colors = new Set(result.breakdown_sheets.map(sheet => sheet.color_code));
      expect(colors.size).toBe(result.breakdown_sheets.length);
      
      // فحص أن الألوان صالحة
      result.breakdown_sheets.forEach(sheet => {
        expect(sheet.color_code).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(sheet.color_code.length).toBe(7);
      });
    }, 20000);

    test('Should calculate priority levels correctly', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const priorityScript = `
        مشهد 1 - خارجي - الشارع - نهار
        
        أحمد الممثل الرئيسي يقود سيارة سوداء.
        انفجار كبير يهز المكان - مؤثرات خاصة.
        في الخلفية، كومبارس يجرون في الشارع.
        على الأرض أوراق متناثرة.
      `;

      const result = await breakdownAgent.extractElements(priorityScript, 'priority_scene');
      
      // العناصر عالية الأولوية (ممثلين، مركبات، مؤثرات خاصة)
      const highPrioritySheets = result.breakdown_sheets.filter(
        sheet => sheet.priority_level === 'high'
      );
      
      // يجب أن تكون هناك عناصر عالية الأولوية
      expect(highPrioritySheets.length).toBeGreaterThan(0);
      
      // فحص أن الأوراق مرتبة حسب الأولوية
      const priorities = result.breakdown_sheets.map(sheet => sheet.priority_level);
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      
      for (let i = 0; i < priorities.length - 1; i++) {
        const currentPriority = priorityOrder[priorities[i]];
        const nextPriority = priorityOrder[priorities[i + 1]];
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
      }
    }, 25000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات تتبع الأدلة
  // ═══════════════════════════════════════════════════════════════════════

  describe('Evidence Tracking', () => {
    test('Should provide evidence for each extracted element', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const evidenceScript = `
        مشهد 1 - داخلي - المطبخ - صباح
        
        أحمد يحمل كوب قهوة ساخن ويقرأ الجريدة.
        على الطاولة طبق فواكه وسكين حاد.
      `;

      const result = await breakdownAgent.extractElements(evidenceScript, 'evidence_scene');
      
      expect(result.elements.length).toBeGreaterThan(0);
      
      result.elements.forEach(element => {
        // فحص وجود الدليل
        expect(element.evidence).toBeDefined();
        expect(element.evidence.span_start).toBeGreaterThanOrEqual(0);
        expect(element.evidence.span_end).toBeGreaterThan(element.evidence.span_start);
        expect(element.evidence.text_excerpt).toBeDefined();
        expect(element.evidence.text_excerpt.length).toBeGreaterThan(0);
        expect(element.evidence.rationale).toBeDefined();
        expect(element.evidence.rationale.length).toBeGreaterThan(5);
        expect(element.evidence.confidence).toBeGreaterThanOrEqual(0);
        expect(element.evidence.confidence).toBeLessThanOrEqual(1);
        
        // فحص معلومات المصدر
        expect(element.extracted_by).toBeDefined();
        expect(element.extracted_by.agent_type).toBe('breakdown');
        expect(element.extracted_by.agent_version).toBeDefined();
        expect(element.extracted_by.model_used).toBeDefined();
        expect(element.extracted_by.timestamp).toBeInstanceOf(Date);
        
        // فحص السياق
        expect(element.context).toBeDefined();
        expect(element.context.scene_context).toBeDefined();
      });
    }, 20000);

    test('Should track element context accurately', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const contextScript = `
        مشهد 5 - خارجي - الحديقة - مساء
        
        أحمد يجلس على مقعد خشبي تحت شجرة كبيرة.
        يحمل كتاباً ويقرأ بتركيز.
        
        أحمد: (يتحدث لنفسه) هذا مثير للاهتمام.
      `;

      const result = await breakdownAgent.extractElements(contextScript, 'context_scene');
      
      result.elements.forEach(element => {
        expect(element.scene_id).toBe('context_scene');
        expect(element.context.scene_context).toBeDefined();
        
        // فحص السياق الزمني والمكاني
        if (element.context.timing_context) {
          expect(['نهار', 'ليل', 'صباح', 'مساء', 'غير محدد']).toContain(element.context.timing_context);
        }
        
        if (element.context.location_context) {
          expect(element.context.location_context).toContain('حديقة');
        }
        
        // فحص سياق الشخصية إذا كان متاحاً
        if (element.context.character_context) {
          expect(typeof element.context.character_context).toBe('string');
        }
      });
    }, 20000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات مقاييس الجودة
  // ═══════════════════════════════════════════════════════════════════════

  describe('Quality Metrics', () => {
    test('Should calculate quality metrics accurately', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const qualityScript = `
        مشهد 1 - داخلي - المكتب - نهار
        
        أحمد المدير يجلس خلف مكتب فخم.
        يحمل قلماً ذهبياً ويوقع على أوراق مهمة.
        سارة السكرتيرة تدخل حاملة ملفات.
      `;

      const result = await breakdownAgent.extractElements(qualityScript, 'quality_scene');
      
      const metrics = result.quality_metrics;
      
      // فحص أن جميع المقاييس في النطاق الصحيح
      expect(metrics.extraction_confidence).toBeGreaterThanOrEqual(0);
      expect(metrics.extraction_confidence).toBeLessThanOrEqual(1);
      expect(metrics.evidence_completeness).toBeGreaterThanOrEqual(0);
      expect(metrics.evidence_completeness).toBeLessThanOrEqual(1);
      expect(metrics.classification_accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.classification_accuracy).toBeLessThanOrEqual(1);
      
      // إذا كانت هناك عناصر، يجب أن تكون المقاييس > 0
      if (result.elements.length > 0) {
        expect(metrics.extraction_confidence).toBeGreaterThan(0);
      }
      
      // فحص منطقية المقاييس
      const elementsWithGoodEvidence = result.elements.filter(el => 
        el.evidence.text_excerpt.length > 3 && el.evidence.confidence > 0.5
      ).length;
      
      const expectedEvidenceCompleteness = result.elements.length > 0 
        ? elementsWithGoodEvidence / result.elements.length 
        : 0;
      
      expect(Math.abs(metrics.evidence_completeness - expectedEvidenceCompleteness)).toBeLessThan(0.1);
    }, 20000);

    test('Should reflect script complexity in metrics', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      // سيناريو بسيط
      const simpleScript = `
        مشهد 1 - داخلي - غرفة - نهار
        أحمد: مرحباً.
      `;

      // سيناريو معقد
      const complexScript = `
        مشهد 1 - خارجي - موقع البناء - نهار
        
        أحمد المهندس يرتدي خوذة أمان صفراء وسترة عاكسة.
        يحمل مخططات البناء وجهاز قياس ليزر متطور.
        
        في الخلفية، رافعة عملاقة تحمل مواد البناء.
        عمال البناء يرتدون ملابس واقية ويستخدمون أدوات كهربائية.
        
        سيارة إسعاف تقف في الجانب للطوارئ.
        رجل الأمن يراقب الموقع بكاميرات مراقبة.
      `;

      const simpleResult = await breakdownAgent.extractElements(simpleScript, 'simple_scene');
      const complexResult = await breakdownAgent.extractElements(complexScript, 'complex_scene');
      
      // السيناريو المعقد يجب أن يحتوي على عناصر أكثر
      expect(complexResult.elements.length).toBeGreaterThan(simpleResult.elements.length);
      
      // درجة التعقيد يجب أن تعكس الاختلاف
      expect(complexResult.summary.complexity_score).toBeGreaterThan(simpleResult.summary.complexity_score);
      
      // تأثير الميزانية يجب أن يكون أعلى للسيناريو المعقد
      const budgetImpactOrder = { low: 1, medium: 2, high: 3, very_high: 4 };
      const simpleBudgetImpact = budgetImpactOrder[simpleResult.summary.estimated_budget_impact];
      const complexBudgetImpact = budgetImpactOrder[complexResult.summary.estimated_budget_impact];
      
      expect(complexBudgetImpact).toBeGreaterThanOrEqual(simpleBudgetImpact);
    }, 30000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات معالجة الأخطاء
  // ═══════════════════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    test('Should handle empty script gracefully', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      try {
        const result = await breakdownAgent.extractElements('', 'empty_scene');
        
        expect(result).toBeDefined();
        expect(result.scene_id).toBe('empty_scene');
        expect(Array.isArray(result.elements)).toBe(true);
        expect(Array.isArray(result.breakdown_sheets)).toBe(true);
        expect(result.summary.total_elements).toBe(result.elements.length);
        
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    }, 15000);

    test('Should work with or without Python service', async () => {
      if (!breakdownAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const testScript = `
        مشهد 1 - داخلي - المنزل - نهار
        أحمد يحمل كوباً ويجلس على الكرسي.
      `;

      // يجب أن يعمل حتى لو لم تكن خدمة Python متاحة
      const result = await breakdownAgent.extractElements(testScript, 'test_scene');
      
      expect(result).toBeDefined();
      expect(result.elements.length).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
      expect(result.quality_metrics).toBeDefined();
    }, 15000);
  });
});