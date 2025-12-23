#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
خدمة Python المتقدمة للتكامل مع نظام Multi-Agent
Python Brain Service for Three-Read Breakdown System

تدمج مع الأنظمة الموجودة:
- Revolutionary Breakdown Engine
- Ultimate Breakdown System

وتوفر واجهة FastAPI للتكامل مع TypeScript
"""

import asyncio
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Literal
from enum import Enum
from dataclasses import dataclass, asdict
import json
import traceback

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# استيراد الأنظمة الموجودة
try:
    from revolutionary_breakdown_engine import (
        MasterRevolutionarySystem,
        AdvancedSceneData
    )
    REVOLUTIONARY_AVAILABLE = True
except ImportError:
    REVOLUTIONARY_AVAILABLE = False
    logging.warning("Revolutionary Breakdown Engine غير متاح")

try:
    from ultimate_breakdown_system import (
        RevolutionarySceneParser,
        DetailedBreakdown,
        split_scenes
    )
    ULTIMATE_AVAILABLE = True
except ImportError:
    ULTIMATE_AVAILABLE = False
    logging.warning("Ultimate Breakdown System غير متاح")

# ═══════════════════════════════════════════════════════════════════════════
# إعداد التسجيل
# ═══════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("PythonBrainService")

# ═══════════════════════════════════════════════════════════════════════════
# نماذج البيانات (Data Models)
# ═══════════════════════════════════════════════════════════════════════════

class ProcessingComponent(str, Enum):
    SEMANTIC_SYNOPSIS = "semantic_synopsis"
    PROP_CLASSIFICATION = "prop_classification" 
    WARDROBE_INFERENCE = "wardrobe_inference"
    CINEMATIC_PATTERNS = "cinematic_patterns"
    SCENE_SALIENCE = "scene_salience"
    CONTINUITY_CHECK = "continuity_check"
    REVOLUTIONARY_ANALYSIS = "revolutionary_analysis"
    ULTIMATE_BREAKDOWN = "ultimate_breakdown"

class AdvancedAnalysisRequest(BaseModel):
    text: str = Field(..., description="النص المراد تحليله")
    component: ProcessingComponent = Field(..., description="المكون المطلوب للمعالجة")
    context: Optional[Dict[str, Any]] = Field(None, description="السياق الإضافي")
    scene_id: Optional[str] = Field(None, description="معرف المشهد")
    confidence_threshold: float = Field(0.7, description="حد الثقة المطلوب")

class Evidence(BaseModel):
    span_start: int
    span_end: int
    text_excerpt: str
    rationale: str
    confidence: float

class AdvancedAnalysisResponse(BaseModel):
    job_id: str
    result: Dict[str, Any]
    evidence: List[Evidence]
    confidence: float
    processing_time: float
    component_version: str
    metadata: Dict[str, Any]

class JobStatus(BaseModel):
    job_id: str
    status: Literal["pending", "processing", "completed", "failed"]
    progress: float
    result: Optional[AdvancedAnalysisResponse] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# ═══════════════════════════════════════════════════════════════════════════
# مدير الوظائف (Job Manager)
# ═══════════════════════════════════════════════════════════════════════════

class JobManager:
    def __init__(self):
        self.jobs: Dict[str, JobStatus] = {}
        self.max_jobs = 100  # حد أقصى للوظائف المحفوظة
    
    def create_job(self) -> str:
        job_id = str(uuid.uuid4())
        now = datetime.now()
        
        self.jobs[job_id] = JobStatus(
            job_id=job_id,
            status="pending",
            progress=0.0,
            created_at=now,
            updated_at=now
        )
        
        # تنظيف الوظائف القديمة
        self._cleanup_old_jobs()
        
        return job_id
    
    def update_job(self, job_id: str, **kwargs):
        if job_id in self.jobs:
            job = self.jobs[job_id]
            for key, value in kwargs.items():
                if hasattr(job, key):
                    setattr(job, key, value)
            job.updated_at = datetime.now()
    
    def get_job(self, job_id: str) -> Optional[JobStatus]:
        return self.jobs.get(job_id)
    
    def _cleanup_old_jobs(self):
        if len(self.jobs) > self.max_jobs:
            # حذف أقدم الوظائف
            sorted_jobs = sorted(
                self.jobs.items(),
                key=lambda x: x[1].created_at
            )
            
            for job_id, _ in sorted_jobs[:len(self.jobs) - self.max_jobs]:
                del self.jobs[job_id]

# ═══════════════════════════════════════════════════════════════════════════
# معالجات المكونات (Component Processors)
# ═══════════════════════════════════════════════════════════════════════════

class ComponentProcessor:
    """معالج أساسي للمكونات"""
    
    def __init__(self):
        self.revolutionary_system = None
        self.ultimate_parser = None
        
        # تهيئة الأنظمة المتاحة
        if REVOLUTIONARY_AVAILABLE:
            try:
                self.revolutionary_system = MasterRevolutionarySystem()
                logger.info("✅ تم تهيئة Revolutionary System")
            except Exception as e:
                logger.error(f"❌ فشل تهيئة Revolutionary System: {e}")
        
        if ULTIMATE_AVAILABLE:
            try:
                self.ultimate_parser = RevolutionarySceneParser()
                logger.info("✅ تم تهيئة Ultimate Parser")
            except Exception as e:
                logger.error(f"❌ فشل تهيئة Ultimate Parser: {e}")
    
    async def process_semantic_synopsis(self, request: AdvancedAnalysisRequest) -> Dict[str, Any]:
        """توليد ملخص دلالي للنص"""
        try:
            # استخدام Ultimate System إذا كان متاحاً
            if self.ultimate_parser:
                scenes_data = split_scenes(request.text)
                if scenes_data:
                    scene_num, scene_text = scenes_data[0]  # أول مشهد
                    breakdown = await self.ultimate_parser.analyze_scene(scene_text, scene_num)
                    
                    return {
                        "synopsis": breakdown.summary,
                        "scene_type": str(breakdown.scene_type),
                        "characters": breakdown.cast,
                        "location": breakdown.location,
                        "time": breakdown.day_night,
                        "source": "ultimate_system"
                    }
            
            # Fallback: تحليل بسيط
            return await self._fallback_synopsis(request.text)
            
        except Exception as e:
            logger.error(f"خطأ في توليد الملخص الدلالي: {e}")
            return await self._fallback_synopsis(request.text)
    
    async def process_prop_classification(self, request: AdvancedAnalysisRequest) -> Dict[str, Any]:
        """تصنيف الدعائم والعناصر"""
        try:
            if self.ultimate_parser:
                scenes_data = split_scenes(request.text)
                if scenes_data:
                    scene_num, scene_text = scenes_data[0]
                    breakdown = await self.ultimate_parser.analyze_scene(scene_text, scene_num)
                    
                    return {
                        "props": breakdown.props_list,
                        "props_html": breakdown.props_html,
                        "set_dressing": breakdown.set_dressing_html,
                        "vehicles": breakdown.vehicles,
                        "classification_method": "ultimate_system",
                        "confidence": 0.85
                    }
            
            return await self._fallback_prop_classification(request.text)
            
        except Exception as e:
            logger.error(f"خطأ في تصنيف الدعائم: {e}")
            return await self._fallback_prop_classification(request.text)
    
    async def process_wardrobe_inference(self, request: AdvancedAnalysisRequest) -> Dict[str, Any]:
        """استنتاج الأزياء"""
        try:
            if self.ultimate_parser:
                scenes_data = split_scenes(request.text)
                if scenes_data:
                    scene_num, scene_text = scenes_data[0]
                    breakdown = await self.ultimate_parser.analyze_scene(scene_text, scene_num)
                    
                    wardrobe_items = []
                    for spec in breakdown.wardrobe_specs:
                        wardrobe_items.append({
                            "character": spec.character,
                            "description": spec.description,
                            "is_inferred": spec.is_inferred,
                            "continuity_note": spec.continuity_note
                        })
                    
                    return {
                        "wardrobe_specs": wardrobe_items,
                        "costumes_html": breakdown.costumes_html,
                        "makeup_html": breakdown.makeup_html,
                        "inference_method": "ultimate_system"
                    }
            
            return await self._fallback_wardrobe_inference(request.text)
            
        except Exception as e:
            logger.error(f"خطأ في استنتاج الأزياء: {e}")
            return await self._fallback_wardrobe_inference(request.text)
    
    async def process_cinematic_patterns(self, request: AdvancedAnalysisRequest) -> Dict[str, Any]:
        """تحليل الأنماط السينمائية"""
        try:
            if self.ultimate_parser:
                scenes_data = split_scenes(request.text)
                if scenes_data:
                    scene_num, scene_text = scenes_data[0]
                    breakdown = await self.ultimate_parser.analyze_scene(scene_text, scene_num)
                    
                    return {
                        "cinematic_notes": breakdown.cinematic_notes,
                        "camera_lighting": breakdown.camera_lighting,
                        "production_notes": breakdown.production_notes_html,
                        "scene_type": str(breakdown.scene_type),
                        "analysis_method": "ultimate_system"
                    }
            
            return await self._fallback_cinematic_analysis(request.text)
            
        except Exception as e:
            logger.error(f"خطأ في تحليل الأنماط السينمائية: {e}")
            return await self._fallback_cinematic_analysis(request.text)
    
    async def process_continuity_check(self, request: AdvancedAnalysisRequest) -> Dict[str, Any]:
        """فحص الاستمرارية"""
        try:
            if self.ultimate_parser:
                scenes_data = split_scenes(request.text)
                continuity_issues = []
                
                for i, (scene_num, scene_text) in enumerate(scenes_data):
                    breakdown = await self.ultimate_parser.analyze_scene(scene_text, scene_num)
                    
                    if breakdown.continuity_notes:
                        continuity_issues.extend([
                            {
                                "scene": scene_num,
                                "issue": note,
                                "type": "continuity"
                            }
                            for note in breakdown.continuity_notes
                        ])
                
                return {
                    "validation_passed": len(continuity_issues) == 0,
                    "issues": continuity_issues,
                    "total_scenes_checked": len(scenes_data),
                    "check_method": "ultimate_system"
                }
            
            return await self._fallback_continuity_check(request.text)
            
        except Exception as e:
            logger.error(f"خطأ في فحص الاستمرارية: {e}")
            return await self._fallback_continuity_check(request.text)
    
    async def process_revolutionary_analysis(self, request: AdvancedAnalysisRequest) -> Dict[str, Any]:
        """التحليل الثوري المتقدم"""
        try:
            if self.revolutionary_system and REVOLUTIONARY_AVAILABLE:
                # تحويل النص إلى مشاهد
                scenes_data = split_scenes(request.text)
                advanced_scenes = []
                
                for scene_num, scene_text in scenes_data:
                    # إنشاء AdvancedSceneData
                    scene = AdvancedSceneData(scene_number=scene_num)
                    scene.original_text = scene_text
                    advanced_scenes.append(scene)
                
                # تطبيق التحليل الثوري
                processed_scenes = await self.revolutionary_system.process_complete_analysis(advanced_scenes)
                
                # تحويل النتائج
                results = []
                for scene in processed_scenes:
                    results.append({
                        "scene_number": scene.scene_number,
                        "ai_confidence": scene.ai_confidence,
                        "success_probability": scene.success_probability,
                        "quantum_advantage": scene.quantum_state.quantum_advantage if scene.quantum_state else 0,
                        "neuromorphic_activation": scene.neuromorphic_activation,
                        "consciousness_level": scene.consciousness_level,
                        "creative_alternatives": scene.creative_alternatives,
                        "audience_reactions": scene.audience_reactions
                    })
                
                return {
                    "revolutionary_results": results,
                    "total_scenes": len(processed_scenes),
                    "avg_confidence": sum(s.ai_confidence for s in processed_scenes) / len(processed_scenes),
                    "analysis_method": "revolutionary_system"
                }
            
            return {"error": "Revolutionary System غير متاح", "fallback_used": True}
            
        except Exception as e:
            logger.error(f"خطأ في التحليل الثوري: {e}")
            return {"error": str(e), "fallback_used": True}
    
    # ═══════════════════════════════════════════════════════════════════════
    # Fallback Methods
    # ═══════════════════════════════════════════════════════════════════════
    
    async def _fallback_synopsis(self, text: str) -> Dict[str, Any]:
        """ملخص احتياطي بسيط"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # استخراج أول جملة وصفية
        description_lines = []
        for line in lines[1:]:  # تجاهل العنوان
            if ':' not in line and len(line) > 20:
                description_lines.append(line)
                if len(' '.join(description_lines)) > 150:
                    break
        
        synopsis = ' '.join(description_lines)
        if len(synopsis) > 200:
            synopsis = synopsis[:197] + '...'
        
        return {
            "synopsis": synopsis or "ملخص غير متوفر",
            "scene_type": "transition",
            "characters": [],
            "location": "غير محدد",
            "time": "غير محدد",
            "source": "fallback"
        }
    
    async def _fallback_prop_classification(self, text: str) -> Dict[str, Any]:
        """تصنيف احتياطي للدعائم"""
        text_lower = text.lower()
        
        basic_props = []
        prop_keywords = [
            'ظرف', 'هاتف', 'موبايل', 'لابتوب', 'حاسب', 'مجلة', 
            'حقيبة', 'كأس', 'كوب', 'مفتاح', 'نظارة', 'ساعة'
        ]
        
        for keyword in prop_keywords:
            if keyword in text_lower:
                basic_props.append(keyword)
        
        return {
            "props": basic_props,
            "props_html": ', '.join(basic_props) if basic_props else 'لا يوجد',
            "set_dressing": "حسب الموقع",
            "vehicles": "لا يوجد",
            "classification_method": "fallback",
            "confidence": 0.6
        }
    
    async def _fallback_wardrobe_inference(self, text: str) -> Dict[str, Any]:
        """استنتاج احتياطي للأزياء"""
        return {
            "wardrobe_specs": [
                {
                    "character": "الشخصية الرئيسية",
                    "description": "ملابس مناسبة للمشهد",
                    "is_inferred": True,
                    "continuity_note": ""
                }
            ],
            "costumes_html": "حسب السياق",
            "makeup_html": "تصحيح كاميرا اعتيادي",
            "inference_method": "fallback"
        }
    
    async def _fallback_cinematic_analysis(self, text: str) -> Dict[str, Any]:
        """تحليل احتياطي للأنماط السينمائية"""
        return {
            "cinematic_notes": "مراجعة الراكورات (Continuity)",
            "camera_lighting": "حسب الموقع والوقت",
            "production_notes": "لا توجد ملاحظات خاصة",
            "scene_type": "transition",
            "analysis_method": "fallback"
        }
    
    async def _fallback_continuity_check(self, text: str) -> Dict[str, Any]:
        """فحص احتياطي للاستمرارية"""
        return {
            "validation_passed": True,
            "issues": [],
            "total_scenes_checked": 1,
            "check_method": "fallback"
        }

# ═══════════════════════════════════════════════════════════════════════════
# تطبيق FastAPI
# ═══════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Python Brain Service",
    description="خدمة Python المتقدمة للتكامل مع نظام Multi-Agent للتفريغ السينمائي",
    version="1.0.0"
)

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تهيئة المكونات
job_manager = JobManager()
processor = ComponentProcessor()

# ═══════════════════════════════════════════════════════════════════════════
# نقاط النهاية (Endpoints)
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "service": "Python Brain Service",
        "version": "1.0.0",
        "status": "running",
        "available_systems": {
            "revolutionary": REVOLUTIONARY_AVAILABLE,
            "ultimate": ULTIMATE_AVAILABLE
        }
    }

@app.post("/analyze/async")
async def start_analysis(request: AdvancedAnalysisRequest, background_tasks: BackgroundTasks):
    """بدء تحليل غير متزامن"""
    job_id = job_manager.create_job()
    
    background_tasks.add_task(process_analysis, job_id, request)
    
    return {
        "job_id": job_id,
        "status": "started",
        "message": "تم بدء التحليل"
    }

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """الحصول على حالة الوظيفة"""
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="الوظيفة غير موجودة")
    
    return job

@app.get("/jobs")
async def list_jobs():
    """قائمة جميع الوظائف"""
    return {
        "jobs": list(job_manager.jobs.values()),
        "total": len(job_manager.jobs)
    }

@app.post("/analyze/sync")
async def analyze_sync(request: AdvancedAnalysisRequest):
    """تحليل متزامن (للاختبار)"""
    try:
        start_time = datetime.now()
        
        result = await process_component(request)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return AdvancedAnalysisResponse(
            job_id=f"sync_{uuid.uuid4()}",
            result=result,
            evidence=[],
            confidence=result.get("confidence", 0.8),
            processing_time=processing_time,
            component_version="1.0.0",
            metadata={
                "component": request.component,
                "sync_mode": True
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التحليل: {str(e)}")

# ═══════════════════════════════════════════════════════════════════════════
# معالجة الوظائف (Job Processing)
# ═══════════════════════════════════════════════════════════════════════════

async def process_analysis(job_id: str, request: AdvancedAnalysisRequest):
    """معالجة التحليل في الخلفية"""
    try:
        job_manager.update_job(job_id, status="processing", progress=0.1)
        
        start_time = datetime.now()
        
        # معالجة المكون المطلوب
        result = await process_component(request)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # إنشاء الاستجابة
        response = AdvancedAnalysisResponse(
            job_id=job_id,
            result=result,
            evidence=extract_evidence(request.text, result),
            confidence=result.get("confidence", 0.8),
            processing_time=processing_time,
            component_version="1.0.0",
            metadata={
                "component": request.component,
                "scene_id": request.scene_id,
                "context": request.context
            }
        )
        
        job_manager.update_job(
            job_id,
            status="completed",
            progress=1.0,
            result=response
        )
        
        logger.info(f"✅ تم إكمال الوظيفة {job_id} في {processing_time:.2f} ثانية")
        
    except Exception as e:
        error_msg = f"خطأ في معالجة الوظيفة: {str(e)}"
        logger.error(f"❌ {error_msg}\n{traceback.format_exc()}")
        
        job_manager.update_job(
            job_id,
            status="failed",
            error=error_msg
        )

async def process_component(request: AdvancedAnalysisRequest) -> Dict[str, Any]:
    """معالجة المكون المحدد"""
    
    if request.component == ProcessingComponent.SEMANTIC_SYNOPSIS:
        return await processor.process_semantic_synopsis(request)
    
    elif request.component == ProcessingComponent.PROP_CLASSIFICATION:
        return await processor.process_prop_classification(request)
    
    elif request.component == ProcessingComponent.WARDROBE_INFERENCE:
        return await processor.process_wardrobe_inference(request)
    
    elif request.component == ProcessingComponent.CINEMATIC_PATTERNS:
        return await processor.process_cinematic_patterns(request)
    
    elif request.component == ProcessingComponent.CONTINUITY_CHECK:
        return await processor.process_continuity_check(request)
    
    elif request.component == ProcessingComponent.REVOLUTIONARY_ANALYSIS:
        return await processor.process_revolutionary_analysis(request)
    
    else:
        raise ValueError(f"مكون غير مدعوم: {request.component}")

def extract_evidence(text: str, result: Dict[str, Any]) -> List[Evidence]:
    """استخراج الأدلة من النتائج"""
    evidence = []
    
    # استخراج أدلة بسيطة
    if "props" in result:
        for prop in result["props"]:
            if prop in text:
                start_pos = text.find(prop)
                evidence.append(Evidence(
                    span_start=start_pos,
                    span_end=start_pos + len(prop),
                    text_excerpt=prop,
                    rationale=f"تم العثور على الدعمة: {prop}",
                    confidence=0.8
                ))
    
    return evidence

# ═══════════════════════════════════════════════════════════════════════════
# تشغيل الخدمة
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    logger.info("🚀 بدء تشغيل Python Brain Service...")
    logger.info(f"Revolutionary System: {'✅ متاح' if REVOLUTIONARY_AVAILABLE else '❌ غير متاح'}")
    logger.info(f"Ultimate System: {'✅ متاح' if ULTIMATE_AVAILABLE else '❌ غير متاح'}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )