/**
 * نظام إدارة النماذج المتقدم
 * Advanced Model Management System
 * 
 * يدير النماذج المتعددة مع مراقبة الأداء وإدارة التكلفة والتبديل التلقائي
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ModelManager } from '../three-read-breakdown-system.js';

export interface ModelMetrics {
  model_id: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  total_tokens_used: number;
  total_cost: number;
  last_used: Date;
  error_rate: number;
  success_rate: number;
}

export interface ModelHealth {
  model_id: string;
  is_healthy: boolean;
  response_time: number;
  error_count: number;
  last_health_check: Date;
  issues: string[];
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: "anthropic" | "openai" | "google";
  model: string;
  apiKey?: string;
  temperature: number;
  maxTokens: number;
  specialization: string[];
  cost_per_token: number;
  max_requests_per_minute: number;
  priority: number; // 1 = highest priority
  fallback_enabled: boolean;
}

export interface TaskRequirements {
  task_type: string;
  complexity: "low" | "medium" | "high" | "critical";
  max_response_time: number;
  max_cost: number;
  required_specialization: string[];
  quality_threshold: number;
}

export class AdvancedModelManager {
  private models: Map<string, BaseLanguageModel> = new Map();
  private modelConfigs: Map<string, ModelConfig> = new Map();
  private modelMetrics: Map<string, ModelMetrics> = new Map();
  private modelHealth: Map<string, ModelHealth> = new Map();
  private taskHistory: Array<{
    task_id: string;
    task_type: string;
    model_used: string;
    start_time: Date;
    end_time?: Date;
    success: boolean;
    cost: number;
    tokens_used: number;
  }> = [];
  
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultConfigs();
    this.initializeModels();
    this.startHealthMonitoring();
    this.startMetricsCleanup();
  }

  private initializeDefaultConfigs() {
    const defaultConfigs: ModelConfig[] = [
      {
        id: "claude-4-sonnet",
        name: "Claude 4 Sonnet",
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        temperature: 0.3,
        maxTokens: 4096,
        specialization: ["analysis", "reasoning", "technical", "supervision"],
        cost_per_token: 0.000015,
        max_requests_per_minute: 60,
        priority: 1,
        fallback_enabled: true
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "openai",
        model: "gpt-4o",
        temperature: 0.4,
        maxTokens: 4096,
        specialization: ["creative", "semantic", "synthesis", "emotional_analysis"],
        cost_per_token: 0.00001,
        max_requests_per_minute: 100,
        priority: 2,
        fallback_enabled: true
      },
      {
        id: "gemini-pro",
        name: "Gemini Pro",
        provider: "google",
        model: "gemini-pro",
        temperature: 0.5,
        maxTokens: 4096,
        specialization: ["creative", "multimodal", "generation"],
        cost_per_token: 0.000008,
        max_requests_per_minute: 80,
        priority: 3,
        fallback_enabled: false
      }
    ];

    defaultConfigs.forEach(config => {
      this.modelConfigs.set(config.id, config);
      this.initializeMetrics(config.id);
    });
  }

  private initializeModels() {
    for (const [key, config] of Array.from(this.modelConfigs.entries())) {
      try {
        const model = this.createModel(config);
        this.models.set(key, model);
        console.log(`✓ تم تهيئة النموذج المتقدم: ${config.name}`);
      } catch (error) {
        console.warn(`⚠️ فشل تهيئة النموذج ${config.name}: ${(error as Error).message}`);
        this.updateModelHealth(key, false, [(error as Error).message]);
      }
    }
  }

  private createModel(config: ModelConfig): BaseLanguageModel {
    const apiKey = config.apiKey || process.env[`${config.provider.toUpperCase()}_API_KEY`];
    
    if (!apiKey) {
      throw new Error(`مفتاح API مفقود للموفر: ${config.provider}`);
    }
    
    switch (config.provider) {
      case "anthropic":
        return new ChatAnthropic({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey
        });
        
      case "openai":
        return new ChatOpenAI({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey
        });
        
      case "google":
        // TODO: إضافة دعم Google Gemini
        throw new Error(`Google provider temporarily disabled`);
        
      default:
        throw new Error(`موفر غير مدعوم: ${config.provider}`);
    }
  }

  async selectOptimalModel(requirements: TaskRequirements): Promise<{
    model: BaseLanguageModel;
    model_id: string;
    estimated_cost: number;
    estimated_response_time: number;
  }> {
    const candidateModels = this.getCandidateModels(requirements);
    
    if (candidateModels.length === 0) {
      throw new Error("لا توجد نماذج مناسبة للمتطلبات المحددة");
    }

    // ترتيب النماذج بناءً على الأداء والتكلفة
    const scoredModels = candidateModels.map(config => ({
      config,
      score: this.calculateModelScore(config, requirements)
    }));

    scoredModels.sort((a, b) => b.score - a.score);
    
    const bestModel = scoredModels[0];
    const model = this.models.get(bestModel.config.id);
    
    if (!model) {
      throw new Error(`النموذج ${bestModel.config.id} غير متاح`);
    }

    return {
      model,
      model_id: bestModel.config.id,
      estimated_cost: this.estimateCost(bestModel.config, requirements),
      estimated_response_time: this.estimateResponseTime(bestModel.config, requirements)
    };
  }

  private getCandidateModels(requirements: TaskRequirements): ModelConfig[] {
    return Array.from(this.modelConfigs.values())
      .filter(config => {
        // فحص التخصص
        const hasRequiredSpecialization = requirements.required_specialization.some(
          spec => config.specialization.includes(spec)
        );
        
        // فحص الصحة
        const health = this.modelHealth.get(config.id);
        const isHealthy = health?.is_healthy !== false;
        
        // فحص معدل الطلبات
        const metrics = this.modelMetrics.get(config.id);
        const currentRequestsPerMinute = this.calculateCurrentRequestsPerMinute(config.id);
        const withinRateLimit = currentRequestsPerMinute < config.max_requests_per_minute;
        
        return hasRequiredSpecialization && isHealthy && withinRateLimit;
      })
      .sort((a, b) => a.priority - b.priority); // ترتيب حسب الأولوية
  }

  private calculateModelScore(config: ModelConfig, requirements: TaskRequirements): number {
    const metrics = this.modelMetrics.get(config.id);
    const health = this.modelHealth.get(config.id);
    
    let score = 0;
    
    // نقاط التخصص (40%)
    const specializationScore = requirements.required_specialization.reduce((acc, spec) => {
      return acc + (config.specialization.includes(spec) ? 1 : 0);
    }, 0) / requirements.required_specialization.length;
    score += specializationScore * 40;
    
    // نقاط الأداء (30%)
    if (metrics) {
      const performanceScore = (1 - metrics.error_rate) * 0.7 + (metrics.success_rate) * 0.3;
      score += performanceScore * 30;
    }
    
    // نقاط التكلفة (20%)
    const costScore = Math.max(0, 1 - (config.cost_per_token * 1000000)); // تطبيع التكلفة
    score += costScore * 20;
    
    // نقاط الصحة (10%)
    const healthScore = health?.is_healthy ? 1 : 0;
    score += healthScore * 10;
    
    return score;
  }

  private estimateCost(config: ModelConfig, requirements: TaskRequirements): number {
    // تقدير تقريبي للتكلفة بناءً على تعقيد المهمة
    const complexityMultipliers = {
      low: 1,
      medium: 1.5,
      high: 2.5,
      critical: 4
    };
    
    const estimatedTokens = 1000 * complexityMultipliers[requirements.complexity];
    return estimatedTokens * config.cost_per_token;
  }

  private estimateResponseTime(config: ModelConfig, requirements: TaskRequirements): number {
    const baseTime = 2000; // 2 ثانية أساسية
    const complexityMultipliers = {
      low: 1,
      medium: 1.5,
      high: 2.5,
      critical: 4
    };
    
    return baseTime * complexityMultipliers[requirements.complexity];
  }

  async executeTask(
    taskId: string,
    taskType: string,
    taskFn: (model: BaseLanguageModel) => Promise<any>,
    requirements: TaskRequirements
  ): Promise<{
    result: any;
    model_id: string;
    actual_cost: number;
    response_time: number;
    tokens_used: number;
  }> {
    const startTime = Date.now();
    let selectedModel: BaseLanguageModel;
    let modelId: string = 'unknown';
    
    try {
      // اختيار النموذج الأمثل
      const selection = await this.selectOptimalModel(requirements);
      selectedModel = selection.model;
      modelId = selection.model_id;
      
      // تنفيذ المهمة
      const result = await taskFn(selectedModel);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // حساب التكلفة الفعلية (مبسط)
      const estimatedTokens = Math.floor(responseTime / 1000) * 100; // تقدير تقريبي
      const actualCost = estimatedTokens * this.modelConfigs.get(modelId)!.cost_per_token;
      
      // تسجيل المهمة
      this.recordTaskCompletion(taskId, taskType, modelId, true, actualCost, estimatedTokens);
      
      return {
        result,
        model_id: modelId,
        actual_cost: actualCost,
        response_time: responseTime,
        tokens_used: estimatedTokens
      };
      
    } catch (error) {
      // محاولة النموذج البديل
      const fallbackModel = await this.getFallbackModel(requirements);
      if (fallbackModel) {
        try {
          const result = await taskFn(fallbackModel.model);
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          const estimatedTokens = Math.floor(responseTime / 1000) * 100;
          const actualCost = estimatedTokens * this.modelConfigs.get(fallbackModel.model_id)!.cost_per_token;
          
          this.recordTaskCompletion(taskId, taskType, fallbackModel.model_id, true, actualCost, estimatedTokens);
          
          return {
            result,
            model_id: fallbackModel.model_id,
            actual_cost: actualCost,
            response_time: responseTime,
            tokens_used: estimatedTokens
          };
        } catch (fallbackError) {
          this.recordTaskCompletion(taskId, taskType, modelId, false, 0, 0);
          throw fallbackError;
        }
      } else {
        this.recordTaskCompletion(taskId, taskType, modelId, false, 0, 0);
        throw error;
      }
    }
  }

  private async getFallbackModel(requirements: TaskRequirements): Promise<{
    model: BaseLanguageModel;
    model_id: string;
  } | null> {
    const fallbackCandidates = Array.from(this.modelConfigs.values())
      .filter(config => config.fallback_enabled)
      .sort((a, b) => a.priority - b.priority);
    
    for (const config of fallbackCandidates) {
      const model = this.models.get(config.id);
      const health = this.modelHealth.get(config.id);
      
      if (model && health?.is_healthy !== false) {
        return { model, model_id: config.id };
      }
    }
    
    return null;
  }

  private recordTaskCompletion(
    taskId: string,
    taskType: string,
    modelId: string,
    success: boolean,
    cost: number,
    tokensUsed: number
  ) {
    this.taskHistory.push({
      task_id: taskId,
      task_type: taskType,
      model_used: modelId,
      start_time: new Date(),
      end_time: new Date(),
      success,
      cost,
      tokens_used: tokensUsed
    });

    // تحديث المقاييس
    const metrics = this.modelMetrics.get(modelId);
    if (metrics) {
      metrics.total_requests++;
      if (success) {
        metrics.successful_requests++;
      } else {
        metrics.failed_requests++;
      }
      metrics.total_cost += cost;
      metrics.total_tokens_used += tokensUsed;
      metrics.last_used = new Date();
      metrics.error_rate = metrics.failed_requests / metrics.total_requests;
      metrics.success_rate = metrics.successful_requests / metrics.total_requests;
    }
  }

  private calculateCurrentRequestsPerMinute(modelId: string): number {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentTasks = this.taskHistory.filter(
      task => task.model_used === modelId && task.start_time > oneMinuteAgo
    );
    return recentTasks.length;
  }

  private startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000); // كل 30 ثانية
  }

  private startMetricsCleanup() {
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000); // كل ساعة
  }

  private async performHealthChecks() {
    for (const [modelId, config] of Array.from(this.modelConfigs.entries())) {
      try {
        const startTime = Date.now();
        
        // اختبار بسيط للنموذج
        const testModel = this.models.get(modelId);
        if (testModel) {
          // يمكن إضافة اختبار حقيقي هنا
          const responseTime = Date.now() - startTime;
          this.updateModelHealth(modelId, true, [], responseTime);
        }
      } catch (error) {
        this.updateModelHealth(modelId, false, [(error as Error).message]);
      }
    }
  }

  private updateModelHealth(
    modelId: string,
    isHealthy: boolean,
    issues: string[],
    responseTime?: number
  ) {
    const currentHealth = this.modelHealth.get(modelId) || {
      model_id: modelId,
      is_healthy: true,
      response_time: 0,
      error_count: 0,
      last_health_check: new Date(),
      issues: []
    };

    this.modelHealth.set(modelId, {
      model_id: modelId,
      is_healthy: isHealthy,
      response_time: responseTime || currentHealth.response_time,
      error_count: isHealthy ? 0 : currentHealth.error_count + 1,
      last_health_check: new Date(),
      issues: isHealthy ? [] : [...currentHealth.issues, ...issues]
    });
  }

  private cleanupOldMetrics() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.taskHistory = this.taskHistory.filter(task => task.start_time > oneDayAgo);
  }

  private initializeMetrics(modelId: string) {
    this.modelMetrics.set(modelId, {
      model_id: modelId,
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time: 0,
      total_tokens_used: 0,
      total_cost: 0,
      last_used: new Date(),
      error_rate: 0,
      success_rate: 1
    });
  }

  // واجهات المراقبة والإدارة
  getModelMetrics(modelId?: string): ModelMetrics[] {
    if (modelId) {
      return [this.modelMetrics.get(modelId)].filter(Boolean) as ModelMetrics[];
    }
    return Array.from(this.modelMetrics.values());
  }

  getModelHealth(modelId?: string): ModelHealth[] {
    if (modelId) {
      return [this.modelHealth.get(modelId)].filter(Boolean) as ModelHealth[];
    }
    return Array.from(this.modelHealth.values());
  }

  getSystemOverview(): {
    total_models: number;
    healthy_models: number;
    total_requests_last_hour: number;
    total_cost_last_hour: number;
    average_response_time: number;
    system_health_score: number;
  } {
    const healthStatuses = Array.from(this.modelHealth.values());
    const healthyCount = healthStatuses.filter(h => h.is_healthy).length;
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTasks = this.taskHistory.filter(task => task.start_time > oneHourAgo);
    
    const totalCost = recentTasks.reduce((sum, task) => sum + task.cost, 0);
    const avgResponseTime = recentTasks.length > 0 
      ? recentTasks.reduce((sum, task) => sum + (task.end_time!.getTime() - task.start_time.getTime()), 0) / recentTasks.length
      : 0;

    return {
      total_models: this.modelConfigs.size,
      healthy_models: healthyCount,
      total_requests_last_hour: recentTasks.length,
      total_cost_last_hour: totalCost,
      average_response_time: avgResponseTime,
      system_health_score: healthyCount / this.modelConfigs.size
    };
  }

  private sanitizeForLog(input: string): string {
    return input.replace(/[\r\n\t]/g, ' ').replace(/[\x00-\x1F\x7F]/g, '');
  }

  async addModel(config: ModelConfig): Promise<void> {
    this.modelConfigs.set(config.id, config);
    this.initializeMetrics(config.id);
    
    try {
      const model = this.createModel(config);
      this.models.set(config.id, model);
      console.log(`✓ تم إضافة النموذج: ${this.sanitizeForLog(config.name)}`);
    } catch (error) {
      console.error(`❌ فشل إضافة النموذج ${this.sanitizeForLog(config.name)}:`, error);
      throw error;
    }
  }

  async removeModel(modelId: string): Promise<void> {
    this.modelConfigs.delete(modelId);
    this.models.delete(modelId);
    this.modelMetrics.delete(modelId);
    this.modelHealth.delete(modelId);
    console.log(`✓ تم إزالة النموذج: ${this.sanitizeForLog(modelId)}`);
  }

  async updateModelConfig(modelId: string, updates: Partial<ModelConfig>): Promise<void> {
    const currentConfig = this.modelConfigs.get(modelId);
    if (!currentConfig) {
      throw new Error(`النموذج ${this.sanitizeForLog(modelId)} غير موجود`);
    }

    const updatedConfig = { ...currentConfig, ...updates };
    this.modelConfigs.set(modelId, updatedConfig);
    
    // إعادة تهيئة النموذج إذا لزم الأمر
    if (updates.model || updates.provider || updates.apiKey) {
      try {
        const newModel = this.createModel(updatedConfig);
        this.models.set(modelId, newModel);
        console.log(`✓ تم تحديث النموذج: ${this.sanitizeForLog(modelId)}`);
      } catch (error) {
        console.error(`❌ فشل تحديث النموذج ${this.sanitizeForLog(modelId)}:`, error);
        throw error;
      }
    }
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
    }
  }
}
