#!/usr/bin/env python3
"""
خدمة Python المتقدمة للتكامل مع نظام Multi-Agent للتفريغ السينمائي
FastAPI Brain Service مع معالجة غير متزامنة ومتقدمة

المتطلبات: 12.1-12.5, 13.1-13.5
"""

import asyncio
import logging
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import json

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# استيراد الأنظمة الموجودة
try:
    from revolutionary_breakdown_engine import RevolutionaryBreakdownEngine
    from ultimate_breakdown_system import UltimateBreakdownSystem
except ImportError as e:
    logging.warning(f"تعذر استيراد الأنظمة الموجودة: {e}")
    RevolutionaryBreakdownEngine = None
    UltimateBreakdownSystem = None

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# إنشاء تطبيق FastAPI
app = FastAPI(
    title="Advanced Python Brain Service",
    description="خدمة Python متقدمة للتكامل مع نظام Multi-Agent للتفريغ السينمائي",
    version="1.0.0"
)

# إضافة CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# تعريف النماذج والتعدادات
class JobStatus(str, Enum):
    """حالات المعالجة"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ProcessingType(str, Enum):
    """أنواع المعالجة المتاحة"""
    SCENE_SALIENCE = "scene_salience"
    CONTINUITY_CHECK = "continuity_check"
    REVOLUTIONARY_BREAKDOWN = "revolutionary_breakdown"
    ULTIMATE_BREAKDOWN = "ultimate_breakdown"
    FULL_ANALYSIS = "full_analysis"

class JobRequest(BaseModel):
    """طلب معالجة جديد"""
    processing_type: ProcessingType
    script_content: str = Field(..., description="محتوى السيناريو")
    options: Dict[str, Any] = Field(default_factory=dict, description="خيارات إضافية")
    priority: int = Field(default=1, ge=1, le=10, description="أولوية المعالجة (1-10)")

class JobResponse(BaseModel):
    """استجابة طلب المعالجة"""
    job_id: str
    status: JobStatus
    processing_type: ProcessingType
    created_at: datetime
    estimated_completion: Optional[datetime] = None
    progress: float = Field(default=0.0, ge=0.0, le=100.0)

class JobResult(BaseModel):
    """نتيجة المعالجة"""
    job_id: str
    status: JobStatus
    processing_type: ProcessingType
    created_at: datetime
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None

class SceneSalienceRequest(BaseModel):
    """طلب تحليل أهمية المشاهد"""
    scenes: List[Dict[str, Any]]
    criteria: Dict[str, float] = Field(default_factory=dict)

class ContinuityCheckRequest(BaseModel):
    """طلب فحص الاستمرارية"""
    script_content: str
    check_characters: bool = True
    check_locations: bool = True
    check_props: bool = True
    check_timeline: bool = True
# نظام إدارة المهام
class JobManager:
    """مدير المهام مع معالجة غير متزامنة"""
    
    def __init__(self):
        self.jobs: Dict[str, JobResult] = {}
        self.processing_queue: asyncio.Queue = asyncio.Queue()
        self.active_jobs: Dict[str, asyncio.Task] = {}
        self.max_concurrent_jobs = 5
        
    def create_job(self, request: JobRequest) -> str:
        """إنشاء مهمة جديدة"""
        job_id = str(uuid.uuid4())
        
        job_result = JobResult(
            job_id=job_id,
            status=JobStatus.PENDING,
            processing_type=request.processing_type,
            created_at=datetime.now()
        )
        
        self.jobs[job_id] = job_result
        logger.info(f"تم إنشاء مهمة جديدة: {job_id} - {request.processing_type}")
        
        return job_id
    
    def get_job(self, job_id: str) -> Optional[JobResult]:
        """الحصول على معلومات المهمة"""
        return self.jobs.get(job_id)
    
    def get_all_jobs(self) -> List[JobResult]:
        """الحصول على جميع المهام"""
        return list(self.jobs.values())
    
    async def cancel_job(self, job_id: str) -> bool:
        """إلغاء مهمة"""
        if job_id in self.active_jobs:
            task = self.active_jobs[job_id]
            task.cancel()
            del self.active_jobs[job_id]
            
            if job_id in self.jobs:
                self.jobs[job_id].status = JobStatus.CANCELLED
                logger.info(f"تم إلغاء المهمة: {job_id}")
                return True
        
        return False
    
    def update_job_progress(self, job_id: str, progress: float, status: JobStatus = None):
        """تحديث تقدم المهمة"""
        if job_id in self.jobs:
            if status:
                self.jobs[job_id].status = status
            # تحديث التقدم سيتم إضافته في النسخة المحدثة من JobResult

# إنشاء مدير المهام العام
job_manager = JobManager()
# خدمات المعالجة المتخصصة
class SceneSalienceService:
    """خدمة تحليل أهمية المشاهد"""
    
    @staticmethod
    async def analyze_scene_importance(scenes: List[Dict[str, Any]], 
                                     criteria: Dict[str, float] = None) -> Dict[str, Any]:
        """تحليل أهمية المشاهد بناءً على معايير محددة"""
        if criteria is None:
            criteria = {
                "character_development": 0.3,
                "plot_advancement": 0.4,
                "emotional_impact": 0.2,
                "visual_complexity": 0.1
            }
        
        results = []
        
        for i, scene in enumerate(scenes):
            # محاكاة تحليل متقدم للمشهد
            await asyncio.sleep(0.1)  # محاكاة معالجة
            
            scene_analysis = {
                "scene_index": i,
                "scene_id": scene.get("id", f"scene_{i}"),
                "importance_score": 0.0,
                "breakdown": {},
                "recommendations": []
            }
            
            # تحليل تطوير الشخصيات
            char_score = len(scene.get("characters", [])) * 0.1
            scene_analysis["breakdown"]["character_development"] = min(char_score, 1.0)
            
            # تحليل تقدم الحبكة
            plot_indicators = ["conflict", "resolution", "twist", "revelation"]
            plot_score = sum(1 for indicator in plot_indicators 
                           if indicator in scene.get("content", "").lower()) * 0.25
            scene_analysis["breakdown"]["plot_advancement"] = min(plot_score, 1.0)
            
            # تحليل التأثير العاطفي
            emotional_keywords = ["love", "fear", "anger", "joy", "sadness", "surprise"]
            emotional_score = sum(1 for keyword in emotional_keywords 
                                if keyword in scene.get("content", "").lower()) * 0.15
            scene_analysis["breakdown"]["emotional_impact"] = min(emotional_score, 1.0)
            
            # تحليل التعقيد البصري
            visual_elements = scene.get("visual_elements", [])
            visual_score = len(visual_elements) * 0.1
            scene_analysis["breakdown"]["visual_complexity"] = min(visual_score, 1.0)
            
            # حساب النتيجة الإجمالية
            total_score = sum(
                scene_analysis["breakdown"][key] * criteria[key]
                for key in criteria.keys()
                if key in scene_analysis["breakdown"]
            )
            
            scene_analysis["importance_score"] = round(total_score, 3)
            
            # إضافة توصيات
            if total_score > 0.8:
                scene_analysis["recommendations"].append("مشهد عالي الأهمية - يتطلب اهتماماً خاصاً")
            elif total_score < 0.3:
                scene_analysis["recommendations"].append("مشهد منخفض الأهمية - قابل للاختصار")
            
            results.append(scene_analysis)
        
        return {
            "total_scenes": len(scenes),
            "analysis_criteria": criteria,
            "scene_analyses": results,
            "summary": {
                "high_importance_scenes": len([s for s in results if s["importance_score"] > 0.7]),
                "medium_importance_scenes": len([s for s in results if 0.3 <= s["importance_score"] <= 0.7]),
                "low_importance_scenes": len([s for s in results if s["importance_score"] < 0.3]),
                "average_importance": sum(s["importance_score"] for s in results) / len(results)
            }
        }
class ContinuityCheckService:
    """خدمة فحص الاستمرارية"""
    
    @staticmethod
    async def check_script_continuity(script_content: str,
                                    check_characters: bool = True,
                                    check_locations: bool = True,
                                    check_props: bool = True,
                                    check_timeline: bool = True) -> Dict[str, Any]:
        """فحص الاستمرارية في السيناريو"""
        
        issues = []
        warnings = []
        
        # محاكاة فحص الشخصيات
        if check_characters:
            await asyncio.sleep(0.2)
            # فحص تناسق أسماء الشخصيات
            character_issues = await ContinuityCheckService._check_character_consistency(script_content)
            issues.extend(character_issues)
        
        # محاكاة فحص المواقع
        if check_locations:
            await asyncio.sleep(0.2)
            location_issues = await ContinuityCheckService._check_location_consistency(script_content)
            issues.extend(location_issues)
        
        # محاكاة فحص الأدوات والدعائم
        if check_props:
            await asyncio.sleep(0.1)
            prop_issues = await ContinuityCheckService._check_prop_consistency(script_content)
            issues.extend(prop_issues)
        
        # محاكاة فحص الجدول الزمني
        if check_timeline:
            await asyncio.sleep(0.3)
            timeline_issues = await ContinuityCheckService._check_timeline_consistency(script_content)
            issues.extend(timeline_issues)
        
        return {
            "total_issues": len(issues),
            "total_warnings": len(warnings),
            "issues": issues,
            "warnings": warnings,
            "continuity_score": max(0, 100 - len(issues) * 5 - len(warnings) * 2),
            "checks_performed": {
                "characters": check_characters,
                "locations": check_locations,
                "props": check_props,
                "timeline": check_timeline
            }
        }
    
    @staticmethod
    async def _check_character_consistency(script_content: str) -> List[Dict[str, Any]]:
        """فحص تناسق الشخصيات"""
        issues = []
        
        # محاكاة اكتشاف مشاكل الشخصيات
        if "JOHN" in script_content and "John" in script_content:
            issues.append({
                "type": "character_name_inconsistency",
                "severity": "medium",
                "description": "تناقض في كتابة اسم الشخصية: JOHN vs John",
                "suggestion": "توحيد كتابة أسماء الشخصيات"
            })
        
        return issues
    
    @staticmethod
    async def _check_location_consistency(script_content: str) -> List[Dict[str, Any]]:
        """فحص تناسق المواقع"""
        issues = []
        
        # محاكاة اكتشاف مشاكل المواقع
        if "INT." in script_content and "EXT." in script_content:
            # فحص منطقي للانتقالات
            pass
        
        return issues
    
    @staticmethod
    async def _check_prop_consistency(script_content: str) -> List[Dict[str, Any]]:
        """فحص تناسق الأدوات والدعائم"""
        issues = []
        return issues
    
    @staticmethod
    async def _check_timeline_consistency(script_content: str) -> List[Dict[str, Any]]:
        """فحص تناسق الجدول الزمني"""
        issues = []
        return issues
# معالج المهام الأساسي
class TaskProcessor:
    """معالج المهام مع دعم الأنظمة الموجودة"""
    
    def __init__(self):
        self.revolutionary_engine = None
        self.ultimate_system = None
        
        # تهيئة الأنظمة الموجودة إذا كانت متاحة
        if RevolutionaryBreakdownEngine:
            try:
                self.revolutionary_engine = RevolutionaryBreakdownEngine()
                logger.info("تم تهيئة Revolutionary Breakdown Engine")
            except Exception as e:
                logger.error(f"فشل في تهيئة Revolutionary Engine: {e}")
        
        if UltimateBreakdownSystem:
            try:
                self.ultimate_system = UltimateBreakdownSystem()
                logger.info("تم تهيئة Ultimate Breakdown System")
            except Exception as e:
                logger.error(f"فشل في تهيئة Ultimate System: {e}")
    
    async def process_job(self, job_id: str, request: JobRequest) -> Dict[str, Any]:
        """معالجة المهمة حسب النوع"""
        
        job_manager.update_job_progress(job_id, 10.0, JobStatus.PROCESSING)
        
        try:
            if request.processing_type == ProcessingType.SCENE_SALIENCE:
                result = await self._process_scene_salience(job_id, request)
            
            elif request.processing_type == ProcessingType.CONTINUITY_CHECK:
                result = await self._process_continuity_check(job_id, request)
            
            elif request.processing_type == ProcessingType.REVOLUTIONARY_BREAKDOWN:
                result = await self._process_revolutionary_breakdown(job_id, request)
            
            elif request.processing_type == ProcessingType.ULTIMATE_BREAKDOWN:
                result = await self._process_ultimate_breakdown(job_id, request)
            
            elif request.processing_type == ProcessingType.FULL_ANALYSIS:
                result = await self._process_full_analysis(job_id, request)
            
            else:
                raise ValueError(f"نوع معالجة غير مدعوم: {request.processing_type}")
            
            job_manager.update_job_progress(job_id, 100.0, JobStatus.COMPLETED)
            
            if job_id in job_manager.jobs:
                job_manager.jobs[job_id].result = result
                job_manager.jobs[job_id].completed_at = datetime.now()
            
            return result
            
        except Exception as e:
            logger.error(f"خطأ في معالجة المهمة {job_id}: {e}")
            job_manager.update_job_progress(job_id, 0.0, JobStatus.FAILED)
            
            if job_id in job_manager.jobs:
                job_manager.jobs[job_id].error_message = str(e)
            
            raise
    
    async def _process_scene_salience(self, job_id: str, request: JobRequest) -> Dict[str, Any]:
        """معالجة تحليل أهمية المشاهد"""
        job_manager.update_job_progress(job_id, 30.0)
        
        # استخراج المشاهد من النص
        scenes = await self._extract_scenes_from_script(request.script_content)
        job_manager.update_job_progress(job_id, 60.0)
        
        # تحليل الأهمية
        criteria = request.options.get("criteria", {})
        result = await SceneSalienceService.analyze_scene_importance(scenes, criteria)
        job_manager.update_job_progress(job_id, 90.0)
        
        return result
    
    async def _process_continuity_check(self, job_id: str, request: JobRequest) -> Dict[str, Any]:
        """معالجة فحص الاستمرارية"""
        job_manager.update_job_progress(job_id, 30.0)
        
        options = request.options
        result = await ContinuityCheckService.check_script_continuity(
            request.script_content,
            check_characters=options.get("check_characters", True),
            check_locations=options.get("check_locations", True),
            check_props=options.get("check_props", True),
            check_timeline=options.get("check_timeline", True)
        )
        
        job_manager.update_job_progress(job_id, 90.0)
        return result
    
    async def _extract_scenes_from_script(self, script_content: str) -> List[Dict[str, Any]]:
        """استخراج المشاهد من السيناريو"""
        # محاكاة استخراج المشاهد
        scenes = []
        lines = script_content.split('\n')
        current_scene = None
        
        for i, line in enumerate(lines):
            line = line.strip()
            
            # اكتشاف بداية مشهد جديد
            if line.startswith(('INT.', 'EXT.', 'FADE IN:', 'CUT TO:')):
                if current_scene:
                    scenes.append(current_scene)
                
                current_scene = {
                    "id": f"scene_{len(scenes) + 1}",
                    "header": line,
                    "content": "",
                    "characters": set(),
                    "visual_elements": []
                }
            
            elif current_scene:
                current_scene["content"] += line + "\n"
                
                # استخراج أسماء الشخصيات (الأسماء بالأحرف الكبيرة)
                if line.isupper() and len(line.split()) <= 3:
                    current_scene["characters"].add(line)
        
        # إضافة المشهد الأخير
        if current_scene:
            scenes.append(current_scene)
        
        # تحويل sets إلى lists للتسلسل
        for scene in scenes:
            scene["characters"] = list(scene["characters"])
        
        return scenes
    async def _process_revolutionary_breakdown(self, job_id: str, request: JobRequest) -> Dict[str, Any]:
        """معالجة باستخدام Revolutionary Breakdown Engine"""
        if not self.revolutionary_engine:
            raise HTTPException(status_code=503, detail="Revolutionary Breakdown Engine غير متاح")
        
        job_manager.update_job_progress(job_id, 40.0)
        
        try:
            # استخدام النظام الثوري الموجود
            result = await asyncio.to_thread(
                self.revolutionary_engine.process_script,
                request.script_content,
                **request.options
            )
            job_manager.update_job_progress(job_id, 80.0)
            
            return {
                "engine": "revolutionary",
                "result": result,
                "processing_options": request.options
            }
            
        except Exception as e:
            logger.error(f"خطأ في Revolutionary Engine: {e}")
            raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")
    
    async def _process_ultimate_breakdown(self, job_id: str, request: JobRequest) -> Dict[str, Any]:
        """معالجة باستخدام Ultimate Breakdown System"""
        if not self.ultimate_system:
            raise HTTPException(status_code=503, detail="Ultimate Breakdown System غير متاح")
        
        job_manager.update_job_progress(job_id, 40.0)
        
        try:
            result = await asyncio.to_thread(
                self.ultimate_system.analyze_script,
                request.script_content,
                **request.options
            )
            job_manager.update_job_progress(job_id, 80.0)
            
            return {
                "engine": "ultimate",
                "result": result,
                "processing_options": request.options
            }
            
        except Exception as e:
            logger.error(f"خطأ في Ultimate System: {e}")
            raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")
    
    async def _process_full_analysis(self, job_id: str, request: JobRequest) -> Dict[str, Any]:
        """معالجة شاملة تجمع جميع الأنواع"""
        job_manager.update_job_progress(job_id, 20.0)
        
        results = {}
        
        # تحليل أهمية المشاهد
        try:
            scenes = await self._extract_scenes_from_script(request.script_content)
            scene_analysis = await SceneSalienceService.analyze_scene_importance(scenes)
            results["scene_salience"] = scene_analysis
            job_manager.update_job_progress(job_id, 40.0)
        except Exception as e:
            logger.warning(f"فشل تحليل أهمية المشاهد: {e}")
        
        # فحص الاستمرارية
        try:
            continuity_check = await ContinuityCheckService.check_script_continuity(request.script_content)
            results["continuity_check"] = continuity_check
            job_manager.update_job_progress(job_id, 60.0)
        except Exception as e:
            logger.warning(f"فشل فحص الاستمرارية: {e}")
        
        # التحليل الثوري (إذا كان متاحاً)
        if self.revolutionary_engine:
            try:
                revolutionary_result = await asyncio.to_thread(
                    self.revolutionary_engine.process_script,
                    request.script_content
                )
                results["revolutionary_breakdown"] = revolutionary_result
                job_manager.update_job_progress(job_id, 80.0)
            except Exception as e:
                logger.warning(f"فشل التحليل الثوري: {e}")
        
        # النظام النهائي (إذا كان متاحاً)
        if self.ultimate_system:
            try:
                ultimate_result = await asyncio.to_thread(
                    self.ultimate_system.analyze_script,
                    request.script_content
                )
                results["ultimate_breakdown"] = ultimate_result
                job_manager.update_job_progress(job_id, 90.0)
            except Exception as e:
                logger.warning(f"فشل النظام النهائي: {e}")
        
        return {
            "analysis_type": "full_analysis",
            "components": list(results.keys()),
            "results": results,
            "summary": {
                "total_components": len(results),
                "successful_analyses": len([r for r in results.values() if r is not None])
            }
        }

# إنشاء معالج المهام العام
task_processor = TaskProcessor()
# API Endpoints
@app.get("/", response_model=Dict[str, Any])
async def root():
    """نقطة البداية - معلومات الخدمة"""
    return {
        "service": "Advanced Python Brain Service",
        "version": "1.0.0",
        "description": "خدمة Python متقدمة للتكامل مع نظام Multi-Agent للتفريغ السينمائي",
        "status": "active",
        "available_engines": {
            "revolutionary_engine": task_processor.revolutionary_engine is not None,
            "ultimate_system": task_processor.ultimate_system is not None
        },
        "endpoints": [
            "/jobs/submit",
            "/jobs/{job_id}",
            "/jobs",
            "/jobs/{job_id}/cancel",
            "/health",
            "/scene-salience",
            "/continuity-check"
        ]
    }

@app.get("/health")
async def health_check():
    """فحص صحة الخدمة"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_jobs": len(job_manager.active_jobs),
        "total_jobs": len(job_manager.jobs),
        "engines_status": {
            "revolutionary_engine": "available" if task_processor.revolutionary_engine else "unavailable",
            "ultimate_system": "available" if task_processor.ultimate_system else "unavailable"
        }
    }

@app.post("/jobs/submit", response_model=JobResponse)
async def submit_job(request: JobRequest, background_tasks: BackgroundTasks):
    """إرسال مهمة جديدة للمعالجة"""
    
    # إنشاء المهمة
    job_id = job_manager.create_job(request)
    
    # إضافة المهمة للمعالجة في الخلفية
    background_tasks.add_task(process_job_background, job_id, request)
    
    # إنشاء الاستجابة
    job_response = JobResponse(
        job_id=job_id,
        status=JobStatus.PENDING,
        processing_type=request.processing_type,
        created_at=datetime.now(),
        progress=0.0
    )
    
    return job_response

async def process_job_background(job_id: str, request: JobRequest):
    """معالجة المهمة في الخلفية"""
    try:
        start_time = datetime.now()
        
        # معالجة المهمة
        result = await task_processor.process_job(job_id, request)
        
        # حساب وقت المعالجة
        processing_time = (datetime.now() - start_time).total_seconds()
        
        if job_id in job_manager.jobs:
            job_manager.jobs[job_id].processing_time_seconds = processing_time
        
        logger.info(f"تمت معالجة المهمة {job_id} بنجاح في {processing_time:.2f} ثانية")
        
    except Exception as e:
        logger.error(f"فشل في معالجة المهمة {job_id}: {e}")

@app.get("/jobs/{job_id}", response_model=JobResult)
async def get_job(job_id: str):
    """الحصول على معلومات مهمة محددة"""
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة")
    
    return job

@app.get("/jobs", response_model=List[JobResult])
async def get_all_jobs(status: Optional[JobStatus] = None, limit: int = 100):
    """الحصول على جميع المهام مع إمكانية التصفية"""
    jobs = job_manager.get_all_jobs()
    
    if status:
        jobs = [job for job in jobs if job.status == status]
    
    # ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
    jobs.sort(key=lambda x: x.created_at, reverse=True)
    
    return jobs[:limit]

@app.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """إلغاء مهمة"""
    success = await job_manager.cancel_job(job_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="المهمة غير موجودة أو لا يمكن إلغاؤها")
    
    return {"message": f"تم إلغاء المهمة {job_id} بنجاح"}
# Endpoints متخصصة
@app.post("/scene-salience")
async def analyze_scene_salience(request: SceneSalienceRequest):
    """تحليل أهمية المشاهد مباشرة"""
    try:
        result = await SceneSalienceService.analyze_scene_importance(
            request.scenes, 
            request.criteria
        )
        return result
    except Exception as e:
        logger.error(f"خطأ في تحليل أهمية المشاهد: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/continuity-check")
async def check_continuity(request: ContinuityCheckRequest):
    """فحص الاستمرارية مباشرة"""
    try:
        result = await ContinuityCheckService.check_script_continuity(
            request.script_content,
            request.check_characters,
            request.check_locations,
            request.check_props,
            request.check_timeline
        )
        return result
    except Exception as e:
        logger.error(f"خطأ في فحص الاستمرارية: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-script")
async def upload_script_file(
    file: UploadFile = File(...),
    processing_type: ProcessingType = ProcessingType.FULL_ANALYSIS,
    background_tasks: BackgroundTasks = None
):
    """تحميل ملف سيناريو ومعالجته"""
    
    # التحقق من نوع الملف
    allowed_types = ["text/plain", "application/pdf", "text/x-fountain"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"نوع ملف غير مدعوم. الأنواع المدعومة: {allowed_types}"
        )
    
    try:
        # قراءة محتوى الملف
        content = await file.read()
        
        if file.content_type == "application/pdf":
            # معالجة PDF (محاكاة)
            script_content = f"محتوى PDF مستخرج من {file.filename}"
        else:
            script_content = content.decode('utf-8')
        
        # إنشاء طلب معالجة
        job_request = JobRequest(
            processing_type=processing_type,
            script_content=script_content,
            options={"source_file": file.filename}
        )
        
        # إرسال للمعالجة
        job_id = job_manager.create_job(job_request)
        
        if background_tasks:
            background_tasks.add_task(process_job_background, job_id, job_request)
        
        return {
            "message": "تم تحميل الملف بنجاح",
            "filename": file.filename,
            "job_id": job_id,
            "processing_type": processing_type,
            "file_size": len(content)
        }
        
    except Exception as e:
        logger.error(f"خطأ في تحميل الملف: {e}")
        raise HTTPException(status_code=500, detail=f"فشل في معالجة الملف: {str(e)}")

# معالج الأخطاء العام
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """معالج الأخطاء العام"""
    logger.error(f"خطأ غير متوقع: {exc}")
    return {
        "error": "خطأ داخلي في الخادم",
        "detail": str(exc),
        "timestamp": datetime.now().isoformat()
    }

# تشغيل الخدمة
if __name__ == "__main__":
    logger.info("بدء تشغيل Advanced Python Brain Service...")
    
    uvicorn.run(
        "advanced_python_brain_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )