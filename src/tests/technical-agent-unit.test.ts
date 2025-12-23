/**
 * اختبارات الوحدة للوكيل التقني (Technical Reading Agent Unit Tests)
 * 
 * يختبر:
 * - فحص ترويسات المشاهد
 * - كشف أخطاء التنسيق
 * - فحص اتساق الشخصيات والمواقع
 * - كشف فساد البيانات
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TechnicalReadingAgent } from '../agents/technical-agent.js';
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { PythonBrainService } from '../three-read-breakdown-system.js';

// Mock للنموذج اللغوي
class MockLanguageModel extends BaseLanguageModel {
  _llmType(): string {
    return 'mock';
  }

  _modelType(): string {
    return 'mock';
  }

  get lc_namespace(): string[] {
    return ['test', 'mock'];
  }

  async generatePrompt(): Promise<any> {
    return {
      generations: [[{
        text: JSON.stringify({
          is_valid: true,
          errors: [],
          warnings: [],
          scene_headers: [],
          character_consistency: []
        })
      }]]
    };
  }

  async _generate(): Promise<any> {
    return {
      generations: [[{
        text: JSON.stringify({
          is_valid: true,
          errors: [],
          warnings: [],
          scene_headers: [],
          character_consistency: []
        })
      }]]
    };
  }

  async invoke(messages: any[]): Promise<any> {
    return {
      content: JSON.stringify({
        is_valid: true,
        errors: [],
        warnings: [],
        scene_headers: [],
        character_consistency: []
      })
    };
  }
}

// Mock لخدمة Python
class MockPythonBrainService extends PythonBrainService {
  async analyzeWithComponent(): Promise<any> {
    return {
      job_id: 'test_job_123',
      status: 'fallback',
      result: { message: 'Using TypeScript fallback' }
    };
  }

  async waitForCompletion(): Promise<any> {
    return {
      validation_passed: true,
      errors: [],
      warnings: []
    };
  }
}

describe('TechnicalReadingAgent Unit Tests', () => {
  let agent: TechnicalReadingAgent;
  let mockModel: MockLanguageModel;
  let mockPythonService: MockPythonBrainService;

  beforeEach(() => {
    mockModel = new MockLanguageModel({});
    mockPythonService = new MockPythonBrainService();
    agent = new TechnicalReadingAgent(mockModel, mockPythonService);
  });

  describe('فحص ترويسات المشاهد (Scene Header Validation)', () => {
    test('يجب أن يتعرف على ترويسة مشهد صحيحة بالعربية', async () => {
      const script = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد يجلس على الأريكة.
      `;

      const headers = await agent.checkSceneHeaders(script);
      
      expect(headers).toHaveLength(1);
      expect(headers[0].scene_number).toBe('1');
      expect(headers[0].int_ext.value).toContain('داخلي');
      expect(headers[0].location.value).toContain('غرفة المعيشة');
      expect(headers[0].time_of_day.value).toContain('نهار');
      expect(headers[0].overall_valid).toBe(true);
    });

    test('يجب أن يتعرف على ترويسة مشهد صحيحة بالإنجليزية', async () => {
      const script = `
SCENE 1: INT. LIVING ROOM - DAY

Ahmed sits on the couch.
      `;

      const headers = await agent.checkSceneHeaders(script);
      
      expect(headers).toHaveLength(1);
      expect(headers[0].scene_number).toBe('1');
      expect(headers[0].int_ext.is_valid).toBe(true);
      expect(headers[0].location.is_valid).toBe(true);
      expect(headers[0].time_of_day.is_valid).toBe(true);
    });

    test('يجب أن يكتشف ترويسة مشهد ناقصة', async () => {
      const script = `
مشهد 1: غرفة المعيشة

أحمد يجلس على الأريكة.
      `;

      const headers = await agent.checkSceneHeaders(script);
      
      expect(headers).toHaveLength(1);
      expect(headers[0].int_ext.is_valid).toBe(false);
      expect(headers[0].time_of_day.is_valid).toBe(false);
      expect(headers[0].overall_valid).toBe(false);
      expect(headers[0].int_ext.issues).toContain('لم يتم تحديد داخلي/خارجي بوضوح');
    });

    test('يجب أن يكتشف عدم اتساق المواقع', async () => {
      const script = `
مشهد 1: داخلي - غرفة المعيشة - نهار
مشهد 2: داخلي - غرفه المعيشة - ليل

أحمد يجلس على الأريكة.
      `;

      const headers = await agent.checkSceneHeaders(script);
      
      expect(headers).toHaveLength(2);
      // يجب أن يكتشف التباين في كتابة "غرفة المعيشة"
      const secondHeader = headers[1];
      expect(secondHeader.location.is_consistent).toBe(false);
    });
  });

  describe('فحص اتساق الشخصيات (Character Consistency)', () => {
    test('يجب أن يكتشف الشخصيات المتسقة', async () => {
      const script = `
أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.
أحمد: هذا رائع.
      `;

      const consistency = await agent.validateCharacterConsistency(script);
      
      expect(consistency).toHaveLength(2);
      
      const ahmedConsistency = consistency.find(c => c.character_name === 'أحمد');
      expect(ahmedConsistency).toBeDefined();
      expect(ahmedConsistency!.is_consistent).toBe(true);
      expect(ahmedConsistency!.total_appearances).toBe(2);
    });

    test('يجب أن يكتشف عدم اتساق أسماء الشخصيات', async () => {
      const script = `
أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.
احمد: هذا رائع.
SARA: Thank you.
      `;

      const consistency = await agent.validateCharacterConsistency(script);
      
      const ahmedConsistency = consistency.find(c => 
        c.character_name === 'أحمد' || c.character_name === 'احمد'
      );
      expect(ahmedConsistency).toBeDefined();
      expect(ahmedConsistency!.is_consistent).toBe(false);
      expect(ahmedConsistency!.inconsistencies.length).toBeGreaterThan(0);
    });

    test('يجب أن يكتشف النقطتين المفقودة', async () => {
      const script = `
أحمد: مرحباً، كيف حالك؟
سارة بخير، شكراً لك.
أحمد هذا رائع.
      `;

      const consistency = await agent.validateCharacterConsistency(script);
      
      const saraConsistency = consistency.find(c => c.character_name === 'سارة');
      expect(saraConsistency).toBeDefined();
      
      const missingColonIssue = saraConsistency!.inconsistencies.find(i => 
        i.type === 'missing_colon'
      );
      expect(missingColonIssue).toBeDefined();
    });
  });

  describe('كشف فساد البيانات (Data Corruption Detection)', () => {
    test('يجب أن يكتشف مشاكل الترميز', async () => {
      const corruptedScript = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد: مرحباً� كيف حالك؟
سارة: بخير، شكراً لك.
      `;

      const corruption = await agent.detectDataCorruption(corruptedScript);
      
      expect(corruption.has_corruption).toBe(true);
      expect(corruption.corruption_types).toHaveLength(1);
      expect(corruption.corruption_types[0].type).toBe('encoding');
      expect(corruption.overall_integrity).toBeLessThan(1.0);
    });

    test('يجب أن يكتشف التكرار في المحتوى', async () => {
      const duplicatedScript = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.
أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.
      `;

      const corruption = await agent.detectDataCorruption(duplicatedScript);
      
      expect(corruption.has_corruption).toBe(true);
      const duplicationIssue = corruption.corruption_types.find(t => t.type === 'duplication');
      expect(duplicationIssue).toBeDefined();
      expect(duplicationIssue!.severity).toBe('high');
    });

    test('يجب أن يكتشف البنية المشوهة', async () => {
      const malformedScript = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد: مرحباً، كيف حالك؟
###@@@%%%^^^&&&
سارة: بخير، شكراً لك.
      `;

      const corruption = await agent.detectDataCorruption(malformedScript);
      
      expect(corruption.has_corruption).toBe(true);
      const structureIssue = corruption.corruption_types.find(t => t.type === 'malformed_structure');
      expect(structureIssue).toBeDefined();
      expect(structureIssue!.severity).toBe('critical');
    });

    test('يجب أن يُرجع تقرير نظيف للنص السليم', async () => {
      const cleanScript = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.
أحمد: هذا رائع.
      `;

      const corruption = await agent.detectDataCorruption(cleanScript);
      
      expect(corruption.has_corruption).toBe(false);
      expect(corruption.corruption_types).toHaveLength(0);
      expect(corruption.overall_integrity).toBe(1.0);
      expect(corruption.recovery_possible).toBe(true);
    });
  });

  describe('الفحص الشامل (Comprehensive Validation)', () => {
    test('يجب أن يُرجع تقرير فحص شامل للسيناريو الصحيح', async () => {
      const validScript = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد يجلس على الأريكة ويقرأ كتاباً.

أحمد: (يرفع رأسه) مرحباً سارة.

سارة تدخل من الباب الرئيسي.

سارة: مرحباً أحمد، كيف حالك؟

أحمد: بخير، شكراً لك.

مشهد 2: خارجي - الحديقة - نهار

أحمد وسارة يمشيان في الحديقة.

سارة: الطقس جميل اليوم.
أحمد: نعم، مناسب للمشي.
      `;

      const validation = await agent.validateFormatting(validScript);
      
      expect(validation.is_valid).toBe(true);
      expect(validation.overall_score).toBeGreaterThan(0.7);
      expect(validation.scene_headers).toHaveLength(2);
      expect(validation.character_consistency).toHaveLength(2);
      expect(validation.corruption_report.has_corruption).toBe(false);
      
      // فحص ترويسات المشاهد
      expect(validation.scene_headers[0].overall_valid).toBe(true);
      expect(validation.scene_headers[1].overall_valid).toBe(true);
      
      // فحص اتساق الشخصيات
      const ahmedConsistency = validation.character_consistency.find(c => c.character_name === 'أحمد');
      const saraConsistency = validation.character_consistency.find(c => c.character_name === 'سارة');
      
      expect(ahmedConsistency?.is_consistent).toBe(true);
      expect(saraConsistency?.is_consistent).toBe(true);
    });

    test('يجب أن يكتشف مشاكل متعددة في سيناريو معطوب', async () => {
      const problematicScript = `
مشهد 1: غرفة المعيشة

احمد يجلس على الأريكة.

أحمد مرحباً سارة.
سارة: مرحباً أحمد، كيف حالك؟
احمد: بخير، شكراً لك.

مشهد: خارجي - الحديقة

سارة: الطقس جميل اليوم.
أحمد: نعم، مناسب للمشي.
أحمد: نعم، مناسب للمشي.
      `;

      const validation = await agent.validateFormatting(problematicScript);
      
      expect(validation.is_valid).toBe(false);
      expect(validation.overall_score).toBeLessThan(0.7);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThan(0);
      
      // يجب أن يكتشف مشاكل في ترويسات المشاهد
      const invalidHeaders = validation.scene_headers.filter(h => !h.overall_valid);
      expect(invalidHeaders.length).toBeGreaterThan(0);
      
      // يجب أن يكتشف عدم اتساق الشخصيات
      const inconsistentCharacters = validation.character_consistency.filter(c => !c.is_consistent);
      expect(inconsistentCharacters.length).toBeGreaterThan(0);
      
      // يجب أن يكتشف التكرار
      expect(validation.corruption_report.has_corruption).toBe(true);
    });

    test('يجب أن يتعامل مع النص الفارغ بشكل صحيح', async () => {
      const emptyScript = '';

      const validation = await agent.validateFormatting(emptyScript);
      
      expect(validation.is_valid).toBe(false);
      expect(validation.overall_score).toBeLessThan(0.5);
      expect(validation.errors.length).toBeGreaterThan(0);
      
      const criticalError = validation.errors.find(e => e.severity === 'critical');
      expect(criticalError).toBeDefined();
    });

    test('يجب أن يحسب الثقة بشكل صحيح', async () => {
      const scriptWithMinorIssues = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.

مشهد 2: داخلي - غرفة المعيشة - ليل

أحمد: وقت متأخر.
      `;

      const validation = await agent.validateFormatting(scriptWithMinorIssues);
      
      expect(validation.overall_score).toBeGreaterThan(0.6);
      expect(validation.overall_score).toBeLessThan(1.0);
      expect(validation.processing_metadata.confidence).toBeDefined();
      expect(validation.processing_metadata.confidence).toBeGreaterThan(0);
    });
  });

  describe('معالجة الأخطاء (Error Handling)', () => {
    test('يجب أن يتعامل مع فشل النموذج اللغوي', async () => {
      const failingModel = {
        invoke: jest.fn().mockImplementation(() => Promise.reject(new Error('Model API failed'))),
        _llmType: () => 'failing-mock',
        _modelType: () => 'failing-mock',
        lc_namespace: ['test', 'failing'],
        generatePrompt: jest.fn().mockImplementation(() => Promise.reject(new Error('Model API failed'))),
        _generate: jest.fn().mockImplementation(() => Promise.reject(new Error('Model API failed')))
      } as any;

      const agentWithFailingModel = new TechnicalReadingAgent(failingModel, mockPythonService);
      
      const validation = await agentWithFailingModel.validateFormatting('test script');
      
      // يجب أن يُرجع fallback validation
      expect(validation).toBeDefined();
      expect(validation.processing_metadata).toBeDefined();
    });

    test('يجب أن يعمل بدون خدمة Python', async () => {
      const failingPythonService = {
        analyzeWithComponent: jest.fn().mockImplementation(() => Promise.reject(new Error('Python service unavailable'))),
        waitForCompletion: jest.fn().mockImplementation(() => Promise.reject(new Error('Python service unavailable')))
      } as any;

      const agentWithoutPython = new TechnicalReadingAgent(mockModel, failingPythonService);
      
      const script = `
مشهد 1: داخلي - غرفة المعيشة - نهار
أحمد: مرحباً.
      `;

      const validation = await agentWithoutPython.validateFormatting(script);
      
      expect(validation).toBeDefined();
      expect(validation.is_valid).toBeDefined();
    });
  });

  describe('الأداء (Performance)', () => {
    test('يجب أن يكمل الفحص في وقت معقول', async () => {
      const largeScript = `
مشهد 1: داخلي - غرفة المعيشة - نهار

أحمد: مرحباً، كيف حالك؟
سارة: بخير، شكراً لك.
      `.repeat(50); // تكرار النص 50 مرة

      const startTime = Date.now();
      const validation = await agent.validateFormatting(largeScript);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      
      expect(validation).toBeDefined();
      expect(processingTime).toBeLessThan(10000); // أقل من 10 ثوان
      expect(validation.processing_metadata.processing_time).toBeGreaterThan(0);
    });
  });
});