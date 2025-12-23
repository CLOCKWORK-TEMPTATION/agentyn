/**
 * اختبارات الخصائص للوكيل التقني (Technical Reading Agent Property Tests)
 * 
 * **Feature: three-read-breakdown-system, Property 5: Technical Validation Completeness**
 * 
 * يختبر الخاصية: لأي فحص تقني، يجب أن يتحقق النظام من اتساق ترويسات المشاهد 
 * وتحديد المواقع والتوقيت
 * 
 * **Testable Criteria**: كل مشهد يجب أن يحتوي على (INT/EXT + Location + DAY/NIGHT) صالحة
 * **Validates: Requirements 3.2**
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
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

// مولدات البيانات للاختبار
const intExtGenerator = fc.constantFrom('داخلي', 'خارجي', 'INT', 'EXT', 'INTERIOR', 'EXTERIOR');
const locationGenerator = fc.string({ minLength: 3, maxLength: 30 }).filter(s => 
  s.trim().length >= 3 && !/[^\w\s\u0600-\u06FF]/.test(s)
);
const timeOfDayGenerator = fc.constantFrom('نهار', 'ليل', 'صباح', 'مساء', 'DAY', 'NIGHT', 'DAWN', 'DUSK');

// مولد ترويسة مشهد صحيحة
const validSceneHeaderGenerator = fc.record({
  sceneNumber: fc.integer({ min: 1, max: 100 }),
  intExt: intExtGenerator,
  location: locationGenerator,
  timeOfDay: timeOfDayGenerator,
  language: fc.constantFrom('arabic', 'english', 'mixed')
}).map(({ sceneNumber, intExt, location, timeOfDay, language }) => {
  if (language === 'arabic') {
    return `مشهد ${sceneNumber}: ${intExt} - ${location} - ${timeOfDay}`;
  } else if (language === 'english') {
    return `SCENE ${sceneNumber}: ${intExt}. ${location} - ${timeOfDay}`;
  } else {
    return `مشهد ${sceneNumber}: ${intExt} - ${location} - ${timeOfDay}`;
  }
});

// مولد ترويسة مشهد ناقصة
const incompleteSceneHeaderGenerator = fc.record({
  sceneNumber: fc.integer({ min: 1, max: 100 }),
  location: locationGenerator,
  missingComponent: fc.constantFrom('intExt', 'timeOfDay', 'both')
}).map(({ sceneNumber, location, missingComponent }) => {
  switch (missingComponent) {
    case 'intExt':
      return `مشهد ${sceneNumber}: ${location} - نهار`;
    case 'timeOfDay':
      return `مشهد ${sceneNumber}: داخلي - ${location}`;
    case 'both':
      return `مشهد ${sceneNumber}: ${location}`;
    default:
      return `مشهد ${sceneNumber}: ${location}`;
  }
});

// مولد شخصية
const characterGenerator = fc.record({
  name: fc.string({ minLength: 2, maxLength: 20 }).filter(s => 
    s.trim().length >= 2 && /^[أ-ي\w\s]+$/.test(s)
  ),
  dialogue: fc.string({ minLength: 5, maxLength: 100 })
}).map(({ name, dialogue }) => `${name}: ${dialogue}`);

// مولد سيناريو كامل
const scriptGenerator = fc.record({
  scenes: fc.array(fc.record({
    header: validSceneHeaderGenerator,
    content: fc.array(characterGenerator, { minLength: 1, maxLength: 5 })
  }), { minLength: 1, maxLength: 10 })
}).map(({ scenes }) => {
  return scenes.map(scene => 
    scene.header + '\n\n' + scene.content.join('\n') + '\n'
  ).join('\n');
});

// مولد سيناريو مع مشاكل
const problematicScriptGenerator = fc.record({
  scenes: fc.array(fc.record({
    header: fc.oneof(validSceneHeaderGenerator, incompleteSceneHeaderGenerator),
    content: fc.array(characterGenerator, { minLength: 1, maxLength: 3 })
  }), { minLength: 1, maxLength: 5 })
}).map(({ scenes }) => {
  return scenes.map(scene => 
    scene.header + '\n\n' + scene.content.join('\n') + '\n'
  ).join('\n');
});

describe('Technical Reading Agent Property Tests', () => {
  let agent: TechnicalReadingAgent;
  let mockModel: MockLanguageModel;
  let mockPythonService: MockPythonBrainService;

  beforeEach(() => {
    mockModel = new MockLanguageModel({});
    mockPythonService = new MockPythonBrainService();
    agent = new TechnicalReadingAgent(mockModel, mockPythonService);
  });

  /**
   * **Feature: three-read-breakdown-system, Property 5: Technical Validation Completeness**
   * 
   * لأي فحص تقني، يجب أن يتحقق النظام من اتساق ترويسات المشاهد وتحديد المواقع والتوقيت
   * 
   * **Testable Criteria**: كل مشهد يجب أن يحتوي على (INT/EXT + Location + DAY/NIGHT) صالحة
   * **Validates: Requirements 3.2**
   */
  test('Property 5: Technical Validation Completeness - يجب فحص جميع مكونات ترويسات المشاهد', async () => {
    await fc.assert(
      fc.asyncProperty(scriptGenerator, async (script) => {
        // تنفيذ الفحص التقني
        const validation = await agent.validateFormatting(script);
        
        // التحقق من أن الفحص تم بالكامل
        expect(validation).toBeDefined();
        expect(validation.scene_headers).toBeDefined();
        expect(validation.character_consistency).toBeDefined();
        expect(validation.corruption_report).toBeDefined();
        
        // التحقق من فحص كل ترويسة مشهد
        for (const header of validation.scene_headers) {
          // يجب أن يحتوي كل مشهد على فحص للمكونات الثلاثة
          expect(header.int_ext).toBeDefined();
          expect(header.location).toBeDefined();
          expect(header.time_of_day).toBeDefined();
          
          // يجب أن يكون لكل مكون قيمة وحالة صحة
          expect(header.int_ext.value).toBeDefined();
          expect(header.int_ext.is_valid).toBeDefined();
          expect(header.location.value).toBeDefined();
          expect(header.location.is_valid).toBeDefined();
          expect(header.time_of_day.value).toBeDefined();
          expect(header.time_of_day.is_valid).toBeDefined();
          
          // يجب أن يكون هناك تقييم شامل للترويسة
          expect(header.overall_valid).toBeDefined();
          expect(header.confidence).toBeGreaterThanOrEqual(0);
          expect(header.confidence).toBeLessThanOrEqual(1);
        }
        
        // التحقق من أن النتيجة الإجمالية منطقية
        expect(validation.overall_score).toBeGreaterThanOrEqual(0);
        expect(validation.overall_score).toBeLessThanOrEqual(1);
        expect(validation.is_valid).toBeDefined();
      }),
      { 
        numRuns: 100,
        timeout: 30000,
        verbose: true
      }
    );
  });

  test('Property 5.1: Scene Header Component Detection - يجب اكتشاف المكونات المفقودة', async () => {
    await fc.assert(
      fc.asyncProperty(incompleteSceneHeaderGenerator, async (incompleteHeader) => {
        const script = incompleteHeader + '\n\nأحمد: مرحباً.';
        
        const validation = await agent.validateFormatting(script);
        
        // يجب أن يكتشف النظام المكونات المفقودة
        expect(validation.scene_headers).toHaveLength(1);
        
        const header = validation.scene_headers[0];
        
        // يجب أن يكون هناك على الأقل مكون واحد غير صالح
        const invalidComponents = [
          !header.int_ext.is_valid,
          !header.location.is_valid,
          !header.time_of_day.is_valid
        ].filter(Boolean);
        
        expect(invalidComponents.length).toBeGreaterThan(0);
        
        // يجب أن تكون الترويسة الإجمالية غير صالحة
        expect(header.overall_valid).toBe(false);
        
        // يجب أن تكون هناك مشاكل مُبلغ عنها
        const totalIssues = header.int_ext.issues.length + 
                           header.location.issues.length + 
                           header.time_of_day.issues.length;
        expect(totalIssues).toBeGreaterThan(0);
      }),
      { 
        numRuns: 100,
        timeout: 20000
      }
    );
  });

  test('Property 5.2: Character Consistency Validation - يجب فحص اتساق الشخصيات', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          name: fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[أ-ي\w\s]+$/.test(s.trim())),
          variations: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
          dialogues: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 3 })
        }), { minLength: 1, maxLength: 5 }),
        async (characters) => {
          // إنشاء سيناريو مع تنوعات في أسماء الشخصيات
          let script = 'مشهد 1: داخلي - غرفة - نهار\n\n';
          
          for (const char of characters) {
            for (let i = 0; i < char.dialogues.length; i++) {
              const nameVariation = char.variations[i % char.variations.length] || char.name;
              script += `${nameVariation}: ${char.dialogues[i]}\n`;
            }
          }
          
          const validation = await agent.validateFormatting(script);
          
          // يجب أن يتم فحص اتساق الشخصيات
          expect(validation.character_consistency).toBeDefined();
          
          // يجب أن يكون هناك تقرير لكل شخصية فريدة
          expect(validation.character_consistency.length).toBeGreaterThan(0);
          
          for (const charConsistency of validation.character_consistency) {
            // يجب أن يحتوي كل تقرير على المعلومات الأساسية
            expect(charConsistency.character_name).toBeDefined();
            expect(charConsistency.total_appearances).toBeGreaterThan(0);
            expect(charConsistency.name_variations).toBeDefined();
            expect(charConsistency.inconsistencies).toBeDefined();
            expect(charConsistency.is_consistent).toBeDefined();
            expect(charConsistency.confidence).toBeGreaterThanOrEqual(0);
            expect(charConsistency.confidence).toBeLessThanOrEqual(1);
          }
        }
      ),
      { 
        numRuns: 50,
        timeout: 25000
      }
    );
  });

  test('Property 5.3: Data Corruption Detection - يجب كشف فساد البيانات', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          baseScript: fc.string({ minLength: 50, maxLength: 200 }),
          corruptionType: fc.constantFrom('encoding', 'duplication', 'malformed'),
          corruptionIntensity: fc.integer({ min: 1, max: 5 })
        }),
        async ({ baseScript, corruptionType, corruptionIntensity }) => {
          let corruptedScript = baseScript;
          
          // إضافة فساد حسب النوع
          switch (corruptionType) {
            case 'encoding':
              // إضافة أحرف مشوهة
              for (let i = 0; i < corruptionIntensity; i++) {
                const pos = Math.floor(Math.random() * corruptedScript.length);
                corruptedScript = corruptedScript.slice(0, pos) + '�' + corruptedScript.slice(pos);
              }
              break;
              
            case 'duplication':
              // تكرار أجزاء من النص
              const lines = corruptedScript.split('\n');
              if (lines.length > 1) {
                const lineToRepeat = lines[Math.floor(Math.random() * lines.length)];
                for (let i = 0; i < corruptionIntensity; i++) {
                  lines.push(lineToRepeat);
                }
                corruptedScript = lines.join('\n');
              }
              break;
              
            case 'malformed':
              // إضافة أحرف غريبة
              for (let i = 0; i < corruptionIntensity; i++) {
                const pos = Math.floor(Math.random() * corruptedScript.length);
                corruptedScript = corruptedScript.slice(0, pos) + '###@@@' + corruptedScript.slice(pos);
              }
              break;
          }
          
          const validation = await agent.validateFormatting(corruptedScript);
          
          // يجب أن يتم إنشاء تقرير فساد البيانات
          expect(validation.corruption_report).toBeDefined();
          expect(validation.corruption_report.has_corruption).toBeDefined();
          expect(validation.corruption_report.corruption_types).toBeDefined();
          expect(validation.corruption_report.overall_integrity).toBeGreaterThanOrEqual(0);
          expect(validation.corruption_report.overall_integrity).toBeLessThanOrEqual(1);
          expect(validation.corruption_report.recovery_possible).toBeDefined();
          
          // إذا تم اكتشاف فساد، يجب أن تكون التفاصيل متاحة
          if (validation.corruption_report.has_corruption) {
            expect(validation.corruption_report.corruption_types.length).toBeGreaterThan(0);
            
            for (const corruption of validation.corruption_report.corruption_types) {
              expect(corruption.type).toBeDefined();
              expect(corruption.description).toBeDefined();
              expect(corruption.locations).toBeDefined();
              expect(corruption.severity).toBeDefined();
              expect(corruption.fix_suggestion).toBeDefined();
            }
          }
        }
      ),
      { 
        numRuns: 75,
        timeout: 20000
      }
    );
  });

  test('Property 5.4: Validation Completeness - يجب إرجاع تقرير شامل دائماً', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          scriptGenerator,
          problematicScriptGenerator,
          fc.string({ minLength: 0, maxLength: 1000 }) // نصوص عشوائية
        ),
        async (script) => {
          const validation = await agent.validateFormatting(script);
          
          // يجب أن يحتوي التقرير على جميع الأقسام المطلوبة
          expect(validation.is_valid).toBeDefined();
          expect(validation.overall_score).toBeDefined();
          expect(validation.errors).toBeDefined();
          expect(validation.warnings).toBeDefined();
          expect(validation.suggestions).toBeDefined();
          expect(validation.scene_headers).toBeDefined();
          expect(validation.character_consistency).toBeDefined();
          expect(validation.location_consistency).toBeDefined();
          expect(validation.corruption_report).toBeDefined();
          expect(validation.processing_metadata).toBeDefined();
          
          // يجب أن تكون القيم الرقمية في النطاق الصحيح
          expect(validation.overall_score).toBeGreaterThanOrEqual(0);
          expect(validation.overall_score).toBeLessThanOrEqual(1);
          
          // يجب أن تكون المصفوفات مُعرفة (حتى لو فارغة)
          expect(Array.isArray(validation.errors)).toBe(true);
          expect(Array.isArray(validation.warnings)).toBe(true);
          expect(Array.isArray(validation.suggestions)).toBe(true);
          expect(Array.isArray(validation.scene_headers)).toBe(true);
          expect(Array.isArray(validation.character_consistency)).toBe(true);
          expect(Array.isArray(validation.location_consistency)).toBe(true);
          
          // يجب أن تحتوي البيانات الوصفية على معلومات صحيحة
          expect(validation.processing_metadata.total_lines).toBeGreaterThanOrEqual(0);
          expect(validation.processing_metadata.total_scenes).toBeGreaterThanOrEqual(0);
          expect(validation.processing_metadata.total_characters).toBeGreaterThanOrEqual(0);
          expect(validation.processing_metadata.processing_time).toBeGreaterThanOrEqual(0);
          expect(validation.processing_metadata.confidence).toBeGreaterThanOrEqual(0);
          expect(validation.processing_metadata.confidence).toBeLessThanOrEqual(1);
        }
      ),
      { 
        numRuns: 100,
        timeout: 30000
      }
    );
  });

  test('Property 5.5: Error Severity Classification - يجب تصنيف الأخطاء بشكل صحيح', async () => {
    await fc.assert(
      fc.asyncProperty(problematicScriptGenerator, async (script) => {
        const validation = await agent.validateFormatting(script);
        
        // فحص تصنيف الأخطاء
        for (const error of validation.errors) {
          expect(error.type).toBeDefined();
          expect(error.message).toBeDefined();
          expect(error.severity).toBeDefined();
          expect(['warning', 'error', 'critical']).toContain(error.severity);
          
          if (error.suggestion) {
            expect(typeof error.suggestion).toBe('string');
            expect(error.suggestion.length).toBeGreaterThan(0);
          }
        }
        
        // فحص تصنيف التحذيرات
        for (const warning of validation.warnings) {
          expect(warning.type).toBeDefined();
          expect(warning.message).toBeDefined();
          expect(warning.suggestion).toBeDefined();
          expect(warning.impact).toBeDefined();
          expect(['low', 'medium', 'high']).toContain(warning.impact);
        }
        
        // يجب أن تؤثر الأخطاء الحرجة على صحة التقرير
        const criticalErrors = validation.errors.filter(e => e.severity === 'critical');
        if (criticalErrors.length > 0) {
          expect(validation.is_valid).toBe(false);
        }
      }),
      { 
        numRuns: 50,
        timeout: 20000
      }
    );
  });
});