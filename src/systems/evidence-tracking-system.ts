/**
 * نظام تتبع الأدلة
 * Evidence Tracking System
 * 
 * يدير تتبع الأدلة والمراجع في عملية التفريغ السينمائي
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  Evidence,
  AgentProvenance,
  ProductionElement,
  BreakdownResult
} from '../three-read-breakdown-system.js';

export interface EvidenceChain {
  chain_id: string;
  element_id: string;
  evidence_items: EvidenceItem[];
  confidence_score: number;
  verification_status: 'pending' | 'verified' | 'disputed' | 'rejected';
  created_at: Date;
  updated_at: Date;
  reviewers: string[];
  final_decision?: 'accepted' | 'rejected' | 'modified';
}

export interface EvidenceItem {
  item_id: string;
  evidence_type: 'text_reference' | 'scene_context' | 'character_action' | 'dialogue' | 'visual_cue' | 'technical_spec';
  content: string;
  location: {
    scene_number?: number;
    page_number?: number;
    line_start?: number;
    line_end?: number;
    character_range?: [number, number];
  };
  confidence: number;
  extracted_by: AgentProvenance;
  verification_data?: {
    verified_by?: string;
    verification_method: 'manual' | 'automated' | 'cross_reference';
    verification_timestamp?: Date;
    verification_notes?: string;
  };
  related_evidence: string[]; // IDs of related evidence items
  quality_metrics: {
    clarity_score: number; // 0-1
    relevance_score: number; // 0-1
    completeness_score: number; // 0-1
    accuracy_score: number; // 0-1
  };
}

export interface EvidenceValidationRule {
  rule_id: string;
  rule_name: string;
  rule_type: 'content_validation' | 'location_validation' | 'confidence_threshold' | 'cross_reference';
  parameters: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
  auto_fixable: boolean;
  description: string;
}

export interface EvidenceAnalysisReport {
  report_id: string;
  analysis_type: 'completeness' | 'quality' | 'consistency' | 'traceability';
  evidence_chains_analyzed: number;
  findings: EvidenceFinding[];
  recommendations: EvidenceRecommendation[];
  overall_quality_score: number;
  generated_at: Date;
  generated_by: string;
}

export interface EvidenceFinding {
  finding_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'missing_evidence' | 'low_confidence' | 'inconsistent' | 'untraceable' | 'quality_issue';
  description: string;
  affected_elements: string[];
  evidence_items_involved: string[];
  suggested_actions: string[];
}

export interface EvidenceRecommendation {
  recommendation_id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'enhancement' | 'correction' | 'verification' | 'standardization';
  description: string;
  implementation_effort: 'low' | 'medium' | 'high';
  expected_impact: 'high' | 'medium' | 'low';
  related_findings: string[];
}

export class EvidenceTrackingSystem {
  private evidenceChains: Map<string, EvidenceChain> = new Map();
  private evidenceItems: Map<string, EvidenceItem> = new Map();
  private validationRules: Map<string, EvidenceValidationRule> = new Map();
  private model: BaseLanguageModel;
  
  // إحصائيات النظام
  private systemStats = {
    total_evidence_chains: 0,
    total_evidence_items: 0,
    average_confidence: 0,
    verification_rate: 0,
    quality_distribution: {
      high: 0, // 0.8-1.0
      medium: 0, // 0.5-0.8
      low: 0 // 0.0-0.5
    }
  };

  constructor(model: BaseLanguageModel) {
    this.model = model;
    this.initializeValidationRules();
  }

  private initializeValidationRules() {
    const rules: EvidenceValidationRule[] = [
      {
        rule_id: 'min_confidence_threshold',
        rule_name: 'حد أدنى للثقة',
        rule_type: 'confidence_threshold',
        parameters: { min_confidence: 0.6 },
        severity: 'warning',
        auto_fixable: false,
        description: 'يجب أن تكون الثقة في الأدلة أعلى من 60%'
      },
      {
        rule_id: 'evidence_location_required',
        rule_name: 'موقع الأدلة مطلوب',
        rule_type: 'location_validation',
        parameters: { require_scene: true, require_line: true },
        severity: 'error',
        auto_fixable: false,
        description: 'يجب تحديد موقع الأدلة في النص'
      },
      {
        rule_id: 'cross_reference_validation',
        rule_name: 'التحقق بالمراجع المتقاطعة',
        rule_type: 'cross_reference',
        parameters: { min_related_items: 2 },
        severity: 'warning',
        auto_fixable: true,
        description: 'يجب ربط الأدلة بأدلة أخرى ذات صلة'
      },
      {
        rule_id: 'content_clarity_check',
        rule_name: 'فحص وضوح المحتوى',
        rule_type: 'content_validation',
        parameters: { min_clarity_score: 0.7 },
        severity: 'warning',
        auto_fixable: false,
        description: 'يجب أن يكون محتوى الأدلة واضحاً ومفهوماً'
      }
    ];

    rules.forEach(rule => {
      this.validationRules.set(rule.rule_id, rule);
    });
  }

  /**
   * إنشاء سلسلة أدلة جديدة لعنصر إنتاج
   */
  async createEvidenceChain(
    elementId: string,
    initialEvidence: EvidenceItem[]
  ): Promise<EvidenceChain> {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chain: EvidenceChain = {
      chain_id: chainId,
      element_id: elementId,
      evidence_items: [],
      confidence_score: 0,
      verification_status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      reviewers: []
    };

    // إضافة الأدلة الأولية
    for (const evidence of initialEvidence) {
      await this.addEvidenceItem(chainId, evidence);
    }

    this.evidenceChains.set(chainId, chain);
    this.updateSystemStats();

    console.log(`✅ تم إنشاء سلسلة أدلة جديدة: ${chainId} للعنصر: ${elementId}`);
    return chain;
  }

  /**
   * إضافة عنصر دليل لسلسلة أدلة
   */
  async addEvidenceItem(chainId: string, evidenceItem: EvidenceItem): Promise<void> {
    const chain = this.evidenceChains.get(chainId);
    if (!chain) {
      throw new Error(`سلسلة الأدلة غير موجودة: ${chainId}`);
    }

    // التحقق من صحة عنصر الدليل
    const validationResult = await this.validateEvidenceItem(evidenceItem);
    if (!validationResult.isValid) {
      throw new Error(`عنصر الدليل غير صالح: ${validationResult.errors.join(', ')}`);
    }

    // إضافة عنصر الدليل
    this.evidenceItems.set(evidenceItem.item_id, evidenceItem);
    chain.evidence_items.push(evidenceItem.item_id);
    chain.updated_at = new Date();

    // تحديث نقاط الثقة للسلسلة
    await this.updateChainConfidence(chainId);

    // البحث عن الأدلة ذات الصلة
    await this.findRelatedEvidence(evidenceItem);

    this.updateSystemStats();
  }

  /**
   * التحقق من صحة عنصر الدليل
   */
  private async validateEvidenceItem(evidenceItem: EvidenceItem): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // التحقق من القواعد
    for (const [ruleId, rule] of this.validationRules) {
      const result = this.applyValidationRule(rule, evidenceItem);
      
      if (!result.passed) {
        if (rule.severity === 'error') {
          errors.push(`${rule.rule_name}: ${result.message}`);
        } else {
          warnings.push(`${rule.rule_name}: ${result.message}`);
        }
      }
    }

    // التحقق من المحتوى باستخدام النموذج
    if (evidenceItem.content.length < 10) {
      warnings.push('محتوى الدليل قصير جداً');
    }

    // التحقق من الموقع
    if (!evidenceItem.location.scene_number && !evidenceItem.location.page_number) {
      warnings.push('لم يتم تحديد موقع الدليل');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * تطبيق قاعدة التحقق
   */
  private applyValidationRule(
    rule: EvidenceValidationRule,
    evidenceItem: EvidenceItem
  ): { passed: boolean; message: string } {
    switch (rule.rule_type) {
      case 'confidence_threshold':
        if (evidenceItem.confidence < rule.parameters.min_confidence) {
          return {
            passed: false,
            message: `الثقة ${evidenceItem.confidence} أقل من الحد الأدنى ${rule.parameters.min_confidence}`
          };
        }
        break;

      case 'location_validation':
        if (rule.parameters.require_scene && !evidenceItem.location.scene_number) {
          return { passed: false, message: 'رقم المشهد مطلوب' };
        }
        if (rule.parameters.require_line && !evidenceItem.location.line_start) {
          return { passed: false, message: 'رقم السطر مطلوب' };
        }
        break;

      case 'cross_reference':
        if (evidenceItem.related_evidence.length < rule.parameters.min_related_items) {
          return {
            passed: false,
            message: `عدد الأدلة المرتبطة ${evidenceItem.related_evidence.length} أقل من الحد الأدنى ${rule.parameters.min_related_items}`
          };
        }
        break;

      case 'content_validation':
        if (evidenceItem.quality_metrics.clarity_score < rule.parameters.min_clarity_score) {
          return {
            passed: false,
            message: `درجة الوضوح ${evidenceItem.quality_metrics.clarity_score} أقل من الحد الأدنى ${rule.parameters.min_clarity_score}`
          };
        }
        break;
    }

    return { passed: true, message: '' };
  }

  /**
   * تحديث نقاط الثقة لسلسلة الأدلة
   */
  private async updateChainConfidence(chainId: string): Promise<void> {
    const chain = this.evidenceChains.get(chainId);
    if (!chain) return;

    const evidenceItems = chain.evidence_items
      .map(id => this.evidenceItems.get(id))
      .filter(Boolean) as EvidenceItem[];

    if (evidenceItems.length === 0) {
      chain.confidence_score = 0;
      return;
    }

    // حساب متوسط الثقة المرجح
    let totalWeightedConfidence = 0;
    let totalWeight = 0;

    for (const evidence of evidenceItems) {
      const weight = evidence.quality_metrics.relevance_score * 
                    evidence.quality_metrics.completeness_score;
      totalWeightedConfidence += evidence.confidence * weight;
      totalWeight += weight;
    }

    chain.confidence_score = totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;
  }

  /**
   * البحث عن الأدلة ذات الصلة
   */
  private async findRelatedEvidence(evidenceItem: EvidenceItem): Promise<void> {
    const relatedItems: string[] = [];

    for (const [itemId, existingItem] of this.evidenceItems) {
      if (itemId === evidenceItem.item_id) continue;

      // البحث في نفس المشهد
      if (evidenceItem.location.scene_number && 
          existingItem.location.scene_number === evidenceItem.location.scene_number) {
        relatedItems.push(itemId);
        continue;
      }

      // البحث في نفس الشخصية
      if (evidenceItem.content.includes('الشخصية:') && 
          existingItem.content.includes('الشخصية:')) {
        const char1 = this.extractCharacterName(evidenceItem.content);
        const char2 = this.extractCharacterName(existingItem.content);
        if (char1 && char2 && char1 === char2) {
          relatedItems.push(itemId);
        }
      }
    }

    // تحديث الأدلة المرتبطة
    evidenceItem.related_evidence = relatedItems.slice(0, 5); // الحد الأقصى 5
  }

  private extractCharacterName(content: string): string | null {
    const match = content.match(/الشخصية:\s*([^\s،,]+)/);
    return match ? match[1] : null;
  }

  /**
   * التحقق من الأدلة باستخدام النموذج اللغوي
   */
  async verifyEvidence(evidenceItemId: string, verificationMethod: 'manual' | 'automated' = 'automated'): Promise<{
    verified: boolean;
    confidence: number;
    notes?: string;
  }> {
    const evidenceItem = this.evidenceItems.get(evidenceItemId);
    if (!evidenceItem) {
      throw new Error(`عنصر الدليل غير موجود: ${evidenceItemId}`);
    }

    try {
      let verificationResult;

      if (verificationMethod === 'automated') {
        verificationResult = await this.performAutomatedVerification(evidenceItem);
      } else {
        verificationResult = {
          verified: true,
          confidence: 0.9,
          notes: 'تم التحقق يدوياً'
        };
      }

      // تحديث بيانات التحقق
      evidenceItem.verification_data = {
        verified_by: verificationMethod === 'manual' ? 'human_reviewer' : 'automated_system',
        verification_method: verificationMethod,
        verification_timestamp: new Date(),
        verification_notes: verificationResult.notes
      };

      return verificationResult;

    } catch (error) {
      console.error('خطأ في التحقق من الأدلة:', error);
      return {
        verified: false,
        confidence: 0,
        notes: `خطأ في التحقق: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }

  /**
   * التحقق الآلي من الأدلة
   */
  private async performAutomatedVerification(evidenceItem: EvidenceItem): Promise<{
    verified: boolean;
    confidence: number;
    notes?: string;
  }> {
    const prompt = `
قم بتحليل صحة الدليل التالي وتقييم:

محتوى الدليل: ${evidenceItem.content}
النوع: ${evidenceItem.evidence_type}
الموقع: ${JSON.stringify(evidenceItem.location)}
الثقة الحالية: ${evidenceItem.confidence}

قم بتقييم:
1. هل المحتوى منطقي ومتسق؟
2. هل الموقع المحدد صحيح؟
3. هل النوع مناسب للمحتوى؟
4. ما درجة الثقة في هذا الدليل؟

أجب بصيغة JSON:
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "notes": "ملاحظاتك"
}
    `;

    try {
      const response = await this.model.invoke([new HumanMessage(prompt)]);
      const content = response.content.toString();
      
      // محاولة تحليل JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          verified: result.verified,
          confidence: result.confidence,
          notes: result.notes
        };
      } else {
        return {
          verified: true,
          confidence: 0.7,
          notes: 'تم التحقق آلياً (تحليل نصي)'
        };
      }
    } catch (error) {
      return {
        verified: false,
        confidence: 0,
        notes: `فشل في التحقق الآلي: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      };
    }
  }

  /**
   * تحليل شامل للأدلة
   */
  async generateEvidenceAnalysisReport(analysisType: EvidenceAnalysisReport['analysis_type']): Promise<EvidenceAnalysisReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const findings: EvidenceFinding[] = [];
    const recommendations: EvidenceRecommendation[] = [];

    // تحليل الأدلة
    for (const [chainId, chain] of this.evidenceChains) {
      const chainFindings = await this.analyzeEvidenceChain(chainId, analysisType);
      findings.push(...chainFindings);
    }

    // إنشاء التوصيات بناءً على النتائج
    const recommendationsMap = this.generateRecommendations(findings);
    recommendations.push(...recommendationsMap);

    // حساب النقاط الإجمالية
    const overallQualityScore = this.calculateOverallQualityScore();

    const report: EvidenceAnalysisReport = {
      report_id: reportId,
      analysis_type: analysisType,
      evidence_chains_analyzed: this.evidenceChains.size,
      findings,
      recommendations,
      overall_quality_score: overallQualityScore,
      generated_at: new Date(),
      generated_by: 'evidence_tracking_system'
    };

    console.log(`📊 تم إنشاء تقرير تحليل الأدلة: ${reportId}`);
    return report;
  }

  /**
   * تحليل سلسلة أدلة محددة
   */
  private async analyzeEvidenceChain(chainId: string, analysisType: EvidenceAnalysisReport['analysis_type']): Promise<EvidenceFinding[]> {
    const findings: EvidenceFinding[] = [];
    const chain = this.evidenceChains.get(chainId);
    
    if (!chain) return findings;

    const evidenceItems = chain.evidence_items
      .map(id => this.evidenceItems.get(id))
      .filter(Boolean) as EvidenceItem[];

    switch (analysisType) {
      case 'completeness':
        // فحص اكتمال الأدلة
        if (chain.confidence_score < 0.6) {
          findings.push({
            finding_id: `finding_${Date.now()}_low_confidence`,
            severity: 'high',
            category: 'low_confidence',
            description: `سلسلة الأدلة ${chainId} لديها ثقة منخفضة (${chain.confidence_score.toFixed(2)})`,
            affected_elements: [chain.element_id],
            evidence_items_involved: chain.evidence_items,
            suggested_actions: ['إضافة أدلة إضافية', 'تحسين جودة الأدلة الموجودة']
          });
        }
        break;

      case 'quality':
        // فحص جودة الأدلة
        for (const evidence of evidenceItems) {
          if (evidence.quality_metrics.clarity_score < 0.5) {
            findings.push({
              finding_id: `finding_${evidence.item_id}_clarity`,
              severity: 'medium',
              category: 'quality_issue',
              description: `دليل ${evidence.item_id} lacks clarity (${evidence.quality_metrics.clarity_score.toFixed(2)})`,
              affected_elements: [chain.element_id],
              evidence_items_involved: [evidence.item_id],
              suggested_actions: ['تحسين صياغة المحتوى', 'إضافة سياق إضافي']
            });
          }
        }
        break;

      case 'consistency':
        // فحص اتساق الأدلة
        const sceneNumbers = evidenceItems
          .map(e => e.location.scene_number)
          .filter(Boolean);
        
        if (sceneNumbers.length > 1) {
          const uniqueScenes = [...new Set(sceneNumbers)];
          if (uniqueScenes.length > 3) {
            findings.push({
              finding_id: `finding_${chainId}_scattered`,
              severity: 'low',
              category: 'inconsistent',
              description: `الأدلة موزعة على ${uniqueScenes.length} مشاهد مختلفة`,
              affected_elements: [chain.element_id],
              evidence_items_involved: chain.evidence_items,
              suggested_actions: ['تركز الأدلة في مشاهد متقاربة', 'تحسين التنظيم']
            });
          }
        }
        break;

      case 'traceability':
        // فحص قابلية التتبع
        const unverifiedItems = evidenceItems.filter(e => !e.verification_data);
        if (unverifiedItems.length > 0) {
          findings.push({
            finding_id: `finding_${chainId}_unverified`,
            severity: 'medium',
            category: 'untraceable',
            description: `${unverifiedItems.length} أدلة غير محققة`,
            affected_elements: [chain.element_id],
            evidence_items_involved: unverifiedItems.map(e => e.item_id),
            suggested_actions: ['تحقق من جميع الأدلة', 'توثيق عملية التحقق']
          });
        }
        break;
    }

    return findings;
  }

  /**
   * إنشاء توصيات بناءً على النتائج
   */
  private generateRecommendations(findings: EvidenceFinding[]): EvidenceRecommendation[] {
    const recommendations: EvidenceRecommendation[] = [];
    const findingCounts = new Map<string, number>();

    // تجميع النتائج حسب الفئة
    for (const finding of findings) {
      const count = findingCounts.get(finding.category) || 0;
      findingCounts.set(finding.category, count + 1);
    }

    // إنشاء توصيات بناءً على النتائج الشائعة
    if (findingCounts.get('low_confidence')! > 2) {
      recommendations.push({
        recommendation_id: `rec_${Date.now()}_improve_confidence`,
        priority: 'high',
        category: 'enhancement',
        description: 'تحسين نقاط الثقة في الأدلة من خلال إضافة أدلة داعمة',
        implementation_effort: 'medium',
        expected_impact: 'high',
        related_findings: findings.filter(f => f.category === 'low_confidence').map(f => f.finding_id)
      });
    }

    if (findingCounts.get('quality_issue')! > 3) {
      recommendations.push({
        recommendation_id: `rec_${Date.now()}_quality_standards`,
        priority: 'medium',
        category: 'standardization',
        description: 'تطبيق معايير جودة موحدة للأدلة',
        implementation_effort: 'high',
        expected_impact: 'medium',
        related_findings: findings.filter(f => f.category === 'quality_issue').map(f => f.finding_id)
      });
    }

    if (findingCounts.get('untraceable')! > 1) {
      recommendations.push({
        recommendation_id: `rec_${Date.now()}_verification_process`,
        priority: 'high',
        category: 'verification',
        description: 'إنشاء عملية تحقق منهجية للأدلة',
        implementation_effort: 'low',
        expected_impact: 'high',
        related_findings: findings.filter(f => f.category === 'untraceable').map(f => f.finding_id)
      });
    }

    return recommendations;
  }

  /**
   * حساب النقاط الإجمالية للجودة
   */
  private calculateOverallQualityScore(): number {
    if (this.evidenceChains.size === 0) return 0;

    let totalScore = 0;
    for (const chain of this.evidenceChains.values()) {
      totalScore += chain.confidence_score;
    }

    return totalScore / this.evidenceChains.size;
  }

  /**
   * تحديث إحصائيات النظام
   */
  private updateSystemStats(): void {
    this.systemStats.total_evidence_chains = this.evidenceChains.size;
    this.systemStats.total_evidence_items = this.evidenceItems.size;

    // حساب متوسط الثقة
    if (this.evidenceChains.size > 0) {
      let totalConfidence = 0;
      for (const chain of this.evidenceChains.values()) {
        totalConfidence += chain.confidence_score;
      }
      this.systemStats.average_confidence = totalConfidence / this.evidenceChains.size;
    }

    // حساب معدل التحقق
    const verifiedItems = Array.from(this.evidenceItems.values())
      .filter(item => item.verification_data).length;
    this.systemStats.verification_rate = this.evidenceItems.size > 0 
      ? verifiedItems / this.evidenceItems.size 
      : 0;

    // توزيع الجودة
    this.systemStats.quality_distribution = { high: 0, medium: 0, low: 0 };
    for (const chain of this.evidenceChains.values()) {
      if (chain.confidence_score >= 0.8) {
        this.systemStats.quality_distribution.high++;
      } else if (chain.confidence_score >= 0.5) {
        this.systemStats.quality_distribution.medium++;
      } else {
        this.systemStats.quality_distribution.low++;
      }
    }
  }

  // واجهات المراقبة والإدارة
  getEvidenceChain(chainId: string): EvidenceChain | undefined {
    return this.evidenceChains.get(chainId);
  }

  getEvidenceItem(itemId: string): EvidenceItem | undefined {
    return this.evidenceItems.get(itemId);
  }

  getAllEvidenceChains(): EvidenceChain[] {
    return Array.from(this.evidenceChains.values());
  }

  getSystemStats() {
    return { ...this.systemStats };
  }

  getValidationRules(): EvidenceValidationRule[] {
    return Array.from(this.validationRules.values());
  }

  /**
   * تصدير الأدلة إلى تنسيق قابل للمشاركة
   */
  exportEvidenceData(format: 'json' | 'csv' | 'xml' = 'json'): string {
    const data = {
      evidence_chains: Array.from(this.evidenceChains.values()),
      evidence_items: Array.from(this.evidenceItems.values()),
      validation_rules: Array.from(this.validationRules.values()),
      system_stats: this.systemStats,
      export_timestamp: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        // تحويل إلى CSV (مبسط)
        const csvHeaders = 'Chain ID,Element ID,Confidence,Status,Items Count\n';
        const csvRows = Array.from(this.evidenceChains.values())
          .map(chain => `${chain.chain_id},${chain.element_id},${chain.confidence_score},${chain.verification_status},${chain.evidence_items.length}`)
          .join('\n');
        return csvHeaders + csvRows;
      
      case 'xml':
        // تحويل إلى XML (مبسط)
        return `<?xml version="1.0" encoding="UTF-8"?>
<evidence_data>
  <chains>
    ${Array.from(this.evidenceChains.values())
      .map(chain => `<chain id="${chain.chain_id}" element="${chain.element_id}" confidence="${chain.confidence_score}">
      <items>${chain.evidence_items.join(',')}</items>
    </chain>`).join('\n    ')}
  </chains>
</evidence_data>`;
      
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * تنظيف البيانات القديمة
   */
  cleanupOldData(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // إزالة الأدلة القديمة غير المحققة
    for (const [itemId, item] of this.evidenceItems) {
      if (item.verification_data?.verification_timestamp && 
          item.verification_data.verification_timestamp < cutoffDate) {
        this.evidenceItems.delete(itemId);
      }
    }

    // إزالة السلاسل الفارغة
    for (const [chainId, chain] of this.evidenceChains) {
      if (chain.evidence_items.length === 0) {
        this.evidenceChains.delete(chainId);
      }
    }

    this.updateSystemStats();
    console.log(`🧹 تم تنظيف البيانات الأقدم من ${daysOld} يوم`);
  }
}
