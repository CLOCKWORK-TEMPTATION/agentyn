# وثائق API الشاملة لخدمة Python المتقدمة للتفريغ السينمائي

## نظرة عامة

هذه الخدمة هي نظام متقدم لتحليل النصوص السينمائية يدعم جميع متطلبات المراحل 12.1-12.5 و 13.1-13.5 مع ميزات متطورة للأداء والمعالجة المتوازية.

## الميزات الرئيسية

### 🎯 المكونات المدعومة
- **Scene Salience**: تحليل أهمية المشاهد
- **Continuity Check**: فحص الاستمرارية
- **Revolutionary Breakdown**: التحليل الثوري المتقدم
- **Semantic Synopsis**: الملخص الدلالي
- **Prop Classification**: تصنيف الأدوات
- **Wardrobe Inference**: استنتاج الملابس
- **Cinematic Patterns**: أنماط سينمائية
- **Full Analysis**: تحليل شامل
- **Multi-Pass Analysis**: تحليل متعدد التمريرات

### ⚡ الميزات المتقدمة
- **معالجة متوازية** للمشاهد المتعددة
- **نظام ذاكرة مؤقتة ذكي** مع LRU eviction
- **مراقبة الأداء في الوقت الفعلي**
- **إدارة الأولويات المتطورة**
- **معالجة الأخطاء المتقدمة**
- **تكامل مع Revolutionary Engine**

## API Endpoints

### 1. إنشاء مهمة تحليل جديدة

```http
POST /api/v1/analysis
Content-Type: application/json

{
  "text": "النص المراد تحليله",
  "component": "scene_salience",
  "context": {
    "scene_id": "scene_001",
    "previous_scenes": ["scene_000"]
  },
  "confidence_threshold": 0.8,
  "priority": "high",
  "revolutionary_mode": true,
  "quantum_analysis": true,
  "neuromorphic_processing": false,
  "swarm_intelligence": true,
  "max_iterations": 5,
  "enable_context_awareness": true,
  "adaptive_learning": true,
  "integrate_revolutionary_engine": true,
  "enable_parallel_processing": true,
  "cache_results": true
}
```

**الاستجابة:**
```json
{
  "job_id": "uuid-string",
  "status": "pending",
  "component": "scene_salience",
  "created_at": "2025-12-23T15:25:00Z",
  "estimated_completion": "2025-12-23T15:25:15Z",
  "queue_position": 2,
  "priority": "high"
}
```

### 2. الحصول على حالة المهمة

```http
GET /api/v1/jobs/{job_id}
```

**الاستجابة:**
```json
{
  "job_id": "uuid-string",
  "status": "completed",
  "component": "scene_salience",
  "result": {
    "scene_importance": 0.85,
    "key_elements": ["character_development", "plot_advancement"],
    "emotional_impact": 0.9
  },
  "evidence": [
    {
      "span_start": 100,
      "span_end": 150,
      "text_excerpt": "النص المشروح",
      "rationale": "السبب في التحليل",
      "confidence": 0.88,
      "evidence_type": "textual"
    }
  ],
  "confidence_score": 0.87,
  "processing_time_ms": 1250.5,
  "created_at": "2025-12-23T15:25:00Z",
  "completed_at": "2025-12-23T15:25:01Z",
  "metadata": {
    "priority": "high",
    "iterations": 5,
    "revolutionary_mode": true,
    "quantum_analysis": true,
    "cache_key": "cache-key-hash"
  }
}
```

### 3. قائمة المهام

```http
GET /api/v1/jobs?status=processing&limit=10&offset=0
```

**الاستجابة:**
```json
{
  "jobs": [
    {
      "job_id": "uuid-1",
      "status": "processing",
      "component": "scene_salience",
      "created_at": "2025-12-23T15:25:00Z",
      "priority": "high"
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

### 4. مقاييس الأداء

```http
GET /api/v1/metrics/performance
```

**الاستجابة:**
```json
{
  "cpu_usage": 45.2,
  "memory_usage": 67.8,
  "memory_available": 8.5,
  "active_jobs": 3,
  "completed_jobs": 127,
  "failed_jobs": 2,
  "pending_jobs": 8,
  "average_processing_time": 1150.3,
  "queue_length": 8,
  "uptime_seconds": 3600,
  "throughput_jobs_per_minute": 12.5,
  "cache_hit_rate": 78.5,
  "timestamp": "2025-12-23T15:25:00Z"
}
```

### 5. تقرير التحليلات الشامل

```http
GET /api/v1/analytics/report
```

**الاستجابة:**
```json
{
  "total_analyses": 129,
  "component_usage": {
    "scene_salience": 45,
    "continuity_check": 32,
    "revolutionary_breakdown": 28,
    "full_analysis": 24
  },
  "success_rate": 98.4,
  "average_confidence": 0.847,
  "processing_time_stats": {
    "min": 850.2,
    "max": 3500.0,
    "mean": 1150.3,
    "median": 1050.7
  },
  "priority_distribution": {
    "low": 15,
    "normal": 78,
    "high": 32,
    "urgent": 4,
    "critical": 0
  },
  "daily_stats": {
    "2025-12-23": 129,
    "2025-12-22": 156,
    "2025-12-21": 134
  },
  "error_analysis": {
    "timeout": 1,
    "memory_error": 0,
    "processing_error": 1
  },
  "resource_utilization": {
    "cpu_avg": 42.5,
    "memory_avg": 65.2,
    "disk_io_avg": 15.8
  },
  "performance_trends": {
    "response_time": [1100, 1150, 1200, 1150, 1175],
    "throughput": [12.1, 12.5, 12.3, 12.7, 12.5]
  }
}
```

### 6. صحة النظام

```http
GET /api/v1/health
```

**الاستجابة:**
```json
{
  "status": "healthy",
  "services": {
    "job_manager": "healthy",
    "cache_system": "healthy",
    "performance_monitor": "healthy",
    "revolutionary_engine": "connected"
  },
  "resources": {
    "cpu": 45.2,
    "memory": 67.8,
    "disk": 23.4
  },
  "connections": 5,
  "uptime": 3600.5,
  "version": "1.0.0",
  "timestamp": "2025-12-23T15:25:00Z"
}
```

## أمثلة على الاستخدام

### مثال 1: تحليل مشهد سينمائي

```python
import requests
import json

# إعداد الطلب
url = "http://localhost:8000/api/v1/analysis"
headers = {"Content-Type": "application/json"}

data = {
    "text": """
    الداخلية. مكتب المحامي - صباحاً
    
    محمد (35 سنة، يرتدي بدلة رسمية) يجلس خلف مكتبه الكبير.
    على الجدار خلفه شهادات جامعية وصور مع شخصيات مهمة.
    
    (يقترب من النافذة وينظر للخارج)
    محمد: (يتحدث في الهاتف) نعم، سأكون هناك في الموعد المحدد.
    
    (يضع السماعة ويتطلع على ملف أمامه)
    """,
    "component": "scene_salience",
    "context": {
        "scene_id": "scene_001",
        "previous_scenes": ["scene_000"],
        "character_mood": "professional",
        "time_of_day": "morning"
    },
    "priority": "high",
    "revolutionary_mode": True,
    "quantum_analysis": True,
    "enable_parallel_processing": True,
    "cache_results": True
}

# إرسال الطلب
response = requests.post(url, headers=headers, json=data)
job_id = response.json()["job_id"]

print(f"تم إنشاء المهمة: {job_id}")

# انتظار النتيجة
while True:
    status_response = requests.get(f"{url.rsplit('/', 1)[0]}/jobs/{job_id}")
    job = status_response.json()
    
    if job["status"] == "completed":
        print("✅ اكتمل التحليل!")
        print(f"نتيجة التحليل: {job['result']}")
        print(f"نقاط الثقة: {job['confidence_score']}")
        break
    elif job["status"] == "failed":
        print("❌ فشل التحليل!")
        print(f"الخطأ: {job['error_message']}")
        break
    
    time.sleep(2)
```

### مثال 2: تحليل متقدم مع التكامل

```python
import asyncio
import aiohttp

async def advanced_analysis_example():
    async with aiohttp.ClientSession() as session:
        # إنشاء مهمة تحليل متقدم
        advanced_request = {
            "text": "نص السيناريو الطويل للتحليل المتقدم...",
            "component": "revolutionary_breakdown",
            "context": {
                "script_type": "feature_film",
                "genre": "drama",
                "target_audience": "adults"
            },
            "priority": "urgent",
            "revolutionary_mode": True,
            "quantum_analysis": True,
            "neuromorphic_processing": True,
            "swarm_intelligence": True,
            "max_iterations": 10,
            "enable_context_awareness": True,
            "adaptive_learning": True,
            "integrate_revolutionary_engine": True,
            "enable_parallel_processing": True,
            "cache_results": True
        }
        
        # إرسال الطلب
        async with session.post(
            "http://localhost:8000/api/v1/analysis",
            json=advanced_request
        ) as response:
            job_data = await response.json()
            job_id = job_data["job_id"]
        
        print(f"🚀 تم إنشاء مهمة التحليل المتقدم: {job_id}")
        
        # مراقبة التقدم
        while True:
            async with session.get(
                f"http://localhost:8000/api/v1/jobs/{job_id}"
            ) as response:
                job = await response.json()
            
            if job["status"] == "completed":
                print("🎉 اكتمل التحليل المتقدم!")
                
                # عرض النتائج المفصلة
                result = job["result"]
                print(f"التحسينات الثورية: {job.get('revolutionary_enhancements', {})}")
                print(f"التحليل الكمومي: {job.get('quantum_analysis', {})}")
                print(f"الميزات العصبية: {job.get('neuromorphic_features', {})}")
                print(f"ذكاء السرب: {job.get('swarm_intelligence', {})}")
                
                break
            elif job["status"] == "failed":
                print(f"❌ فشل التحليل: {job.get('error_message')}")
                break
            
            await asyncio.sleep(3)

# تشغيل المثال
asyncio.run(advanced_analysis_example())
```

### مثال 3: مراقبة الأداء والإحصائيات

```python
import time
import matplotlib.pyplot as plt

def performance_monitoring_example():
    base_url = "http://localhost:8000/api/v1"
    
    # جمع مقاييس الأداء
    performance_data = []
    
    for i in range(20):  # مراقبة لمدة 20 قياس
        response = requests.get(f"{base_url}/metrics/performance")
        metrics = response.json()
        
        performance_data.append({
            "timestamp": time.time(),
            "cpu_usage": metrics["cpu_usage"],
            "memory_usage": metrics["memory_usage"],
            "active_jobs": metrics["active_jobs"],
            "throughput": metrics["throughput_jobs_per_minute"]
        })
        
        print(f"📊 قياس {i+1}: CPU={metrics['cpu_usage']:.1f}%, "
              f"Memory={metrics['memory_usage']:.1f}%, "
              f"Jobs={metrics['active_jobs']}")
        
        time.sleep(5)  # قياس كل 5 ثوان
    
    # رسم الأداء
    timestamps = [d["timestamp"] for d in performance_data]
    cpu_usage = [d["cpu_usage"] for d in performance_data]
    memory_usage = [d["memory_usage"] for d in performance_data]
    
    plt.figure(figsize=(12, 8))
    
    plt.subplot(2, 1, 1)
    plt.plot(timestamps, cpu_usage, label='CPU Usage %', color='red')
    plt.plot(timestamps, memory_usage, label='Memory Usage %', color='blue')
    plt.title('استخدام الموارد - الوقت')
    plt.ylabel('النسبة المئوية (%)')
    plt.legend()
    
    plt.subplot(2, 1, 2)
    throughput = [d["throughput"] for d in performance_data]
    plt.plot(timestamps, throughput, label='Throughput (jobs/min)', color='green')
    plt.title('معدل الإنتاجية')
    plt.xlabel('الوقت')
    plt.ylabel('مهام/دقيقة')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('performance_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

# تشغيل مراقبة الأداء
performance_monitoring_example()
```

## معالجة الأخطاء

### الأخطاء الشائعة وحلولها

| كود الخطأ | الوصف | الحل |
|-----------|--------|------|
| 400 | طلب غير صحيح | تحقق من صحة البيانات المرسلة |
| 422 | خطأ في التحقق | تأكد من مطابقة المخطط المطلوب |
| 429 | معدل الطلبات مرتفع | انتظر قبل إرسال طلبات جديدة |
| 500 | خطأ داخلي في الخادم | تحقق من سجلات الخادم |
| 503 | الخدمة غير متاحة | تحقق من حالة النظام |

### مثال على معالجة الأخطاء

```python
def robust_analysis_request(text, component):
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                "http://localhost:8000/api/v1/analysis",
                json={
                    "text": text,
                    "component": component,
                    "priority": "normal"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print(f"⚠️ معدل الطلبات مرتفع، محاولة {attempt + 1}")
                time.sleep(retry_delay * (attempt + 1))
            else:
                print(f"❌ خطأ {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            print(f"⏰ انتهاء الوقت، محاولة {attempt + 1}")
            time.sleep(retry_delay)
        except requests.exceptions.ConnectionError:
            print(f"🔌 خطأ في الاتصال، محاولة {attempt + 1}")
            time.sleep(retry_delay)
        except Exception as e:
            print(f"❌ خطأ غير متوقع: {str(e)}")
            break
    
    raise Exception("فشل في إرسال الطلب بعد المحاولات المتعددة")
```

## التكوين والإعدادات

### متغيرات البيئة

```bash
# إعدادات الخادم
PORT=8000
HOST=0.0.0.0
DEBUG=False

# إعدادات الأداء
MAX_CONCURRENT_JOBS=10
CACHE_TTL=3600
PERFORMANCE_THRESHOLD=1000

# إعدادات قاعدة البيانات
DATABASE_URL=sqlite:///./brain_service.db

# إعدادات التسجيل
LOG_LEVEL=INFO
LOG_FILE=logs/brain_service.log

# إعدادات التكامل
REVOLUTIONARY_ENGINE_URL=http://localhost:9000
ENABLE_INTEGRATION=True
```

### تكوين متقدم

```python
# تخصيص إعدادات الخدمة
app_config = {
    "max_concurrent_jobs": 20,
    "cache_ttl": 7200,  # ساعتان
    "performance_threshold": 1500,
    "enable_parallel_processing": True,
    "enable_caching": True,
    "monitoring_interval": 30,
    "cleanup_interval": 3600
}
```

## الاختبار والاستكشاف

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
python comprehensive_testing_suite.py

# تشغيل اختبارات محددة
pytest comprehensive_testing_suite.py::TestAdvancedJobManager::test_create_job_basic -v

# تشغيل اختبارات الأداء
pytest comprehensive_testing_suite.py::TestPerformanceAndLoad -v
```

### استكشاف API

```bash
# فحص الوثائق التفاعلية
open http://localhost:8000/docs

# فحص مخطط API
curl http://localhost:8000/openapi.json

# اختبار الاتصال
curl http://localhost:8000/api/v1/health
```

---

## الدعم والمساعدة

للحصول على الدعم أو الإبلاغ عن مشاكل، يرجى مراجعة:
- وثائق المشروع في `/docs`
- سجلات النظام في `/logs`
- اختبارات الأداء في `/tests`

**الإصدار**: 1.0.0  
**تاريخ آخر تحديث**: 2025-12-23  
**الحالة**: إنتاجي ✅
