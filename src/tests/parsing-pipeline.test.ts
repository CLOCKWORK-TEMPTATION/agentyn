/**
 * اختبارات خصائص طبقة تحليل النصوص
 * Property-Based Tests for Parsing Pipeline
 * 
 * **Feature: three-read-breakdown-system, Property 14: Parsing Pipeline Robustness**
 * **Validates: Requirements - Input Processing**
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { ScriptParser, ScriptFormat, ParsingResult, ParsedScene } from '../parsing/script-parser.js';

// ═══════════════════════════════════════════════════════════════════════════
// مولدات البيانات للاختبار
// ═══════════════════════════════════════════════════════════════════════════

// مولد ترويسات المشاهد
const sceneHeaderGenerator = fc.record({
  sceneNumber: fc.option(fc.integer({ min: 1, max: 100 }).map(n => n.toString())),
  intExt: fc.constantFrom('داخلي', 'خارجي', 'INT', 'EXT', 'int.', 'ext.'),
  location: fc.string({ minLength: 3, maxLength: 30 }).filter(s => !s.includes('\n')),
  timeOfDay: fc.constantFrom('نهار', 'ليل', 'DAY', 'NIGHT', 'dawn', 'dusk', 'continuous')
});

// مولد محتوى المشاهد
const sceneContentGenerator = fc.record({
  header: sceneHeaderGenerator,
  dialogue: fc.array(
    fc.record({
      character: fc.string({ minLength: 2, maxLength: 20 }).filter(s => !s.includes(':')),
      line: fc.string({ minLength: 5, maxLength: 100 }).filter(s => !s.includes('\n'))
    }),
    { maxLength: 5 }
  ),
  actions: fc.array(
    fc.string({ minLength: 10, maxLength: 200 }).filter(s => !s.includes('\n')),
    { maxLength: 3 }
  )
});

// مولد سيناريوهات كاملة
const scriptGenerator = fc.record({
  title: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
  scenes: fc.array(sceneContentGenerator, { minLength: 1, maxLength: 10 })
});

// ═══════════════════════════════════════════════════════════════════════════
// مساعدات إنشاء النصوص
// ═══════════════════════════════════════════════════════════════════════════

function generateSceneText(scene: any): string {
  const { header, dialogue, actions } = scene;
  
  // إنشاء ترويسة المشهد
  let headerText = '';
  if (header.sceneNumber) {
    headerText += `مشهد ${header.sceneNumber} - `;
  }
  headerText += `${header.intExt} - ${header.location} - ${header.timeOfDay}`;
  
  // إنشاء محتوى المشهد
  const content = [headerText, ''];
  
  // إضافة الحوار والأفعال بالتناوب
  const maxItems = Math.max(dialogue.length, actions.length);
  for (let i = 0; i < maxItems; i++) {
    if (i < actions.length) {
      content.push(actions[i]);
      content.push('');
    }
    if (i < dialogue.length) {
      content.push(`${dialogue[i].character}: ${dialogue[i].line}`);
      content.push('');
    }
  }
  
  return content.join('\n');
}

function generateScriptText(script: any): string {
  const parts = [];
  
  if (script.title) {
    parts.push(script.title);
    parts.push('');
    parts.push('');
  }
  
  script.scenes.forEach((scene: any, index: number) => {
    if (index > 0) {
      parts.push('');
      parts.push('');
    }
    parts.push(generateSceneText(scene));
  });
  
  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الخصائص
// ═══════════════════════════════════════════════════════════════════════════

describe('Property-Based Tests: Parsing Pipeline Robustness', () => {
  
  /**
   * **Feature: three-read-breakdown-system, Property 14: Parsing Pipeline Robustness**
   * لأي سيناريو مُحمل، يجب أن ينجح Parser في استخراج مشاهد صالحة أو يُرجع أخطاء واضحة
   */
  test('Property 14: Parsing Pipeline Robustness - Valid scenes or clear errors', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        const result = ScriptParser.parseScript(scriptText);
        
        // الخاصية الأساسية: إما مشاهد صالحة أو أخطاء واضحة
        const hasValidScenes = result.scenes.length > 0;
        const hasClearErrors = result.parsing_errors.length > 0;
        
        expect(hasValidScenes || hasClearErrors).toBe(true);
        
        // إذا كانت هناك مشاهد، يجب أن تكون صالحة
        if (hasValidScenes) {
          result.scenes.forEach(scene => {
            expect(scene.id).toBeDefined();
            expect(scene.number).toBeDefined();
            expect(scene.header).toBeDefined();
            expect(scene.content).toBeDefined();
            expect(scene.span_start).toBeGreaterThanOrEqual(0);
            expect(scene.span_end).toBeGreaterThan(scene.span_start);
            expect(scene.parsing_confidence).toBeGreaterThanOrEqual(0);
            expect(scene.parsing_confidence).toBeLessThanOrEqual(1);
          });
        }
        
        // إذا كانت هناك أخطاء، يجب أن تكون واضحة
        if (hasClearErrors) {
          result.parsing_errors.forEach(error => {
            expect(error.type).toBeDefined();
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(0);
            expect(error.severity).toMatch(/^(warning|error|critical)$/);
          });
        }
        
        // التحقق من البيانات الوصفية
        expect(result.metadata).toBeDefined();
        expect(result.metadata.total_lines).toBeGreaterThanOrEqual(0);
        expect(result.metadata.total_characters).toBeGreaterThanOrEqual(0);
        expect(result.parsing_confidence).toBeGreaterThanOrEqual(0);
        expect(result.parsing_confidence).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  test('Property: Scene extraction consistency', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        const result = ScriptParser.parseScript(scriptText);
        
        // يجب أن يكون عدد المشاهد المستخرجة منطقياً
        expect(result.scenes.length).toBeLessThanOrEqual(script.scenes.length + 1);
        
        // كل مشهد يجب أن يحتوي على محتوى
        result.scenes.forEach(scene => {
          expect(scene.content.length).toBeGreaterThan(0);
        });
        
        // المشاهد يجب أن تكون مرتبة حسب الموقع في النص
        for (let i = 1; i < result.scenes.length; i++) {
          expect(result.scenes[i].span_start).toBeGreaterThanOrEqual(
            result.scenes[i-1].span_start
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Property: Character extraction accuracy', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        const result = ScriptParser.parseScript(scriptText);
        
        // جمع جميع الشخصيات المتوقعة
        const expectedCharacters = new Set<string>();
        script.scenes.forEach((scene: any) => {
          scene.dialogue.forEach((d: any) => {
            expectedCharacters.add(d.character);
          });
        });
        
        // التحقق من استخراج الشخصيات
        if (expectedCharacters.size > 0) {
          expect(result.characters.length).toBeGreaterThan(0);
          
          // على الأقل بعض الشخصيات يجب أن تكون مستخرجة
          const extractedSet = new Set(result.characters);
          const intersection = new Set([...expectedCharacters].filter(x => extractedSet.has(x)));
          expect(intersection.size).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Property: Parsing confidence correlation', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        const result = ScriptParser.parseScript(scriptText);
        
        // الثقة يجب أن ترتبط بجودة المحتوى
        const hasScenes = result.scenes.length > 0;
        const hasCharacters = result.characters.length > 0;
        const hasErrors = result.parsing_errors.filter(e => e.severity === 'critical').length > 0;
        
        if (hasScenes && hasCharacters && !hasErrors) {
          expect(result.parsing_confidence).toBeGreaterThan(0.3);
        }
        
        if (hasErrors) {
          expect(result.parsing_confidence).toBeLessThan(0.8);
        }
      }),
      { numRuns: 100 }
    );
  });

  test('Property: Empty input handling', () => {
    fc.assert(
      fc.property(fc.constantFrom('', '   ', '\n\n\n', '\t\t'), (emptyText) => {
        const result = ScriptParser.parseScript(emptyText);
        
        // النص الفارغ يجب أن يُعامل بشكل صحيح
        expect(result).toBeDefined();
        expect(result.parsing_confidence).toBeLessThan(0.5);
        
        // يجب أن يكون هناك إما مشهد افتراضي أو خطأ واضح
        const hasDefaultScene = result.scenes.length > 0;
        const hasError = result.parsing_errors.some(e => e.severity === 'critical');
        
        expect(hasDefaultScene || hasError).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  test('Property: Format detection consistency', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        
        // اختبار مع أسماء ملفات مختلفة
        const formats = [
          { filename: 'script.txt', expectedFormat: 'txt' },
          { filename: 'script.fdx', expectedFormat: 'fdx' },
          { filename: 'script.fountain', expectedFormat: 'fountain' }
        ];
        
        formats.forEach(({ filename, expectedFormat }) => {
          const result = ScriptParser.parseScript(scriptText, filename);
          
          // التنسيق المكتشف يجب أن يكون منطقياً
          expect(result.format).toBeDefined();
          
          // إذا كان الملف له امتداد محدد، يجب اكتشافه
          if (filename.endsWith('.txt')) {
            expect(result.format).toBe('txt');
          }
        });
      }),
      { numRuns: 50 }
    );
  });

  test('Property: Error message quality', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 1000 }),
        (randomText) => {
          const result = ScriptParser.parseScript(randomText);
          
          // جميع رسائل الخطأ يجب أن تكون مفيدة
          result.parsing_errors.forEach(error => {
            expect(error.message).toBeDefined();
            expect(error.message.length).toBeGreaterThan(5);
            expect(error.type).toMatch(/^(format_error|ocr_error|structure_error|encoding_error)$/);
            
            // الأخطاء الحرجة يجب أن تحتوي على اقتراحات
            if (error.severity === 'critical' || error.severity === 'error') {
              expect(error.suggestion || error.message.includes('تأكد') || error.message.includes('أضف')).toBeTruthy();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Scene span accuracy', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        const result = ScriptParser.parseScript(scriptText);
        
        // جميع المشاهد يجب أن تحتوي على spans صحيحة
        result.scenes.forEach(scene => {
          expect(scene.span_start).toBeGreaterThanOrEqual(0);
          expect(scene.span_end).toBeGreaterThan(scene.span_start);
          expect(scene.span_end).toBeLessThanOrEqual(scriptText.length);
          
          // النص المستخرج يجب أن يطابق المحتوى
          const extractedText = scriptText.substring(scene.span_start, scene.span_end);
          expect(extractedText.length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  test('Property: Metadata accuracy', () => {
    fc.assert(
      fc.property(scriptGenerator, (script) => {
        const scriptText = generateScriptText(script);
        const result = ScriptParser.parseScript(scriptText);
        
        // البيانات الوصفية يجب أن تكون دقيقة
        expect(result.metadata.total_characters).toBe(scriptText.length);
        expect(result.metadata.total_lines).toBe(scriptText.split('\n').length);
        expect(result.metadata.estimated_pages).toBeGreaterThan(0);
        
        // اللغة يجب أن تكون محددة بشكل صحيح
        expect(result.metadata.language).toMatch(/^(ar|en|mixed)$/);
        
        // وجود أرقام المشاهد
        const hasSceneNumbers = result.scenes.some(s => /^\d+$/.test(s.number));
        expect(result.metadata.has_scene_numbers).toBe(hasSceneNumbers);
        
        // وجود أسماء الشخصيات
        expect(result.metadata.has_character_names).toBe(result.characters.length > 0);
      }),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// اختبارات الحالات الحدية
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases: Parsing Pipeline', () => {
  
  test('Should handle malformed scene headers', () => {
    const malformedScripts = [
      'مشهد - - نهار',
      'داخلي',
      'خارجي - - -',
      'INT. - DAY',
      'مشهد ١٠٠٠ - داخلي - مكان غير موجود - وقت غير معروف'
    ];
    
    malformedScripts.forEach(script => {
      const result = ScriptParser.parseScript(script);
      expect(result).toBeDefined();
      expect(result.parsing_confidence).toBeLessThan(1.0);
    });
  });

  test('Should handle very long scripts', () => {
    const longScript = Array(1000).fill('مشهد طويل جداً مع محتوى كثير').join('\n');
    const result = ScriptParser.parseScript(longScript);
    
    expect(result).toBeDefined();
    expect(result.metadata.total_characters).toBe(longScript.length);
  });

  test('Should handle scripts with mixed languages', () => {
    const mixedScript = `
      مشهد 1 - داخلي - المكتب - نهار
      
      أحمد: Hello, how are you?
      Sarah: أنا بخير، شكراً
      
      SCENE 2 - EXT. GARDEN - DAY
      
      محمد: This is a mixed language script
    `;
    
    const result = ScriptParser.parseScript(mixedScript);
    expect(result.metadata.language).toBe('mixed');
    expect(result.characters.length).toBeGreaterThan(0);
  });

  test('Should handle special characters and formatting', () => {
    const specialScript = `
      مشهد ١ - داخلي - المكتب - نهار
      
      أحمد: "هذا نص بعلامات اقتباس"
      سارة: (همساً) هذا سر...
      
      [ملاحظة إخراجية]
      
      محمد: نص مع أرقام ١٢٣ و symbols @#$%
    `;
    
    const result = ScriptParser.parseScript(specialScript);
    expect(result.scenes.length).toBeGreaterThan(0);
    expect(result.characters.length).toBeGreaterThan(0);
  });
});