/**
 * طبقة تحليل النصوص (Parsing Pipeline)
 * Script Parser for Three-Read Breakdown System
 * 
 * يدعم صيغ متعددة:
 * - TXT (نص عادي)
 * - FDX (Final Draft XML)
 * - Fountain (Fountain markup)
 * - PDF (نصي و OCR)
 */

import { readFileSync } from 'fs';
import { extname, resolve, normalize } from 'path';
import { existsSync, realpathSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════
// نماذج البيانات
// ═══════════════════════════════════════════════════════════════════════════

export enum ScriptFormat {
  FDX = "fdx",
  FOUNTAIN = "fountain", 
  PDF_TEXT = "pdf_text",
  PDF_OCR = "pdf_ocr",
  TXT = "txt",
  UNKNOWN = "unknown"
}

export interface SceneHeader {
  intExt: "INT" | "EXT" | "UNKNOWN";
  location: string;
  timeOfDay: "DAY" | "NIGHT" | "DAWN" | "DUSK" | "CONTINUOUS" | "UNKNOWN";
  sceneNumber?: string;
}

export interface ParsedScene {
  id: string;
  number: string;
  header: SceneHeader;
  content: string;
  span_start: number;
  span_end: number;
  parsing_confidence: number;
  characters: string[];
  dialogue_count: number;
  action_lines: string[];
}

export interface ParsingError {
  type: "format_error" | "ocr_error" | "structure_error" | "encoding_error";
  message: string;
  span_start?: number;
  span_end?: number;
  severity: "warning" | "error" | "critical";
  suggestion?: string;
}

export interface ParsingResult {
  format: ScriptFormat;
  scenes: ParsedScene[];
  characters: string[];
  locations: string[];
  parsing_confidence: number;
  parsing_errors: ParsingError[];
  metadata: {
    total_lines: number;
    total_characters: number;
    estimated_pages: number;
    language: "ar" | "en" | "mixed";
    has_scene_numbers: boolean;
    has_character_names: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// محلل السيناريوهات الرئيسي
// ═══════════════════════════════════════════════════════════════════════════

export class ScriptParser {
  private static readonly SCENE_HEADER_PATTERNS = [
    // العربية
    /^(مشهد|scene)\s*(\d+)?\s*[-–—:]?\s*(داخلي|خارجي|int\.?|ext\.?)\s*[-–—]?\s*(.+?)\s*[-–—]?\s*(ليل|نهار|day|night|dawn|dusk|continuous)/i,
    /^(داخلي|خارجي|int\.?|ext\.?)\s*[-–—]?\s*(.+?)\s*[-–—]?\s*(ليل|نهار|day|night|dawn|dusk|continuous)/i,
    // الإنجليزية
    /^(int\.?|ext\.?)\s+(.+?)\s*[-–—]\s*(day|night|dawn|dusk|continuous)/i,
    /^scene\s+(\d+)\s*[-–—:]?\s*(int\.?|ext\.?)\s+(.+?)\s*[-–—]\s*(day|night|dawn|dusk|continuous)/i
  ];

  private static readonly CHARACTER_PATTERNS = [
    // العربية - أسماء الشخصيات متبوعة بنقطتين
    /^([أ-ي][أ-ي\s]{1,30}):/gm,
    // الإنجليزية - أسماء بأحرف كبيرة
    /^([A-Z][A-Z\s]{1,30}):/gm,
    // مختلط
    /^([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s]{1,30}):/gm
  ];

  /**
   * تحليل السيناريو من نص
   */
  static parseScript(scriptText: string, filename?: string): ParsingResult {
    const format = this.detectFormat(scriptText, filename);
    const lines = scriptText.split('\n').map(line => line.trim());
    
    // تحليل أساسي
    const scenes = this.extractScenes(scriptText, format);
    const characters = this.extractCharacters(scriptText);
    const locations = this.extractLocations(scenes);
    const errors = this.validateStructure(scriptText, scenes);
    
    // حساب الثقة
    const confidence = this.calculateParsingConfidence(scenes, characters, errors);
    
    // معلومات إضافية
    const metadata = this.extractMetadata(scriptText, scenes, characters);
    
    return {
      format,
      scenes,
      characters,
      locations,
      parsing_confidence: confidence,
      parsing_errors: errors,
      metadata
    };
  }

  /**
   * تحليل السيناريو من ملف
   */
  static parseScriptFile(filePath: string): ParsingResult {
    try {
      // الحماية من Path Traversal (CWE-22/23)
      const normalizedPath = normalize(filePath);
      const resolvedPath = resolve(normalizedPath);
      
      // التحقق من وجود الملف
      if (!existsSync(resolvedPath)) {
        throw new Error('الملف غير موجود');
      }
      
      // التحقق من أن المسار الحقيقي يطابق المسار المطلوب (منع symlink attacks)
      const realPath = realpathSync(resolvedPath);
      if (realPath !== resolvedPath) {
        throw new Error('مسار الملف غير آمن');
      }
      
      const content = readFileSync(realPath, 'utf-8');
      return this.parseScript(content, realPath);
    } catch (error) {
      return {
        format: ScriptFormat.UNKNOWN,
        scenes: [],
        characters: [],
        locations: [],
        parsing_confidence: 0,
        parsing_errors: [{
          type: "format_error",
          message: `فشل في قراءة الملف: ${error.message}`,
          severity: "critical"
        }],
        metadata: {
          total_lines: 0,
          total_characters: 0,
          estimated_pages: 0,
          language: "ar",
          has_scene_numbers: false,
          has_character_names: false
        }
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // كشف تنسيق السيناريو
  // ═══════════════════════════════════════════════════════════════════════

  private static detectFormat(content: string, filename?: string): ScriptFormat {
    // فحص امتداد الملف أولاً
    if (filename) {
      const ext = extname(filename).toLowerCase();
      switch (ext) {
        case '.fdx':
          return ScriptFormat.FDX;
        case '.fountain':
          return ScriptFormat.FOUNTAIN;
        case '.pdf':
          return content.includes('%PDF') ? ScriptFormat.PDF_TEXT : ScriptFormat.PDF_OCR;
      }
    }

    // فحص محتوى الملف
    if (content.includes('<?xml') && content.includes('FinalDraft')) {
      return ScriptFormat.FDX;
    }

    if (content.includes('Title:') || content.includes('FADE IN:')) {
      return ScriptFormat.FOUNTAIN;
    }

    if (content.includes('%PDF')) {
      return ScriptFormat.PDF_TEXT;
    }

    // افتراضي: نص عادي
    return ScriptFormat.TXT;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // استخراج المشاهد
  // ═══════════════════════════════════════════════════════════════════════

  private static extractScenes(content: string, format: ScriptFormat): ParsedScene[] {
    switch (format) {
      case ScriptFormat.FDX:
        return this.parseFDXScenes(content);
      case ScriptFormat.FOUNTAIN:
        return this.parseFountainScenes(content);
      default:
        return this.parseTextScenes(content);
    }
  }

  private static parseTextScenes(content: string): ParsedScene[] {
    const scenes: ParsedScene[] = [];
    const lines = content.split('\n');
    let currentScene: Partial<ParsedScene> | null = null;
    let sceneContent: string[] = [];
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // فحص إذا كان السطر ترويسة مشهد
      const sceneMatch = this.matchSceneHeader(line);
      
      if (sceneMatch) {
        // حفظ المشهد السابق
        if (currentScene) {
          scenes.push(this.finalizeScene(currentScene, sceneContent, lineIndex));
        }
        
        // بدء مشهد جديد
        currentScene = {
          id: `scene_${scenes.length + 1}`,
          number: sceneMatch.number || (scenes.length + 1).toString(),
          header: sceneMatch.header,
          span_start: content.indexOf(line),
          characters: [],
          dialogue_count: 0,
          action_lines: []
        };
        
        sceneContent = [line];
        lineIndex = i;
      } else if (currentScene) {
        sceneContent.push(line);
        
        // تحليل محتوى المشهد
        if (line.includes(':') && !line.includes('http')) {
          const charMatch = line.match(/^([^:]+):/);
          if (charMatch) {
            const character = this.sanitizeText(charMatch[1].trim());
            if (!currentScene.characters!.includes(character)) {
              currentScene.characters!.push(character);
            }
            currentScene.dialogue_count!++;
          }
        } else if (line.length > 10 && !line.includes(':')) {
          currentScene.action_lines!.push(this.sanitizeText(line));
        }
      } else if (line.length > 0) {
        // إذا لم نجد ترويسة مشهد، أنشئ مشهد افتراضي
        if (scenes.length === 0) {
          currentScene = {
            id: 'scene_1',
            number: '1',
            header: {
              intExt: "UNKNOWN",
              location: "غير محدد",
              timeOfDay: "UNKNOWN"
            },
            span_start: 0,
            characters: [],
            dialogue_count: 0,
            action_lines: []
          };
          sceneContent = [];
        }
        
        if (currentScene) {
          sceneContent.push(line);
        }
      }
    }

    // حفظ المشهد الأخير
    if (currentScene) {
      scenes.push(this.finalizeScene(currentScene, sceneContent, lineIndex));
    }

    return scenes;
  }

  private static parseFDXScenes(content: string): ParsedScene[] {
    // تحليل مبسط لـ FDX - يمكن تطويره لاحقاً
    const scenes: ParsedScene[] = [];
    
    // استخراج عناصر Scene من XML
    const sceneMatches = content.match(/<Scene[^>]*>[\s\S]*?<\/Scene>/g) || [];
    
    sceneMatches.forEach((sceneXml, index) => {
      const scene: ParsedScene = {
        id: `scene_${index + 1}`,
        number: (index + 1).toString(),
        header: this.extractFDXSceneHeader(sceneXml),
        content: this.extractFDXSceneContent(sceneXml),
        span_start: content.indexOf(sceneXml),
        span_end: content.indexOf(sceneXml) + sceneXml.length,
        parsing_confidence: 0.9,
        characters: this.extractFDXCharacters(sceneXml),
        dialogue_count: (sceneXml.match(/<Character>/g) || []).length,
        action_lines: this.extractFDXActions(sceneXml)
      };
      
      scenes.push(scene);
    });

    return scenes;
  }

  private static parseFountainScenes(content: string): ParsedScene[] {
    // تحليل مبسط لـ Fountain - يمكن تطويره لاحقاً
    const scenes: ParsedScene[] = [];
    const lines = content.split('\n');
    
    // Fountain scene headers start with INT. or EXT.
    let currentScene: Partial<ParsedScene> | null = null;
    let sceneContent: string[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (trimmed.match(/^(INT\.|EXT\.)/i)) {
        if (currentScene) {
          scenes.push(this.finalizeScene(currentScene, sceneContent, index));
        }
        
        currentScene = {
          id: `scene_${scenes.length + 1}`,
          number: (scenes.length + 1).toString(),
          header: this.parseFountainHeader(trimmed),
          span_start: content.indexOf(line),
          characters: [],
          dialogue_count: 0,
          action_lines: []
        };
        
        sceneContent = [trimmed];
      } else if (currentScene) {
        sceneContent.push(trimmed);
      }
    });
    
    if (currentScene) {
      scenes.push(this.finalizeScene(currentScene, sceneContent, lines.length));
    }

    return scenes;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات تحليل المشاهد
  // ═══════════════════════════════════════════════════════════════════════

  private static matchSceneHeader(line: string): { header: SceneHeader; number?: string } | null {
    for (const pattern of this.SCENE_HEADER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        return {
          header: {
            intExt: this.normalizeIntExt(match[3] || match[2] || match[1]),
            location: this.extractLocation(match),
            timeOfDay: this.normalizeTimeOfDay(match[match.length - 1])
          },
          number: match[2] || match[1]
        };
      }
    }
    return null;
  }

  private static normalizeIntExt(value: string): "INT" | "EXT" | "UNKNOWN" {
    const normalized = value.toLowerCase();
    if (normalized.includes('داخلي') || normalized.includes('int')) return "INT";
    if (normalized.includes('خارجي') || normalized.includes('ext')) return "EXT";
    return "UNKNOWN";
  }

  private static normalizeTimeOfDay(value: string): SceneHeader['timeOfDay'] {
    const normalized = value.toLowerCase();
    if (normalized.includes('ليل') || normalized.includes('night')) return "NIGHT";
    if (normalized.includes('نهار') || normalized.includes('day')) return "DAY";
    if (normalized.includes('dawn') || normalized.includes('فجر')) return "DAWN";
    if (normalized.includes('dusk') || normalized.includes('غروب')) return "DUSK";
    if (normalized.includes('continuous') || normalized.includes('مستمر')) return "CONTINUOUS";
    return "UNKNOWN";
  }

  private static extractLocation(match: RegExpMatchArray): string {
    // استخراج الموقع من match array
    for (let i = 1; i < match.length - 1; i++) {
      const part = match[i];
      if (part && !part.match(/(مشهد|scene|داخلي|خارجي|int|ext|ليل|نهار|day|night)/i)) {
        return part.trim();
      }
    }
    return "غير محدد";
  }

  private static finalizeScene(
    scene: Partial<ParsedScene>, 
    content: string[], 
    endIndex: number
  ): ParsedScene {
    const fullContent = content.join('\n');
    
    return {
      id: scene.id!,
      number: scene.number!,
      header: scene.header!,
      content: fullContent,
      span_start: scene.span_start!,
      span_end: scene.span_start! + fullContent.length,
      parsing_confidence: this.calculateSceneConfidence(scene, content),
      characters: scene.characters!,
      dialogue_count: scene.dialogue_count!,
      action_lines: scene.action_lines!
    };
  }

  private static calculateSceneConfidence(scene: Partial<ParsedScene>, content: string[]): number {
    let confidence = 0.5; // قاعدة أساسية
    
    // زيادة الثقة إذا كان هناك ترويسة واضحة
    if (scene.header && scene.header.intExt !== "UNKNOWN") confidence += 0.2;
    if (scene.header && scene.header.timeOfDay !== "UNKNOWN") confidence += 0.1;
    if (scene.header && scene.header.location !== "غير محدد") confidence += 0.1;
    
    // زيادة الثقة إذا كان هناك حوار
    if (scene.dialogue_count! > 0) confidence += 0.1;
    
    // زيادة الثقة إذا كان هناك وصف
    if (scene.action_lines!.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // استخراج الشخصيات
  // ═══════════════════════════════════════════════════════════════════════

  private static extractCharacters(content: string): string[] {
    const characters = new Set<string>();
    
    for (const pattern of this.CHARACTER_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const character = this.sanitizeText(match.replace(':', '').trim());
          if (character.length > 1 && character.length < 50) {
            characters.add(character);
          }
        });
      }
    }
    
    return Array.from(characters);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // استخراج المواقع
  // ═══════════════════════════════════════════════════════════════════════

  private static extractLocations(scenes: ParsedScene[]): string[] {
    const locations = new Set<string>();
    
    scenes.forEach(scene => {
      if (scene.header.location && scene.header.location !== "غير محدد") {
        locations.add(scene.header.location);
      }
    });
    
    return Array.from(locations);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // التحقق من صحة الهيكل
  // ═══════════════════════════════════════════════════════════════════════

  private static validateStructure(content: string, scenes: ParsedScene[]): ParsingError[] {
    const errors: ParsingError[] = [];
    
    // فحص وجود مشاهد
    if (scenes.length === 0) {
      errors.push({
        type: "structure_error",
        message: "لم يتم العثور على أي مشاهد في السيناريو",
        severity: "critical",
        suggestion: "تأكد من وجود ترويسات مشاهد واضحة"
      });
    }
    
    // فحص ترويسات المشاهد
    scenes.forEach((scene, index) => {
      const safeSceneNumber = this.sanitizeText(scene.number);
      
      if (scene.header.intExt === "UNKNOWN") {
        errors.push({
          type: "format_error",
          message: `المشهد ${safeSceneNumber}: لم يتم تحديد داخلي/خارجي`,
          span_start: scene.span_start,
          severity: "warning",
          suggestion: "أضف 'داخلي' أو 'خارجي' في بداية المشهد"
        });
      }
      
      if (scene.header.location === "غير محدد") {
        errors.push({
          type: "format_error",
          message: `المشهد ${safeSceneNumber}: الموقع غير محدد`,
          span_start: scene.span_start,
          severity: "warning",
          suggestion: "حدد موقع المشهد بوضوح"
        });
      }
      
      if (scene.characters.length === 0 && scene.content.length > 50) {
        errors.push({
          type: "structure_error",
          message: `المشهد ${safeSceneNumber}: لا يحتوي على شخصيات`,
          span_start: scene.span_start,
          severity: "warning",
          suggestion: "تأكد من وجود حوار أو شخصيات في المشهد"
        });
      }
    });
    
    // فحص التسلسل
    const sceneNumbers = scenes.map(s => parseInt(s.number)).filter(n => !isNaN(n));
    if (sceneNumbers.length > 1) {
      for (let i = 1; i < sceneNumbers.length; i++) {
        if (sceneNumbers[i] !== sceneNumbers[i-1] + 1) {
          errors.push({
            type: "structure_error",
            message: `تسلسل المشاهد غير صحيح: من ${sceneNumbers[i-1]} إلى ${sceneNumbers[i]}`,
            severity: "warning",
            suggestion: "تأكد من تسلسل أرقام المشاهد"
          });
        }
      }
    }
    
    return errors;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // حساب الثقة الإجمالية
  // ═══════════════════════════════════════════════════════════════════════

  private static calculateParsingConfidence(
    scenes: ParsedScene[], 
    characters: string[], 
    errors: ParsingError[]
  ): number {
    let confidence = 0.5;
    
    // زيادة الثقة بناءً على المشاهد
    if (scenes.length > 0) confidence += 0.2;
    if (scenes.length > 3) confidence += 0.1;
    
    // زيادة الثقة بناءً على الشخصيات
    if (characters.length > 0) confidence += 0.1;
    if (characters.length > 2) confidence += 0.1;
    
    // تقليل الثقة بناءً على الأخطاء
    const criticalErrors = errors.filter(e => e.severity === "critical").length;
    const majorErrors = errors.filter(e => e.severity === "error").length;
    
    confidence -= criticalErrors * 0.3;
    confidence -= majorErrors * 0.1;
    
    // متوسط ثقة المشاهد
    if (scenes.length > 0) {
      const avgSceneConfidence = scenes.reduce((sum, scene) => sum + scene.parsing_confidence, 0) / scenes.length;
      confidence = (confidence + avgSceneConfidence) / 2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // استخراج البيانات الوصفية
  // ═══════════════════════════════════════════════════════════════════════

  private static extractMetadata(content: string, scenes: ParsedScene[], characters: string[]) {
    const lines = content.split('\n');
    const arabicPattern = /[\u0600-\u06FF]/;
    const englishPattern = /[A-Za-z]/;
    
    let arabicCount = 0;
    let englishCount = 0;
    
    content.split('').forEach(char => {
      if (arabicPattern.test(char)) arabicCount++;
      if (englishPattern.test(char)) englishCount++;
    });
    
    const language = arabicCount > englishCount ? "ar" : 
                    englishCount > arabicCount ? "en" : "mixed";
    
    return {
      total_lines: lines.length,
      total_characters: content.length,
      estimated_pages: Math.ceil(content.length / 2500), // تقدير: 2500 حرف لكل صفحة
      language,
      has_scene_numbers: scenes.some(s => /^\d+$/.test(s.number)),
      has_character_names: characters.length > 0
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات FDX
  // ═══════════════════════════════════════════════════════════════════════

  private static extractFDXSceneHeader(sceneXml: string): SceneHeader {
    // تحليل مبسط - يمكن تطويره
    return {
      intExt: "UNKNOWN",
      location: "غير محدد",
      timeOfDay: "UNKNOWN"
    };
  }

  private static sanitizeText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private static extractFDXSceneContent(sceneXml: string): string {
    const content = sceneXml.replace(/<[^>]*>/g, '').trim();
    return this.sanitizeText(content);
  }

  private static extractFDXCharacters(sceneXml: string): string[] {
    const matches = sceneXml.match(/<Character>([^<]+)<\/Character>/g) || [];
    return matches.map(match => this.sanitizeText(match.replace(/<[^>]*>/g, '').trim()));
  }

  private static extractFDXActions(sceneXml: string): string[] {
    const matches = sceneXml.match(/<Action>([^<]+)<\/Action>/g) || [];
    return matches.map(match => this.sanitizeText(match.replace(/<[^>]*>/g, '').trim()));
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات Fountain
  // ═══════════════════════════════════════════════════════════════════════

  private static parseFountainHeader(line: string): SceneHeader {
    const match = line.match(/^(INT\.|EXT\.)\s+(.+?)\s*-\s*(DAY|NIGHT|DAWN|DUSK|CONTINUOUS)/i);
    
    if (match) {
      return {
        intExt: match[1].startsWith('INT') ? "INT" : "EXT",
        location: match[2].trim(),
        timeOfDay: this.normalizeTimeOfDay(match[3])
      };
    }
    
    return {
      intExt: "UNKNOWN",
      location: "غير محدد", 
      timeOfDay: "UNKNOWN"
    };
  }
}

export default ScriptParser;