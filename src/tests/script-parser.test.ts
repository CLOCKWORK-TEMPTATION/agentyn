/**
 * اختبارات وحدة لمحلل السيناريوهات
 * Unit Tests for Script Parser
 */

import { describe, test, expect } from '@jest/globals';
import { ScriptParser, ScriptFormat } from '../parsing/script-parser.js';

describe('Script Parser Unit Tests', () => {

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التحليل الأساسي
  // ═══════════════════════════════════════════════════════════════════════

  describe('Basic Parsing', () => {
    test('should parse simple Arabic script', () => {
      const script = `
        مشهد 1 - داخلي - المكتب - نهار
        
        أحمد يجلس خلف المكتب ويقرأ الأوراق.
        
        أحمد: هذا تقرير مهم جداً.
        
        تدخل سارة حاملة كوب قهوة.
        
        سارة: أحضرت لك القهوة.
        أحمد: شكراً لك.
      `;

      const result = ScriptParser.parseScript(script);

      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].header.intExt).toBe('INT');
      expect(result.scenes[0].header.location).toBe('المكتب');
      expect(result.scenes[0].header.timeOfDay).toBe('DAY');
      expect(result.characters).toContain('أحمد');
      expect(result.characters).toContain('سارة');
      expect(result.parsing_confidence).toBeGreaterThan(0.5);
    });

    test('should parse simple English script', () => {
      const script = `
        SCENE 1 - INT. OFFICE - DAY
        
        JOHN sits behind the desk reading papers.
        
        JOHN: This is a very important report.
        
        SARAH enters carrying a cup of coffee.
        
        SARAH: I brought you coffee.
        JOHN: Thank you.
      `;

      const result = ScriptParser.parseScript(script);

      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0].header.intExt).toBe('INT');
      expect(result.scenes[0].header.location).toContain('OFFICE');
      expect(result.scenes[0].header.timeOfDay).toBe('DAY');
      expect(result.characters).toContain('JOHN');
      expect(result.characters).toContain('SARAH');
    });

    test('should parse multiple scenes', () => {
      const script = `
        مشهد 1 - داخلي - المكتب - نهار
        أحمد: مرحباً
        
        مشهد 2 - خارجي - الحديقة - ليل
        سارة: وداعاً
        
        مشهد 3 - داخلي - البيت - نهار
        محمد: أهلاً وسهلاً
      `;

      const result = ScriptParser.parseScript(script);

      expect(result.scenes).toHaveLength(3);
      expect(result.scenes[0].header.intExt).toBe('INT');
      expect(result.scenes[1].header.intExt).toBe('EXT');
      expect(result.scenes[2].header.intExt).toBe('INT');
      expect(result.characters).toHaveLength(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات كشف التنسيق
  // ═══════════════════════════════════════════════════════════════════════

  describe('Format Detection', () => {
    test('should detect TXT format', () => {
      const script = 'مشهد بسيط';
      const result = ScriptParser.parseScript(script, 'script.txt');
      expect(result.format).toBe(ScriptFormat.TXT);
    });

    test('should detect FDX format from filename', () => {
      const script = 'محتوى السيناريو';
      const result = ScriptParser.parseScript(script, 'script.fdx');
      expect(result.format).toBe(ScriptFormat.FDX);
    });

    test('should detect Fountain format from filename', () => {
      const script = 'محتوى السيناريو';
      const result = ScriptParser.parseScript(script, 'script.fountain');
      expect(result.format).toBe(ScriptFormat.FOUNTAIN);
    });

    test('should detect FDX format from content', () => {
      const script = '<?xml version="1.0"?><FinalDraft>content</FinalDraft>';
      const result = ScriptParser.parseScript(script);
      expect(result.format).toBe(ScriptFormat.FDX);
    });

    test('should detect Fountain format from content', () => {
      const script = 'Title: My Script\n\nFADE IN:\n\nINT. OFFICE - DAY';
      const result = ScriptParser.parseScript(script);
      expect(result.format).toBe(ScriptFormat.FOUNTAIN);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات ترويسات المشاهد
  // ═══════════════════════════════════════════════════════════════════════

  describe('Scene Header Parsing', () => {
    const testCases = [
      {
        input: 'مشهد 1 - داخلي - المكتب - نهار',
        expected: { intExt: 'INT', location: 'المكتب', timeOfDay: 'DAY' }
      },
      {
        input: 'خارجي - الحديقة - ليل',
        expected: { intExt: 'EXT', location: 'الحديقة', timeOfDay: 'NIGHT' }
      },
      {
        input: 'INT. OFFICE - DAY',
        expected: { intExt: 'INT', location: 'OFFICE', timeOfDay: 'DAY' }
      },
      {
        input: 'EXT. GARDEN - NIGHT',
        expected: { intExt: 'EXT', location: 'GARDEN', timeOfDay: 'NIGHT' }
      },
      {
        input: 'SCENE 5 - INT. KITCHEN - DAWN',
        expected: { intExt: 'INT', location: 'KITCHEN', timeOfDay: 'DAWN' }
      }
    ];

    testCases.forEach(({ input, expected }) => {
      test(`should parse scene header: ${input}`, () => {
        const result = ScriptParser.parseScript(input);
        
        expect(result.scenes).toHaveLength(1);
        expect(result.scenes[0].header.intExt).toBe(expected.intExt);
        expect(result.scenes[0].header.location).toContain(expected.location);
        expect(result.scenes[0].header.timeOfDay).toBe(expected.timeOfDay);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات استخراج الشخصيات
  // ═══════════════════════════════════════════════════════════════════════

  describe('Character Extraction', () => {
    test('should extract Arabic character names', () => {
      const script = `
        أحمد: مرحباً بك
        سارة: أهلاً وسهلاً
        محمد علي: كيف حالك؟
      `;

      const result = ScriptParser.parseScript(script);
      
      expect(result.characters).toContain('أحمد');
      expect(result.characters).toContain('سارة');
      expect(result.characters).toContain('محمد علي');
    });

    test('should extract English character names', () => {
      const script = `
        JOHN: Hello there
        SARAH: Hi
        MIKE SMITH: How are you?
      `;

      const result = ScriptParser.parseScript(script);
      
      expect(result.characters).toContain('JOHN');
      expect(result.characters).toContain('SARAH');
      expect(result.characters).toContain('MIKE SMITH');
    });

    test('should not extract false positives', () => {
      const script = `
        هذا نص يحتوي على: علامات ترقيم
        وأيضاً http://example.com رابط
        الساعة 12:30 مساءً
      `;

      const result = ScriptParser.parseScript(script);
      
      // يجب ألا يستخرج النص قبل علامات الترقيم كأسماء شخصيات
      expect(result.characters).not.toContain('علامات ترقيم');
      expect(result.characters).not.toContain('http');
      expect(result.characters).not.toContain('الساعة 12');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات التحقق من الأخطاء
  // ═══════════════════════════════════════════════════════════════════════

  describe('Error Detection', () => {
    test('should detect missing scenes', () => {
      const script = 'هذا نص بدون مشاهد واضحة';
      const result = ScriptParser.parseScript(script);
      
      const criticalErrors = result.parsing_errors.filter(e => e.severity === 'critical');
      expect(criticalErrors.length).toBeGreaterThan(0);
      expect(result.parsing_confidence).toBeLessThan(0.5);
    });

    test('should detect malformed scene headers', () => {
      const script = `
        مشهد - - 
        أحمد: مرحباً
      `;

      const result = ScriptParser.parseScript(script);
      
      const warnings = result.parsing_errors.filter(e => e.severity === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
    });

    test('should detect scenes without characters', () => {
      const script = `
        مشهد 1 - داخلي - المكتب - نهار
        
        هذا مشهد طويل بدون أي شخصيات أو حوار واضح.
        يحتوي على وصف فقط ولا يحتوي على أي حوار.
      `;

      const result = ScriptParser.parseScript(script);
      
      const warnings = result.parsing_errors.filter(e => 
        e.severity === 'warning' && e.message.includes('شخصيات')
      );
      expect(warnings.length).toBeGreaterThan(0);
    });

    test('should detect scene numbering issues', () => {
      const script = `
        مشهد 1 - داخلي - المكتب - نهار
        أحمد: مرحباً
        
        مشهد 5 - خارجي - الحديقة - ليل
        سارة: وداعاً
      `;

      const result = ScriptParser.parseScript(script);
      
      const warnings = result.parsing_errors.filter(e => 
        e.message.includes('تسلسل')
      );
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات البيانات الوصفية
  // ═══════════════════════════════════════════════════════════════════════

  describe('Metadata Extraction', () => {
    test('should calculate correct metadata', () => {
      const script = `مشهد 1 - داخلي - المكتب - نهار
أحمد: مرحباً
سارة: أهلاً`;

      const result = ScriptParser.parseScript(script);
      
      expect(result.metadata.total_characters).toBe(script.length);
      expect(result.metadata.total_lines).toBe(script.split('\n').length);
      expect(result.metadata.estimated_pages).toBeGreaterThan(0);
      expect(result.metadata.has_character_names).toBe(true);
      expect(result.metadata.has_scene_numbers).toBe(true);
    });

    test('should detect Arabic language', () => {
      const script = 'مشهد عربي مع شخصيات عربية';
      const result = ScriptParser.parseScript(script);
      
      expect(result.metadata.language).toBe('ar');
    });

    test('should detect English language', () => {
      const script = 'English scene with English characters';
      const result = ScriptParser.parseScript(script);
      
      expect(result.metadata.language).toBe('en');
    });

    test('should detect mixed language', () => {
      const script = 'مشهد مختلط with mixed languages';
      const result = ScriptParser.parseScript(script);
      
      expect(result.metadata.language).toBe('mixed');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الحالات الحدية
  // ═══════════════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    test('should handle empty script', () => {
      const result = ScriptParser.parseScript('');
      
      expect(result).toBeDefined();
      expect(result.parsing_confidence).toBeLessThan(0.5);
      expect(result.parsing_errors.length).toBeGreaterThan(0);
    });

    test('should handle whitespace-only script', () => {
      const result = ScriptParser.parseScript('   \n\n\t\t   ');
      
      expect(result).toBeDefined();
      expect(result.parsing_confidence).toBeLessThan(0.5);
    });

    test('should handle very short script', () => {
      const result = ScriptParser.parseScript('أحمد');
      
      expect(result).toBeDefined();
      expect(result.scenes.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle script with only dialogue', () => {
      const script = `
        أحمد: مرحباً
        سارة: أهلاً
        محمد: كيف حالكم؟
      `;

      const result = ScriptParser.parseScript(script);
      
      expect(result.characters.length).toBe(3);
      expect(result.scenes.length).toBeGreaterThan(0);
    });

    test('should handle script with special characters', () => {
      const script = `
        مشهد ١ - داخلي - المكتب - نهار
        
        أحمد: "هذا نص مع علامات اقتباس"
        سارة: (همساً) هذا سر...
        محمد: نص مع أرقام ١٢٣ ورموز @#$%
      `;

      const result = ScriptParser.parseScript(script);
      
      expect(result.scenes.length).toBeGreaterThan(0);
      expect(result.characters.length).toBe(3);
      expect(result.parsing_confidence).toBeGreaterThan(0.3);
    });

    test('should handle mixed Arabic and English numbers', () => {
      const script = `
        مشهد 1 - داخلي - المكتب - نهار
        مشهد ٢ - خارجي - الحديقة - ليل
        SCENE 3 - INT. HOUSE - DAY
      `;

      const result = ScriptParser.parseScript(script);
      
      expect(result.scenes.length).toBe(3);
      expect(result.metadata.has_scene_numbers).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // اختبارات الأداء
  // ═══════════════════════════════════════════════════════════════════════

  describe('Performance Tests', () => {
    test('should handle large scripts efficiently', () => {
      // إنشاء سيناريو كبير
      const scenes = [];
      for (let i = 1; i <= 100; i++) {
        scenes.push(`
          مشهد ${i} - داخلي - المكتب ${i} - نهار
          
          الشخصية${i}: هذا حوار للمشهد رقم ${i}
          الشخصية${i + 100}: رد على المشهد رقم ${i}
          
          وصف طويل للمشهد رقم ${i} مع تفاصيل كثيرة ومعلومات إضافية.
        `);
      }
      
      const largeScript = scenes.join('\n\n');
      
      const startTime = Date.now();
      const result = ScriptParser.parseScript(largeScript);
      const endTime = Date.now();
      
      expect(result.scenes.length).toBe(100);
      expect(result.characters.length).toBeGreaterThan(100);
      expect(endTime - startTime).toBeLessThan(5000); // أقل من 5 ثوانٍ
    });

    test('should maintain accuracy with complex formatting', () => {
      const complexScript = `
        FADE IN:
        
        مشهد ١ - داخلي - مكتب الشركة - صباح يوم الاثنين
        
        المكتب مزدحم بالموظفين. أصوات الطابعات والهواتف تملأ المكان.
        
        أحمد (٣٥ سنة، مدير المشروع): (يتحدث في الهاتف) نعم، سأرسل التقرير اليوم.
        
        تدخل سارة (٢٨ سنة، مطورة برمجيات) حاملة لابتوب وكوب قهوة.
        
        سارة: (تقترب من مكتب أحمد) صباح الخير، أحمد.
        
        أحمد: (ينهي المكالمة ويبتسم) صباح النور، سارة. كيف سار العمل على المشروع؟
        
        CUT TO:
        
        مشهد ٢ - خارجي - مقهى قريب من الشركة - نفس اليوم - الظهر
        
        أحمد وسارة يجلسان على طاولة خارجية. الجو مشمس والمقهى مزدحم.
      `;

      const result = ScriptParser.parseScript(complexScript);
      
      expect(result.scenes.length).toBe(2);
      expect(result.characters).toContain('أحمد');
      expect(result.characters).toContain('سارة');
      expect(result.scenes[0].header.intExt).toBe('INT');
      expect(result.scenes[1].header.intExt).toBe('EXT');
      expect(result.parsing_confidence).toBeGreaterThan(0.7);
    });
  });
});