# تصميم نظام Multi-Agent للتفريغ السينمائي بمنهجية القراءات الثلاث

## نظرة عامة

يهدف هذا النظام إلى تطبيق منهجية "القراءات الثلاث" (The Three-Read Approach) لتفريغ السيناريوهات السينمائية باستخدام نظام Multi-Agent متقدم. يجمع النظام بين قوة Python للمعالجة المتقدمة وسهولة TypeScript للإدارة والتنسيق، مع الاستفادة من الأنظمة الموجودة (Revolutionary Breakdown Engine و Ultimate Breakdown System).

## المعمارية

### المعمارية الهجينة (Hybrid Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TypeScript Orchestrator Layer                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Emotional Agent │  │ Technical Agent │  │ Breakdown Agent │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                    ┌─────────────────┐                          │
│                    │ Supervisor Agent│                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                         FastAPI Interface
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      Python Brain Layer                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            Revolutionary Breakdown Engine                   │ │
│  │  • Semantic Synopsis Generator                              │ │
│  │  • Smart Prop Classifier                                   │ │
│  │  • Wardrobe Inference Engine                               │ │
│  │  • Cinematic Pattern Recognition                           │ │
│  │  • Scene Relationship Graph                                │ │
│  │  • Context-Aware Analysis                                  │ │
│  │  • Legal Alert System                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Advanced Processing Components                 │ │
│  │  • Scene Salience Ranker                                   │ │
│  │  • Continuity Constraint Checker                           │ │
│  │  • Multi-Agent Consensus Builder                           │ │
│  │  • Iterative Quality Optimizer                             │ │
│  │  • Context Awareness Simulator                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### طبقات النظام

1. **TypeScript Orchestrator Layer**: طبقة الإدارة والتنسيق
   - إدارة الوكلاء الأربعة
   - تنسيق تدفق العمل
   - واجهة المستخدم والAPI
   - إدارة الجلسات والحالة

2. **Python Brain Layer**: طبقة الذكاء المتقدم
   - المعالجة المتقدمة للنصوص
   - الخوارزميات الثورية الموجودة
   - التحليل العميق والاستنتاج

## المكونات والواجهات

### الوكلاء المتخصصون (TypeScript)

#### 1. Emotional Reading Agent (وكيل القراءة العاطفية)
```typescript
interface EmotionalAgent {
  analyzeNarrative(script: string): EmotionalAnalysis;
  identifyPacing(script: string): PacingAnalysis;
  extractEmotionalBeats(script: string): EmotionalBeat[];
  generateDirectorVision(analysis: EmotionalAnalysis): DirectorVision;
}

interface EmotionalAnalysis {
  overallTone: string;
  emotionalArcs: EmotionalArc[];
  pacingRhythm: PacingRhythm;
  keyMoments: KeyMoment[];
  audienceEngagement: number;
}
```

#### 2. Technical Reading Agent (وكيل القراءة التقنية)
```typescript
interface TechnicalAgent {
  validateFormatting(script: string): FormatValidation;
  checkSceneHeaders(script: string): SceneHeaderValidation[];
  validateCharacterConsistency(script: string): CharacterConsistency;
  detectDataCorruption(script: string): CorruptionReport;
}

interface FormatValidation {
  isValid: boolean;
  errors: FormatError[];
  warnings: FormatWarning[];
  suggestions: FormatSuggestion[];
}
```

#### 3. Breakdown Reading Agent (وكيل قراءة التفريغ)
```typescript
interface BreakdownAgent {
  extractElements(script: string): ProductionElements;
  categorizeElements(elements: RawElement[]): CategorizedElements;
  generateBreakdownSheets(elements: CategorizedElements): BreakdownSheet[];
  applyColorCoding(elements: CategorizedElements): ColorCodedElements;
}

interface ProductionElements {
  cast: CastMember[];
  extras: Extra[];
  props: Prop[];
  setDressing: SetDressing[];
  wardrobe: WardrobeItem[];
  makeup: MakeupRequirement[];
  stunts: StuntRequirement[];
  vehicles: Vehicle[];
  specialEffects: SpecialEffect[];
  visualEffects: VisualEffect[];
  // ... باقي الفئات الـ21
}
```

#### 4. Supervisor Agent (الوكيل المشرف)
```typescript
interface SupervisorAgent {
  arbitrateConflicts(results: AgentResult[]): ArbitrationResult;
  validateConsistency(results: AgentResult[]): ConsistencyReport;
  generateFinalReport(results: AgentResult[]): FinalBreakdownReport;
  applyLogicRules(conflicts: Conflict[]): Resolution[];
}

interface ArbitrationResult {
  resolvedConflicts: ResolvedConflict[];
  finalDecisions: Decision[];
  confidenceScore: number;
  reasoning: string[];
}
```

### خدمة Python المتقدمة (FastAPI)

```python
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union, Literal
from enum import Enum
import uuid

app = FastAPI(title="Advanced Breakdown Brain Service")

class ProcessingComponent(str, Enum):
    SEMANTIC_SYNOPSIS = "semantic_synopsis"
    PROP_CLASSIFICATION = "prop_classification" 
    WARDROBE_INFERENCE = "wardrobe_inference"
    CINEMATIC_PATTERNS = "cinematic_patterns"
    SCENE_SALIENCE = "scene_salience"
    CONTINUITY_CHECK = "continuity_check"

class AdvancedAnalysisRequest(BaseModel):
    text: str
    component: ProcessingComponent
    context: Optional[Dict[str, Any]] = None
    scene_id: Optional[str] = None
    confidence_threshold: float = 0.7

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

# Job tracking
jobs: Dict[str, JobStatus] = {}

@app.post("/analyze/async", response_model=Dict[str, str])
async def start_analysis(request: AdvancedAnalysisRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = JobStatus(job_id=job_id, status="pending", progress=0.0)
    
    background_tasks.add_task(process_analysis, job_id, request)
    return {"job_id": job_id, "status": "started"}

@app.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

async def process_analysis(job_id: str, request: AdvancedAnalysisRequest):
    try:
        jobs[job_id].status = "processing"
        jobs[job_id].progress = 0.1
        
        # استخدام المكونات الوظيفية المحددة
        if request.component == ProcessingComponent.SEMANTIC_SYNOPSIS:
            result = await generate_semantic_synopsis(request)
        elif request.component == ProcessingComponent.PROP_CLASSIFICATION:
            result = await classify_props_with_evidence(request)
        elif request.component == ProcessingComponent.WARDROBE_INFERENCE:
            result = await infer_wardrobe_with_context(request)
        elif request.component == ProcessingComponent.CINEMATIC_PATTERNS:
            result = await analyze_cinematic_patterns_detailed(request)
        elif request.component == ProcessingComponent.SCENE_SALIENCE:
            result = await rank_scene_salience(request)
        elif request.component == ProcessingComponent.CONTINUITY_CHECK:
            result = await check_continuity_constraints(request)
        else:
            raise ValueError(f"Unknown component: {request.component}")
        
        jobs[job_id].status = "completed"
        jobs[job_id].progress = 1.0
        jobs[job_id].result = result
        
    except Exception as e:
        jobs[job_id].status = "failed"
        jobs[job_id].error = str(e)

# مكونات معالجة محددة ومقيسة
async def generate_semantic_synopsis(request: AdvancedAnalysisRequest) -> AdvancedAnalysisResponse:
    # استخدام Semantic Synopsis Generator مع evidence tracking
    pass

async def classify_props_with_evidence(request: AdvancedAnalysisRequest) -> AdvancedAnalysisResponse:
    # استخدام Smart Prop Classifier مع span tracking
    pass

async def rank_scene_salience(request: AdvancedAnalysisRequest) -> AdvancedAnalysisResponse:
    # ترتيب أهمية العناصر في المشهد مع confidence scores
    pass

async def check_continuity_constraints(request: AdvancedAnalysisRequest) -> AdvancedAnalysisResponse:
    # فحص قيود الاستمرارية مع تتبع التناقضات
    pass
```

## نماذج البيانات

### طبقة تحليل النصوص (Parsing Pipeline)

```typescript
enum ScriptFormat {
  FDX = "fdx",
  FOUNTAIN = "fountain", 
  PDF_TEXT = "pdf_text",
  PDF_OCR = "pdf_ocr",
  TXT = "txt"
}

interface ParsingResult {
  format: ScriptFormat;
  scenes: ParsedScene[];
  characters: string[];
  locations: string[];
  parsing_confidence: number;
  parsing_errors: ParsingError[];
}

interface ParsedScene {
  id: string;
  number: string;
  header: SceneHeader;
  content: string;
  span_start: number;
  span_end: number;
  parsing_confidence: number;
}

interface ParsingError {
  type: "format_error" | "ocr_error" | "structure_error";
  message: string;
  span_start?: number;
  span_end?: number;
  severity: "warning" | "error" | "critical";
}
```

### التصنيف الثابت للفئات الـ21

```typescript
enum ProductionCategory {
  // 1-5: الأفراد
  CAST_MEMBERS = "cast_members",
  EXTRAS_ATMOSPHERE = "extras_atmosphere", 
  EXTRAS_FEATURED = "extras_featured",
  STUNT_PERFORMERS = "stunt_performers",
  ANIMAL_HANDLERS = "animal_handlers",
  
  // 6-10: الأشياء المحمولة
  PROPS_HANDHELD = "props_handheld",
  PROPS_INTERACTIVE = "props_interactive",
  WARDROBE_COSTUMES = "wardrobe_costumes",
  MAKEUP_HAIR = "makeup_hair",
  SPECIAL_MAKEUP = "special_makeup",
  
  // 11-15: البيئة والديكور
  SET_DRESSING = "set_dressing",
  GREENERY_PLANTS = "greenery_plants", 
  VEHICLES_PICTURE = "vehicles_picture",
  LIVESTOCK_LARGE = "livestock_large",
  SPECIAL_EQUIPMENT = "special_equipment",
  
  // 16-21: المؤثرات والخدمات
  SPECIAL_EFFECTS_SFX = "special_effects_sfx",
  VISUAL_EFFECTS_VFX = "visual_effects_vfx",
  SOUND_MUSIC = "sound_music",
  SECURITY_SERVICES = "security_services",
  ADDITIONAL_LABOR = "additional_labor",
  MISCELLANEOUS = "miscellaneous"
}

interface ClassificationRule {
  category: ProductionCategory;
  keywords: string[];
  context_patterns: RegExp[];
  exclusion_patterns: RegExp[];
  confidence_threshold: number;
}

// قاموس التصنيف الثابت
const CLASSIFICATION_TAXONOMY: Record<ProductionCategory, ClassificationRule> = {
  [ProductionCategory.PROPS_HANDHELD]: {
    category: ProductionCategory.PROPS_HANDHELD,
    keywords: ["يمسك", "يحمل", "يأخذ", "في يده"],
    context_patterns: [/\b(ظرف|هاتف|مفتاح|كأس)\b/g],
    exclusion_patterns: [/\b(على الطاولة|في الخلفية)\b/g],
    confidence_threshold: 0.7
  },
  // ... باقي الفئات
};
```

### نموذج النتائج مع Evidence Tracking

```typescript
interface ProductionElement {
  id: string;
  category: ProductionCategory;
  name: string;
  description: string;
  scene_id: string;
  
  // Evidence & Traceability
  evidence: Evidence;
  confidence: number;
  extracted_by: AgentProvenance;
  
  // Context
  context: ElementContext;
  dependencies: string[]; // IDs of related elements
}

interface Evidence {
  span_start: number;
  span_end: number;
  text_excerpt: string;
  rationale: string;
  classification_rule?: string;
  human_verified?: boolean;
}

interface AgentProvenance {
  agent_type: "emotional" | "technical" | "breakdown" | "supervisor";
  agent_version: string;
  model_used: string;
  prompt_version: string;
  timestamp: Date;
}

interface ElementContext {
  scene_context: string;
  character_context?: string;
  timing_context?: string;
  location_context?: string;
}
```

### نموذج Supervisor Rule Engine

```typescript
interface SupervisorRule {
  id: string;
  name: string;
  priority: number;
  condition: RuleCondition;
  action: RuleAction;
  confidence_threshold: number;
}

interface RuleCondition {
  type: "conflict" | "inconsistency" | "missing_evidence" | "low_confidence";
  agents_involved: string[];
  element_categories?: ProductionCategory[];
  custom_logic?: string; // للقواعد المعقدة
}

interface RuleAction {
  type: "prefer_original_text" | "request_human_review" | "merge_results" | "escalate";
  parameters: Record<string, any>;
  fallback_action?: RuleAction;
}

// قواعد التحكيم الأساسية
const SUPERVISOR_RULES: SupervisorRule[] = [
  {
    id: "emotional_vs_technical_conflict",
    name: "تضارب بين التحليل العاطفي والتقني",
    priority: 1,
    condition: {
      type: "conflict",
      agents_involved: ["emotional", "technical"]
    },
    action: {
      type: "prefer_original_text",
      parameters: { reason: "النص الأصلي له الأولوية في التضارب" }
    },
    confidence_threshold: 0.8
  },
  {
    id: "low_confidence_element",
    name: "عنصر بثقة منخفضة",
    priority: 2,
    condition: {
      type: "low_confidence",
      agents_involved: ["breakdown"]
    },
    action: {
      type: "request_human_review",
      parameters: { review_type: "element_verification" }
    },
    confidence_threshold: 0.6
  }
];
```

## خصائص الصحة (Correctness Properties)

*خاصية هي سمة أو سلوك يجب أن يكون صحيحاً عبر جميع التنفيذات الصالحة للنظام - في الأساس، بيان رسمي حول ما يجب أن يفعله النظام. تعمل الخصائص كجسر بين المواصفات القابلة للقراءة من قبل الإنسان وضمانات الصحة القابلة للتحقق آلياً.*

### Property 1: Agent Creation and Initialization
*لأي* سيناريو مُحمل، يجب أن ينشئ النظام بنجاح ثلاثة وكلاء متخصصين (عاطفي، تقني، تفريغ) ووكيل مشرف واحد
**Validates: Requirements 1.1**

### Property 2: Sequential Phase Execution
*لأي* عملية تحليل، يجب أن تتم المراحل بالترتيب الصحيح: القراءة العاطفية ← القراءة التقنية ← قراءة التفريغ ← الإشراف
**Validates: Requirements 1.2**

### Property 3: Comprehensive Element Extraction
*لأي* سيناريو مُحلل، يجب أن يحتوي التقرير النهائي على جميع الفئات الـ21 للعناصر الإنتاجية
**Validates: Requirements 1.3, 5.1-5.5**

### Property 4: Emotional Analysis Purity
*لأي* تحليل عاطفي، يجب ألا تحتوي النتائج على كلمات تقنية محظورة أو حقول تفريغ
**Testable Criteria**: عدم وجود الكلمات ["props", "wardrobe", "sfx", "vfx", "breakdown"] في مخرجات الوكيل العاطفي
**Validates: Requirements 2.1, 2.4**

### Property 5: Technical Validation Completeness  
*لأي* فحص تقني، يجب أن يتحقق النظام من اتساق ترويسات المشاهد وتحديد المواقع والتوقيت
**Testable Criteria**: كل مشهد يجب أن يحتوي على (INT/EXT + Location + DAY/NIGHT) صالحة
**Validates: Requirements 3.2**

### Property 6: Element Categorization Accuracy
*لأي* عنصر مُستخرج، يجب أن يُصنف في إحدى الفئات الـ21 القياسية بشكل صحيح
**Testable Criteria**: كل عنصر يجب أن يحتوي على category من enum ProductionCategory
**Validates: Requirements 4.2**

### Property 7: Model Distribution Optimization
*لأي* مهمة تحليل، يجب أن يختار النظام النموذج الأنسب بناءً على جدول التوزيع المحدد
**Testable Criteria**: مهام "semantic" → GPT-4, مهام "classification" → Claude, مهام "creative" → Gemini
**Validates: Requirements 6.5**

### Property 8: Conflict Resolution Logic
*لأي* تضارب بين نتائج الوكلاء، يجب أن يطبق Supervisor Agent القاعدة المناسبة من SUPERVISOR_RULES
**Testable Criteria**: كل تضارب يجب أن يُحل باستخدام قاعدة محددة مع confidence >= threshold
**Validates: Requirements 11.2**

### Property 9: Original Text Priority
*لأي* تضارب بين التحليل العاطفي والتقني، يجب أن يطبق النظام قاعدة "emotional_vs_technical_conflict"
**Testable Criteria**: في حالة التضارب، النتيجة النهائية تحتوي على rationale = "النص الأصلي له الأولوية"
**Validates: Requirements 11.3**

### Property 10: Python Service Integration
*لأي* طلب تحليل معقد، يجب أن يرسل النظام طلباً صحيحاً لخدمة Python ويحصل على job_id صالح
**Testable Criteria**: كل طلب يُرجع job_id بصيغة UUID صالحة + status = "started"
**Validates: Requirements 12.3**

### Property 11: Revolutionary Engine Integration
*لأي* عملية تحليل، يجب أن يستدعي النظام مكونات Revolutionary Engine ويحصل على نتائج مع evidence
**Testable Criteria**: كل نتيجة تحتوي على evidence.rationale غير فارغ + confidence > 0
**Validates: Requirements 13.1**

### Property 12: Semantic Synopsis Quality
*لأي* مشهد مُحلل، يجب أن يولد Semantic Synopsis Generator ملخصاً يلتقط العناصر الأساسية
**Testable Criteria**: الملخص يحتوي على (شخصيات + فعل رئيسي + موقع) ويكون بين 50-200 حرف
**Validates: Requirements 14.1**

### Property 13: Evidence Traceability
*لأي* عنصر مُستخرج، يجب أن يحتوي على evidence صالح مع span_start < span_end
**Testable Criteria**: كل ProductionElement يحتوي على evidence.span_start >= 0 و evidence.text_excerpt غير فارغ
**Validates: Requirements - Traceability**

### Property 14: Parsing Pipeline Robustness
*لأي* سيناريو مُحمل، يجب أن ينجح Parser في استخراج مشاهد صالحة أو يُرجع أخطاء واضحة
**Testable Criteria**: ParsingResult.scenes.length > 0 أو ParsingResult.parsing_errors.length > 0
**Validates: Requirements - Input Processing**

## معالجة الأخطاء

### استراتيجية معالجة الأخطاء متعددة المستويات

1. **مستوى الوكيل الفردي**
   - إعادة المحاولة التلقائية (3 مرات مع exponential backoff)
   - التبديل إلى نموذج بديل حسب fallback chain
   - تسجيل مفصل للأخطاء مع structured logging

2. **مستوى النظام**
   - آلية Fallback للوكلاء (emotional → technical → breakdown)
   - حفظ الحالة الجزئية في Redis/Database
   - استكمال العمل من نقطة الفشل باستخدام job_id

3. **مستوى التكامل**
   - مهلة زمنية متدرجة: 30s للمشاهد البسيطة، 120s للمعقدة
   - إعادة الاتصال التلقائي بخدمة Python مع circuit breaker
   - وضع العمل دون اتصال (محدود) باستخدام cached models

### سياسة اختيار النماذج (Model Selection Policy)

```typescript
interface ModelSelectionPolicy {
  task_type: string;
  primary_model: string;
  fallback_models: string[];
  cost_limit: number; // USD per 1K tokens
  latency_limit: number; // milliseconds
  confidence_threshold: number;
}

const MODEL_SELECTION_RULES: ModelSelectionPolicy[] = [
  {
    task_type: "semantic_analysis",
    primary_model: "gpt-4o",
    fallback_models: ["claude-3.5-sonnet", "gemini-pro"],
    cost_limit: 0.03,
    latency_limit: 15000,
    confidence_threshold: 0.8
  },
  {
    task_type: "classification",
    primary_model: "claude-3.5-sonnet", 
    fallback_models: ["gpt-4o", "gemini-pro"],
    cost_limit: 0.02,
    latency_limit: 10000,
    confidence_threshold: 0.75
  },
  {
    task_type: "creative_generation",
    primary_model: "gemini-pro",
    fallback_models: ["gpt-4o", "claude-3.5-sonnet"],
    cost_limit: 0.025,
    latency_limit: 20000,
    confidence_threshold: 0.7
  }
];
```

### أنواع الأخطاء المتوقعة

```typescript
enum ErrorType {
  SCRIPT_FORMAT_ERROR = "script_format_error",
  AGENT_INITIALIZATION_ERROR = "agent_initialization_error", 
  PYTHON_SERVICE_UNAVAILABLE = "python_service_unavailable",
  MODEL_API_ERROR = "model_api_error",
  CONFLICT_RESOLUTION_ERROR = "conflict_resolution_error",
  INSUFFICIENT_CONTEXT = "insufficient_context"
}

interface ErrorHandler {
  handleError(error: SystemError): ErrorResolution;
  retryWithBackoff(operation: () => Promise<any>, maxRetries: number): Promise<any>;
  fallbackToAlternative(primaryAgent: Agent, fallbackAgent: Agent): Promise<any>;
}
```

## استراتيجية الاختبار

### نهج الاختبار المزدوج

يتطلب النظام نهجاً مزدوجاً للاختبار يجمع بين الاختبارات الوحدة والاختبارات القائمة على الخصائص:

#### اختبارات الوحدة (Unit Tests)
- اختبار كل وكيل بشكل منفصل
- اختبار واجهات API لخدمة Python
- اختبار آليات معالجة الأخطاء
- اختبار تكامل النماذج المختلفة

#### اختبارات الخصائص (Property-Based Tests)
- **مكتبة الاختبار**: fast-check (JavaScript/TypeScript)
- **الحد الأدنى للتكرارات**: 100 تكرار لكل خاصية
- **تغطية شاملة**: اختبار الخصائص عبر مدخلات متنوعة

### متطلبات اختبار الخصائص

كل اختبار خاصية يجب أن:
1. يُعلم بتعليق يربطه بالخاصية في وثيقة التصميم
2. يستخدم الصيغة: `**Feature: three-read-breakdown-system, Property {number}: {property_text}**`
3. يُنفذ كاختبار وحيد لكل خاصية
4. يُشغل لما لا يقل عن 100 تكرار

### مولدات البيانات للاختبار

```typescript
import * as fc from 'fast-check';

// مولد سيناريوهات للاختبار
const scriptGenerator = fc.record({
  title: fc.string({ minLength: 5, maxLength: 50 }),
  scenes: fc.array(sceneGenerator, { minLength: 1, maxLength: 20 }),
  format: fc.constantFrom(ScriptFormat.FDX, ScriptFormat.FOUNTAIN, ScriptFormat.TXT)
});

// مولد مشاهد للاختبار  
const sceneGenerator = fc.record({
  header: fc.record({
    intExt: fc.constantFrom("INT", "EXT"),
    location: fc.string({ minLength: 3, maxLength: 30 }),
    timeOfDay: fc.constantFrom("DAY", "NIGHT", "DAWN", "DUSK")
  }),
  content: fc.string({ minLength: 50, maxLength: 500 }),
  characters: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { maxLength: 10 })
});

// مولد عناصر إنتاجية للاختبار
const productionElementGenerator = fc.record({
  category: fc.constantFrom(...Object.values(ProductionCategory)),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  evidence: fc.record({
    span_start: fc.nat({ max: 1000 }),
    span_end: fc.nat({ min: 1, max: 1000 }),
    text_excerpt: fc.string({ minLength: 10, maxLength: 100 }),
    rationale: fc.string({ minLength: 20, maxLength: 200 })
  }),
  confidence: fc.float({ min: 0, max: 1 })
});
```

### اختبارات التكامل والأداء

```typescript
// اختبار التدفق الكامل
describe("End-to-End Integration Tests", () => {
  test("Complete workflow from script upload to final report", async () => {
    const testScript = generateTestScript();
    const system = new MultiAgentBreakdownSystem();
    
    const result = await system.processScript(testScript);
    
    expect(result.status).toBe("completed");
    expect(result.phases).toHaveLength(4); // emotional, technical, breakdown, supervision
    expect(result.finalReport.elements.length).toBeGreaterThan(0);
    expect(result.finalReport.confidence).toBeGreaterThan(0.6);
  });
});

// اختبار الأداء
describe("Performance Tests", () => {
  test("Processing time scales linearly with script size", async () => {
    const smallScript = generateTestScript(5); // 5 scenes
    const largeScript = generateTestScript(50); // 50 scenes
    
    const smallTime = await measureProcessingTime(smallScript);
    const largeTime = await measureProcessingTime(largeScript);
    
    // يجب أن يكون الوقت متناسب مع الحجم (مع هامش للتحميل الأولي)
    expect(largeTime / smallTime).toBeLessThan(15); // max 15x for 10x content
  });
});

// اختبار الموثوقية
describe("Reliability Tests", () => {
  test("System handles concurrent requests without degradation", async () => {
    const concurrentRequests = 10;
    const promises = Array(concurrentRequests).fill(null).map(() => 
      processTestScript(generateTestScript())
    );
    
    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    expect(successCount).toBeGreaterThanOrEqual(8); // 80% success rate minimum
  });
});
```

### Human-in-the-Loop Integration

```typescript
interface HumanReviewRequest {
  element_id: string;
  review_type: "element_verification" | "conflict_resolution" | "quality_check";
  context: {
    scene_text: string;
    agent_results: AgentResult[];
    confidence_scores: number[];
  };
  suggested_action: string;
  deadline: Date;
}

interface HumanReviewResponse {
  element_id: string;
  decision: "approve" | "reject" | "modify";
  modifications?: Partial<ProductionElement>;
  feedback: string;
  reviewer_id: string;
  timestamp: Date;
}

class HumanReviewService {
  async requestReview(request: HumanReviewRequest): Promise<string> {
    // إرسال طلب مراجعة للمراجع البشري
    // إرجاع review_id للتتبع
  }
  
  async getReviewStatus(review_id: string): Promise<"pending" | "completed" | "expired"> {
    // فحص حالة المراجعة
  }
  
  async getReviewResult(review_id: string): Promise<HumanReviewResponse> {
    // الحصول على نتيجة المراجعة
  }
}
```

### Observability والمراقبة

```typescript
interface SystemMetrics {
  processing_latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  cost_per_script: {
    avg: number;
    total_daily: number;
  };
  error_rates: {
    parsing_errors: number;
    agent_failures: number;
    python_service_errors: number;
  };
  quality_metrics: {
    avg_confidence: number;
    human_review_rate: number;
    user_satisfaction: number;
  };
}

class ObservabilityService {
  async recordMetric(metric_name: string, value: number, tags: Record<string, string>) {
    // تسجيل المقاييس في Prometheus/DataDog
  }
  
  async logStructured(level: string, message: string, context: Record<string, any>) {
    // تسجيل منظم للأحداث
  }
  
  async traceOperation(operation_name: string, span_context: any) {
    // تتبع العمليات عبر النظام
  }
}
```

هذا التصميم يوفر أساساً قوياً لبناء نظام Multi-Agent متقدم يجمع بين أفضل ما في العالمين: قوة Python للمعالجة المتقدمة وسهولة TypeScript للإدارة والتنسيق، مع ضمان الجودة من خلال اختبارات شاملة قائمة على الخصائص.