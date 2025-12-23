#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
نظام Breakdown بتصميم Celtx الاحترافي
Professional Breakdown System with Celtx-Style A4 Sheets
"""

import asyncio
import re
import aiofiles
from dataclasses import dataclass, field
from typing import List, Set, Dict
from datetime import datetime

# ==========================================
# نماذج البيانات
# ==========================================

@dataclass
class SceneBreakdown:
    """Breakdown Sheet لمشهد واحد"""
    scene_number: str
    int_ext: str  # داخلي/خارجي
    day_night: str  # نهار/ليل
    location: str  # الموقع
    summary: str  # ملخص الحدث
    
    # العناصر
    cast: List[str] = field(default_factory=list)
    extras: str = ""
    costumes: str = ""
    makeup: str = ""
    props: str = ""
    set_dressing: str = ""
    animals: str = "لا يوجد"
    vehicles: str = "لا يوجد"
    greenery: str = "لا يوجد"
    stunts: str = "لا يوجد"
    special_effects: str = "لا يوجد"
    visual_effects: str = "لا يوجد"
    sound: str = ""
    camera_lighting: str = ""
    notes: str = ""


# ==========================================
# محلل السيناريو
# ==========================================

class ScriptParser:
    """محلل السيناريو"""
    
    @staticmethod
    def parse_script(content: str) -> List[SceneBreakdown]:
        """تحليل السيناريو الكامل"""
        scenes = []
        
        # تقسيم حسب المشاهد
        scene_pattern = re.compile(r'مشهد\s*(\d+)', re.IGNORECASE)
        scene_blocks = re.split(r'(?=مشهد\s*\d+)', content)
        
        for block in scene_blocks:
            if not block.strip():
                continue
            
            match = scene_pattern.search(block)
            if match:
                scene_num = match.group(1)
                scene = ScriptParser._parse_scene(block, scene_num)
                scenes.append(scene)
        
        return scenes
    
    @staticmethod
    def _parse_scene(text: str, scene_num: str) -> SceneBreakdown:
        """تحليل مشهد واحد"""
        lines = text.split('\n')
        
        # استخراج المعلومات الأساسية من الهيدر
        header = lines[0] if lines else ""
        
        int_ext = "داخلي (INT)" if "داخلي" in header or "INT" in header else "خارجي (EXT)"
        day_night = "ليل" if "ليل" in header or "NIGHT" in header else "نهار"
        
        # استخراج الموقع
        location = ScriptParser._extract_location(header)
        
        # استخراج الملخص
        summary = ScriptParser._extract_summary(text)
        
        # استخراج الشخصيات
        cast = ScriptParser._extract_cast(text)
        
        # إنشاء الـ breakdown
        scene = SceneBreakdown(
            scene_number=scene_num,
            int_ext=int_ext,
            day_night=day_night,
            location=location,
            summary=summary,
            cast=cast
        )
        
        # استنتاج العناصر الأخرى
        ScriptParser._infer_elements(scene, text)
        
        return scene
    
    @staticmethod
    def _extract_location(header: str) -> str:
        """استخراج الموقع"""
        # إزالة الكلمات الشائعة
        location = re.sub(r'(مشهد|Scene|\d+|داخلي|خارجي|INT|EXT|ليل|نهار|DAY|NIGHT|-)', '', header)
        return location.strip() or "غير محدد"
    
    @staticmethod
    def _extract_summary(text: str) -> str:
        """استخراج ملخص الحدث"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # البحث عن أول سطر وصفي (ليس حوار)
        for line in lines[1:]:
            if ':' not in line and len(line) > 20:
                return line[:200]
        
        return "ملخص غير متوفر"
    
    @staticmethod
    def _extract_cast(text: str) -> List[str]:
        """استخراج الشخصيات"""
        cast = []
        
        # البحث عن أسماء قبل ":"
        dialogue_pattern = r'([A-Za-z\u0600-\u06FF\s]+):'
        matches = re.findall(dialogue_pattern, text)
        
        for match in matches:
            name = match.strip()
            if len(name) > 2 and len(name.split()) <= 3:
                if name not in cast:
                    cast.append(name)
        
        return cast
    
    @staticmethod
    def _infer_elements(scene: SceneBreakdown, text: str) -> None:
        """استنتاج العناصر من النص"""
        text_lower = text.lower()
        
        # Extras
        scene.extras = '<span class="muted">غير مذكور</span> (يُفترض لا يوجد)'
        
        # Costumes
        if scene.day_night == "ليل" and "منزل" in scene.location.lower():
            scene.costumes = 'ملابس منزلية ليلية / بيجامة <span class="tag">مستنتج من السياق</span>'
        elif "مكتب" in scene.location.lower():
            scene.costumes = 'ملابس رسمية / Smart Casual <span class="tag">مستنتج من السياق</span>'
        else:
            scene.costumes = 'ملابس اعتيادية <span class="tag">مستنتج من السياق</span>'
        
        # Makeup
        scene.makeup = 'مكياج كاميرا اعتيادي <span class="tag">مستنتج من السياق</span>'
        
        # Props
        props = []
        prop_keywords = ['لابتوب', 'موبايل', 'هاتف', 'ظرف', 'كاسيت', 'كرسي متحرك', 'مجلات']
        for prop in prop_keywords:
            if prop in text_lower:
                props.append(prop)
        
        scene.props = '، '.join(props) if props else '<span class="muted">غير مذكور</span>'
        
        # Set Dressing
        if "منزل" in scene.location.lower():
            scene.set_dressing = f'{scene.location} <span class="tag">مستنتج من السياق</span>'
        elif "مكتب" in scene.location.lower():
            scene.set_dressing = f'مكتب احترافي <span class="tag">مستنتج من السياق</span>'
        else:
            scene.set_dressing = f'{scene.location} <span class="tag">مستنتج من السياق</span>'
        
        # Vehicles
        if any(v in text_lower for v in ['سيارة', 'عربية', 'تاكسي']):
            scene.vehicles = "سيارة"
        
        # Sound
        if scene.day_night == "ليل":
            scene.sound = "أجواء ليلية داخلية"
        else:
            scene.sound = "حوار مباشر"
        
        # Camera & Lighting
        scene.camera_lighting = f"{scene.day_night} {scene.int_ext.split()[0]}"
        
        # Special Effects
        if "شاشة" in text_lower or "لابتوب" in text_lower:
            scene.special_effects = "تشغيل شاشة (Playback)"


# ==========================================
# محرك HTML بتصميم Celtx
# ==========================================

class CeltxStyleRenderer:
    """محرك عرض بتصميم Celtx الاحترافي"""
    
    CSS = """
    /* ===== Print: A4 ===== */
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

    /* A4 "page" preview on screen */
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

    /* ===== Header ===== */
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

    /* ===== Table ===== */
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

    /* ===== Footer ===== */
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

    /* Print: remove shadows/rounded preview quirks */
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
    def render_scene(scene: SceneBreakdown, total_scenes: int) -> str:
        """عرض مشهد واحد"""
        
        cast_text = "، ".join(scene.cast) if scene.cast else '<span class="muted">غير مذكور</span>'
        
        return f"""
  <section class="sheet">
    <header class="sheet-header">
      <div class="sheet-header-top">
        <div class="sheet-title">Breakdown Sheet — مشهد {scene.scene_number}</div>
        <div class="sheet-badge">A4 Ready</div>
      </div>
      <div class="sheet-meta">
        <div class="meta-item"><span class="meta-label">INT/EXT:</span><span>{scene.int_ext}</span></div>
        <div class="meta-item"><span class="meta-label">نهار/ليل:</span><span>{scene.day_night}</span></div>
        <div class="meta-item"><span class="meta-label">الموقع:</span><span>{scene.location}</span></div>
      </div>
    </header>

    <table class="sheet-table">
      <thead><tr><th>الحقل</th><th>التفاصيل</th></tr></thead>
      <tbody>
        <tr><td class="field">رقم المشهد</td><td class="value">{scene.scene_number}</td></tr>
        <tr><td class="field">ملخص الحدث</td><td class="value">{scene.summary}</td></tr>
        <tr><td class="field">طاقم التمثيل / Cast</td><td class="value">{cast_text}</td></tr>
        <tr><td class="field">الممثلون الإضافيون / Extras</td><td class="value">{scene.extras}</td></tr>
        <tr><td class="field">الأزياء / Costumes</td><td class="value">{scene.costumes}</td></tr>
        <tr><td class="field">المكياج / Makeup</td><td class="value">{scene.makeup}</td></tr>
        <tr><td class="field">الدعائم / Props</td><td class="value">{scene.props}</td></tr>
        <tr><td class="field">ديكورات الموقع / Set Dressings</td><td class="value">{scene.set_dressing}</td></tr>
        <tr><td class="field">الحيوانات / Animals</td><td class="value">{scene.animals}</td></tr>
        <tr><td class="field">المركبات / Vehicles</td><td class="value">{scene.vehicles}</td></tr>
        <tr><td class="field">المساحات الخضراء / Greenery</td><td class="value">{scene.greenery}</td></tr>
        <tr><td class="field">المشاهد الخطرة / Stunts</td><td class="value">{scene.stunts}</td></tr>
        <tr><td class="field">المؤثرات الخاصة / Special Effects</td><td class="value">{scene.special_effects}</td></tr>
        <tr><td class="field">المؤثرات البصرية / Visual Effects</td><td class="value">{scene.visual_effects}</td></tr>
        <tr><td class="field">الصوت / Sound</td><td class="value">{scene.sound}</td></tr>
        <tr><td class="field">التصوير والإضاءة / Camera & Lighting</td><td class="value">{scene.camera_lighting}</td></tr>
        <tr><td class="field">ملاحظات (Wardrobe/Notes)</td><td class="value">{scene.notes if scene.notes else "لا توجد ملاحظات نصية إضافية."}</td></tr>
      </tbody>
    </table>

    <footer class="sheet-footer">
      <div><span class="footer-strong">Breakdown Sheets</span> — Scenes 1–{total_scenes}</div>
      <div>صفحة: <span class="footer-strong page-num"></span> / {total_scenes}</div>
    </footer>
  </section>
"""
    
    @staticmethod
    def render_full_report(scenes: List[SceneBreakdown]) -> str:
        """عرض التقرير الكامل"""
        
        total_scenes = len(scenes)
        scenes_html = "".join([CeltxStyleRenderer.render_scene(s, total_scenes) for s in scenes])
        
        return f"""<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Breakdown Sheets — Scenes 1–{total_scenes}</title>
  <style>{CeltxStyleRenderer.CSS}</style>
</head>
<body>
{scenes_html}
</body>
</html>"""


# ==========================================
# النظام الرئيسي
# ==========================================

async def main():
    """الدالة الرئيسية"""
    print("🎬 Starting Celtx-Style Breakdown System...")
    
    # قراءة السيناريو
    try:
        async with aiofiles.open("script.txt", 'r', encoding='utf-8') as f:
            content = await f.read()
    except FileNotFoundError:
        print("❌ File not found: script.txt")
        return
    
    # تحليل المشاهد
    scenes = ScriptParser.parse_script(content)
    
    if not scenes:
        print("⚠️ No scenes found in the script")
        return
    
    print(f"📝 Parsed {len(scenes)} scenes")
    
    # توليد التقرير
    html = CeltxStyleRenderer.render_full_report(scenes)
    
    # حفظ الملف
    async with aiofiles.open("breakdown_sheets_a4.html", 'w', encoding='utf-8') as f:
        await f.write(html)
    
    print("✅ Breakdown Sheets generated: breakdown_sheets_a4.html")
    print(f"📊 Total scenes: {len(scenes)}")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
