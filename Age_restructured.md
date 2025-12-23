# دليل Google Agent Development Kit (ADK)

## جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [البدء السريع](#البدء-السريع)
3. [المفاهيم الأساسية](#المفاهيم-الأساسية)
4. [أنواع الوكلاء](#أنواع-الوكلاء)
5. [دعم النماذج المختلفة](#دعم-النماذج-المختلفة)
6. [الأدوات (Tools)](#الأدوات-tools)
7. [الذاكرة طويلة المدى](#الذاكرة-طويلة-المدى)
8. [إدارة البيانات الثنائية (Artifacts)](#إدارة-البيانات-الثنائية-artifacts)
9. [بناء واجهات المستخدم](#بناء-واجهات-المستخدم)
10. [خدمات Google Cloud المتكاملة](#خدمات-google-cloud-المتكاملة)

---

## نظرة عامة

### ما هو ADK؟

Google Agent Development Kit (ADK) هو إطار عمل متقدم لبناء وكلاء الذكاء الاصطناعي (AI Agents) يدعم لغات البرمجة المتعددة:

- **Python** (v0.1.0+)
- **TypeScript** (v0.2.0+)
- **Go** (v0.1.0+)
- **Java** (v0.1.0+)

### الميزات الرئيسية

- دعم نماذج متعددة من مزودين مختلفين (Gemini, Claude, OpenAI, Mistral, وغيرها)
- وكلاء تسلسل العمل (Workflow Agents): Sequential, Parallel, Loop
- نظام أدوات شامل مع دعم MCP (Model Context Protocol)
- إدارة الذاكرة طويلة المدى (Long-Term Memory)
- إدارة الجلسات والحالة (Sessions & State)
- إدارة البيانات الثنائية (Artifacts)
- تكامل مع خدمات Google Cloud

---

## البدء السريع

### التثبيت والإعداد

#### Python

```bash
# إنشاء بيئة افتراضية
python -m venv .venv

# تفعيل البيئة الافتراضية
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# تثبيت ADK
pip install google-adk
```

#### TypeScript

```bash
npm install @google/adk
```

#### Go

```bash
go get google.golang.org/adk
```

#### Java

أضف التبعية في `pom.xml` أو `build.gradle`:

```xml
<dependency>
    <groupId>com.google.adk</groupId>
    <artifactId>adk</artifactId>
    <version>0.1.0</version>
</dependency>
```

### إعداد المفاتيح والمصادقة

#### استخدام Google AI Studio (للتطوير السريع)

```bash
export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
export GOOGLE_GENAI_USE_VERTEXAI=FALSE
```

احصل على مفتاح API من [Google AI Studio](https://aistudio.google.com/apikey).

#### استخدام Google Cloud Vertex AI (للإنتاج)

**الطريقة أ: بيانات اعتماد المستخدم (للتطوير المحلي)**

```bash
# تثبيت gcloud CLI وتسجيل الدخول
gcloud auth application-default login

# تعيين متغيرات البيئة
export GOOGLE_CLOUD_PROJECT="YOUR_PROJECT_ID"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_GENAI_USE_VERTEXAI=TRUE
```

**الطريقة ب: وضع Vertex AI Express**

```bash
export GOOGLE_API_KEY="YOUR_EXPRESS_MODE_API_KEY"
export GOOGLE_GENAI_USE_VERTEXAI=TRUE
```

**الطريقة ج: حساب الخدمة (للإنتاج)**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
```

### مثال بسيط: إنشاء وكيل أساسي

#### Python

```python
from google.adk.agents import LlmAgent

# إنشاء وكيل بسيط
agent = LlmAgent(
    model="gemini-2.0-flash",
    name="hello_world_agent",
    instruction="أنت مساعد ودود ومفيد."
)

# تشغيل الوكيل
response = agent.run("مرحباً! كيف يمكنني استخدام ADK؟")
print(response)
```

#### TypeScript

```typescript
import { LlmAgent } from '@google/adk';

const agent = new LlmAgent({
  model: "gemini-2.5-flash",
  name: "hello_world_agent",
  instruction: "أنت مساعد ودود ومفيد."
});

const response = await agent.run("مرحباً! كيف يمكنني استخدام ADK؟");
console.log(response);
```

#### Go

```go
import (
    "google.golang.org/adk/agent/llmagent"
    "google.golang.org/genai"
)

agent := llmagent.New(&llmagent.Config{
    Model: "gemini-2.0-flash",
    Name: "hello_world_agent",
    Instruction: "أنت مساعد ودود ومفيد.",
})

response := agent.Run(context.Background(), "مرحباً! كيف يمكنني استخدام ADK؟")
```

#### Java

```java
import com.google.adk.agents.LlmAgent;

LlmAgent agent = LlmAgent.builder()
    .model("gemini-2.0-flash")
    .name("hello_world_agent")
    .instruction("أنت مساعد ودود ومفيد.")
    .build();

String response = agent.run("مرحباً! كيف يمكنني استخدام ADK؟");
System.out.println(response);
```

---

## المفاهيم الأساسية

### ما هو الوكيل (Agent)؟

الوكيل في ADK هو مكون ذكي يمكنه:
- فهم وتنفيذ المهام
- استخدام الأدوات (Tools) لتوسيع قدراته
- الاحتفاظ بالسياق عبر الجلسات
- التفاعل مع وكلاء آخرين (Multi-Agent Systems)

### الأدوات (Tools)

الأدوات هي وظائف يمكن للوكيل استدعاؤها لأداء مهام محددة:
- **أدوات مدمجة**: Google Search, Calculator, Code Execution
- **أدوات مخصصة**: يمكنك إنشاء أدواتك الخاصة
- **أدوات MCP**: دعم Model Context Protocol للتكامل مع خدمات خارجية

### الجلسات (Sessions)

الجلسة تحتفظ بسياق المحادثة:
- تاريخ الأحداث (Events History)
- الحالة المؤقتة (Session State)
- معرفات فريدة (Session ID, User ID, App Name)

### الحالة (State)

آلية لتخزين البيانات المؤقتة خلال الجلسة:
- بيانات صغيرة (نصوص، أرقام، قوائم)
- تُحفظ في الذاكرة خلال الجلسة
- يمكن مشاركتها بين الوكلاء

---

## أنواع الوكلاء

### 1. LLM Agents

وكلاء يستخدمون نماذج اللغة الكبيرة لاتخاذ القرارات الذكية.

#### مثال بسيط

```python
from google.adk.agents import LlmAgent
from google.adk.tools import calculator, google_search

agent = LlmAgent(
    model="gemini-2.5-pro",
    name="research_agent",
    instruction="أنت وكيل بحث متخصص. استخدم البحث والحسابات للإجابة على الأسئلة.",
    tools=[calculator, google_search]
)
```

### 2. Workflow Agents (وكلاء تسلسل العمل)

وكلاء متخصصون في **تنظيم تنفيذ الوكلاء الفرعية** (Sub-Agents) بأنماط محددة.

#### Sequential Agents (التنفيذ المتسلسل)

ينفذ الوكلاء الفرعية **واحداً تلو الآخر بترتيب محدد**.

```python
from google.adk.agents import SequentialAgent, LlmAgent

writer_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="writer",
    instruction="اكتب مسودة للوثيقة."
)

editor_agent = LlmAgent(
    model="gemini-2.0-flash",
    name="editor",
    instruction="راجع وحسّن الوثيقة."
)

workflow = SequentialAgent(
    sub_agents=[writer_agent, editor_agent]
)
```

**حالات الاستخدام:**
- سير عمل متعدد المراحل
- عمليات تتطلب ترتيب محدد
- pipeline معالجة البيانات

#### Parallel Agents (التنفيذ المتوازي)

ينفذ الوكلاء الفرعية **بشكل متزامن** لتسريع العمليات.

```python
from google.adk.agents import ParallelAgent, LlmAgent

researcher1 = LlmAgent(
    model="gemini-2.0-flash",
    name="energy_researcher",
    instruction="ابحث عن مصادر الطاقة المتجددة."
)

researcher2 = LlmAgent(
    model="gemini-2.0-flash",
    name="tech_researcher",
    instruction="ابحث عن تقنيات السيارات الكهربائية."
)

researcher3 = LlmAgent(
    model="gemini-2.0-flash",
    name="carbon_researcher",
    instruction="ابحث عن تقنيات احتجاز الكربون."
)

parallel_research = ParallelAgent(
    sub_agents=[researcher1, researcher2, researcher3]
)
```

**حالات الاستخدام:**
- مهام مستقلة يمكن تنفيذها بالتوازي
- عمليات كثيفة الموارد
- بحث متعدد المصادر

**ملاحظة مهمة:** الوكلاء الفرعية تعمل بشكل مستقل ولا تشارك السياق تلقائياً.

#### Loop Agents (التنفيذ التكراري)

ينفذ الوكلاء الفرعية **بشكل متكرر** حتى استيفاء شرط معين.

```python
from google.adk.agents import LoopAgent, LlmAgent

writer = LlmAgent(
    model="gemini-2.0-flash",
    name="writer",
    instruction="اكتب أو حسّن مسودة الوثيقة."
)

critic = LlmAgent(
    model="gemini-2.0-flash",
    name="critic",
    instruction="راجع الوثيقة واقترح تحسينات. أرجع 'STOP' إذا كانت جيدة."
)

iterative_improvement = LoopAgent(
    sub_agents=[writer, critic],
    max_iterations=5  # حد أقصى للتكرارات
)
```

**حالات الاستخدام:**
- تحسين تكراري
- مراجعة ومعالجة متكررة
- محاولة حتى النجاح

**آليات الإيقاف:**
- `max_iterations`: حد أقصى للتكرارات
- إشارة من وكيل فرعي (مثل إرجاع "STOP")
- شرط خارجي

---

## دعم النماذج المختلفة

يدعم ADK مجموعة واسعة من نماذج اللغة الكبيرة من مزودين مختلفين.

### Google Gemini Models

#### النماذج المتاحة

- `gemini-2.0-flash` - سريع ومثالي للمهام العامة
- `gemini-2.5-pro` - قوي للمهام المعقدة
- `gemini-2.5-flash` - توازن بين السرعة والأداء

#### الميزات المتقدمة

**Gemini Interactions API**

```python
from google.adk.agents import LlmAgent
from google.adk.models.google_llm import Gemini

agent = LlmAgent(
    model=Gemini(
        model="gemini-2.5-flash",
        use_interactions_api=True,  # تفعيل Interactions API
    ),
    name="interactions_agent"
)
```

**فوائد Interactions API:**
- إدارة المحادثات ذات الحالة (stateful)
- كفاءة أعلى للمحادثات الطويلة
- لا حاجة لإرسال السجل الكامل مع كل طلب

**قيود معروفة:**
- لا يدعم خلط الأدوات المخصصة مع الأدوات المدمجة
- حل مؤقت: استخدم `bypass_multi_tools_limit=True`

```python
from google.adk.tools.google_search_tool import GoogleSearchTool

tools=[
    GoogleSearchTool(bypass_multi_tools_limit=True),  # تحويل إلى function tool
    custom_function_tool,
]
```

### Anthropic Claude Models

#### Python (عبر LiteLLM)

```python
from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm

agent = LlmAgent(
    model=LiteLlm(model="anthropic/claude-3-haiku-20240307"),
    name="claude_agent",
    instruction="أنت مساعد مدعوم بـ Claude."
)
```

تأكد من تعيين:
```bash
export ANTHROPIC_API_KEY="YOUR_ANTHROPIC_API_KEY"
```

#### Java (مباشرة)

```java
import com.anthropic.client.AnthropicOkHttpClient;
import com.google.adk.models.Claude;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .apiKey("ANTHROPIC_API_KEY")
    .build();

LlmAgent agent = LlmAgent.builder()
    .model(new Claude("claude-3-7-sonnet-latest", client))
    .name("claude_agent")
    .build();
```

### Claude على Vertex AI

#### Python

```python
from google.adk.models.anthropic_llm import Claude
from google.adk.models.registry import LLMRegistry

# تسجيل Claude في Registry
LLMRegistry.register(Claude)

agent = LlmAgent(
    model="claude-3-sonnet@20240229",  # استخدام معرف Vertex AI
    name="claude_vertex_agent"
)
```

#### Java

```java
import com.anthropic.vertex.backends.VertexBackend;

AnthropicClient client = AnthropicOkHttpClient.builder()
    .backend(
        VertexBackend.builder()
            .region("us-east5")
            .project("your-project-id")
            .googleCredentials(GoogleCredentials.getApplicationDefault())
            .build()
    )
    .build();

LlmAgent agent = LlmAgent.builder()
    .model(new Claude("claude-3-7-sonnet", client))
    .build();
```

### استخدام Apigee كبوابة للنماذج

[Apigee](https://docs.cloud.google.com/apigee/docs/api-platform/get-started/what-apigee) يعمل كبوابة AI قوية توفر:

- **أمان النموذج**: حماية من التهديدات
- **إدارة الحركة**: Rate Limiting & Token Limiting
- **الأداء**: Semantic Caching
- **المراقبة**: تتبع شامل لجميع الطلبات

```python
from google.adk.models.apigee_llm import ApigeeLlm

model = ApigeeLlm(
    model="apigee/gemini-2.5-flash",
    proxy_url=f"https://{APIGEE_PROXY_URL}",
    custom_headers={"Authorization": "Bearer TOKEN"}
)

agent = LlmAgent(
    model=model,
    name="governed_agent"
)
```

### نماذج عبر LiteLLM

LiteLLM يوفر واجهة موحدة لأكثر من 100 نموذج LLM.

```bash
pip install litellm
```

#### OpenAI

```python
from google.adk.models.lite_llm import LiteLlm

agent = LlmAgent(
    model=LiteLlm(model="openai/gpt-4o"),
    name="openai_agent"
)
```

```bash
export OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

#### Cohere

```python
agent = LlmAgent(
    model=LiteLlm(model="cohere/command-r-plus"),
    name="cohere_agent"
)
```

```bash
export COHERE_API_KEY="YOUR_COHERE_API_KEY"
```

### نماذج محلية عبر Ollama

#### اختيار النموذج

تأكد من اختيار نموذج يدعم الأدوات (tools):

```bash
ollama show mistral-small3.1
# تحقق من وجود "tools" في Capabilities
```

#### الاستخدام

```python
from google.adk.models.lite_llm import LiteLlm

agent = LlmAgent(
    model=LiteLlm(model="ollama_chat/mistral-small3.1"),
    name="local_agent"
)
```

```bash
export OLLAMA_API_BASE="http://localhost:11434"
```

**مهم:** استخدم `ollama_chat` وليس `ollama` لتجنب سلوك غير متوقع.

#### تخصيص النموذج

```bash
# استخراج ملف النموذج
ollama show --modelfile llama3.2 > model_file_to_modify

# تعديل القالب حسب احتياجاتك
# ثم إنشاء نموذج جديد
ollama create llama3.2-modified -f model_file_to_modify
```

### نماذج مستضافة على Vertex AI

#### Model Garden

```python
llama3_endpoint = "projects/YOUR_PROJECT/locations/us-central1/endpoints/ENDPOINT_ID"

agent = LlmAgent(
    model=llama3_endpoint,
    name="llama3_vertex_agent"
)
```

#### نماذج مخصصة Fine-tuned

```python
finetuned_endpoint = "projects/YOUR_PROJECT/locations/us-central1/endpoints/FINETUNED_ENDPOINT_ID"

agent = LlmAgent(
    model=finetuned_endpoint,
    name="custom_agent"
)
```

### استكشاف المشاكل

#### خطأ 429 - RESOURCE_EXHAUSTED

**الحلول:**

1. طلب حصة أعلى للنموذج

2. تفعيل إعادة المحاولة التلقائية:

```python
from google.genai import types

agent = LlmAgent(
    model='gemini-2.0-flash',
    generate_content_config=types.GenerateContentConfig(
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                initial_delay=1,
                attempts=2
            ),
        ),
    )
)
```

---

## الأدوات (Tools)

### نظرة عامة

الأدوات توسع قدرات الوكلاء بإتاحة الوصول إلى وظائف خارجية:
- استدعاء APIs
- قراءة/كتابة ملفات
- إجراء حسابات
- البحث في الإنترنت
- تنفيذ أكواد

### الأدوات المدمجة

#### Google Search

```python
from google.adk.tools import google_search

agent = LlmAgent(
    model="gemini-2.0-flash",
    tools=[google_search]
)
```

#### Calculator

```python
from google.adk.tools import calculator

agent = LlmAgent(
    model="gemini-2.0-flash",
    tools=[calculator]
)
```

#### Code Execution

```python
from google.adk.tools import code_execution

agent = LlmAgent(
    model="gemini-2.0-flash",
    tools=[code_execution]
)
```

### إنشاء أدوات مخصصة

#### Python

```python
from google.adk import tool

@tool
def get_weather(location: str) -> str:
    """الحصول على الطقس لموقع معين.

    Args:
        location: اسم المدينة

    Returns:
        وصف حالة الطقس
    """
    # محاكاة استدعاء API
    return f"الطقس في {location}: مشمس، 25 درجة مئوية"

agent = LlmAgent(
    model="gemini-2.0-flash",
    tools=[get_weather]
)
```

#### TypeScript

```typescript
import { tool } from '@google/adk';

const getWeather = tool({
  name: "get_weather",
  description: "الحصول على الطقس لموقع معين",
  parameters: {
    location: { type: "string", required: true }
  },
  execute: async ({ location }) => {
    return `الطقس في ${location}: مشمس، 25 درجة مئوية`;
  }
});
```

### Model Context Protocol (MCP)

MCP هو بروتوكول مفتوح لتوحيد كيفية تواصل نماذج اللغة مع التطبيقات الخارجية.

#### استخدام خادم MCP خارجي

```python
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

agent = LlmAgent(
    model="gemini-2.5-pro",
    tools=[
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@modelcontextprotocol/server-filesystem"],
                )
            )
        )
    ]
)
```

#### استخدام خادم MCP عن بُعد

```python
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPServerParams

agent = LlmAgent(
    model="gemini-2.5-pro",
    tools=[
        McpToolset(
            connection_params=StreamableHTTPServerParams(
                url="https://api.example.com/mcp/",
                headers={"Authorization": "Bearer TOKEN"}
            )
        )
    ]
)
```

### أدوات MCP المتاحة

#### GitHub MCP Server

```python
GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"

agent = LlmAgent(
    model="gemini-2.5-pro",
    name="github_agent",
    instruction="ساعد المستخدمين في الحصول على معلومات من GitHub",
    tools=[
        McpToolset(
            connection_params=StreamableHTTPServerParams(
                url="https://api.githubcopilot.com/mcp/",
                headers={
                    "Authorization": f"Bearer {GITHUB_TOKEN}",
                    "X-MCP-Toolsets": "all",
                    "X-MCP-Readonly": "true"
                }
            )
        )
    ]
)
```

**الأدوات المتاحة:**
- إدارة المستودعات (Repos)
- Issues و Pull Requests
- تحليل الأكواد
- الإجراءات (Actions)
- الأمان (Security)

#### Hugging Face MCP Server

```python
HUGGING_FACE_TOKEN = "YOUR_HUGGING_FACE_TOKEN"

agent = LlmAgent(
    model="gemini-2.5-pro",
    name="huggingface_agent",
    tools=[
        McpToolset(
            connection_params=StreamableHTTPServerParams(
                url="https://huggingface.co/mcp",
                headers={"Authorization": f"Bearer {HUGGING_FACE_TOKEN}"}
            )
        )
    ]
)
```

**الأدوات المتاحة:**
- البحث الدلالي عن النماذج
- البحث عن مجموعات البيانات
- البحث في الأوراق البحثية
- البحث في التوثيق

### Computer Use Toolset

أداة تسمح للوكيل بالتحكم في واجهة المستخدم للحاسوب (Preview).

```bash
# التثبيت
pip install playwright==1.52.0
pip install browserbase==1.3.0
playwright install chromium
```

```python
from google.adk.tools.computer_use.computer_use_toolset import ComputerUseToolset
from .playwright import PlaywrightComputer

agent = LlmAgent(
    model='gemini-2.5-computer-use-preview-10-2025',
    name='computer_use_agent',
    tools=[
        ComputerUseToolset(
            computer=PlaywrightComputer(screen_size=(1280, 936))
        )
    ]
)
```

---

## الذاكرة طويلة المدى

### نظرة عامة

- **Session / State**: ذاكرة قصيرة المدى خلال محادثة واحدة
- **MemoryService**: أرشيف طويل المدى قابل للبحث

### مقارنة خدمات الذاكرة

| الميزة | InMemoryMemoryService | VertexAiMemoryBankService |
|--------|----------------------|---------------------------|
| **الاستمرارية** | لا (تُفقد عند إعادة التشغيل) | نعم (مُدارة بواسطة Vertex AI) |
| **الاستخدام الأساسي** | النماذج الأولية والاختبار | ذاكرة حقيقية متطورة |
| **استخلاص الذاكرة** | تخزين المحادثة كاملة | استخلاص معلومات ذات معنى |
| **البحث** | مطابقة كلمات أساسية | بحث دلالي متقدم |
| **التعقيد** | بدون إعداد | يتطلب Agent Engine |

### InMemoryMemoryService

```python
from google.adk.memory import InMemoryMemoryService
from google.adk.tools import load_memory

memory_service = InMemoryMemoryService()

agent = LlmAgent(
    model="gemini-2.0-flash",
    name="memory_agent",
    tools=[load_memory]
)

runner = Runner(
    agent=agent,
    memory_service=memory_service
)
```

#### مثال: إضافة وبحث في الذاكرة

```python
# 1. جلسة لالتقاط المعلومات
runner1 = Runner(
    agent=info_capture_agent,
    session_service=session_service,
    memory_service=memory_service
)

# تشغيل الجلسة
async for event in runner1.run_async(
    user_id=USER_ID,
    session_id=session1_id,
    new_message=Content(parts=[Part(text="مشروعي المفضل هو Project Alpha.")])
):
    pass

# إضافة الجلسة إلى الذاكرة
completed_session = await runner1.session_service.get_session(...)
await memory_service.add_session_to_memory(completed_session)

# 2. جلسة لاسترجاع المعلومات
runner2 = Runner(
    agent=memory_recall_agent,  # لديه أداة load_memory
    session_service=session_service,
    memory_service=memory_service
)

async for event in runner2.run_async(
    user_id=USER_ID,
    session_id=session2_id,
    new_message=Content(parts=[Part(text="ما هو مشروعي المفضل؟")])
):
    pass
```

### VertexAiMemoryBankService

خدمة ذاكرة مُدارة بالكامل في Google Cloud.

#### المتطلبات

1. مشروع Google Cloud مع Vertex AI مُفعل
2. إنشاء Agent Engine
3. المصادقة

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

#### الإعداد

```bash
adk web --memory_service_uri="agentengine://AGENT_ENGINE_ID"
```

أو يدوياً:

```python
from google.adk.memory import VertexAiMemoryBankService

memory_service = VertexAiMemoryBankService(
    project="PROJECT_ID",
    location="LOCATION",
    agent_engine_id="AGENT_ENGINE_ID"
)

runner = Runner(
    agent=agent,
    memory_service=memory_service
)
```

#### استخدام الأدوات

```python
from google.adk.tools.preload_memory_tool import PreloadMemoryTool

agent = LlmAgent(
    model="gemini-2.0-flash",
    tools=[PreloadMemoryTool()]  # يسترجع الذاكرة تلقائياً
)
```

#### حفظ تلقائي للجلسات

```python
async def auto_save_callback(callback_context):
    await callback_context._invocation_context.memory_service.add_session_to_memory(
        callback_context._invocation_context.session
    )

agent = LlmAgent(
    model="gemini-2.0-flash",
    tools=[PreloadMemoryTool()],
    after_agent_callback=auto_save_callback
)
```

### استخدام عدة خدمات ذاكرة

يمكنك إنشاء خدمات ذاكرة متعددة يدوياً:

```python
class MultiMemoryAgent(Agent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.memory_service = InMemoryMemoryService()
        self.vertexai_memory = VertexAiMemoryBankService(...)

    async def run(self, request, **kwargs):
        # البحث في ذاكرة المحادثات
        conversation_context = await self.memory_service.search_memory(...)

        # البحث في قاعدة معرفة المستندات
        document_context = await self.vertexai_memory.search_memory(...)

        # دمج السياق
        combined_prompt = f"""
        من محادثاتنا السابقة: {conversation_context.memories}
        من المستندات التقنية: {document_context.memories}
        """
        return await self.llm.generate_content_async(combined_prompt)
```

---

## إدارة البيانات الثنائية (Artifacts)

### ما هي Artifacts؟

Artifacts هي آلية لإدارة البيانات الثنائية (صور، ملفات PDF، صوت، فيديو) المرتبطة بالمستخدم أو الجلسة.

### الميزات الأساسية

- **تخزين ملفات**: صور، PDF، صوت، فيديو
- **التحكم في الإصدارات**: تلقائي عند كل حفظ
- **النطاقات**: Session-scoped أو User-scoped
- **التمثيل**: `google.genai.types.Part` مع `inline_data`

### الخدمات المتاحة

#### InMemoryArtifactService

```python
from google.adk.artifacts import InMemoryArtifactService

artifact_service = InMemoryArtifactService()

runner = Runner(
    agent=agent,
    artifact_service=artifact_service
)
```

- مناسب للتطوير والاختبار
- سريع جداً
- يُفقد عند إعادة التشغيل

#### GcsArtifactService

```python
from google.adk.artifacts import GcsArtifactService

gcs_service = GcsArtifactService(
    bucket_name="your-gcs-bucket"
)

runner = Runner(
    agent=agent,
    artifact_service=gcs_service
)
```

- مناسب للإنتاج
- استمرارية كاملة
- قابل للتوسع

### العمليات الأساسية

#### حفظ Artifact

```python
import google.genai.types as types

async def save_report(context, report_bytes: bytes):
    report_artifact = types.Part.from_bytes(
        data=report_bytes,
        mime_type="application/pdf"
    )

    version = await context.save_artifact(
        filename="report.pdf",
        artifact=report_artifact
    )
    print(f"تم الحفظ بإصدار: {version}")
```

#### تحميل Artifact

```python
async def load_report(context):
    # تحميل آخر إصدار
    artifact = await context.load_artifact(filename="report.pdf")

    if artifact and artifact.inline_data:
        pdf_bytes = artifact.inline_data.data
        print(f"حجم الملف: {len(pdf_bytes)} بايت")

    # تحميل إصدار محدد
    artifact_v0 = await context.load_artifact(
        filename="report.pdf",
        version=0
    )
```

#### سرد Artifacts

```python
async def list_files(tool_context):
    files = await tool_context.list_artifacts()
    if files:
        return "الملفات المحفوظة:\n" + "\n".join([f"- {f}" for f in files])
    return "لا توجد ملفات محفوظة"
```

### النطاقات (Namespacing)

#### Session Scope (افتراضي)

```python
# مرتبط بـ: app_name + user_id + session_id
filename = "summary.txt"
await context.save_artifact(filename, artifact)
```

#### User Scope

```python
# مرتبط بـ: app_name + user_id فقط
# يمكن الوصول إليه من جميع جلسات المستخدم
filename = "user:profile.png"
await context.save_artifact(filename, artifact)
```

### أفضل الممارسات

1. **أسماء واضحة**: استخدم أسماء وصفية مع الامتدادات
2. **MIME types صحيح**: حدد النوع بدقة
3. **معالجة الأخطاء**: تحقق من وجود خدمة artifacts
4. **الحجم**: انتبه لأحجام الملفات الكبيرة
5. **التنظيف**: خطط لحذف الملفات القديمة

```python
try:
    version = await context.save_artifact(filename, artifact)
except ValueError as e:
    print("خدمة Artifacts غير مُهيأة")
except Exception as e:
    print(f"خطأ في الحفظ: {e}")
```

---

## بناء واجهات المستخدم

### AG-UI و CopilotKit

[AG-UI](https://docs.ag-ui.com/) يوفر واجهة موحدة لبناء تطبيقات غنية متصلة بالوكلاء.

#### البدء السريع

```bash
npx create-ag-ui-app@latest --adk
```

#### ميزات واجهة المحادثة

```tsx
import { CopilotSidebar } from '@copilotkit/react-ui';

<CopilotSidebar
  clickOutsideToClose={false}
  defaultOpen={true}
  labels={{
    title: "المساعد",
    initial: "مرحباً! كيف يمكنني مساعدتك؟"
  }}
/>
```

#### Generative UI للأدوات

```tsx
import { useCopilotAction } from '@copilotkit/react-core';

useCopilotAction({
  name: "get_weather",
  description: "الحصول على الطقس لموقع معين",
  parameters: [
    { name: "location", type: "string", required: true }
  ],
  render: ({ args }) => {
    return <WeatherCard location={args.location} />
  }
});
```

#### مشاركة الحالة

```tsx
import { useCoAgent } from '@copilotkit/react-core';

const { state, setState } = useCoAgent<AgentState>({
  name: "my_agent",
  initialState: {
    items: []
  }
});

// الحالة متزامنة تلقائياً مع الوكيل
```

#### التشغيل

```bash
npm install && npm run dev
```

---

## خدمات Google Cloud المتكاملة

### MCP Toolbox for Databases

أداة MCP شاملة توفر وصولاً آمناً لمصادر البيانات.

#### قواعد البيانات المدعومة

**Google Cloud:**
- BigQuery
- AlloyDB (PostgreSQL)
- Spanner
- Cloud SQL (PostgreSQL, MySQL, SQL Server)
- Firestore
- Bigtable
- Dataplex

**قواعد البيانات العلائقية:**
- PostgreSQL
- MySQL
- Microsoft SQL Server
- ClickHouse
- TiDB
- SQLite
- YugabyteDB

**NoSQL:**
- MongoDB
- Couchbase
- Redis
- Cassandra

**قواعد البيانات البيانية:**
- Neo4j
- Dgraph

**منصات البيانات:**
- Looker
- Trino

#### الاستخدام

راجع [توثيق MCP Toolbox](/adk-docs/tools/google-cloud/mcp-toolbox-for-databases/) للحصول على تفاصيل التكامل.

### Gemini GenMedia MCP Servers

خوادم MCP لخدمات الوسائط التوليدية من Google Cloud:
- Imagen (توليد صور)
- Veo (توليد فيديو)
- Chirp 3 HD (أصوات عالية الجودة)
- Lyria (توليد موسيقى)

#### مثال

راجع [مثال وكيل ADK](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia/sample-agents/adk)

### FastMCP Server

[FastMCP](https://github.com/jlowin/fastmcp) يبسط بناء خوادم MCP مخصصة.

```python
from fastmcp import FastMCP

mcp = FastMCP("my_server")

@mcp.tool()
def my_tool(param: str) -> str:
    """وصف الأداة"""
    return f"نتيجة: {param}"

# النشر على Cloud Run
```

---

## بناء الوكلاء باستخدام ملفات التكوين (Agent Config)

### نظرة عامة

Agent Config تسمح لك ببناء وكلاء ADK باستخدام ملفات YAML بدون كتابة أكواد.

**الميزات:**
- تعريف الوكلاء بـ YAML
- دعم الأدوات والوكلاء الفرعية
- سهولة النشر
- دعم Python فقط حالياً (تجريبي)

### البدء السريع

```bash
# إنشاء مشروع Agent Config
adk create --type=config my_agent

# إعداد المفاتيح في .env
cd my_agent
# عدّل ملف .env

# تحرير التكوين
# عدّل root_agent.yaml

# التشغيل
adk web
```

### مثال بسيط

```yaml
# root_agent.yaml
name: assistant_agent
model: gemini-2.5-flash
description: وكيل مساعد يمكنه الإجابة على أسئلة المستخدمين
instruction: أنت وكيل للمساعدة في الإجابة على الأسئلة المتنوعة
```

### مثال مع أداة مدمجة

```yaml
name: search_agent
model: gemini-2.0-flash
description: وكيل بحث يستخدم Google Search
instruction: أنت وكيل متخصص في البحث والإجابة على الأسئلة
tools:
  - name: google_search
```

### مثال مع أداة مخصصة

```yaml
agent_class: LlmAgent
model: gemini-2.5-flash
name: prime_agent
description: وكيل للتحقق من الأعداد الأولية
instruction: |
  أنت مسؤول عن التحقق من الأعداد الأولية.
  استخدم أداة check_prime مع قائمة من الأعداد.
tools:
  - name: ma_llm.check_prime
```

### مثال مع وكلاء فرعية

```yaml
agent_class: LlmAgent
model: gemini-2.5-flash
name: root_agent
description: مساعد تعليمي للبرمجة والرياضيات
instruction: |
  أنت مساعد تعليمي يساعد الطلاب في الأسئلة البرمجية والرياضية.

  الخطوات:
  1. إذا سأل المستخدم عن البرمجة، فوّض إلى code_tutor_agent
  2. إذا سأل عن الرياضيات، فوّض إلى math_tutor_agent
  3. قدم دائماً شروحات واضحة
sub_agents:
  - config_path: code_tutor_agent.yaml
  - config_path: math_tutor_agent.yaml
```

### النشر

يمكن نشر وكلاء Agent Config على:
- Cloud Run
- Agent Engine

راجع أدلة النشر للتفاصيل.

### القيود المعروفة

- **النماذج**: Gemini فقط حالياً
- **اللغات**: Python فقط
- **أنواع الوكلاء**: لا يدعم `LangGraphAgent` و `A2aAgent`
- **بعض الأدوات** غير مدعومة بالكامل

---

## موارد إضافية

### أمثلة الأكواد

- [مستودع الأمثلة الرسمي](https://github.com/google/adk-python/tree/main/contributing/samples)
- [أمثلة Agent Config](https://github.com/search?q=repo:google/adk-python+path:/^contributing\/samples//+root_agent.yaml)

### التوثيق

- [التوثيق الرسمي](https://ai.google.dev/adk)
- [مرجع CLI](https://ai.google.dev/adk/api-reference/cli)
- [مرجع Agent Config](https://ai.google.dev/adk/api-reference/agentconfig)

### روابط مفيدة

- [GitHub - ADK Python](https://github.com/google/adk-python)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Vertex AI Docs](https://cloud.google.com/vertex-ai/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [CopilotKit](https://copilotkit.ai)
- [AG-UI Dojo](https://dojo.ag-ui.com)

### الدعم

- [Issues على GitHub](https://github.com/google/adk-python/issues)
- [طلبات الميزات](https://github.com/google/adk-python/issues/new?template=feature_request.md)
- [Community Discussions](https://github.com/google/adk-python/discussions)

---

## الخلاصة

هذا الدليل يغطي الأساسيات والميزات المتقدمة لـ ADK:

✅ **تم تغطيتها:**
- إعداد البيئة والمصادقة
- إنشاء وكلاء LLM و Workflow
- دعم نماذج متعددة (Gemini, Claude, OpenAI, Ollama)
- الأدوات المدمجة والمخصصة و MCP
- إدارة الذاكرة والجلسات
- Artifacts للبيانات الثنائية
- بناء واجهات المستخدم
- Agent Config (YAML)
- التكامل مع Google Cloud

🚀 **الخطوات التالية:**
- جرّب الأمثلة البسيطة
- أنشئ أدواتك المخصصة
- طوّر نظام multi-agent
- انشر وكيلك إلى الإنتاج

**نجاح موفق في رحلتك مع ADK!** 🎉
