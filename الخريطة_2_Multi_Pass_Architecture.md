# الخريطة 2: تطوير Multi-Pass Architecture

## 🎯 الهدف
تحويل `IntelligenceEngine` من محلل بسيط قائم على Regex إلى نظام ذكي ثلاثي المراحل يحاكي التفكير البشري.

---

## 🧠 الفكرة الأساسية: Three-Pass Processing

```
المرحلة 1: EXTRACTION (الاستخراج الخام)
    ↓
المرحلة 2: CONTEXTUALIZATION (الإثراء بالسياق)
    ↓
المرحلة 3: VALIDATION & REFINEMENT (التدقيق والتنقيح)
```

---

## 📋 المرحلة الأولى: Raw Extraction Engine

### الهدف
استخراج البيانات الخام دون تفسير أو استنتاج.

### الأفكار الذكية

#### 1. Entity Extraction Pipeline
```python
class EntityExtractor:
    """استخراج الكيانات بدقة عالية"""
    
    def extract_all_entities(self, text: str) -> Dict[str, List]:
        return {
            "characters": self._extract_characters(text),
            "objects": self._extract_objects(text),
            "actions": self._extract_actions(text),
            "locations": self._extract_locations(text),
            "time_markers": self._extract_time_markers(text),
            "emotions": self._extract_emotions(text)
        }
    
    def _extract_actions(self, text: str) -> List[str]:
        """استخراج الأفعال الرئيسية"""
        # أفعال الحركة: يدخل، تخرج، يجلس، ينهض
        # أفعال التفاعل: يمسك، يناول، يفتح، يغلق
        # أفعال الإدراك: يرى، يسمع، يلمح، يلاحظ
        action_patterns = [
            r'(يدخل|تدخل|يخرج|تخرج|يجلس|تجلس)',
            r'(يمسك|تمسك|يأخذ|تأخذ|يناول|تناول)',
            r'(يرى|ترى|يلمح|تلمح|يلاحظ|تلاحظ)',
            r'(يفتح|تفتح|يغلق|تغلق|يطرق|تطرق)'
        ]
        # استخراج + تصنيف حسب النوع
```

#### 2. Dependency Parser (محلل التبعيات)
```python
class DependencyParser:
    """تحليل العلاقات بين الكيانات"""
    
    def parse_relationships(self, text: str) -> List[Tuple]:
        """
        استخراج علاقات من نوع:
        - (نهال، تفتح، الباب)
        - (مدحت، يدخل إلى، السيارة)
        - (نور، تجلس أمام، كريم)
        """
        relationships = []
        
        # نمط: [فاعل] + [فعل] + [مفعول/ظرف]
        pattern = r'(\w+)\s+(ي\w+|ت\w+)\s+(?:إلى|على|أمام|في)?\s*(\w+)'
        
        for match in re.finditer(pattern, text):
            subject, verb, object_ = match.groups()
            relationships.append((subject, verb, object_))
        
        return relationships
```

#### 3. Contextual Object Classifier
```python
class ObjectClassifier:
    """تصنيف الأشياء حسب السياق اللغوي"""
    
    def classify_object(self, obj: str, surrounding_text: str) -> str:
        """
        تصنيف ذكي بناءً على:
        1. الأفعال المرتبطة
        2. الصفات الموصوفة
        3. الموقع في الجملة
        """
        
        # قاعدة: إذا كان الفعل "يمسك" → Prop
        if any(v in surrounding_text for v in ["يمسك", "يأخذ", "يناول"]):
            return "prop"
        
        # قاعدة: إذا كان الفعل "يجلس على" → Set Dressing
        if any(v in surrounding_text for v in ["يجلس على", "أمام", "خلف"]):
            return "set_dressing"
        
        # قاعدة خاصة: كرسي متحرك
        if "كرسي متحرك" in obj:
            if "طبي" in surrounding_text or "مريض" in surrounding_text:
                return "medical_prop"
            return "set_dressing"
        
        return "unknown"
```

---

## 📋 المرحلة الثانية: Contextualization Engine

### الهدف
إثراء البيانات الخام بالسياق والعلاقات بين المشاهد.

### الأفكار الذكية

#### 1. Scene Relationship Graph
```python
class SceneGraph:
    """بناء شبكة علاقات بين المشاهد"""
    
    def __init__(self):
        self.character_timeline = {}  # {character: [scene1, scene2, ...]}
        self.prop_continuity = {}     # {prop: [scene_first_seen, ...]}
        self.location_history = {}    # {location: [scenes]}
    
    def build_graph(self, scenes: List[SceneBreakdown]):
        """بناء الشبكة الكاملة"""
        for scene in scenes:
            self._track_characters(scene)
            self._track_props(scene)
            self._track_locations(scene)
    
    def get_character_previous_scene(self, char: str, current_scene: int):
        """الحصول على آخر ظهور للشخصية"""
        timeline = self.character_timeline.get(char, [])
        previous = [s for s in timeline if int(s.scene_no) < current_scene]
        return previous[-1] if previous else None
    
    def infer_wardrobe_continuity(self, char: str, scene: SceneBreakdown):
        """استنتاج استمرارية الملابس"""
        prev_scene = self.get_character_previous_scene(char, int(scene.scene_no))
        
        if not prev_scene:
            return "ملابس جديدة (أول ظهور)"
        
        # قاعدة: نفس اليوم + نفس الموقع → نفس الملابس
        if (prev_scene.time_of_day == scene.time_of_day and 
            prev_scene.location == scene.location):
            return f"استمرار من مشهد {prev_scene.scene_no}"
        
        # قاعدة: تغيير الوقت → ملابس جديدة
        if prev_scene.time_of_day != scene.time_of_day:
            return "ملابس جديدة (تغيير وقت)"
        
        return "حسب السياق"
```

#### 2. Semantic Synopsis Generator
```python
class SynopsisGenerator:
    """توليد ملخصات دلالية بدلاً من النسخ الحرفي"""
    
    TEMPLATES = {
        "search": "{character} يبحث عن {target} في {location}",
        "discovery": "{character} يكتشف {object} في {location}",
        "dialogue": "{char1} و{char2} يتحاوران حول {topic}",
        "confrontation": "مواجهة بين {char1} و{char2} بشأن {issue}",
        "action": "{character} {action} في {location}",
        "transition": "انتقال إلى {location} - {context}"
    }
    
    def generate(self, scene_text: str, entities: Dict) -> str:
        """
        خطوات التوليد:
        1. تصنيف نوع المشهد
        2. استخراج العناصر الأساسية
        3. ملء القالب المناسب
        4. تنقيح اللغة
        """
        scene_type = self._classify_scene_type(scene_text, entities)
        key_elements = self._extract_key_elements(entities)
        
        template = self.TEMPLATES.get(scene_type, self.TEMPLATES["action"])
        synopsis = template.format(**key_elements)
        
        return self._refine_language(synopsis)
    
    def _classify_scene_type(self, text: str, entities: Dict) -> str:
        """تصنيف ذكي للمشهد"""
        actions = entities.get("actions", [])
        
        # قاعدة: وجود "يبحث" + "تفتح" → Search
        if any(a in actions for a in ["يبحث", "تفتح", "تنظر"]):
            return "search"
        
        # قاعدة: وجود "يجد" أو "يلمح" → Discovery
        if any(a in actions for a in ["يجد", "تجد", "يلمح", "تلمح"]):
            return "discovery"
        
        # قاعدة: أكثر من شخصية + حوار → Dialogue
        if len(entities.get("characters", [])) >= 2 and ":" in text:
            return "dialogue"
        
        return "action"
    
    def _extract_key_elements(self, entities: Dict) -> Dict:
        """استخراج العناصر الأساسية للقالب"""
        return {
            "character": entities["characters"][0] if entities["characters"] else "شخصية",
            "char1": entities["characters"][0] if len(entities["characters"]) > 0 else "",
            "char2": entities["characters"][1] if len(entities["characters"]) > 1 else "",
            "action": entities["actions"][0] if entities["actions"] else "يتحرك",
            "object": entities["objects"][0] if entities["objects"] else "شيء",
            "location": entities["locations"][0] if entities["locations"] else "المكان",
            "target": "هدف",
            "topic": "موضوع",
            "issue": "قضية",
            "context": "سياق"
        }
```

#### 3. Wardrobe Inference Engine
```python
class WardrobeEngine:
    """محرك استنتاج الأزياء المتقدم"""
    
    DESCRIPTOR_RULES = {
        "صرامة": "ملابس رسمية محافظة (تايور/بدلة)",
        "عملية بشدة": "ستايل عملي سادة + حد أدنى إكسسوارات",
        "وقار": "بدلة رسمية فاخرة",
        "جمال": "ملابس أنيقة تبرز الأناقة",
        "احباط": "ملابس مرتبة لكن حالة نفسية مضطربة"
    }
    
    CONTEXT_RULES = {
        ("ليل", "منزل"): "ملابس منزلية ليلية / بيجامة راقية",
        ("نهار", "منزل"): "ملابس منزلية نهارية (Casual Home)",
        ("نهار", "مكتب"): "ملابس رسمية / Smart Casual",
        ("ليل", "مكتب"): "ملابس عمل (سهر متأخر)",
        ("نهار", "خارجي"): "ملابس خروج اعتيادية",
        ("ليل", "خارجي"): "ملابس خروج ليلية"
    }
    
    def infer_wardrobe(self, character: str, scene: SceneBreakdown, 
                      description: str, graph: SceneGraph) -> str:
        """
        استنتاج متعدد المستويات:
        Level 1: من الوصف المباشر
        Level 2: من السياق الزماني/المكاني
        Level 3: من الاستمرارية
        Level 4: من المهنة/الطبقة
        """
        wardrobe_parts = []
        
        # Level 1: Direct description
        for descriptor, clothing in self.DESCRIPTOR_RULES.items():
            if descriptor in description:
                wardrobe_parts.append(clothing)
        
        # Level 2: Context
        location_type = self._extract_location_type(scene.location)
        context_key = (scene.time_of_day.value, location_type)
        if context_key in self.CONTEXT_RULES:
            wardrobe_parts.append(self.CONTEXT_RULES[context_key])
        
        # Level 3: Continuity
        continuity = graph.infer_wardrobe_continuity(character, scene)
        if "استمرار" in continuity:
            wardrobe_parts.append(f"⚠️ {continuity}")
        
        # Level 4: Profession (من قاعدة البيانات)
        profession_wardrobe = self._get_profession_wardrobe(character, scene)
        if profession_wardrobe:
            wardrobe_parts.append(profession_wardrobe)
        
        return " | ".join(wardrobe_parts) if wardrobe_parts else "حسب السياق"
    
    def _extract_location_type(self, location: str) -> str:
        """استخراج نوع الموقع"""
        if any(kw in location for kw in ["منزل", "غرفة", "صالة", "فيلا", "شقة"]):
            return "منزل"
        if any(kw in location for kw in ["مكتب", "شركة", "محطة"]):
            return "مكتب"
        if any(kw in location for kw in ["سيارة", "شارع", "حديقة"]):
            return "خارجي"
        return "عام"
```

#### 4. Cinematic Pattern Analyzer
```python
class CinematicAnalyzer:
    """تحليل الأنماط الإخراجية واقتراح ملاحظات"""
    
    PATTERNS = {
        "power_dynamic": {
            "triggers": ["يجلس.*أمام", "مكتب", "رجل.*يبدو"],
            "indicators": ["وقار", "صرامة", "احباط"],
            "note": "مشهد مواجهة: ضبط بلوكينج يبرز صراع السلطة (Power Dynamic)"
        },
        "discovery_moment": {
            "triggers": ["يجد", "تجد", "يلمح", "تلمح", "تقع عينيه"],
            "indicators": ["ظرف", "صورة", "رسالة"],
            "note": "مشهد اكتشاف: التركيز على ريأكشن الشخصية + Close-up على الشيء"
        },
        "search_sequence": {
            "triggers": ["يبحث", "تبحث", "تفتح.*باب", "تنظر"],
            "indicators": ["قلق", "سرعة"],
            "note": "مشهد بحث: إيقاع سريع + كاميرا متحركة تتبع الشخصية"
        },
        "music_cue": {
            "triggers": ["يغني", "كاسيت", "راديو", "موسيقى"],
            "indicators": ["عمرو دياب", "تامر حسني"],
            "note": "⚠️ موسيقى تصويرية: تأكيد حقوق التشغيل + ترخيص"
        },
        "phone_call": {
            "triggers": ["هاتف", "يتصل", "يرن"],
            "indicators": [],
            "note": "مكالمة هاتفية: تصوير جانب واحد + صوت الطرف الآخر (إن وُجد)"
        }
    }
    
    def analyze(self, scene_text: str, entities: Dict) -> str:
        """تحليل وإرجاع ملاحظة إخراجية"""
        for pattern_name, config in self.PATTERNS.items():
            # تحقق من المحفزات
            triggers_found = sum(
                1 for t in config["triggers"] 
                if re.search(t, scene_text, re.IGNORECASE)
            )
            
            # تحقق من المؤشرات
            indicators_found = sum(
                1 for i in config["indicators"] 
                if i in scene_text
            )
            
            # إذا تطابق النمط
            if triggers_found >= 1 and (not config["indicators"] or indicators_found >= 1):
                return config["note"]
        
        return "مراجعة الراكورات (Continuity)"
```

---

## 📋 المرحلة الثالثة: Validation & Refinement

### الهدف
التدقيق والتنقيح النهائي للبيانات.

### الأفكار الذكية

#### 1. Consistency Validator
```python
class ConsistencyValidator:
    """التحقق من الاتساق الداخلي"""
    
    def validate_scene(self, scene: SceneBreakdown, graph: SceneGraph) -> List[str]:
        """إرجاع قائمة بالتحذيرات"""
        warnings = []
        
        # تحقق 1: الشخصيات المذكورة فقط
        for char in scene.cast:
            if char.is_inferred and "غير محدد" not in char.name:
                prev_scene = graph.get_character_previous_scene(
                    char.name, int(scene.scene_no)
                )
                if not prev_scene:
                    warnings.append(
                        f"⚠️ {char.full_name}: أول ظهور - تأكيد الحضور الفعلي"
                    )
        
        # تحقق 2: الدعائم المتكررة
        for prop in scene.props:
            if prop in graph.prop_continuity:
                first_scene = graph.prop_continuity[prop][0]
                if first_scene != scene.scene_no:
                    warnings.append(
                        f"⚠️ {prop}: تطابق مع مشهد {first_scene}"
                    )
        
        # تحقق 3: الأزياء
        if "استمرار" in scene.wardrobe_notes:
            warnings.append("⚠️ تأكيد استمرارية الأزياء مع المشهد السابق")
        
        return warnings
```

#### 2. Quality Scorer
```python
class QualityScorer:
    """تقييم جودة البيانات المستخرجة"""
    
    def score_scene(self, scene: SceneBreakdown) -> float:
        """إرجاع درجة من 0 إلى 1"""
        score = 0.0
        max_score = 17.0  # عدد الحقول
        
        # تقييم كل حقل
        if scene.scene_no: score += 1
        if scene.synopsis and len(scene.synopsis) > 20: score += 1
        if scene.cast and "غير محدد" not in scene.cast[0].name: score += 1
        if scene.wardrobe_notes and "حسب السياق" not in scene.wardrobe_notes: score += 1
        if scene.props: score += 1
        if scene.set_dressings: score += 1
        if scene.vehicles: score += 1
        if scene.sound and scene.sound != "حوار مباشر": score += 1
        if scene.camera_lighting: score += 1
        if scene.production_notes: score += 1
        # ... باقي الحقول
        
        return score / max_score
```

#### 3. LLM-Assisted Refiner (اختياري)
```python
class LLMRefiner:
    """استخدام LLM لتحسين المخرجات"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.enabled = bool(self.api_key)
    
    def refine_synopsis(self, raw_synopsis: str, scene_text: str) -> str:
        """إعادة صياغة الملخص باستخدام Claude"""
        if not self.enabled:
            return raw_synopsis
        
        prompt = f"""أعد صياغة هذا الملخص ليكون احترافياً وموجزاً (2-3 جمل فقط):

النص الأصلي:
{scene_text[:500]}

الملخص الحالي:
{raw_synopsis}

المطلوب: ملخص يركز على الحدث الرئيسي دون تفاصيل زائدة."""

        # استدعاء Claude API
        # response = anthropic_client.messages.create(...)
        # return response.content
        
        return raw_synopsis  # fallback
```

---

## 🔧 التكامل النهائي

```python
class MultiPassIntelligenceEngine:
    """المحرك الذكي الشامل ثلاثي المراحل"""
    
    def __init__(self, use_llm: bool = False):
        # Pass 1: Extraction
        self.entity_extractor = EntityExtractor()
        self.dependency_parser = DependencyParser()
        self.object_classifier = ObjectClassifier()
        
        # Pass 2: Contextualization
        self.scene_graph = SceneGraph()
        self.synopsis_gen = SynopsisGenerator()
        self.wardrobe_engine = WardrobeEngine()
        self.cinematic_analyzer = CinematicAnalyzer()
        
        # Pass 3: Validation
        self.validator = ConsistencyValidator()
        self.scorer = QualityScorer()
        
        # Optional: LLM
        if use_llm:
            self.llm_refiner = LLMRefiner()
    
    def process_all_scenes(self, scenes: List[SceneBreakdown], 
                          raw_texts: List[str]):
        """معالجة شاملة لكل المشاهد"""
        
        # Pass 1: Extract raw data
        all_entities = []
        for scene, text in zip(scenes, raw_texts):
            entities = self.entity_extractor.extract_all_entities(text)
            all_entities.append(entities)
        
        # Pass 2: Build context graph
        self.scene_graph.build_graph(scenes)
        
        # Pass 2: Enrich each scene
        for scene, text, entities in zip(scenes, raw_texts, all_entities):
            self._enrich_scene(scene, text, entities)
        
        # Pass 3: Validate and refine
        for scene in scenes:
            warnings = self.validator.validate_scene(scene, self.scene_graph)
            if warnings:
                scene.production_notes += "\n" + "\n".join(warnings)
            
            quality = self.scorer.score_scene(scene)
            if quality < 0.7:
                scene.production_notes += f"\n⚠️ جودة البيانات: {quality:.0%} - يتطلب مراجعة"
    
    def _enrich_scene(self, scene: SceneBreakdown, text: str, entities: Dict):
        """إثراء مشهد واحد (Pass 2)"""
        
        # 1. Synopsis
        scene.synopsis = self.synopsis_gen.generate(text, entities)
        
        # 2. Cast (تم بالفعل في Parser)
        
        # 3. Wardrobe
        for char in scene.cast:
            if char.name == "غير محدد":
                continue
            char.wardrobe_description = self.wardrobe_engine.infer_wardrobe(
                char.name, scene, text, self.scene_graph
            )
        
        # 4. Props (تصنيف ذكي)
        classified_props = []
        for obj in entities.get("objects", []):
            category = self.object_classifier.classify_object(obj, text)
            if category == "prop":
                classified_props.append(obj)
        scene.props = classified_props
        
        # 5. Cinematic notes
        cinematic_note = self.cinematic_analyzer.analyze(text, entities)
        scene.production_notes = cinematic_note
```

---

## 📊 مقارنة: قبل وبعد

### قبل (Regex البسيط)
```
Synopsis: "نرى منزل يبدو عليه الحداثة في الديكور ويكتب على الشاشة يونيو 2009 تخرج نهال سماحة من احد الغرف..."
Wardrobe: "حسب السياق"
Props: ["لابتوب"]
Notes: "مراجعة الراكورات"
```

### بعد (Multi-Pass)
```
Synopsis: "نهال تبحث عن ابنتها رنا في المنزل، تفتش الحمام وغرفة النوم، ثم تكتشف صورة نور توفيق على لابتوب رنا"
Wardrobe: "ملابس منزلية ليلية (يبدو عليها القلق) | ⚠️ أول ظهور - تحديد الستايل"
Props: ["لابتوب / حاسب آلي محمول"]
Set Dressing: "غرفة نوم (سرير + خزانة) | حمام | صالة معيشة"
Notes: "مشهد بحث: إيقاع سريع + كاميرا متحركة تتبع الشخصية | ⚠️ صورة نور: تأكيد الحقوق"
Quality: 88%
```

---

## ✅ الخلاصة

### الأفكار الذكية المقترحة:
1. **Entity Extraction Pipeline** - استخراج منظم للكيانات
2. **Dependency Parser** - تحليل العلاقات اللغوية
3. **Scene Relationship Graph** - شبكة علاقات بين المشاهد
4. **Semantic Synopsis Generator** - ملخصات ذكية بدلاً من النسخ
5. **Wardrobe Inference Engine** - استنتاج متعدد المستويات
6. **Cinematic Pattern Analyzer** - تمييز الأنماط الإخراجية
7. **Consistency Validator** - التحقق من الاتساق
8. **Quality Scorer** - تقييم جودة المخرجات
9. **LLM-Assisted Refiner** - تحسين اختياري بالذكاء الاصطناعي

### الأولوية في التطبيق:
1. **عالية**: Entity Extractor + Synopsis Generator + Wardrobe Engine
2. **متوسطة**: Scene Graph + Cinematic Analyzer
3. **منخفضة**: LLM Refiner (اختياري)
