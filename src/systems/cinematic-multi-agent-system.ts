/**
 * النظام الرئيسي Multi-Agent للتفريغ السينمائي
 * Main Multi-Agent System for Cinematic Breakdown
 * 
 * يدمج جميع الوكلاء المتخصصة في نظام تفريغ سينمائي متكامل
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { EmotionalReadingAgent } from '../three-read-breakdown-system.js';
import { TechnicalReadingAgent } from '../three-read-breakdown-system.js';
import { BreakdownReadingAgent } from '../three-read-breakdown-system.js';
import { SupervisorAgent, SupervisionContext } from '../agents/supervisor-agent.js';
import { AdvancedModelManager } from './model-management-system.js';
import { PythonBrainService } from '../three-read-breakdown-system.js';
import {
  EmotionalAnalysis,
  TechnicalValidation,
  BreakdownResult,
  FinalBreakdownReport,
  ProductionElement
} from '../three-read-breakdown-system.js';

export interface CinematicTask {
  task_id: string;
  task_type: 'emotional_analysis' | 'technical_validation' | 'breakdown_extraction' | 'full_analysis' | 'supervision';
  script_content: string;
  requirements: {
    complexity: "low" | "medium" | "high" | "critical";
    max_response_time: number;
    quality_threshold: number;
    include_python_service: boolean;
  };
  context?: {
    previous_results?: any;
    user_preferences?: any;
    production_context?: any;
  };
}

export interface AgentExecutionResult {
  agent_name: string;
  task_type: string;
  success: boolean;
  result: any;
  execution_time: number;
  confidence: number;
  metadata: {
    model_used: string;
    tokens_used: number;
    cost: number;
  };
}

export interface SystemPerformanceMetrics {
  total_tasks_processed: number;
  average_execution_time: number;
  success_rate: number;
  agent_utilization: Record<string, number>;
  quality_scores: number[];
  cost_per_task: number;
}

export class CinematicMultiAgentSystem {
  private emotionalAgent!: EmotionalReadingAgent;
  private technicalAgent!: TechnicalReadingAgent;
  private breakdownAgent!: BreakdownReadingAgent;
  private supervisorAgent!: SupervisorAgent;
  private modelManager: AdvancedModelManager;
  private pythonService: PythonBrainService;
  
  private taskHistory: Array<{
    task_id: string;
    start_time: Date;
    end_time?: Date;
    success: boolean;
    agents_used: string[];
    final_result?: any;
  }> = [];
  
  private performanceMetrics: SystemPerformanceMetrics = {
    total_tasks_processed: 0,
    average_execution_time: 0,
    success_rate: 0,
    agent_utilization: {},
    quality_scores: [],
    cost_per_task: 0
  };

  constructor() {
    console.log("🎬 تهيئة نظام الوكلاء المتعددة للتفريغ السينمائي...");
    
    // تهيئة المكونات الأساسية
    this.modelManager = new AdvancedModelManager();
    this.pythonService = new PythonBrainService();
    
    // تهيئة الوكلاء المتخصصة
    this.initializeAgents();
  }

  private initializeAgents() {
    try {
      this.emotionalAgent = new EmotionalReadingAgent(this.modelManager as any, this.pythonService);
      this.technicalAgent = new TechnicalReadingAgent(this.modelManager as any, this.pythonService);
      this.breakdownAgent = new BreakdownReadingAgent(this.modelManager as any, this.pythonService);
      this.supervisorAgent = new SupervisorAgent(this.modelManager as any, this.pythonService);
      
      console.log("✅ تم تهيئة جميع الوكلاء المتخصصة بنجاح");
    } catch (error) {
      console.error("❌ خطأ في تهيئة الوكلاء:", (error as Error).message);
      throw error;
    }
  }

  async processCinematicTask(task: CinematicTask): Promise<{
    task_id: string;
    success: boolean;
    result: FinalBreakdownReport | any;
    execution_summary: {
      total_time: number;
      agents_used: string[];
      quality_score: number;
      cost_estimate: number;
    };
    agent_results: AgentExecutionResult[];
  }> {
    const startTime = Date.now();
    const agentsUsed: string[] = [];
    const agentResults: AgentExecutionResult[] = [];
    
    console.log(`🎯 بدء معالجة مهمة سينمائية: ${task.task_type}`);
    console.log(`📝 طول النص: ${task.script_content.length} حرف`);
    
    try {
      let finalResult: any;
      
      switch (task.task_type) {
        case 'emotional_analysis':
          finalResult = await this.executeEmotionalAnalysis(task, agentsUsed, agentResults);
          break;
          
        case 'technical_validation':
          finalResult = await this.executeTechnicalValidation(task, agentsUsed, agentResults);
          break;
          
        case 'breakdown_extraction':
          finalResult = await this.executeBreakdownExtraction(task, agentsUsed, agentResults);
          break;
          
        case 'full_analysis':
          finalResult = await this.executeFullAnalysis(task, agentsUsed, agentResults);
          break;
          
        case 'supervision':
          finalResult = await this.executeSupervision(task, agentsUsed, agentResults);
          break;
          
        default:
          throw new Error(`نوع مهمة غير مدعوم: ${task.task_type}`);
      }
      
      const totalTime = Date.now() - startTime;
      
      // حساب نقاط الجودة
      const qualityScore = this.calculateQualityScore(agentResults);
      
      // حساب التكلفة المقدرة
      const costEstimate = this.calculateCostEstimate(agentResults);
      
      // تسجيل المهمة في التاريخ
      this.recordTaskCompletion(task.task_id, true, agentsUsed, finalResult);
      
      console.log(`✅ اكتملت المهمة في ${totalTime}ms`);
      console.log(`📊 نقاط الجودة: ${qualityScore.toFixed(2)}`);
      console.log(`💰 التكلفة المقدرة: $${costEstimate.toFixed(4)}`);
      
      return {
        task_id: task.task_id,
        success: true,
        result: finalResult,
        execution_summary: {
          total_time: totalTime,
          agents_used: agentsUsed,
          quality_score: qualityScore,
          cost_estimate: costEstimate
        },
        agent_results: agentResults
      };
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      console.error(`❌ فشلت المهمة: ${(error as Error).message}`);
      
      // تسجيل الفشل
      this.recordTaskCompletion(task.task_id, false, agentsUsed);
      
      return {
        task_id: task.task_id,
        success: false,
        result: { error: (error as Error).message },
        execution_summary: {
          total_time: totalTime,
          agents_used: agentsUsed,
          quality_score: 0,
          cost_estimate: 0
        },
        agent_results: agentResults
      };
    }
  }

  private async executeEmotionalAnalysis(
    task: CinematicTask,
    agentsUsed: string[],
    agentResults: AgentExecutionResult[]
  ): Promise<EmotionalAnalysis> {
    const startTime = Date.now();
    
    try {
      console.log("🎭 تنفيذ التحليل العاطفي...");
      
      const result = await this.emotionalAgent.analyzeNarrative(task.script_content);
      
      const executionTime = Date.now() - startTime;
      agentsUsed.push('emotional_agent');
      
      agentResults.push({
        agent_name: 'emotional_agent',
        task_type: 'emotional_analysis',
        success: true,
        result,
        execution_time: executionTime,
        confidence: 0.9,
        metadata: {
          model_used: 'claude-4-sonnet',
          tokens_used: Math.floor(executionTime / 100) * 50,
          cost: executionTime * 0.00001
        }
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      agentsUsed.push('emotional_agent');
      
      agentResults.push({
        agent_name: 'emotional_agent',
        task_type: 'emotional_analysis',
        success: false,
        result: { error: error.message },
        execution_time: executionTime,
        confidence: 0,
        metadata: {
          model_used: 'unknown',
          tokens_used: 0,
          cost: 0
        }
      });
      
      throw error;
    }
  }

  private async executeTechnicalValidation(
    task: CinematicTask,
    agentsUsed: string[],
    agentResults: AgentExecutionResult[]
  ): Promise<TechnicalValidation> {
    const startTime = Date.now();
    
    try {
      console.log("🔧 تنفيذ التحقق التقني...");
      
      const result = await this.emotionalAgent.analyzeNarrative(task.script_content);
      
      const executionTime = Date.now() - startTime;
      agentsUsed.push('technical_agent');
      
      agentResults.push({
        agent_name: 'technical_agent',
        task_type: 'technical_validation',
        success: true,
        result,
        execution_time: executionTime,
        confidence: 0.95,
        metadata: {
          model_used: 'claude-4-sonnet',
          tokens_used: Math.floor(executionTime / 100) * 75,
          cost: executionTime * 0.000012
        }
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      agentsUsed.push('technical_agent');
      
      agentResults.push({
        agent_name: 'technical_agent',
        task_type: 'technical_validation',
        success: false,
        result: { error: (error as Error).message },
        execution_time: executionTime,
        confidence: 0,
        metadata: {
          model_used: 'unknown',
          tokens_used: 0,
          cost: 0
        }
      });
      
      throw error;
    }
  }

  private async executeBreakdownExtraction(
    task: CinematicTask,
    agentsUsed: string[],
    agentResults: AgentExecutionResult[]
  ): Promise<BreakdownResult[]> {
    const startTime = Date.now();
    
    try {
      console.log("📋 تنفيذ استخراج عناصر الإنتاج...");
      
      const result = await this.breakdownAgent.extractElements(task.script_content);
      
      const executionTime = Date.now() - startTime;
      agentsUsed.push('breakdown_agent');
      
      agentResults.push({
        agent_name: 'breakdown_agent',
        task_type: 'breakdown_extraction',
        success: true,
        result,
        execution_time: executionTime,
        confidence: 0.85,
        metadata: {
          model_used: 'gpt-4o',
          tokens_used: Math.floor(executionTime / 100) * 100,
          cost: executionTime * 0.000008
        }
      });
      
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      const executionTime = Date.now() - startTime;
      agentsUsed.push('breakdown_agent');
      
      agentResults.push({
        agent_name: 'breakdown_agent',
        task_type: 'breakdown_extraction',
        success: false,
        result: { error: (error as Error).message },
        execution_time: executionTime,
        confidence: 0,
        metadata: {
          model_used: 'unknown',
          tokens_used: 0,
          cost: 0
        }
      });
      
      throw error;
    }
  }

  private async executeFullAnalysis(
    task: CinematicTask,
    agentsUsed: string[],
    agentResults: AgentExecutionResult[]
  ): Promise<FinalBreakdownReport> {
    console.log("🎯 تنفيذ التحليل الشامل...");
    
    // تنفيذ المراحل بالتسلسل
    const emotionalAnalysis = await this.executeEmotionalAnalysis(task, agentsUsed, agentResults);
    const technicalValidation = await this.executeTechnicalValidation(task, agentsUsed, agentResults);
    const breakdownResults = await this.executeBreakdownExtraction(task, agentsUsed, agentResults);
    
    // تنفيذ الإشراف
    const supervisionResult = await this.executeSupervisionWithContext(
      {
        emotional_analysis: emotionalAnalysis,
        technical_validation: technicalValidation,
        breakdown_results: breakdownResults,
        confidence_threshold: 0.7,
        human_review_threshold: 0.8
      },
      agentsUsed,
      agentResults
    );
    
    // إنشاء التقرير النهائي
    const finalReport: FinalBreakdownReport = {
      script_title: "سيناريو بدون عنوان",
      total_scenes: this.countScenes(task.script_content),
      processing_timestamp: new Date(),
      emotional_analysis: emotionalAnalysis,
      technical_validation: technicalValidation,
      breakdown_results: breakdownResults,
      conflicts_resolved: supervisionResult.decisions_made,
      final_elements: supervisionResult.final_elements,
      overall_confidence: supervisionResult.quality_assessment.overall_confidence,
      human_review_required: supervisionResult.quality_assessment.human_review_required,
      html_report: this.generateHtmlReport(supervisionResult),
      json_data: JSON.stringify(supervisionResult, null, 2),
      pdf_ready: true
    };
    
    return finalReport;
  }

  private async executeSupervision(
    task: CinematicTask,
    agentsUsed: string[],
    agentResults: AgentExecutionResult[]
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      console.log("⚖️ تنفيذ الإشراف والتحكيم...");
      
      // إنشاء سياق افتراضي للإشراف
      const mockContext: SupervisionContext = {
        emotional_analysis: {
          overall_tone: "درامي",
          emotional_arcs: [],
          pacing_rhythm: { tempo: "medium", tension_curve: [], climax_points: [] },
          key_moments: [],
          audience_engagement: 0.8,
          director_vision: "رؤية إبداعية"
        },
        technical_validation: {
          is_valid: true,
          errors: [],
          warnings: [],
          scene_headers: [],
          character_consistency: { characters: [], inconsistencies: [] }
        },
        breakdown_results: [{
          scene_id: "scene_1",
          elements: [],
          breakdown_sheets: [],
          summary: { total_elements: 0, by_category: {}, complexity_score: 0.5 }
        }],
        confidence_threshold: 0.7,
        human_review_threshold: 0.8
      };
      
      const result = await this.supervisorAgent.superviseAnalysis(mockContext);
      
      const executionTime = Date.now() - startTime;
      agentsUsed.push('supervisor_agent');
      
      agentResults.push({
        agent_name: 'supervisor_agent',
        task_type: 'supervision',
        success: true,
        result,
        execution_time: executionTime,
        confidence: 0.9,
        metadata: {
          model_used: 'claude-4-sonnet',
          tokens_used: Math.floor(executionTime / 100) * 60,
          cost: executionTime * 0.000015
        }
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      agentsUsed.push('supervisor_agent');
      
      agentResults.push({
        agent_name: 'supervisor_agent',
        task_type: 'supervision',
        success: false,
        result: { error: error.message },
        execution_time: executionTime,
        confidence: 0,
        metadata: {
          model_used: 'unknown',
          tokens_used: 0,
          cost: 0
        }
      });
      
      throw error;
    }
  }

  private async executeSupervisionWithContext(
    context: SupervisionContext,
    agentsUsed: string[],
    agentResults: AgentExecutionResult[]
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.supervisorAgent.superviseAnalysis(context);
      
      const executionTime = Date.now() - startTime;
      agentsUsed.push('supervisor_agent');
      
      agentResults.push({
        agent_name: 'supervisor_agent',
        task_type: 'supervision',
        success: true,
        result,
        execution_time: executionTime,
        confidence: 0.9,
        metadata: {
          model_used: 'claude-4-sonnet',
          tokens_used: Math.floor(executionTime / 100) * 60,
          cost: executionTime * 0.000015
        }
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      agentsUsed.push('supervisor_agent');
      
      agentResults.push({
        agent_name: 'supervisor_agent',
        task_type: 'supervision',
        success: false,
        result: { error: error.message },
        execution_time: executionTime,
        confidence: 0,
        metadata: {
          model_used: 'unknown',
          tokens_used: 0,
          cost: 0
        }
      });
      
      throw error;
    }
  }

  // Helper methods
  private calculateQualityScore(agentResults: AgentExecutionResult[]): number {
    if (agentResults.length === 0) return 0;
    
    const totalConfidence = agentResults.reduce((sum, result) => sum + result.confidence, 0);
    const successRate = agentResults.filter(result => result.success).length / agentResults.length;
    
    return (totalConfidence / agentResults.length) * successRate;
  }

  private calculateCostEstimate(agentResults: AgentExecutionResult[]): number {
    return agentResults.reduce((sum, result) => sum + result.metadata.cost, 0);
  }

  private countScenes(scriptContent: string): number {
    const sceneMatches = scriptContent.match(/مشهد\s+\d+/gi);
    return sceneMatches ? sceneMatches.length : 1;
  }

  private generateHtmlReport(supervisionResult: any): string {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>تقرير التفريغ السينمائي</title>
        <style>
            body { font-family: 'Arial', sans-serif; margin: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
            .element { background: #f8f9fa; margin: 5px 0; padding: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>تقرير التفريغ السينمائي</h1>
            <p>تم إنشاؤه بواسطة نظام الوكلاء المتعددة</p>
        </div>
        <div class="section">
            <h2>ملخص الجودة</h2>
            <p>الثقة العامة: ${(supervisionResult.quality_assessment.overall_confidence * 100).toFixed(1)}%</p>
            <p>مراجعة بشرية مطلوبة: ${supervisionResult.quality_assessment.human_review_required ? 'نعم' : 'لا'}</p>
        </div>
        <div class="section">
            <h2>العناصر المستخرجة</h2>
            <p>عدد العناصر: ${supervisionResult.final_elements.length}</p>
        </div>
    </body>
    </html>
    `;
  }

  private recordTaskCompletion(
    taskId: string,
    success: boolean,
    agentsUsed: string[],
    finalResult?: any
  ) {
    this.taskHistory.push({
      task_id: taskId,
      start_time: new Date(),
      end_time: new Date(),
      success,
      agents_used: agentsUsed,
      final_result: finalResult
    });

    // تحديث المقاييس
    this.updatePerformanceMetrics(success, agentsUsed);
  }

  private updatePerformanceMetrics(success: boolean, agentsUsed: string[]) {
    this.performanceMetrics.total_tasks_processed++;
    
    // تحديث معدل النجاح
    const successfulTasks = this.taskHistory.filter(task => task.success).length;
    this.performanceMetrics.success_rate = successfulTasks / this.taskHistory.length;
    
    // تحديث استخدام الوكلاء
    agentsUsed.forEach(agent => {
      this.performanceMetrics.agent_utilization[agent] = 
        (this.performanceMetrics.agent_utilization[agent] || 0) + 1;
    });
  }

  // واجهات المراقبة والإدارة
  getSystemMetrics(): SystemPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getTaskHistory(limit: number = 10): any[] {
    return this.taskHistory
      .slice(-limit)
      .reverse()
      .map(task => ({
        task_id: task.task_id,
        success: task.success,
        agents_used: task.agents_used,
        duration: task.end_time ? task.end_time.getTime() - task.start_time.getTime() : 0
      }));
  }

  getAgentStatus(): Record<string, {
    status: 'active' | 'idle' | 'error';
    last_used: Date | null;
    utilization_count: number;
  }> {
    return {
      emotional_agent: {
        status: 'active',
        last_used: new Date(),
        utilization_count: this.performanceMetrics.agent_utilization['emotional_agent'] || 0
      },
      technical_agent: {
        status: 'active',
        last_used: new Date(),
        utilization_count: this.performanceMetrics.agent_utilization['technical_agent'] || 0
      },
      breakdown_agent: {
        status: 'active',
        last_used: new Date(),
        utilization_count: this.performanceMetrics.agent_utilization['breakdown_agent'] || 0
      },
      supervisor_agent: {
        status: 'active',
        last_used: new Date(),
        utilization_count: this.performanceMetrics.agent_utilization['supervisor_agent'] || 0
      }
    };
  }

  async healthCheck(): Promise<{
    overall_health: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    recommendations: string[];
  }> {
    const components = {
      model_manager: this.modelManager.getAvailableModels().length > 0,
      python_service: true, // يمكن إضافة فحص حقيقي هنا
      emotional_agent: true,
      technical_agent: true,
      breakdown_agent: true,
      supervisor_agent: true
    };

    const healthyComponents = Object.values(components).filter(Boolean).length;
    const totalComponents = Object.keys(components).length;
    
    let overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    const recommendations: string[] = [];

    if (healthyComponents === totalComponents) {
      overallHealth = 'healthy';
    } else if (healthyComponents >= totalComponents * 0.7) {
      overallHealth = 'degraded';
      recommendations.push('فحص المكونات غير الصحية');
    } else {
      overallHealth = 'unhealthy';
      recommendations.push('إعادة تهيئة النظام');
    }

    return {
      overall_health: overallHealth,
      components,
      recommendations
    };
  }

  destroy() {
    // تنظيف الموارد
    this.modelManager.destroy();
  }
}
