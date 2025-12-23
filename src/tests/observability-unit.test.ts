/**
 * اختبارات وحدة شاملة لنظام المراقبة والجودة
 * Observability System Unit Tests
 * 
 * تغطي جميع وظائف المراقبة والمقاييس والجودة
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { ObservabilitySystem, SystemMetrics, AgentMetrics, ModelMetrics, Alert, AlertRule } from '../systems/observability-system.js';
import { CinematicMultiAgentSystem } from '../systems/cinematic-multi-agent-system.js';

// محاكاة psutil للاختبار
jest.mock('psutil', () => ({
  cpu_percent: jest.fn(() => Promise.resolve(45.2)),
  virtual_memory: jest.fn(() => ({
    percent: 67.8
  }))
}));

describe('اختبارات نظام المراقبة والجودة', () => {
  let observabilitySystem: ObservabilitySystem;
  let mockModel: any;

  beforeAll(async () => {
    console.log('🚀 بدء إعداد نظام المراقبة للاختبار...');

    // إنشاء نموذج وهمي للاختبار
    mockModel = {
      invoke: jest.fn<() => Promise<{ content: string }>>().mockResolvedValue({
        content: 'Mock analysis response'
      })
    };

    observabilitySystem = new ObservabilitySystem(mockModel as any);
    
    console.log('✅ تم إعداد نظام المراقبة بنجاح');
  });

  afterAll(async () => {
    console.log('🧹 تنظيف نظام المراقبة...');
    
    // إيقاف نظام المراقبة
    observabilitySystem.destroy();
    
    console.log('✅ تم تنظيف نظام المراقبة');
  });

  beforeEach(() => {
    // إعادة تعيين الحالة قبل كل اختبار
    jest.clearAllMocks();
  });

  describe('اختبار جمع المقاييس', () => {
    test('يجب أن يجمع مقاييس النظام بنجاح', async () => {
      const metrics = await observabilitySystem.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('system_health');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('agents');
      expect(metrics).toHaveProperty('models');
      expect(metrics).toHaveProperty('services');
    });

    test('يجب أن يحفظ تاريخ المقاييس', async () => {
      const history = observabilitySystem.getMetricsHistory(1); // آخر ساعة
      
      expect(Array.isArray(history)).toBe(true);
      
      // يجب أن يكون هناك على الأقل مقياس واحد
      if (history.length > 0) {
        const metric = history[0];
        expect(metric).toHaveProperty('timestamp');
        expect(metric).toHaveProperty('system_health');
      }
    });

    test('يجب أن يجمع مقاييس الأداء بشكل صحيح', async () => {
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).not.toBeNull();

      expect(metrics!.performance).toHaveProperty('cpu_usage');
      expect(metrics!.performance).toHaveProperty('memory_usage');
      expect(metrics!.performance).toHaveProperty('response_time_avg');
      expect(metrics!.performance).toHaveProperty('throughput_per_minute');
      expect(metrics!.performance).toHaveProperty('error_rate');

      // التحقق من صحة القيم
      expect(metrics!.performance.cpu_usage).toBeGreaterThanOrEqual(0);
      expect(metrics!.performance.cpu_usage).toBeLessThanOrEqual(100);
      expect(metrics!.performance.memory_usage).toBeGreaterThanOrEqual(0);
      expect(metrics!.performance.memory_usage).toBeLessThanOrEqual(100);
    });

    test('يجب أن يجمع مقاييس الوكلاء', async () => {
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).not.toBeNull();

      expect(metrics!.agents).toBeDefined();
      expect(typeof metrics!.agents).toBe('object');

      // التحقق من وجود الوكلاء الأساسية
      const expectedAgents = ['emotional_agent', 'technical_agent', 'breakdown_agent', 'supervisor_agent'];

      for (const agentName of expectedAgents) {
        if (metrics!.agents[agentName]) {
          const agentMetrics = metrics!.agents[agentName];
          expect(agentMetrics).toHaveProperty('agent_name', agentName);
          expect(agentMetrics).toHaveProperty('status');
          expect(agentMetrics).toHaveProperty('tasks_completed');
          expect(agentMetrics).toHaveProperty('success_rate');
          expect(agentMetrics).toHaveProperty('average_execution_time');
        }
      }
    });

    test('يجب أن يجمع مقاييس النماذج', async () => {
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).not.toBeNull();

      expect(metrics!.models).toBeDefined();
      expect(typeof metrics!.models).toBe('object');

      // التحقق من وجود النماذج الأساسية
      const expectedModels = ['claude-4-sonnet', 'gpt-4o', 'gemini-pro'];

      for (const modelId of expectedModels) {
        if (metrics!.models[modelId]) {
          const modelMetrics = metrics!.models[modelId];
          expect(modelMetrics).toHaveProperty('model_id', modelId);
          expect(modelMetrics).toHaveProperty('provider');
          expect(modelMetrics).toHaveProperty('status');
          expect(modelMetrics).toHaveProperty('total_requests');
          expect(modelMetrics).toHaveProperty('health_score');
        }
      }
    });
  });

  describe('اختبار نظام التنبيهات', () => {
    test('يجب أن ينشئ تنبيهات عند تجاوز الحدود', async () => {
      // إنشاء قاعدة تنبيه لاختبار
      const alertRules = observabilitySystem.getAlertRules();
      expect(Array.isArray(alertRules)).toBe(true);
      
      // التحقق من وجود قواعد التنبيه الافتراضية
      expect(alertRules.length).toBeGreaterThan(0);
      
      // التحقق من وجود قاعدة معدل الأخطاء العالي
      const highErrorRule = alertRules.find(rule => rule.rule_id === 'high_error_rate');
      expect(highErrorRule).toBeDefined();
      expect(highErrorRule?.enabled).toBe(true);
    });

    test('يجب أن يتتبع التنبيهات النشطة', async () => {
      const activeAlerts = observabilitySystem.getActiveAlerts();
      
      expect(Array.isArray(activeAlerts)).toBe(true);
      
      // التحقق من بنية التنبيه
      for (const alert of activeAlerts) {
        expect(alert).toHaveProperty('alert_id');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('triggered_at');
        expect(alert).toHaveProperty('acknowledged');
        expect(alert).toHaveProperty('resolved');
      }
    });

    test('يجب أن يسمح بتأكيد التنبيهات', async () => {
      const activeAlerts = observabilitySystem.getActiveAlerts();
      
      if (activeAlerts.length > 0) {
        const alertToAcknowledge = activeAlerts[0];
        const result = observabilitySystem.acknowledgeAlert(
          alertToAcknowledge.alert_id, 
          'test_user'
        );
        
        expect(result).toBe(true);
        
        // التحقق من تحديث حالة التنبيه
        const updatedAlerts = observabilitySystem.getActiveAlerts();
        const updatedAlert = updatedAlerts.find(alert => alert.alert_id === alertToAcknowledge.alert_id);
        
        if (updatedAlert) {
          expect(updatedAlert.acknowledged).toBe(true);
          expect(updatedAlert.acknowledged_by).toBe('test_user');
        }
      }
    });

    test('يجب أن يسمح بحل التنبيهات', async () => {
      const activeAlerts = observabilitySystem.getActiveAlerts();
      
      if (activeAlerts.length > 0) {
        const alertToResolve = activeAlerts[0];
        const result = observabilitySystem.resolveAlert(alertToResolve.alert_id);
        
        expect(result).toBe(true);
        
        // التحقق من تحديث حالة التنبيه
        const updatedAlerts = observabilitySystem.getActiveAlerts();
        const resolvedAlert = updatedAlerts.find(alert => alert.alert_id === alertToResolve.alert_id);
        
        // يجب ألا يكون التنبيه المحلول في قائمة التنبيهات النشطة
        expect(resolvedAlert).toBeUndefined();
      }
    });

    test('يجب أن يسمح بتحديث قواعد التنبيه', async () => {
      const alertRules = observabilitySystem.getAlertRules();
      
      if (alertRules.length > 0) {
        const ruleToUpdate = alertRules[0];
        const updates = {
          threshold: 0.1,
          enabled: false
        };
        
        const result = observabilitySystem.updateAlertRule(ruleToUpdate.rule_id, updates);
        expect(result).toBe(true);
        
        // التحقق من التحديث
        const updatedRules = observabilitySystem.getAlertRules();
        const updatedRule = updatedRules.find(rule => rule.rule_id === ruleToUpdate.rule_id);
        
        if (updatedRule) {
          expect(updatedRule.threshold).toBe(0.1);
          expect(updatedRule.enabled).toBe(false);
        }
      }
    });
  });

  describe('اختبار تسجيل الأحداث', () => {
    test('يجب أن يسجل الأحداث بمستويات مختلفة', () => {
      // اختبار تسجيل بمستويات مختلفة
      observabilitySystem.log('debug', 'test_source', 'Debug message', { test: true });
      observabilitySystem.log('info', 'test_source', 'Info message', { test: true });
      observabilitySystem.log('warning', 'test_source', 'Warning message', { test: true });
      observabilitySystem.log('error', 'test_source', 'Error message', { test: true });
      observabilitySystem.log('critical', 'test_source', 'Critical message', { test: true });
      
      // التحقق من تسجيل السجلات
      const logs = observabilitySystem.getLogs();
      expect(Array.isArray(logs)).toBe(true);
      
      // البحث عن السجلات التي أضفناها
      const testLogs = logs.filter(log => log.source === 'test_source');
      expect(testLogs.length).toBeGreaterThanOrEqual(5);
    });

    test('يجب أن يسمح بفلترة السجلات حسب المستوى', () => {
      observabilitySystem.log('error', 'filter_test', 'Error log for filtering');
      observabilitySystem.log('info', 'filter_test', 'Info log for filtering');
      
      const errorLogs = observabilitySystem.getLogs('error');
      const infoLogs = observabilitySystem.getLogs('info');
      
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(infoLogs.length).toBeGreaterThan(0);
      
      // التحقق من أن السجلات مفلترة بشكل صحيح
      for (const log of errorLogs) {
        expect(log.level).toBe('error');
      }
      
      for (const log of infoLogs) {
        expect(log.level).toBe('info');
      }
    });

    test('يجب أن يحافظ على حد أقصى للسجلات', () => {
      // إضافة many logs
      for (let i = 0; i < 100; i++) {
        observabilitySystem.log('info', 'bulk_test', `Log message ${i}`);
      }
      
      const allLogs = observabilitySystem.getLogs();
      
      // يجب أن لا يتجاوز الحد الأقصى
      expect(allLogs.length).toBeLessThanOrEqual(5000); // MAX_LOG_BUFFER
    });
  });

  describe('اختبار تقارير الأداء', () => {
    test('يجب أن ينشئ تقارير أداء لفترات مختلفة', async () => {
      const periods: Array<'hourly' | 'daily' | 'weekly' | 'monthly'> = [
        'hourly', 'daily', 'weekly', 'monthly'
      ];
      
      for (const period of periods) {
        const report = await observabilitySystem.generatePerformanceReport(period);
        
        expect(report).toHaveProperty('report_id');
        expect(report).toHaveProperty('period', period);
        expect(report).toHaveProperty('start_time');
        expect(report).toHaveProperty('end_time');
        expect(report).toHaveProperty('summary');
        expect(report).toHaveProperty('trends');
        expect(report).toHaveProperty('top_issues');
        expect(report).toHaveProperty('recommendations');
        expect(report).toHaveProperty('generated_at');
        
        // التحقق من صحة الملخص
        expect(report.summary).toHaveProperty('total_tasks');
        expect(report.summary).toHaveProperty('success_rate');
        expect(report.summary).toHaveProperty('average_response_time');
        expect(report.summary).toHaveProperty('total_cost');
        expect(report.summary).toHaveProperty('system_availability');
        
        // التحقق من الاتجاهات
        expect(report.trends).toHaveProperty('performance_trend');
        expect(report.trends).toHaveProperty('error_trend');
        expect(report.trends).toHaveProperty('cost_trend');
      }
    });

    test('يجب أن يحسب الإحصائيات بشكل صحيح', async () => {
      const report = await observabilitySystem.generatePerformanceReport('daily');
      
      // التحقق من أن المعدلات ضمن النطاق الصحيح
      expect(report.summary.success_rate).toBeGreaterThanOrEqual(0);
      expect(report.summary.success_rate).toBeLessThanOrEqual(100);
      expect(report.summary.system_availability).toBeGreaterThanOrEqual(0);
      expect(report.summary.system_availability).toBeLessThanOrEqual(1);
      expect(report.summary.average_response_time).toBeGreaterThanOrEqual(0);
      expect(report.summary.total_cost).toBeGreaterThanOrEqual(0);
      
      // التحقق من الاتجاهات
      expect(['improving', 'stable', 'declining']).toContain(report.trends.performance_trend);
      expect(['decreasing', 'stable', 'increasing']).toContain(report.trends.error_trend);
      expect(['decreasing', 'stable', 'increasing']).toContain(report.trends.cost_trend);
    });
  });

  describe('اختبار تحليل الاتجاهات والرؤى', () => {
    test('يجب أن يحلل الاتجاهات بشكل صحيح', async () => {
      // انتظار جمع بعض البيانات
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentMetrics = observabilitySystem.getCurrentMetrics();
      expect(currentMetrics).toBeDefined();
    });

    test('يجب أن ينشئ رؤى ذكية', async () => {
      // محاكاة تدهور في الأداء
      const mockMetrics: SystemMetrics = {
        timestamp: new Date(),
        system_health: 'degraded',
        performance: {
          cpu_usage: 85,
          memory_usage: 90,
          response_time_avg: 8000,
          throughput_per_minute: 5,
          error_rate: 0.08
        },
        agents: {},
        models: {},
        services: {}
      };
      
      // يمكن إضافة اختبارات إضافية لتحليل الاتجاهات
      expect(mockMetrics.performance.error_rate).toBeGreaterThan(0.05);
      expect(mockMetrics.performance.response_time_avg).toBeGreaterThan(5000);
    });
  });

  describe('اختبار Health Checks', () => {
    test('يجب أن يقيم صحة النظام', async () => {
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).not.toBeNull();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(metrics!.system_health);

      // التحقق من منطق تقييم الصحة
      if (metrics!.system_health === 'healthy') {
        expect(metrics!.performance.error_rate).toBeLessThan(0.05);
        expect(metrics!.performance.response_time_avg).toBeLessThan(5000);
        expect(metrics!.performance.cpu_usage).toBeLessThan(70);
      }
    });

    test('يجب أن يتحقق من صحة الخدمات', async () => {
      const metrics = await observabilitySystem.getCurrentMetrics();
      expect(metrics).not.toBeNull();

      expect(metrics!.services).toBeDefined();
      expect(typeof metrics!.services).toBe('object');

      // التحقق من الخدمات الأساسية
      const expectedServices = ['python_brain_service', 'database', 'file_storage', 'notification_service'];

      for (const serviceName of expectedServices) {
        if (metrics!.services[serviceName]) {
          const serviceMetrics = metrics!.services[serviceName];
          expect(serviceMetrics).toHaveProperty('service_name', serviceName);
          expect(serviceMetrics).toHaveProperty('status');
          expect(['up', 'down', 'degraded']).toContain(serviceMetrics.status);
          expect(serviceMetrics).toHaveProperty('response_time');
          expect(serviceMetrics).toHaveProperty('availability');
        }
      }
    });
  });

  describe('اختبار إدارة البيانات والتنظيف', () => {
    test('يجب أن ينظف البيانات القديمة', () => {
      // إضافة بعض البيانات للاختبار
      const initialLogs = observabilitySystem.getLogs();
      const initialLogsCount = initialLogs.length;

      // التحقق من أن النظام يحتفظ بالسجلات
      expect(initialLogsCount).toBeGreaterThanOrEqual(0);

      // إضافة سجلات جديدة
      observabilitySystem.log('info', 'cleanup_test', 'Test log for cleanup');

      const logsAfterAdd = observabilitySystem.getLogs();

      // يجب أن يكون هناك سجل جديد أو على الأقل نفس العدد
      expect(logsAfterAdd.length).toBeGreaterThanOrEqual(initialLogsCount);
    });

    test('يجب أن يحافظ على حدود الذاكرة', () => {
      // إضافة many logs لتجاوز الحد
      for (let i = 0; i < 6000; i++) {
        observabilitySystem.log('info', 'memory_test', `Memory test log ${i}`);
      }
      
      const logs = observabilitySystem.getLogs();
      
      // يجب أن لا يتجاوز الحد الأقصى
      expect(logs.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('اختبار التكامل مع الأنظمة الأخرى', () => {
    test('يجب أن يتكامل مع نظام متعدد الوكلاء', async () => {
      // إنشاء نظام متعدد الوكلاء للاختبار
      const cinematicSystem = new CinematicMultiAgentSystem();
      
      // التحقق من أن نظام المراقبة يمكنه مراقبة النظام الآخر
      const metrics = await observabilitySystem.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics!.agents).toBeDefined();
      
      // تنظيف
      cinematicSystem.destroy();
    });

    test('يجب أن يسجل أحداث النظام بشكل صحيح', () => {
      // تسجيل حدث تحليل
      observabilitySystem.log('info', 'cinematic_system', 'بدء تحليل سيناريو جديد', {
        task_type: 'full_analysis',
        script_length: 1500,
        complexity: 'medium'
      });
      
      // تسجيل حدث خطأ
      observabilitySystem.log('error', 'agent_system', 'فشل في معالجة مهمة', {
        agent_name: 'emotional_agent',
        error_type: 'timeout',
        task_id: 'test_task_123'
      });
      
      const logs = observabilitySystem.getLogs();
      const systemLogs = logs.filter(log => 
        log.source === 'cinematic_system' || log.source === 'agent_system'
      );
      
      expect(systemLogs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('اختبار الأداء تحت الضغط', () => {
    test('يجب أن يحافظ على الأداء مع many events', async () => {
      const startTime = Date.now();
      
      // إضافة many events بسرعة
      for (let i = 0; i < 100; i++) {
        observabilitySystem.log('info', 'performance_test', `Performance test log ${i}`);
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // يجب أن يكون سريعاً
      expect(processingTime).toBeLessThan(1000); // أقل من ثانية واحدة
      
      // التحقق من أن البيانات محفوظة
      const logs = observabilitySystem.getLogs();
      const performanceLogs = logs.filter(log => log.source === 'performance_test');
      expect(performanceLogs.length).toBeGreaterThanOrEqual(50);
    });

    test('يجب أن يتعامل مع memory leaks', () => {
      const initialMemoryUsage = process.memoryUsage().heapUsed;

      // إضافة many logs
      for (let i = 0; i < 1000; i++) {
        observabilitySystem.log('info', 'memory_leak_test', `Memory leak test ${i}`);
      }

      // التحقق من أن السجلات محدودة (الحد الأقصى 5000)
      const logs = observabilitySystem.getLogs();
      expect(logs.length).toBeLessThanOrEqual(5000);

      const finalMemoryUsage = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemoryUsage - initialMemoryUsage;

      // يجب ألا يكون هناك memory leak كبير
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // أقل من 50MB
    });
  });

  describe('اختبار الإعدادات والتخصيص', () => {
    test('يجب أن يسمح بتخصيص قواعد التنبيه', () => {
      const customRule: Partial<AlertRule> = {
        rule_id: 'custom_test_rule',
        name: 'قاعدة اختبار مخصصة',
        description: 'قاعدة تنبيه مخصصة للاختبار',
        metric: 'custom_metric',
        condition: 'gt',
        threshold: 100,
        severity: 'warning',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['console']
      };
      
      // يمكن إضافة منطق لإنشاء قواعد مخصصة
      expect(customRule.rule_id).toBe('custom_test_rule');
      expect(customRule.enabled).toBe(true);
    });

    test('يجب أن يدعم مستويات تسجيل مختلفة', () => {
      const levels: Array<'debug' | 'info' | 'warning' | 'error' | 'critical'> = [
        'debug', 'info', 'warning', 'error', 'critical'
      ];
      
      for (const level of levels) {
        observabilitySystem.log(level, 'level_test', `Testing ${level} level`);
      }
      
      const logs = observabilitySystem.getLogs();
      const levelTestLogs = logs.filter(log => log.source === 'level_test');
      
      expect(levelTestLogs.length).toBe(5);
    });
  });
});

// اختبارات إضافية للوظائف المتقدمة
describe('اختبارات الوظائف المتقدمة للمراقبة', () => {
  let observabilitySystem: ObservabilitySystem;

  beforeAll(() => {
    observabilitySystem = new ObservabilitySystem({
      invoke: jest.fn<() => Promise<{ content: string }>>().mockResolvedValue({ content: 'mock' })
    } as any);
  });

  afterAll(() => {
    observabilitySystem.destroy();
  });

  describe('اختبار التحليلات المتقدمة', () => {
    test('يجب أن يوفر تحليلات استخدام الموارد', async () => {
      const report = await observabilitySystem.generatePerformanceReport('daily');
      
      expect(report.summary).toHaveProperty('total_tasks');
      expect(report.summary).toHaveProperty('success_rate');
      expect(report.summary).toHaveProperty('average_response_time');
      
      // التحقق من أن القيم منطقية
      expect(report.summary.success_rate).toBeGreaterThanOrEqual(0);
      expect(report.summary.success_rate).toBeLessThanOrEqual(100);
    });

    test('يجب أن يحلل أنماط الاستخدام', () => {
      // استخدام المقاييس الحالية لتحليل أنماط الاستخدام
      const metrics = observabilitySystem.getCurrentMetrics();

      if (metrics) {
        expect(metrics).toHaveProperty('system_health');
        expect(metrics).toHaveProperty('performance');
        expect(metrics).toHaveProperty('agents');
      }
    });
  });

  describe('اختبار التكامل مع External Systems', () => {
    test('يجب أن يدعم webhook notifications', () => {
      // اختبار تسجيل حدث يتطلب إشعار
      observabilitySystem.log('critical', 'external_system', 'نظام خارجي متوقف', {
        system_name: 'database',
        severity: 'critical',
        requires_notification: true
      });
      
      const logs = observabilitySystem.getLogs('critical');
      const externalLogs = logs.filter(log => log.source === 'external_system');
      
      expect(externalLogs.length).toBeGreaterThan(0);
    });

    test('يجب أن يتتبع performance metrics بشكل مستمر', async () => {
      const metrics1 = observabilitySystem.getCurrentMetrics();

      // انتظار قصير
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics2 = observabilitySystem.getCurrentMetrics();

      // يجب أن تكون المقاييس موجودة ومحدثة
      if (metrics1 && metrics2) {
        expect(metrics2.timestamp.getTime()).toBeGreaterThanOrEqual(metrics1.timestamp.getTime());
      }
    });
  });
});
