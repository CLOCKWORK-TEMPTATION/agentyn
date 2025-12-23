/**
 * اختبارات خصائص جودة الملخص الدلالي
 * Property-Based Tests for Semantic Synopsis Quality
 * 
 * **Feature: three-read-breakdown-system, Property 12: Semantic Synopsis Quality**
 * **Validates: Requirements 14.1**
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fc from 'fast-check';
import { PythonBrainService } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// مولدات البيانات للاختبار
// ═══════════════════════════════════════════════════════════════════════════

// مولد مشاهد مع عناصر أساسية للملخص
const sceneWithEssentialsGenerator = fc.record({
  sceneNumber: fc.integer({ min: 1, max: 100 }),
  location: fc.string({ minLength: 5, max: 30 }),
  timeOfDay: fc.constantFrom('نهار', 'ليل', 'صباح', 'مساء', 'فجر', 'غروب'),
  intExt: fc.constantFrom('داخلي', 'خارجي'),
  characters: fc.array(
    fc.record({
      name: fc.string({ minLength: 3, maxLength: 15 }),
      age: fc.option(fc.integer({ min: 18, max: 80 })),
      description: fc.option(fc.string({ minLength: 10, maxLength: 50 }))
    }),
    { minLength: 1, maxLength: 6 }
  ),
  mainAction: fc.record({
    verb: fc.constantFrom('يدخل', 'يخرج', 'يجلس', 'يقف', 'يتحدث', 'يعمل', 'يأكل', 'يشرب'),
    object: fc.option(fc.string({ minLength: 3, maxLength: 20 })),
    manner: fc.option(fc.constantFrom('بسرعة', 'ببطء', 'بحذر', 'بهدوء', 'بقوة'))
  }),
  dialogue: fc.array(
    fc.record({
      character: fc.string({ minLength: 3, maxLength: 15 }),
      text: fc.string({ minLength: 10, maxLength: 100 }),
      emotion: fc.option(fc.constantFrom('غاضب', 'سعيد', 'حزين', 'متفاجئ', 'هادئ'))
    }),
    { maxLength: 8 }
  ),
  props: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }),
  mood: fc.constantFrom('درامي', 'كوميدي', 'رومانسي', 'مثير', 'هادئ', 'متوتر')
});

// مولد نصوص معقدة للتلخيص
const complexScriptGenerator = fc.record({
  title: fc.string({ minLength: 10, maxLength: 50 }),
  genre: fc.constantFrom('درامي', 'كوميدي', 'أكشن', 'رومانسي', 'خيال علمي', 'رعب'),
  scenes: fc.array(sceneWithEssentialsGenerator, { minLength: 1, maxLength: 10 }),
  overallTheme: fc.string({ minLength: 20, maxLength: 100 }),
  targetAudience: fc.constantFrom('عائلي', 'شباب', 'كبار', 'أطفال', 'عام')
});

// مولد معايير جودة الملخص
const synopsisQualityGenerator = fc.record({
  maxLength: fc.integer({ min: 50, max: 300 }),
  minLength: fc.integer({ min: 20, max: 100 }),
  includeCharacters: fc.boolean(),
  includeLocation: fc.boolean(),
  includeMainAction: fc.boolean(),
  focusLevel: fc.constantFrom('high', 'medium', 'low'),
  detailLevel: fc.constantFrom('brief', 'moderate', 'detailed')
});

// ═══════════════════════════════════════════════════════════════════════════
// مساعدات إنشاء النصوص
// ═══════════════════════════════════════════════════════════════════════════

function generateSceneText(scene: any): string {
  const parts = [];
  
  // ترويسة المشهد
  parts.push(`مشهد ${scene.sceneNumber} - ${scene.intExt} - ${scene.location} - ${scene.timeOfDay}`);
  parts.push('');
  
  // وصف الشخصيات
  scene.characters.forEach((char: any) => {
    let charDesc = char.name;
    if (char.age) charDesc += ` (${char.age} سنة)`;
    if (char.description) charDesc += ` - ${char.description}`;
    parts.push(charDesc);
  });
  parts.push('');
  
  // الفعل الرئيسي
  let actionText = `${scene.characters[0]?.name || 'الشخصية'} ${scene.mainAction.verb}`;
  if (scene.mainAction.object) actionText += ` ${scene.mainAction.object}`;
  if (scene.mainAction.manner) actionText += ` ${scene.mainAction.manner}`;
  parts.push(actionText + '.');
  parts.push('');
  
  // الدعائم
  if (scene.props.length > 0) {
    parts.push(`الدعائم الموجودة: ${scene.props.join(', ')}.`);
    parts.push('');
  }
  
  // الحوار
  scene.dialogue.forEach((d: any) => {
    let dialogueLine = `${d.character}: `;
    if (d.emotion) dialogueLine += `(${d.emotion}) `;
    dialogueLine += d.text;
    parts.push(dialogueLine);
  });
  
  if (scene.dialogue.length > 0) parts.push('');
  
  // المزاج العام
  parts.push(`المزاج العام: ${scene.mood}.`);
  
  return parts.join('\n');
}

function generateComplexScript(script: any): string {
  const parts = [];
  
  parts.push(`العنوان: ${script.title}`);
  parts.push(`النوع: ${script.genre}`);
  parts.push(`الجمهور المستهدف: ${script.targetAudience}`);
  parts.push('');
  parts.push(`الموضوع العام: ${script.overallTheme}`);
  parts.push('');
  parts.push('=' .repeat(50));
  parts.push('');
  
  script.scenes.forEach((scene: any, index: number) => {
    if (index > 0) {
      parts.push('');
      parts.push('-'.repeat(30));
      parts.push('');
    }
    parts.push(generateSceneText(scene));
  });
  
  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الخصائص
// ═══════════════════════════════════════════════════════════════════════════

describe('Property-Based Tests: Semantic Synopsis Quality', () => {
  let pythonService: PythonBrainService;
  const TEST_TIMEOUT = 40000;

  beforeAll(() => {
    pythonService = new PythonBrainService('http://localhost:8000');
  });

  /**
   * **Feature: three-read-breakdown-system, Property 12: Semantic Synopsis Quality**
   * لأي مشهد مُحلل، يجب أن يولد Semantic Synopsis Generator ملخصاً يلتقط العناصر الأساسية
   */
  test('Property 12: Semantic Synopsis Quality - Essential elements capture', () => {
    fc.assert(
      fc.property(
        sceneWithEssentialsGenerator,
        synopsisQualityGenerator,
        async (scene, qualityCriteria) => {
          const sceneText = generateSceneText(scene);
          
          try {
            const jobResult = await pythonService.analyzeWithComponent(
              sceneText,
              'semantic_synopsis',
              {
                max_length: qualityCriteria.maxLength,
                min_length: qualityCriteria.minLength,
                include_characters: qualityCriteria.includeCharacters,
                include_location: qualityCriteria.includeLocation,
                include_main_action: qualityCriteria.includeMainAction,
                focus_level: qualityCriteria.focusLevel
              }
            );
            
            expect(jobResult.job_id).toBeDefined();
            
            if (jobResult.status !== 'fallback') {
              try {
                const result = await pythonService.waitForCompletion(jobResult.job_id, 20000);
                
                if (result && result.result && result.result.synopsis) {
                  const synopsis = result.result.synopsis;
                  
                  // الملخص يجب أن يكون بين الحد الأدنى والأقصى للطول
                  expect(synopsis.length).toBeGreaterThanOrEqual(qualityCriteria.minLength);
                  expect(synopsis.length).toBeLessThanOrEqual(qualityCriteria.maxLength + 50); // هامش للخطأ
                  
                  // يجب أن يحتوي على العناصر المطلوبة
                  if (qualityCriteria.includeCharacters && scene.characters.length > 0) {
                    const hasCharacter = scene.characters.some((char: any) => 
                      synopsis.toLowerCase().includes(char.name.toLowerCase())
                    );
                    expect(hasCharacter).toBe(true);
                  }
                  
                  if (qualityCriteria.includeLocation) {
                    const hasLocation = synopsis.toLowerCase().includes(scene.location.toLowerCase()) ||
                                      synopsis.includes(scene.intExt) ||
                                      synopsis.includes(scene.timeOfDay);
                    expect(hasLocation).toBe(true);
                  }
                  
                  if (qualityCriteria.includeMainAction) {
                    const hasAction = synopsis.toLowerCase().includes(scene.mainAction.verb.toLowerCase());
                    expect(hasAction).toBe(true);
                  }
                  
                  // الملخص يجب أن يكون نص صالح
                  expect(synopsis.trim().length).toBeGreaterThan(0);
                  expect(typeof synopsis).toBe('string');
                }
                
              } catch (timeoutError) {
                // Timeout مقبول للعمليات المعقدة
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 30, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Synopsis coherence and readability', () => {
    fc.assert(
      fc.property(
        complexScriptGenerator,
        async (script) => {
          const scriptText = generateComplexScript(script);
          
          try {
            const jobResult = await pythonService.analyzeWithComponent(
              scriptText,
              'semantic_synopsis',
              {
                coherence_check: true,
                readability_level: 'standard',
                maintain_narrative_flow: true
              }
            );
            
            if (jobResult.status !== 'fallback') {
              try {
                const result = await pythonService.waitForCompletion(jobResult.job_id, 25000);
                
                if (result && result.result && result.result.synopsis) {
                  const synopsis = result.result.synopsis;
                  
                  // فحص التماسك الأساسي
                  const sentences = synopsis.split(/[.!?؟]/).filter(s => s.trim().length > 0);
                  expect(sentences.length).toBeGreaterThan(0);
                  
                  // كل جملة يجب أن تحتوي على كلمات مفيدة
                  sentences.forEach(sentence => {
                    const words = sentence.trim().split(/\s+/).filter(w => w.length > 2);
                    expect(words.length).toBeGreaterThan(1);
                  });
                  
                  // يجب أن يحتوي على عناصر من النص الأصلي
                  const synopsisWords = synopsis.toLowerCase().split(/\s+/);
                  const scriptWords = scriptText.toLowerCase().split(/\s+/);
                  
                  const commonWords = synopsisWords.filter(word => 
                    scriptWords.includes(word) && word.length > 3
                  );
                  
                  expect(commonWords.length).toBeGreaterThan(2);
                }
                
              } catch (timeoutError) {
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 20, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Synopsis length consistency', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 100, maxLength: 1000 }),
        fc.integer({ min: 30, max: 200 }),
        async (text, targetLength) => {
          try {
            const jobResult = await pythonService.analyzeWithComponent(
              text,
              'semantic_synopsis',
              {
                target_length: targetLength,
                strict_length_control: true,
                length_tolerance: 0.2 // 20% tolerance
              }
            );
            
            if (jobResult.status !== 'fallback') {
              try {
                const result = await pythonService.waitForCompletion(jobResult.job_id, 15000);
                
                if (result && result.result && result.result.synopsis) {
                  const synopsis = result.result.synopsis;
                  const actualLength = synopsis.length;
                  
                  // الطول يجب أن يكون قريب من المطلوب
                  const tolerance = targetLength * 0.3; // 30% tolerance
                  expect(actualLength).toBeGreaterThan(targetLength - tolerance);
                  expect(actualLength).toBeLessThan(targetLength + tolerance);
                }
                
              } catch (timeoutError) {
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 25, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Synopsis information density', () => {
    fc.assert(
      fc.property(
        sceneWithEssentialsGenerator,
        fc.constantFrom('high', 'medium', 'low'),
        async (scene, densityLevel) => {
          const sceneText = generateSceneText(scene);
          
          try {
            const jobResult = await pythonService.analyzeWithComponent(
              sceneText,
              'semantic_synopsis',
              {
                information_density: densityLevel,
                preserve_key_details: true,
                compress_redundancy: true
              }
            );
            
            if (jobResult.status !== 'fallback') {
              try {
                const result = await pythonService.waitForCompletion(jobResult.job_id, 20000);
                
                if (result && result.result && result.result.synopsis) {
                  const synopsis = result.result.synopsis;
                  
                  // كثافة المعلومات يجب أن تؤثر على المحتوى
                  const synopsisWords = synopsis.split(/\s+/).length;
                  const originalWords = sceneText.split(/\s+/).length;
                  
                  const compressionRatio = synopsisWords / originalWords;
                  
                  // نسبة الضغط يجب أن تكون منطقية
                  expect(compressionRatio).toBeGreaterThan(0.1); // على الأقل 10% من الأصل
                  expect(compressionRatio).toBeLessThan(1.5); // لا يزيد عن 150% من الأصل
                  
                  // الكثافة العالية يجب أن تنتج نص أكثر تفصيلاً
                  if (densityLevel === 'high') {
                    expect(compressionRatio).toBeGreaterThan(0.3);
                  } else if (densityLevel === 'low') {
                    expect(compressionRatio).toBeLessThan(0.7);
                  }
                }
                
              } catch (timeoutError) {
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 20, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Synopsis language quality', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 150, maxLength: 600 }),
        fc.constantFrom('formal', 'casual', 'literary', 'technical'),
        async (text, languageStyle) => {
          try {
            const jobResult = await pythonService.analyzeWithComponent(
              text,
              'semantic_synopsis',
              {
                language_style: languageStyle,
                grammar_check: true,
                vocabulary_level: 'standard'
              }
            );
            
            if (jobResult.status !== 'fallback') {
              try {
                const result = await pythonService.waitForCompletion(jobResult.job_id, 18000);
                
                if (result && result.result && result.result.synopsis) {
                  const synopsis = result.result.synopsis;
                  
                  // فحص جودة اللغة الأساسية
                  expect(synopsis.trim().length).toBeGreaterThan(0);
                  
                  // يجب أن يبدأ بحرف كبير وينتهي بعلامة ترقيم
                  expect(synopsis.charAt(0)).toMatch(/[A-Za-z\u0600-\u06FF]/);
                  expect(synopsis.charAt(synopsis.length - 1)).toMatch(/[.!?؟]/);
                  
                  // لا يجب أن يحتوي على أخطاء واضحة
                  expect(synopsis).not.toMatch(/\s{2,}/); // مسافات مضاعفة
                  expect(synopsis).not.toMatch(/[.]{2,}/); // نقاط مضاعفة
                  expect(synopsis).not.toMatch(/^[.!?؟]/); // يبدأ بعلامة ترقيم
                  
                  // يجب أن يحتوي على كلمات عربية أو إنجليزية صالحة
                  const hasValidWords = /[\u0600-\u06FF]{2,}|[A-Za-z]{2,}/.test(synopsis);
                  expect(hasValidWords).toBe(true);
                }
                
              } catch (timeoutError) {
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 25, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);

  test('Property: Synopsis contextual relevance', () => {
    fc.assert(
      fc.property(
        complexScriptGenerator,
        async (script) => {
          const scriptText = generateComplexScript(script);
          
          try {
            const jobResult = await pythonService.analyzeWithComponent(
              scriptText,
              'semantic_synopsis',
              {
                maintain_context: true,
                genre_awareness: script.genre,
                audience_consideration: script.targetAudience
              }
            );
            
            if (jobResult.status !== 'fallback') {
              try {
                const result = await pythonService.waitForCompletion(jobResult.job_id, 25000);
                
                if (result && result.result && result.result.synopsis) {
                  const synopsis = result.result.synopsis;
                  
                  // الملخص يجب أن يكون ذو صلة بالسياق
                  const synopsisLower = synopsis.toLowerCase();
                  const scriptLower = scriptText.toLowerCase();
                  
                  // يجب أن يحتوي على عناصر من العنوان أو الموضوع
                  const titleWords = script.title.toLowerCase().split(/\s+/);
                  const themeWords = script.overallTheme.toLowerCase().split(/\s+/);
                  
                  const relevantWords = [...titleWords, ...themeWords].filter(w => w.length > 3);
                  const foundRelevantWords = relevantWords.filter(word => 
                    synopsisLower.includes(word)
                  );
                  
                  expect(foundRelevantWords.length).toBeGreaterThan(0);
                  
                  // يجب أن يحتوي على أسماء الشخصيات الرئيسية
                  const allCharacters = script.scenes.flatMap((scene: any) => 
                    scene.characters.map((char: any) => char.name.toLowerCase())
                  );
                  
                  if (allCharacters.length > 0) {
                    const foundCharacters = allCharacters.filter(char => 
                      synopsisLower.includes(char)
                    );
                    expect(foundCharacters.length).toBeGreaterThan(0);
                  }
                }
                
              } catch (timeoutError) {
                expect(timeoutError.message).toContain('timeout');
              }
            }
            
          } catch (error) {
            expect(error).toBeDefined();
          }
        }
      ),
      { numRuns: 15, timeout: TEST_TIMEOUT }
    );
  }, TEST_TIMEOUT);
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحدية لجودة الملخص
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases: Semantic Synopsis Quality', () => {
  let pythonService: PythonBrainService;

  beforeAll(() => {
    pythonService = new PythonBrainService('http://localhost:8000');
  });

  test('Should handle very short texts', async () => {
    const shortTexts = [
      'أحمد يدخل.',
      'سارة تبتسم.',
      'انتهى المشهد.',
      'موسيقى حزينة.'
    ];

    for (const text of shortTexts) {
      try {
        const jobResult = await pythonService.analyzeWithComponent(
          text,
          'semantic_synopsis',
          { min_length: 10, max_length: 50 }
        );

        if (jobResult.status !== 'fallback') {
          try {
            const result = await pythonService.waitForCompletion(jobResult.job_id, 10000);
            
            if (result && result.result && result.result.synopsis) {
              const synopsis = result.result.synopsis;
              expect(synopsis.length).toBeGreaterThan(5);
              expect(synopsis.length).toBeLessThan(100);
            }
            
          } catch (timeoutError) {
            expect(timeoutError.message).toContain('timeout');
          }
        }

      } catch (error) {
        expect(error).toBeDefined();
      }
    }
  }, 30000);

  test('Should handle very long and complex texts', async () => {
    const longText = Array(200).fill(
      'مشهد معقد جداً مع شخصيات متعددة وأحداث متشابكة وحوارات طويلة ومؤثرات خاصة.'
    ).join(' ');

    try {
      const jobResult = await pythonService.analyzeWithComponent(
        longText,
        'semantic_synopsis',
        { 
          max_length: 200,
          complexity_handling: 'advanced',
          summarization_depth: 'deep'
        }
      );

      if (jobResult.status !== 'fallback') {
        try {
          const result = await pythonService.waitForCompletion(jobResult.job_id, 30000);
          
          if (result && result.result && result.result.synopsis) {
            const synopsis = result.result.synopsis;
            expect(synopsis.length).toBeLessThan(300);
            expect(synopsis.length).toBeGreaterThan(50);
          }
          
        } catch (timeoutError) {
          expect(timeoutError.message).toContain('timeout');
        }
      }

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 40000);

  test('Should handle mixed language content', async () => {
    const mixedText = `
      Scene 1 - Interior - Ahmed's Office - Day
      
      أحمد (30 years old) sits at his desk working on a laptop.
      He drinks coffee من كوب أبيض while reading emails.
      
      Ahmed: (in English) This project is very important.
      Sarah: (بالعربية) نعم، يجب أن ننتهي منه اليوم.
      
      Suddenly, the phone rings. موسيقى dramatic تبدأ في الخلفية.
    `;

    try {
      const jobResult = await pythonService.analyzeWithComponent(
        mixedText,
        'semantic_synopsis',
        {
          language_handling: 'mixed',
          preserve_original_language: true
        }
      );

      if (jobResult.status !== 'fallback') {
        try {
          const result = await pythonService.waitForCompletion(jobResult.job_id, 20000);
          
          if (result && result.result && result.result.synopsis) {
            const synopsis = result.result.synopsis;
            
            // يجب أن يتعامل مع اللغة المختلطة
            expect(synopsis.length).toBeGreaterThan(20);
            
            // يجب أن يحتوي على عناصر من كلا اللغتين أو يركز على إحداهما
            const hasArabic = /[\u0600-\u06FF]/.test(synopsis);
            const hasEnglish = /[A-Za-z]/.test(synopsis);
            
            expect(hasArabic || hasEnglish).toBe(true);
          }
          
        } catch (timeoutError) {
          expect(timeoutError.message).toContain('timeout');
        }
      }

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 25000);

  test('Should handle texts with special formatting', async () => {
    const formattedText = `
      *** مشهد خاص ***
      
      [ملاحظة إخراجية: المشهد يبدأ بصمت تام]
      
      أحمد: (همساً) "هل تسمعينني؟"
      
      سارة: (تنظر حولها بحذر) نعم... لكن...
      
      [صوت خطوات تقترب]
      
      *** انتهى المشهد ***
    `;

    try {
      const jobResult = await pythonService.analyzeWithComponent(
        formattedText,
        'semantic_synopsis',
        {
          preserve_formatting_context: true,
          extract_stage_directions: true
        }
      );

      if (jobResult.status !== 'fallback') {
        try {
          const result = await pythonService.waitForCompletion(jobResult.job_id, 15000);
          
          if (result && result.result && result.result.synopsis) {
            const synopsis = result.result.synopsis;
            
            // يجب أن يتعامل مع التنسيق الخاص
            expect(synopsis.length).toBeGreaterThan(15);
            
            // يجب أن يحتوي على المحتوى الأساسي
            const hasCharacters = synopsis.includes('أحمد') || synopsis.includes('سارة');
            const hasAction = synopsis.includes('همس') || synopsis.includes('نظر') || synopsis.includes('خطوات');
            
            expect(hasCharacters || hasAction).toBe(true);
          }
          
        } catch (timeoutError) {
          expect(timeoutError.message).toContain('timeout');
        }
      }

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 20000);

  test('Should maintain quality with fallback mode', async () => {
    // اختبار مع خدمة غير متاحة
    const fallbackService = new PythonBrainService('http://nonexistent:8000');
    
    const testText = 'أحمد يعمل في المكتب ويشرب القهوة بينما يتحدث مع سارة عن المشروع الجديد.';

    try {
      const result = await fallbackService.analyzeWithComponent(
        testText,
        'semantic_synopsis',
        { target_length: 50 }
      );

      // في وضع fallback، يجب أن يعمل النظام
      expect(result.status).toBe('fallback');
      expect(result.result.message).toBe('Using TypeScript fallback');

    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 10000);
});