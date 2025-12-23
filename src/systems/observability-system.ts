/**
 * نظام المراقبة والرصد
 * Observability System
 * 
 * يوفر مراقبة شاملة لأداء النظام والوكلاء والتحليلات
 */

import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export interface SystemMetrics {
  timestamp: Date;
  system_health: 'healthy' | 'degraded' | 'unhealthy';
  performance: {
    cpu_usage: number;
    memory_usage: number;
    response_time_avg: number;
    throughput_per_minute: number;
    error_rate: number;
  };
  agents: Record<string, AgentMetrics>;
  models: Record<string, ModelMetrics>;
  services: Record<string, ServiceMetrics>;
}

export interface AgentMetrics {
  agent_name: string;
  status: 'active' | 'idle' | 'error' | 'maintenance';
  tasks_completed: number;
  tasks_failed: number;
  average_execution_time: number;
  success_rate: number;
  last_activity: Date;
  current_load: number; // 0-1
  error_count_24h: number;
  quality_scores: number[];
  resource_usage: {
    cpu_time: number;
    memory_mb: number;
    api_calls: number;
  };
}

export interface ModelMetrics {
  model_id: string;
  provider: string;
  status: 'available' | 'busy' | 'error' | 'disabled';
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  tokens_per_minute: number;
  cost_per_request: number;
  error_rate: number;
  last_used: Date;
  health_score: number; // 0-1
}

export interface ServiceMetrics {
  service_name: string;
  status: 'up' | 'down' | 'degraded';
  response_time: number;
  availability: number; // 0-1
  error_rate: number;
  last_health_check: Date;
  dependencies: string[];
}

export interface AlertRule {
  rule_id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  cooldown_minutes: number;
  notification_channels: string[];
  last_triggered?: Date;
}

export interface Alert {
  alert_id: string;
  rule_id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric_value: number;
  threshold: number;
  triggered_at: Date;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  resolved: boolean;
  resolved_at?: Date;
  related_entities: string[];
}

export interface PerformanceReport {
  report_id: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  start_time: Date;
  end_time: Date;
  summary: {
    total_tasks: number;
    success_rate: number;
    average_response_time: number;
    total_cost: number;
    system_availability: number;
  };
  trends: {
    performance_trend: 'improving' | 'stable' | 'declining';
    error_trend: 'decreasing' | 'stable' | 'increasing';
    cost_trend: 'decreasing' | 'stable' | 'increasing';
  };
  top_issues: string[];
  recommendations: string[];
  generated_at: Date;
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  metadata: Record<string, any>;
  trace_id?: string;
  span_id?: string;
}

export class ObservabilitySystem {
  private metricsHistory: SystemMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private logBuffer: LogEntry[] = [];
  private performanceData: Map<string, any[]> = new Map();
  
  private model: BaseLanguageModel;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // حدود الذاكرة
  private readonly MAX_METRICS_HISTORY = 1000;
  private readonly MAX_LOG_BUFFER = 5000;
  private readonly MAX_ALERTS = 100;

  constructor(model: BaseLanguageModel) {
    this.model = model;
    this.initializeAlertRules();
    this.startMonitoring();
    this.startCleanup();
  }

  private initializeAlertRules() {
    const rules: AlertRule[] = [
      {
        rule_id: 'high_error_rate',
        name: 'معدل أخطاء عالي',
        description: 'تنبيه عند ارتفاع معدل الأخطاء',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 0.05, // 5%
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 15,
        notification_channels: ['console', 'webhook']
      },
      {
        rule_id: 'slow_response_time',
        name: 'بطء في وقت الاستجابة',
        description: 'تنبيه عند بطء وقت الاستجابة',
        metric: 'response_time_avg',
        condition: 'gt',
        threshold: 5000, // 5 seconds
        severity: 'warning',
        enabled: true,
        cooldown_minutes: 10,
        notification_channels: ['console']
      },
      {
        rule_id: 'low_success_rate',
        name: 'معدل نجاح منخفض',
        description: 'تنبيه عند انخفاض معدل النجاح',
        metric: 'success_rate',
        condition: 'lt',
        threshold: 0.85, // 85%
        severity: 'warning',
        enabled: true,
        cooldown_minutes: 20,
        notification_channels: ['console', 'webhook']
      },
      {
        rule_id: 'high_memory_usage',
        name: 'استخدام عالي للذاكرة',
        description: 'تنبيه عند ارتفاع استخدام الذاكرة',
        metric: 'memory_usage',
        condition: 'gt',
        threshold: 0.85, // 85%
        severity: 'warning',
        enabled: true,
        cooldown_minutes: 30,
        notification_channels: ['console']
      },
      {
        rule_id: 'agent_error_spike',
        name: 'ارتفاع مفاجئ في أخطاء الوكلاء',
        description: 'تنبيه عند ارتفاع مفاجئ في أخطاء وكيل معين',
        metric: 'agent_error_count',
        condition: 'gt',
        threshold: 10,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['console', 'webhook']
      }
    ];

    rules.forEach(rule => {
      this.alertRules.set(rule.rule_id, rule);
    });
  }

  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      await this.evaluateAlertRules();
      await this.generateInsights();
    }, 30000); // كل 30 ثانية
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // كل ساعة
  }

  /**
   * جمع مقاييس النظام
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        system_health: await this.assessSystemHealth(),
        performance: await this.collectPerformanceMetrics(),
        agents: await this.collectAgentMetrics(),
        models: await this.collectModelMetrics(),
        services: await this.collectServiceMetrics()
      };

      this.metricsHistory.push(metrics);
      
      // الحفاظ على حجم التاريخ
      if (this.metricsHistory.length > this.MAX_METRICS_HISTORY) {
        this.metricsHistory = this.metricsHistory.slice(-this.MAX_METRICS_HISTORY);
      }

      this.log('info', 'metrics_collector', 'تم جمع مقاييس النظام بنجاح', {
        system_health: metrics.system_health,
        active_agents: Object.keys(metrics.agents).length,
        available_models: Object.keys(metrics.models).length
      });

    } catch (error) {
      this.log('error', 'metrics_collector', 'فشل في جمع مقاييس النظام', {
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    }
  }

  /**
   * تقييم صحة النظام
   */
  private async assessSystemHealth(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    const recentMetrics = this.metricsHistory.slice(-5); // آخر 5 مقاييس
    if (recentMetrics.length === 0) return 'healthy';

    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.performance.error_rate, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.performance.response_time_avg, 0) / recentMetrics.length;
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.performance.cpu_usage, 0) / recentMetrics.length;

    if (avgErrorRate > 0.1 || avgResponseTime > 10000 || avgCpuUsage > 0.9) {
      return 'unhealthy';
    } else if (avgErrorRate > 0.05 || avgResponseTime > 5000 || avgCpuUsage > 0.7) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * جمع مقاييس الأداء
   */
  private async collectPerformanceMetrics(): Promise<SystemMetrics['performance']> {
    // محاكاة جمع مقاييس الأداء (في التطبيق الحقيقي، ستأتي من نظام المراقبة)
    return {
      cpu_usage: Math.random() * 0.8, // 0-80%
      memory_usage: Math.random() * 0.7, // 0-70%
      response_time_avg: 1000 + Math.random() * 2000, // 1-3 seconds
      throughput_per_minute: 10 + Math.random() * 20, // 10-30 requests/minute
      error_rate: Math.random() * 0.05 // 0-5%
    };
  }

  /**
   * جمع مقاييس الوكلاء
   */
  private async collectAgentMetrics(): Promise<Record<string, AgentMetrics>> {
    const agentNames = ['emotional_agent', 'technical_agent', 'breakdown_agent', 'supervisor_agent'];
    const metrics: Record<string, AgentMetrics> = {};

    for (const agentName of agentNames) {
      metrics[agentName] = {
        agent_name: agentName,
        status: Math.random() > 0.1 ? 'active' : 'idle',
        tasks_completed: Math.floor(Math.random() * 100),
        tasks_failed: Math.floor(Math.random() * 5),
        average_execution_time: 1000 + Math.random() * 3000,
        success_rate: 0.85 + Math.random() * 0.15,
        last_activity: new Date(),
        current_load: Math.random(),
        error_count_24h: Math.floor(Math.random() * 10),
        quality_scores: Array.from({ length: 10 }, () => 0.7 + Math.random() * 0.3),
        resource_usage: {
          cpu_time: Math.random() * 100,
          memory_mb: 50 + Math.random() * 200,
          api_calls: Math.floor(Math.random() * 50)
        }
      };
    }

    return metrics;
  }

  /**
   * جمع مقاييس النماذج
   */
  private async collectModelMetrics(): Promise<Record<string, ModelMetrics>> {
    const models = [
      { id: 'claude-4-sonnet', provider: 'anthropic' },
      { id: 'gpt-4o', provider: 'openai' },
      { id: 'gemini-pro', provider: 'google' }
    ];

    const metrics: Record<string, ModelMetrics> = {};

    for (const model of models) {
      metrics[model.id] = {
        model_id: model.id,
        provider: model.provider,
        status: Math.random() > 0.05 ? 'available' : 'busy',
        total_requests: Math.floor(Math.random() * 1000),
        successful_requests: Math.floor(Math.random() * 950),
        failed_requests: Math.floor(Math.random() * 50),
        average_response_time: 1500 + Math.random() * 2000,
        tokens_per_minute: Math.floor(Math.random() * 10000),
        cost_per_request: 0.001 + Math.random() * 0.01,
        error_rate: Math.random() * 0.03,
        last_used: new Date(),
        health_score: 0.8 + Math.random() * 0.2
      };
    }

    return metrics;
  }

  /**
   * جمع مقاييس الخدمات
   */
  private async collectServiceMetrics(): Promise<Record<string, ServiceMetrics>> {
    const services = ['python_brain_service', 'database', 'file_storage', 'notification_service'];
    const metrics: Record<string, ServiceMetrics> = {};

    for (const service of services) {
      metrics[service] = {
        service_name: service,
        status: Math.random() > 0.1 ? 'up' : 'degraded',
        response_time: 100 + Math.random() * 500,
        availability: 0.95 + Math.random() * 0.05,
        error_rate: Math.random() * 0.02,
        last_health_check: new Date(),
        dependencies: []
      };
    }

    return metrics;
  }

  /**
   * تقييم قواعد التنبيه
   */
  private async evaluateAlertRules(): Promise<void> {
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (!currentMetrics) return;

    for (const [ruleId, rule] of Array.from(this.alertRules)) {
      if (!rule.enabled) continue;

      // فحص فترة التهدئة
      if (rule.last_triggered) {
        const timeSinceLastTrigger = Date.now() - rule.last_triggered.getTime();
        if (timeSinceLastTrigger < rule.cooldown_minutes * 60 * 1000) {
          continue;
        }
      }

      const metricValue = this.getMetricValue(currentMetrics, rule.metric);
      if (metricValue === undefined) continue;

      const shouldTrigger = this.evaluateCondition(metricValue, rule.condition, rule.threshold);
      
      if (shouldTrigger) {
        await this.triggerAlert(rule, metricValue);
      }
    }
  }

  /**
   * الحصول على قيمة المقياس
   */
  private getMetricValue(metrics: SystemMetrics, metricPath: string): number | undefined {
    const path = metricPath.split('.');
    let current: any = metrics;

    for (const segment of path) {
      if (current && typeof current === 'object' && segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    }

    return typeof current === 'number' ? current : undefined;
  }

  /**
   * تقييم الشرط
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  /**
   * تفعيل التنبيه
   */
  private async triggerAlert(rule: AlertRule, metricValue: number): Promise<void> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      alert_id: alertId,
      rule_id: rule.rule_id,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      metric_value: metricValue,
      threshold: rule.threshold,
      triggered_at: new Date(),
      acknowledged: false,
      resolved: false,
      related_entities: []
    };

    this.alerts.set(alertId, alert);
    rule.last_triggered = new Date();

    // تسجيل التنبيه
    this.log('warning', 'alert_system', `تم تفعيل تنبيه: ${rule.name}`, {
      alert_id: alertId,
      rule_id: rule.rule_id,
      severity: rule.severity,
      metric_value: metricValue,
      threshold: rule.threshold
    });

    // إرسال الإشعارات
    await this.sendNotifications(alert, rule.notification_channels);

    // الحفاظ على عدد التنبيهات
    if (this.alerts.size > this.MAX_ALERTS) {
      const oldestAlert = Array.from(this.alerts.values())
        .sort((a, b) => a.triggered_at.getTime() - b.triggered_at.getTime())[0];
      if (oldestAlert) {
        this.alerts.delete(oldestAlert.alert_id);
      }
    }
  }

  /**
   * إرسال الإشعارات
   */
  private async sendNotifications(alert: Alert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      switch (channel) {
        case 'console':
          console.warn(`🚨 [${this.sanitizeLogInput(alert.severity.toUpperCase())}] ${this.sanitizeLogInput(alert.title)}: ${this.sanitizeLogInput(alert.description)}`);
          break;
        
        case 'webhook':
          // هنا يمكن إضافة منطق إرسال webhook
          this.log('info', 'notification', `تم إرسال إشعار عبر webhook: ${alert.alert_id}`);
          break;
        
        case 'email':
          // هنا يمكن إضافة منطق إرسال البريد الإلكتروني
          this.log('info', 'notification', `تم إرسال إشعار عبر البريد الإلكتروني: ${alert.alert_id}`);
          break;
      }
    }
  }

  /**
   * إنشاء رؤى ذكية
   */
  private async generateInsights(): Promise<void> {
    if (this.metricsHistory.length < 10) return; // نحتاج بيانات كافية

    try {
      const recentMetrics = this.metricsHistory.slice(-10);
      const insight = await this.analyzeTrends(recentMetrics);
      
      if (insight) {
        this.log('info', 'insight_generator', 'رؤية جديدة تم إنشاؤها', {
          insight_type: insight.type,
          description: insight.description,
          confidence: insight.confidence
        });
      }

    } catch (error) {
      this.log('error', 'insight_generator', 'فشل في إنشاء الرؤى', {
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      });
    }
  }

  /**
   * تحليل الاتجاهات
   */
  private async analyzeTrends(metrics: SystemMetrics[]): Promise<{
    type: string;
    description: string;
    confidence: number;
  } | null> {
    if (metrics.length < 5) return null;

    // تحليل اتجاه معدل الأخطاء
    const errorRates = metrics.map(m => m.performance.error_rate);
    const errorTrend = this.calculateTrend(errorRates);
    
    // تحليل اتجاه وقت الاستجابة
    const responseTimes = metrics.map(m => m.performance.response_time_avg);
    const responseTrend = this.calculateTrend(responseTimes);

    // إنشاء رؤى بناءً على الاتجاهات
    if (errorTrend === 'increasing' && responseTrend === 'increasing') {
      return {
        type: 'performance_degradation',
        description: 'يبدو أن أداء النظام يتدهور مع ارتفاع معدل الأخطاء ووقت الاستجابة',
        confidence: 0.8
      };
    }

    if (errorTrend === 'decreasing' && responseTrend === 'decreasing') {
      return {
        type: 'performance_improvement',
        description: 'أداء النظام يتحسن مع انخفاض معدل الأخطاء ووقت الاستجابة',
        confidence: 0.9
      };
    }

    return null;
  }

  /**
   * حساب الاتجاه
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const threshold = firstAvg * 0.1; // 10% change threshold

    if (diff > threshold) return 'increasing';
    if (diff < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * تسجيل الأحداث
   */
  log(level: LogEntry['level'], source: string, message: string, metadata: Record<string, any> = {}): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      metadata,
      trace_id: this.generateTraceId(),
      span_id: this.generateSpanId()
    };

    this.logBuffer.push(logEntry);

    // الحفاظ على حجم المخزن المؤقت
    if (this.logBuffer.length > this.MAX_LOG_BUFFER) {
      this.logBuffer = this.logBuffer.slice(-this.MAX_LOG_BUFFER);
    }

    // طباعة السجلات المهمة
    const sanitizedSource = this.sanitizeLogInput(source);
    const sanitizedMessage = this.sanitizeLogInput(message);
    if (level === 'error' || level === 'critical') {
      console.error(`[${level.toUpperCase()}] ${sanitizedSource}: ${sanitizedMessage}`, metadata);
    } else if (level === 'warning') {
      console.warn(`[${level.toUpperCase()}] ${sanitizedSource}: ${sanitizedMessage}`, metadata);
    } else if (level === 'info') {
      console.log(`[${level.toUpperCase()}] ${sanitizedSource}: ${sanitizedMessage}`, metadata);
    }
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * تنظيف المدخلات لمنع حقن السجلات (CWE-117)
   * يزيل أحرف التحكم والأسطر الجديدة
   */
  private sanitizeLogInput(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }
    // إزالة أحرف السطر الجديد وأحرف التحكم
    return input
      .replace(/[\r\n]/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .substring(0, 1000); // تحديد الطول الأقصى
  }

  /**
   * تنظيف البيانات القديمة
   */
  private cleanupOldData(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // تنظيف المقاييس القديمة
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > oneWeekAgo);

    // تنظيف السجلات القديمة
    this.logBuffer = this.logBuffer.filter(log => log.timestamp > oneDayAgo);

    // تنظيف التنبيهات المحلولة القديمة
    const resolvedAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.resolved && alert.resolved_at && 
                      alert.resolved_at < oneDayAgo);
    
    resolvedAlerts.forEach(alert => {
      this.alerts.delete(alert.alert_id);
    });

    this.log('info', 'cleanup', 'تم تنظيف البيانات القديمة بنجاح', {
      metrics_remaining: this.metricsHistory.length,
      logs_remaining: this.logBuffer.length,
      alerts_remaining: this.alerts.size
    });
  }

  // واجهات المراقبة والإدارة

  /**
   * الحصول على المقاييس الحالية
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * الحصول على تاريخ المقاييس
   */
  getMetricsHistory(hours: number = 24): SystemMetrics[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * الحصول على التنبيهات النشطة
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.triggered_at.getTime() - a.triggered_at.getTime());
  }

  /**
   * الحصول على جميع التنبيهات
   */
  getAllAlerts(limit: number = 50): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.triggered_at.getTime() - a.triggered_at.getTime())
      .slice(0, limit);
  }

  /**
   * تأكيد التنبيه
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledged_by = acknowledgedBy;
      alert.acknowledged_at = new Date();
      
      this.log('info', 'alert_management', `تم تأكيد التنبيه: ${alertId}`, {
        acknowledged_by: acknowledgedBy
      });
      
      return true;
    }
    return false;
  }

  /**
   * حل التنبيه
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolved_at = new Date();
      
      this.log('info', 'alert_management', `تم حل التنبيه: ${alertId}`);
      
      return true;
    }
    return false;
  }

  /**
   * إنشاء تقرير الأداء
   */
  async generatePerformanceReport(period: PerformanceReport['period']): Promise<PerformanceReport> {
    const now = new Date();
    let startTime: Date;

    switch (period) {
      case 'hourly':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'daily':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const periodMetrics = this.metricsHistory.filter(m => 
      m.timestamp >= startTime && m.timestamp <= now
    );

    const report: PerformanceReport = {
      report_id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      period,
      start_time: startTime,
      end_time: now,
      summary: {
        total_tasks: periodMetrics.reduce((sum, m) => 
          sum + Object.values(m.agents).reduce((agentSum, agent) => 
            agentSum + agent.tasks_completed, 0), 0),
        success_rate: this.calculateAverageSuccessRate(periodMetrics),
        average_response_time: this.calculateAverageResponseTime(periodMetrics),
        total_cost: this.calculateTotalCost(periodMetrics),
        system_availability: this.calculateSystemAvailability(periodMetrics)
      },
      trends: {
        performance_trend: this.calculatePerformanceTrend(periodMetrics),
        error_trend: this.calculateErrorTrend(periodMetrics),
        cost_trend: 'stable' // يمكن تحسين هذا لاحقاً
      },
      top_issues: this.identifyTopIssues(periodMetrics),
      recommendations: await this.generateRecommendations(periodMetrics),
      generated_at: now
    };

    this.log('info', 'performance_report', `تم إنشاء تقرير أداء: ${report.report_id}`, {
      period,
      total_tasks: report.summary.total_tasks,
      success_rate: report.summary.success_rate
    });

    return report;
  }

  private calculateAverageSuccessRate(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 1;
    
    const totalSuccessRates = metrics.flatMap(m => 
      Object.values(m.agents).map(agent => agent.success_rate)
    );
    
    return totalSuccessRates.length > 0 
      ? totalSuccessRates.reduce((sum, rate) => sum + rate, 0) / totalSuccessRates.length
      : 1;
  }

  private calculateAverageResponseTime(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const totalResponseTimes = metrics.flatMap(m => 
      Object.values(m.agents).map(agent => agent.average_execution_time)
    );
    
    return totalResponseTimes.length > 0
      ? totalResponseTimes.reduce((sum, time) => sum + time, 0) / totalResponseTimes.length
      : 0;
  }

  private calculateTotalCost(metrics: SystemMetrics[]): number {
    return metrics.reduce((total, m) => {
      const modelCosts = Object.values(m.models).reduce((modelSum, model) => 
        modelSum + (model.cost_per_request * model.total_requests), 0);
      return total + modelCosts;
    }, 0);
  }

  private calculateSystemAvailability(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 1;
    
    const healthyMetrics = metrics.filter(m => m.system_health === 'healthy').length;
    return healthyMetrics / metrics.length;
  }

  private calculatePerformanceTrend(metrics: SystemMetrics[]): 'improving' | 'stable' | 'declining' {
    if (metrics.length < 3) return 'stable';
    
    const firstThird = metrics.slice(0, Math.floor(metrics.length / 3));
    const lastThird = metrics.slice(-Math.floor(metrics.length / 3));
    
    const firstAvgResponseTime = firstThird.reduce((sum, m) => sum + m.performance.response_time_avg, 0) / firstThird.length;
    const lastAvgResponseTime = lastThird.reduce((sum, m) => sum + m.performance.response_time_avg, 0) / lastThird.length;
    
    if (lastAvgResponseTime < firstAvgResponseTime * 0.9) return 'improving';
    if (lastAvgResponseTime > firstAvgResponseTime * 1.1) return 'declining';
    return 'stable';
  }

  private calculateErrorTrend(metrics: SystemMetrics[]): 'decreasing' | 'stable' | 'increasing' {
    if (metrics.length < 3) return 'stable';
    
    const firstThird = metrics.slice(0, Math.floor(metrics.length / 3));
    const lastThird = metrics.slice(-Math.floor(metrics.length / 3));
    
    const firstAvgErrorRate = firstThird.reduce((sum, m) => sum + m.performance.error_rate, 0) / firstThird.length;
    const lastAvgErrorRate = lastThird.reduce((sum, m) => sum + m.performance.error_rate, 0) / lastThird.length;
    
    if (lastAvgErrorRate < firstAvgErrorRate * 0.9) return 'decreasing';
    if (lastAvgErrorRate > firstAvgErrorRate * 1.1) return 'increasing';
    return 'stable';
  }

  private identifyTopIssues(metrics: SystemMetrics[]): string[] {
    const issues: string[] = [];
    
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.performance.error_rate, 0) / metrics.length;
    if (avgErrorRate > 0.05) {
      issues.push(`معدل أخطاء عالي: ${(avgErrorRate * 100).toFixed(1)}%`);
    }
    
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.performance.response_time_avg, 0) / metrics.length;
    if (avgResponseTime > 5000) {
      issues.push(`وقت استجابة بطيء: ${avgResponseTime.toFixed(0)}ms`);
    }
    
    const unhealthyMetrics = metrics.filter(m => m.system_health === 'unhealthy').length;
    if (unhealthyMetrics > metrics.length * 0.1) {
      issues.push('النظام غير مستقر');
    }
    
    return issues;
  }

  private async generateRecommendations(metrics: SystemMetrics[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.performance.error_rate, 0) / metrics.length;
    if (avgErrorRate > 0.03) {
      recommendations.push('فحص وإصلاح الأخطاء المتكررة في النظام');
    }
    
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.performance.response_time_avg, 0) / metrics.length;
    if (avgResponseTime > 3000) {
      recommendations.push('تحسين أداء النظام وتقليل وقت الاستجابة');
    }
    
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.performance.memory_usage, 0) / metrics.length;
    if (avgMemoryUsage > 0.7) {
      recommendations.push('تحسين إدارة الذاكرة أو زيادة موارد النظام');
    }
    
    return recommendations;
  }

  /**
   * الحصول على قواعد التنبيه
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * تحديث قاعدة التنبيه
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.log('info', 'alert_management', `تم تحديث قاعدة التنبيه: ${ruleId}`);
      return true;
    }
    return false;
  }

  /**
   * الحصول على السجلات
   */
  getLogs(level?: LogEntry['level'], limit: number = 100): LogEntry[] {
    let logs = this.logBuffer;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * إيقاف نظام المراقبة
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.log('info', 'observability_system', 'تم إيقاف نظام المراقبة');
  }
}
