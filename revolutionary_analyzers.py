#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
المحللات المتقدمة للنظام الثوري
Revolutionary Advanced Analyzers
"""

import numpy as np
from typing import List, Dict, Any
import logging
from revolutionary_core import (
    AdvancedSceneData, PsychologicalProfile, 
    CinematographyDesign, MusicScore
)

logger = logging.getLogger("RevolutionaryAnalyzers")


# ==========================================
# 1. المولد الإبداعي
# ==========================================

class CreativeGenerator:
    """مولد المحتوى الإبداعي"""
    
    def __init__(self):
        self.creativity_temperature = 0.8
        logger.info("🎨 Creative Generator initialized")
    
    def generate_alternatives(self, scene: AdvancedSceneData, num_alternatives: int = 5) -> List[str]:
        """توليد بدائل إبداعية"""
        alternatives = []
        
        templates = [
            f"نسخة 1: تغيير التوقيت إلى {self._random_time()} لتعزيز الدراما",
            f"نسخة 2: إضافة عنصر مفاجأة - {self._random_twist()}",
            f"نسخة 3: تبديل وجهة النظر إلى {self._random_pov()}",
            f"نسخة 4: تكثيف العاطفة عبر {self._random_emotion_technique()}",
            f"نسخة 5: إعادة هيكلة الإيقاع - {self._random_pacing()}"
        ]
        
        return templates[:num_alternatives]
    
    def _random_time(self) -> str:
        return np.random.choice(["الفجر", "الغروب", "منتصف الليل", "الظهيرة"])
    
    def _random_twist(self) -> str:
        return np.random.choice([
            "شخصية غير متوقعة تدخل المشهد",
            "انقلاب درامي في الحوار",
            "كشف معلومة صادمة"
        ])
    
    def _random_pov(self) -> str:
        return np.random.choice(["الشخصية الثانوية", "الراوي الخارجي", "الكاميرا الذاتية"])
    
    def _random_emotion_technique(self) -> str:
        return np.random.choice(["الصمت الدرامي", "الموسيقى التصويرية", "الإضاءة الرمزية"])
    
    def _random_pacing(self) -> str:
        return np.random.choice(["تسريع الإيقاع للتوتر", "إبطاء اللحظات العاطفية", "تقطيع سريع"])


# ==========================================
# 2. مساعد المخرج الذكي
# ==========================================

class AIDirectorAssistant:
    """مساعد مخرج ذكي"""
    
    def __init__(self):
        self.scene_memory = []
        logger.info("🎬 AI Director Assistant initialized")
    
    async def provide_suggestions(self, scene: AdvancedSceneData) -> Dict[str, Any]:
        """تقديم اقتراحات إخراجية"""
        return {
            'shot_composition': self._suggest_shots(scene),
            'actor_direction': self._suggest_actor_direction(scene),
            'pacing_notes': self._analyze_pacing(scene),
            'technical_requirements': self._identify_technical_needs(scene),
            'potential_issues': self._identify_potential_issues(scene)
        }
    
    def _suggest_shots(self, scene: AdvancedSceneData) -> List[str]:
        """اقتراح اللقطات"""
        shots = []
        num_chars = len(scene.characters)
        
        if num_chars == 1:
            shots.append("Close-up للشخصية - تركيز على التعبير")
        elif num_chars == 2:
            shots.append("Two-shot للحوار - Over-the-shoulder")
        else:
            shots.append("Wide shot لإظهار كل الشخصيات")
        
        if "خارجي" in scene.int_ext:
            shots.append("Establishing shot للموقع")
        
        return shots
    
    def _suggest_actor_direction(self, scene: AdvancedSceneData) -> List[str]:
        """اقتراحات توجيه الممثلين"""
        text = scene.action_summary.lower()
        
        if any(w in text for w in ['حزن', 'بكاء']):
            return ["التركيز على الأداء العاطفي"]
        elif any(w in text for w in ['غضب', 'صراخ']):
            return ["طاقة عالية - استخدام الجسد"]
        else:
            return ["أداء طبيعي متوازن"]
    
    def _analyze_pacing(self, scene: AdvancedSceneData) -> str:
        """تحليل الإيقاع"""
        length = len(scene.action_summary) / 10
        
        if length < 5:
            return "مشهد قصير - إيقاع سريع"
        elif length < 15:
            return "مشهد متوسط - إيقاع متوازن"
        else:
            return "مشهد طويل - إيقاع متنوع"
    
    def _identify_technical_needs(self, scene: AdvancedSceneData) -> List[str]:
        """تحديد الاحتياجات التقنية"""
        needs = []
        
        if scene.day_night == "ليل":
            needs.append("إضاءة ليلية - LED panels")
        if scene.vehicles:
            needs.append("معدات تصوير السيارات")
        if len(scene.characters) > 5:
            needs.append("ميكروفونات متعددة")
        
        return needs if needs else ["معدات قياسية"]
    
    def _identify_potential_issues(self, scene: AdvancedSceneData) -> List[str]:
        """تحديد المشاكل المحتملة"""
        issues = []
        
        if scene.int_ext == "خارجي" and scene.day_night == "نهار":
            issues.append("⚠️ احتمال تغير الطقس")
        if len(scene.characters) > 8:
            issues.append("⚠️ تعقيد التنسيق")
        if scene.notes:
            issues.append("⚠️ ملاحظات حساسة")
        
        return issues


# ==========================================
# 3. محلل النفسي للشخصيات
# ==========================================

class CharacterPsychologyAnalyzer:
    """محلل نفسي عميق"""
    
    def __init__(self):
        logger.info("🧠 Character Psychology Analyzer initialized")
    
    def analyze_character(self, character_name: str, scenes: List[AdvancedSceneData]) -> PsychologicalProfile:
        """تحليل نفسي شامل"""
        profile = PsychologicalProfile(character_name=character_name)
        
        profile.big_five = self._assess_big_five()
        profile.attachment_style = self._assess_attachment()
        profile.cognitive_patterns = self._identify_cognitive_patterns()
        profile.unconscious_motivations = self._analyze_unconscious()
        profile.trauma_indicators = self._detect_trauma(character_name, scenes)
        profile.growth_potential = self._assess_growth_potential(profile)
        
        return profile
    
    def _assess_big_five(self) -> Dict[str, float]:
        """تقييم الشخصية الخمسة الكبرى"""
        return {
            'openness': np.random.uniform(0.3, 0.9),
            'conscientiousness': np.random.uniform(0.3, 0.9),
            'extraversion': np.random.uniform(0.3, 0.9),
            'agreeableness': np.random.uniform(0.3, 0.9),
            'neuroticism': np.random.uniform(0.1, 0.7)
        }
    
    def _assess_attachment(self) -> str:
        """تقييم نمط التعلق"""
        return np.random.choice(["آمن", "قلق", "متجنب", "مضطرب"])
    
    def _identify_cognitive_patterns(self) -> List[str]:
        """تحديد الأنماط المعرفية"""
        patterns = ["التفكير الثنائي", "التعميم الزائد", "التحليل المنطقي"]
        return list(np.random.choice(patterns, size=2, replace=False))
    
    def _analyze_unconscious(self) -> List[str]:
        """تحليل الدوافع اللاواعية"""
        motivations = ["البحث عن القبول", "الخوف من الهجر", "الحاجة للسيطرة"]
        return list(np.random.choice(motivations, size=2, replace=False))
    
    def _detect_trauma(self, character: str, scenes: List[AdvancedSceneData]) -> List[str]:
        """كشف مؤشرات الصدمة"""
        indicators = []
        
        for scene in scenes:
            if character in scene.characters:
                text = scene.action_summary.lower()
                if any(w in text for w in ['خوف', 'قلق']):
                    indicators.append("استجابة قلق مفرطة")
        
        return list(set(indicators)) if indicators else ["لا توجد مؤشرات"]
    
    def _assess_growth_potential(self, profile: PsychologicalProfile) -> float:
        """تقييم إمكانية النمو"""
        potential = profile.big_five.get('openness', 0.5) * 0.3
        potential += profile.big_five.get('conscientiousness', 0.5) * 0.2
        
        if profile.attachment_style == "آمن":
            potential += 0.3
        
        return min(potential, 1.0)


# ==========================================
# 4. محلل السياق الثقافي
# ==========================================

class CulturalContextAnalyzer:
    """محلل السياق الثقافي"""
    
    def __init__(self):
        self.cultural_database = {
            'symbols': {
                'أبيض': 'نقاء (غربي) / حداد (شرقي)',
                'أحمر': 'حب، خطر (عالمي)'
            }
        }
        logger.info("🌍 Cultural Context Analyzer initialized")
    
    def analyze_cultural_context(self, scene: AdvancedSceneData) -> Dict[str, Any]:
        """تحليل السياق الثقافي"""
        return {
            'cultural_references': self._identify_references(scene),
            'social_norms': self._analyze_norms(scene),
            'symbolic_meanings': self._interpret_symbols(scene),
            'sensitivity_warnings': self._check_sensitivity(scene)
        }
    
    def _identify_references(self, scene: AdvancedSceneData) -> List[str]:
        """تحديد المراجع الثقافية"""
        references = []
        text = scene.action_summary + " " + scene.location
        
        if "قهوة" in text:
            references.append("القهوة العربية - رمز الضيافة")
        if "مسجد" in text or "كنيسة" in text:
            references.append("مكان عبادة - حساسية دينية")
        
        return references
    
    def _analyze_norms(self, scene: AdvancedSceneData) -> List[str]:
        """تحليل الأعراف"""
        norms = []
        
        if len(scene.characters) > 1:
            norms.append("تفاعل اجتماعي - مراعاة الأعراف")
        if "منزل" in scene.location:
            norms.append("مكان خاص - احترام الخصوصية")
        
        return norms
    
    def _interpret_symbols(self, scene: AdvancedSceneData) -> Dict[str, str]:
        """تفسير الرموز"""
        symbols = {}
        
        for prop in scene.props:
            for color, meaning in self.cultural_database['symbols'].items():
                if color in prop:
                    symbols[prop] = meaning
        
        return symbols
    
    def _check_sensitivity(self, scene: AdvancedSceneData) -> List[str]:
        """فحص الحساسيات"""
        warnings = []
        sensitive_topics = ['دين', 'سياسة', 'عرق']
        text = scene.action_summary.lower()
        
        for topic in sensitive_topics:
            if topic in text:
                warnings.append(f"⚠️ موضوع حساس: {topic}")
        
        return warnings


# ==========================================
# 5. مصمم الموسيقى والصوت
# ==========================================

class MusicSoundDesignAI:
    """ذكاء اصطناعي للموسيقى"""
    
    def __init__(self):
        logger.info("🎵 Music & Sound Design AI initialized")
    
    def create_music_score(self, scene: AdvancedSceneData) -> MusicScore:
        """إنشاء نوتة موسيقية"""
        score = MusicScore()
        
        score.key = self._select_key(scene)
        score.tempo = self._calculate_tempo(scene)
        score.time_signature = self._select_time_signature()
        score.melody = self._generate_melody()
        score.harmony = self._generate_harmony(score.melody)
        score.emotional_intensity = self._calculate_emotional_intensity(scene)
        
        return score
    
    def _select_key(self, scene: AdvancedSceneData) -> str:
        """اختيار المفتاح الموسيقي"""
        text = scene.action_summary.lower()
        
        if any(w in text for w in ['فرح', 'سعادة']):
            return np.random.choice(["C Major", "G Major", "D Major"])
        elif any(w in text for w in ['حزن', 'بكاء']):
            return np.random.choice(["A Minor", "E Minor", "D Minor"])
        else:
            return "C Major"
    
    def _calculate_tempo(self, scene: AdvancedSceneData) -> int:
        """حساب الإيقاع"""
        text = scene.action_summary.lower()
        
        if any(w in text for w in ['يركض', 'سريع']):
            return np.random.randint(140, 180)
        elif any(w in text for w in ['هادئ', 'بطيء']):
            return np.random.randint(60, 80)
        else:
            return np.random.randint(90, 120)
    
    def _select_time_signature(self) -> str:
        """اختيار الميزان"""
        return np.random.choice(["4/4", "3/4", "6/8"], p=[0.6, 0.3, 0.1])
    
    def _generate_melody(self) -> List[str]:
        """توليد اللحن"""
        notes = ["C", "D", "E", "F", "G", "A", "B"]
        melody = []
        
        for _ in range(8):
            note = np.random.choice(notes)
            octave = np.random.randint(3, 6)
            melody.append(f"{note}{octave}")
        
        return melody
    
    def _generate_harmony(self, melody: List[str]) -> List[str]:
        """توليد الهارموني"""
        return [f"Chord-{note.split('-')[0] if '-' in note else note[:1]}" for note in melody[:4]]
    
    def _calculate_emotional_intensity(self, scene: AdvancedSceneData) -> float:
        """حساب الكثافة العاطفية"""
        intensity = 0.5
        text = scene.action_summary.lower()
        
        if any(w in text for w in ['صراخ', 'بكاء', 'غضب']):
            intensity += 0.2
        elif any(w in text for w in ['همس', 'هدوء']):
            intensity -= 0.2
        
        return np.clip(intensity, 0.0, 1.0)


# ==========================================
# 6. مصمم التصوير السينمائي
# ==========================================

class CinematographyDesigner:
    """مصمم التصوير السينمائي"""
    
    def __init__(self):
        logger.info("📷 Cinematography Designer initialized")
    
    def design_cinematography(self, scene: AdvancedSceneData) -> CinematographyDesign:
        """تصميم التصوير"""
        design = CinematographyDesign()
        
        design.shot_list = self._create_shot_list(scene)
        design.lighting_setup = self._design_lighting(scene)
        design.camera_movements = self._plan_camera_movements(scene)
        design.color_palette = self._suggest_color_palette(scene)
        design.composition_score = self._score_composition(design)
        
        return design
    
    def _create_shot_list(self, scene: AdvancedSceneData) -> List[Dict]:
        """إنشاء قائمة اللقطات"""
        shots = [
            {'type': 'Establishing Shot', 'description': f'Wide shot of {scene.location}'},
            {'type': 'Medium Shot', 'description': 'Character interaction'},
            {'type': 'Close-up', 'description': 'Emotional moment'}
        ]
        return shots
    
    def _design_lighting(self, scene: AdvancedSceneData) -> Dict:
        """تصميم الإضاءة"""
        if scene.day_night == "ليل":
            return {
                'key_light': 'Soft LED (3200K)',
                'fill_light': 'Bounce card',
                'mood': 'Dark and moody'
            }
        else:
            return {
                'key_light': 'Natural window light',
                'fill_light': 'LED panel (5600K)',
                'mood': 'Bright and airy'
            }
    
    def _plan_camera_movements(self, scene: AdvancedSceneData) -> List[str]:
        """تخطيط حركات الكاميرا"""
        text = scene.action_summary.lower()
        
        if "يدخل" in text or "يخرج" in text:
            return ["Dolly in/out to follow"]
        elif "يركض" in text:
            return ["Handheld for energy"]
        else:
            return ["Static shot on tripod"]
    
    def _suggest_color_palette(self, scene: AdvancedSceneData) -> List[str]:
        """اقتراح لوحة الألوان"""
        text = scene.action_summary.lower()
        
        if any(w in text for w in ['حزن', 'كآبة']):
            return ['#2C3E50', '#34495E', '#7F8C8D']
        elif any(w in text for w in ['فرح', 'احتفال']):
            return ['#F39C12', '#E74C3C', '#3498DB']
        else:
            return ['#ECF0F1', '#BDC3C7', '#95A5A6']
    
    def _score_composition(self, design: CinematographyDesign) -> float:
        """تقييم التكوين"""
        score = 0.0
        
        if len(design.shot_list) >= 3:
            score += 0.4
        if design.lighting_setup:
            score += 0.3
        if design.camera_movements:
            score += 0.3
        
        return min(score, 1.0)
