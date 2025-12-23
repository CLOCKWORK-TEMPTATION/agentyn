/**
 * الوكيل العاطفي (Emotional Reading Agent)
 * متخصص في القراءة العاطفية للسيناريوهات
 * 
 * يركز على:
 * - التدفق السردي والإيقاع
 * - اللحظات العاطفية
 * - رؤية المخرج
 * - تجنب الملاحظات التقنية
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PythonBrainService } from '../three-read-breakdown-system.js';

// ═══════════════════════════════════════════════════════════════════════════
// نماذج البيانات
// ═══════════════════════════════════════════════════════════════════════════

export interface EmotionalArc {
  character: string;
  emotion: string;
  intensity: number; // 0-1
  trigger: string;
  scene_position: number;
}

export interface PacingRhythm {
  tempo: "slow" | "medium" | "fast" | "variable";
  tension_curve: number[]; // مصفوفة من 0-1 تمثل التوتر عبر المشاهد
  climax_points: number[]; // مواضع الذروات
  breathing_spaces: number[]; // مواضع الراحة
}

export interface KeyMoment {
  timestamp: string;
  description: string;
  emotional_weight: number; // 0-1
  impact_type: "revelation" | "conflict" | "resolution" | "transition";
  characters_involved: string[];
}

export interface DirectorVision {
  overall_approach: string;
  visual_style: string;
  emotional_goals: string[];
  audience_journey: string;
  key_themes: string[];
}

export interface EmotionalAnalysis {
  overall_tone: string;
  emotional_arcs: EmotionalArc[];
  pacing_rhythm: PacingRhythm;
  key_moments: KeyMoment[];
  audience_engagement: number; // 0-1
  director_vision: DirectorVision;
  narrative_structure: {
    act_breaks: number[];
    story_beats: string[];
    character_development: string[];
  };
  emotional_palette: {
    primary_emotions: string[];
    emotional_transitions: string[];
    mood_progression: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// الوكيل العاطفي
// ═══════════════════════════════════════════════════════════════════════════

export class EmotionalReadingAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  private readonly FORBIDDEN_WORDS = [
    'props', 'wardrobe', 'sfx', 'vfx', 'breakdown', 'equipment',
    'دعائم', 'أزياء', 'مؤثرات', 'معدات', 'تفريغ', 'إنتاج'
  ];

  constructor(model: BaseLanguageModel, pythonService: PythonBrainService) {
    this.model = model;
    this.pythonService = pythonService;
  }

  /**
   * تحليل السرد العاطفي للسيناريو
   */
  async analyzeNarrative(scriptText: string): Promise<EmotionalAnalysis> {
    console.log("🎭 بدء التحليل العاطفي للسيناريو...");
    
    const systemPrompt = this.createEmotionalSystemPrompt();
    
    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`حلل هذا السيناريو عاطفياً:\n\n${scriptText}`)
      ];
      
      const response = await this.model.invoke(messages);
      let analysisResult = this.parseEmotionalResponse(response.content.toString());
      
      // تحسين بـ Python service إذا متاح
      try {
        const pythonJob = await this.pythonService.analyzeWithComponent(
          scriptText,
          "semantic_synopsis",
          { analysis_type: "emotional", focus: "narrative_flow" }
        );
        
        if (pythonJob.status !== "fallback") {
          const pythonResult = await this.pythonService.waitForCompletion(pythonJob.job_id, 15000);
          analysisResult = this.enhanceWithPythonResults(analysisResult, pythonResult);
        }
      } catch (pythonError) {
        console.warn("فشل التحسين بـ Python service:", (pythonError as Error).message);
      }
      
      // التحقق من عدم وجود كلمات محظورة
      this.validateEmotionalPurity(analysisResult);
      
      console.log("✅ تم إكمال التحليل العاطفي");
      return analysisResult;
      
    } catch (error) {
      console.error("❌ خطأ في التحليل العاطفي:", error);
      return this.createFallbackEmotionalAnalysis(scriptText);
    }
  }

  /**
   * تحليل الإيقاع السردي
   */
  async identifyPacing(scriptText: string): Promise<PacingRhythm> {
    const scenes = this.extractScenes(scriptText);
    const tensionCurve = this.calculateTensionCurve(scenes);
    const climaxPoints = this.identifyClimaxPoints(tensionCurve);
    const breathingSpaces = this.identifyBreathingSpaces(tensionCurve);
    
    return {
      tempo: this.determineTempo(scenes),
      tension_curve: tensionCurve,
      climax_points: climaxPoints,
      breathing_spaces: breathingSpaces
    };
  }

  /**
   * استخراج اللحظات العاطفية المحورية
   */
  async extractEmotionalBeats(scriptText: string): Promise<KeyMoment[]> {
    const scenes = this.extractScenes(scriptText);
    const keyMoments: KeyMoment[] = [];
    
    scenes.forEach((scene, index) => {
      const emotionalWeight = this.calculateEmotionalWeight(scene);
      
      if (emotionalWeight > 0.6) {
        keyMoments.push({
          timestamp: `Scene ${index + 1}`,
          description: this.extractMomentDescription(scene),
          emotional_weight: emotionalWeight,
          impact_type: this.classifyImpactType(scene),
          characters_involved: this.extractCharacters(scene)
        });
      }
    });
    
    return keyMoments.sort((a, b) => b.emotional_weight - a.emotional_weight);
  }

  /**
   * توليد رؤية المخرج
   */
  async generateDirectorVision(analysis: EmotionalAnalysis): Promise<DirectorVision> {
    const themes = this.extractThemes(analysis);
    const visualStyle = this.suggestVisualStyle(analysis);
    const emotionalGoals = this.defineEmotionalGoals(analysis);
    
    return {
      overall_approach: this.defineOverallApproach(analysis),
      visual_style: visualStyle,
      emotional_goals: emotionalGoals,
      audience_journey: this.mapAudienceJourney(analysis),
      key_themes: themes
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات التحليل
  // ═══════════════════════════════════════════════════════════════════════

  private createEmotionalSystemPrompt(): string {
    return `أنت وكيل متخصص في القراءة العاطفية للسيناريوهات السينمائية.

مهمتك: تحليل التدفق السردي والإيقاع العاطفي للقصة دون التركيز على العناصر التقنية أو الإنتاجية.

القواعد الصارمة:
1. اقرأ النص كمشاهد وليس كمنتج
2. ركز على التدفق السردي والإيقاع واللحظات العاطفية
3. لا تدون أي ملاحظات تقنية أو إنتاجية
4. لا تذكر: props, wardrobe, sfx, vfx, breakdown, equipment, دعائم, أزياء, مؤثرات, معدات
5. حدد رؤية المخرج والمشاعر المستهدفة
6. ركز على الرحلة العاطفية للشخصيات والجمهور

أخرج النتيجة بصيغة JSON مع الحقول التالية:
- overall_tone: النبرة العامة للقصة
- emotional_arcs: الأقواس العاطفية للشخصيات
- pacing_rhythm: إيقاع المشاهد
- key_moments: اللحظات المحورية
- audience_engagement: مستوى تفاعل الجمهور المتوقع (0-1)
- director_vision: رؤية المخرج المقترحة
- narrative_structure: هيكل السرد
- emotional_palette: لوحة المشاعر

تذكر: أنت تقرأ للفهم العاطفي والسردي فقط، وليس للإنتاج.`;
  }

  private parseEmotionalResponse(responseText: string): EmotionalAnalysis {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.normalizeEmotionalAnalysis(parsed);
      }
    } catch (error) {
      console.warn("فشل تحليل JSON، استخدام fallback");
    }
    
    return this.createFallbackEmotionalAnalysis(responseText);
  }

  private normalizeEmotionalAnalysis(rawAnalysis: any): EmotionalAnalysis {
    return {
      overall_tone: rawAnalysis.overall_tone || "متوازن",
      emotional_arcs: this.normalizeEmotionalArcs(rawAnalysis.emotional_arcs || []),
      pacing_rhythm: this.normalizePacingRhythm(rawAnalysis.pacing_rhythm || {}),
      key_moments: this.normalizeKeyMoments(rawAnalysis.key_moments || []),
      audience_engagement: Math.max(0, Math.min(1, rawAnalysis.audience_engagement || 0.7)),
      director_vision: this.normalizeDirectorVision(rawAnalysis.director_vision || {}),
      narrative_structure: {
        act_breaks: rawAnalysis.narrative_structure?.act_breaks || [25, 75],
        story_beats: rawAnalysis.narrative_structure?.story_beats || ["setup", "confrontation", "resolution"],
        character_development: rawAnalysis.narrative_structure?.character_development || ["introduction", "growth", "transformation"]
      },
      emotional_palette: {
        primary_emotions: rawAnalysis.emotional_palette?.primary_emotions || ["hope", "tension", "resolution"],
        emotional_transitions: rawAnalysis.emotional_palette?.emotional_transitions || ["calm to tension", "tension to relief"],
        mood_progression: rawAnalysis.emotional_palette?.mood_progression || ["optimistic", "challenging", "triumphant"]
      }
    };
  }

  private normalizeEmotionalArcs(arcs: any[]): EmotionalArc[] {
    return arcs.map((arc, index) => ({
      character: arc.character || `Character ${index + 1}`,
      emotion: arc.emotion || "neutral",
      intensity: Math.max(0, Math.min(1, arc.intensity || 0.5)),
      trigger: arc.trigger || "story events",
      scene_position: Math.max(0, arc.scene_position || index)
    }));
  }

  private normalizePacingRhythm(rhythm: any): PacingRhythm {
    return {
      tempo: rhythm.tempo || "medium",
      tension_curve: Array.isArray(rhythm.tension_curve) ? 
        rhythm.tension_curve.map((t: number) => Math.max(0, Math.min(1, t))) : 
        [0.3, 0.5, 0.7, 0.6, 0.8],
      climax_points: Array.isArray(rhythm.climax_points) ? rhythm.climax_points : [3],
      breathing_spaces: Array.isArray(rhythm.breathing_spaces) ? rhythm.breathing_spaces : [1, 5]
    };
  }

  private normalizeKeyMoments(moments: any[]): KeyMoment[] {
    return moments.map((moment, index) => ({
      timestamp: moment.timestamp || `Moment ${index + 1}`,
      description: moment.description || "Key story moment",
      emotional_weight: Math.max(0, Math.min(1, moment.emotional_weight || 0.7)),
      impact_type: moment.impact_type || "transition",
      characters_involved: Array.isArray(moment.characters_involved) ? 
        moment.characters_involved : ["Main Character"]
    }));
  }

  private normalizeDirectorVision(vision: any): DirectorVision {
    return {
      overall_approach: vision.overall_approach || "Focus on character-driven storytelling",
      visual_style: vision.visual_style || "Naturalistic with emotional emphasis",
      emotional_goals: Array.isArray(vision.emotional_goals) ? 
        vision.emotional_goals : ["Connect with audience", "Convey character journey"],
      audience_journey: vision.audience_journey || "Emotional engagement through character development",
      key_themes: Array.isArray(vision.key_themes) ? 
        vision.key_themes : ["Human connection", "Personal growth"]
    };
  }

  private createFallbackEmotionalAnalysis(scriptText: string): EmotionalAnalysis {
    const scenes = this.extractScenes(scriptText);
    const characters = this.extractCharacters(scriptText);
    
    return {
      overall_tone: this.analyzeToneFromText(scriptText),
      emotional_arcs: characters.map((char, index) => ({
        character: char,
        emotion: "evolving",
        intensity: 0.6 + (index * 0.1),
        trigger: "story progression",
        scene_position: index
      })),
      pacing_rhythm: {
        tempo: scenes.length > 5 ? "variable" : "medium",
        tension_curve: this.generateBasicTensionCurve(scenes.length),
        climax_points: [Math.floor(scenes.length * 0.75)],
        breathing_spaces: [Math.floor(scenes.length * 0.25), Math.floor(scenes.length * 0.5)]
      },
      key_moments: [{
        timestamp: "Mid-story",
        description: "Central dramatic moment",
        emotional_weight: 0.8,
        impact_type: "conflict",
        characters_involved: characters.slice(0, 2)
      }],
      audience_engagement: 0.7,
      director_vision: {
        overall_approach: "Character-focused narrative approach",
        visual_style: "Intimate and emotionally resonant",
        emotional_goals: ["Audience connection", "Character empathy"],
        audience_journey: "Progressive emotional investment in character outcomes",
        key_themes: ["Human relationships", "Personal transformation"]
      },
      narrative_structure: {
        act_breaks: [25, 75],
        story_beats: ["introduction", "development", "climax", "resolution"],
        character_development: ["establishment", "challenge", "growth", "transformation"]
      },
      emotional_palette: {
        primary_emotions: ["curiosity", "tension", "empathy", "satisfaction"],
        emotional_transitions: ["intrigue to investment", "tension to resolution"],
        mood_progression: ["engaging", "intensifying", "resolving"]
      }
    };
  }

  private enhanceWithPythonResults(base: EmotionalAnalysis, pythonResult: any): EmotionalAnalysis {
    if (!pythonResult || !pythonResult.result) return base;
    
    const enhancement = pythonResult.result;
    
    return {
      ...base,
      audience_engagement: Math.max(base.audience_engagement, enhancement.engagement || 0.5),
      director_vision: {
        ...base.director_vision,
        overall_approach: enhancement.director_notes || base.director_vision.overall_approach
      },
      emotional_palette: {
        ...base.emotional_palette,
        primary_emotions: enhancement.emotions || base.emotional_palette.primary_emotions
      }
    };
  }

  private validateEmotionalPurity(analysis: EmotionalAnalysis): void {
    const analysisText = JSON.stringify(analysis).toLowerCase();
    
    for (const forbiddenWord of this.FORBIDDEN_WORDS) {
      if (analysisText.includes(forbiddenWord.toLowerCase())) {
        console.warn(`⚠️ تم العثور على كلمة محظورة في التحليل العاطفي: ${forbiddenWord}`);
        // يمكن إضافة تنظيف أو رفض التحليل هنا
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // مساعدات التحليل التفصيلي
  // ═══════════════════════════════════════════════════════════════════════

  private extractScenes(scriptText: string): string[] {
    return scriptText
      .split(/مشهد \d+|scene \d+/i)
      .filter(scene => scene.trim().length > 20);
  }

  private extractCharacters(scriptText: string): string[] {
    const characterPattern = /^([أ-ي\w\s]{2,30}):/gm;
    const matches = scriptText.match(characterPattern) || [];
    return [...new Set(matches.map(m => m.replace(':', '').trim()))];
  }

  private calculateTensionCurve(scenes: string[]): number[] {
    return scenes.map((scene, index) => {
      let tension = 0.3; // قاعدة أساسية
      
      // زيادة التوتر بناءً على الكلمات المفتاحية
      const tensionWords = ['صراع', 'خطر', 'مشكلة', 'أزمة', 'تهديد'];
      const reliefWords = ['حل', 'سلام', 'راحة', 'فرح', 'نجاح'];
      
      tensionWords.forEach(word => {
        if (scene.includes(word)) tension += 0.2;
      });
      
      reliefWords.forEach(word => {
        if (scene.includes(word)) tension -= 0.1;
      });
      
      // منحنى طبيعي للتوتر (يزيد نحو النهاية)
      tension += (index / scenes.length) * 0.3;
      
      return Math.max(0, Math.min(1, tension));
    });
  }

  private identifyClimaxPoints(tensionCurve: number[]): number[] {
    const climaxPoints: number[] = [];
    
    for (let i = 1; i < tensionCurve.length - 1; i++) {
      if (tensionCurve[i] > tensionCurve[i-1] && 
          tensionCurve[i] > tensionCurve[i+1] && 
          tensionCurve[i] > 0.7) {
        climaxPoints.push(i);
      }
    }
    
    return climaxPoints;
  }

  private identifyBreathingSpaces(tensionCurve: number[]): number[] {
    const breathingSpaces: number[] = [];
    
    for (let i = 1; i < tensionCurve.length - 1; i++) {
      if (tensionCurve[i] < tensionCurve[i-1] && 
          tensionCurve[i] < tensionCurve[i+1] && 
          tensionCurve[i] < 0.4) {
        breathingSpaces.push(i);
      }
    }
    
    return breathingSpaces;
  }

  private determineTempo(scenes: string[]): "slow" | "medium" | "fast" | "variable" {
    const avgSceneLength = scenes.reduce((sum, scene) => sum + scene.length, 0) / scenes.length;
    
    if (avgSceneLength > 500) return "slow";
    if (avgSceneLength < 200) return "fast";
    
    // فحص التنوع في أطوال المشاهد
    const lengths = scenes.map(s => s.length);
    const variance = this.calculateVariance(lengths);
    
    return variance > 10000 ? "variable" : "medium";
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private calculateEmotionalWeight(scene: string): number {
    let weight = 0.3;
    
    const highImpactWords = ['يموت', 'يولد', 'يتزوج', 'ينفصل', 'يكتشف', 'يخون'];
    const emotionalWords = ['يبكي', 'يضحك', 'يغضب', 'يفرح', 'يحزن', 'يخاف'];
    
    highImpactWords.forEach(word => {
      if (scene.includes(word)) weight += 0.3;
    });
    
    emotionalWords.forEach(word => {
      if (scene.includes(word)) weight += 0.2;
    });
    
    return Math.min(1, weight);
  }

  private extractMomentDescription(scene: string): string {
    const sentences = scene.split(/[.!?؟]/).filter(s => s.trim().length > 10);
    return sentences[0]?.trim().substring(0, 100) + "..." || "Key dramatic moment";
  }

  private classifyImpactType(scene: string): "revelation" | "conflict" | "resolution" | "transition" {
    if (scene.includes('يكتشف') || scene.includes('يعلم') || scene.includes('يفهم')) {
      return "revelation";
    }
    if (scene.includes('صراع') || scene.includes('يتعارك') || scene.includes('مشكلة')) {
      return "conflict";
    }
    if (scene.includes('حل') || scene.includes('ينتهي') || scene.includes('يحل')) {
      return "resolution";
    }
    return "transition";
  }

  private analyzeToneFromText(text: string): string {
    const positiveWords = ['فرح', 'سعادة', 'نجاح', 'حب', 'أمل'];
    const negativeWords = ['حزن', 'خوف', 'غضب', 'فشل', 'يأس'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return "إيجابي ومتفائل";
    if (negativeCount > positiveCount) return "درامي ومتوتر";
    return "متوازن ومعقد";
  }

  private generateBasicTensionCurve(sceneCount: number): number[] {
    const curve: number[] = [];
    for (let i = 0; i < sceneCount; i++) {
      // منحنى أساسي: يبدأ منخفض، يرتفع، ثم ينخفض قليلاً
      const position = i / (sceneCount - 1);
      let tension = 0.3 + (position * 0.5);
      
      // ذروة في الثلث الأخير
      if (position > 0.7) {
        tension += 0.2;
      }
      
      curve.push(Math.min(1, tension));
    }
    return curve;
  }

  private extractThemes(analysis: EmotionalAnalysis): string[] {
    const themes = new Set<string>();
    
    // استخراج المواضيع من الأقواس العاطفية
    analysis.emotional_arcs.forEach(arc => {
      if (arc.emotion.includes('love')) themes.add('الحب والعلاقات');
      if (arc.emotion.includes('growth')) themes.add('النمو الشخصي');
      if (arc.emotion.includes('conflict')) themes.add('الصراع الداخلي');
    });
    
    // مواضيع افتراضية
    if (themes.size === 0) {
      themes.add('الرحلة الإنسانية');
      themes.add('التحديات والنمو');
    }
    
    return Array.from(themes);
  }

  private suggestVisualStyle(analysis: EmotionalAnalysis): string {
    if (analysis.overall_tone.includes('درامي')) {
      return "أسلوب بصري درامي مع تركيز على التباين والظلال";
    }
    if (analysis.overall_tone.includes('إيجابي')) {
      return "أسلوب بصري مشرق ودافئ مع ألوان طبيعية";
    }
    return "أسلوب بصري متوازن يخدم السرد العاطفي";
  }

  private defineEmotionalGoals(analysis: EmotionalAnalysis): string[] {
    const goals = [];
    
    if (analysis.audience_engagement > 0.7) {
      goals.push("خلق تفاعل عاطفي قوي مع الجمهور");
    }
    
    goals.push("نقل الرحلة العاطفية للشخصيات بوضوح");
    goals.push("الحفاظ على التوتر السردي المناسب");
    
    return goals;
  }

  private defineOverallApproach(analysis: EmotionalAnalysis): string {
    const tempo = analysis.pacing_rhythm.tempo;
    const engagement = analysis.audience_engagement;
    
    if (tempo === "fast" && engagement > 0.8) {
      return "نهج سريع الإيقاع يركز على الإثارة والتشويق";
    }
    if (tempo === "slow" && engagement > 0.7) {
      return "نهج تأملي يركز على العمق العاطفي والشخصيات";
    }
    
    return "نهج متوازن يجمع بين التطوير العاطفي والتقدم السردي";
  }

  private mapAudienceJourney(analysis: EmotionalAnalysis): string {
    const keyMoments = analysis.key_moments.length;
    const engagement = analysis.audience_engagement;
    
    if (keyMoments > 3 && engagement > 0.8) {
      return "رحلة عاطفية غنية مع لحظات متعددة من التأثير والتفاعل";
    }
    
    return "رحلة عاطفية تدريجية تبني التعاطف والاستثمار العاطفي";
  }
}

export default EmotionalReadingAgent;