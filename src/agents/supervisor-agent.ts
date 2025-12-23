/**
 * وكيل الإشراف والتحكيم
 * Supervisor Agent for Multi-Agent System
 * 
 * يدير ويعقد بين نتائج الوكلاء المختلفة ويحل النزاعات
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ModelManager, PythonBrainService } from '../three-read-breakdown-system.js';
import {
  SupervisorDecision,
  EmotionalAnalysis,
  TechnicalValidation,
  BreakdownResult,
  ProductionElement
} from '../three-read-breakdown-system.js';
import { sanitizeLogInput } from '../utils/security-helpers.js';


export interface ConflictDetection {
  conflict_id: string;
  type: 'classification_conflict' | 'missing_elements' | 'quality_issue' | 'inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  agents_involved: string[];
  evidence: any;
  suggested_resolution: string;
}

export interface SupervisionContext {
  emotional_analysis: EmotionalAnalysis;
  technical_validation: TechnicalValidation;
  breakdown_results: BreakdownResult[];
  confidence_threshold: number;
  human_review_threshold: number;
}

export class SupervisorAgent {
  private model: BaseLanguageModel;
  private pythonService: PythonBrainService;
  private conflictHistory: Map<string, SupervisorDecision> = new Map();

  constructor(modelManager: ModelManager, pythonService: PythonBrainService) {
    this.model = modelManager.getModel("supervision");
    this.pythonService = pythonService;
  }

  async superviseAnalysis(context: SupervisionContext): Promise<{
    conflicts_detected: ConflictDetection[];
    decisions_made: SupervisorDecision[];
    final_elements: ProductionElement[];
    quality_assessment: {
      overall_confidence: number;
      human_review_required: boolean;
      critical_issues: string[];
    };
  }> {
    console.log("🎯 بدء عملية الإشراف والتحكيم...");

    // 1. كشف النزاعات
    const conflicts = await this.detectConflicts(context);
    console.log(`📋 تم كشف ${sanitizeLogInput(conflicts.length)} نزاع`);

    // 2. حل النزاعات
    const decisions = await this.resolveConflicts(conflicts, context);
    console.log(`⚖️ تم اتخاذ ${sanitizeLogInput(decisions.length)} قرار`);

    // 3. دمج النتائج النهائية
    const finalElements = await this.mergeFinalResults(context, decisions);
    
    // 4. تقييم الجودة
    const qualityAssessment = await this.assessQuality(context, finalElements, decisions);

    console.log("✅ اكتملت عملية الإشراف");
    
    return {
      conflicts_detected: conflicts,
      decisions_made: decisions,
      final_elements: finalElements,
      quality_assessment: qualityAssessment
    };
  }

  private async detectConflicts(context: SupervisionContext): Promise<ConflictDetection[]> {
    const conflicts: ConflictDetection[] = [];

    // فحص نزاعات التصنيف
    const classificationConflicts = this.detectClassificationConflicts(context);
    conflicts.push(...classificationConflicts);

    // فحص العناصر المفقودة
    const missingElements = this.detectMissingElements(context);
    conflicts.push(...missingElements);

    // فحص مشاكل الجودة
    const qualityIssues = this.detectQualityIssues(context);
    conflicts.push(...qualityIssues);

    // فحص عدم الاتساق
    const inconsistencies = this.detectInconsistencies(context);
    conflicts.push(...inconsistencies);

    return conflicts;
  }

  private detectClassificationConflicts(context: SupervisionContext): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];
    
    // مقارنة نتائج التفريغ مع التحليل التقني
    context.breakdown_results.forEach((breakdown, index) => {
      breakdown.elements.forEach(element => {
        // فحص منطقية التصنيف
        if (!this.isLogicalClassification(element, context.technical_validation)) {
          conflicts.push({
            conflict_id: `class_conflict_${index}_${element.id}`,
            type: 'classification_conflict',
            severity: 'medium',
            description: `تصنيف غير منطقي للعنصر: ${element.name}`,
            agents_involved: ['breakdown', 'technical'],
            evidence: {
              element,
              technical_context: context.technical_validation
            },
            suggested_resolution: 'مراجعة التصنيف مع السياق التقني'
          });
        }
      });
    });

    return conflicts;
  }

  private detectMissingElements(context: SupervisionContext): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];
    
    // فحص العناصر المهمة المفقودة
    const expectedElements = this.extractExpectedElements(context.technical_validation);
    const foundElements = context.breakdown_results.flatMap(r => r.elements);
    
    expectedElements.forEach(expected => {
      const isFound = foundElements.some(found => 
        found.name.toLowerCase().includes(expected.toLowerCase())
      );
      
      if (!isFound) {
        conflicts.push({
          conflict_id: `missing_${expected.replace(/\s+/g, '_')}`,
          type: 'missing_elements',
          severity: expected.includes('مهم') ? 'high' : 'medium',
          description: `عنصر مهم مفقود: ${expected}`,
          agents_involved: ['breakdown'],
          evidence: {
            expected_element: expected,
            technical_context: context.technical_validation
          },
          suggested_resolution: 'إعادة فحص المشهد للعنصر المفقود'
        });
      }
    });

    return conflicts;
  }

  private detectQualityIssues(context: SupervisionContext): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];
    
    // فحص مستوى الثقة
    context.breakdown_results.forEach((breakdown, index) => {
      const lowConfidenceElements = breakdown.elements.filter(
        element => element.confidence < context.confidence_threshold
      );
      
      if (lowConfidenceElements.length > 0) {
        conflicts.push({
          conflict_id: `quality_${index}`,
          type: 'quality_issue',
          severity: 'high',
          description: `${lowConfidenceElements.length} عناصر بثقة منخفضة`,
          agents_involved: ['breakdown'],
          evidence: {
            low_confidence_elements: lowConfidenceElements,
            threshold: context.confidence_threshold
          },
          suggested_resolution: 'مراجعة العناصر منخفضة الثقة'
        });
      }
    });

    return conflicts;
  }

  private detectInconsistencies(context: SupervisionContext): ConflictDetection[] {
    const conflicts: ConflictDetection[] = [];
    
    // فحص اتساق الشخصيات
    const characterInconsistencies = context.technical_validation.character_consistency.inconsistencies;
    
    characterInconsistencies.forEach(inconsistency => {
      conflicts.push({
        conflict_id: `char_inconsistency_${inconsistency.character}`,
        type: 'inconsistency',
        severity: 'medium',
        description: `عدم اتساق في الشخصية: ${inconsistency.character}`,
        agents_involved: ['technical'],
        evidence: inconsistency,
        suggested_resolution: 'مراجعة اتساق الشخصية عبر المشاهد'
      });
    });

    return conflicts;
  }

  private async resolveConflicts(
    conflicts: ConflictDetection[], 
    context: SupervisionContext
  ): Promise<SupervisorDecision[]> {
    const decisions: SupervisorDecision[] = [];

    for (const conflict of conflicts) {
      const decision = await this.makeDecision(conflict, context);
      decisions.push(decision);
      
      // حفظ القرار في التاريخ
      this.conflictHistory.set(conflict.conflict_id, decision);
    }

    return decisions;
  }

  private async makeDecision(
    conflict: ConflictDetection, 
    context: SupervisionContext
  ): Promise<SupervisorDecision> {
    const systemPrompt = `أنت وكيل إشراف متخصص في حل النزاعات بين نتائج الوكلاء المختلفة.

النزاع: ${conflict.description}
النوع: ${conflict.type}
الخطورة: ${conflict.severity}
الوكلاء involved: ${conflict.agents_involved.join(', ')}

القواعد:
1. اختر الحل الأنسب من: prefer_original_text, merge_results, request_human_review, escalate
2. قدم reasoning واضح للقرار
3. قيم مستوى الثقة في القرار (0-1)

أخرج القرار بصيغة JSON:
{
  "resolution": "نوع الحل",
  "final_decision": {},
  "confidence": 0.0,
  "reasoning": ["سبب 1", "سبب 2"]
}`;

    try {
      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`السياق: ${JSON.stringify(conflict.evidence)}`)
      ];
      
      const response = await this.model.invoke(messages);
      
      // محاولة تحليل JSON
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const decisionData = JSON.parse(jsonMatch[0]);
        
        return {
          conflict_id: conflict.conflict_id,
          agents_involved: conflict.agents_involved,
          conflict_type: conflict.type,
          resolution: decisionData.resolution,
          final_decision: decisionData.final_decision,
          confidence: decisionData.confidence,
          reasoning: decisionData.reasoning
        };
      }
    } catch (error) {
      console.warn("خطأ في اتخاذ القرار:", error);
    }

    // قرار افتراضي
    return {
      conflict_id: conflict.conflict_id,
      agents_involved: conflict.agents_involved,
      conflict_type: conflict.type,
      resolution: 'request_human_review',
      final_decision: { message: 'مراجعة يدوية مطلوبة' },
      confidence: 0.5,
      reasoning: ['خطأ في معالجة القرار', 'مراجعة يدوية مطلوبة']
    };
  }

  private async mergeFinalResults(
    context: SupervisionContext, 
    decisions: SupervisorDecision[]
  ): Promise<ProductionElement[]> {
    let allElements = context.breakdown_results.flatMap(r => r.elements);

    // تطبيق القرارات على العناصر
    for (const decision of decisions) {
      if (decision.resolution === 'merge_results') {
        // دمج النتائج
        allElements = this.mergeElements(allElements, decision);
      } else if (decision.resolution === 'prefer_original_text') {
        // الاحتفاظ بالنص الأصلي
        allElements = this.filterByOriginalText(allElements, decision);
      }
    }

    // إزالة التكرارات
    return this.removeDuplicates(allElements);
  }

  private async assessQuality(
    context: SupervisionContext,
    finalElements: ProductionElement[],
    decisions: SupervisorDecision[]
  ): Promise<{
    overall_confidence: number;
    human_review_required: boolean;
    critical_issues: string[];
  }> {
    const criticalIssues: string[] = [];
    
    // فحص مستوى الثقة العام
    const avgConfidence = finalElements.reduce((sum, el) => sum + el.confidence, 0) / finalElements.length;
    
    // فحص القرارات الحرجة
    const criticalDecisions = decisions.filter(d => d.confidence < 0.6);
    if (criticalDecisions.length > 0) {
      criticalIssues.push(`${criticalDecisions.length} قرارات منخفضة الثقة`);
    }

    // فحص العناصر المفقودة
    const missingElementDecisions = decisions.filter(d => d.conflict_type === 'missing_elements');
    if (missingElementDecisions.length > 0) {
      criticalIssues.push(`${missingElementDecisions.length} عناصر مفقودة`);
    }

    const humanReviewRequired = 
      avgConfidence < context.human_review_threshold ||
      criticalIssues.length > 0 ||
      decisions.some(d => d.resolution === 'request_human_review');

    return {
      overall_confidence: avgConfidence,
      human_review_required: humanReviewRequired,
      critical_issues: criticalIssues
    };
  }

  // Helper methods
  private isLogicalClassification(element: any, technicalValidation: TechnicalValidation): boolean {
    // منطق فحص التصنيف المنطقي
    return true; // مبسط للاختبار
  }

  private extractExpectedElements(technicalValidation: TechnicalValidation): string[] {
    // استخراج العناصر المتوقعة من التحليل التقني
    return ['شخصيات مهمة', 'دعائم أساسية', 'مواقع رئيسية'];
  }

  private mergeElements(elements: ProductionElement[], decision: SupervisorDecision): ProductionElement[] {
    // دمج العناصر حسب القرار
    return elements;
  }

  private filterByOriginalText(elements: ProductionElement[], decision: SupervisorDecision): ProductionElement[] {
    // تصفية حسب النص الأصلي
    return elements;
  }

  private removeDuplicates(elements: ProductionElement[]): ProductionElement[] {
    const seen = new Set<string>();
    return elements.filter(element => {
      const key = `${element.name}_${element.category}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private mergeEmotionalAnalysis(base: any, pythonResult: any): any {
    // دمج التحليل العاطفي مع نتائج Python
    return { ...base, ...pythonResult };
  }
}
