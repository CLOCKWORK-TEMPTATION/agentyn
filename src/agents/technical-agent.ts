/**
 * الوكيل التقني (Technical Reading Agent)
 * متخصص في الفحص التقني للسيناريوهات
 * 
 * يركز على:
 * - فحص التنسيق والهيكل
 * - التحقق من اتساق الشخصيات والمواقع
 * - كشف فساد البيانات والتكرار
 * - التحقق من صحة ترويسات المشاهد
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PythonBrainService } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// نماذج البيانات
// ═══════════════════════════════════════════════════════════════════════════

export interface FormatValidation {
  is_valid: boolean;
  format_type: "standard" | "fdx" | "fountain" | "custom" | "unknown";
  compliance_score: number; // 0-1
  format_issues: Array<{
    type: "scene_header" | "character_name" | "dialogue" | "action" | "transition";
    line_number: number;
    issue: string;
    severity: "info" | "warning" | "error" | "critical";
    suggestion: string;
  }>;
}

export interface SceneHeaderValidation {
  scene_number: string;
  header_text: string;
  is_valid: boolean;
  components: {
    int_ext: {
      value: string;
      is_valid: boolean;
      issue?: string;
    };
    location: {
      value: string;
      is_valid: boolean;
      issue?: string;
    };
    time_of_day: {
      value: string;
      is_valid: boolean;
      issue?: string;
    };
  };
  suggestions: string[];
}

export interface CharacterConsistency {
  character_name: string;
  appearances: Array<{
    scene_number: string;
    line_number: number;
    name_variant: string;
  }>;
  inconsistencies: Array<{
    type: "spelling" | "formatting" | "missing" | "duplicate";
    description: string;
    scenes_affected: string[];
    severity: "minor" | "major" | "critical";
  }>;
  suggested_canonical_name: string;
}

export interface LocationConsistency {
  location_name: string;
  appearances: Array<{
    scene_number: string;
    header_text: string;
    name_variant: string;
  }>;
  inconsistencies: Array<{
    type: "spelling" | "description" | "int_ext_mismatch";
    description: string;
    scenes_affected: string[];
  }>;
  suggested_canonical_name: string;
}

export interface DataCorruption {
  corruption_type: "encoding" | "formatting" | "truncation" | "duplication" | "insertion";
  affected_lines: number[];
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  auto_fixable: boolean;
  suggested_fix?: string;
}

export interface TechnicalAnalysis {
  format_validation: FormatValidation;
  scene_headers: SceneHeaderValidation[];
  character_consistency: CharacterConsistency[];
  location_consistency: LocationConsistency[];
  data_corruption: DataCorruption[];
  overall_health: {
    technical_score: number; // 0-1
    readiness_for_production: boolean;
    critical_issues_count: number;
    recommendations: string[];
  };
  statistics: {
    total_scenes: number;
    total_characters: number;
    total_locations: number;
    dialogue_lines: number;
    action_lines: number;
    avg_scene_length: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// الوكيل التقني
// ═══════════════════════════════════════════════════════════════════════════

export class TechnicalReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  
  // أنماط التحقق من التنسيق
  private readonly SCENE_HEADER_PATTERNS = [
    /^(مشهد|scene)\s*(\d+)?\s*[-–—:]?\s*(داخلي|خارجي|int\.?|ext\.?)\s*[-–—]?\s*(.+?)\s*[-–—]?\s*(ليل|نهار|day|night|dawn|dusk|continuous)/i,
    /^(داخلي|خارجي|int\.?|ext\.?)\s*[-–—]?\s*(.+?)\s*[-–—]?\s*(ليل|نهار|day|night|dawn|dusk|continuous)/i
  ];
  
  private readonly CHARACTER_PATTERNS = [
    /^([أ-ي\w\s]{2,30}):/gm,
    /^([A-Z][A-Z\s]{2,30}):/gm
  ];

  constructor(model: BaseLanguageModel, pythonService: PythonBrainService) {
    this.model = model;
    this.pythonService = pythonService;
  }

  /**
   * التحليل التقني الشامل للسيناريو
   */
  async analyzeTechnical(scriptText: string): Promise<TechnicalAnalysis> {
    console.log("🔧 بدء التحليل التقني الشامل...");
    
    try {
      // التحليل المحلي أولاً
      const formatValidation = await this.validateFormat(scriptText);
      const sceneHeaders = await this.validateSceneHeaders(scriptText);
      const characterConsistency = await this.checkCharacterConsistency(scriptText);
      const locationConsistency = await this.checkLocationConsistency(scriptText);
      const dataCorruption = await this.detectDataCorruption(scriptText);
      const statistics = this.calculateStatistics(scriptText);
      
      // تحسين بـ Python service إذا متاح
      let enhancedResults = null;
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "continuity_check",
          { 
            analysis_type: "technical",
            check_consistency: true,
            validate_format: true
          }
        );
        
        if (pythonJob.status !== "fallback") {
          enhancedResults = await this.pythonService.waitForCompletion(pythonJob.job_id, 20000);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين بـ Python service:", pythonError.message);
      }
      
      // دمج النتائج
      const analysis: TechnicalAnalysis = {
        format_validation: formatValidation,
        scene_headers: sceneHeaders,
        character_consistency: characterConsistency,
        location_consistency: locationConsistency,
        data_corruption: dataCorruption,
        overall_health: this.calculateOverallHealth(
          formatValidation, sceneHeaders, characterConsistency, 
          locationConsistency, dataCorruption
        ),
        statistics
      };
      
      // تحسين بنتائج Python إذا متاحة
      if (enhancedResults) {
        this.enhanceWithPythonResults(analysis, enhancedResults);
      }
      
      console.log("✅ تم إكمال التحليل التقني");
      return analysis;
      
    } catch (error) {
      console.error("❌ خطأ في التحليل التقني:", error);
      return this.createFallbackTechnicalAnalysis(scriptText);
    }
  }

  /**
   * فحص تنسيق السيناريو
   */
  async validateFormat(scriptText: string): Promise<FormatValidation> {
    const lines = scriptText.split('\n');
    const issues: FormatValidation['format_issues'] = [];
    let complianceScore = 1.0;
    
    // تحديد نوع التنسيق
    const formatType = this.detectFormatType(scriptText);
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return;
      
      const lineNumber = index + 1;
      
      // فحص ترويسات المشاهد
      if (this.looksLikeSceneHeader(trimmed)) {
        const headerIssue = this.validateSceneHeaderFormat(trimmed);
        if (headerIssue) {
          issues.push({
            type: "scene_header",
            line_number: lineNumber,
            issue: headerIssue.issue,
            severity: headerIssue.severity,
            suggestion: headerIssue.suggestion
          });
          complianceScore -= 0.1;
        }
      }
      
      // فحص أسماء الشخصيات
      else if (this.looksLikeCharacterName(trimmed)) {
        const characterIssue = this.validateCharacterNameFormat(trimmed);
        if (characterIssue) {
          issues.push({
            type: "character_name",
            line_number: lineNumber,
            issue: characterIssue.issue,
            severity: characterIssue.severity,
            suggestion: characterIssue.suggestion
          });
          complianceScore -= 0.05;
        }
      }
      
      // فحص الحوار
      else if (this.looksLikeDialogue(trimmed, lines[index - 1])) {
        const dialogueIssue = this.validateDialogueFormat(trimmed);
        if (dialogueIssue) {
          issues.push({
            type: "dialogue",
            line_number: lineNumber,
            issue: dialogueIssue.issue,
            severity: dialogueIssue.severity,
            suggestion: dialogueIssue.suggestion
          });
          complianceScore -= 0.02;
        }
      }
      
      // فحص الوصف/الحركة
      else {
        const actionIssue = this.validateActionFormat(trimmed);
        if (actionIssue) {
          issues.push({
            type: "action",
            line_number: lineNumber,
            issue: actionIssue.issue,
            severity: actionIssue.severity,
            suggestion: actionIssue.suggestion
          });
          complianceScore -= 0.01;
        }
      }
    });
    
    return {
      is_valid: complianceScore > 0.7 && issues.filter(i => i.severity === "critical").length === 0,
      format_type: formatType,
      compliance_score: Math.max(0, complianceScore),
      format_issues: issues
    };
  }

  /**
   * التحقق من صحة ترويسات المشاهد
   */
  async validateSceneHeaders(scriptText: string): Promise<SceneHeaderValidation[]> {
    const lines = scriptText.split('\n');
    const sceneHeaders: SceneHeaderValidation[] = [];
    let sceneNumber = 1;
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (this.looksLikeSceneHeader(trimmed)) {
        const validation = this.analyzeSceneHeader(trimmed, sceneNumber.toString());
        sceneHeaders.push(validation);
        sceneNumber++;
      }
    });
    
    return sceneHeaders;
  }

  /**
   * فحص اتساق الشخصيات
   */
  async checkCharacterConsistency(scriptText: string): Promise<CharacterConsistency[]> {
    const characterMap = new Map<string, CharacterConsistency>();
    const lines = scriptText.split('\n');
    let currentScene = "1";
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // تحديث رقم المشهد الحالي
      if (this.looksLikeSceneHeader(trimmed)) {
        const sceneMatch = trimmed.match(/(\d+)/);
        if (sceneMatch) {
          currentScene = sceneMatch[1];
        }
      }
      
      // البحث عن أسماء الشخصيات
      const characterMatch = trimmed.match(/^([أ-ي\w\s]{2,30}):/);
      if (characterMatch) {
        const characterName = characterMatch[1].trim();
        const normalizedName = this.normalizeCharacterName(characterName);
        
        if (!characterMap.has(normalizedName)) {
          characterMap.set(normalizedName, {
            character_name: normalizedName,
            appearances: [],
            inconsistencies: [],
            suggested_canonical_name: characterName
          });
        }
        
        const character = characterMap.get(normalizedName)!;
        character.appearances.push({
          scene_number: currentScene,
          line_number: index + 1,
          name_variant: characterName
        });
        
        // فحص التناسق في الكتابة
        if (characterName !== character.suggested_canonical_name) {
          const existingInconsistency = character.inconsistencies.find(
            inc => inc.type === "spelling" && inc.description.includes(characterName)
          );
          
          if (!existingInconsistency) {
            character.inconsistencies.push({
              type: "spelling",
              description: `تباين في كتابة الاسم: "${characterName}" vs "${character.suggested_canonical_name}"`,
              scenes_affected: [currentScene],
              severity: "minor"
            });
          } else {
            if (!existingInconsistency.scenes_affected.includes(currentScene)) {
              existingInconsistency.scenes_affected.push(currentScene);
            }
          }
        }
      }
    });
    
    return Array.from(characterMap.values());
  }

  /**
   * فحص اتساق المواقع
   */
  async checkLocationConsistency(scriptText: string): Promise<LocationConsistency[]> {
    const locationMap = new Map<string, LocationConsistency>();
    const lines = scriptText.split('\n');
    let sceneNumber = 1;
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      
      if (this.looksLikeSceneHeader(trimmed)) {
        const locationInfo = this.extractLocationFromHeader(trimmed);
        
        if (locationInfo.location) {
          const normalizedLocation = this.normalizeLocationName(locationInfo.location);
          
          if (!locationMap.has(normalizedLocation)) {
            locationMap.set(normalizedLocation, {
              location_name: normalizedLocation,
              appearances: [],
              inconsistencies: [],
              suggested_canonical_name: locationInfo.location
            });
          }
          
          const location = locationMap.get(normalizedLocation)!;
          location.appearances.push({
            scene_number: sceneNumber.toString(),
            header_text: trimmed,
            name_variant: locationInfo.location
          });
          
          // فحص تناسق داخلي/خارجي
          const currentIntExt = locationInfo.intExt;
          const previousAppearances = location.appearances.slice(0, -1);
          
          for (const prev of previousAppearances) {
            const prevLocationInfo = this.extractLocationFromHeader(prev.header_text);
            if (prevLocationInfo.intExt !== currentIntExt) {
              location.inconsistencies.push({
                type: "int_ext_mismatch",
                description: `تضارب في داخلي/خارجي: ${prevLocationInfo.intExt} vs ${currentIntExt}`,
                scenes_affected: [prev.scene_number, sceneNumber.toString()]
              });
            }
          }
        }
        
        sceneNumber++;
      }
    });
    
    return Array.from(locationMap.values());
  }

  /**
   * كشف فساد البيانات
   */
  async detectDataCorruption(scriptText: string): Promise<DataCorruption[]> {
    const corruptions: DataCorruption[] = [];
    const lines = scriptText.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // فحص مشاكل التشفير
      if (this.hasEncodingIssues(line)) {
        corruptions.push({
          corruption_type: "encoding",
          affected_lines: [lineNumber],
          description: "مشاكل في تشفير النص - أحرف غير مقروءة",
          severity: "medium",
          auto_fixable: false,
          suggested_fix: "إعادة حفظ الملف بتشفير UTF-8"
        });
      }
      
      // فحص التكرار المشبوه
      if (index > 0 && line.trim() === lines[index - 1].trim() && line.trim().length > 10) {
        corruptions.push({
          corruption_type: "duplication",
          affected_lines: [lineNumber - 1, lineNumber],
          description: "تكرار مشبوه في النص",
          severity: "low",
          auto_fixable: true,
          suggested_fix: "حذف السطر المكرر"
        });
      }
      
      // فحص الأحرف الغريبة
      if (this.hasStrangeCharacters(line)) {
        corruptions.push({
          corruption_type: "formatting",
          affected_lines: [lineNumber],
          description: "أحرف أو رموز غير متوقعة في النص",
          severity: "low",
          auto_fixable: true,
          suggested_fix: "تنظيف الأحرف الغريبة"
        });
      }
      
      // فحص القطع المفاجئ
      if (this.looksLikeTruncation(line)) {
        corruptions.push({
          corruption_type: "truncation",
          affected_lines: [lineNumber],
          description: "يبدو أن النص مقطوع بشكل مفاجئ",
          severity: "high",
          auto_fixable: false,
          suggested_fix: "مراجعة النص الأصلي واستكمال المحتوى المفقود"
        });
      }
    });
    
    return corruptions;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات التحليل
  // ═══════════════════════════════════════════════════════════════════════

  private detectFormatType(scriptText: string): FormatValidation['format_type'] {
    if (scriptText.includes('<?xml') && scriptText.includes('FinalDraft')) {
      return "fdx";
    }
    if (scriptText.includes('FADE IN:') || scriptText.includes('Title:')) {
      return "fountain";
    }
    if (this.SCENE_HEADER_PATTERNS.some(pattern => pattern.test(scriptText))) {
      return "standard";
    }
    return "unknown";
  }

  private looksLikeSceneHeader(line: string): boolean {
    return this.SCENE_HEADER_PATTERNS.some(pattern => pattern.test(line));
  }

  private looksLikeCharacterName(line: string): boolean {
    return this.CHARACTER_PATTERNS.some(pattern => pattern.test(line));
  }

  private looksLikeDialogue(line: string, previousLine?: string): boolean {
    if (!previousLine) return false;
    return this.looksLikeCharacterName(previousLine) && 
           !this.looksLikeSceneHeader(line) && 
           !this.looksLikeCharacterName(line);
  }

  private validateSceneHeaderFormat(header: string): { issue: string; severity: any; suggestion: string } | null {
    // فحص وجود العناصر الأساسية
    const hasIntExt = /(داخلي|خارجي|int\.?|ext\.?)/i.test(header);
    const hasTimeOfDay = /(ليل|نهار|day|night|dawn|dusk|continuous)/i.test(header);
    
    if (!hasIntExt) {
      return {
        issue: "ترويسة المشهد لا تحتوي على تحديد داخلي/خارجي",
        severity: "error",
        suggestion: "أضف 'داخلي' أو 'خارجي' في بداية الترويسة"
      };
    }
    
    if (!hasTimeOfDay) {
      return {
        issue: "ترويسة المشهد لا تحتوي على تحديد وقت اليوم",
        severity: "warning",
        suggestion: "أضف 'نهار' أو 'ليل' في نهاية الترويسة"
      };
    }
    
    return null;
  }

  private validateCharacterNameFormat(characterLine: string): { issue: string; severity: any; suggestion: string } | null {
    const name = characterLine.replace(':', '').trim();
    
    if (name.length < 2) {
      return {
        issue: "اسم الشخصية قصير جداً",
        severity: "warning",
        suggestion: "استخدم اسماً أكثر وضوحاً للشخصية"
      };
    }
    
    if (name.length > 30) {
      return {
        issue: "اسم الشخصية طويل جداً",
        severity: "warning",
        suggestion: "اختصر اسم الشخصية"
      };
    }
    
    if (!/^[أ-ي\w\s]+$/.test(name)) {
      return {
        issue: "اسم الشخصية يحتوي على أحرف غير صالحة",
        severity: "error",
        suggestion: "استخدم أحرفاً عربية أو إنجليزية فقط"
      };
    }
    
    return null;
  }

  private validateDialogueFormat(dialogue: string): { issue: string; severity: any; suggestion: string } | null {
    if (dialogue.length > 500) {
      return {
        issue: "الحوار طويل جداً",
        severity: "info",
        suggestion: "فكر في تقسيم الحوار إلى أجزاء أصغر"
      };
    }
    
    return null;
  }

  private validateActionFormat(action: string): { issue: string; severity: any; suggestion: string } | null {
    if (action.length > 300) {
      return {
        issue: "وصف الحركة طويل جداً",
        severity: "info",
        suggestion: "اجعل وصف الحركة أكثر إيجازاً"
      };
    }
    
    return null;
  }

  private analyzeSceneHeader(header: string, sceneNumber: string): SceneHeaderValidation {
    const components = this.parseSceneHeaderComponents(header);
    
    return {
      scene_number: sceneNumber,
      header_text: header,
      is_valid: components.int_ext.is_valid && components.location.is_valid && components.time_of_day.is_valid,
      components,
      suggestions: this.generateSceneHeaderSuggestions(components)
    };
  }

  private parseSceneHeaderComponents(header: string): SceneHeaderValidation['components'] {
    const intExtMatch = header.match(/(داخلي|خارجي|int\.?|ext\.?)/i);
    const timeMatch = header.match(/(ليل|نهار|day|night|dawn|dusk|continuous)/i);
    
    // استخراج الموقع (ما بين داخلي/خارجي والوقت)
    let location = "غير محدد";
    if (intExtMatch && timeMatch) {
      const start = header.indexOf(intExtMatch[0]) + intExtMatch[0].length;
      const end = header.indexOf(timeMatch[0]);
      location = header.substring(start, end).replace(/[-–—]/g, '').trim();
    }
    
    return {
      int_ext: {
        value: intExtMatch ? intExtMatch[0] : "غير محدد",
        is_valid: !!intExtMatch,
        issue: !intExtMatch ? "لم يتم تحديد داخلي/خارجي" : undefined
      },
      location: {
        value: location,
        is_valid: location !== "غير محدد" && location.length > 0,
        issue: location === "غير محدد" ? "الموقع غير محدد" : undefined
      },
      time_of_day: {
        value: timeMatch ? timeMatch[0] : "غير محدد",
        is_valid: !!timeMatch,
        issue: !timeMatch ? "وقت اليوم غير محدد" : undefined
      }
    };
  }

  private generateSceneHeaderSuggestions(components: SceneHeaderValidation['components']): string[] {
    const suggestions: string[] = [];
    
    if (!components.int_ext.is_valid) {
      suggestions.push("أضف 'داخلي' أو 'خارجي' في بداية الترويسة");
    }
    
    if (!components.location.is_valid) {
      suggestions.push("حدد موقع المشهد بوضوح");
    }
    
    if (!components.time_of_day.is_valid) {
      suggestions.push("أضف وقت اليوم (نهار/ليل) في نهاية الترويسة");
    }
    
    return suggestions;
  }

  private normalizeCharacterName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private normalizeLocationName(location: string): string {
    return location.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private extractLocationFromHeader(header: string): { location: string; intExt: string } {
    const intExtMatch = header.match(/(داخلي|خارجي|int\.?|ext\.?)/i);
    const timeMatch = header.match(/(ليل|نهار|day|night|dawn|dusk|continuous)/i);
    
    let location = "غير محدد";
    if (intExtMatch && timeMatch) {
      const start = header.indexOf(intExtMatch[0]) + intExtMatch[0].length;
      const end = header.indexOf(timeMatch[0]);
      location = header.substring(start, end).replace(/[-–—]/g, '').trim();
    }
    
    return {
      location,
      intExt: intExtMatch ? intExtMatch[0] : "غير محدد"
    };
  }

  private hasEncodingIssues(line: string): boolean {
    // فحص أحرف التشفير المكسورة
    return /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(line);
  }

  private hasStrangeCharacters(line: string): boolean {
    // فحص أحرف غير متوقعة (عدا الأحرف العربية والإنجليزية والأرقام والعلامات الأساسية)
    return /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s\.\,\!\?\:\;\-\–\—\(\)\[\]\{\}\"\'\/\\]/.test(line);
  }

  private looksLikeTruncation(line: string): boolean {
    // فحص إذا كان السطر ينتهي بشكل مفاجئ أو غير طبيعي
    return line.length > 50 && !line.match(/[.!?؟]$/) && line.endsWith('...');
  }

  private calculateStatistics(scriptText: string): TechnicalAnalysis['statistics'] {
    const lines = scriptText.split('\n');
    let sceneCount = 0;
    let dialogueLines = 0;
    let actionLines = 0;
    const characters = new Set<string>();
    const locations = new Set<string>();
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return;
      
      if (this.looksLikeSceneHeader(trimmed)) {
        sceneCount++;
        const locationInfo = this.extractLocationFromHeader(trimmed);
        if (locationInfo.location !== "غير محدد") {
          locations.add(locationInfo.location);
        }
      } else if (this.looksLikeCharacterName(trimmed)) {
        const name = trimmed.replace(':', '').trim();
        characters.add(name);
      } else if (this.looksLikeDialogue(trimmed, lines[lines.indexOf(line) - 1])) {
        dialogueLines++;
      } else {
        actionLines++;
      }
    });
    
    return {
      total_scenes: sceneCount,
      total_characters: characters.size,
      total_locations: locations.size,
      dialogue_lines: dialogueLines,
      action_lines: actionLines,
      avg_scene_length: sceneCount > 0 ? Math.round(lines.length / sceneCount) : 0
    };
  }

  private calculateOverallHealth(
    format: FormatValidation,
    sceneHeaders: SceneHeaderValidation[],
    characters: CharacterConsistency[],
    locations: LocationConsistency[],
    corruptions: DataCorruption[]
  ): TechnicalAnalysis['overall_health'] {
    let technicalScore = 1.0;
    const recommendations: string[] = [];
    let criticalIssues = 0;
    
    // تأثير التنسيق
    technicalScore *= format.compliance_score;
    if (!format.is_valid) {
      recommendations.push("إصلاح مشاكل التنسيق الأساسية");
    }
    
    // تأثير ترويسات المشاهد
    const invalidHeaders = sceneHeaders.filter(h => !h.is_valid).length;
    if (invalidHeaders > 0) {
      technicalScore -= (invalidHeaders / sceneHeaders.length) * 0.3;
      recommendations.push(`إصلاح ${invalidHeaders} ترويسة مشهد غير صالحة`);
    }
    
    // تأثير اتساق الشخصيات
    const characterIssues = characters.reduce((sum, char) => sum + char.inconsistencies.length, 0);
    if (characterIssues > 0) {
      technicalScore -= Math.min(characterIssues * 0.05, 0.2);
      recommendations.push(`حل ${characterIssues} مشكلة في اتساق الشخصيات`);
    }
    
    // تأثير اتساق المواقع
    const locationIssues = locations.reduce((sum, loc) => sum + loc.inconsistencies.length, 0);
    if (locationIssues > 0) {
      technicalScore -= Math.min(locationIssues * 0.05, 0.2);
      recommendations.push(`حل ${locationIssues} مشكلة في اتساق المواقع`);
    }
    
    // تأثير فساد البيانات
    criticalIssues = corruptions.filter(c => c.severity === "critical").length;
    const highIssues = corruptions.filter(c => c.severity === "high").length;
    
    technicalScore -= criticalIssues * 0.3;
    technicalScore -= highIssues * 0.1;
    
    if (criticalIssues > 0) {
      recommendations.push(`إصلاح ${criticalIssues} مشكلة حرجة في البيانات`);
    }
    
    technicalScore = Math.max(0, technicalScore);
    
    return {
      technical_score: technicalScore,
      readiness_for_production: technicalScore > 0.8 && criticalIssues === 0,
      critical_issues_count: criticalIssues,
      recommendations
    };
  }

  private enhanceWithPythonResults(analysis: TechnicalAnalysis, pythonResults: any): void {
    if (!pythonResults || !pythonResults.result) return;
    
    const enhancement = pythonResults.result;
    
    // تحسين النتائج بناءً على Python service
    if (enhancement.consistency_issues) {
      // إضافة مشاكل الاتساق المكتشفة
      enhancement.consistency_issues.forEach((issue: any) => {
        if (issue.type === "character") {
          const character = analysis.character_consistency.find(c => 
            c.character_name.toLowerCase().includes(issue.name.toLowerCase())
          );
          if (character) {
            character.inconsistencies.push({
              type: "spelling",
              description: issue.description,
              scenes_affected: issue.scenes || [],
              severity: issue.severity || "minor"
            });
          }
        }
      });
    }
    
    if (enhancement.technical_score !== undefined) {
      // تحديث النتيجة التقنية
      analysis.overall_health.technical_score = Math.max(
        analysis.overall_health.technical_score,
        enhancement.technical_score
      );
    }
  }

  private createFallbackTechnicalAnalysis(scriptText: string): TechnicalAnalysis {
    const statistics = this.calculateStatistics(scriptText);
    
    return {
      format_validation: {
        is_valid: true,
        format_type: "unknown",
        compliance_score: 0.7,
        format_issues: []
      },
      scene_headers: [],
      character_consistency: [],
      location_consistency: [],
      data_corruption: [],
      overall_health: {
        technical_score: 0.7,
        readiness_for_production: false,
        critical_issues_count: 0,
        recommendations: ["مراجعة تقنية شاملة مطلوبة"]
      },
      statistics
    };
  }
}

export default TechnicalReadingAgent;