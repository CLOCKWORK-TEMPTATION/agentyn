#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
═══════════════════════════════════════════════════════════════════════════
نظام Breakdown السينمائي الثوري - Revolutionary Breakdown System
═══════════════════════════════════════════════════════════════════════════

نظام متقدم لتحليل السيناريوهات وتوليد Breakdown Sheets احترافية
يطبق 7 تقنيات ثورية لتحليل المشاهد بذكاء اصطناعي حقيقي

المعمارية: Multi-Pass Architecture (3 مراحل)
├── Pass 1: Raw Extraction (استخراج أولي)
├── Pass 2: Intelligent Enrichment (إثراء ذكي)
└── Pass 3: Refinement & Validation (تنقيح وتدقيق)

التقنيات الثورية:
1. Semantic Synopsis Generator - مولد ملخصات دلالي
2. Smart Prop Classifier - مصنف دعائم ذكي
3. Wardrobe Inference Engine - محرك استنتاج أزياء
4. Cinematic Pattern Recognition - تمييز أنماط إخراجية
5. Scene Relationship Graph - شبكة علاقات مشاهد
6. Context-Aware Analysis - تحليل واعي بالسياق
7. Legal Alert System - نظام تنبيهات قانونية

المؤلف: Mohamed Amin Rady
الإصدار: 3.0.0 (Revolutionary Edition)
الترخيص: Production-Ready
═══════════════════════════════════════════════════════════════════════════
"""

import re
import html
import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional, Tuple
from pathlib import Path
from enum import Enum
from collections import defaultdict

try:
    import aiofiles
    ASYNC_FILES_AVAILABLE = True
except ImportError:
    ASYNC_FILES_AVAILABLE = False

# ═══════════════════════════════════════════════════════════════════════════
# إعداد نظام التسجيل (Logging Configuration)
# ═══════════════════════════════════════════════════════════════════════════
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("RevolutionaryBreakdown")


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
    original_text: str = ""  # النص الأصلي الكامل للمشهد
    
    # === طاقم التمثيل ===
    cast: List[str] = field(default_factory=list)
    cast_profiles: Dict[str, CharacterProfile] = field(default_factory=dict)
    extras_html: str = ""
    
    # === الأزياء والمكياج (تفصيلي) ===
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
        "أميرة": CharacterProfile(
            name="أميرة",
            full_name="أميرة حشمت",
            gender="female",
            age_range="30s",
            social_class="عليا"
        ),
        "اميرة": CharacterProfile(
            name="اميرة",
            full_name="أميرة حشمت",
            gender="female",
            age_range="30s",
            social_class="عليا"
        ),
        "رأفت": CharacterProfile(
            name="رأفت",
            full_name="رأفت فريد",
            gender="male",
            age_range="40s",
            social_class="عليا",
            psychological_state="مشلول"
        ),
        "رافت": CharacterProfile(
            name="رافت",
            full_name="رأفت فريد",
            gender="male",
            age_range="40s",
            social_class="عليا",
            psychological_state="مشلول"
        ),
    }
    
    # قاعدة بيانات المشاهير (للتنبيهات القانونية)
    CELEBRITY_NAMES: Set[str] = {
        "عمرو دياب", "تامر حسني", "تامر حسن", "محمد منير",
        "أنغام", "شيرين", "عمرو مصطفى", "حميد الشاعري",
        "عكاشة", "أسامة أنور عكاشة", "يوسف شاهين"
    }
    
    # قاعدة بيانات العلامات التجارية
    BRAND_NAMES: Set[str] = {
        "آيفون", "iphone", "سامسونج", "samsung",
        "مرسيدس", "mercedes", "بي إم دبليو", "bmw",
        "فيسبوك", "facebook", "واتساب", "whatsapp",
        "تويتر", "twitter", "إنستجرام", "instagram"
    }
    
    # قاعدة بيانات أسماء أغاني (للتنبيهات)
    SONG_TITLES: Set[str] = {
        "بعدت ليه", "تملي معاك", "قلبي اختارك",
        "معاك قلبي", "أنا ليلة", "نور العين"
    }


# ═══════════════════════════════════════════════════════════════════════════
# التقنية 1: Semantic Synopsis Generator (مولد ملخصات دلالي)
# ═══════════════════════════════════════════════════════════════════════════

class SynopsisGenerator:
    """
    مولد ملخصات احترافية بدلاً من النسخ الحرفي
    يستخدم قوالب ديناميكية + استخراج دلالي
    """
    
    # قوالب جمل حسب نوع المشهد
    TEMPLATES = {
        SceneType.DIALOGUE_HEAVY: [
            "{char1} و{char2} يتحاوران حول {topic}",
            "حوار بين {char1} و{char2} يكشف {insight}",
            "نقاش حاد بين {char1} و{char2} بشأن {issue}"
        ],
        SceneType.ACTION_SEQUENCE: [
            "{character} {action} في {location}",
            "{character} {action} بينما {context}",
            "تتابع أحداث: {character} {action}"
        ],
        SceneType.DISCOVERY: [
            "{character} {discover_verb} {object}",
            "{character} يعثر على {object} {location_detail}",
            "لحظة اكتشاف: {character} {discover_verb} {object}"
        ],
        SceneType.CONFRONTATION: [
            "مواجهة بين {char1} و{char2} حول {issue}",
            "{char1} يتحدى {char2} في {context}",
            "صراع بين {char1} و{char2} يكشف {revelation}"
        ],
        SceneType.EMOTIONAL: [
            "{character} في حالة {emotion}",
            "لحظة عاطفية: {character} {emotional_action}",
            "{character} {emotion_verb} بسبب {reason}"
        ],
        SceneType.TRANSITION: [
            "انتقال إلى {location}",
            "{character} {action} في {location}",
            "مشهد انتقالي يُظهر {context}"
        ]
    }
    
    # أفعال حركية
    ACTION_VERBS = {
        "يدخل", "يخرج", "يتجه", "يمشي", "يجري", "يقود",
        "يجلس", "ينهض", "يفتح", "يغلق", "يأخذ", "يضع"
    }
    
    # أفعال اكتشاف
    DISCOVERY_VERBS = {
        "يجد", "يلمح", "يكتشف", "يعثر على", "تقع عينه على",
        "يلاحظ", "يرى", "يشاهد"
    }
    
    def generate_synopsis(self, scene_text: str, scene_type: SceneType,
                         characters: List[str]) -> str:
        """
        توليد ملخص احترافي من النص الأصلي
        
        Args:
            scene_text: النص الأصلي للمشهد
            scene_type: نوع المشهد المُصنف
            characters: قائمة الشخصيات
            
        Returns:
            ملخص احترافي موجز
        """
        try:
            # استخراج العناصر الدلالية
            entities = self._extract_semantic_entities(scene_text, characters)
            
            # اختيار قالب مناسب
            template = self._select_template(scene_type, entities)
            
            # ملء القالب
            synopsis = self._fill_template(template, entities)
            
            # تنقيح نهائي
            synopsis = self._refine_synopsis(synopsis, scene_text)
            
            return synopsis
            
        except Exception as e:
            logger.warning(f"فشل توليد الملخص الدلالي: {e}")
            # Fallback: استخراج بسيط
            return self._fallback_summary(scene_text)
    
    def _extract_semantic_entities(self, text: str, 
                                   characters: List[str]) -> Dict:
        """استخراج الكيانات الدلالية من النص"""
        entities = {
            'characters': characters[:2] if len(characters) >= 2 else characters,
            'main_char': characters[0] if characters else "الشخصية",
            'action': self._extract_main_action(text),
            'object': self._extract_object(text),
            'location_detail': self._extract_location_detail(text),
            'emotion': self._extract_emotion(text),
            'topic': self._extract_topic(text)
        }
        return entities
    
    def _extract_main_action(self, text: str) -> str:
        """استخراج الفعل الرئيسي"""
        text_lower = text.lower()
        for verb in self.ACTION_VERBS:
            if verb in text_lower:
                return verb
        
        # محاولة استخراج من أفعال الاكتشاف
        for verb in self.DISCOVERY_VERBS:
            if verb in text_lower:
                return verb
        
        return "يتفاعل"
    
    def _extract_object(self, text: str) -> str:
        """استخراج الكائن المحوري في المشهد"""
        # بحث عن دعائم مهمة
        objects = [
            ("ظرف", r"ظرف"),
            ("هاتف محمول", r"هاتف|موبايل"),
            ("لابتوب", r"لابتوب|حاسب\s*(?:آلي|الي)"),
            ("صورة", r"صورة"),
            ("مستند", r"مستند|ورق|ملف")
        ]
        
        for obj_name, pattern in objects:
            if re.search(pattern, text, re.I):
                return obj_name
        
        return "شيء ما"
    
    def _extract_location_detail(self, text: str) -> str:
        """استخراج تفاصيل الموقع"""
        locations = [
            ("على المكتب", r"على.*مكتب|فوق.*مكتب"),
            ("تحت المساحات", r"تحت.*مساح"),
            ("على الشاشة", r"على.*شاشة|على.*حاسب"),
            ("في الغرفة", r"في.*غرفة"),
            ("في السيارة", r"في.*سيارة")
        ]
        
        for detail, pattern in locations:
            if re.search(pattern, text, re.I):
                return detail
        
        return ""
    
    def _extract_emotion(self, text: str) -> str:
        """استخراج الحالة العاطفية"""
        emotions = [
            ("قلق شديد", r"قلق|قلقة|متوتر|متوترة"),
            ("إحباط", r"إحباط|محبط|محبطة|ضيق"),
            ("غضب", r"غضب|غاضب|غاضبة|حدة"),
            ("استغراب", r"استغراب|مستغرب|يستغرب"),
            ("سعادة", r"سعادة|سعيد|سعيدة|فرح")
        ]
        
        for emotion, pattern in emotions:
            if re.search(pattern, text, re.I):
                return emotion
        
        return "حالة عاطفية معينة"
    
    def _extract_topic(self, text: str) -> str:
        """استخراج الموضوع المحوري في الحوار"""
        # استخراج من الحوار المباشر
        dialogue_pattern = r':\s*([^\n]{20,100})'
        dialogues = re.findall(dialogue_pattern, text)
        
        if dialogues:
            # تحليل أول سطر حوار للموضوع
            first_dialogue = dialogues[0].lower()
            
            if "تلفزيون" in first_dialogue or "فيلم" in first_dialogue:
                return "مستقبل مهني"
            elif "عمرو دياب" in first_dialogue or "تامر" in first_dialogue:
                return "إحياء مناسبة"
            elif "مظاهرة" in first_dialogue:
                return "الوضع الأمني"
            else:
                return "موضوع خاص"
        
        return "موضوع المشهد"
    
    def _select_template(self, scene_type: SceneType, 
                        entities: Dict) -> str:
        """اختيار قالب مناسب"""
        templates = self.TEMPLATES.get(scene_type, 
                                      self.TEMPLATES[SceneType.TRANSITION])
        
        # اختيار القالب بناءً على توفر البيانات
        for template in templates:
            required_keys = re.findall(r'\{(\w+)\}', template)
            if all(entities.get(k) for k in required_keys):
                return template
        
        # Fallback للقالب الأول
        return templates[0]
    
    def _fill_template(self, template: str, entities: Dict) -> str:
        """ملء القالب بالبيانات"""
        try:
            # ملء مباشر للحقول الموجودة
            filled = template
            
            # معالجة الشخصيات
            if '{char1}' in filled and len(entities['characters']) >= 1:
                filled = filled.replace('{char1}', entities['characters'][0])
            if '{char2}' in filled and len(entities['characters']) >= 2:
                filled = filled.replace('{char2}', entities['characters'][1])
            if '{character}' in filled:
                filled = filled.replace('{character}', entities['main_char'])
            
            # ملء بقية الحقول
            for key, value in entities.items():
                if f'{{{key}}}' in filled and value:
                    filled = filled.replace(f'{{{key}}}', str(value))
            
            # إزالة أي placeholders متبقية
            filled = re.sub(r'\{[^}]+\}', '...', filled)
            
            return filled
            
        except Exception as e:
            logger.warning(f"خطأ في ملء القالب: {e}")
            return template
    
    def _refine_synopsis(self, synopsis: str, original_text: str) -> str:
        """تنقيح الملخص النهائي"""
        # تنظيف
        synopsis = synopsis.strip()
        
        # إضافة نقطة نهائية إذا لزم
        if not synopsis.endswith(('.', '؟', '!')):
            synopsis += '.'
        
        # ضمان الطول المناسب
        if len(synopsis) > 250:
            synopsis = synopsis[:247] + '...'
        
        return synopsis
    
    def _fallback_summary(self, text: str) -> str:
        """ملخص احتياطي بسيط"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # تجاهل السطر الأول (header) والحوارات
        summary_lines = []
        for line in lines[1:]:
            if re.match(r'^[^\n:]{1,40}:', line):
                continue
            if len(line) < 15:
                continue
            summary_lines.append(line)
            if len(' '.join(summary_lines)) > 200:
                break
        
        summary = ' '.join(summary_lines)
        return summary[:247] + '...' if len(summary) > 250 else summary


# ═══════════════════════════════════════════════════════════════════════════
# التقنية 2: Smart Prop Classifier (مصنف دعائم ذكي)
# ═══════════════════════════════════════════════════════════════════════════

class PropClassifier:
    """
    مصنف ذكي للدعائم حسب وظيفتها في المشهد
    يمنع أخطاء مثل: كرسي متحرك → Vehicles
    """
    
    # تصنيف هرمي للأشياء
    TAXONOMY = {
        'props': {
            'keywords': ['يمسك', 'يأخذ', 'يناول', 'يحمل', 'محمول', 
                        'صغير', 'خفيف', 'في يده'],
            'patterns': [
                r'ظرف|مظروف',
                r'هاتف|موبايل|تليفون(?!\s+محمول\s+آلي)',
                r'مجلة|صحيفة',
                r'حقيبة|شنطة',
                r'كأس|كوب|فنجان',
                r'مفتاح|مفاتيح',
                r'نظارة|نظارات',
                r'ساعة\s+(?:يد|حائط)',
            ],
            'medical_devices': [
                r'كرسي\s+متحرك(?:\s+طبي)?',
                r'عكاز|عكازة',
                r'حبوب|دواء|علاج',
            ]
        },
        'set_dressing': {
            'keywords': ['يجلس على', 'أمام', 'خلف', 'بجوار', 'ثابت',
                        'ديكور', 'أثاث'],
            'patterns': [
                r'كرسي(?!\s+متحرك)',  # كرسي عادي فقط
                r'طاولة|منضدة',
                r'مرآة|مراية',
                r'سرير',
                r'خزانة|دولاب',
                r'رف|أرفف',
                r'لوحة|لوحات',
                r'ستارة|ستائر',
            ]
        },
        'vehicles': {
            'keywords': ['يدخل إلى', 'يقود', 'يركب', 'عجلات', 'محرك',
                        'يتحرك', 'سرعة'],
            'patterns': [
                r'سيارة(?!\s+لعبة)',
                r'دراجة(?:\s+نارية|\s+بخارية)?',
                r'طائرة',
                r'قارب|مركب',
                r'حافلة|أتوبيس',
            ]
        }
    }
    
    def classify_prop(self, item: str, context: str) -> Tuple[str, str]:
        """
        تصنيف الدعمة بذكاء
        
        Args:
            item: اسم الشيء
            context: السياق المحيط (جملة أو فقرة)
            
        Returns:
            (category, item_name) - الفئة والاسم المحسّن
        """
        item_lower = item.lower()
        context_lower = context.lower()
        
        # حالة خاصة: الكرسي المتحرك
        if re.search(r'كرسي\s+متحرك', item_lower):
            return self._classify_wheelchair(context_lower)
        
        # تصنيف عام
        for category, rules in self.TAXONOMY.items():
            # فحص الأنماط
            for pattern in rules.get('patterns', []):
                if re.search(pattern, item_lower):
                    # تأكيد من السياق
                    keyword_match = any(kw in context_lower 
                                       for kw in rules['keywords'])
                    if keyword_match or category == 'props':
                        return category, self._enhance_item_name(item, category)
            
            # فحص medical devices في props
            if category == 'props':
                for pattern in rules.get('medical_devices', []):
                    if re.search(pattern, item_lower):
                        return 'props', self._enhance_item_name(item, 'props')
        
        # افتراضي: props
        return 'props', item
    
    def _classify_wheelchair(self, context: str) -> Tuple[str, str]:
        """تصنيف ذكي للكرسي المتحرك"""
        # الكرسي المتحرك الطبي = Props (أداة طبية)
        # إلا إذا كان السياق يشير لاستخدامه كمركبة
        
        vehicle_indicators = ['يدفع', 'سرعة', 'يتحرك', 'طريق', 'شارع']
        medical_indicators = ['طبي', 'مريض', 'يجلس', 'مشلول', 'إعاقة']
        
        vehicle_score = sum(1 for ind in vehicle_indicators if ind in context)
        medical_score = sum(1 for ind in medical_indicators if ind in context)
        
        if vehicle_score > medical_score and vehicle_score >= 2:
            return 'vehicles', 'كرسي متحرك'
        else:
            # الافتراضي: Props (أداة طبية)
            return 'props', 'كرسي متحرك طبي'
    
    def _enhance_item_name(self, item: str, category: str) -> str:
        """تحسين اسم الدعمة"""
        enhancements = {
            'props': {
                'ظرف': 'ظرف بريدي',
                'هاتف': 'هاتف محمول',
                'موبايل': 'هاتف محمول',
                'حاسب': 'حاسب آلي محمول',
                'لابتوب': 'حاسب آلي محمول (لابتوب)',
            }
        }
        
        item_lower = item.lower().strip()
        category_enhancements = enhancements.get(category, {})
        
        for key, enhanced in category_enhancements.items():
            if key in item_lower:
                return enhanced
        
        return item


# ═══════════════════════════════════════════════════════════════════════════
# التقنية 3: Wardrobe Inference Engine (محرك استنتاج الأزياء)
# ═══════════════════════════════════════════════════════════════════════════

class WardrobeInferenceEngine:
    """
    محرك استنتاج الأزياء من الوصف والسياق
    استنتاج متعدد المستويات
    """
    
    # قاموس الأوصاف → الأزياء
    DESCRIPTOR_MAPPING = {
        "صرامة": "ملابس رسمية محافظة (بدلة/تايور)",
        "وقار": "بدلة رسمية فاخرة",
        "عملية بشدة": "ستايل عملي سادة + حد أدنى إكسسوارات",
        "وسامة": "قميص أنيق + جاكيت أو بدلة غير رسمية (smart casual)",
        "جمال": "ملابس أنيقة تبرز المظهر",
        "احباط": "ملابس مرتبة لكن بحالة نفسية تظهر",
        "قلق": "ملابس عادية مع تعبير جسدي قلق",
        "مشلول": "ملابس منزلية راقية / روب مريح (لا تهمل المظهر)",
    }
    
    # قواعد السياق الزماني/المكاني
    TIME_LOCATION_RULES = {
        ("ليل", "منزل"): "ملابس منزلية ليلية / بيجامة راقية",
        ("ليل", "غرفة"): "ملابس منزلية ليلية",
        ("نهار", "مكتب"): "زي رسمي مناسب للعمل",
        ("نهار", "مباحث"): "بدلة رسمية + سلاح جانبي",
        ("نهار", "محطة"): "ملابس عمل رسمية / smart casual",
        ("نهار", "فيلا"): "ملابس راقية مناسبة للطبقة الاجتماعية",
        ("خارجي", "نهار"): "ملابس يومية casual أو نصف رسمية",
    }
    
    # قواعد المهنة
    PROFESSION_RULES = {
        "مباحث أمن دولة": "بدلة رسمية داكنة + سلاح جانبي (غير ظاهر)",
        "منتج": "بدلة فاخرة أو smart casual راقي",
        "ممثلة": "أزياء عصرية أنيقة حسب المشهد",
        "إعلامي ديني": "قميص رسمي + جاكيت أو بدلة محافظة",
    }
    
    def infer_wardrobe(self, character: CharacterProfile, 
                      description: str, time: str, location: str) -> WardrobeSpec:
        """
        استنتاج الأزياء متعدد المستويات
        
        Args:
            character: ملف الشخصية
            description: الوصف النصي من السيناريو
            time: الوقت (ليل/نهار)
            location: الموقع
            
        Returns:
            مواصفات الزي المستنتج
        """
        wardrobe_elements = []
        
        # Level 1: من الوصف المباشر للشخصية
        desc_lower = description.lower()
        for descriptor, clothing in self.DESCRIPTOR_MAPPING.items():
            if descriptor in desc_lower:
                wardrobe_elements.append(clothing)
        
        # Level 2: من السياق الزماني/المكاني
        location_type = self._extract_location_type(location)
        context_key = (time.lower(), location_type)
        
        if context_key in self.TIME_LOCATION_RULES:
            wardrobe_elements.append(self.TIME_LOCATION_RULES[context_key])
        
        # Level 3: من المهنة
        if character.profession and character.profession in self.PROFESSION_RULES:
            wardrobe_elements.append(
                self.PROFESSION_RULES[character.profession]
            )
        
        # Level 4: من الطبقة الاجتماعية
        if character.social_class == "عليا" and "فيلا" in location_type:
            wardrobe_elements.append("ملابس راقية فاخرة")
        
        # Level 5: من الحالة النفسية
        if character.psychological_state:
            state = character.psychological_state.lower()
            if "مشلول" in state or "مريض" in state:
                wardrobe_elements.append(
                    "ملابس منزلية راقية (روب أو بيجامة فاخرة)"
                )
        
        # دمج العناصر
        if wardrobe_elements:
            description = self._merge_elements(wardrobe_elements)
        else:
            description = "حسب السياق"
        
        return WardrobeSpec(
            character=character.full_name,
            description=description,
            is_inferred=True
        )
    
    def _extract_location_type(self, location: str) -> str:
        """استخراج نوع الموقع من اسمه"""
        location_lower = location.lower()
        
        type_mapping = {
            "منزل": "منزل",
            "بيت": "منزل",
            "شقة": "منزل",
            "غرفة": "غرفة",
            "مكتب": "مكتب",
            "محطة": "محطة",
            "فيلا": "فيلا",
            "مباحث": "مباحث",
            "سيارة": "سيارة",
            "شارع": "خارجي",
            "طريق": "خارجي",
        }
        
        for key, value in type_mapping.items():
            if key in location_lower:
                return value
        
        return "غير محدد"
    
    def _merge_elements(self, elements: List[str]) -> str:
        """دمج عناصر الأزياء بذكاء"""
        # إزالة التكرار
        unique = []
        seen_concepts = set()
        
        for element in elements:
            # استخراج المفهوم الأساسي
            concept = element.split()[0].lower()
            if concept not in seen_concepts:
                unique.append(element)
                seen_concepts.add(concept)
        
        # دمج
        if len(unique) == 1:
            return unique[0]
        else:
            return " | ".join(unique)


# ═══════════════════════════════════════════════════════════════════════════
# التقنية 4: Cinematic Pattern Recognition (تمييز الأنماط الإخراجية)
# ═══════════════════════════════════════════════════════════════════════════

class CinematicAnalyzer:
    """
    تحليل الأنماط الإخراجية واقتراح ملاحظات سينمائية
    """
    
    # أنماط إخراجية شائعة
    PATTERNS = {
        'power_confrontation': {
            'triggers': [
                r'يجلس.*امام',
                r'مكتب.*(?:مدير|رئيس|منتج)',
                r'رجل.*يبدو.*وقار',
            ],
            'note': 'مشهد مواجهة: ضبط بلوكينج يبرز صراع السلطة.',
            'camera_note': 'Over-shoulder shots + تبادل زوايا للتأكيد على الديناميكية'
        },
        'discovery_moment': {
            'triggers': [
                r'(?:يجد|يلمح|يكتشف|تقع عينيه)',
                r'ظرف|مستند|صورة',
                r'(?:استغراب|مفاجأة)',
            ],
            'note': 'مشهد اكتشاف: التركيز على ريأكشن الشخصية + لقطة إدراج للكائن.',
            'camera_note': 'Close-up على الريأكشن + Insert shot للكائن المكتشف'
        },
        'phone_conversation': {
            'triggers': [
                r'(?:هاتف|موبايل|تليفون)',
                r'يتحدث\s+في',
            ],
            'note': 'مكالمة هاتفية: تصوير جانب واحد من المحادثة.',
            'camera_note': 'Single-sided conversation - التركيز على التعبيرات'
        },
        'music_cue': {
            'triggers': [
                r'(?:يغني|صوت.*دياب|كاسيت|موسيقى)',
                r'أغنية|اغنية',
            ],
            'note': 'موسيقى تصويرية: تأكيد حقوق التشغيل قبل التصوير.',
            'camera_note': 'دمج الموسيقى مع المشهد بسلاسة'
        },
        'vehicle_scene': {
            'triggers': [
                r'(?:سيارة|يقود)',
                r'(?:يدخل|داخل).*سيارة',
            ],
            'note': 'مشهد سيارة: استخدام Process trailer أو Green screen حسب الميزانية.',
            'camera_note': 'Car mounting rigs + matching الإضاءة الخارجية'
        },
        'emotional_isolation': {
            'triggers': [
                r'(?:وحيد|وحيدة|منعزل)',
                r'(?:قلق|حزن|احباط).*شديد',
                r'يفكر|تفكر',
            ],
            'note': 'لحظة عزلة عاطفية: استخدام Wide shot للتأكيد على الوحدة.',
            'camera_note': 'Wide angle + إضاءة mood للتعبير عن الحالة النفسية'
        },
        'rapid_search': {
            'triggers': [
                r'بسرعة',
                r'يبحث|تبحث',
                r'قلق|توتر',
            ],
            'note': 'مشهد بحث: Handheld camera لتعزيز الإحساس بالتوتر.',
            'camera_note': 'Handheld + Quick cuts للتعبير عن العجلة'
        },
        'laptop_computer_action': {
            'triggers': [
                r'(?:لابتوب|حاسب)',
                r'(?:يفتح|تفتح|ينظر|تنظر)',
                r'شاشة|صورة',
            ],
            'note': 'استمرارية: تطابق محتوى الشاشة مع باقي المشاهد.',
            'camera_note': 'Screen content playback + Over-shoulder shot'
        },
    }
    
    def analyze_scene(self, scene_text: str, scene_type: SceneType) -> Tuple[str, str]:
        """
        تحليل المشهد واقتراح ملاحظات
        
        Returns:
            (production_note, camera_note)
        """
        text_lower = scene_text.lower()
        
        # فحص كل نمط
        for pattern_name, config in self.PATTERNS.items():
            matches = sum(
                1 for trigger in config['triggers']
                if re.search(trigger, text_lower)
            )
            
            # إذا تطابقت معظم المؤشرات
            if matches >= len(config['triggers']) - 1:
                return config['note'], config.get('camera_note', '')
        
        # ملاحظات افتراضية حسب نوع المشهد
        default_notes = {
            SceneType.DIALOGUE_HEAVY: (
                "مشهد حواري: التركيز على الأداء والتفاعل.",
                "Shot-reverse-shot + Medium shots للحوار"
            ),
            SceneType.ACTION_SEQUENCE: (
                "مشهد حركي: تنسيق الحركة والـ blocking.",
                "Dynamic camera movement + multiple angles"
            ),
            SceneType.CONFRONTATION: (
                "مشهد صراع: تصعيد تدريجي في الإيقاع.",
                "Tightening shots + زيادة التوتر البصري"
            ),
        }
        
        return default_notes.get(
            scene_type,
            ("مراجعة الراكورات (Continuity)", "")
        )


# ═══════════════════════════════════════════════════════════════════════════
# التقنية 5: Scene Relationship Graph (شبكة علاقات المشاهد)
# ═══════════════════════════════════════════════════════════════════════════

class SceneContextGraph:
    """
    بناء شبكة علاقات ذكية بين المشاهد
    تتبع استمرارية: الملابس، الدعائم، الحالات النفسية
    """
    
    def __init__(self):
        # سجلات التتبع
        self.character_timeline: Dict[str, List[Dict]] = defaultdict(list)
        self.prop_registry: Dict[str, List[str]] = defaultdict(list)
        self.location_history: Dict[str, List[str]] = defaultdict(list)
        
        # خريطة الاستمرارية
        self.continuity_map: Dict[str, str] = {}
    
    def register_scene(self, scene: DetailedBreakdown):
        """تسجيل مشهد في الشبكة"""
        scene_id = scene.scene_number
        
        # تسجيل الشخصيات
        for char in scene.cast:
            self.character_timeline[char].append({
                'scene': scene_id,
                'time': scene.day_night,
                'location': scene.location,
                'wardrobe': scene.costumes_html,
            })
        
        # تسجيل الدعائم
        for prop in scene.props_list:
            self.prop_registry[prop].append(scene_id)
        
        # تسجيل الموقع
        self.location_history[scene.location].append(scene_id)
    
    def detect_continuation(self, current_scene: DetailedBreakdown) -> Optional[str]:
        """
        كشف إذا كان المشهد استمراراً لمشهد سابق
        
        Returns:
            رقم المشهد السابق إذا وُجد استمرارية
        """
        # تحقق من نفس الموقع + نفس الوقت + شخصيات مشتركة
        location = current_scene.location
        time = current_scene.day_night
        current_chars = set(current_scene.cast)
        
        # البحث في آخر 3 مشاهد
        recent_scenes = []
        for char in current_chars:
            if char in self.character_timeline:
                recent_scenes.extend(self.character_timeline[char][-3:])
        
        for entry in reversed(recent_scenes):
            if (entry['location'] == location and 
                entry['time'] == time):
                return entry['scene']
        
        return None
    
    def get_continuity_notes(self, scene: DetailedBreakdown) -> List[str]:
        """توليد ملاحظات استمرارية"""
        notes = []
        
        # تحقق من الدعائم المتكررة
        for prop in scene.props_list:
            if len(self.prop_registry[prop]) > 1:
                notes.append(
                    f"استمرارية: تطابق {prop} مع ظهوره في "
                    f"المشاهد {', '.join(self.prop_registry[prop][:-1])}"
                )
        
        # تحقق من الشخصيات في نفس الموقع
        location_chars = []
        for char in scene.cast:
            if char in self.character_timeline:
                prev_entry = self.character_timeline[char][-2] \
                    if len(self.character_timeline[char]) > 1 else None
                
                if prev_entry and prev_entry['location'] == scene.location:
                    location_chars.append(char)
        
        if location_chars:
            notes.append(
                f"استمرارية أزياء: {', '.join(location_chars)} "
                f"في نفس الموقع"
            )
        
        return notes


# ═══════════════════════════════════════════════════════════════════════════
# التقنية 6: Legal Alert System (نظام التنبيهات القانونية)
# ═══════════════════════════════════════════════════════════════════════════

class LegalAlertSystem:
    """كشف تلقائي للتنبيهات القانونية"""
    
    def scan_for_alerts(self, text: str) -> List[LegalAlert]:
        """فحص النص للتنبيهات القانونية"""
        alerts = []
        text_lower = text.lower()
        
        # فحص المشاهير
        for celebrity in KnowledgeBase.CELEBRITY_NAMES:
            if celebrity.lower() in text_lower:
                alerts.append(LegalAlert(
                    alert_type="celebrity",
                    entity_name=celebrity,
                    description=f'ذكر اسم "{celebrity}" - يتطلب مراجعة قانونية',
                    severity="warning"
                ))
        
        # فحص العلامات التجارية
        for brand in KnowledgeBase.BRAND_NAMES:
            if brand.lower() in text_lower:
                alerts.append(LegalAlert(
                    alert_type="brand",
                    entity_name=brand,
                    description=f'ذكر علامة تجارية "{brand}" - مراجعة حقوق الاستخدام',
                    severity="warning"
                ))
        
        # فحص الأغاني
        for song in KnowledgeBase.SONG_TITLES:
            if song.lower() in text_lower:
                alerts.append(LegalAlert(
                    alert_type="music",
                    entity_name=song,
                    description=f'تشغيل أغنية "{song}" - الحصول على حقوق التشغيل',
                    severity="critical"
                ))
        
        # فحص استخدام موسيقى عامة
        music_keywords = ['يغني', 'أغنية', 'اغنية', 'موسيقى', 'كاسيت']
        if any(kw in text_lower for kw in music_keywords):
            if not any(alert.alert_type == "music" for alert in alerts):
                alerts.append(LegalAlert(
                    alert_type="music",
                    entity_name="محتوى موسيقي",
                    description="محتوى موسيقي - التأكد من حقوق التشغيل",
                    severity="warning"
                ))
        
        return alerts


# ═══════════════════════════════════════════════════════════════════════════
# المحلل الرئيسي المتطور (Revolutionary Parser)
# ═══════════════════════════════════════════════════════════════════════════

class RevolutionarySceneParser:
    """
    محلل متقدم يجمع كل التقنيات الثورية
    Multi-Pass Architecture
    """
    
    def __init__(self):
        logger.info("═" * 70)
        logger.info("تهيئة نظام Breakdown الثوري...")
        logger.info("═" * 70)
        
        # تهيئة المكونات
        self.synopsis_gen = SynopsisGenerator()
        self.prop_classifier = PropClassifier()
        self.wardrobe_engine = WardrobeInferenceEngine()
        self.cinematic_analyzer = CinematicAnalyzer()
        self.context_graph = SceneContextGraph()
        self.legal_system = LegalAlertSystem()
        
        logger.info("✓ تم تحميل SynopsisGenerator")
        logger.info("✓ تم تحميل PropClassifier")
        logger.info("✓ تم تحميل WardrobeInferenceEngine")
        logger.info("✓ تم تحميل CinematicAnalyzer")
        logger.info("✓ تم تحميل SceneContextGraph")
        logger.info("✓ تم تحميل LegalAlertSystem")
        logger.info("═" * 70)
    
    async def analyze_scene(self, scene_text: str, scene_number: str) -> DetailedBreakdown:
        """
        تحليل ثلاثي المراحل (Multi-Pass)
        
        Pass 1: Raw Extraction
        Pass 2: Intelligent Enrichment
        Pass 3: Refinement & Validation
        """
        logger.info(f"🔍 تحليل المشهد {scene_number}...")
        
        # ═══ Pass 1: Raw Extraction ═══
        breakdown = await self._pass1_extract(scene_text, scene_number)
        
        # ═══ Pass 2: Intelligent Enrichment ═══
        await self._pass2_enrich(breakdown, scene_text)
        
        # ═══ Pass 3: Refinement & Validation ═══
        await self._pass3_refine(breakdown)
        
        # تسجيل في الشبكة
        self.context_graph.register_scene(breakdown)
        
        logger.info(f"✓ تم تحليل المشهد {scene_number}")
        return breakdown
    
    async def _pass1_extract(self, text: str, scene_num: str) -> DetailedBreakdown:
        """Pass 1: استخراج أولي للبيانات"""
        lines = [l.rstrip() for l in text.splitlines() if l.strip()]
        header = lines[0] if lines else ""
        
        # تحليل الـ header
        int_ext, day_night, location = self._parse_header(header, text)
        
        # استخراج الشخصيات
        cast = self._extract_cast(text)
        
        # تصنيف نوع المشهد
        scene_type = self._classify_scene_type(text, cast)
        
        # إنشاء الكائن الأولي
        breakdown = DetailedBreakdown(
            scene_number=scene_num,
            int_ext=int_ext,
            day_night=day_night,
            location=location,
            scene_type=scene_type,
            original_text=text,
            cast=cast
        )
        
        return breakdown
    
    async def _pass2_enrich(self, breakdown: DetailedBreakdown, text: str):
        """Pass 2: إثراء ذكي"""
        
        # 1. توليد ملخص دلالي
        breakdown.summary = self.synopsis_gen.generate_synopsis(
            text,
            breakdown.scene_type,
            breakdown.cast
        )
        
        # 2. استخراج وتصنيف الدعائم
        await self._extract_and_classify_props(breakdown, text)
        
        # 3. استنتاج الأزياء
        await self._infer_wardrobes(breakdown, text)
        
        # 4. تحليل سينمائي
        production_note, camera_note = self.cinematic_analyzer.analyze_scene(
            text,
            breakdown.scene_type
        )
        breakdown.cinematic_notes = production_note
        breakdown.camera_lighting = camera_note if camera_note else \
            self._generate_camera_lighting(breakdown)
        
        # 5. كشف التنبيهات القانونية
        breakdown.legal_alerts = self.legal_system.scan_for_alerts(text)
        
        # 6. تحليل قائم على القواعد
        await self._rule_based_enrichment(breakdown, text)
    
    async def _pass3_refine(self, breakdown: DetailedBreakdown):
        """Pass 3: تنقيح وتدقيق"""
        
        # كشف الاستمرارية
        prev_scene = self.context_graph.detect_continuation(breakdown)
        if prev_scene:
            breakdown.is_continuation = True
            breakdown.previous_scene_ref = prev_scene
        
        # ملاحظات استمرارية
        continuity_notes = self.context_graph.get_continuity_notes(breakdown)
        breakdown.continuity_notes.extend(continuity_notes)
        
        # بناء HTML للحقول المعقدة
        await self._build_html_fields(breakdown)
        
        # تدقيق نهائي
        await self._final_validation(breakdown)
    
    def _parse_header(self, header: str, fallback_text: str) -> Tuple[str, str, str]:
        """تحليل header المشهد"""
        h = re.sub(r'\s+', ' ', header.strip())
        
        # افتراضات أولية
        int_ext = "داخلي (INT)"
        day_night = "نهار"
        location = "غير محدد"
        
        # كشف INT/EXT
        low = h.lower()
        if re.search(r'\b(خارجي|ext\.?)\b', low) and not re.search(r'\b(داخلي|int\.?)\b', low):
            int_ext = "خارجي (EXT)"
        elif re.search(r'\b(داخلي|int\.?)\b', low):
            int_ext = "داخلي (INT)"
        
        # كشف Day/Night
        if re.search(r'\b(ليل|night)\b', low):
            day_night = "ليل"
        elif re.search(r'\b(نهار|day)\b', low):
            day_night = "نهار"
        else:
            # Fallback من النص
            if re.search(r'\b(ليل|night)\b', fallback_text.lower()):
                day_night = "ليل"
        
        # استخراج الموقع
        temp = re.sub(r'^(مشهد|scene)\s*\d+\s*[:\-–—]?\s*', '', h, flags=re.I).strip()
        parts = [p.strip() for p in re.split(r'[-–—|]+', temp) if p.strip()]
        
        # فلترة الكلمات التصنيفية
        filtered = []
        for p in parts:
            pl = p.lower()
            if re.fullmatch(r'(داخلي|int\.?|خارجي|ext\.?|نهار|day|ليل|night)', pl):
                continue
            filtered.append(p)
        
        if filtered:
            location = re.sub(r'\s+', ' ', ' - '.join(filtered))
        else:
            loc = re.sub(
                r'(مشهد|scene|\d+|داخلي|خارجي|int|ext|ليل|نهار|day|night|[:\-–—])',
                ' ',
                h,
                flags=re.I
            )
            loc = re.sub(r'\s+', ' ', loc.strip())
            location = loc if loc else "غير محدد"
        
        return int_ext, day_night, location
    
    def _extract_cast(self, text: str) -> List[str]:
        """استخراج الشخصيات من الحوار"""
        pattern = re.compile(r'^\s*([A-Za-z\u0600-\u06FF][A-Za-z\u0600-\u06FF\s]{1,40}):', re.M)
        matches = pattern.findall(text)
        
        cast = []
        for m in matches:
            name = re.sub(r'\s+', ' ', m.strip())
            
            # فلترة
            if len(name) < 2 or len(name.split()) > 4:
                continue
            if name.lower() in {"مشهد", "scene"}:
                continue
            
            # تطبيع الاسم
            normalized = self._normalize_character_name(name)
            if normalized and normalized not in cast:
                cast.append(normalized)
        
        # استخراج إضافي من النص الوصفي
        cast.extend(self._extract_cast_from_description(text))
        
        # إزالة التكرار
        return list(dict.fromkeys(cast))
    
    def _normalize_character_name(self, name: str) -> str:
        """تطبيع اسم الشخصية للحصول على الاسم الكامل"""
        name_clean = name.strip()
        
        # بحث في قاعدة البيانات
        for key, profile in KnowledgeBase.KNOWN_CHARACTERS.items():
            if key.lower() == name_clean.lower():
                return profile.full_name
        
        return name_clean
    
    def _extract_cast_from_description(self, text: str) -> List[str]:
        """استخراج الشخصيات من الوصف السردي"""
        cast = []
        
        # أنماط شائعة
        patterns = [
            r'تخرج\s+([A-Za-z\u0600-\u06FF]+)\s+(?:سماحة)?',
            r'يجلس\s+([A-Za-z\u0600-\u06FF]+)\s+',
            r'يدخل\s+([A-Za-z\u0600-\u06FF]+)\s+',
            r'تجلس\s+([A-Za-z\u0600-\u06FF]+)\s+',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                normalized = self._normalize_character_name(match)
                if normalized and normalized not in cast:
                    cast.append(normalized)
        
        return cast
    
    def _classify_scene_type(self, text: str, cast: List[str]) -> SceneType:
        """تصنيف نوع المشهد"""
        text_lower = text.lower()
        
        # نسبة الحوار
        dialogue_lines = len(re.findall(r'^\s*[^:\n]{1,40}:', text, re.M))
        total_lines = len(text.split('\n'))
        dialogue_ratio = dialogue_lines / max(total_lines, 1)
        
        # تصنيف
        if dialogue_ratio > 0.4:
            # مشهد حواري
            if any(word in text_lower for word in ['مواجهة', 'صراع', 'خلاف', 'جدال']):
                return SceneType.CONFRONTATION
            return SceneType.DIALOGUE_HEAVY
        
        # أفعال اكتشاف
        if any(verb in text_lower for verb in ['يجد', 'يلمح', 'يكتشف', 'تقع عينه']):
            return SceneType.DISCOVERY
        
        # أفعال حركية
        action_verbs = ['يدخل', 'يخرج', 'يجري', 'يقفز', 'يقود', 'يضرب']
        if sum(1 for v in action_verbs if v in text_lower) >= 2:
            return SceneType.ACTION_SEQUENCE
        
        # حالات عاطفية
        if any(word in text_lower for word in ['قلق', 'حزن', 'احباط', 'سعادة', 'فرح']):
            return SceneType.EMOTIONAL
        
        return SceneType.TRANSITION
    
    async def _extract_and_classify_props(self, breakdown: DetailedBreakdown, text: str):
        """استخراج وتصنيف الدعائم"""
        text_lower = text.lower()
        
        # قائمة الدعائم المحتملة
        prop_candidates = []
        
        # استخراج بالـ patterns
        prop_patterns = {
            'ظرف': r'ظرف|مظروف',
            'هاتف محمول': r'هاتف|موبايل|تليفون(?!\s+آلي)',
            'حاسب آلي': r'لابتوب|حاسب\s*(?:آلي|الي)|كمبيوتر',
            'مجلات': r'مجلة|مجلات',
            'حقيبة': r'حقيبة|شنطة',
            'كاسيت': r'كاسيت|راديو',
            'كرسي متحرك': r'كرسي\s+متحرك',
            'صورة': r'صورة|صور',
        }
        
        for prop_name, pattern in prop_patterns.items():
            if re.search(pattern, text_lower):
                # تصنيف الدعمة
                category, enhanced_name = self.prop_classifier.classify_prop(
                    prop_name,
                    text_lower
                )
                
                if category == 'props':
                    prop_candidates.append(enhanced_name)
                elif category == 'vehicles':
                    if breakdown.vehicles == "لا يوجد":
                        breakdown.vehicles = enhanced_name
                    else:
                        breakdown.vehicles += f"، {enhanced_name}"
                # set_dressing يُعالج في _rule_based_enrichment
        
        # حفظ القائمة
        breakdown.props_list = prop_candidates
    
    async def _infer_wardrobes(self, breakdown: DetailedBreakdown, text: str):
        """استنتاج الأزياء لكل شخصية"""
        wardrobe_specs = []
        
        for char_name in breakdown.cast:
            # الحصول على الملف الشخصي
            profile = None
            for key, p in KnowledgeBase.KNOWN_CHARACTERS.items():
                if p.full_name == char_name:
                    profile = p
                    break
            
            if not profile:
                profile = CharacterProfile(
                    name=char_name,
                    full_name=char_name
                )
            
            # استنتاج الزي
            spec = self.wardrobe_engine.infer_wardrobe(
                profile,
                text,
                breakdown.day_night,
                breakdown.location
            )
            
            wardrobe_specs.append(spec)
            breakdown.cast_profiles[char_name] = profile
        
        breakdown.wardrobe_specs = wardrobe_specs
    
    async def _rule_based_enrichment(self, breakdown: DetailedBreakdown, text: str):
        """إثراء قائم على القواعد"""
        text_lower = text.lower()
        
        # Extras
        if re.search(r'(جمهور|حشد|زحام|مارة|ناس كتير)', text_lower):
            breakdown.extras_html = 'يلزم ممثلون إضافيون (جمهور/حشد) <span class="tag">تقدير: 10-20 شخص</span>'
        else:
            breakdown.extras_html = '<span class="muted">غير مذكور (لا يلزم)</span>'
        
        # Set Dressing
        set_elements = []
        
        dressing_patterns = {
            'مرآة': r'مرآة|مراية',
            'كرسي': r'كرسي(?!\s+متحرك)',
            'طاولة': r'طاولة|منضدة',
            'سرير': r'سرير',
            'خزانة': r'خزانة|دولاب',
        }
        
        for element, pattern in dressing_patterns.items():
            if re.search(pattern, text_lower):
                set_elements.append(element)
        
        # إضافة تفاصيل حسب الموقع
        location_lower = breakdown.location.lower()
        
        if 'مكتب' in location_lower:
            set_elements.extend(['مكتب مدير', 'كراسي', 'أرفف'])
        elif 'غرفة مكياج' in location_lower:
            set_elements.extend(['مرآة بإضاءة', 'كرسي مكياج', 'طاولة أدوات'])
        elif 'منزل' in location_lower or 'غرفة' in location_lower:
            if 'نوم' in location_lower:
                set_elements.extend(['سرير', 'خزانة', 'إضاءة جانبية'])
            else:
                set_elements.extend(['أثاث منزلي'])
        elif 'فيلا' in location_lower:
            set_elements.extend(['أثاث راقٍ', 'ديكور فاخر'])
        
        # إزالة التكرار
        set_elements = list(dict.fromkeys(set_elements))
        
        if set_elements:
            breakdown.set_dressing_html = ', '.join(set_elements) + \
                ' <span class="tag">مستنتج من السياق</span>'
        else:
            breakdown.set_dressing_html = 'حسب الموقع <span class="tag">مستنتج من السياق</span>'
        
        # Special Effects
        effects = []
        
        if re.search(r'(انفجار|دخان|نار|تفجير)', text_lower):
            effects.append('مؤثرات عملية (انفجار/دخان)')
        
        if re.search(r'(مطر|ثلج|رياح)', text_lower):
            effects.append('مؤثرات طقس')
        
        if re.search(r'(صورة.*سطح.*مكتب|شاشة.*حاسب|playback)', text_lower):
            effects.append('تغيير محتوى الشاشة (Playback)')
        
        if effects:
            breakdown.special_effects_html = '<br>'.join(effects)
        else:
            breakdown.special_effects_html = 'لا يوجد'
        
        # Sound
        sound_elements = []
        
        if re.search(r'(حوار|يتحدث|تتحدث|يقول|تقول)', text_lower):
            sound_elements.append('حوار مباشر')
        
        if re.search(r'(يغني|موسيقى|أغنية|كاسيت)', text_lower):
            sound_elements.append('موسيقى تصويرية')
        
        if re.search(r'(يطرق|طرق.*باب|knock)', text_lower):
            sound_elements.append('طرق باب')
        
        if re.search(r'(صوت.*سيارة|محرك)', text_lower):
            sound_elements.append('أصوات مركبات')
        
        breakdown.sound_html = ' + '.join(sound_elements) if sound_elements \
            else 'حوار مباشر'
        
        # Makeup (افتراضي)
        makeup_items = []
        for char in breakdown.cast:
            makeup_items.append(
                f'• {char}: تصحيح كاميرا اعتيادي'
            )
        
        if makeup_items:
            breakdown.makeup_html = '<br>'.join(makeup_items) + \
                ' <span class="tag">مستنتج من السياق</span>'
        else:
            breakdown.makeup_html = 'تصحيح كاميرا <span class="tag">مستنتج من السياق</span>'
    
    def _generate_camera_lighting(self, breakdown: DetailedBreakdown) -> str:
        """توليد ملاحظات التصوير والإضاءة"""
        time = breakdown.day_night
        int_ext = breakdown.int_ext
        
        if "داخلي" in int_ext:
            if time == "ليل":
                return "ليل داخلي"
            else:
                return "نهار داخلي"
        else:
            if time == "ليل":
                return "ليل خارجي"
            else:
                return "نهار خارجي"
    
    async def _build_html_fields(self, breakdown: DetailedBreakdown):
        """بناء حقول HTML المعقدة"""
        
        # Costumes HTML
        if breakdown.wardrobe_specs:
            costume_items = []
            for spec in breakdown.wardrobe_specs:
                item = f'• {spec.character}: {spec.description}'
                costume_items.append(item)
            
            breakdown.costumes_html = '<br>'.join(costume_items) + \
                ' <span class="tag">مستنتج من السياق</span>'
        else:
            breakdown.costumes_html = 'حسب السياق <span class="tag">مستنتج من السياق</span>'
        
        # Props HTML
        if breakdown.props_list:
            if len(breakdown.props_list) == 1:
                breakdown.props_html = breakdown.props_list[0]
            else:
                props_li = ''.join([f'<li>{p}</li>' for p in breakdown.props_list])
                breakdown.props_html = f'<ul class="bullets">{props_li}</ul>'
        else:
            breakdown.props_html = 'لا يوجد'
        
        # Production Notes HTML
        notes = []
        
        if breakdown.cinematic_notes:
            notes.append(breakdown.cinematic_notes)
        
        if breakdown.continuity_notes:
            notes.extend(breakdown.continuity_notes)
        
        if breakdown.legal_alerts:
            notes.append('<br><ul class="bullets" style="margin-top:8px;">')
            for alert in breakdown.legal_alerts:
                notes.append(f'<li class="alert-text">⚠️ {alert.description}</li>')
            notes.append('</ul>')
        
        breakdown.production_notes_html = '<br>'.join(notes) if notes \
            else 'مراجعة الراكورات (Continuity)'
    
    async def _final_validation(self, breakdown: DetailedBreakdown):
        """تدقيق نهائي للبيانات"""
        
        # التأكد من وجود الحقول الأساسية
        if not breakdown.summary:
            breakdown.summary = "ملخص غير متوفر"
        
        if not breakdown.cast:
            breakdown.cast = []
        
        if not breakdown.camera_lighting:
            breakdown.camera_lighting = self._generate_camera_lighting(breakdown)


# ═══════════════════════════════════════════════════════════════════════════
# مُنشئ HTML النهائي (HTML Renderer)
# ═══════════════════════════════════════════════════════════════════════════

class HTMLRenderer:
    """مُنشئ HTML احترافي"""
    
    CSS = """
    @page { size: A4; margin: 12mm; }
    
    :root{
      --ink:#111;
      --muted:#666;
      --soft:#f3f4f6;
      --soft2:#fafafa;
      --accent:#0f172a;
      --line: rgba(0,0,0,0.16);
      --line2: rgba(0,0,0,0.10);
      --tagbg:#eef2ff;
      --tagbd:#c7d2fe;
      --tagtx:#1e3a8a;
    }
    
    html, body {
      padding: 0;
      margin: 0;
      color: var(--ink);
      background: var(--soft2);
      font-family: "Tahoma", "Arial", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body{ counter-reset: page; }
    
    .sheet {
      counter-increment: page;
      width: 210mm;
      min-height: 297mm;
      margin: 12px auto;
      background: #fff;
      box-shadow: 0 10px 28px rgba(0,0,0,0.10);
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 12mm;
      display: flex;
      flex-direction: column;
      gap: 10px;
      break-after: page;
      page-break-after: always;
    }
    .sheet:last-child{
      break-after: auto;
      page-break-after: auto;
    }
    
    .sheet-header{
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 10px;
      padding: 10px 12px;
      background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%);
    }
    
    .sheet-header-top{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }
    
    .sheet-title{
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.2px;
      color: var(--accent);
    }
    
    .sheet-badge{
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(0,0,0,0.15);
      background: #fff;
      color: var(--accent);
      white-space: nowrap;
    }
    
    .sheet-meta{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px 10px;
      font-size: 12px;
      color: var(--muted);
    }
    .meta-item{
      display: flex;
      gap: 6px;
      align-items: baseline;
      white-space: nowrap;
    }
    .meta-label{
      font-weight: 800;
      color: var(--ink);
    }
    
    .sheet-table{
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
      font-size: 12.2px;
    }
    .sheet-table thead th{
      background: var(--soft);
      color: var(--accent);
      font-weight: 800;
      padding: 10px 10px;
      border-bottom: 1px solid var(--line);
    }
    .sheet-table td{
      padding: 9px 10px;
      border-bottom: 1px solid var(--line2);
      vertical-align: top;
      line-height: 1.45;
    }
    .sheet-table tbody tr:last-child td{ border-bottom: none; }
    .sheet-table td.field{
      width: 34%;
      background: #fbfbfb;
      font-weight: 800;
      color: var(--accent);
      border-left: 1px solid var(--line2);
    }
    .sheet-table td.value{
      width: 66%;
      color: var(--ink);
    }
    
    .tag{
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--tagbd);
      background: var(--tagbg);
      color: var(--tagtx);
      margin-inline-start: 6px;
      white-space: nowrap;
    }
    
    .bullets{ margin: 0; padding: 0 18px 0 0; }
    .bullets li{ margin: 0 0 4px 0; }
    
    .muted{ color: var(--muted); font-weight: 700; }
    .alert-text{ color: #b91c1c; font-weight: 700; }
    
    .sheet-footer{
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding-top: 8px;
      border-top: 1px dashed rgba(0,0,0,0.25);
      font-size: 11px;
      color: var(--muted);
    }
    .footer-strong{ color: var(--ink); font-weight: 800; }
    .page-num::before{ content: counter(page); }
    
    @media print{
      body{ background:#fff; }
      .sheet{
        margin: 0;
        width: auto;
        min-height: auto;
        border-radius: 0;
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .sheet-header, .sheet-table{ border-color: rgba(0,0,0,0.25); }
    }
    """
    
    @staticmethod
    def render_scene(scene: DetailedBreakdown, total: int) -> str:
        """تحويل مشهد واحد إلى HTML"""
        
        def esc(s: str) -> str:
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

        <tr><td class="field">ملاحظات (Wardrobe/Notes)</td><td class="value">{scene.production_notes_html}</td></tr>
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
    
    Returns:
        قائمة من (scene_number, scene_text)
    """
    pattern = re.compile(r'(?=^\s*(?:مشهد|scene)\s*\d+)', re.I | re.M)
    blocks = [b.strip() for b in pattern.split(content) if b.strip()]
    
    scenes = []
    num_pattern = re.compile(r'^\s*(?:مشهد|scene)\s*(\d+)', re.I)
    
    for block in blocks:
        match = num_pattern.search(block)
        if match:
            scenes.append((match.group(1), block))
    
    return scenes


# ═══════════════════════════════════════════════════════════════════════════
# الدالة الرئيسية (Main Function)
# ═══════════════════════════════════════════════════════════════════════════

async def main_async(input_path: str, output_path: str):
    """
    الدالة الرئيسية لمعالجة السيناريو
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
    parser = RevolutionarySceneParser()
    
    # تحليل المشاهد
    scenes = []
    for scene_num, scene_text in scenes_data:
        try:
            breakdown = await parser.analyze_scene(scene_text, scene_num)
            scenes.append(breakdown)
        except Exception as e:
            logger.error(f"❌ فشل تحليل المشهد {scene_num}: {e}")
            # استمرار في المعالجة
    
    logger.info("═" * 70)
    logger.info(f"✓ تم تحليل {len(scenes)}/{len(scenes_data)} مشهد بنجاح")
    logger.info("═" * 70)
    
    # توليد HTML
    logger.info("📝 توليد ملف HTML...")
    html_doc = HTMLRenderer.render_full_document(scenes)
    
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


def main(input_path: Optional[str] = None, output_path: Optional[str] = None):
    """
    نقطة الدخول الرئيسية
    """
    # القيم الافتراضية
    if input_path is None:
        input_path = r"E:\agents\script.txt"
    
    if output_path is None:
        output_path = "revolutionary_breakdown_sheets.html"
    
    # التحقق من وجود الملف
    input_file = Path(input_path)
    if not input_file.exists():
        logger.error(f"❌ ملف السيناريو غير موجود: {input_path}")
        logger.info("💡 تأكد من صحة المسار أو مرر مسار الملف كـ argument")
        return
    
    # تشغيل async
    try:
        asyncio.run(main_async(input_path, output_path))
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
        main(input_arg, output_arg)
    else:
        # استخدام المسارات الافتراضية
        main()