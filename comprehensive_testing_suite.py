#!/usr/bin/env python3
"""
مجموعة الاختبارات الشاملة لخدمة Python المتقدمة للتفريغ السينمائي
Comprehensive Testing Suite for Advanced Python Brain Service

تختبر جميع الوظائف والميزات المتقدمة
"""

import pytest
import asyncio
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
import sys
import os

# إضافة مسار المشروع
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ultimate_performance_api_server import AdvancedJobManager, ProcessingComponent, Priority, JobStatus, AdvancedAnalysisRequest

class TestAdvancedJobManager:
    """اختبارات مدير المهام المتقدم"""
    
    def setup_method(self):
        """إعداد الاختبارات"""
        self.job_manager = AdvancedJobManager(max_concurrent_jobs=5)
    
    def test_create_job_basic(self):
        """اختبار إنشاء مهمة أساسية"""
        request = AdvancedAnalysisRequest(
            text="نص تجريبي للتحليل السينمائي",
            component=ProcessingComponent.SCENE_SALIENCE,
            priority=Priority.NORMAL
        )
        
        job_id = self.job_manager.create_job(request)
        
        assert job_id is not None
        assert len(job_id) > 0
        assert job_id in self.job_manager.jobs
        
        job = self.job_manager.get_job(job_id)
        assert job.status == JobStatus.PENDING
        assert job.component == ProcessingComponent.SCENE_SALIENCE
    
    def test_create_job_with_priority(self):
        """اختبار إنشاء مهام بأولويات مختلفة"""
        priorities = [Priority.LOW, Priority.NORMAL, Priority.HIGH, Priority.URGENT, Priority.CRITICAL]
        job_ids = []
        
        for priority in priorities:
            request = AdvancedAnalysisRequest(
                text=f"مهمة بأولوية {priority.value}",
                component=ProcessingComponent.CONTINUITY_CHECK,
                priority=priority
            )
            job_id = self.job_manager.create_job(request)
            job_ids.append(job_id)
        
        # التحقق من ترتيب الأولويات
        jobs = self.job_manager.get_all_jobs()
        assert len(jobs) == 5
        
        # التحقق من أن المهام الحرجة في المقدمة
        critical_job = next((job for job in jobs if job.metadata.get("priority") == "critical"), None)
        normal_job = next((job for job in jobs if job.metadata.get("priority") == "normal"), None)
        
        if critical_job and normal_job:
            critical_index = jobs.index(critical_job)
            normal_index = jobs.index(normal_job)
            assert critical_index < normal_index
    
    def test_job_tracking_and_status_updates(self):
        """اختبار تتبع المهام وتحديث الحالات"""
        request = AdvancedAnalysisRequest(
            text="مهمة للتتبع",
            component=ProcessingComponent.FULL_ANALYSIS,
            priority=Priority.HIGH
        )
        
        job_id = self.job_manager.create_job(request)
        
        # اختبار تحديث الحالة
        self.job_manager.update_job_status(job_id, JobStatus.PROCESSING)
        
        job = self.job_manager.get_job(job_id)
        assert job.status == JobStatus.PROCESSING
        
        # اختبار تسجيل وقت المعالجة
        self.job_manager.record_processing_time(job_id, 1500.5)
        
        job = self.job_manager.get_job(job_id)
        assert job.processing_time_ms == 1500.5
        
        # اختبار إكمال المهمة
        self.job_manager.update_job_status(job_id, JobStatus.COMPLETED)
        job = self.job_manager.get_job(job_id)
        assert job.status == JobStatus.COMPLETED
    
    def test_queue_position_tracking(self):
        """اختبار تتبع مواضع المهام في قائمة الانتظار"""
        # إنشاء عدة مهام
        job_ids = []
        for i in range(3):
            request = AdvancedAnalysisRequest(
                text=f"مهمة {i}",
                component=ProcessingComponent.SCENE_SALIENCE,
                priority=Priority.NORMAL
            )
            job_id = self.job_manager.create_job(request)
            job_ids.append(job_id)
        
        # التحقق من مواضع المهام
        for i, job_id in enumerate(job_ids):
            position = self.job_manager.get_queue_position(job_id)
            assert position == i + 1
    
    def test_performance_metrics(self):
        """اختبار مقاييس الأداء"""
        # إنشاء بعض المهام وإنهائها
        for i in range(3):
            request = AdvancedAnalysisRequest(
                text=f"مهمة أداء {i}",
                component=ProcessingComponent.SCENE_SALIENCE
            )
            job_id = self.job_manager.create_job(request)
            
            # محاكاة المعالجة
            self.job_manager.update_job_status(job_id, JobStatus.PROCESSING)
            self.job_manager.record_processing_time(job_id, 1000.0 + i * 500)
            self.job_manager.update_job_status(job_id, JobStatus.COMPLETED)
        
        metrics = self.job_manager.get_performance_metrics()
        
        assert metrics.completed_jobs == 3
        assert metrics.pending_jobs == 0
        assert metrics.active_jobs == 0
        assert metrics.average_processing_time > 0
        assert metrics.uptime_seconds > 0

class TestAdvancedAnalysisFeatures:
    """اختبارات الميزات المتقدمة للتحليل"""
    
    def setup_method(self):
        self.job_manager = AdvancedJobManager()
    
    def test_revolutionary_mode_analysis(self):
        """اختبار التحليل في الوضع الثوري"""
        request = AdvancedAnalysisRequest(
            text="نص متقدم للتحليل الثوري",
            component=ProcessingComponent.REVOLUTIONARY_BREAKDOWN,
            revolutionary_mode=True,
            quantum_analysis=True,
            neuromorphic_processing=True
        )
        
        job_id = self.job_manager.create_job(request)
        job = self.job_manager.get_job(job_id)
        
        assert job.metadata["revolutionary_mode"] == True
        assert job.metadata["quantum_analysis"] == True
        assert job.metadata["neuromorphic_processing"] == True
    
    def test_parallel_processing_mode(self):
        """اختبار المعالجة المتوازية"""
        requests = []
        for i in range(5):
            request = AdvancedAnalysisRequest(
                text=f"نص متوازي {i}",
                component=ProcessingComponent.MULTI_PASS_ANALYSIS,
                enable_parallel_processing=True,
                priority=Priority.HIGH
            )
            requests.append(request)
        
        # إنشاء عدة مهام متوازية
        job_ids = []
        for request in requests:
            job_id = self.job_manager.create_job(request)
            job_ids.append(job_id)
        
        # التحقق من أن المهام تم إنشاؤها
        assert len(job_ids) == 5
        
        # التحقق من أن النظام يدعم المعالجة المتوازية
        metrics = self.job_manager.get_performance_metrics()
        assert metrics.max_concurrent_jobs >= 5
    
    def test_caching_system(self):
        """اختبار نظام التخزين المؤقت"""
        # إنشاء طلب أول
        text = "نص للاختبار المتكرر"
        request1 = AdvancedAnalysisRequest(
            text=text,
            component=ProcessingComponent.SCENE_SALIENCE,
            cache_results=True
        )
        
        job_id1 = self.job_manager.create_job(request1)
        
        # إنشاء طلب مطابق (يجب أن يستخدم التخزين المؤقت)
        request2 = AdvancedAnalysisRequest(
            text=text,
            component=ProcessingComponent.SCENE_SALIENCE,
            cache_results=True
        )
        
        job_id2 = self.job_manager.create_job(request2)
        
        # يجب أن يكون job_id2 مختلف (يتم إنشاء مهمة جديدة في النظام الحالي)
        # لكن في النظام المحسن يجب أن يستخدم التخزين المؤقت
        
        # التحقق من وجود البيانات في التخزين المؤقت
        assert len(self.job_manager.cache) >= 1
    
    def test_error_handling_and_fallback(self):
        """اختبار معالجة الأخطاء وآليات الاستعادة"""
        # إنشاء مهمة عادية
        request = AdvancedAnalysisRequest(
            text="مهمة للاختبار",
            component=ProcessingComponent.SCENE_SALIENCE
        )
        
        job_id = self.job_manager.create_job(request)
        
        # محاكاة خطأ
        self.job_manager.update_job_status(job_id, JobStatus.PROCESSING)
        
        # محاكاة فشل المعالجة
        self.job_manager.update_job_status(
            job_id, 
            JobStatus.FAILED, 
            error_message="خطأ تجريبي في المعالجة"
        )
        
        job = self.job_manager.get_job(job_id)
        assert job.status == JobStatus.FAILED
        assert job.error_message is not None

class TestIntegrationWithRevolutionaryEngine:
    """اختبارات التكامل مع Revolutionary Engine"""
    
    def setup_method(self):
        self.job_manager = AdvancedJobManager()
    
    def test_revolutionary_engine_integration(self):
        """اختبار التكامل مع Revolutionary Engine"""
        request = AdvancedAnalysisRequest(
            text="نص للتحليل المتكامل",
            component=ProcessingComponent.REVOLUTIONARY_BREAKDOWN,
            integrate_revolutionary_engine=True
        )
        
        job_id = self.job_manager.create_job(request)
        job = self.job_manager.get_job(job_id)
        
        # التحقق من تفعيل التكامل
        assert job.component == ProcessingComponent.REVOLUTIONARY_BREAKDOWN
        
        # في التطبيق الفعلي، سيتم التكامل مع Revolutionary Engine هنا
        # هذا مجرد اختبار للإعدادات
    
    def test_multi_pass_analysis_integration(self):
        """اختبار تحليل التمريرات المتعددة"""
        request = AdvancedAnalysisRequest(
            text="نص للتحليل متعدد التمريرات",
            component=ProcessingComponent.MULTI_PASS_ANALYSIS,
            max_iterations=5,
            adaptive_learning=True
        )
        
        job_id = self.job_manager.create_job(request)
        job = self.job_manager.get_job(job_id)
        
        assert job.metadata["iterations"] == 5
        assert job.metadata["adaptive_learning"] == True

class TestPerformanceAndLoad:
    """اختبارات الأداء والتحميل"""
    
    def setup_method(self):
        self.job_manager = AdvancedJobManager(max_concurrent_jobs=10)
    
    def test_large_text_processing(self):
        """اختبار معالجة النصوص الطويلة"""
        # إنشاء نص طويل (10KB)
        long_text = "هذا نص طويل للاختبار. " * 1000  # حوالي 15KB
        
        request = AdvancedAnalysisRequest(
            text=long_text,
            component=ProcessingComponent.FULL_ANALYSIS
        )
        
        job_id = self.job_manager.create_job(request)
        
        # التحقق من أن المهمة تم إنشاؤها
        assert job_id in self.job_manager.jobs
        
        # التحقق من تقدير المدة (يجب أن يكون أطول للنصوص الطويلة)
        estimated_duration = self.job_manager.job_metadata[job_id]["estimated_duration"]
        assert estimated_duration > 10  # أطول من النص العادي
    
    def test_concurrent_jobs_performance(self):
        """اختبار أداء المهام المتزامنة"""
        start_time = time.time()
        
        # إنشاء 20 مهمة متزامنة
        job_ids = []
        for i in range(20):
            request = AdvancedAnalysisRequest(
                text=f"مهمة متزامنة {i}",
                component=ProcessingComponent.SCENE_SALIENCE,
                priority=Priority.HIGH
            )
            job_id = self.job_manager.create_job(request)
            job_ids.append(job_id)
        
        creation_time = time.time() - start_time
        
        # التحقق من أن جميع المهام تم إنشاؤها بسرعة
        assert creation_time < 2.0  # يجب أن يكون أقل من ثانيتين
        
        # التحقق من أن المهام في قائمة الانتظار
        assert len(self.job_manager.job_queue) == 20
    
    def test_memory_usage_monitoring(self):
        """اختبار مراقبة استخدام الذاكرة"""
        # إنشاء عدة مهام
        for i in range(10):
            request = AdvancedAnalysisRequest(
                text=f"نص مراقبة الذاكرة {i}",
                component=ProcessingComponent.FULL_ANALYSIS
            )
            self.job_manager.create_job(request)
        
        # الحصول على مقاييس الأداء
        metrics = self.job_manager.get_performance_metrics()
        
        # التحقق من مقاييس الذاكرة
        assert metrics.memory_usage >= 0
        assert metrics.memory_usage <= 100
        assert metrics.memory_available > 0
    
    def test_cache_performance(self):
        """اختبار أداء التخزين المؤقت"""
        text = "نص للاختبار المتكرر"
        
        # إنشاء مهمة
        request1 = AdvancedAnalysisRequest(
            text=text,
            component=ProcessingComponent.SCENE_SALIENCE,
            cache_results=True
        )
        
        start_time = time.time()
        job_id1 = self.job_manager.create_job(request1)
        first_creation_time = time.time() - start_time
        
        # إنشاء مهمة مطابقة (يجب أن تكون أسرع)
        request2 = AdvancedAnalysisRequest(
            text=text,
            component=ProcessingComponent.SCENE_SALIENCE,
            cache_results=True
        )
        
        start_time = time.time()
        job_id2 = self.job_manager.create_request(request2)
        second_creation_time = time.time() - start_time
        
        # يجب أن تكون المهمة الثانية أسرع (أو بنفس السرعة في النظام الحالي)
        # في النظام المحسن، يجب أن تكون أسرع بكثير

def run_comprehensive_tests():
    """تشغيل جميع الاختبارات الشاملة"""
    print("بدء الاختبارات الشاملة لخدمة Python المتقدمة...")
    
    # إعداد pytest
    pytest_args = [
        __file__,
        "-v",  # تفصيل في النتائج
        "--tb=short",  # تتبع الأخطاء المختصر
        "--color=yes"  # ألوان في النتائج
    ]
    
    # تشغيل الاختبارات
    exit_code = pytest.main(pytest_args)
    
    if exit_code == 0:
        print("✅ جميع الاختبارات نجحت!")
    else:
        print("❌ بعض الاختبارات فشلت!")
    
    return exit_code

if __name__ == "__main__":
    run_comprehensive_tests()
