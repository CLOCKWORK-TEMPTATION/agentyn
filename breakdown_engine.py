import asyncio
import re
import logging
import aiofiles
from dataclasses import dataclass, field
from typing import List, Optional, Set, Dict

# ==========================================
# 1. إعدادات النظام (Configuration & Rules)
# ==========================================

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger("AdvancedBreakdown")

class Config:
    INPUT_FILE = "script.txt"
    OUTPUT_FILE = "professional_breakdown.html"
    
    # قائمة حظر للكلمات التي قد تظهر خطأً كشخصيات
    CHAR_BLOCKLIST = {
        "قطع", "مشهد", "داخلي", "خارجي", "ليل", "نهار", "صمت", "يدخل", 
        "يخرج", "صوت", "كاميرا", "زوم", "تراك", "بسرعة", "بهدوء"
    }

    # قواعد استنتاج العناصر (Props Rules)
    PROPS_MAP = {
        "لابتوب": "لابتوب (حاسب آلي)", "حاسب": "لابتوب (حاسب آلي)",
        "ظرف": "ظرف (anniversary)", "رسالة": "ظرف/رسالة",
        "موبايل": "هاتف محمول", "هاتف": "هاتف محمول",
        "سيارة": "سيارة موديل 2009", "عربية": "سيارة",
        "كاسيت": "كاسيت/راديو سيارة", "مسجل": "جهاز تسجيل",
        "مرآة": "مرآة مكياج بإضاءة", "فرشاة": "أدوات تجميل",
        "كرسي متحرك": "كرسي متحرك طبي",
        "حقيبة": "حقيبة يد نسائية", "شنطة": "حقيبة",
        "مجلات": "مجموعة مجلات منوعة",
        "عقد": "ملف عقد ورقي"
    }

    # قواعد استنتاج المركبات
    VEHICLES_KEYWORDS = ["سيارة", "عربية", "تاكسي", "ميكروباص", "أتوبيس", "موتوسيكل"]

# ==========================================
# 2. نماذج البيانات المتقدمة (Advanced Models)
# ==========================================

@dataclass
class SceneData:
    scene_number: str = ""
    int_ext: str = "غير محدد"
    day_night: str = "غير محدد"
    location: str = ""
    characters: Set[str] = field(default_factory=set)
    action_summary: str = ""
    
    # حقول جديدة متخصصة
    props: Set[str] = field(default_factory=set)
    wardrobe: str = ""
    makeup: str = "تصحيح كاميرا اعتيادي"
    vehicles: Set[str] = field(default_factory=set)
    extras: str = "غير مذكور (لا يلزم)"
    sound: str = "حوار مباشر"
    notes: List[str] = field(default_factory=list)

    def add_character(self, name: str):
        # تنظيف الاسم
        clean = re.sub(r'[^\w\s]', '', name).strip()
        # التحقق من قائمة الحظر
        if clean and clean not in Config.CHAR_BLOCKLIST and len(clean) > 2:
            self.characters.add(clean)

# ==========================================
# 3. محرك الاستنتاج المنطقي (Inference Engine)
# ==========================================

class InferenceEngine:
    """
    العقل المدبر: يقوم باستنتاج المعلومات الناقصة بناءً على القواعد المنطقية
    """
    
    @staticmethod
    def enrich_scene(scene: SceneData, full_text: str):
        # 1. استنتاج الأزياء (Wardrobe Logic)
        InferenceEngine._infer_wardrobe(scene)
        
        # 2. استنتاج المركبات
        for word in Config.VEHICLES_KEYWORDS:
            if word in full_text:
                scene.vehicles.add(word)
                if "سيارة" in word:
                     scene.notes.append("تنبيه: التأكد من موديل السيارة مناسب لزمن الأحداث (2009).")

        # 3. استنتاج الملاحظات الإنتاجية
        if "موسيقى" in full_text or "عمرو دياب" in full_text or "تامر حسني" in full_text:
            scene.notes.append("حقوق ملكية: يلزم استخراج تصريح للأغاني أو أسماء المشاهير المذكورة.")
        
        if "أمن الدولة" in scene.location:
            scene.notes.append("حساس: يلزم مراجعة قانونية لاسم الجهة الأمنية أو تغيير اللافتات.")

    @staticmethod
    def _infer_wardrobe(scene: SceneData):
        """
        خوارزمية تحديد الملابس بناءً على المكان والزمان والشخصية
        """
        loc = scene.location
        time = scene.day_night
        
        wardrobe_desc = []
        
        # قواعد عامة
        if "منزل" in loc or "غرفة" in loc or "شقة" in loc:
            if "ليل" in time:
                wardrobe_desc.append("ملابس منزلية ليلية / بيجامة (مظهر استرخاء أو توتر حسب المشهد)")
            else:
                wardrobe_desc.append("ملابس منزلية نهارية (Casual Home)")
        
        elif "مكتب" in loc or "شركة" in loc or "مباحث" in loc:
            wardrobe_desc.append("ملابس رسمية / Smart Casual (بدلة أو قميص)")
            
        elif "سيارة" in loc or "خارجي" in loc:
            wardrobe_desc.append("ملابس خروج كاملة (حسب الطقس والطبقة الاجتماعية)")
            
        elif "محطة" in loc or "استوديو" in loc:
             wardrobe_desc.append("مظهر إعلامي / ملابس تصوير (Sartorial/TV Look)")

        # صياغة النتيجة
        if wardrobe_desc:
            scene.wardrobe = " + ".join(wardrobe_desc) + " <span class='tag'>استنتاج تلقائي</span>"
        else:
            scene.wardrobe = "ملابس اعتيادية (يحددها الستايلست)"

# ==========================================
# 4. محرك التحليل (Parsing Engine)
# ==========================================

class RobustParser:
    SCENE_HEADER_PATTERN = re.compile(r"^\s*(?:مشهد|Scene)\s*(\d+)\s*(.*)$", re.MULTILINE)

    def __init__(self, text: str):
        self.text = text

    def parse(self) -> List[SceneData]:
        scenes = []
        matches = list(self.SCENE_HEADER_PATTERN.finditer(self.text))
        
        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i+1].start() if i + 1 < len(matches) else len(self.text)
            block = self.text[start:end]
            scenes.append(self._process_block(match, block))
        return scenes

    def _process_block(self, header, block) -> SceneData:
        scene_num = header.group(1)
        meta = header.group(2)
        
        scene = SceneData(scene_number=scene_num)
        
        # تحليل الهيدر
        scene.day_night = "ليل" if "ليل" in meta else "نهار" if "نهار" in meta else "غير محدد"
        scene.int_ext = "خارجي" if "خارجي" in meta else "داخلي"
        
        # استخراج الموقع (تنظيف الهيدر)
        raw_loc = re.sub(r'(ليل|نهار|داخلي|خارجي|-)', '', meta).strip()
        lines = block.split('\n')
        if len(raw_loc) > 3:
            scene.location = raw_loc
        elif len(lines) > 1:
            scene.location = lines[1].strip() # افتراض السطر التالي هو المكان

        # تحليل المتن (الشخصيات والـ Props)
        desc_lines = []
        for line in lines[1:]:
            line = line.strip()
            if not line: continue
            
            # استخراج شخصيات (قواعد أكثر صرامة)
            # الاسم عادة يكون كلمة أو كلمتين في بداية السطر
            # أو مفصول بـ ":"
            if ":" in line:
                potential_name = line.split(":")[0].strip()
                if len(potential_name.split()) <= 3: # الاسم لا يزيد عن 3 كلمات
                    scene.add_character(potential_name)
            
            # البحث عن Props
            for key, val in Config.PROPS_MAP.items():
                if key in line:
                    scene.props.add(val)

            # تجميع الملخص (تجاهل سطور الحوار القصيرة)
            if len(line) > 20 and ":" not in line:
                desc_lines.append(line)

        # تحسين الملخص
        scene.action_summary = " ".join(desc_lines[:2]) + "..." if desc_lines else "حوار درامي"
        
        # تشغيل محرك الاستنتاج لإكمال البيانات الناقصة
        InferenceEngine.enrich_scene(scene, block)
        
        return scene

# ==========================================
# 5. محرك العرض (Visual Engine - CSS Upgrade)
# ==========================================

class HTMLRenderer:
    # CSS مطابق تماماً للملف الاحترافي (الملف الثاني)
    CSS = """
    :root{ --ink:#111; --muted:#666; --soft:#f3f4f6; --soft2:#fafafa; --accent:#0f172a; --line: rgba(0,0,0,0.16); --line2: rgba(0,0,0,0.10); --tagbg:#eef2ff; --tagbd:#c7d2fe; --tagtx:#1e3a8a; }
    html, body { padding: 0; margin: 0; color: var(--ink); background: var(--soft2); font-family: "Tahoma", "Arial", sans-serif; direction: rtl; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 12mm; }
    .sheet { width: 210mm; margin: 12px auto; background: #fff; box-shadow: 0 10px 28px rgba(0,0,0,0.10); border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; box-sizing: border-box; padding: 12mm; display: flex; flex-direction: column; gap: 10px; page-break-after: always; }
    .sheet-header{ border: 1px solid rgba(0,0,0,0.15); border-radius: 10px; padding: 10px 12px; background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 100%); }
    .sheet-header-top{ display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
    .sheet-title{ font-size: 16px; font-weight: 800; letter-spacing: 0.2px; color: var(--accent); }
    .sheet-badge{ font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); background: #fff; color: var(--accent); white-space: nowrap; }
    .sheet-meta{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 10px; font-size: 12px; color: var(--muted); }
    .meta-label{ font-weight: 800; color: var(--ink); }
    .sheet-table{ width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; font-size: 12.2px; }
    .sheet-table th{ background: var(--soft); color: var(--accent); font-weight: 800; padding: 10px; border-bottom: 1px solid var(--line); text-align: right; }
    .sheet-table td{ padding: 9px 10px; border-bottom: 1px solid var(--line2); vertical-align: top; line-height: 1.45; }
    .sheet-table td.field{ width: 34%; background: #fbfbfb; font-weight: 800; color: var(--accent); border-left: 1px solid var(--line2); }
    .tag{ display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--tagbd); background: var(--tagbg); color: var(--tagtx); margin-inline-start: 6px; }
    .sheet-footer{ margin-top: auto; display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.25); font-size: 11px; color: var(--muted); }
    @media print{ body{ background:#fff; } .sheet{ margin: 0; width: auto; border: none; box-shadow: none; padding: 0; } }
    .bullets { margin: 0; padding-right: 20px; }
    """

    @staticmethod
    def render(scenes: List[SceneData]) -> str:
        html_body = ""
        total = len(scenes)
        
        for i, scene in enumerate(scenes, 1):
            # تنسيق القوائم
            chars = ", ".join(sorted(scene.characters)) if scene.characters else "غير محدد"
            
            props_list = ""
            if scene.props:
                props_list = '<ul class="bullets">' + "".join([f"<li>{p}</li>" for p in scene.props]) + "</ul>"
            else:
                props_list = "لا يوجد (حسب النص)"

            vehicles_str = ", ".join(scene.vehicles) if scene.vehicles else "لا يوجد"
            
            notes_html = ""
            if scene.notes:
                notes_html = '<ul class="bullets" style="color:#b91c1c;">' + "".join([f"<li>{n}</li>" for n in scene.notes]) + "</ul>"
            else:
                notes_html = "مراجعة الراكورات (Continuity)"

            html_body += f"""
            <section class="sheet">
                <header class="sheet-header">
                    <div class="sheet-header-top">
                        <div class="sheet-title">Breakdown Sheet — مشهد {scene.scene_number}</div>
                        <div class="sheet-badge">Production Ready</div>
                    </div>
                    <div class="sheet-meta">
                        <div><span class="meta-label">INT/EXT:</span> {scene.int_ext}</div>
                        <div><span class="meta-label">Time:</span> {scene.day_night}</div>
                        <div><span class="meta-label">Location:</span> {scene.location}</div>
                    </div>
                </header>

                <table class="sheet-table">
                    <thead><tr><th>Element</th><th>Details</th></tr></thead>
                    <tbody>
                        <tr><td class="field">Scene No</td><td>{scene.scene_number}</td></tr>
                        <tr><td class="field">Synopsis</td><td>{scene.action_summary}</td></tr>
                        
                        <tr><td class="field">Cast</td><td>{chars}</td></tr>
                        <tr><td class="field">Extras</td><td>{scene.extras}</td></tr>
                        
                        <tr><td class="field">Wardrobe</td><td>{scene.wardrobe}</td></tr>
                        <tr><td class="field">Makeup</td><td>{scene.makeup}</td></tr>
                        
                        <tr><td class="field">Props</td><td>{props_list}</td></tr>
                        <tr><td class="field">Vehicles</td><td>{vehicles_str}</td></tr>
                        
                        <tr><td class="field">Sound</td><td>{scene.sound}</td></tr>
                        <tr><td class="field">Notes / Legal</td><td>{notes_html}</td></tr>
                    </tbody>
                </table>

                <footer class="sheet-footer">
                    <div><strong>Engineered Breakdown System</strong></div>
                    <div>Page {i} of {total}</div>
                </footer>
            </section>
            """
            
        return f"""<!doctype html>
        <html lang="ar" dir="rtl">
        <head><meta charset="utf-8"><title>Production Breakdown</title>
        <style>{HTMLRenderer.CSS}</style>
        </head><body>{html_body}</body></html>"""

# ==========================================
# 6. التنفيذ (Execution)
# ==========================================

async def main():
    logger.info("Initializing Logic Engine...")
    
    # قراءة الملف
    try:
        async with aiofiles.open(Config.INPUT_FILE, 'r', encoding='utf-8') as f:
            content = await f.read()
    except FileNotFoundError:
        logger.error("ملف السيناريو غير موجود.")
        return

    # التحليل + الاستنتاج
    parser = RobustParser(content)
    scenes = parser.parse()
    
    if not scenes:
        logger.warning("لم يتم استخراج أي مشاهد.")
        return
        
    logger.info(f"تم تحليل {len(scenes)} مشهد وتطبيق قواعد الاستنتاج عليها.")

    # التوليد
    html = HTMLRenderer.render(scenes)
    async with aiofiles.open(Config.OUTPUT_FILE, 'w', encoding='utf-8') as f:
        await f.write(html)
        
    logger.info("CASE CLOSED: تم إنشاء التقرير الاحترافي.")

if __name__ == "__main__":
    asyncio.run(main())