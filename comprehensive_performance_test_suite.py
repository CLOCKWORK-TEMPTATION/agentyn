#!/usr/bin/env python3
"""
مجموعة اختبارات الأداء الشاملة
Comprehensive Performance Test Suite

تشمل جميع اختبارات الأداء والتحميل والموارد
Requirements: 10.5, 12.1
"""

import asyncio
import time
import json
import logging
import psutil
import requests
import statistics
import gc
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
import multiprocessing as mp
from threading import Lock
import traceback

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# نماذج البيانات
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class TestConfig:
    """إعدادات الاختبار"""
    base_url: str = "http://localhost:8000"
    total_requests: int = 100
    concurrent_users: int = 10
    test_duration_seconds: int = 60
    text_sizes: List[int] = None  # أحجام النصوص للاختبار
    success_threshold: float = 0.95
    max_response_time: float = 30.0
    memory_limit_mb: int = 2048
    cpu_limit_percent: float = 80.0
    
    def __post_init__(self):
        if self.text_sizes is None:
            self.text_sizes = [1000, 5000, 10000, 50000, 100000]

@dataclass
class TestResult:
    """نتيجة اختبار واحد"""
    test_name: str
    success: bool
    response_time: float
    memory_usage_mb: float
    cpu_usage_percent: float
    error_message: Optional[str] = None
    timestamp: str = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

@dataclass
class AggregatedTestResults:
    """نتائج مجمعة لمجموعة اختبارات"""
    test_suite_name: str
    total_tests: int
    successful_tests: int
    failed_tests: int
    average_response_time: float
    min_response_time: float
    max_response_time: float
    p95_response_time: float
    p99_response_time: float
    average_memory_mb: float
    peak_memory_mb: float
    average_cpu_percent: float
    peak_cpu_percent: float
    success_rate: float
    timestamp: str = None
    individual_results: List[TestResult] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()
        if self.individual_results is None:
            self.individual_results = []

# ═══════════════════════════════════════════════════════════════════════════
# نظام مراقبة الموارد المتقدم
# ═══════════════════════════════════════════════════════════════════════════

class AdvancedResourceMonitor:
    """نظام مراقبة متقدم للموارد"""
    
    def __init__(self, sampling_interval: float = 0.5):
        self.sampling_interval = sampling_interval
        self.monitoring = False
        self.data = {
            'cpu_samples': [],
            'memory_samples': [],
            'timestamps': []
        }
        self.lock = Lock()
        self.monitor_thread = None
    
    def start_monitoring(self):
        """بدء المراقبة"""
        self.monitoring = True
        self.data = {'cpu_samples': [], 'memory_samples': [], 'timestamps': []}
        
        def monitor_loop():
            process = psutil.Process()
            while self.monitoring:
                try:
                    cpu_percent = process.cpu_percent(interval=0.1)
                    memory_mb = process.memory_info().rss / (1024 * 1024)
                    
                    with self.lock:
                        self.data['cpu_samples'].append(cpu_percent)
                        self.data['memory_samples'].append(memory_mb)
                        self.data['timestamps'].append(datetime.now().isoformat())
                    
                    time.sleep(self.sampling_interval)
                except Exception as e:
                    logger.error(f"خطأ في المراقبة: {e}")
        
        import threading
        self.monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def stop_monitoring(self):
        """إيقاف المراقبة"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2)
    
    def get_statistics(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الموارد"""
        with self.lock:
            if not self.data['cpu_samples']:
                return {
                    'cpu_avg': 0, 'cpu_peak': 0,
                    'memory_avg': 0, 'memory_peak': 0
                }
            
            return {
                'cpu_avg': statistics.mean(self.data['cpu_samples']),
                'cpu_peak': max(self.data['cpu_samples']),
                'cpu_min': min(self.data['cpu_samples']),
                'memory_avg': statistics.mean(self.data['memory_samples']),
                'memory_peak': max(self.data['memory_samples']),
                'memory_min': min(self.data['memory_samples']),
                'sample_count': len(self.data['cpu_samples'])
            }

# ═══════════════════════════════════════════════════════════════════════════
# اختبار الأداء مع النصوص الطويلة
# ═══════════════════════════════════════════════════════════════════════════

class LongTextPerformanceTester:
    """اختبار الأداء مع النصوص الطويلة"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.monitor = AdvancedResourceMonitor()
    
    def generate_text(self, size: int) -> str:
        """توليد نص بالحجم المطلوب"""
        scene_template = """
INT. MODERN OFFICE - DAY

A bustling workspace filled with activity. EMPLOYEES work diligently at their desks.
The atmosphere is professional yet dynamic, with the hum of productivity in the air.

MANAGER (40s), confident and authoritative, walks through the office.

MANAGER
(addressing the team)
We have an important deadline approaching. Let's stay focused and deliver excellence.

The camera pans across various workstations, capturing the dedication of each team member.
"""
        repetitions = (size // len(scene_template)) + 1
        return (scene_template * repetitions)[:size]
    
    async def test_text_size(self, text_size: int) -> TestResult:
        """اختبار حجم نص معين"""
        logger.info(f"اختبار حجم النص: {text_size:,} حرف")
        
        # توليد النص
        test_text = self.generate_text(text_size)
        
        # بدء المراقبة
        self.monitor.start_monitoring()
        gc.collect()
        
        start_time = time.time()
        success = False
        error_msg = None
        
        try:
            payload = {
                "text": test_text,
                "component": "scene_salience",
                "context": {},
                "confidence_threshold": 0.7,
                "parallel_processing": True,
                "enable_caching": True,
                "chunk_size": 100
            }
            
            response = requests.post(
                f"{self.config.base_url}/analyze",
                json=payload,
                timeout=self.config.max_response_time
            )
            
            success = response.status_code == 200
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"خطأ في اختبار حجم {text_size}: {e}")
        
        response_time = time.time() - start_time
        
        # إيقاف المراقبة
        self.monitor.stop_monitoring()
        stats = self.monitor.get_statistics()
        
        return TestResult(
            test_name=f"long_text_{text_size}",
            success=success,
            response_time=response_time,
            memory_usage_mb=stats['memory_avg'],
            cpu_usage_percent=stats['cpu_avg'],
            error_message=error_msg
        )
    
    async def run_all_tests(self) -> AggregatedTestResults:
        """تشغيل جميع اختبارات النصوص الطويلة"""
        logger.info("بدء اختبارات النصوص الطويلة")
        
        results = []
        for text_size in self.config.text_sizes:
            result = await self.test_text_size(text_size)
            results.append(result)
            await asyncio.sleep(1)  # فترة راحة بين الاختبارات
        
        return self._aggregate_results("long_text_tests", results)
    
    def _aggregate_results(self, suite_name: str, results: List[TestResult]) -> AggregatedTestResults:
        """تجميع النتائج"""
        successful = [r for r in results if r.success]
        response_times = [r.response_time for r in results]
        
        return AggregatedTestResults(
            test_suite_name=suite_name,
            total_tests=len(results),
            successful_tests=len(successful),
            failed_tests=len(results) - len(successful),
            average_response_time=statistics.mean(response_times) if response_times else 0,
            min_response_time=min(response_times) if response_times else 0,
            max_response_time=max(response_times) if response_times else 0,
            p95_response_time=statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times) if response_times else 0,
            p99_response_time=statistics.quantiles(response_times, n=100)[98] if len(response_times) > 100 else max(response_times) if response_times else 0,
            average_memory_mb=statistics.mean([r.memory_usage_mb for r in results]),
            peak_memory_mb=max([r.memory_usage_mb for r in results]),
            average_cpu_percent=statistics.mean([r.cpu_usage_percent for r in results]),
            peak_cpu_percent=max([r.cpu_usage_percent for r in results]),
            success_rate=len(successful) / len(results) if results else 0,
            individual_results=results
        )

# ═══════════════════════════════════════════════════════════════════════════
# اختبار التحميل مع طلبات متعددة
# ═══════════════════════════════════════════════════════════════════════════

class ConcurrentLoadTester:
    """اختبار التحميل مع طلبات متعددة متزامنة"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.monitor = AdvancedResourceMonitor()
    
    def make_request(self, request_id: int) -> TestResult:
        """إرسال طلب واحد"""
        start_time = time.time()
        success = False
        error_msg = None
        
        try:
            payload = {
                "text": f"Test request {request_id} with sample cinematic content.",
                "component": "scene_salience",
                "context": {"request_id": request_id},
                "confidence_threshold": 0.7
            }
            
            response = requests.post(
                f"{self.config.base_url}/analyze",
                json=payload,
                timeout=self.config.max_response_time
            )
            
            success = response.status_code == 200
            
        except Exception as e:
            error_msg = str(e)
        
        response_time = time.time() - start_time
        
        return TestResult(
            test_name=f"concurrent_request_{request_id}",
            success=success,
            response_time=response_time,
            memory_usage_mb=0,  # سيتم تحديثها من المراقب
            cpu_usage_percent=0,
            error_message=error_msg
        )
    
    async def run_concurrent_test(self) -> AggregatedTestResults:
        """تشغيل اختبار الطلبات المتزامنة"""
        logger.info(f"بدء اختبار التحميل: {self.config.total_requests} طلب، {self.config.concurrent_users} متزامن")
        
        # بدء المراقبة
        self.monitor.start_monitoring()
        
        results = []
        with ThreadPoolExecutor(max_workers=self.config.concurrent_users) as executor:
            futures = [
                executor.submit(self.make_request, i)
                for i in range(self.config.total_requests)
            ]
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"خطأ في الطلب: {e}")
        
        # إيقاف المراقبة
        self.monitor.stop_monitoring()
        stats = self.monitor.get_statistics()
        
        # تحديث نتائج الموارد
        for result in results:
            result.memory_usage_mb = stats['memory_avg']
            result.cpu_usage_percent = stats['cpu_avg']
        
        return self._aggregate_results("concurrent_load_test", results)
    
    def _aggregate_results(self, suite_name: str, results: List[TestResult]) -> AggregatedTestResults:
        """تجميع النتائج"""
        successful = [r for r in results if r.success]
        response_times = [r.response_time for r in results]
        
        return AggregatedTestResults(
            test_suite_name=suite_name,
            total_tests=len(results),
            successful_tests=len(successful),
            failed_tests=len(results) - len(successful),
            average_response_time=statistics.mean(response_times) if response_times else 0,
            min_response_time=min(response_times) if response_times else 0,
            max_response_time=max(response_times) if response_times else 0,
            p95_response_time=statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times) if response_times else 0,
            p99_response_time=statistics.quantiles(response_times, n=100)[98] if len(response_times) > 100 else max(response_times) if response_times else 0,
            average_memory_mb=statistics.mean([r.memory_usage_mb for r in results]),
            peak_memory_mb=max([r.memory_usage_mb for r in results]),
            average_cpu_percent=statistics.mean([r.cpu_usage_percent for r in results]),
            peak_cpu_percent=max([r.cpu_usage_percent for r in results]),
            success_rate=len(successful) / len(results) if results else 0,
            individual_results=results
        )

# ═══════════════════════════════════════════════════════════════════════════
# اختبار استهلاك الذاكرة والموارد
# ═══════════════════════════════════════════════════════════════════════════

class MemoryResourceTester:
    """اختبار استهلاك الذاكرة والموارد"""
    
    def __init__(self, config: TestConfig):
        self.config = config
        self.monitor = AdvancedResourceMonitor()
    
    async def test_memory_leak(self, iterations: int = 10) -> Dict[str, Any]:
        """اختبار تسرب الذاكرة"""
        logger.info(f"بدء اختبار تسرب الذاكرة: {iterations} تكرار")
        
        memory_readings = []
        
        for i in range(iterations):
            gc.collect()
            memory_before = psutil.Process().memory_info().rss / (1024 * 1024)
            
            # إرسال طلب
            try:
                payload = {
                    "text": "Test memory leak detection" * 100,
                    "component": "scene_salience"
                }
                
                response = requests.post(
                    f"{self.config.base_url}/analyze",
                    json=payload,
                    timeout=30
                )
            except Exception as e:
                logger.error(f"خطأ في التكرار {i}: {e}")
            
            gc.collect()
            memory_after = psutil.Process().memory_info().rss / (1024 * 1024)
            
            memory_readings.append({
                'iteration': i,
                'memory_before_mb': memory_before,
                'memory_after_mb': memory_after,
                'memory_delta_mb': memory_after - memory_before
            })
            
            await asyncio.sleep(1)
        
        # تحليل النتائج
        deltas = [r['memory_delta_mb'] for r in memory_readings]
        
        return {
            'test_name': 'memory_leak_test',
            'iterations': iterations,
            'memory_readings': memory_readings,
            'average_delta_mb': statistics.mean(deltas),
            'max_delta_mb': max(deltas),
            'total_memory_increase_mb': sum(deltas),
            'potential_leak': sum(deltas) > 100  # أكثر من 100MB زيادة
        }
    
    async def test_resource_limits(self) -> Dict[str, Any]:
        """اختبار حدود الموارد"""
        logger.info("بدء اختبار حدود الموارد")
        
        self.monitor.start_monitoring()
        
        # إرسال طلبات متعددة لاختبار الحدود
        results = []
        for i in range(20):
            try:
                payload = {
                    "text": "Resource limit test" * 1000,
                    "component": "scene_salience",
                    "memory_limit_mb": self.config.memory_limit_mb
                }
                
                start_time = time.time()
                response = requests.post(
                    f"{self.config.base_url}/analyze",
                    json=payload,
                    timeout=30
                )
                response_time = time.time() - start_time
                
                results.append({
                    'iteration': i,
                    'success': response.status_code == 200,
                    'response_time': response_time
                })
                
            except Exception as e:
                results.append({
                    'iteration': i,
                    'success': False,
                    'error': str(e)
                })
            
            await asyncio.sleep(0.5)
        
        self.monitor.stop_monitoring()
        stats = self.monitor.get_statistics()
        
        return {
            'test_name': 'resource_limits_test',
            'total_iterations': len(results),
            'successful_iterations': sum(1 for r in results if r.get('success')),
            'resource_stats': stats,
            'exceeded_cpu_limit': stats['cpu_peak'] > self.config.cpu_limit_percent,
            'exceeded_memory_limit': stats['memory_peak'] > self.config.memory_limit_mb
        }

# ═══════════════════════════════════════════════════════════════════════════
# مجموعة الاختبارات الشاملة
# ═══════════════════════════════════════════════════════════════════════════

class ComprehensiveTestSuite:
    """مجموعة اختبارات شاملة للأداء"""
    
    def __init__(self, config: TestConfig = None):
        self.config = config or TestConfig()
        self.long_text_tester = LongTextPerformanceTester(self.config)
        self.concurrent_tester = ConcurrentLoadTester(self.config)
        self.memory_tester = MemoryResourceTester(self.config)
        self.all_results = {}
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """تشغيل جميع الاختبارات"""
        logger.info("=" * 80)
        logger.info("بدء مجموعة الاختبارات الشاملة")
        logger.info("=" * 80)
        
        # 1. اختبارات النصوص الطويلة
        logger.info("\n1️⃣ اختبارات النصوص الطويلة")
        long_text_results = await self.long_text_tester.run_all_tests()
        self.all_results['long_text_tests'] = asdict(long_text_results)
        
        # 2. اختبارات التحميل المتزامن
        logger.info("\n2️⃣ اختبارات التحميل المتزامن")
        concurrent_results = await self.concurrent_tester.run_concurrent_test()
        self.all_results['concurrent_load_tests'] = asdict(concurrent_results)
        
        # 3. اختبارات الذاكرة والموارد
        logger.info("\n3️⃣ اختبارات الذاكرة والموارد")
        memory_leak_results = await self.memory_tester.test_memory_leak()
        resource_limit_results = await self.memory_tester.test_resource_limits()
        
        self.all_results['memory_tests'] = {
            'memory_leak': memory_leak_results,
            'resource_limits': resource_limit_results
        }
        
        # إنشاء ملخص شامل
        self.all_results['summary'] = self._create_summary()
        
        logger.info("\n" + "=" * 80)
        logger.info("انتهت جميع الاختبارات")
        logger.info("=" * 80)
        
        return self.all_results
    
    def _create_summary(self) -> Dict[str, Any]:
        """إنشاء ملخص شامل للنتائج"""
        summary = {
            'timestamp': datetime.now().isoformat(),
            'total_test_suites': 3,
            'overall_success': True,
            'recommendations': []
        }
        
        # تحليل نتائج النصوص الطويلة
        if 'long_text_tests' in self.all_results:
            lt_results = self.all_results['long_text_tests']
            summary['long_text_success_rate'] = lt_results['success_rate']
            
            if lt_results['success_rate'] < 0.9:
                summary['recommendations'].append(
                    "تحسين معالجة النصوص الطويلة - معدل النجاح أقل من 90%"
                )
        
        # تحليل نتائج التحميل المتزامن
        if 'concurrent_load_tests' in self.all_results:
            cl_results = self.all_results['concurrent_load_tests']
            summary['concurrent_success_rate'] = cl_results['success_rate']
            summary['average_response_time'] = cl_results['average_response_time']
            
            if cl_results['average_response_time'] > 5.0:
                summary['recommendations'].append(
                    "تحسين زمن الاستجابة - المتوسط أكبر من 5 ثواني"
                )
        
        # تحليل نتائج الذاكرة
        if 'memory_tests' in self.all_results:
            mem_results = self.all_results['memory_tests']
            
            if mem_results['memory_leak'].get('potential_leak'):
                summary['recommendations'].append(
                    "فحص تسرب الذاكرة المحتمل"
                )
                summary['overall_success'] = False
        
        return summary
    
    def save_results(self, filename: str = "performance_test_results.json"):
        """حفظ النتائج في ملف"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.all_results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"تم حفظ النتائج في: {filename}")
    
    def print_summary(self):
        """طباعة ملخص النتائج"""
        if 'summary' not in self.all_results:
            return
        
        summary = self.all_results['summary']
        
        print("\n" + "=" * 80)
        print("ملخص نتائج الاختبارات")
        print("=" * 80)
        
        print(f"\n✅ الحالة العامة: {'نجاح' if summary['overall_success'] else 'فشل'}")
        
        if 'long_text_success_rate' in summary:
            print(f"📝 معدل نجاح النصوص الطويلة: {summary['long_text_success_rate']:.1%}")
        
        if 'concurrent_success_rate' in summary:
            print(f"⚡ معدل نجاح التحميل المتزامن: {summary['concurrent_success_rate']:.1%}")
        
        if 'average_response_time' in summary:
            print(f"⏱️  متوسط زمن الاستجابة: {summary['average_response_time']:.2f} ثانية")
        
        if summary['recommendations']:
            print("\n📋 التوصيات:")
            for i, rec in enumerate(summary['recommendations'], 1):
                print(f"   {i}. {rec}")
        
        print("\n" + "=" * 80)

# ═══════════════════════════════════════════════════════════════════════════
# البرنامج الرئيسي
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    """البرنامج الرئيسي"""
    # إعداد الاختبار
    config = TestConfig(
        base_url="http://localhost:8000",
        total_requests=50,
        concurrent_users=5,
        text_sizes=[1000, 5000, 10000, 50000, 100000],
        success_threshold=0.90,
        max_response_time=30.0
    )
    
    # إنشاء مجموعة الاختبارات
    test_suite = ComprehensiveTestSuite(config)
    
    try:
        # تشغيل جميع الاختبارات
        results = await test_suite.run_all_tests()
        
        # حفظ النتائج
        test_suite.save_results("comprehensive_performance_results.json")
        
        # طباعة الملخص
        test_suite.print_summary()
        
        return results
        
    except Exception as e:
        logger.error(f"خطأ في تشغيل الاختبارات: {e}")
        logger.error(traceback.format_exc())
        return None

if __name__ == "__main__":
    asyncio.run(main())
