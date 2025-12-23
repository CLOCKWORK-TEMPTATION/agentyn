#!/usr/bin/env python3
"""
نظام مراقبة الأداء المتقدم
Advanced Performance Monitoring System

يوفر مراقبة شاملة في الوقت الفعلي للأداء والموارد
Requirements: 12.1
"""

import time
import psutil
import threading
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from collections import deque
import json
import statistics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# نماذج البيانات
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class PerformanceSnapshot:
    """لقطة أداء في لحظة معينة"""
    timestamp: datetime
    cpu_percent: float
    memory_mb: float
    memory_percent: float
    active_threads: int
    request_count: int
    error_count: int
    average_response_time: float

@dataclass
class PerformanceAlert:
    """تنبيه أداء"""
    alert_id: str
    severity: str  # low, medium, high, critical
    metric_name: str
    current_value: float
    threshold_value: float
    message: str
    timestamp: datetime
    acknowledged: bool = False

@dataclass
class PerformanceMetrics:
    """مقاييس الأداء الشاملة"""
    current_cpu_percent: float = 0.0
    current_memory_mb: float = 0.0
    current_memory_percent: float = 0.0
    peak_cpu_percent: float = 0.0
    peak_memory_mb: float = 0.0
    average_cpu_percent: float = 0.0
    average_memory_mb: float = 0.0
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    requests_per_second: float = 0.0
    uptime_seconds: float = 0.0
    active_alerts: List[PerformanceAlert] = field(default_factory=list)

# ═══════════════════════════════════════════════════════════════════════════
# نظام المراقبة المتقدم
# ═══════════════════════════════════════════════════════════════════════════

class AdvancedPerformanceMonitor:
    """نظام مراقبة الأداء المتقدم"""
    
    def __init__(self, 
                 sampling_interval: float = 1.0,
                 history_size: int = 3600,
                 alert_thresholds: Dict[str, float] = None):
        """
        Args:
            sampling_interval: فترة أخذ العينات بالثواني
            history_size: عدد العينات المحفوظة في التاريخ
            alert_thresholds: حدود التنبيهات
        """
        self.sampling_interval = sampling_interval
        self.history_size = history_size
        
        # حدود التنبيهات الافتراضية
        self.alert_thresholds = alert_thresholds or {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'error_rate': 0.05,
            'response_time': 5.0
        }
        
        # البيانات
        self.snapshots: deque = deque(maxlen=history_size)
        self.alerts: List[PerformanceAlert] = []
        self.request_times: deque = deque(maxlen=1000)
        
        # الإحصائيات
        self.start_time = datetime.now()
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        
        # المراقبة
        self.monitoring = False
        self.monitor_thread: Optional[threading.Thread] = None
        self.lock = threading.Lock()
        
        # العملية الحالية
        self.process = psutil.Process()
    
    def start(self):
        """بدء المراقبة"""
        if self.monitoring:
            logger.warning("المراقبة قيد التشغيل بالفعل")
            return
        
        self.monitoring = True
        self.start_time = datetime.now()
        
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        
        logger.info("بدأت مراقبة الأداء")
    
    def stop(self):
        """إيقاف المراقبة"""
        self.monitoring = False
        
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        
        logger.info("توقفت مراقبة الأداء")
    
    def _monitoring_loop(self):
        """حلقة المراقبة الرئيسية"""
        while self.monitoring:
            try:
                # جمع البيانات
                snapshot = self._collect_snapshot()
                
                with self.lock:
                    self.snapshots.append(snapshot)
                
                # فحص التنبيهات
                self._check_alerts(snapshot)
                
                # انتظار الفترة التالية
                time.sleep(self.sampling_interval)
                
            except Exception as e:
                logger.error(f"خطأ في حلقة المراقبة: {e}")
    
    def _collect_snapshot(self) -> PerformanceSnapshot:
        """جمع لقطة أداء"""
        # معلومات المعالج والذاكرة
        cpu_percent = self.process.cpu_percent(interval=0.1)
        memory_info = self.process.memory_info()
        memory_mb = memory_info.rss / (1024 * 1024)
        memory_percent = self.process.memory_percent()
        
        # عدد الخيوط النشطة
        active_threads = threading.active_count()
        
        # حساب متوسط زمن الاستجابة
        with self.lock:
            avg_response_time = (
                statistics.mean(self.request_times) 
                if self.request_times else 0.0
            )
        
        return PerformanceSnapshot(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            memory_mb=memory_mb,
            memory_percent=memory_percent,
            active_threads=active_threads,
            request_count=self.total_requests,
            error_count=self.failed_requests,
            average_response_time=avg_response_time
        )
    
    def _check_alerts(self, snapshot: PerformanceSnapshot):
        """فحص التنبيهات"""
        # فحص المعالج
        if snapshot.cpu_percent > self.alert_thresholds['cpu_percent']:
            self._create_alert(
                'high_cpu',
                'high',
                'cpu_percent',
                snapshot.cpu_percent,
                self.alert_thresholds['cpu_percent'],
                f"استخدام المعالج مرتفع: {snapshot.cpu_percent:.1f}%"
            )
        
        # فحص الذاكرة
        if snapshot.memory_percent > self.alert_thresholds['memory_percent']:
            self._create_alert(
                'high_memory',
                'high',
                'memory_percent',
                snapshot.memory_percent,
                self.alert_thresholds['memory_percent'],
                f"استخدام الذاكرة مرتفع: {snapshot.memory_percent:.1f}%"
            )
        
        # فحص معدل الأخطاء
        error_rate = (
            self.failed_requests / self.total_requests 
            if self.total_requests > 0 else 0
        )
        
        if error_rate > self.alert_thresholds['error_rate']:
            self._create_alert(
                'high_error_rate',
                'critical',
                'error_rate',
                error_rate,
                self.alert_thresholds['error_rate'],
                f"معدل الأخطاء مرتفع: {error_rate:.2%}"
            )
        
        # فحص زمن الاستجابة
        if snapshot.average_response_time > self.alert_thresholds['response_time']:
            self._create_alert(
                'slow_response',
                'medium',
                'response_time',
                snapshot.average_response_time,
                self.alert_thresholds['response_time'],
                f"زمن الاستجابة بطيء: {snapshot.average_response_time:.2f}s"
            )
    
    def _create_alert(self, alert_id: str, severity: str, metric_name: str,
                     current_value: float, threshold_value: float, message: str):
        """إنشاء تنبيه جديد"""
        # تجنب التنبيهات المكررة
        with self.lock:
            existing = [a for a in self.alerts if a.alert_id == alert_id and not a.acknowledged]
            if existing:
                return
            
            alert = PerformanceAlert(
                alert_id=alert_id,
                severity=severity,
                metric_name=metric_name,
                current_value=current_value,
                threshold_value=threshold_value,
                message=message,
                timestamp=datetime.now()
            )
            
            self.alerts.append(alert)
            logger.warning(f"تنبيه جديد: {message}")
    
    def record_request(self, response_time: float, success: bool = True):
        """تسجيل طلب"""
        with self.lock:
            self.total_requests += 1
            
            if success:
                self.successful_requests += 1
            else:
                self.failed_requests += 1
            
            self.request_times.append(response_time)
    
    def get_current_metrics(self) -> PerformanceMetrics:
        """الحصول على المقاييس الحالية"""
        with self.lock:
            if not self.snapshots:
                return PerformanceMetrics()
            
            # أحدث لقطة
            latest = self.snapshots[-1]
            
            # حساب الإحصائيات
            cpu_values = [s.cpu_percent for s in self.snapshots]
            memory_values = [s.memory_mb for s in self.snapshots]
            
            # حساب الطلبات في الثانية
            uptime = (datetime.now() - self.start_time).total_seconds()
            rps = self.total_requests / uptime if uptime > 0 else 0
            
            # متوسط زمن الاستجابة
            avg_response_time = (
                statistics.mean(self.request_times) 
                if self.request_times else 0.0
            )
            
            # التنبيهات النشطة
            active_alerts = [a for a in self.alerts if not a.acknowledged]
            
            return PerformanceMetrics(
                current_cpu_percent=latest.cpu_percent,
                current_memory_mb=latest.memory_mb,
                current_memory_percent=latest.memory_percent,
                peak_cpu_percent=max(cpu_values),
                peak_memory_mb=max(memory_values),
                average_cpu_percent=statistics.mean(cpu_values),
                average_memory_mb=statistics.mean(memory_values),
                total_requests=self.total_requests,
                successful_requests=self.successful_requests,
                failed_requests=self.failed_requests,
                average_response_time=avg_response_time,
                requests_per_second=rps,
                uptime_seconds=uptime,
                active_alerts=active_alerts
            )
    
    def get_historical_data(self, minutes: int = 60) -> List[PerformanceSnapshot]:
        """الحصول على البيانات التاريخية"""
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        
        with self.lock:
            return [
                s for s in self.snapshots 
                if s.timestamp >= cutoff_time
            ]
    
    def acknowledge_alert(self, alert_id: str):
        """تأكيد تنبيه"""
        with self.lock:
            for alert in self.alerts:
                if alert.alert_id == alert_id and not alert.acknowledged:
                    alert.acknowledged = True
                    logger.info(f"تم تأكيد التنبيه: {alert_id}")
                    break
    
    def clear_acknowledged_alerts(self):
        """مسح التنبيهات المؤكدة"""
        with self.lock:
            before_count = len(self.alerts)
            self.alerts = [a for a in self.alerts if not a.acknowledged]
            cleared = before_count - len(self.alerts)
            
            if cleared > 0:
                logger.info(f"تم مسح {cleared} تنبيه مؤكد")
    
    def export_metrics(self, filename: str = "performance_metrics.json"):
        """تصدير المقاييس إلى ملف"""
        metrics = self.get_current_metrics()
        
        data = {
            'timestamp': datetime.now().isoformat(),
            'uptime_seconds': metrics.uptime_seconds,
            'current_metrics': {
                'cpu_percent': metrics.current_cpu_percent,
                'memory_mb': metrics.current_memory_mb,
                'memory_percent': metrics.current_memory_percent
            },
            'peak_metrics': {
                'cpu_percent': metrics.peak_cpu_percent,
                'memory_mb': metrics.peak_memory_mb
            },
            'average_metrics': {
                'cpu_percent': metrics.average_cpu_percent,
                'memory_mb': metrics.average_memory_mb
            },
            'request_metrics': {
                'total_requests': metrics.total_requests,
                'successful_requests': metrics.successful_requests,
                'failed_requests': metrics.failed_requests,
                'success_rate': (
                    metrics.successful_requests / metrics.total_requests 
                    if metrics.total_requests > 0 else 0
                ),
                'average_response_time': metrics.average_response_time,
                'requests_per_second': metrics.requests_per_second
            },
            'active_alerts': [
                {
                    'alert_id': a.alert_id,
                    'severity': a.severity,
                    'metric_name': a.metric_name,
                    'current_value': a.current_value,
                    'threshold_value': a.threshold_value,
                    'message': a.message,
                    'timestamp': a.timestamp.isoformat()
                }
                for a in metrics.active_alerts
            ]
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"تم تصدير المقاييس إلى: {filename}")
    
    def print_summary(self):
        """طباعة ملخص الأداء"""
        metrics = self.get_current_metrics()
        
        print("\n" + "=" * 80)
        print("ملخص مراقبة الأداء")
        print("=" * 80)
        
        print(f"\n⏱️  وقت التشغيل: {metrics.uptime_seconds:.0f} ثانية")
        
        print(f"\n💻 المعالج:")
        print(f"   الحالي: {metrics.current_cpu_percent:.1f}%")
        print(f"   الذروة: {metrics.peak_cpu_percent:.1f}%")
        print(f"   المتوسط: {metrics.average_cpu_percent:.1f}%")
        
        print(f"\n🧠 الذاكرة:")
        print(f"   الحالية: {metrics.current_memory_mb:.1f} MB ({metrics.current_memory_percent:.1f}%)")
        print(f"   الذروة: {metrics.peak_memory_mb:.1f} MB")
        print(f"   المتوسط: {metrics.average_memory_mb:.1f} MB")
        
        print(f"\n📊 الطلبات:")
        print(f"   الإجمالي: {metrics.total_requests}")
        print(f"   الناجحة: {metrics.successful_requests}")
        print(f"   الفاشلة: {metrics.failed_requests}")
        
        success_rate = (
            metrics.successful_requests / metrics.total_requests 
            if metrics.total_requests > 0 else 0
        )
        print(f"   معدل النجاح: {success_rate:.1%}")
        print(f"   متوسط زمن الاستجابة: {metrics.average_response_time:.2f}s")
        print(f"   الطلبات/ثانية: {metrics.requests_per_second:.2f}")
        
        if metrics.active_alerts:
            print(f"\n⚠️  التنبيهات النشطة ({len(metrics.active_alerts)}):")
            for alert in metrics.active_alerts:
                print(f"   [{alert.severity.upper()}] {alert.message}")
        else:
            print(f"\n✅ لا توجد تنبيهات نشطة")
        
        print("\n" + "=" * 80)

# ═══════════════════════════════════════════════════════════════════════════
# مثال على الاستخدام
# ═══════════════════════════════════════════════════════════════════════════

def example_usage():
    """مثال على استخدام نظام المراقبة"""
    # إنشاء المراقب
    monitor = AdvancedPerformanceMonitor(
        sampling_interval=1.0,
        alert_thresholds={
            'cpu_percent': 70.0,
            'memory_percent': 80.0,
            'error_rate': 0.05,
            'response_time': 3.0
        }
    )
    
    # بدء المراقبة
    monitor.start()
    
    try:
        # محاكاة بعض الطلبات
        import random
        
        for i in range(100):
            # محاكاة زمن استجابة
            response_time = random.uniform(0.5, 2.0)
            success = random.random() > 0.05  # 95% نجاح
            
            monitor.record_request(response_time, success)
            time.sleep(0.1)
        
        # طباعة الملخص
        monitor.print_summary()
        
        # تصدير المقاييس
        monitor.export_metrics()
        
    finally:
        # إيقاف المراقبة
        monitor.stop()

if __name__ == "__main__":
    example_usage()
