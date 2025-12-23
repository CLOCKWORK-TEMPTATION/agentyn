#!/usr/bin/env python3
"""
نظام اختبار الأداء والتحميل للخدمة المتقدمة
Performance and Load Testing System for Advanced Brain Service

يدعم اختبار الأداء مع النصوص الطويلة والطلبات المتعددة
Requirements: 10.5, 12.1
"""

import asyncio
import time
import json
import logging
import psutil
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
import statistics
import gc
import sys

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LoadTestConfig:
    """إعدادات اختبار التحميل"""
    base_url: str = "http://localhost:8000"
    total_requests: int = 100
    concurrent_users: int = 10
    test_duration_seconds: int = 60
    ramp_up_time: int = 10
    text_length_range: tuple = (1000, 100000)  # من 1KB إلى 100KB
    success_threshold: float = 0.95  # 95% نجاح مطلوب
    max_response_time: float = 30.0  # 30 ثانية كحد أقصى
    memory_limit_mb: int = 2048  # حد الذاكرة 2GB
    cpu_limit_percent: float = 80.0  # حد المعالج 80%

@dataclass
class PerformanceTestResult:
    """نتيجة اختبار الأداء"""
    test_name: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    min_response_time: float
    max_response_time: float
    p95_response_time: float
    p99_response_time: float
    throughput_rps: float
    memory_peak_usage: float
    cpu_peak_usage: float
    error_rate: float
    timestamp: datetime
    resource_monitoring: List[Dict[str, Any]]
    response_time_distribution: List[float]

class ResourceMonitor:
    """مراقب الموارد أثناء الاختبار"""
    
    def __init__(self, interval: float = 1.0):
        self.interval = interval
        self.monitoring = False
        self.data = []
        self.peak_memory = 0.0
        self.peak_cpu = 0.0
        
    def start_monitoring(self):
        """بدء مراقبة الموارد"""
        self.monitoring = True
        self.data = []
        self.peak_memory = 0.0
        self.peak_cpu = 0.0
        
        def monitor_loop():
            while self.monitoring:
                try:
                    # فحص الذاكرة
                    process = psutil.Process()
                    memory_info = process.memory_info()
                    memory_mb = memory_info.rss / (1024 * 1024)
                    memory_percent = process.memory_percent()
                    
                    # فحص المعالج
                    cpu_percent = psutil.cpu_percent(interval=None)
                    
                    # تحديث القيم الذروة
                    self.peak_memory = max(self.peak_memory, memory_mb)
                    self.peak_cpu = max(self.peak_cpu, cpu_percent)
                    
                    # حفظ البيانات
                    self.data.append({
                        'timestamp': datetime.now().isoformat(),
                        'memory_mb': memory_mb,
                        'memory_percent': memory_percent,
                        'cpu_percent': cpu_percent,
                        'active_connections': len(psutil.net_connections())
                    })
                    
                    time.sleep(self.interval)
                    
                except Exception as e:
                    logger.error(f"خطأ في مراقبة الموارد: {e}")
                    break
        
        self.monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def stop_monitoring(self):
        """إيقاف مراقبة الموارد"""
        self.monitoring = False
        if hasattr(self, 'monitor_thread'):
            self.monitor_thread.join(timeout=2.0)
    
    def get_peak_usage(self) -> Dict[str, float]:
        """الحصول على الاستخدام الذروة"""
        return {
            'memory_mb': self.peak_memory,
            'cpu_percent': self.peak_cpu
        }

class PerformanceTester:
    """نظام اختبار الأداء المتقدم"""
    
    def __init__(self, config: LoadTestConfig):
        self.config = config
        self.resource_monitor = ResourceMonitor()
        self.results = []
        
    def generate_test_text(self, length: int) -> str:
        """توليد نص اختبار بطول محدد"""
        # نموذج نص سينمائي متكرر
        base_script = """
        INT. LIVING ROOM - DAY
        
        SARAH sits on the couch reading a book. Sunlight streams through the window.
        
        SARAH
        (to herself)
        This story is incredible.
        
        She turns a page and continues reading.
        
        EXT. GARDEN - DAY
        
        JOHN waters the plants, humming a tune.
        
        JOHN
        (singing)
        La la la, what a beautiful day!
        
        He smiles and continues his work.
        """
        
        # تكرار النص للوصول للطول المطلوب
        repetitions = max(1, length // len(base_script))
        test_text = base_script * repetitions
        
        # قطع للطول الدقيق
        if len(test_text) > length:
            test_text = test_text[:length]
        
        return test_text
    
    async def make_analysis_request(self, request_id: int) -> Dict[str, Any]:
        """إجراء طلب تحليل واحد"""
        start_time = time.time()
        
        try:
            # توليد نص اختبار عشوائي الطول
            text_length = self.config.text_length_range[0] + (
                self.config.text_length_range[1] - self.config.text_length_range[0]
            ) * (request_id % 100) / 100
            
            test_text = self.generate_test_text(int(text_length))
            
            # إعداد الطلب
            payload = {
                "text": test_text,
                "component": "scene_salience",
                "context": {},
                "confidence_threshold": 0.7,
                "priority": "normal",
                "parallel_processing": True,
                "enable_caching": True,
                "performance_mode": "balanced"
            }
            
            # إرسال الطلب
            response = requests.post(
                f"{self.config.base_url}/analyze",
                json=payload,
                timeout=self.config.max_response_time
            )
            
            response_time = time.time() - start_time
            
            return {
                'success': response.status_code == 200,
                'response_time': response_time,
                'status_code': response.status_code,
                'request_id': request_id,
                'text_length': len(test_text),
                'timestamp': datetime.now().isoformat()
            }
            
        except requests.exceptions.Timeout:
            response_time = time.time() - start_time
            return {
                'success': False,
                'response_time': response_time,
                'error': 'timeout',
                'request_id': request_id,
                'text_length': len(test_text) if 'test_text' in locals() else 0,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            response_time = time.time() - start_time
            return {
                'success': False,
                'response_time': response_time,
                'error': str(e),
                'request_id': request_id,
                'text_length': len(test_text) if 'test_text' in locals() else 0,
                'timestamp': datetime.now().isoformat()
            }
    
    async def run_load_test(self, test_name: str) -> PerformanceTestResult:
        """تشغيل اختبار تحميل"""
        logger.info(f"بدء اختبار التحميل: {test_name}")
        
        # بدء مراقبة الموارد
        self.resource_monitor.start_monitoring()
        
        start_time = time.time()
        successful_requests = 0
        failed_requests = 0
        response_times = []
        all_results = []
        
        # تشغيل الطلبات بشكل متدرج
        for batch_start in range(0, self.config.total_requests, self.config.concurrent_users):
            batch_end = min(batch_start + self.config.concurrent_users, self.config.total_requests)
            batch_size = batch_end - batch_start
            
            # تنفيذ دفعة من الطلبات
            batch_tasks = [
                self.make_analysis_request(i) 
                for i in range(batch_start, batch_end)
            ]
            
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # معالجة النتائج
            for result in batch_results:
                if isinstance(result, dict):
                    all_results.append(result)
                    response_times.append(result['response_time'])
                    
                    if result['success']:
                        successful_requests += 1
                    else:
                        failed_requests += 1
                else:
                    failed_requests += 1
                    all_results.append({
                        'success': False,
                        'error': str(result),
                        'response_time': self.config.max_response_time,
                        'timestamp': datetime.now().isoformat()
                    })
            
            # فترة انتظار بين الدفعات
            if batch_end < self.config.total_requests:
                await asyncio.sleep(0.1)
        
        # إيقاف مراقبة الموارد
        self.resource_monitor.stop_monitoring()
        
        total_time = time.time() - start_time
        
        # حساب الإحصائيات
        if response_times:
            avg_response_time = statistics.mean(response_times)
            min_response_time = min(response_times)
            max_response_time = max(response_times)
            p95_response_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile
            p99_response_time = statistics.quantiles(response_times, n=100)[98]  # 99th percentile
        else:
            avg_response_time = min_response_time = max_response_time = 0
            p95_response_time = p99_response_time = 0
        
        # حساب معدل النقل
        throughput_rps = successful_requests / total_time if total_time > 0 else 0
        
        # حساب معدل الخطأ
        error_rate = failed_requests / self.config.total_requests if self.config.total_requests > 0 else 0
        
        # الحصول على بيانات الموارد
        peak_usage = self.resource_monitor.get_peak_usage()
        
        # إنشاء النتيجة
        result = PerformanceTestResult(
            test_name=test_name,
            total_requests=self.config.total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            average_response_time=avg_response_time,
            min_response_time=min_response_time,
            max_response_time=max_response_time,
            p95_response_time=p95_response_time,
            p99_response_time=p99_response_time,
            throughput_rps=throughput_rps,
            memory_peak_usage=peak_usage['memory_mb'],
            cpu_peak_usage=peak_usage['cpu_percent'],
            error_rate=error_rate,
            timestamp=datetime.now(),
            resource_monitoring=self.resource_monitor.data,
            response_time_distribution=response_times
        )
        
        logger.info(f"انتهى اختبار التحميل: {test_name}")
        logger.info(f"الطلبات الناجحة: {successful_requests}/{self.config.total_requests}")
        logger.info(f"معدل الخطأ: {error_rate:.2%}")
        logger.info(f"متوسط وقت الاستجابة: {avg_response_time:.2f} ثانية")
        
        return result
    
    async def run_stress_test(self, test_name: str, intensity_multiplier: float = 2.0) -> PerformanceTestResult:
        """تشغيل اختبار الإجهاد"""
        logger.info(f"بدء اختبار الإجهاد: {test_name}")
        
        # تعديل الإعدادات للاختبار القاسي
        original_requests = self.config.total_requests
        original_concurrent = self.config.concurrent_users
        
        self.config.total_requests = int(original_requests * intensity_multiplier)
        self.config.concurrent_users = int(original_concurrent * intensity_multiplier)
        
        try:
            result = await self.run_load_test(test_name)
            return result
        finally:
            # إعادة الإعدادات الأصلية
            self.config.total_requests = original_requests
            self.config.concurrent_users = original_concurrent
    
    async def run_endurance_test(self, test_name: str, duration_minutes: int = 30) -> List[PerformanceTestResult]:
        """تشغيل اختبار التحمل"""
        logger.info(f"بدء اختبار التحمل: {test_name} لمدة {duration_minutes} دقيقة")
        
        results = []
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        while time.time() < end_time:
            # تشغيل اختبار قصير
            test_result = await self.run_load_test(f"{test_name}_iteration_{len(results)}")
            results.append(test_result)
            
            # فترة راحة بين الاختبارات
            await asyncio.sleep(30)
        
        logger.info(f"انتهى اختبار التحمل: {test_name}")
        return results

class LongTextPerformanceTester:
    """نظام اختبار الأداء مع النصوص الطويلة"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []
    
    async def test_gradual_text_scaling(self) -> List[Dict[str, Any]]:
        """اختبار تدريجي لزيادة حجم النص"""
        logger.info("بدء اختبار تدريجي لحجم النص")
        
        results = []
        # أحجام النصوص من 1KB إلى 1MB
        text_sizes = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
        
        for size in text_sizes:
            logger.info(f"اختبار حجم النص: {size:,} حرف")
            
            # توليد نص كبير
            test_text = self._generate_large_text(size)
            
            # قياس الذاكرة قبل الاختبار
            gc.collect()
            memory_before = psutil.Process().memory_info().rss / (1024 * 1024)
            
            start_time = time.time()
            
            try:
                # إرسال الطلب
                payload = {
                    "text": test_text,
                    "component": "scene_salience",
                    "context": {},
                    "confidence_threshold": 0.7,
                    "parallel_processing": True,
                    "enable_caching": True,
                    "chunk_size": 100,
                    "memory_limit_mb": 2048
                }
                
                response = requests.post(
                    f"{self.base_url}/analyze",
                    json=payload,
                    timeout=300  # 5 دقائق timeout للنصوص الكبيرة
                )
                
                response_time = time.time() - start_time
                
                # قياس الذاكرة بعد الاختبار
                gc.collect()
                memory_after = psutil.Process().memory_info().rss / (1024 * 1024)
                memory_delta = memory_after - memory_before
                
                result = {
                    'text_size': size,
                    'success': response.status_code == 200,
                    'response_time': response_time,
                    'memory_before_mb': memory_before,
                    'memory_after_mb': memory_after,
                    'memory_delta_mb': memory_delta,
                    'status_code': response.status_code,
                    'timestamp': datetime.now().isoformat()
                }
                
                logger.info(f"النتيجة: {result}")
                
            except Exception as e:
                response_time = time.time() - start_time
                result = {
                    'text_size': size,
                    'success': False,
                    'response_time': response_time,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }
                
                logger.error(f"خطأ في اختبار حجم {size}: {e}")
            
            results.append(result)
            
            # فترة راحة للذاكرة
            await asyncio.sleep(2)
        
        return results
    
    def _generate_large_text(self, target_size: int) -> str:
        """توليد نص كبير بالطول المطلوب"""
        # نموذج مشهد سينمائي
        scene_template = """
        INT. MODERN OFFICE BUILDING - CONFERENCE ROOM - DAY
        
        The room is sleek and modern, with floor-to-ceiling windows overlooking a bustling cityscape. 
        A long glass table dominates the center, surrounded by ergonomic chairs. 
        Multiple screens display various charts and graphs, casting blue light across the space.
        
        MARGARET (45), a confident executive in a tailored suit, stands at the head of the table. 
        Her expression is determined as she addresses the group.
        
        MARGARET
        (confident, authoritative)
        Gentlemen, we have a unique opportunity here. The market conditions are perfect, 
        the timing is ideal, and our competitors are vulnerable.
        
        She moves to one of the screens and begins her presentation. 
        Charts and graphs fill the display, showing upward trends and promising projections.
        
        MARGARET (CONT'D)
        (pointing to data)
        As you can see from these numbers, our projected ROI exceeds industry standards by 340%. 
        This isn't just growth - this is transformation.
        
        The camera slowly pans across the room, capturing the intense focus on each face. 
        JAMES (35), the financial analyst, nods approvingly. 
        DAVID (40), the technical director, takes notes furiously. 
        ROBERT (50), the risk assessment specialist, looks concerned but intrigued.
        
        DAVID
        (analytical, precise)
        The technical implementation timeline seems ambitious but achievable. 
        Our infrastructure can handle the load, assuming we secure the additional server capacity.
        
        ROBERT
        (calmly)
        I understand your concerns. Let's review the implementation plan one more time and ensure we have adequate fallback mechanisms.
        """
