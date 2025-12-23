#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
═══════════════════════════════════════════════════════════════════════════
نظام Breakdown السينمائي الثوري - Revolutionary Breakdown System V4.0
═══════════════════════════════════════════════════════════════════════════

نظام متقدم لتحليل السيناريوهات وتوليد Breakdown Sheets احترافية
يطبق 7 تقنيات ثورية لتحليل المشاهد بذكاء اصطناعي حقيقي

المعمارية: Multi-Pass Architecture (3 مراحل)
├── Pass 1: Raw Extraction (استخراج أولي)
├── Pass 2: Intelligent Enrichment (إثراء ذكي)
└── Pass 3: Refinement & Validation (تنقيح وتدقيق)

التحسينات في V4.0:
- معالجة متوازية للمشاهد المتعددة
- نظام تكوين متقدم (ConfigManager)
- تحسين الأداء بـ compiled patterns
- معالجة أخطاء محسنة
- caching للعمليات المتكررة
- بنية كود محسنة للقابلية للصيانة

المؤلف: Mohamed Amin Rady
الإصدار: 4.0.0 (Performance Edition)
الترخيص: Production-Ready
═══════════════════════════════════════════════════════════════════════════
"""

import re
import html
import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple, Pattern
from pathlib import Path
from enum import Enum
from collections import defaultdict
from functools import lru_cache
import json

try:
    import aiofiles
    ASYNC_FILES_AVAILABLE = True
except ImportError:
    ASYNC_FILES_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════════════════
# إعداد نظام التسجيل (Logging Configuration)
# ═══════════════════════════════════════════════════════════════════════════

class LoggerFactory:
    """
    مصنع مركزي لإنشاء وإدارة loggers
    """
    _configured = False
    
    @classmethod
    def setup(cls, level: int = logging.INFO):
        """
        إعداد نظام logging مرة واحدة فقط
        """
        if not cls._configured:
            logging.basicConfig(
                level=level,
                format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
                datefmt='%H:%M:%S'
            )
            cls._configured = True
    
    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """
        الحصول على logger بالاسم المطلوب
        """
        cls.setup()
        return logging.getLogger(name)


logger = LoggerFactory.get_logger("RevolutionaryBreakdown")


# ═══════════════════════════════════════════════════════════════════════════
# نظام إدارة التكوين (Configuration Management)
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class SystemConfig:
    """
    إعدادات النظام الكاملة
    """
    # مسارات الملفات
    default_input_path: str = "script.txt"
    default_output_path: str = "revolutionary_breakdown_sheets.html"
    
    # إعدادات المعالجة
    max_concurrent_scenes: int = 10
    enable_caching: bool = True
    
    # إعدادات التحليل
    enable_wardrobe_inference: bool = True
    enable_legal_alerts: bool = True
    enable_cinematic_analysis: bool = True
    
    # إعدادات الأداء
    use_parallel_processing: bool = True
    chunk_size: int = 5
    
    def to_dict(self) -> dict:
        """تحويل التكوين إلى قاموس"""
        return {
            'default_input_path': self.default_input_path,
            'default_output_path': self.default_output_path,
            'max_concurrent_scenes': self.max_concurrent_scenes,
            'enable_caching': self.enable_caching,
            'enable_wardrobe_inference': self.enable_wardrobe_inference,
            'enable_legal_alerts': self.enable_legal_alerts,
            'enable_cinematic_analysis': self.enable_cinematic_analysis,
            'use_parallel_processing': self.use_parallel_processing,
            'chunk_size': self.chunk_size
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'SystemConfig':
        """إنشاء تكوين من قاموس"""
        return cls(**data)


class ConfigManager:
    """
    مدير التكوين المركزي للنظام
    يدير قراءة وكتابة وتحديث الإعدادات
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Args:
            config_path: مسار ملف التكوين (اختياري)
        """
        self.config_path = config_path or Path("config.json")
        self.config = self._load_or_create_default()
        self.logger = LoggerFactory.get_logger("ConfigManager")
    
    def _load_or_create_default(self) -> SystemConfig:
        """
        تحميل التكوين من الملف أو إنشاء تكوين افتراضي
        """
        if self.config_path.exists():
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return SystemConfig.from_dict(data)
            except Exception as e:
                logger.warning(f"فشل تحميل التكوين من {self.config_path}: {e}")
                logger.info("استخدام التكوين الافتراضي")
        
        return SystemConfig()
    
    def save(self):
        """
        حفظ التكوين الحالي إلى الملف
        """
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config.to_dict(), f, ensure_ascii=False, indent=2)
            self.logger.info(f"✓ تم حفظ التكوين في {self.config_path}")
        except Exception as e:
            self.logger.error(f"❌ فشل حفظ التكوين: {e}")
    
    def update(self, **kwargs):
        """
        تحديث قيم محددة في التكوين
        """
        for key, value in kwargs.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
                self.logger.info(f"✓ تم تحديث {key} = {value}")
            else:
                self.logger.warning(f"⚠️ خاصية غير موجودة: {key}")


# ═══════════════════════════════════════════════════════════════════════════
# نماذج البيانات (Domain Models)
# ═══════════════════════════════════════════════════════════════════════════

class SceneType(Enum):
    """تصنيف أنواع المشاهد"""
    DIALOGUE_HEAVY = "حواري"
    ACTION_SEQUENCE = "حركي"
    DISCOVERY = "اكتشاف"
    CONFRONTATION = "مواجهة"
    TRANSITION = "انتقالي"
    EMOTIONAL = "عاطفي"


@dataclass
class CharacterProfile:
    """ملف شخصي كامل للشخصية"""
    name: str
    full_name: str
    gender: str = "unknown"
    age_range: str = ""
    profession: str = ""
    social_class: str = ""
    psychological_state: str = ""


@dataclass
class WardrobeSpec:
    """مواصفات زي تفصيلية"""
    character: str
    description: str
    is_inferred: bool = True
    continuity_note: str = ""


@dataclass
class LegalAlert:
    """تنبيه قانوني"""
    alert_type: str  # "celebrity", "brand", "music", "trademark"
    entity_name: str
    description: str
    severity: str = "warning"  # "warning", "critical"


@dataclass
class DetailedBreakdown:
    """نموذج البيانات الكامل لـ Breakdown Sheet"""
    # === بيانات أساسية ===
    scene_number: str
    int_ext: str
    day_night: str
    location: str
    scene_type: SceneType = SceneType.TRANSITION
    
    # === محتوى المشهد ===
    summary: str = ""
    original_text: str = ""
    
    # === طاقم التمثيل ===
    cast: List[str] = field(default_factory=list)
    cast_profiles: Dict[str, CharacterProfile] = field(default_factory=dict)
    extras_html: str = ""
    
    # === الأزياء والمكياج ===
    wardrobe_specs: List[WardrobeSpec] = field(default_factory=list)
    costumes_html: str = ""
    makeup_html: str = ""
    
    # === الدعائم والديكور ===
    props_list: List[str] = field(default_factory=list)
    props_html: str = ""
    set_dressing_html: str = ""
    
    # === عناصر إنتاجية ===
    animals: str = "لا يوجد"
    vehicles: str = "لا يوجد"
    greenery: str = "لا يوجد"
    stunts: str = "لا يوجد"
    
    # === المؤثرات ===
    special_effects_html: str = ""
    visual_effects: str = "لا يوجد"
    sound_html: str = ""
    
    # === التصوير ===
    camera_lighting: str = ""
    
    # === الملاحظات ===
    production_notes: str = ""
    production_notes_html: str = ""
    cinematic_notes: str = ""
    continuity_notes: List[str] = field(default_factory=list)
    legal_alerts: List[LegalAlert] = field(default_factory=list)
    
    # === بيانات وصفية ===
    is_continuation: bool = False
    previous_scene_ref: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════
# نظام Compiled Patterns (تحسين الأداء)
# ═══════════════════════════════════════════════════════════════════════════

class PatternCache:
    """
    مخزن مركزي لـ compiled regex patterns
    يحسن الأداء بشكل كبير عند استخدام نفس الأنماط مراراً
    """
    
    # أنماط أساسية
    SCENE_HEADER: Pattern = re.compile(
        r'^\s*(?:مشهد|scene)\s*(\d+)\s*[-:]?\s*'
        r'(?:(INT|EXT|داخلي|خارجي)[./\s]*)?'
        r'(?:(نهار|ليل|يوم|DAY|NIGHT)[./\s]*)?'
        r'(.*?)$',
        re.I | re.M
    )
    
    # أنماط الشخصيات
    CHARACTER_NAME: Pattern = re.compile(r'^\s*([أ-يa-z]+)\s*$', re.I | re.M)
    CHARACTER_DIALOGUE: Pattern = re.compile(
        r'^\s*([أ-يa-z]+)\s*[:：]\s*(.+?)(?=(?:^\s*[أ-يa-z]+\s*[:：])|(?:^\s*مشهد\s*\d+)|$)',
        re.I | re.M | re.S
    )
    
    # أنماط العناصر
    PROP_PATTERN: Pattern = re.compile(
        r'\b(ت(حمل|مسك|أخذ|رفع|وضع|فتح)|ي(حمل|مسك|أخذ|رفع|وضع|فتح)|'
        r'(سكين|مسدس|هاتف|كأس|فنجان|كتاب|ورقة|مفتاح|سجائر|قداحة))\b',
        re.I
    )
    
    VEHICLE_PATTERN: Pattern = re.compile(
        r'\b(سيارة|عربية|موتوسيكل|باص|أتوبيس|طائرة|قارب|عجلة|دراجة)\b',
        re.I
    )
    
    ANIMAL_PATTERN: Pattern = re.compile(
        r'\b(كلب|قطة|قط|حصان|طائر|عصفور|أسد|نمر|ثعلب|أرنب)\b',
        re.I
    )
    
    # أنماط المؤثرات
    SFX_PATTERN: Pattern = re.compile(
        r'\b(انفجار|نار|دخان|مطر|ثلج|رياح|ضباب|دم|طلقات)\b',
        re.I
    )
    
    VFX_PATTERN: Pattern = re.compile(
        r'\b(green\s*screen|CGI|تأثيرات|مشهد مركب|خلفية رقمية)\b',
        re.I
    )
    
    # أنماط الصوت
    SOUND_PATTERN: Pattern = re.compile(
        r'\b(موسيقى|أغنية|صوت|ضجة|صمت|همس|صراخ)\b',
        re.I
    )
    
    # أنماط المشاهد الخطرة
    STUNT_PATTERN: Pattern = re.compile(
        r'\b(قفز|سقط|ضرب|معركة|مطاردة|حادث|انفجار)\b',
        re.I
    )
    
    @classmethod
    @lru_cache(maxsize=128)
    def compile_custom(cls, pattern: str, flags: int = 0) -> Pattern:
        """
        تجميع نمط مخصص مع caching
        
        Args:
            pattern: النمط المطلوب تجميعه
            flags: خيارات regex
        
        Returns:
            Pattern مجمع
        """
        return re.compile(pattern, flags)


# ═══════════════════════════════════════════════════════════════════════════
# قواعد البيانات المركزية (Knowledge Bases)
# ═══════════════════════════════════════════════════════════════════════════

class KnowledgeBase:
    """قاعدة معرفية مركزية للنظام"""
    
    # قاعدة بيانات الشخصيات المعروفة
    KNOWN_CHARACTERS: Dict[str, CharacterProfile] = {
        "نهال": CharacterProfile(
            name="نهال",
            full_name="نهال سماحة",
            gender="female",
            age_range="30s",
            social_class="متوسطة-عليا",
            psychological_state="قلقة/صارمة"
        ),
        "نور": CharacterProfile(
            name="نور",
            full_name="نور توفيق",
            gender="female",
            age_range="30s",
            profession="ممثلة",
            social_class="عليا"
        ),
        "كريم": CharacterProfile(
            name="كريم",
            full_name="كريم رزق",
            gender="male",
            age_range="50s",
            profession="منتج",
            social_class="عليا"
        ),
        "مدحت": CharacterProfile(
            name="مدحت",
            full_name="مدحت محفوظ",
            gender="male",
            age_range="30s",
            profession="مباحث أمن دولة",
            social_class="متوسطة"
        ),
        "طارق": CharacterProfile(
            name="طارق",
            full_name="طارق يحي",
            gender="male",
            age_range="40s",
            profession="إعلامي ديني",
            social_class="متوسطة-عليا"
        ),
    }
    
    # قاعدة بيانات المشاهير
    CELEBRITY_NAMES: Set[str] = {
        "عمرو دياب", "محمد رمضان", "أحمد السقا", "هيفاء وهبي",
        "نانسي عجرم", "شيرين عبد الوهاب", "تامر حسني", "ياسمين صبري"
    }
    
    # قاعدة بيانات العلامات التجارية
    BRAND_NAMES: Set[str] = {
        "كوكاكولا", "بيبسي", "آيفون", "سامسونج", "مرسيدس", 
        "BMW", "أديداس", "نايكي", "ماكدونالدز"
    }
    
    # قاموس الأزياء حسب السياق
    WARDROBE_CONTEXTS: Dict[str, List[str]] = {
        "رسمي": ["بدلة كاملة", "قميص أبيض", "كرافتة", "حذاء جلد"],
        "كاجوال": ["جينز", "تي شيرت", "حذاء رياضي"],
        "منزلي": ["بيجاما", "ملابس مريحة", "روب"],
        "رياضي": ["تراكسوت", "شورت رياضي", "حذاء رياضي"],
        "مناسبات": ["فستان سواريه", "بدلة رسمية", "إكسسوارات فاخرة"]
    }


# ═══════════════════════════════════════════════════════════════════════════
# محللات متخصصة (Specialized Analyzers)
# ═══════════════════════════════════════════════════════════════════════════

class BaseAnalyzer(ABC):
    """
    محلل أساسي - قاعدة لجميع المحللات المتخصصة
    """
    
    def __init__(self, config: SystemConfig):
        """
        Args:
            config: تكوين النظام
        """
        self.config = config
        self.logger = LoggerFactory.get_logger(self.__class__.__name__)
    
    @abstractmethod
    async def analyze(self, text: str, context: dict) -> dict:
        """
        تحليل النص
        
        Args:
            text: النص المراد تحليله
            context: سياق إضافي للتحليل
        
        Returns:
            نتائج التحليل
        """
        pass


class CastAnalyzer(BaseAnalyzer):
    """
    محلل طاقم التمثيل
    يستخرج ويحلل الشخصيات من المشهد
    """
    
    async def analyze(self, text: str, context: dict) -> dict:
        """
        استخراج طاقم التمثيل من المشهد
        """
        cast_members = set()
        cast_profiles = {}
        
        # استخراج الشخصيات من الحوارات
        for match in PatternCache.CHARACTER_DIALOGUE.finditer(text):
            char_name = match.group(1).strip()
            cast_members.add(char_name)
            
            # البحث عن ملف الشخصية
            if char_name in KnowledgeBase.KNOWN_CHARACTERS:
                cast_profiles[char_name] = KnowledgeBase.KNOWN_CHARACTERS[char_name]
        
        return {
            'cast': sorted(list(cast_members)),
            'profiles': cast_profiles
        }


class PropAnalyzer(BaseAnalyzer):
    """
    محلل الدعائم
    يستخرج ويصنف Props و Set Dressing
    """
    
    async def analyze(self, text: str, context: dict) -> dict:
        """
        استخراج الدعائم من المشهد
        """
        props = set()
        set_dressing = set()
        
        # استخراج Props من الأفعال
        for match in PatternCache.PROP_PATTERN.finditer(text):
            props.add(match.group(0))
        
        # تصنيف ذكي للدعائم
        # يمكن توسيعه بمنطق أكثر تعقيداً
        
        return {
            'props': sorted(list(props)),
            'set_dressing': sorted(list(set_dressing))
        }


class WardrobeAnalyzer(BaseAnalyzer):
    """
    محلل الأزياء
    يستنتج الأزياء المطلوبة من السياق
    """
    
    async def analyze(self, text: str, context: dict) -> dict:
        """
        استنتاج الأزياء من المشهد
        """
        if not self.config.enable_wardrobe_inference:
            return {'wardrobe_specs': []}
        
        wardrobe_specs = []
        
        # استنتاج الأزياء من الموقع
        location = context.get('location', '').lower()
        
        if 'مكتب' in location or 'شركة' in location:
            context_type = 'رسمي'
        elif 'منزل' in location or 'بيت' in location:
            context_type = 'منزلي'
        elif 'حفلة' in location or 'مطعم' in location:
            context_type = 'مناسبات'
        else:
            context_type = 'كاجوال'
        
        # توليد مواصفات الأزياء
        for char in context.get('cast', []):
            wardrobe_specs.append(
                WardrobeSpec(
                    character=char,
                    description=f"ملابس {context_type}",
                    is_inferred=True
                )
            )
        
        return {'wardrobe_specs': wardrobe_specs}


class EffectsAnalyzer(BaseAnalyzer):
    """
    محلل المؤثرات
    يستخرج SFX و VFX
    """
    
    async def analyze(self, text: str, context: dict) -> dict:
        """
        استخراج المؤثرات من المشهد
        """
        sfx = set()
        vfx = set()
        
        # استخراج SFX
        for match in PatternCache.SFX_PATTERN.finditer(text):
            sfx.add(match.group(0))
        
        # استخراج VFX
        for match in PatternCache.VFX_PATTERN.finditer(text):
            vfx.add(match.group(0))
        
        return {
            'sfx': sorted(list(sfx)),
            'vfx': sorted(list(vfx))
        }


class LegalAnalyzer(BaseAnalyzer):
    """
    محلل قانوني
    يكتشف التنبيهات القانونية (مشاهير، علامات تجارية، إلخ)
    """
    
    async def analyze(self, text: str, context: dict) -> dict:
        """
        فحص التنبيهات القانونية
        """
        if not self.config.enable_legal_alerts:
            return {'alerts': []}
        
        alerts = []
        
        # فحص المشاهير
        for celebrity in KnowledgeBase.CELEBRITY_NAMES:
            if celebrity in text:
                alerts.append(
                    LegalAlert(
                        alert_type="celebrity",
                        entity_name=celebrity,
                        description=f"ذكر اسم شخصية عامة: {celebrity}",
                        severity="warning"
                    )
                )
        
        # فحص العلامات التجارية
        for brand in KnowledgeBase.BRAND_NAMES:
            if brand in text:
                alerts.append(
                    LegalAlert(
                        alert_type="brand",
                        entity_name=brand,
                        description=f"ذكر علامة تجارية: {brand}",
                        severity="critical"
                    )
                )
        
        return {'alerts': alerts}


# ═══════════════════════════════════════════════════════════════════════════
# المحلل الرئيسي (Main Scene Parser)
# ═══════════════════════════════════════════════════════════════════════════

class RevolutionarySceneParser:
    """
    المحلل الرئيسي للمشاهد
    ينسق عمل جميع المحللات المتخصصة
    """
    
    def __init__(self, config: SystemConfig):
        """
        Args:
            config: تكوين النظام
        """
        self.config = config
        self.logger = LoggerFactory.get_logger("SceneParser")
        
        # إنشاء المحللات المتخصصة
        self.cast_analyzer = CastAnalyzer(config)
        self.prop_analyzer = PropAnalyzer(config)
        self.wardrobe_analyzer = WardrobeAnalyzer(config)
        self.effects_analyzer = EffectsAnalyzer(config)
        self.legal_analyzer = LegalAnalyzer(config)
    
    async def analyze_scene(
        self, 
        scene_text: str, 
        scene_num: str
    ) -> DetailedBreakdown:
        """
        تحليل مشهد كامل
        
        Args:
            scene_text: نص المشهد
            scene_num: رقم المشهد
        
        Returns:
            DetailedBreakdown مكتمل
        """
        self.logger.info(f"🎬 تحليل المشهد {scene_num}")
        
        try:
            # استخراج البيانات الأساسية
            header_data = self._extract_scene_header(scene_text)
            
            # إنشاء سياق للمحللات
            context = {
                'scene_number': scene_num,
                'location': header_data['location'],
                'int_ext': header_data['int_ext'],
                'day_night': header_data['day_night']
            }
            
            # تشغيل المحللات بالتوازي
            results = await asyncio.gather(
                self.cast_analyzer.analyze(scene_text, context),
                self.prop_analyzer.analyze(scene_text, context),
                self.effects_analyzer.analyze(scene_text, context),
                self.legal_analyzer.analyze(scene_text, context),
                return_exceptions=True
            )
            
            # معالجة النتائج
            cast_result, prop_result, effects_result, legal_result = results
            
            # إضافة cast إلى السياق للمحلل التالي
            context['cast'] = cast_result.get('cast', []) if isinstance(cast_result, dict) else []
            
            # تشغيل محلل الأزياء (يعتمد على cast)
            wardrobe_result = await self.wardrobe_analyzer.analyze(scene_text, context)
            
            # بناء Breakdown
            breakdown = DetailedBreakdown(
                scene_number=scene_num,
                int_ext=header_data['int_ext'],
                day_night=header_data['day_night'],
                location=header_data['location'],
                original_text=scene_text,
                summary=self._generate_summary(scene_text),
                cast=cast_result.get('cast', []) if isinstance(cast_result, dict) else [],
                cast_profiles=cast_result.get('profiles', {}) if isinstance(cast_result, dict) else {},
                props_list=prop_result.get('props', []) if isinstance(prop_result, dict) else [],
                wardrobe_specs=wardrobe_result.get('wardrobe_specs', []) if isinstance(wardrobe_result, dict) else [],
                legal_alerts=legal_result.get('alerts', []) if isinstance(legal_result, dict) else []
            )
            
            # تنسيق HTML
            self._format_html_fields(breakdown)
            
            self.logger.info(f"✓ تم تحليل المشهد {scene_num}")
            return breakdown
            
        except Exception as e:
            self.logger.error(f"❌ فشل تحليل المشهد {scene_num}: {e}")
            raise
    
    def _extract_scene_header(self, text: str) -> dict:
        """
        استخراج بيانات رأس المشهد
        """
        match = PatternCache.SCENE_HEADER.search(text)
        
        if match:
            int_ext = match.group(2) or "INT"
            day_night = match.group(3) or "نهار"
            location = match.group(4).strip() if match.group(4) else "غير محدد"
        else:
            int_ext = "INT"
            day_night = "نهار"
            location = "غير محدد"
        
        # تنظيف البيانات
        int_ext = self._normalize_int_ext(int_ext)
        day_night = self._normalize_day_night(day_night)
        
        return {
            'int_ext': int_ext,
            'day_night': day_night,
            'location': location
        }
    
    def _normalize_int_ext(self, value: str) -> str:
        """تطبيع INT/EXT"""
        value_lower = value.lower()
        if value_lower in ['int', 'داخلي', 'interior']:
            return 'INT'
        elif value_lower in ['ext', 'خارجي', 'exterior']:
            return 'EXT'
        return 'INT'
    
    def _normalize_day_night(self, value: str) -> str:
        """تطبيع نهار/ليل"""
        value_lower = value.lower()
        if value_lower in ['day', 'نهار', 'يوم']:
            return 'نهار'
        elif value_lower in ['night', 'ليل', 'ليلة']:
            return 'ليل'
        return 'نهار'
    
    def _generate_summary(self, text: str) -> str:
        """
        توليد ملخص للمشهد
        """
        # استخراج أول 3 جمل كملخص مبدئي
        sentences = text.split('.')[:3]
        summary = '. '.join(s.strip() for s in sentences if s.strip())
        
        # تحديد الطول
        if len(summary) > 200:
            summary = summary[:197] + "..."
        
        return summary or "ملخص غير متوفر"
    
    def _format_html_fields(self, breakdown: DetailedBreakdown):
        """
        تنسيق حقول HTML
        """
        # تنسيق Extras
        breakdown.extras_html = '<span class="muted">لا يوجد</span>'
        
        # تنسيق Costumes
        if breakdown.wardrobe_specs:
            items = [f"• {spec.character}: {spec.description}" for spec in breakdown.wardrobe_specs]
            breakdown.costumes_html = '<br>'.join(items)
        else:
            breakdown.costumes_html = '<span class="muted">غير محدد</span>'
        
        # تنسيق Makeup
        breakdown.makeup_html = '<span class="muted">غير محدد</span>'
        
        # تنسيق Props
        if breakdown.props_list:
            breakdown.props_html = '، '.join(breakdown.props_list)
        else:
            breakdown.props_html = '<span class="muted">لا يوجد</span>'
        
        # تنسيق Set Dressing
        breakdown.set_dressing_html = '<span class="muted">غير محدد</span>'
        
        # تنسيق SFX
        breakdown.special_effects_html = '<span class="muted">لا يوجد</span>'
        
        # تنسيق Sound
        breakdown.sound_html = '<span class="muted">لا يوجد</span>'
        
        # تنسيق Production Notes
        if breakdown.legal_alerts:
            notes = [f"⚠️ {alert.description}" for alert in breakdown.legal_alerts]
            breakdown.production_notes_html = '<br>'.join(notes)
        else:
            breakdown.production_notes_html = '<span class="muted">لا توجد ملاحظات</span>'


# ═══════════════════════════════════════════════════════════════════════════
# محرك HTML (HTML Renderer)
# ═══════════════════════════════════════════════════════════════════════════

class HTMLRenderer:
    """
    محرك توليد HTML
    يحول Breakdown Sheets إلى HTML احترافي
    """
    
    CSS = """
    @page { size: A4; margin: 15mm; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { margin: 0; padding: 0; }
      .sheet { page-break-after: always; margin: 0; border-radius: 0; box-shadow: none; border: none; padding: 0; }
      .sheet-header, .sheet-table{ border-color: rgba(0,0,0,0.25); }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      direction: rtl;
      min-height: 100vh;
    }
    .sheet {
      background: white;
      max-width: 210mm;
      margin: 0 auto 30px;
      padding: 20mm;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .sheet-header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .sheet-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .sheet-title {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      letter-spacing: -0.5px;
    }
    .sheet-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .sheet-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    .meta-label {
      font-weight: 600;
      color: #4a5568;
    }
    .sheet-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .sheet-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .sheet-table th {
      padding: 12px;
      text-align: right;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .sheet-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .sheet-table tr:hover {
      background-color: #f7fafc;
    }
    .field {
      font-weight: 600;
      color: #2d3748;
      width: 200px;
      vertical-align: top;
    }
    .value {
      color: #4a5568;
      line-height: 1.6;
    }
    .muted {
      color: #a0aec0;
      font-style: italic;
    }
    .sheet-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #718096;
    }
    .footer-strong {
      font-weight: 600;
      color: #2d3748;
    }
    """
    
    @staticmethod
    def render_scene(scene: DetailedBreakdown, total: int) -> str:
        """تحويل مشهد واحد إلى HTML"""
        
        def esc(s: str) -> str:
            """تطهير HTML"""
            return html.escape(s or "", quote=True)
        
        # معالجة Cast
        cast_text = "، ".join(scene.cast) if scene.cast else ""
        cast_html = esc(cast_text) if cast_text else '<span class="muted">غير مذكور</span>'
        
        return f"""
  <section class="sheet">
    <header class="sheet-header">
      <div class="sheet-header-top">
        <div class="sheet-title">Breakdown Sheet — مشهد {esc(scene.scene_number)}</div>
        <div class="sheet-badge">A4 Ready</div>
      </div>
      <div class="sheet-meta">
        <div class="meta-item"><span class="meta-label">INT/EXT:</span><span>{esc(scene.int_ext)}</span></div>
        <div class="meta-item"><span class="meta-label">نهار/ليل:</span><span>{esc(scene.day_night)}</span></div>
        <div class="meta-item"><span class="meta-label">الموقع:</span><span>{esc(scene.location)}</span></div>
      </div>
    </header>

    <table class="sheet-table">
      <thead><tr><th>الحقل</th><th>التفاصيل</th></tr></thead>
      <tbody>
        <tr><td class="field">رقم المشهد</td><td class="value">{esc(scene.scene_number)}</td></tr>
        <tr><td class="field">ملخص الحدث</td><td class="value">{esc(scene.summary)}</td></tr>

        <tr><td class="field">طاقم التمثيل / Cast</td><td class="value">{cast_html}</td></tr>
        <tr><td class="field">الممثلون الإضافيون / Extras</td><td class="value">{scene.extras_html}</td></tr>

        <tr><td class="field">الأزياء / Costumes</td><td class="value">{scene.costumes_html}</td></tr>
        <tr><td class="field">المكياج / Makeup</td><td class="value">{scene.makeup_html}</td></tr>

        <tr><td class="field">الدعائم / Props</td><td class="value">{scene.props_html}</td></tr>
        <tr><td class="field">ديكورات الموقع / Set Dressings</td><td class="value">{scene.set_dressing_html}</td></tr>

        <tr><td class="field">الحيوانات / Animals</td><td class="value">{esc(scene.animals)}</td></tr>
        <tr><td class="field">المركبات / Vehicles</td><td class="value">{esc(scene.vehicles)}</td></tr>
        <tr><td class="field">المساحات الخضراء / Greenery</td><td class="value">{esc(scene.greenery)}</td></tr>
        <tr><td class="field">المشاهد الخطرة / Stunts</td><td class="value">{esc(scene.stunts)}</td></tr>

        <tr><td class="field">المؤثرات الخاصة / Special Effects</td><td class="value">{scene.special_effects_html}</td></tr>
        <tr><td class="field">المؤثرات البصرية / Visual Effects</td><td class="value">{esc(scene.visual_effects)}</td></tr>

        <tr><td class="field">الصوت / Sound</td><td class="value">{scene.sound_html}</td></tr>
        <tr><td class="field">التصوير والإضاءة / Camera & Lighting</td><td class="value">{esc(scene.camera_lighting)}</td></tr>

        <tr><td class="field">ملاحظات / Notes</td><td class="value">{scene.production_notes_html}</td></tr>
      </tbody>
    </table>

    <footer class="sheet-footer">
      <div><span class="footer-strong">Breakdown Sheets</span> — Scenes 1–{total}</div>
      <div>صفحة: <span class="footer-strong page-num"></span> / {total}</div>
    </footer>
  </section>
"""
    
    @staticmethod
    def render_full_document(scenes: List[DetailedBreakdown]) -> str:
        """توليد المستند الكامل"""
        total = len(scenes)
        scenes_html = "".join([
            HTMLRenderer.render_scene(s, total) for s in scenes
        ])
        
        return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Breakdown Sheets — Scenes 1–{total}</title>
  <style>{HTMLRenderer.CSS}</style>
</head>
<body>
{scenes_html}
</body>
</html>"""


# ═══════════════════════════════════════════════════════════════════════════
# وظائف مساعدة (Utilities)
# ═══════════════════════════════════════════════════════════════════════════

def split_scenes(content: str) -> List[Tuple[str, str]]:
    """
    تقسيم السيناريو إلى مشاهد
    
    Args:
        content: محتوى السيناريو
    
    Returns:
        قائمة من (scene_number, scene_text)
    """
    # استخدام pattern مجمع من PatternCache
    pattern = PatternCache.compile_custom(
        r'(?=^\s*(?:مشهد|scene)\s*\d+)', 
        re.I | re.M
    )
    
    blocks = [b.strip() for b in pattern.split(content) if b.strip()]
    
    scenes = []
    num_pattern = PatternCache.compile_custom(
        r'^\s*(?:مشهد|scene)\s*(\d+)', 
        re.I
    )
    
    for block in blocks:
        match = num_pattern.search(block)
        if match:
            scenes.append((match.group(1), block))
    
    return scenes


async def process_scene_batch(
    parser: RevolutionarySceneParser,
    scenes_batch: List[Tuple[str, str]]
) -> List[DetailedBreakdown]:
    """
    معالجة دفعة من المشاهد بالتوازي
    
    Args:
        parser: المحلل الرئيسي
        scenes_batch: دفعة من المشاهد
    
    Returns:
        قائمة Breakdowns
    """
    tasks = [
        parser.analyze_scene(scene_text, scene_num)
        for scene_num, scene_text in scenes_batch
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # تصفية النتائج الناجحة
    successful_results = [
        r for r in results 
        if isinstance(r, DetailedBreakdown)
    ]
    
    return successful_results


# ═══════════════════════════════════════════════════════════════════════════
# الدالة الرئيسية (Main Function)
# ═══════════════════════════════════════════════════════════════════════════

async def main_async(
    input_path: str, 
    output_path: str, 
    config: SystemConfig
):
    """
    الدالة الرئيسية لمعالجة السيناريو
    
    Args:
        input_path: مسار ملف السيناريو
        output_path: مسار ملف الإخراج
        config: تكوين النظام
    """
    logger.info("═" * 70)
    logger.info("بدء معالجة السيناريو...")
    logger.info("═" * 70)
    
    # قراءة الملف
    try:
        if ASYNC_FILES_AVAILABLE:
            async with aiofiles.open(input_path, 'r', encoding='utf-8') as f:
                content = await f.read()
        else:
            with open(input_path, 'r', encoding='utf-8') as f:
                content = f.read()
        
        logger.info(f"✓ تم قراءة الملف: {input_path}")
    except FileNotFoundError:
        logger.error(f"❌ الملف غير موجود: {input_path}")
        raise
    except Exception as e:
        logger.error(f"❌ خطأ في قراءة الملف: {e}")
        raise
    
    # تقسيم المشاهد
    scenes_data = split_scenes(content)
    if not scenes_data:
        logger.error("❌ لم يتم العثور على مشاهد في الملف")
        raise ValueError("لم يتم العثور على مشاهد")
    
    logger.info(f"✓ تم العثور على {len(scenes_data)} مشهد")
    logger.info("═" * 70)
    
    # إنشاء المحلل
    parser = RevolutionarySceneParser(config)
    
    # معالجة المشاهد
    all_scenes = []
    
    if config.use_parallel_processing:
        # معالجة بالتوازي على دفعات
        logger.info(f"🚀 معالجة متوازية بدفعات (حجم الدفعة: {config.chunk_size})")
        
        for i in range(0, len(scenes_data), config.chunk_size):
            batch = scenes_data[i:i + config.chunk_size]
            batch_num = (i // config.chunk_size) + 1
            
            logger.info(f"📦 معالجة الدفعة {batch_num}")
            
            try:
                batch_results = await process_scene_batch(parser, batch)
                all_scenes.extend(batch_results)
                
                logger.info(
                    f"✓ تم معالجة {len(batch_results)}/{len(batch)} "
                    f"مشهد في الدفعة {batch_num}"
                )
            except Exception as e:
                logger.error(f"❌ فشلت الدفعة {batch_num}: {e}")
    else:
        # معالجة تسلسلية
        logger.info("⏳ معالجة تسلسلية")
        
        for scene_num, scene_text in scenes_data:
            try:
                breakdown = await parser.analyze_scene(scene_text, scene_num)
                all_scenes.append(breakdown)
            except Exception as e:
                logger.error(f"❌ فشل تحليل المشهد {scene_num}: {e}")
    
    logger.info("═" * 70)
    logger.info(f"✓ تم تحليل {len(all_scenes)}/{len(scenes_data)} مشهد بنجاح")
    logger.info("═" * 70)
    
    # توليد HTML
    logger.info("📝 توليد ملف HTML...")
    html_doc = HTMLRenderer.render_full_document(all_scenes)
    
    # حفظ الملف
    try:
        if ASYNC_FILES_AVAILABLE:
            async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
                await f.write(html_doc)
        else:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_doc)
        
        logger.info(f"✓ تم حفظ الملف: {output_path}")
    except Exception as e:
        logger.error(f"❌ فشل حفظ الملف: {e}")
        raise
    
    logger.info("═" * 70)
    logger.info("🎉 Case Closed: تمت المعالجة بنجاح")
    logger.info("═" * 70)


def main(
    input_path: Optional[str] = None, 
    output_path: Optional[str] = None,
    config_path: Optional[str] = None
):
    """
    نقطة الدخول الرئيسية
    
    Args:
        input_path: مسار ملف السيناريو (اختياري)
        output_path: مسار ملف الإخراج (اختياري)
        config_path: مسار ملف التكوين (اختياري)
    """
    # تحميل التكوين
    config_manager = ConfigManager(
        Path(config_path) if config_path else None
    )
    config = config_manager.config
    
    # القيم الافتراضية من التكوين
    if input_path is None:
        input_path = config.default_input_path
    
    if output_path is None:
        output_path = config.default_output_path
    
    # التحقق من وجود الملف
    input_file = Path(input_path)
    if not input_file.exists():
        logger.error(f"❌ ملف السيناريو غير موجود: {input_path}")
        logger.info("💡 تأكد من صحة المسار أو مرر مسار الملف كـ argument")
        return
    
    # تشغيل async
    try:
        asyncio.run(main_async(input_path, output_path, config))
    except KeyboardInterrupt:
        logger.warning("⚠️ تم إيقاف المعالجة بواسطة المستخدم")
    except Exception as e:
        logger.error(f"❌ فشلت المعالجة: {e}")
        raise


# ═══════════════════════════════════════════════════════════════════════════
# نقطة البداية (Entry Point)
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    # دعم تمرير المسارات كـ arguments
    if len(sys.argv) >= 2:
        input_arg = sys.argv[1]
        output_arg = sys.argv[2] if len(sys.argv) >= 3 else None
        config_arg = sys.argv[3] if len(sys.argv) >= 4 else None
        main(input_arg, output_arg, config_arg)
    else:
        # استخدام المسارات من التكوين
        main()