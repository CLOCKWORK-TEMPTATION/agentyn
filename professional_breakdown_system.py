#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نظام Breakdown احترافي مستوحى من Celtx
Professional Script Breakdown System Inspired by Industry Standards

مبني على تحليل محاضرة Celtx + النظام الثوري
"""

import asyncio
import re
import logging
import aiofiles
from dataclasses import dataclass, field
from typing import List, Set, Dict, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import json

# استيراد النظام الثوري
from revolutionary_core import (
    AdvancedSceneData, QuantumSceneAnalyzer, NeuromorphicProcessor,
    SwarmIntelligenceAnalyzer, EvolutionaryOptimizer, ConsciousnessSimulator
)

from revolutionary_analyzers import (
    CreativeGenerator, AIDirectorAssistant, CharacterPsychologyAnalyzer,
    CulturalContextAnalyzer, MusicSoundDesignAI, CinematographyDesigner
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger("ProfessionalBreakdown")


# ==========================================
# نظام الألوان والفئات (Celtx Standard)
# ==========================================

class BreakdownCategory(Enum):
    """فئات الـ Breakdown حسب معايير الصناعة"""
    CAST = ("cast", "#FF6B6B", "👥")  # أحمر
    EXTRAS = ("extras", "#4ECDC4", "👤")  # سماوي
    PROPS = ("props", "#95E1D3", "📦")  # أخضر فاتح
    VEHICLES = ("vehicles", "#F38181", "🚗")  # وردي
    WARDROBE = ("wardrobe", "#AA96DA", "👔")  # بنفسجي
    MAKEUP = ("makeup", "#FCBAD3", "💄")  # وردي فاتح
    SPECIAL_EFFECTS = ("special_effects", "#FFFFD2", "✨")  # أصفر
    SOUND = ("sound", "#A8D8EA", "🔊")  # أزرق فاتح
    MUSIC = ("music", "#FFCCCC", "🎵")  # وردي ناعم
    ANIMALS = ("animals", "#C7CEEA", "🐾")  # بنفسجي فاتح
    STUNTS = ("stunts", "#FF8B94", "🤸")  # أحمر فاتح
    SPECIAL_EQUIPMENT = ("special_equipment", "#B4F8C8", "🎬")  # أخضر
    SECURITY = ("security", "#FBE7C6", "🛡️")  # بيج
    ADDITIONAL_LABOR = ("additional_labor", "#A0E7E5", "👷")  # فيروزي
    SET_DRESSING = ("set_dressing", "#FFAEBC", "🏠")  # وردي
    GREENERY = ("greenery", "#B4F8C8", "🌿")  # أخضر
    LOCATION = ("location", "#FFD3B6", "📍")  # برتقالي فاتح
    
    def __init__(self, key, color, icon):
        self.key = key
        self.color = color
        self.icon = icon


class ScriptVersion(Enum):
    """ألوان إصدارات السيناريو (WGA Standard)"""
    WHITE = (1, "white", "#FFFFFF")  # الإصدار الأول
    BLUE = (2, "blue", "#ADD8E6")
    PINK = (3, "pink", "#FFB6C1")
    YELLOW = (4, "yellow", "#FFFFE0")
    GREEN = (5, "green", "#90EE90")
    GOLDENROD = (6, "goldenrod", "#DAA520")
    BUFF = (7, "buff", "#F0DC82")
    SALMON = (8, "salmon", "#FA8072")
    CHERRY = (9, "cherry", "#DE3163")
    
    def __init__(self, number, version_name, color):
        self.number = number
        self.version_name = version_name
        self.color = color


# ==========================================
# نماذج البيانات الاحترافية
# ==========================================

@dataclass
class BreakdownElement:
    """عنصر في الـ Breakdown"""
    name: str
    category: BreakdownCategory
    description: str = ""
    quantity: int = 1
    notes: List[str] = field(default_factory=list)
    budget_estimate: float = 0.0
    source_scene: str = ""
    is_critical: bool = False  # عنصر حرج للإنتاج
    
    def to_dict(self):
        return {
            'name': self.name,
            'category': self.category.key,
            'description': self.description,
            'quantity': self.quantity,
            'notes': self.notes,
            'budget_estimate': self.budget_estimate,
            'source_scene': self.source_scene,
            'is_critical': self.is_critical
        }


@dataclass
class SceneBreakdown:
    """Breakdown كامل لمشهد واحد"""
    scene_number: str
    scene_heading: str
    int_ext: str
    day_night: str
    location: str
    page_count: float  # بالأثمان (1/8)
    estimated_shoot_time: float = 0.0  # بالساعات
    
    # العناصر
    elements: List[BreakdownElement] = field(default_factory=list)
    cast: Set[str] = field(default_factory=set)
    
    # ملاحظات الإنتاج
    production_notes: List[str] = field(default_factory=list)
    location_notes: str = ""
    special_requirements: List[str] = field(default_factory=list)
    
    # التحليل الثوري
    ai_analysis: Optional[AdvancedSceneData] = None
    
    # معلومات الجدولة
    shoot_day: Optional[int] = None
    shoot_date: Optional[datetime] = None
    strip_color: str = "#FFFFFF"
    
    def calculate_eighths(self, page_length: int) -> float:
        """حساب الأثمان (1/8 of a page)"""
        # القاعدة: كل صفحة = 8 أثمان
        return round(page_length / 8, 1)
    
    def get_elements_by_category(self, category: BreakdownCategory) -> List[BreakdownElement]:
        """الحصول على العناصر حسب الفئة"""
        return [e for e in self.elements if e.category == category]


@dataclass
class ShootingDay:
    """يوم تصوير كامل"""
    day_number: int
    date: datetime
    scenes: List[SceneBreakdown] = field(default_factory=list)
    total_pages: float = 0.0
    location: str = ""
    notes: List[str] = field(default_factory=list)
    
    def calculate_total_pages(self):
        """حساب إجمالي الصفحات"""
        self.total_pages = sum(scene.page_count for scene in self.scenes)
        return self.total_pages


@dataclass
class ProductionCatalog:
    """كتالوج الإنتاج الشامل (مثل Celtx Catalog)"""
    props: List[BreakdownElement] = field(default_factory=list)
    vehicles: List[BreakdownElement] = field(default_factory=list)
    wardrobe: List[BreakdownElement] = field(default_factory=list)
    locations: List[BreakdownElement] = field(default_factory=list)
    cast: List[BreakdownElement] = field(default_factory=list)
    special_equipment: List[BreakdownElement] = field(default_factory=list)
    
    def add_element(self, element: BreakdownElement):
        """إضافة عنصر للكتالوج"""
        if element.category == BreakdownCategory.PROPS:
            self.props.append(element)
        elif element.category == BreakdownCategory.VEHICLES:
            self.vehicles.append(element)
        elif element.category == BreakdownCategory.WARDROBE:
            self.wardrobe.append(element)
        elif element.category == BreakdownCategory.LOCATION:
            self.locations.append(element)
        elif element.category == BreakdownCategory.CAST:
            self.cast.append(element)
        elif element.category == BreakdownCategory.SPECIAL_EQUIPMENT:
            self.special_equipment.append(element)
    
    def get_total_budget(self) -> float:
        """حساب الميزانية الإجمالية"""
        all_elements = (self.props + self.vehicles + self.wardrobe + 
                       self.locations + self.cast + self.special_equipment)
        return sum(e.budget_estimate for e in all_elements)


# ==========================================
# محلل Breakdown احترافي
# ==========================================

class ProfessionalBreakdownAnalyzer:
    """محلل Breakdown احترافي يجمع بين معايير الصناعة والذكاء الاصطناعي"""
    
    def __init__(self):
        logger.info("=" * 80)
        logger.info("🎬 PROFESSIONAL BREAKDOWN SYSTEM - INITIALIZING")
        logger.info("=" * 80)
        
        # النظام الثوري
        self.quantum = QuantumSceneAnalyzer(num_qubits=8)
        self.neuromorphic = NeuromorphicProcessor(num_neurons=1000)
        self.swarm = SwarmIntelligenceAnalyzer(num_agents=50)
        self.director = AIDirectorAssistant()
        self.cinematography = CinematographyDesigner()
        
        # قواعد الاستخراج
        self.prop_keywords = {
            'لابتوب', 'حاسب', 'موبايل', 'هاتف', 'ظرف', 'رسالة', 'كتاب',
            'مفتاح', 'حقيبة', 'شنطة', 'كأس', 'فنجان', 'صحن', 'طبق',
            'سلاح', 'مسدس', 'سكين', 'ورقة', 'قلم', 'نظارة', 'ساعة'
        }
        
        self.vehicle_keywords = {
            'سيارة', 'عربية', 'تاكسي', 'أتوبيس', 'ميكروباص', 
            'موتوسيكل', 'دراجة', 'طائرة', 'قارب'
        }
        
        logger.info("✅ Professional Breakdown System initialized!")
    
    def analyze_scene_professional(self, scene_text: str, scene_number: str) -> SceneBreakdown:
        """تحليل مشهد بشكل احترافي"""
        
        # استخراج المعلومات الأساسية
        heading_match = re.search(r'(داخلي|خارجي|INT|EXT).*?(ليل|نهار|DAY|NIGHT)', scene_text)
        
        breakdown = SceneBreakdown(
            scene_number=scene_number,
            scene_heading=scene_text.split('\n')[0] if scene_text else "",
            int_ext="داخلي" if heading_match and "داخلي" in heading_match.group(1) else "خارجي",
            day_night="ليل" if heading_match and "ليل" in heading_match.group(2) else "نهار",
            location=self._extract_location(scene_text),
            page_count=self._calculate_page_eighths(scene_text)
        )
        
        # استخراج العناصر
        breakdown.elements = self._extract_elements(scene_text, scene_number)
        breakdown.cast = self._extract_cast(scene_text)
        
        # ملاحظات الإنتاج
        breakdown.production_notes = self._generate_production_notes(breakdown)
        breakdown.special_requirements = self._identify_special_requirements(scene_text)
        
        # تقدير وقت التصوير
        breakdown.estimated_shoot_time = self._estimate_shoot_time(breakdown)
        
        return breakdown
    
    def _extract_location(self, text: str) -> str:
        """استخراج الموقع"""
        lines = text.split('\n')
        if len(lines) > 0:
            # محاولة استخراج الموقع من الهيدر
            header = lines[0]
            # إزالة الكلمات الشائعة
            location = re.sub(r'(مشهد|Scene|\d+|داخلي|خارجي|INT|EXT|ليل|نهار|DAY|NIGHT|-)', '', header)
            return location.strip()
        return "غير محدد"
    
    def _calculate_page_eighths(self, text: str) -> float:
        """حساب عدد الأثمان (1/8 of page)"""
        # تقدير تقريبي: كل 10 أسطر = 1/8 صفحة
        lines = len(text.split('\n'))
        eighths = lines / 10
        return round(eighths, 1)
    
    def _extract_elements(self, text: str, scene_number: str) -> List[BreakdownElement]:
        """استخراج عناصر الـ Breakdown"""
        elements = []
        text_lower = text.lower()
        
        # استخراج الأدوات (Props)
        for prop in self.prop_keywords:
            if prop in text_lower:
                elements.append(BreakdownElement(
                    name=prop,
                    category=BreakdownCategory.PROPS,
                    description=f"يظهر في المشهد {scene_number}",
                    source_scene=scene_number
                ))
        
        # استخراج المركبات
        for vehicle in self.vehicle_keywords:
            if vehicle in text_lower:
                elements.append(BreakdownElement(
                    name=vehicle,
                    category=BreakdownCategory.VEHICLES,
                    description=f"مطلوب للمشهد {scene_number}",
                    source_scene=scene_number,
                    is_critical=True
                ))
        
        return elements
    
    def _extract_cast(self, text: str) -> Set[str]:
        """استخراج الشخصيات"""
        cast = set()
        
        # البحث عن أسماء الشخصيات (عادة قبل ":")
        dialogue_pattern = r'([A-Za-z\u0600-\u06FF\s]+):'
        matches = re.findall(dialogue_pattern, text)
        
        for match in matches:
            name = match.strip()
            if len(name) > 2 and len(name.split()) <= 3:
                cast.add(name)
        
        return cast
    
    def _generate_production_notes(self, breakdown: SceneBreakdown) -> List[str]:
        """توليد ملاحظات الإنتاج"""
        notes = []
        
        # ملاحظات حسب الوقت
        if breakdown.day_night == "ليل":
            notes.append("⚠️ تصوير ليلي - يتطلب إضاءة إضافية")
        
        # ملاحظات حسب المكان
        if breakdown.int_ext == "خارجي":
            notes.append("🌤️ تصوير خارجي - خطة بديلة للطقس السيء")
        
        # ملاحظات حسب عدد الشخصيات
        if len(breakdown.cast) > 5:
            notes.append("👥 مشهد جماعي - يتطلب وقت إضافي للتنسيق")
        
        # ملاحظات حسب المركبات
        vehicles = breakdown.get_elements_by_category(BreakdownCategory.VEHICLES)
        if vehicles:
            notes.append("🚗 يتطلب معدات تصوير السيارات (car rig)")
        
        return notes
    
    def _identify_special_requirements(self, text: str) -> List[str]:
        """تحديد المتطلبات الخاصة"""
        requirements = []
        text_lower = text.lower()
        
        # كلمات مفتاحية للمتطلبات الخاصة
        if any(word in text_lower for word in ['انفجار', 'حريق', 'تفجير']):
            requirements.append("🔥 مؤثرات خاصة - انفجار/حريق")
        
        if any(word in text_lower for word in ['مطاردة', 'يركض', 'قفز']):
            requirements.append("🤸 Stunt Coordinator مطلوب")
        
        if any(word in text_lower for word in ['مطر', 'ثلج', 'عاصفة']):
            requirements.append("🌧️ مؤثرات طقس")
        
        if any(word in text_lower for word in ['دم', 'جرح', 'إصابة']):
            requirements.append("💉 مكياج خاص (SFX Makeup)")
        
        return requirements
    
    def _estimate_shoot_time(self, breakdown: SceneBreakdown) -> float:
        """تقدير وقت التصوير بالساعات"""
        # القاعدة الأساسية: 1/8 صفحة = 15 دقيقة
        base_time = breakdown.page_count * 0.25  # ساعات
        
        # عوامل إضافية
        if len(breakdown.cast) > 3:
            base_time *= 1.3  # زيادة 30% للمشاهد الجماعية
        
        if breakdown.int_ext == "خارجي":
            base_time *= 1.2  # زيادة 20% للتصوير الخارجي
        
        if breakdown.special_requirements:
            base_time *= 1.5  # زيادة 50% للمتطلبات الخاصة
        
        return round(base_time, 1)
    
    async def create_shooting_schedule(self, breakdowns: List[SceneBreakdown], 
                                      start_date: datetime) -> List[ShootingDay]:
        """إنشاء جدول التصوير"""
        logger.info("📅 Creating shooting schedule...")
        
        schedule = []
        current_day = 1
        current_date = start_date
        daily_scenes = []
        daily_pages = 0.0
        
        # القاعدة: 3-5 صفحات في اليوم
        MAX_PAGES_PER_DAY = 5.0
        
        for breakdown in breakdowns:
            # إذا تجاوزنا الحد اليومي، ابدأ يوم جديد
            if daily_pages + breakdown.page_count > MAX_PAGES_PER_DAY and daily_scenes:
                day = ShootingDay(
                    day_number=current_day,
                    date=current_date,
                    scenes=daily_scenes.copy()
                )
                day.calculate_total_pages()
                schedule.append(day)
                
                # يوم جديد
                current_day += 1
                current_date += timedelta(days=1)
                daily_scenes = []
                daily_pages = 0.0
            
            # إضافة المشهد لليوم الحالي
            breakdown.shoot_day = current_day
            breakdown.shoot_date = current_date
            daily_scenes.append(breakdown)
            daily_pages += breakdown.page_count
        
        # إضافة اليوم الأخير
        if daily_scenes:
            day = ShootingDay(
                day_number=current_day,
                date=current_date,
                scenes=daily_scenes
            )
            day.calculate_total_pages()
            schedule.append(day)
        
        logger.info(f"✅ Schedule created: {len(schedule)} shooting days")
        return schedule
    
    def create_production_catalog(self, breakdowns: List[SceneBreakdown]) -> ProductionCatalog:
        """إنشاء كتالوج الإنتاج"""
        logger.info("📚 Creating production catalog...")
        
        catalog = ProductionCatalog()
        
        # تجميع كل العناصر من كل المشاهد
        for breakdown in breakdowns:
            for element in breakdown.elements:
                catalog.add_element(element)
        
        logger.info(f"✅ Catalog created:")
        logger.info(f"   - Props: {len(catalog.props)}")
        logger.info(f"   - Vehicles: {len(catalog.vehicles)}")
        logger.info(f"   - Locations: {len(catalog.locations)}")
        
        return catalog


# ==========================================
# محرك HTML للـ Breakdown Sheets
# ==========================================

class BreakdownSheetRenderer:
    """محرك عرض Breakdown Sheets احترافي"""
    
    CSS = """
    :root {
        --primary: #2c3e50;
        --accent: #3498db;
        --success: #27ae60;
        --warning: #f39c12;
        --danger: #e74c3c;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
        font-family: 'Courier New', monospace;
        background: #ecf0f1;
        padding: 20px;
        direction: rtl;
    }
    
    .breakdown-sheet {
        background: white;
        max-width: 900px;
        margin: 20px auto;
        padding: 30px;
        border: 2px solid #2c3e50;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        page-break-after: always;
    }
    
    .sheet-header {
        border-bottom: 3px solid #2c3e50;
        padding-bottom: 15px;
        margin-bottom: 20px;
    }
    
    .sheet-title {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
    }
    
    .scene-info {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        margin: 15px 0;
        padding: 15px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
    }
    
    .info-item {
        font-weight: bold;
    }
    
    .info-label {
        color: #6c757d;
        font-size: 12px;
    }
    
    .category-section {
        margin: 20px 0;
        padding: 15px;
        border-right: 4px solid;
    }
    
    .category-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .element-list {
        list-style: none;
        padding-right: 20px;
    }
    
    .element-item {
        padding: 8px;
        margin: 5px 0;
        background: #f8f9fa;
        border-radius: 4px;
    }
    
    .production-notes {
        background: #fff3cd;
        border: 2px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
    }
    
    .notes-title {
        font-weight: bold;
        color: #856404;
        margin-bottom: 10px;
    }
    
    .page-count {
        text-align: center;
        padding: 10px;
        background: #e9ecef;
        font-weight: bold;
        margin-top: 20px;
    }
    
    @media print {
        body { background: white; }
        .breakdown-sheet { box-shadow: none; }
    }
    """
    
    @staticmethod
    def render_breakdown_sheet(breakdown: SceneBreakdown) -> str:
        """عرض Breakdown Sheet لمشهد واحد"""
        
        # تجميع العناصر حسب الفئة
        elements_by_category = {}
        for element in breakdown.elements:
            cat = element.category
            if cat not in elements_by_category:
                elements_by_category[cat] = []
            elements_by_category[cat].append(element)
        
        # بناء HTML للعناصر
        categories_html = ""
        for category, elements in elements_by_category.items():
            elements_list = "".join([
                f'<li class="element-item">• {e.name} {f"({e.description})" if e.description else ""}</li>'
                for e in elements
            ])
            
            categories_html += f"""
            <div class="category-section" style="border-color: {category.color}">
                <div class="category-title">
                    <span>{category.icon}</span>
                    <span>{category.key.upper()}</span>
                </div>
                <ul class="element-list">{elements_list}</ul>
            </div>
            """
        
        # ملاحظات الإنتاج
        notes_html = ""
        if breakdown.production_notes or breakdown.special_requirements:
            all_notes = breakdown.production_notes + breakdown.special_requirements
            notes_list = "".join([f"<li>• {note}</li>" for note in all_notes])
            notes_html = f"""
            <div class="production-notes">
                <div class="notes-title">⚠️ ملاحظات الإنتاج</div>
                <ul>{notes_list}</ul>
            </div>
            """
        
        # الشخصيات
        cast_html = ", ".join(breakdown.cast) if breakdown.cast else "غير محدد"
        
        return f"""
        <div class="breakdown-sheet">
            <div class="sheet-header">
                <div class="sheet-title">BREAKDOWN SHEET</div>
                <div class="sheet-title">مشهد {breakdown.scene_number}</div>
            </div>
            
            <div class="scene-info">
                <div class="info-item">
                    <div class="info-label">INT/EXT</div>
                    <div>{breakdown.int_ext}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">DAY/NIGHT</div>
                    <div>{breakdown.day_night}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">LOCATION</div>
                    <div>{breakdown.location}</div>
                </div>
            </div>
            
            <div class="scene-info">
                <div class="info-item">
                    <div class="info-label">PAGE COUNT</div>
                    <div>{breakdown.page_count}/8</div>
                </div>
                <div class="info-item">
                    <div class="info-label">EST. SHOOT TIME</div>
                    <div>{breakdown.estimated_shoot_time} hours</div>
                </div>
                <div class="info-item">
                    <div class="info-label">SHOOT DAY</div>
                    <div>{breakdown.shoot_day if breakdown.shoot_day else 'TBD'}</div>
                </div>
            </div>
            
            <div class="category-section" style="border-color: #FF6B6B">
                <div class="category-title">
                    <span>👥</span>
                    <span>CAST</span>
                </div>
                <div>{cast_html}</div>
            </div>
            
            {categories_html}
            {notes_html}
            
            <div class="page-count">
                Total: {breakdown.page_count}/8 of a page
            </div>
        </div>
        """
    
    @staticmethod
    def render_full_report(breakdowns: List[SceneBreakdown], 
                          schedule: List[ShootingDay],
                          catalog: ProductionCatalog) -> str:
        """عرض التقرير الكامل"""
        
        # Breakdown Sheets لكل مشهد
        sheets_html = "".join([
            BreakdownSheetRenderer.render_breakdown_sheet(b) 
            for b in breakdowns
        ])
        
        # جدول التصوير
        schedule_html = BreakdownSheetRenderer._render_schedule(schedule)
        
        # الكتالوج
        catalog_html = BreakdownSheetRenderer._render_catalog(catalog)
        
        return f"""<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <title>Professional Breakdown Report</title>
    <style>{BreakdownSheetRenderer.CSS}</style>
</head>
<body>
    <div class="breakdown-sheet">
        <h1 style="text-align: center;">📋 PRODUCTION BREAKDOWN REPORT</h1>
        <h2 style="text-align: center;">تقرير الـ Breakdown الاحترافي</h2>
    </div>
    
    {schedule_html}
    {sheets_html}
    {catalog_html}
</body>
</html>"""
    
    @staticmethod
    def _render_schedule(schedule: List[ShootingDay]) -> str:
        """عرض جدول التصوير"""
        rows = ""
        for day in schedule:
            scenes_list = ", ".join([s.scene_number for s in day.scenes])
            rows += f"""
            <tr>
                <td>Day {day.day_number}</td>
                <td>{day.date.strftime('%Y-%m-%d')}</td>
                <td>{scenes_list}</td>
                <td>{day.total_pages}/8</td>
            </tr>
            """
        
        return f"""
        <div class="breakdown-sheet">
            <h2>📅 SHOOTING SCHEDULE</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #2c3e50; color: white;">
                        <th style="padding: 10px;">Day</th>
                        <th style="padding: 10px;">Date</th>
                        <th style="padding: 10px;">Scenes</th>
                        <th style="padding: 10px;">Pages</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
        """
    
    @staticmethod
    def _render_catalog(catalog: ProductionCatalog) -> str:
        """عرض الكتالوج"""
        
        props_list = "".join([f"<li>• {p.name}</li>" for p in catalog.props])
        vehicles_list = "".join([f"<li>• {v.name}</li>" for v in catalog.vehicles])
        
        return f"""
        <div class="breakdown-sheet">
            <h2>📚 PRODUCTION CATALOG</h2>
            
            <div class="category-section" style="border-color: #95E1D3">
                <div class="category-title">📦 PROPS ({len(catalog.props)})</div>
                <ul>{props_list if props_list else '<li>لا يوجد</li>'}</ul>
            </div>
            
            <div class="category-section" style="border-color: #F38181">
                <div class="category-title">🚗 VEHICLES ({len(catalog.vehicles)})</div>
                <ul>{vehicles_list if vehicles_list else '<li>لا يوجد</li>'}</ul>
            </div>
            
            <div class="page-count">
                Total Budget Estimate: ${catalog.get_total_budget():,.2f}
            </div>
        </div>
        """


# ==========================================
# النظام الرئيسي
# ==========================================

async def main():
    """الدالة الرئيسية"""
    logger.info("🎬 Starting Professional Breakdown System...")
    
    # قراءة السيناريو
    try:
        async with aiofiles.open("script.txt", 'r', encoding='utf-8') as f:
            content = await f.read()
    except FileNotFoundError:
        logger.error("❌ File not found: script.txt")
        return
    
    # تحليل المشاهد
    analyzer = ProfessionalBreakdownAnalyzer()
    
    # استخراج المشاهد (تبسيط)
    scene_pattern = re.compile(r'مشهد\s*(\d+)', re.IGNORECASE)
    scenes_text = re.split(r'(?=مشهد\s*\d+)', content)
    
    breakdowns = []
    for scene_text in scenes_text[1:]:  # تخطي النص قبل أول مشهد
        match = scene_pattern.search(scene_text)
        if match:
            scene_num = match.group(1)
            breakdown = analyzer.analyze_scene_professional(scene_text, scene_num)
            breakdowns.append(breakdown)
    
    logger.info(f"📝 Analyzed {len(breakdowns)} scenes")
    
    # إنشاء جدول التصوير
    start_date = datetime.now()
    schedule = await analyzer.create_shooting_schedule(breakdowns, start_date)
    
    # إنشاء الكتالوج
    catalog = analyzer.create_production_catalog(breakdowns)
    
    # توليد التقرير
    html = BreakdownSheetRenderer.render_full_report(breakdowns, schedule, catalog)
    
    async with aiofiles.open("professional_breakdown_report.html", 'w', encoding='utf-8') as f:
        await f.write(html)
    
    logger.info("✅ Professional breakdown report generated!")
    logger.info(f"📊 Total shooting days: {len(schedule)}")
    logger.info(f"💰 Estimated budget: ${catalog.get_total_budget():,.2f}")
    logger.info("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
