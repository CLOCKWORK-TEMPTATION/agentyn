# خطة تنفيذ نظام Multi-Agent للتفريغ السينمائي بمنهجية القراءات الثلاث

## نظرة عامة على التنفيذ

تحويل تصميم النظام إلى سلسلة من المهام التطويرية التي تبني على بعضها البعض تدريجياً، مع التركيز على إنشاء نظام قابل للعمل في بيئة الإنتاج. كل مهمة تتضمن كتابة الكود والاختبارات اللازمة مع الاستفادة من الأنظمة الموجودة.

## قائمة المهام

- [x] 1. إعداد البنية الأساسية والتكامل مع الأنظمة الموجودة


  - إنشاء هيكل المشروع TypeScript مع دعم الأنظمة الموجودة
  - تكوين FastAPI service للتكامل مع Python Brain Layer
  - إعداد أنظمة البناء والنشر (Docker, package.json, tsconfig)
  - _Requirements: 10.1, 12.1, 13.1_

- [x] 1.1 إعداد اختبارات البنية الأساسية


  - كتابة اختبارات وحدة للتكامل مع FastAPI
  - اختبار الاتصال بين TypeScript و Python layers
  - _Requirements: 10.1, 12.3_

- [x] 2. تطوير طبقة تحليل النصوص (Parsing Pipeline)



  - تنفيذ ScriptParser للتعامل مع صيغ مختلفة (TXT, FDX, Fountain)
  - إضافة دعم PDF مع تمييز النصي من OCR
  - تنفيذ Scene extraction مع span tracking
  - إنشاء نماذج البيانات الأساسية (ParsedScene, ParsingResult)
  - _Requirements: 9.1, 14.1_

- [x] 2.1 كتابة property test لـ Parsing Pipeline Robustness


  - **Property 14: Parsing Pipeline Robustness**
  - **Validates: Requirements - Input Processing**

- [x] 2.2 اختبارات وحدة لـ Script Parsing


  - اختبار تحليل صيغ مختلفة من السيناريوهات
  - اختبار معالجة الأخطاء في التحليل
  - _Requirements: 9.1_

- [x] 3. تنفيذ التصنيف الثابت للفئات الـ21


  - إنشاء ProductionCategory enum مع جميع الفئات
  - تنفيذ CLASSIFICATION_TAXONOMY مع القواعد والأنماط
  - إنشاء ClassificationEngine للتصنيف التلقائي
  - إضافة دعم Evidence tracking لكل عنصر مُصنف
  - _Requirements: 4.2, 5.1-5.5_

- [x] 3.1 كتابة property test لـ Element Categorization Accuracy


  - **Property 6: Element Categorization Accuracy**
  - **Validates: Requirements 4.2**

- [x] 3.2 اختبارات وحدة للتصنيف


  - اختبار تصنيف عناصر مختلفة في الفئات الصحيحة
  - اختبار قواعد الاستبعاد والتضمين
  - _Requirements: 4.2_

- [-] 4. تطوير الوكيل العاطفي (Emotional Reading Agent)



  - تنفيذ EmotionalAgent class مع واجهات محددة
  - إنشاء EmotionalAnalysis و PacingAnalysis models
  - تكامل مع نماذج AI لتحليل التدفق السردي والإيقاع
  - تنفيذ آلية منع الملاحظات التقنية
  - _Requirements: 2.1-2.5_

- [ ] 4.1 كتابة property test لـ Emotional Analysis Purity



  - **Property 4: Emotional Analysis Purity**
  - **Validates: Requirements 2.1, 2.4**

- [ ] 4.2 اختبارات وحدة للوكيل العاطفي
  - اختبار تحليل التدفق السردي
  - اختبار استخراج اللحظات العاطفية
  - _Requirements: 2.2, 2.5_

- [ ] 5. تطوير الوكيل التقني (Technical Reading Agent)
  - تنفيذ TechnicalAgent class مع فحص التنسيق
  - إنشاء FormatValidation و SceneHeaderValidation models
  - تطوير آليات فحص اتساق الشخصيات والمواقع
  - إضافة كشف فساد البيانات والتكرار
  - _Requirements: 3.1-3.5_

- [ ] 5.1 كتابة property test لـ Technical Validation Completeness
  - **Property 5: Technical Validation Completeness**
  - **Validates: Requirements 3.2**

- [ ] 5.2 اختبارات وحدة للوكيل التقني
  - اختبار فحص ترويسات المشاهد
  - اختبار كشف أخطاء التنسيق
  - _Requirements: 3.2, 3.4_

- [ ] 6. تطوير وكيل قراءة التفريغ (Breakdown Reading Agent)
  - تنفيذ BreakdownAgent class مع استخراج العناصر
  - تكامل مع ClassificationEngine للتصنيف التلقائي
  - إنشاء BreakdownSheet generation مع Color coding
  - إضافة Evidence tracking لكل عنصر مُستخرج
  - _Requirements: 4.1-4.5_

- [ ] 6.1 كتابة property test لـ Comprehensive Element Extraction
  - **Property 3: Comprehensive Element Extraction**
  - **Validates: Requirements 1.3, 5.1-5.5**

- [ ] 6.2 اختبارات وحدة لوكيل التفريغ
  - اختبار استخراج العناصر من مشاهد مختلفة
  - اختبار توليد أوراق التفريغ
  - _Requirements: 4.2, 4.4_

- [ ] 7. تطوير خدمة Python المتقدمة (FastAPI Brain Service)
  - إنشاء FastAPI application مع endpoints محددة
  - تنفيذ Async job processing مع Job tracking
  - تكامل مع Revolutionary Breakdown Engine الموجود
  - إضافة مكونات المعالجة المحددة (Scene Salience, Continuity Check)
  - _Requirements: 12.1-12.5, 13.1-13.5_

- [ ] 7.1 كتابة property test لـ Python Service Integration
  - **Property 10: Python Service Integration**
  - **Validates: Requirements 12.3**

- [ ] 7.2 كتابة property test لـ Revolutionary Engine Integration
  - **Property 11: Revolutionary Engine Integration**
  - **Validates: Requirements 13.1**

- [ ] 7.3 اختبارات وحدة لخدمة Python
  - اختبار endpoints المختلفة
  - اختبار Job processing والتتبع
  - _Requirements: 12.3, 13.1_

- [ ] 8. تطوير الوكيل المشرف (Supervisor Agent)
  - تنفيذ SupervisorAgent class مع Rule Engine
  - إنشاء SUPERVISOR_RULES مع قواعد التحكيم المحددة
  - تطوير آليات حل التضارب والتحكيم
  - إضافة تتبع القرارات والمبررات
  - _Requirements: 11.1-11.5_

- [ ] 8.1 كتابة property test لـ Conflict Resolution Logic
  - **Property 8: Conflict Resolution Logic**
  - **Validates: Requirements 11.2**

- [ ] 8.2 كتابة property test لـ Original Text Priority
  - **Property 9: Original Text Priority**
  - **Validates: Requirements 11.3**

- [ ] 8.3 اختبارات وحدة للوكيل المشرف
  - اختبار قواعد التحكيم المختلفة
  - اختبار حل التضارب بين الوكلاء
  - _Requirements: 11.2, 11.4_

- [ ] 9. تطوير نظام إدارة النماذج (Model Management System)
  - تنفيذ MODEL_SELECTION_RULES مع سياسات التوزيع
  - إنشاء ModelSelector للاختيار التلقائي للنماذج
  - إضافة Fallback chains ومعالجة الأخطاء
  - تطوير Cost tracking وLatency monitoring
  - _Requirements: 6.1-6.5_

- [ ] 9.1 كتابة property test لـ Model Distribution Optimization
  - **Property 7: Model Distribution Optimization**
  - **Validates: Requirements 6.5**

- [ ] 9.2 اختبارات وحدة لإدارة النماذج
  - اختبار اختيار النماذج حسب نوع المهمة
  - اختبار Fallback chains
  - _Requirements: 6.5_

- [ ] 10. تطوير النظام الرئيسي متعدد الوكلاء
  - إنشاء MultiAgentBreakdownSystem كـ orchestrator رئيسي
  - تنفيذ Sequential execution للمراحل الثلاث
  - إضافة Session management وState tracking
  - تكامل جميع الوكلاء مع Supervisor
  - _Requirements: 1.1-1.5_

- [ ] 10.1 كتابة property test لـ Agent Creation and Initialization
  - **Property 1: Agent Creation and Initialization**
  - **Validates: Requirements 1.1**

- [ ] 10.2 كتابة property test لـ Sequential Phase Execution
  - **Property 2: Sequential Phase Execution**
  - **Validates: Requirements 1.2**

- [ ] 10.3 اختبارات وحدة للنظام الرئيسي
  - اختبار تنسيق الوكلاء
  - اختبار إدارة الجلسات
  - _Requirements: 1.2, 1.4_

- [ ] 11. تطوير واجهة المستخدم والAPI
  - إنشاء REST API endpoints للنظام
  - تطوير واجهة تحميل السيناريوهات
  - إضافة Real-time progress tracking
  - تنفيذ Export functionality للتقارير
  - _Requirements: 7.1-7.5, 9.1-9.5_

- [ ] 11.1 اختبارات وحدة للواجهات
  - اختبار API endpoints
  - اختبار تحميل الملفات
  - _Requirements: 7.2, 9.2_

- [ ] 12. تطوير نظام Evidence Tracking والمراجعة
  - تنفيذ Evidence model مع Span tracking
  - إضافة AgentProvenance لتتبع مصدر كل نتيجة
  - تطوير HumanReviewService للمراجعة البشرية
  - إنشاء Traceability reports
  - _Requirements: 8.1-8.5_

- [ ] 12.1 كتابة property test لـ Evidence Traceability
  - **Property 13: Evidence Traceability**
  - **Validates: Requirements - Traceability**

- [ ] 12.2 اختبارات وحدة لنظام التتبع
  - اختبار Evidence tracking
  - اختبار Human review workflow
  - _Requirements: 8.2, 8.4_

- [ ] 13. تطوير نظام المراقبة والجودة (Observability)
  - تنفيذ ObservabilityService مع Structured logging
  - إضافة Metrics collection (latency, cost, errors)
  - تطوير Quality metrics tracking
  - إنشاء Health checks وMonitoring dashboards
  - _Requirements: 8.1-8.5, 10.5_

- [ ] 13.1 اختبارات وحدة للمراقبة
  - اختبار تسجيل المقاييس
  - اختبار Health checks
  - _Requirements: 8.3, 10.5_

- [ ] 14. تطوير اختبارات التكامل الشاملة
  - إنشاء End-to-end integration tests
  - تطوير Performance benchmarks
  - إضافة Load testing للنظام المتكامل
  - تنفيذ Reliability tests
  - _Requirements: جميع المتطلبات_

- [ ] 14.1 كتابة property test لـ Semantic Synopsis Quality
  - **Property 12: Semantic Synopsis Quality**
  - **Validates: Requirements 14.1**

- [ ] 15. Checkpoint نهائي - التأكد من جاهزية النظام
  - التأكد من نجاح جميع الاختبارات
  - مراجعة الأداء والجودة
  - التحقق من التكامل مع الأنظمة الموجودة
  - إعداد وثائق النشر والتشغيل
  - Ensure all tests pass, ask the user if questions arise.

## ملاحظات التنفيذ

### الأولويات
1. **المرحلة الأولى** (المهام 1-3): البنية الأساسية والتحليل
2. **المرحلة الثانية** (المهام 4-6): الوكلاء المتخصصون
3. **المرحلة الثالثة** (المهام 7-9): التكامل المتقدم والإشراف
4. **المرحلة الرابعة** (المهام 10-12): النظام المتكامل والتتبع
5. **المرحلة النهائية** (المهام 13-15): المراقبة والاختبار الشامل

### التكامل مع الأنظمة الموجودة
- الاستفادة من `src/hybrid-agent.ts` و `src/multi-agent-system.ts` الموجودة
- دمج `revolutionary_breakdown_engine.py` و `ultimate_breakdown_system.py`
- استخدام البنية الموجودة في `src/advanced-tools.ts`

### اختبارات الخصائص
- كل property test يجب أن يُشغل لـ 100 تكرار على الأقل
- استخدام fast-check library للـ TypeScript
- تعليق كل اختبار بالصيغة المحددة: `**Feature: three-read-breakdown-system, Property {number}: {property_text}**`

### المهام الشاملة
- جميع المهام مطلوبة للحصول على نظام production-ready كامل
- تشمل الاختبارات المتقدمة والتحسينات الأساسية
- تضمن جودة عالية من البداية مع تغطية شاملة للاختبارات