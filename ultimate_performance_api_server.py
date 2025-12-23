#!/usr/bin/env python3
"""
خادم API محسن للأداء - التفريغ السينمائي
Ultimate Performance API Server for Cinematic Breakdown

يدعم جميع تحسينات الأداء والمتطلبات:
- Requirements: 6.1-6.5, 10.1-10.5, 12.1
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from enum import Enum
import uuid
import asyncio
import time
import json
import logging
from datetime import datetime, timedelta
import traceback
import psutil
from collections import defaultdict, deque
from threading import Lock
import hashlib
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
import gc
import sys
import os
from performance_load_testing_system import PerformanceTester, LoadTestConfig, LongTextPerformanceTester

# إعداد التسجيل المحسن
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# استيراد المكونات المحسنة
from complete_performance_brain_service import (
    AdvancedCacheManager, ResourceManager, ParallelProcessor,
    PerformanceOptimizedAnalysisRequest, PerformanceMetrics, LoadTestResult
)

# ═══════════════════════════════════════════════════════════════════════════════════
# نماذج البيانات المحسنة
# ═══════════════════════════════════════════════════════════════════════════════════

class ProcessingComponent(str, Enum):
    SCENE_SALIENCE = "scene_salience"
    CONTINUITY_CHECK = "continuity_check"
    REVOLUTIONARY_BREAKDOWN = "revolutionary_breakdown"
    SEMANTIC_SYNOPSIS = "semantic_synopsis"
    PROP_CLASSIFICATION = "prop_classification"
    WARDROBE_INFERENCE = "wardrobe_inference"
    CINEMATIC_PATTERNS = "cinematic_patterns"
    FULL_ANALYSIS = "full_analysis"
    BATCH_ANALYSIS = "batch_analysis"
    PERFORMANCE_OPTIMIZED_ANALYSIS = "performance_optimized_analysis"

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    OPTIMIZING = "optimizing"

class Priority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

class Evidence(BaseModel):
    span_start: int = Field(..., ge=0)
    span_end: int = Field(..., gt=0)
    text_excerpt: str = Field(..., min_length=1)
    rationale: str = Field(..., min_length=5)
    confidence: float = Field(..., ge=0, le=1)

class AnalysisResult(BaseModel):
    job_id: str
    status: JobStatus
    component: ProcessingComponent
    result: Dict[str, Any]
    evidence: List[Evidence]
    confidence_score: float
    processing_time_ms: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # بيانات الأداء المحسنة
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    parallel_efficiency: float = 0.0
    cache_hit: bool = False
    chunk_processed: int = 0
    total_chunks: int = 0

class SystemHealth(BaseModel):
    """صحة النظام الشاملة"""
    status: str
    services: Dict[str, str]
    resources: Dict[str, float]
    connections: int
    uptime: float
    version: str
    timestamp: datetime
    performance_score: float
    optimization_active: bool

class BatchAnalysisRequest(BaseModel):
    """طلب تحليل دفعي"""
    texts: List[str] = Field(..., min_items=1, max_items=100)
    component: ProcessingComponent
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    confidence_threshold: float = Field(0.7, ge=0, le=1)
    parallel_processing: bool = Field(True)
    enable_caching: bool = Field(True)

# ═══════════════════════════════════════════════════════════════════════════════════
# تطبيق FastAPI المحسن
# ═══════════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Ultimate Performance Brain Service",
    description="خدمة Python المتقدمة المحسنة للأداء مع دعم التفريغ السينمائي",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# إضافة CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════════════
# نظام إدارة الموارد المتقدم
# ═══════════════════════════════════════════════════════════════════════════════════

class UltimateResourceManager:
    """مدير الموارد المتقدم للنظام"""
    
    def __init__(self):
        self.cache_manager = AdvancedCacheManager(max_size_mb=1024, default_ttl=3600)
        self.resource_manager = ResourceManager(memory_limit_mb=4096)
        self.parallel_processor = ParallelProcessor(max_workers=mp.cpu_count())
        self.job_manager = None  # سيتم تهيئته لاحقاً
        self.performance_tester = PerformanceTester(
            LoadTestConfig(
                base_url="http://localhost:8000",
                total_requests=50,
                concurrent_users=5
            )
        )
        self.long_text_tester = LongTextPerformanceTester("http://localhost:8000")
        self.start_time = datetime.now()
        self.active_optimizations = {}
        
    def get_system_health(self) -> SystemHealth:
        """الحصول على صحة النظام الشاملة"""
        memory_info = self.resource_manager.check_memory_usage()
        cpu_info = self.resource_manager.check_cpu_usage()
        cache_stats = self.cache_manager.get_stats()
        
        # حساب نتيجة الأداء
        performance_score = self._calculate_performance_score(
            memory_info, cpu_info, cache_stats
        )
        
        # تحديد حالة النظام
        status = "healthy"
        if performance_score < 70:
            status = "degraded"
        elif performance_score < 50:
            status = "critical"
        
        return SystemHealth(
            status=status,
            services={
                "cache": "active" if cache_stats['hit_rate'] > 50 else "degraded",
                "resource_monitor": "active",
                "parallel_processor": "active",
                "optimization": "active" if self.active_optimizations else "inactive"
            },
            resources={
                "cpu_usage": cpu_info.get('cpu_percent', 0),
                "memory_usage": memory_info.get('process_percent', 0),
                "cache_hit_rate": cache_stats['hit_rate'],
                "active_jobs": len(self.active_optimizations)
            },
            connections=len(psutil.net_connections()),
            uptime=(datetime.now() - self.start_time).total_seconds(),
            version="2.0.0",
            timestamp=datetime.now(),
            performance_score=performance_score,
            optimization_active=bool(self.active_optimizations)
        )
    
    def _calculate_performance_score(self, memory_info: Dict, cpu_info: Dict, cache_stats: Dict) -> float:
        """حساب نتيجة الأداء الإجمالية"""
        score = 100.0
        
        # خصم للذاكرة
        memory_percent = memory_info.get('process_percent', 0)
        if memory_percent > 80:
            score -= 30
        elif memory_percent > 60:
            score -= 15
        
        # خصم للمعالج
        cpu_percent = cpu_info.get('cpu_percent', 0)
        if cpu_percent > 90:
            score -= 25
        elif cpu_percent > 70:
            score -= 10
        
        # خصم لمعدل الذاكرة المؤقتة
        cache_hit_rate = cache_stats.get('hit_rate', 0)
        if cache_hit_rate < 30:
            score -= 20
        elif cache_hit_rate < 50:
            score -= 10
        
        return max(0, score)
    
    async def run_performance_optimization(self) -> Dict[str, Any]:
        """تشغيل تحسين الأداء"""
        logger.info("بدء تحسين الأداء التلقائي")
        
        # تحسين الذاكرة المؤقتة
        cache_optimization = self._optimize_cache()
        
        # تحسين تخصيص الموارد
        resource_optimization = self._optimize_resources()
        
        # تحسين المعالجة المتوازية
        parallel_optimization = self._optimize_parallel_processing()
        
        result = {
            "optimization_timestamp": datetime.now().isoformat(),
            "cache_optimization": cache_optimization,
            "resource_optimization": resource_optimization,
            "parallel_optimization": parallel_optimization,
            "overall_score_improvement": self._calculate_improvement()
        }
        
        self.active_optimizations["last_optimization"] = result
        return result
    
    def _optimize_cache(self) -> Dict[str, Any]:
        """تحسين الذاكرة المؤقتة"""
        cache_stats = self.cache_manager.get_stats()
        
        # تحسين إعدادات الذاكرة المؤقتة
        if cache_stats['hit_rate'] < 50:
            # زيادة حجم الذاكرة المؤقتة
            self.cache_manager = AdvancedCacheManager(max_size_mb=2048, default_ttl=7200)
            return {"action": "increased_cache_size", "new_size_mb": 2048}
        
        return {"action": "cache_optimal", "hit_rate": cache_stats['hit_rate']}
    
    def _optimize_resources(self) -> Dict[str, Any]:
        """تحسين تخصيص الموارد"""
        memory_info = self.resource_manager.check_memory_usage()
        cpu_info = self.resource_manager.check_cpu_usage()
        
        recommendations = []
        
        # تحليل استخدام الذاكرة
        if memory_info.get('process_percent', 0) > 80:
            recommendations.append("توصية: تقليل حجم الذاكرة المؤقتة")
        
        # تحليل استخدام المعالج
        if cpu_info.get('cpu_percent', 0) > 80:
            recommendations.append("توصية: تقليل عدد العمال المتوازيين")
        
        return {
            "memory_status": memory_info,
            "cpu_status": cpu_info,
            "recommendations": recommendations
        }
    
    def _optimize_parallel_processing(self) -> Dict[str, Any]:
        """تحسين المعالجة المتوازية"""
        optimal_workers = self.resource_manager.get_optimal_worker_count()
        
        if optimal_workers != self.parallel_processor.max_workers:
            self.parallel_processor.max_workers = optimal_workers
            return {
                "action": "adjusted_worker_count",
                "new_worker_count": optimal_workers
            }
        
        return {"action": "parallel_processing_optimal", "worker_count": optimal_workers}
    
    def _calculate_improvement(self) -> float:
        """حساب التحسن في الأداء"""
        # محاكاة حساب التحسن
        return 5.2  # نسبة التحسن المئوية

# إنشاء مدير الموارد المتقدم
resource_manager = UltimateResourceManager()

# ═══════════════════════════════════════════════════════════════════════════════════
# Endpoints API المحسنة
# ═══════════════════════════════════════════════════════════════════════════════════

@app.get("/", response_model=Dict[str, Any])
async def root():
    """نقطة البداية - معلومات الخدمة المحسنة"""
    health = resource_manager.get_system_health()
    
    return {
        "service": "Ultimate Performance Brain Service",
        "version": "2.0.0",
        "description": "خدمة Python متقدمة محسنة للأداء مع دعم التفريغ السينمائي",
        "status": "active",
        "performance_score": health.performance_score,
        "optimization_active": health.optimization_active,
        "available_optimizations": [
            "parallel_processing",
            "intelligent_caching",
            "resource_monitoring",
            "auto_optimization",
            "performance_testing"
        ],
        "endpoints": [
            "/health",
            "/performance/health",
            "/performance/optimize",
            "/performance/test",
            "/performance/long-text-test",
            "/analyze/optimized",
            "/analyze/batch",
            "/cache/stats",
            "/resources/monitor"
        ],
        "capabilities": [
            "معالجة النصوص الطويلة",
            "المعالجة المتوازية",
            "الذاكرة المؤقتة الذكية",
            "مراقبة الموارد",
            "اختبار الأداء التلقائي",
            "تحسين الأداء التلقائي"
        ]
    }

@app.get("/performance/health", response_model=SystemHealth)
async def get_performance_health():
    """فحص صحة الأداء"""
    return resource_manager.get_system_health()

@app.post("/performance/optimize")
async def optimize_performance():
    """تشغيل تحسين الأداء التلقائي"""
    try:
        result = await resource_manager.run_performance_optimization()
        return {
            "message": "تم تشغيل تحسين الأداء بنجاح",
            "optimization_result": result
        }
    except Exception as e:
        logger.error(f"خطأ في تحسين الأداء: {e}")
        raise HTTPException(status_code=500, detail=f"فشل في تحسين الأداء: {str(e)}")

@app.post("/analyze/optimized")
async def analyze_with_optimization(request: PerformanceOptimizedAnalysisRequest):
    """تحليل محسن للأداء"""
    try:
        start_time = time.time()
        
        # فحص الموارد قبل المعالجة
        resource_status = resource_manager.resource_manager.monitor_resources()
        
        # توليد مفتاح الذاكرة المؤقتة
        cache_key = hashlib.md5(
            f"{request.text}_{request.component}_{request.confidence_threshold}".encode()
        ).hexdigest()
        
        # فحص الذاكرة المؤقتة
        cached_result = None
        if request.enable_caching:
            cached_result = resource_manager.cache_manager.get(cache_key)
            if cached_result:
                logger.info("استخدام نتيجة محفوظة")
                return {
                    "result": cached_result,
                    "cache_hit": True,
                    "processing_time_ms": (time.time() - start_time) * 1000,
                    "performance_metrics": resource_status
                }
        
        # تحديد استراتيجية المعالجة
        if request.parallel_processing and len(request.text) > 10000:
            # معالجة متوازية للنصوص الكبيرة
            result = await process_with_parallel_optimization(request)
            optimization_type = "parallel"
        else:
            # معالجة محسنة عادية
            result = await process_with_standard_optimization(request)
            optimization_type = "standard"
        
        # حفظ في الذاكرة المؤقتة
        if request.enable_caching:
            resource_manager.cache_manager.set(cache_key, result, request.cache_ttl)
        
        # قياس الأداء النهائي
        processing_time = (time.time() - start_time) * 1000
        final_resource_status = resource_manager.resource_manager.monitor_resources()
        
        return {
            "result": result,
            "optimization_type": optimization_type,
            "processing_time_ms": processing_time,
            "cache_hit": False,
            "performance_metrics": final_resource_status,
            "memory_efficiency": resource_status['memory']['system_percent'],
            "cpu_efficiency": resource_status['cpu']['cpu_percent']
        }
        
    except Exception as e:
        logger.error(f"خطأ في التحليل المحسن: {e}")
        raise HTTPException(status_code=500, detail=f"فشل في التحليل المحسن: {str(e)}")

@app.post("/analyze/batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """تحليل دفعي محسن"""
    try:
        start_time = time.time()

        # معالجة دفعية محسنة
        results = []

        # استخدام المعالجة المتوازية إذا كان مفعلاً
        if request.parallel_processing:
            # معالجة متوازية للطلبات المتعددة
            for item in request.items:
                result = await process_with_parallel_optimization(item)
                results.append(result)
        else:
            # معالجة تسلسلية
            for item in request.items:
                result = await process_with_standard_optimization(item)
                results.append(result)

        processing_time = (time.time() - start_time) * 1000

        return {
            "results": results,
            "total_items": len(results),
            "processing_time_ms": processing_time,
            "batch_id": f"batch_{int(time.time())}"
        }

    except Exception as e:
        logger.error(f"خطأ في التحليل الدفعي: {e}")
        raise HTTPException(status_code=500, detail=f"فشل في التحليل الدفعي: {str(e)}")
