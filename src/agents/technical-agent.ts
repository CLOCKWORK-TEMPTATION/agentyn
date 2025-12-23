/**
 * الوكيل التقني (Technical Reading Agent)
 * متخصص في القراءة التقنية للسيناريوهات
 * 
 * يركز على:
 * - فحص التنسيق واكتشاف الأخطاء الهيكلية
 * - التحقق من اتساق ترويسات المشاهد
 * - فحص تحديد المواقع والتوقيت
 * - كشف فساد البيانات والتكرار
 * - التحقق من اتساق الشخصيات والمواقع
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PythonBrainService } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// نماذج البيانات
// ═══════════════════════════════════════════════════════════════════════════

export interface FormatError {
  type: "structure" | "header" | "character" | "dialogue" | "action" | "transition";
  message: string;
  line_number?: number;
  column_number?: number;
  severity: "warning" | "error" | "critical";
  suggestion?: string;
  span_start?: number;
  span_end?: number;
}

export interface FormatWarning {
  type: "style" | "consistency" | "best_practice" | "formatting";
  message: string;
  suggestion: string;
  line_number?: number;
  impact: "low" | "medium" | "high";
}

export interface FormatSuggestion {
  type: "improvement" | "standardization" | "optimization";
  description: string;
  before: string;
  after: string;
  benefit: string;
}

export interface SceneHeaderValidation {
  scene_number: string;
  raw_header: string;
  int_ext: {
    value: string;
    is_valid: boolean;
    issues: string[];
  };
  location: {
    value: string;
    is_valid: boolean;
    is_consistent: boolean;
    previous_occurrences: string[];
    issues: string[];
  };
  time_of_day: {
    value: string;
    is_valid: boolean;
    is_consistent: boolean;
    issues: string[];
  };
  overall_valid: boolean;
  confidence: number;
}

export interface CharacterConsistency {
  character_name: string;
  total_appearances: number;
  name_variations: string[];
  inconsistencies: Array<{
    type: "spelling" | "formatting" | "case" | "missing_colon";
    scenes: string[];
    examples: string[];
    severity: "minor" | "major" | "critical";
  }>;
  is_consistent: boolean;
  confidence: number;
}

export interface LocationConsistency {
  location_name: string;
  total_appearances: number;
  variations: string[];
  inconsistencies: Array<{
    type: "spelling" | "description" | "int_ext_mismatch";
    scenes: string[];
    examples: string[];
    severity: "minor" | "major" | "critical";
  }>;
  is_consistent: boolean;
}

export interface CorruptionReport {
  has_corruption: boolean;
  corruption_types: Array<{
    type: "encoding" | "truncation" | "duplication" | "missing_content" | "malformed_structure";
    description: string;
    locations: Array<{
      line_number?: number;
      span_start: number;
      span_end: number;
      sample_text: string;
    }>;
    severity: "low" | "medium" | "high" | "critical";
    fix_suggestion: string;
  }>;
  overall_integrity: number; // 0-1
  recovery_possible: boolean;
}

export interface FormatValidation {
  is_valid: boolean;
  overall_score: number; // 0-1
  errors: FormatError[];
  warnings: FormatWarning[];
  suggestions: FormatSuggestion[];
  scene_headers: SceneHeaderValidation[];
  character_consistency: CharacterConsistency[];
  location_consistency: LocationConsistency[];
  corruption_report: CorruptionReport;
  processing_metadata: {
    total_lines: number;
    total_scenes: number;
    total_characters: number;
    processing_time: number;
    confidence: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// الوكيل التقني
// ═══════════════════════════════════════════════════════════════════════════

export class TechnicalReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  
  // أنماط التحقق من التنسيق
  private readonly SCENE_HEADER_PATTERNS = {
    arabic: /^(?:مشهد|المشهد)\s*(\d+)\s*[:\-–—]?\s*(.*)/i,
    english: /^(?:scene|sc\.?)\s*(\d+)\s*[:\-–—]?\s*(.*)/i,
    mixed: /^(?:مشهد|scene)\s*(\d+)\s*[:\-–—]?\s*(.*)/i
  };
  
  private readonly INT_EXT_PATTERNS = {
    arabic: /\b(داخلي|خارجي|داخل|خارج)\b/i,
    english: /\b(int\.?|ext\.?|interior|exterior)\b/i
  };
  
  private readonly TIME_PATTERNS = {
    arabic: /\b(ليل|نهار|صباح|مساء|فجر|غروب|ظهر|عصر)\b/i,
    english: /\b(day|night|dawn|dusk|morning|afternoon|evening|noon)\b/i
  };
  
  private readonly CHARACTER_PATTERN = /^([أ-ي\w\s]{2,50})\s*:/gm;
  
  constructor(model: BaseLanguageModel, pythonService: PythonBrainService) {
    this.model = model;
    this.pythonService = pythonService;
  }

  /**
   * فحص التنسيق الشامل للسيناريو
   */
  async validateFormatting(scriptText: string): Promise<FormatValidation> {
    console.log("🔧 بدء الفحص التقني الشامل للسيناريو...");
    
    const startTime = Date.now();
    
    try {
      // الفحص الأساسي
      const basicValidation = await this.performBasicValidation(scriptText);
      
      // فحص ترويسات المشاهد
      const sceneHeaders = await this.checkSceneHeaders(scriptText);
      
      // فحص اتساق الشخصيات
      const characterConsistency = await this.validateCharacterConsistency(scriptText);
      
      // فحص اتساق المواقع
      const locationConsistency = await this.checkLocationConsistencyForScript(scriptText);
      
      // فحص فساد البيانات
      const corruptionReport = await this.detectDataCorruption(scriptText);
      
      // تحسين بـ Python service إذا متاح
      let enhancedValidation = null;
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "continuity_check",
          { 
            validation_type: "comprehensive",
            check_formatting: true,
            check_consistency: true
          }
        );
        
        if (pythonJob.status !== "fallback") {
          enhancedValidation = await this.pythonService.waitForCompletion(pythonJob.job_id, 20000);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين بـ Python service:", (pythonError as Error).message);
      }
      
      // دمج النتائج
      const finalValidation = this.mergeValidationResults(
        basicValidation,
        sceneHeaders,
        characterConsistency,
        locationConsistency,
        corruptionReport,
        enhancedValidation
      );
      
      const processingTime = Date.now() - startTime;
      finalValidation.processing_metadata.processing_time = processingTime;
      
      console.log("✅ تم إكمال الفحص التقني");
      console.log(`   📊 النتيجة الإجمالية: ${(finalValidation.overall_score * 100).toFixed(1)}%`);
      console.log(`   ❌ الأخطاء: ${finalValidation.errors.length}`);
      console.log(`   ⚠️ التحذيرات: ${finalValidation.warnings.length}`);
      
      return finalValidation;
      
    } catch (error) {
      console.error("❌ خطأ في الفحص التقني:", error);
      return this.createFallbackValidation(scriptText);
    }
  }

  /**
   * فحص ترويسات المشاهد
   */
  async checkSceneHeaders(scriptText: string): Promise<SceneHeaderValidation[]> {
    console.log("🎬 فحص ترويسات المشاهد...");
    
    const headers = this.extractSceneHeaders(scriptText);
    const validations: SceneHeaderValidation[] = [];
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const validation = await this.validateSingleSceneHeader(header, i + 1, headers);
      validations.push(validation);
    }
    
    return validations;
  }

  /**
   * فحص اتساق الشخصيات
   */
  async validateCharacterConsistency(scriptText: string): Promise<CharacterConsistency[]> {
    console.log("👥 فحص اتساق الشخصيات...");
    
    const characters = this.extractAllCharacters(scriptText);
    const consistencyReports: CharacterConsistency[] = [];
    
    for (const character of characters) {
      const consistency = await this.analyzeCharacterConsistency(character, scriptText);
      consistencyReports.push(consistency);
    }
    
    return consistencyReports;
  }

  /**
   * كشف فساد البيانات
   */
  async detectDataCorruption(scriptText: string): Promise<CorruptionReport> {
    console.log("🔍 فحص فساد البيانات...");
    
    const corruptionTypes = [];
    let overallIntegrity = 1.0;
    
    // فحص ترميز الأحرف
    const encodingIssues = this.detectEncodingIssues(scriptText);
    if (encodingIssues.length > 0) {
      corruptionTypes.push({
        type: "encoding" as const,
        description: "مشاكل في ترميز الأحرف",
        locations: encodingIssues,
        severity: "medium" as const,
        fix_suggestion: "إعادة حفظ الملف بترميز UTF-8"
      });
      overallIntegrity -= 0.2;
    }
    
    // فحص التكرار
    const duplicationIssues = this.detectDuplication(scriptText);
    if (duplicationIssues.length > 0) {
      corruptionTypes.push({
        type: "duplication" as const,
        description: "تكرار في المحتوى",
        locations: duplicationIssues,
        severity: "high" as const,
        fix_suggestion: "إزالة المحتوى المكرر"
      });
      overallIntegrity -= 0.3;
    }
    
    // فحص البنية المشوهة
    const structureIssues = this.detectMalformedStructure(scriptText);
    if (structureIssues.length > 0) {
      corruptionTypes.push({
        type: "malformed_structure" as const,
        description: "بنية مشوهة في النص",
        locations: structureIssues,
        severity: "critical" as const,
        fix_suggestion: "إعادة تنسيق البنية الأساسية"
      });
      overallIntegrity -= 0.4;
    }
    
    return {
      has_corruption: corruptionTypes.length > 0,
      corruption_types: corruptionTypes,
      overall_integrity: Math.max(0, overallIntegrity),
      recovery_possible: overallIntegrity > 0.3
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات الفحص الأساسي
  // ═══════════════════════════════════════════════════════════════════════

  private async performBasicValidation(scriptText: string): Promise<Partial<FormatValidation>> {
    const errors: FormatError[] = [];
    const warnings: FormatWarning[] = [];
    const suggestions: FormatSuggestion[] = [];
    
    const lines = scriptText.split('\n');
    
    // فحص الطول الأساسي
    if (scriptText.length < 100) {
      errors.push({
        type: "structure",
        message: "النص قصير جداً ليكون سيناريو صالح",
        severity: "critical",
        suggestion: "تأكد من تحميل النص كاملاً"
      });
    }
    
    // فحص وجود مشاهد
    const sceneCount = this.countScenes(scriptText);
    if (sceneCount === 0) {
      errors.push({
        type: "structure",
        message: "لم يتم العثور على أي مشاهد في النص",
        severity: "critical",
        suggestion: "تأكد من وجود ترويسات مشاهد صحيحة"
      });
    } else if (sceneCount < 3) {
      warnings.push({
        type: "consistency",
        message: "عدد المشاهد قليل جداً",
        suggestion: "تأكد من اكتمال السيناريو",
        impact: "medium"
      });
    }
    
    // فحص وجود شخصيات
    const characterCount = this.countCharacters(scriptText);
    if (characterCount === 0) {
      errors.push({
        type: "character",
        message: "لم يتم العثور على أي شخصيات في النص",
        severity: "critical",
        suggestion: "تأكد من تنسيق أسماء الشخصيات بشكل صحيح"
      });
    }
    
    // فحص الأسطر الفارغة المفرطة
    const emptyLineRatio = this.calculateEmptyLineRatio(lines);
    if (emptyLineRatio > 0.5) {
      warnings.push({
        type: "formatting",
        message: "نسبة عالية من الأسطر الفارغة",
        suggestion: "مراجعة التنسيق وإزالة الأسطر الفارغة الزائدة",
        impact: "low"
      });
    }
    
    return {
      errors,
      warnings,
      suggestions
    };
  }

  private extractSceneHeaders(scriptText: string): string[] {
    const headers: string[] = [];
    const lines = scriptText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (this.isSceneHeader(trimmed)) {
        headers.push(trimmed);
      }
    }
    
    return headers;
  }

  private isSceneHeader(line: string): boolean {
    return Object.values(this.SCENE_HEADER_PATTERNS).some(pattern => 
      pattern.test(line)
    );
  }

  private async validateSingleSceneHeader(
    header: string, 
    sceneNumber: number, 
    allHeaders: string[]
  ): Promise<SceneHeaderValidation> {
    
    // استخراج المكونات
    const intExt = this.extractIntExt(header);
    const location = this.extractLocation(header);
    const timeOfDay = this.extractTimeOfDay(header);
    
    // فحص الاتساق مع المشاهد السابقة
    const locationConsistency = this.checkLocationConsistency(location.value, allHeaders);
    
    const validation: SceneHeaderValidation = {
      scene_number: sceneNumber.toString(),
      raw_header: header,
      int_ext: intExt,
      location: {
        ...location,
        is_consistent: locationConsistency.isConsistent,
        previous_occurrences: locationConsistency.previousOccurrences
      },
      time_of_day: timeOfDay,
      overall_valid: intExt.is_valid && location.is_valid && timeOfDay.is_valid,
      confidence: this.calculateHeaderConfidence(intExt, location, timeOfDay)
    };
    
    return validation;
  }

  private extractIntExt(header: string): { value: string; is_valid: boolean; issues: string[] } {
    const issues: string[] = [];
    let value = "غير محدد";
    let isValid = false;
    
    // البحث عن INT/EXT
    for (const [lang, pattern] of Object.entries(this.INT_EXT_PATTERNS)) {
      const match = header.match(pattern);
      if (match) {
        value = match[1];
        isValid = true;
        break;
      }
    }
    
    if (!isValid) {
      issues.push("لم يتم تحديد داخلي/خارجي بوضوح");
    }
    
    return { value, is_valid: isValid, issues };
  }

  private extractLocation(header: string): { value: string; is_valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // إزالة رقم المشهد والكلمات المفتاحية
    let cleaned = header.replace(/^(?:مشهد|scene)\s*\d+\s*[:\-–—]?\s*/i, '');
    cleaned = cleaned.replace(/\b(داخلي|خارجي|int\.?|ext\.?)\s*/i, '');
    cleaned = cleaned.replace(/\b(ليل|نهار|day|night|صباح|مساء)\s*/i, '');
    
    // استخراج الموقع
    const parts = cleaned.split(/[-–—|]/).map(p => p.trim()).filter(p => p);
    const location = parts.find(p => p.length > 2) || "غير محدد";
    
    const isValid = location !== "غير محدد" && location.length > 2;
    
    if (!isValid) {
      issues.push("الموقع غير واضح أو مفقود");
    }
    
    if (location.length > 50) {
      issues.push("اسم الموقع طويل جداً");
    }
    
    return { value: location, is_valid: isValid, issues };
  }

  private extractTimeOfDay(header: string): { value: string; is_valid: boolean; is_consistent: boolean; issues: string[] } {
    const issues: string[] = [];
    let value = "غير محدد";
    let isValid = false;
    
    // البحث عن وقت اليوم
    for (const [lang, pattern] of Object.entries(this.TIME_PATTERNS)) {
      const match = header.match(pattern);
      if (match) {
        value = match[1];
        isValid = true;
        break;
      }
    }
    
    if (!isValid) {
      issues.push("وقت اليوم غير محدد");
    }
    
    return { value, is_valid: isValid, is_consistent: true, issues };
  }

  private checkLocationConsistency(
    location: string, 
    allHeaders: string[]
  ): { isConsistent: boolean; previousOccurrences: string[] } {
    const previousOccurrences: string[] = [];
    
    for (const header of allHeaders) {
      const headerLocation = this.extractLocation(header);
      if (this.isSimilarLocation(location, headerLocation.value)) {
        previousOccurrences.push(header);
      }
    }
    
    // إذا كان هناك تكرارات، فحص الاتساق
    const isConsistent = previousOccurrences.length <= 1 || 
      previousOccurrences.every(occurrence => 
        this.extractLocation(occurrence).value === location
      );
    
    return { isConsistent, previousOccurrences };
  }

  private isSimilarLocation(loc1: string, loc2: string): boolean {
    if (loc1 === loc2) return true;
    
    // فحص التشابه (تجاهل الحالة والمسافات)
    const normalized1 = loc1.toLowerCase().replace(/\s+/g, '');
    const normalized2 = loc2.toLowerCase().replace(/\s+/g, '');
    
    return normalized1 === normalized2;
  }

  private calculateHeaderConfidence(
    intExt: any, 
    location: any, 
    timeOfDay: any
  ): number {
    let confidence = 0.0;
    
    if (intExt.is_valid) confidence += 0.33;
    if (location.is_valid) confidence += 0.33;
    if (timeOfDay.is_valid) confidence += 0.34;
    
    // تقليل الثقة بناءً على المشاكل
    const totalIssues = intExt.issues.length + location.issues.length + timeOfDay.issues.length;
    confidence -= (totalIssues * 0.1);
    
    return Math.max(0, Math.min(1, confidence));
  }

  private extractAllCharacters(scriptText: string): string[] {
    const matches = scriptText.match(this.CHARACTER_PATTERN) || [];
    const characters = matches.map(match => match.replace(':', '').trim());
    return Array.from(new Set(characters));
  }

  private async analyzeCharacterConsistency(
    characterName: string, 
    scriptText: string
  ): Promise<CharacterConsistency> {
    
    const variations = this.findCharacterVariations(characterName, scriptText);
    const inconsistencies = this.detectCharacterInconsistencies(characterName, variations, scriptText);
    
    return {
      character_name: characterName,
      total_appearances: variations.reduce((sum, v) => sum + v.count, 0),
      name_variations: variations.map(v => v.variation),
      inconsistencies,
      is_consistent: inconsistencies.length === 0,
      confidence: this.calculateCharacterConsistencyConfidence(inconsistencies)
    };
  }

  private findCharacterVariations(characterName: string, scriptText: string): Array<{variation: string; count: number}> {
    const variations = new Map<string, number>();
    const lines = scriptText.split('\n');
    
    const baseName = characterName.toLowerCase().replace(/\s+/g, '');
    
    for (const line of lines) {
      const match = line.match(this.CHARACTER_PATTERN);
      if (match) {
        const foundName = match[1].trim();
        const normalizedFound = foundName.toLowerCase().replace(/\s+/g, '');
        
        // فحص التشابه
        if (this.isSimilarCharacterName(baseName, normalizedFound)) {
          const count = variations.get(foundName) || 0;
          variations.set(foundName, count + 1);
        }
      }
    }
    
    return Array.from(variations.entries()).map(([variation, count]) => ({
      variation,
      count
    }));
  }

  private isSimilarCharacterName(name1: string, name2: string): boolean {
    if (name1 === name2) return true;
    
    // فحص التشابه الصوتي البسيط
    const similarity = this.calculateStringSimilarity(name1, name2);
    return similarity > 0.8;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private detectCharacterInconsistencies(
    characterName: string,
    variations: Array<{variation: string; count: number}>,
    scriptText: string
  ): Array<{
    type: "spelling" | "formatting" | "case" | "missing_colon";
    scenes: string[];
    examples: string[];
    severity: "minor" | "major" | "critical";
  }> {
    
    const inconsistencies = [];
    
    // فحص تنوع الإملاء
    if (variations.length > 1) {
      const spellingVariations = variations.filter(v => v.variation !== characterName);
      if (spellingVariations.length > 0) {
        inconsistencies.push({
          type: "spelling" as const,
          scenes: this.findScenesWithCharacter(spellingVariations.map(v => v.variation), scriptText),
          examples: spellingVariations.map(v => v.variation),
          severity: spellingVariations.length > 2 ? "major" as const : "minor" as const
        });
      }
    }
    
    // فحص النقطتين المفقودة
    const missingColonLines = this.findLinesWithMissingColon(characterName, scriptText);
    if (missingColonLines.length > 0) {
      inconsistencies.push({
        type: "missing_colon" as const,
        scenes: this.findScenesForLines(missingColonLines, scriptText),
        examples: missingColonLines.slice(0, 3),
        severity: missingColonLines.length > 5 ? "major" as const : "minor" as const
      });
    }
    
    return inconsistencies;
  }

  private findScenesWithCharacter(characterNames: string[], scriptText: string): string[] {
    const scenes: string[] = [];
    const lines = scriptText.split('\n');
    let currentScene = "مشهد غير محدد";
    
    for (const line of lines) {
      if (this.isSceneHeader(line.trim())) {
        currentScene = line.trim();
      }
      
      for (const charName of characterNames) {
        if (line.includes(charName)) {
          scenes.push(currentScene);
          break;
        }
      }
    }
    
    return Array.from(new Set(scenes));
  }

  private findLinesWithMissingColon(characterName: string, scriptText: string): string[] {
    const lines = scriptText.split('\n');
    const missingColonLines: string[] = [];
    
    const namePattern = new RegExp(`^\\s*${characterName}\\s*[^:]`, 'i');
    
    for (const line of lines) {
      if (namePattern.test(line)) {
        missingColonLines.push(line.trim());
      }
    }
    
    return missingColonLines;
  }

  private findScenesForLines(lines: string[], scriptText: string): string[] {
    const scenes: string[] = [];
    const scriptLines = scriptText.split('\n');
    let currentScene = "مشهد غير محدد";
    
    for (const scriptLine of scriptLines) {
      if (this.isSceneHeader(scriptLine.trim())) {
        currentScene = scriptLine.trim();
      }
      
      for (const targetLine of lines) {
        if (scriptLine.trim() === targetLine) {
          scenes.push(currentScene);
          break;
        }
      }
    }
    
    return Array.from(new Set(scenes));
  }

  private calculateCharacterConsistencyConfidence(inconsistencies: any[]): number {
    if (inconsistencies.length === 0) return 1.0;
    
    let confidence = 1.0;
    
    for (const inconsistency of inconsistencies) {
      switch (inconsistency.severity) {
        case "minor":
          confidence -= 0.1;
          break;
        case "major":
          confidence -= 0.3;
          break;
        case "critical":
          confidence -= 0.5;
          break;
      }
    }
    
    return Math.max(0, confidence);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات كشف فساد البيانات
  // ═══════════════════════════════════════════════════════════════════════

  private detectEncodingIssues(scriptText: string): Array<{
    line_number?: number;
    span_start: number;
    span_end: number;
    sample_text: string;
  }> {
    const issues = [];
    const lines = scriptText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // فحص الأحرف المشوهة
      const corruptedChars = /[�\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
      let match;
      
      while ((match = corruptedChars.exec(line)) !== null) {
        const lineStart = scriptText.indexOf(line);
        issues.push({
          line_number: i + 1,
          span_start: lineStart + match.index,
          span_end: lineStart + match.index + match[0].length,
          sample_text: line.substring(Math.max(0, match.index - 10), match.index + 10)
        });
      }
    }
    
    return issues;
  }

  private detectDuplication(scriptText: string): Array<{
    line_number?: number;
    span_start: number;
    span_end: number;
    sample_text: string;
  }> {
    const issues = [];
    const lines = scriptText.split('\n');
    const seenLines = new Map<string, number>();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length > 10) { // تجاهل الأسطر القصيرة
        const firstOccurrence = seenLines.get(line);
        
        if (firstOccurrence !== undefined) {
          const lineStart = scriptText.indexOf(lines[i]);
          issues.push({
            line_number: i + 1,
            span_start: lineStart,
            span_end: lineStart + lines[i].length,
            sample_text: line.substring(0, 50) + "..."
          });
        } else {
          seenLines.set(line, i);
        }
      }
    }
    
    return issues;
  }

  private detectMalformedStructure(scriptText: string): Array<{
    line_number?: number;
    span_start: number;
    span_end: number;
    sample_text: string;
  }> {
    const issues = [];
    const lines = scriptText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // فحص الأسطر المشوهة (أحرف غريبة متتالية)
      const malformedPattern = /[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF.,!?;:()\-"']{3,}/g;
      let match;
      
      while ((match = malformedPattern.exec(line)) !== null) {
        const lineStart = scriptText.indexOf(line);
        issues.push({
          line_number: i + 1,
          span_start: lineStart + match.index,
          span_end: lineStart + match.index + match[0].length,
          sample_text: line.substring(Math.max(0, match.index - 10), match.index + 20)
        });
      }
    }
    
    return issues;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات عامة
  // ═══════════════════════════════════════════════════════════════════════

  private countScenes(scriptText: string): number {
    return this.extractSceneHeaders(scriptText).length;
  }

  private countCharacters(scriptText: string): number {
    return this.extractAllCharacters(scriptText).length;
  }

  private calculateEmptyLineRatio(lines: string[]): number {
    const emptyLines = lines.filter(line => line.trim().length === 0).length;
    return emptyLines / lines.length;
  }

  private async checkLocationConsistencyForScript(scriptText: string): Promise<LocationConsistency[]> {
    const headers = this.extractSceneHeaders(scriptText);
    const locationMap = new Map<string, string[]>();
    
    // جمع جميع المواقع
    for (const header of headers) {
      const location = this.extractLocation(header);
      if (location.is_valid) {
        const existing = locationMap.get(location.value) || [];
        existing.push(header);
        locationMap.set(location.value, existing);
      }
    }
    
    // تحليل الاتساق
    const consistencyReports: LocationConsistency[] = [];
    
    for (const [locationName, occurrences] of Array.from(locationMap.entries())) {
      const variations = Array.from(new Set(occurrences.map(h => this.extractLocation(h).value)));
      
      consistencyReports.push({
        location_name: locationName,
        total_appearances: occurrences.length,
        variations,
        inconsistencies: variations.length > 1 ? [{
          type: "spelling",
          scenes: occurrences,
          examples: variations,
          severity: variations.length > 2 ? "major" : "minor"
        }] : [],
        is_consistent: variations.length === 1
      });
    }
    
    return consistencyReports;
  }

  private mergeValidationResults(
    sceneHeaders: SceneHeaderValidation[],
    characterConsistency: CharacterConsistency[],
    locationConsistency: LocationConsistency[],
    corruptionReport: CorruptionReport,
    enhancedValidation: any
  ): FormatValidation {
    
    const errors = [...(basicValidation.errors || [])];
    const warnings = [...(basicValidation.warnings || [])];
    const suggestions = [...(basicValidation.suggestions || [])];
    
    // إضافة أخطاء من ترويسات المشاهد
    sceneHeaders.forEach(header => {
      if (!header.overall_valid) {
        errors.push({
          type: "header",
          message: `مشكلة في ترويسة المشهد ${header.scene_number}`,
          severity: "error",
          suggestion: "مراجعة تنسيق ترويسة المشهد"
        });
      }
    });
    
    // إضافة مشاكل اتساق الشخصيات
    characterConsistency.forEach(char => {
      if (!char.is_consistent) {
        warnings.push({
          type: "consistency",
          message: `عدم اتساق في اسم الشخصية: ${char.character_name}`,
          suggestion: "توحيد كتابة اسم الشخصية",
          impact: "medium"
        });
      }
    });
    
    // إضافة مشاكل فساد البيانات
    corruptionReport.corruption_types.forEach(corruption => {
      errors.push({
        type: "structure",
        message: corruption.description,
        severity: corruption.severity === "critical" ? "critical" : "error",
        suggestion: corruption.fix_suggestion
      });
    });
    
    // دمج النتائج المحسنة من Python
    if (enhancedValidation?.errors) {
      errors.push(...enhancedValidation.errors);
    }
    if (enhancedValidation?.warnings) {
      warnings.push(...enhancedValidation.warnings);
    }
    
    // حساب النتيجة الإجمالية
    const overallScore = this.calculateOverallScore(
      errors,
      warnings,
      sceneHeaders,
      characterConsistency,
      corruptionReport
    );
    
    return {
      is_valid: errors.filter(e => e.severity === "critical").length === 0,
      overall_score: overallScore,
      errors,
      warnings,
      suggestions,
      scene_headers: sceneHeaders,
      character_consistency: characterConsistency,
      location_consistency: locationConsistency,
      corruption_report: corruptionReport,
      processing_metadata: {
        total_lines: 0, // سيتم تحديثه
        total_scenes: sceneHeaders.length,
        total_characters: characterConsistency.length,
        processing_time: 0, // سيتم تحديثه
        confidence: overallScore
      }
    };
  }

  private calculateOverallScore(
    errors: FormatError[],
    warnings: FormatWarning[],
    sceneHeaders: SceneHeaderValidation[],
    characterConsistency: CharacterConsistency[],
    corruptionReport: CorruptionReport
  ): number {
    let score = 1.0;
    
    // تقليل النتيجة بناءً على الأخطاء
    errors.forEach(error => {
      switch (error.severity) {
        case "critical":
          score -= 0.3;
          break;
        case "error":
          score -= 0.1;
          break;
        case "warning":
          score -= 0.05;
          break;
      }
    });
    
    // تقليل النتيجة بناءً على التحذيرات
    warnings.forEach(warning => {
      switch (warning.impact) {
        case "high":
          score -= 0.1;
          break;
        case "medium":
          score -= 0.05;
          break;
        case "low":
          score -= 0.02;
          break;
      }
    });
    
    // تأثير فساد البيانات
    score *= corruptionReport.overall_integrity;
    
    // تأثير اتساق الشخصيات
    const avgCharacterConsistency = characterConsistency.length > 0
      ? characterConsistency.reduce((sum, char) => sum + char.confidence, 0) / characterConsistency.length
      : 1.0;
    score *= avgCharacterConsistency;
    
    return Math.max(0, Math.min(1, score));
  }

  private createFallbackValidation(scriptText: string): FormatValidation {
    const lines = scriptText.split('\n');
    
    return {
      is_valid: scriptText.length > 100,
      overall_score: scriptText.length > 100 ? 0.6 : 0.2,
      errors: scriptText.length <= 100 ? [{
        type: "structure",
        message: "النص قصير جداً أو فارغ",
        severity: "critical",
        suggestion: "تأكد من تحميل السيناريو بشكل صحيح"
      }] : [],
      warnings: [],
      suggestions: [],
      scene_headers: [],
      character_consistency: [],
      location_consistency: [],
      corruption_report: {
        has_corruption: false,
        corruption_types: [],
        overall_integrity: 1.0,
        recovery_possible: true
      },
      processing_metadata: {
        total_lines: lines.length,
        total_scenes: 0,
        total_characters: 0,
        processing_time: 0,
        confidence: 0.5
      }
    };
  }
}

export default TechnicalReadingAgent;