#!/usr/bin/env python3
"""
خدمة Python المتقدمة المحسنة للأداء - التفريغ السينمائي
Performance Optimized Python Brain Service for Cinematic Breakdown

يدعم المعالجة المتوازية والتحسينات المتقدمة للأداء
Requirements: 6.1-6.5, 10.1-10.5, 12.1
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union, Callable
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
import functools
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
import gc
import sys
import resource

# إعداد التسجيل المحسن
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════
# نماذج البيانات المحسنة
# ═══════════════════════════════════════════════════════════════════════════

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

class PerformanceOptimizedAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500000)
    component: ProcessingComponent
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    scene_id: Optional[str] = None
    confidence_threshold: float = Field(0.7, ge=0, le=1)
    priority: Priority = Field(Priority.NORMAL)
    
    # معاملات الأداء المتقدم
    parallel_processing: bool = Field(True, description="تفعيل المعالجة المتوازية")
    chunk_size: int = Field(50, ge=10, le=200, description="حجم قطعة النص للمعالجة")
    max_workers: int = Field(mp.cpu_count(), ge=1, le=32, description="عدد العمال المتوازيين")
    memory_limit_mb: int = Field(1024, ge=256, le=8192, description="حد الذاكرة بالميجابايت")
    enable_caching: bool = Field(True, description="تفعيل الذاكرة المؤقتة")
    cache_ttl: int = Field(3600, ge=300, le=86400, description="مدة صلاحية الذاكرة المؤقتة")
    batch_mode: bool = Field(False, description="وضع المعالجة الدفعية")
    fallback_enabled: bool = Field(True, description="تفعيل آليات الاستعادة")
    performance_mode: str = Field("balanced", description="وضع الأداء: fast, balanced, accurate")

class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    component: ProcessingComponent
    created_at: datetime
    estimated_completion: Optional[datetime] = None
    queue_position: Optional[int] = None
    priority: Priority
    processing_mode: str
    performance_metrics: Optional[Dict[str, Any]] = None

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

class PerformanceMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    memory_available: float
    active_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int
    average_processing_time: float
    queue_length: int
    uptime_seconds: float
    throughput_jobs_per_minute: float
    cache_hit_rate: float
    parallel_efficiency: float
    memory_efficiency: float
    timestamp: datetime

class LoadTestResult(BaseModel):
    test_name: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    min_response_time: float
    max_response_time: float
    throughput_rps: float
    memory_peak_usage: float
    cpu_peak_usage: float
    error_rate: float
    timestamp: datetime

# ═══════════════════════════════════════════════════════════════════════════
# نظام الذاكرة المؤقتة المحسن
# ═══════════════════════════════════════════════════════════════════════════

class AdvancedCacheManager:
    def __init__(self, max_size_mb: int = 512, default_ttl: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.access_times: Dict[str, datetime] = {}
        self.cache_size_bytes = 0
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.default_ttl = default_ttl
        self.lock = Lock()
        self.hits = 0
        self.misses = 0
        
    def _calculate_size(self, data: Any) -> int:
        """حساب حجم البيانات بالبايت"""
        try:
            return len(json.dumps(data, default=str).encode('utf-8'))
        except:
            return sys.getsizeof(data)
    
    def _is_expired(self, key: str) -> bool:
        """فحص انتهاء صلاحية البيانات"""
        if key not in self.cache:
            return True
        
        cached_time = self.access_times.get(key)
        if not cached_time:
            return True
            
        ttl = self.cache[key].get('ttl', self.default_ttl)
        return (datetime.now() - cached_time).total_seconds() > ttl
    
    def _evict_lru(self):
        """إزالة أقل البيانات استخداماً"""
        if not self.cache:
            return
        
        # ترتيب حسب وقت آخر وصول
        sorted_keys = sorted(
            self.access_times.keys(),
            key=lambda k: self.access_times[k]
        )
        
        # إزالة 25% من البيانات
        evict_count = max(1, len(sorted_keys) // 4)
        for key in sorted_keys[:evict_count]:
            if key in self.cache:
                size = self.cache[key]['size']
                del self.cache[key]
                del self.access_times[key]
                self.cache_size_bytes -= size
    
    def get(self, key: str) -> Optional[Any]:
        """الحصول على البيانات من الذاكرة المؤقتة"""
        with self.lock:
            if self._is_expired(key):
                if key in self.cache:
                    del self.cache[key]
                    del self.access_times[key]
                self.misses += 1
                return None
            
            if key in self.cache:
                self.access_times[key] = datetime.now()
                self.hits += 1
                return self.cache[key]['data']
            
            self.misses += 1
            return None
    
    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> bool:
        """حفظ البيانات في الذاكرة المؤقتة"""
        with self.lock:
            size = self._calculate_size(data)
            ttl = ttl or self.default_ttl
            
            # إذا كان الحجم كبير جداً، لا نحفظ
            if size > self.max_size_bytes // 4:
                return False
            
            # تنظيف الذاكرة إذا كانت ممتلئة
            while self.cache_size_bytes + size > self.max_size_bytes and self.cache:
                self._evict_lru()
            
            # حفظ البيانات
            self.cache[key] = {
                'data': data,
                'size': size,
                'ttl': ttl,
                'created': datetime.now()
            }
            self.access_times[key] = datetime.now()
            self.cache_size_bytes += size
            
            return True
    
    def clear(self):
        """مسح الذاكرة المؤقتة"""
        with self.lock:
            self.cache.clear()
            self.access_times.clear()
            self.cache_size_bytes = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الذاكرة المؤقتة"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': hit_rate,
            'total_entries': len(self.cache),
            'size_mb': self.cache_size_bytes / (1024 * 1024),
            'max_size_mb': self.max_size_bytes / (1024 * 1024)
        }

# ═══════════════════════════════════════════════════════════════════════════
# نظام إدارة الموارد المتقدم
# ═══════════════════════════════════════════════════════════════════════════

class ResourceManager:
    def __init__(self, memory_limit_mb: int = 1024):
        self.memory_limit_bytes = memory_limit_mb * 1024 * 1024
        self.cpu_count = mp.cpu_count()
        self.active_processes = 0
        self.max_processes = min(self.cpu_count * 2, 32)
        self.lock = Lock()
        
    def check_memory_usage(self) -> Dict[str, float]:
        """فحص استخدام الذاكرة"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()
            
            system_memory = psutil.virtual_memory()
            
            return {
                'process_rss_mb': memory_info.rss / (1024 * 1024),
                'process_vms_mb': memory_info.vms / (1024 * 1024),
                'process_percent': memory_percent,
                'system_total_gb': system_memory.total / (1024**3),
                'system_available_gb': system_memory.available / (1024**3),
                'system_percent': system_memory.percent
            }
        except Exception as e:
            logger.error(f"خطأ في فحص الذاكرة: {e}")
            return {}
    
    def check_cpu_usage(self) -> Dict[str, float]:
        """فحص استخدام المعالج"""
        try:
            return {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'cpu_count': psutil.cpu_count(),
                'load_average': psutil.getloadavg()[0] if hasattr(psutil, 'getloadavg') else 0.0
            }
        except Exception as e:
            logger.error(f"خطأ في فحص المعالج: {e}")
            return {}
    
    def can_allocate_memory(self, estimated_size_mb: float) -> bool:
        """فحص إمكانية تخصيص ذاكرة"""
        memory_info = self.check_memory_usage()
        if not memory_info:
            return True
        
        current_usage = memory_info.get('process_rss_mb', 0)
        available = memory_info.get('system_available_gb', 0) * 1024
        
        return (current_usage + estimated_size_mb) < self.memory_limit_bytes / (1024 * 1024) and available > estimated_size_mb
    
    def get_optimal_worker_count(self, task_complexity: str = "normal") -> int:
        """الحصول على العدد الأمثل للعمال"""
        base_count = self.cpu_count
        
        if task_complexity == "high":
            return max(1, base_count // 2)
        elif task_complexity == "low":
            return min(base_count, 8)
        else:
            return min(base_count, 16)
    
    def monitor_resources(self) -> Dict[str, Any]:
        """مراقبة شاملة للموارد"""
        memory_info = self.check_memory_usage()
        cpu_info = self.check_cpu_usage()
        
        return {
            'memory': memory_info,
            'cpu': cpu_info,
            'timestamp': datetime.now().isoformat(),
            'can_allocate_more': self.can_allocate_memory(100)  # افتراض 100MB
        }

# ═══════════════════════════════════════════════════════════════════════════
# نظام المعالجة المتوازية المحسن
# ═══════════════════════════════════════════════════════════════════════════

class ParallelProcessor:
    def __init__(self, max_workers: int = None, chunk_size: int = 50):
        self.max_workers = max_workers or mp.cpu_count()
        self.chunk_size = chunk_size
        self.thread_pool = ThreadPoolExecutor(max_workers=self.max_workers)
        self.process_pool = ProcessPoolExecutor(max_workers=self.max_workers)
        self.active_tasks = set()
        self.completed_tasks = 0
        self.failed_tasks = 0
        self.lock = Lock()
        
    def _split_text_into_chunks(self, text: str, chunk_size: int) -> List[str]:
        """تقسيم النص إلى قطع للمعالجة المتوازية"""
        lines = text.split('\n')
        chunks = []
        current_chunk = []
        current_size = 0
        
        for line in lines:
            line_size = len(line.encode('utf-8'))
            
            if current_size + line_size > chunk_size * 1024 and current_chunk:
                chunks.append('\n'.join(current_chunk))
                current_chunk = [line]
                current_size = line_size
            else:
                current_chunk.append(line)
                current_size += line_size
        
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
        
        return chunks
    
    def _process_chunk(self, chunk: str, processor_func: Callable, *args) -> Dict[str, Any]:
        """معالجة قطعة واحدة من النص"""
        try:
            start_time = time.time()
            result = processor_func(chunk, *args)
            processing_time = (time.time() - start_time) * 1000
            
            return {
                'success': True,
                'result': result,
                'processing_time_ms': processing_time,
                'chunk_size': len(chunk)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processing_time_ms': (time.time() - start_time) * 1000 if 'start_time' in locals() else 0
            }
    
    async def process_parallel(self, text: str, processor_func: Callable, 
                             use_multiprocessing: bool = False, *args) -> Dict[str, Any]:
        """معالجة متوازية للنص"""
        start_time = time.time()
        
        # تقسيم النص إلى قطع
        chunks = self._split_text_into_chunks(text, self.chunk_size)
        total_chunks = len(chunks)
        
        if total_chunks == 1:
            # إذا كان هناك قطعة واحدة فقط، لا نحتاج للمعالجة المتوازية
            result = processor_func(text, *args)
            return {
                'result': result,
                'processing_time_ms': (time.time() - start_time) * 1000,
                'chunks_processed': 1,
                'total_chunks': 1,
                'parallel_efficiency': 1.0
            }
        
        # إعداد المهام المتوازية
        if use_multiprocessing:
            executor = self.process_pool
            method_name = 'submit'
        else:
            executor = self.thread_pool
            method_name = 'submit'
        
        # إرسال المهام
        futures = []
        with self.lock:
            for i, chunk in enumerate(chunks):
                future = executor.submit(self._process_chunk, chunk, processor_func, *args)
                futures.append((i, future))
                self.active_tasks.add(future)
        
        # جمع النتائج
        results = [None] * total_chunks
        successful_chunks = 0
        total_processing_time = 0
        
        for chunk_index, future in futures:
            try:
                result = future.result(timeout=300)  # 5 دقائق timeout
                results[chunk_index] = result
                
                if result['success']:
                    successful_chunks += 1
                    total_processing_time += result['processing_time_ms']
