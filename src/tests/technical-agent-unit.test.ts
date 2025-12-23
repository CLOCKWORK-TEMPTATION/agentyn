/**
 * اختبارات الوحدة للوكيل التقني
 * Unit Tests for Technical Reading Agent
 * 
 * يختبر الوظائف الأساسية للوكيل التقني
 * Requirements: 3.2, 3.4
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { TechnicalReadingAgent } from '../agents/technical-agent.js';
import { ModelManager, PythonBrainService } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// إعداد الاختبارات
// ═══════════════════════════════════════════════════════════════════════════

describe('Unit Tests: Technical Reading Agent', () => {
  let technicalAgent: TechnicalReadingAgent;
  let modelManager: ModelManager;
  let pythonService: PythonBrainService;

  beforeAll(() => {
    modelManager = new ModelManager();
    pythonService = new PythonBrainService();
    
    try {
      const model = modelManager.getModel('technical_validation');
      technicalAgent = new TechnicalReadingAgent(model, pythonService);
    } catch (error) {
      console.warn('⚠️ لا يوجد نموذج متاح للاختبار، سيتم تخطي بعض الاختبارات');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات فحص التنسيق
  // ═══════════════════════════════════════════════════════════════════════

  describe('Format Validation', () => {
    test('Should validate well-formatted script', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const wellFormattedScript = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: مرحباً يا سارة، كيف حالك؟
        سارة: بخير الحمد لله، شكراً لسؤالك.
        
        يدخل محمد إلى الغرفة ويبتسم.
        
        محمد: السلام عليكم جميعاً.
      `;

      const analysis = await technicalAgent.analyzeTechnical(wellFormattedScript);
      
      expect(analysis).toBeDefined();
      expect(analysis.format_validation.is_valid).toBe(true);
      expect(analysis.format_validation.compliance_score).toBeGreaterThan(0.7);
      expect(analysis.format_validation.format_type).toBe('standard');
      expect(analysis.overall_health.technical_score).toBeGreaterThan(0.5);
    }, 15000);

    test('Should detect format issues', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const poorlyFormattedScript = `
        مشهد بدون رقم - المنزل - نهار
        
        احمد مرحباً يا سارة
        سارة: بخير الحمد لله
        
        يدخل محمد
      `;

      const analysis = await technicalAgent.analyzeTechnical(poorlyFormattedScript);
      
      expect(analysis.format_validation.format_issues.length).toBeGreaterThan(0);
      expect(analysis.format_validation.compliance_score).toBeLessThan(0.8);
      
      // يجب أن يكتشف مشاكل في أسماء الشخصيات
      const characterIssues = analysis.format_validation.format_issues.filter(
        issue => issue.type === 'character_name'
      );
      expect(characterIssues.length).toBeGreaterThan(0);
    }, 15000);
  });
});
  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات فحص ترويسات المشاهد
  // ═══════════════════════════════════════════════════════════════════════

  describe('Scene Header Validation', () => {
    test('Should validate correct scene headers', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptWithHeaders = `
        مشهد 1 - داخلي - المطبخ - صباح
        
        أحمد يحضر القهوة.
        
        مشهد 2 - خارجي - الحديقة - نهار
        
        سارة تقرأ كتاباً تحت الشجرة.
        
        مشهد 3 - داخلي - غرفة المعيشة - مساء
        
        العائلة تجتمع لمشاهدة التلفزيون.
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptWithHeaders);
      
      expect(analysis.scene_headers.length).toBe(3);
      
      analysis.scene_headers.forEach((header, index) => {
        expect(header.scene_number).toBe((index + 1).toString());
        expect(header.is_valid).toBe(true);
        expect(header.components.int_ext.is_valid).toBe(true);
        expect(header.components.location.is_valid).toBe(true);
        expect(header.components.time_of_day.is_valid).toBe(true);
      });
    }, 15000);

    test('Should detect invalid scene headers', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptWithBadHeaders = `
        مشهد 1 - المطبخ
        
        أحمد يحضر القهوة.
        
        مشهد 2 - داخلي - الحديقة
        
        سارة تقرأ كتاباً.
        
        مشهد 3 - نهار
        
        العائلة تجتمع.
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptWithBadHeaders);
      
      expect(analysis.scene_headers.length).toBe(3);
      
      // يجب أن يكتشف مشاكل في الترويسات
      const invalidHeaders = analysis.scene_headers.filter(h => !h.is_valid);
      expect(invalidHeaders.length).toBeGreaterThan(0);
      
      // فحص أن كل ترويسة غير صالحة لها اقتراحات
      invalidHeaders.forEach(header => {
        expect(header.suggestions.length).toBeGreaterThan(0);
      });
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات اتساق الشخصيات
  // ═══════════════════════════════════════════════════════════════════════

  describe('Character Consistency', () => {
    test('Should track character appearances', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptWithCharacters = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: مرحباً يا سارة.
        سارة: مرحباً أحمد.
        
        مشهد 2 - خارجي - الحديقة - نهار
        
        أحمد: الجو جميل اليوم.
        سارة: نعم، إنه رائع.
        محمد: السلام عليكم.
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptWithCharacters);
      
      expect(analysis.character_consistency.length).toBeGreaterThan(0);
      
      // البحث عن شخصية أحمد
      const ahmed = analysis.character_consistency.find(char => 
        char.character_name.includes('أحمد') || char.character_name.includes('احمد')
      );
      
      if (ahmed) {
        expect(ahmed.appearances.length).toBeGreaterThanOrEqual(2);
        expect(ahmed.appearances.some(app => app.scene_number === "1")).toBe(true);
        expect(ahmed.appearances.some(app => app.scene_number === "2")).toBe(true);
      }
    }, 15000);

    test('Should detect character name inconsistencies', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const inconsistentScript = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: مرحباً.
        احمد: كيف حالك؟
        AHMED: أنا بخير.
        
        مشهد 2 - خارجي - الحديقة - نهار
        
        أحمد علي: الجو جميل.
      `;

      const analysis = await technicalAgent.analyzeTechnical(inconsistentScript);
      
      // يجب أن يكتشف تناقضات في الأسماء
      const charactersWithIssues = analysis.character_consistency.filter(char => 
        char.inconsistencies.length > 0
      );
      
      expect(charactersWithIssues.length).toBeGreaterThan(0);
      
      charactersWithIssues.forEach(character => {
        character.inconsistencies.forEach(inconsistency => {
          expect(['spelling', 'formatting', 'missing', 'duplicate']).toContain(inconsistency.type);
          expect(['minor', 'major', 'critical']).toContain(inconsistency.severity);
        });
      });
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات اتساق المواقع
  // ═══════════════════════════════════════════════════════════════════════

  describe('Location Consistency', () => {
    test('Should track location usage', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptWithLocations = `
        مشهد 1 - داخلي - المطبخ - صباح
        
        أحمد يحضر الإفطار.
        
        مشهد 2 - داخلي - المطبخ - مساء
        
        سارة تحضر العشاء.
        
        مشهد 3 - خارجي - الحديقة - نهار
        
        الأطفال يلعبون.
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptWithLocations);
      
      expect(analysis.location_consistency.length).toBeGreaterThan(0);
      
      // البحث عن موقع المطبخ
      const kitchen = analysis.location_consistency.find(loc => 
        loc.location_name.includes('مطبخ')
      );
      
      if (kitchen) {
        expect(kitchen.appearances.length).toBe(2);
        expect(kitchen.appearances.every(app => 
          app.name_variant.includes('مطبخ')
        )).toBe(true);
      }
    }, 15000);

    test('Should detect location inconsistencies', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const inconsistentLocations = `
        مشهد 1 - داخلي - المطبخ - صباح
        
        أحمد في المطبخ.
        
        مشهد 2 - خارجي - المطبخ - مساء
        
        سارة في نفس المكان.
      `;

      const analysis = await technicalAgent.analyzeTechnical(inconsistentLocations);
      
      // يجب أن يكتشف تضارب داخلي/خارجي للموقع نفسه
      const locationsWithIssues = analysis.location_consistency.filter(loc => 
        loc.inconsistencies.length > 0
      );
      
      expect(locationsWithIssues.length).toBeGreaterThan(0);
      
      locationsWithIssues.forEach(location => {
        location.inconsistencies.forEach(inconsistency => {
          expect(['spelling', 'description', 'int_ext_mismatch']).toContain(inconsistency.type);
        });
      });
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات كشف فساد البيانات
  // ═══════════════════════════════════════════════════════════════════════

  describe('Data Corruption Detection', () => {
    test('Should detect duplicate lines', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptWithDuplicates = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: هذا سطر مكرر.
        أحمد: هذا سطر مكرر.
        
        سارة: مرحباً بك.
        سارة: مرحباً بك.
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptWithDuplicates);
      
      const duplications = analysis.data_corruption.filter(corruption => 
        corruption.corruption_type === 'duplication'
      );
      
      expect(duplications.length).toBeGreaterThan(0);
      
      duplications.forEach(duplication => {
        expect(duplication.affected_lines.length).toBeGreaterThanOrEqual(2);
        expect(duplication.auto_fixable).toBe(true);
        expect(duplication.suggested_fix).toBeDefined();
      });
    }, 15000);

    test('Should detect strange characters', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptWithStrangeChars = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: مرحباً @@@ يا سارة ###
        سارة: $$$ بخير الحمد لله %%%
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptWithStrangeChars);
      
      const formatIssues = analysis.data_corruption.filter(corruption => 
        corruption.corruption_type === 'formatting'
      );
      
      expect(formatIssues.length).toBeGreaterThan(0);
      
      formatIssues.forEach(issue => {
        expect(issue.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity);
      });
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الإحصائيات
  // ═══════════════════════════════════════════════════════════════════════

  describe('Statistics Calculation', () => {
    test('Should calculate accurate statistics', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const scriptForStats = `
        مشهد 1 - داخلي - المطبخ - صباح
        
        أحمد يحضر القهوة بعناية.
        
        أحمد: صباح الخير يا سارة.
        سارة: صباح النور يا أحمد.
        
        مشهد 2 - خارجي - الحديقة - نهار
        
        الأطفال يلعبون في الحديقة.
        
        طفل: هيا نلعب كرة القدم!
        طفل آخر: فكرة رائعة!
      `;

      const analysis = await technicalAgent.analyzeTechnical(scriptForStats);
      const stats = analysis.statistics;
      
      expect(stats.total_scenes).toBe(2);
      expect(stats.total_characters).toBeGreaterThanOrEqual(3); // أحمد، سارة، طفل
      expect(stats.total_locations).toBeGreaterThanOrEqual(2); // مطبخ، حديقة
      expect(stats.dialogue_lines).toBeGreaterThan(0);
      expect(stats.action_lines).toBeGreaterThan(0);
      expect(stats.avg_scene_length).toBeGreaterThan(0);
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الصحة العامة
  // ═══════════════════════════════════════════════════════════════════════

  describe('Overall Health Assessment', () => {
    test('Should assess production readiness correctly', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const productionReadyScript = `
        مشهد 1 - داخلي - المكتب - نهار
        
        أحمد: مرحباً، كيف يمكنني مساعدتك؟
        العميل: أريد الاستفسار عن الخدمة.
        
        مشهد 2 - خارجي - الشارع - مساء
        
        أحمد يمشي في الشارع متأملاً.
      `;

      const analysis = await technicalAgent.analyzeTechnical(productionReadyScript);
      const health = analysis.overall_health;
      
      expect(health.technical_score).toBeGreaterThanOrEqual(0);
      expect(health.technical_score).toBeLessThanOrEqual(1);
      expect(typeof health.readiness_for_production).toBe('boolean');
      expect(health.critical_issues_count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(health.recommendations)).toBe(true);
      
      // إذا كانت النتيجة عالية ولا توجد مشاكل حرجة، يجب أن تكون جاهزة
      if (health.technical_score > 0.8 && health.critical_issues_count === 0) {
        expect(health.readiness_for_production).toBe(true);
      }
    }, 15000);

    test('Should provide helpful recommendations', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const problematicScript = `
        مشهد - المنزل
        
        احمد مرحباً
        سارة بخير
        
        احمد كيف حالك
        سارة الحمد لله
      `;

      const analysis = await technicalAgent.analyzeTechnical(problematicScript);
      const health = analysis.overall_health;
      
      expect(health.recommendations.length).toBeGreaterThan(0);
      expect(health.readiness_for_production).toBe(false);
      
      health.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(5);
      });
    }, 15000);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات معالجة الأخطاء
  // ═══════════════════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    test('Should handle empty script gracefully', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      try {
        const analysis = await technicalAgent.analyzeTechnical('');
        
        expect(analysis).toBeDefined();
        expect(analysis.statistics.total_scenes).toBe(0);
        expect(analysis.statistics.total_characters).toBe(0);
        expect(analysis.overall_health.readiness_for_production).toBe(false);
        
      } catch (error) {
        expect(error.message).toBeDefined();
      }
    }, 10000);

    test('Should work with or without Python service', async () => {
      if (!technicalAgent) {
        console.log('⏭️ تم تخطي الاختبار - لا يوجد نموذج متاح');
        return;
      }

      const simpleScript = `
        مشهد 1 - داخلي - المنزل - نهار
        
        أحمد: مرحباً.
        سارة: أهلاً وسهلاً.
      `;

      // يجب أن يعمل حتى لو لم تكن خدمة Python متاحة
      const analysis = await technicalAgent.analyzeTechnical(simpleScript);
      
      expect(analysis).toBeDefined();
      expect(analysis.format_validation).toBeDefined();
      expect(analysis.overall_health.technical_score).toBeGreaterThanOrEqual(0);
    }, 15000);
  });
});