# Development Guidelines

## Code Quality Standards

### Bilingual Code Documentation
- **Arabic Comments and Docstrings**: All three files use Arabic for comments, docstrings, and user-facing messages
- **English Code Identifiers**: Function names, variable names, and class names use English
- **Consistent Pattern**: Arabic for documentation/UI, English for code structure
- Example:
```python
@tool
def get_weather_info(city: str) -> str:
    """الحصول على معلومات الطقس لمدينة معينة.
    
    Args:
        city: اسم المدينة
    """
```

### Type Annotations
- **Python**: All function signatures include type hints (3/3 files)
```python
def load_env_file() -> None:
def calculator(expression: str) -> str:
def create_bedrock_agent() -> Agent:
```
- **TypeScript**: Explicit typing for parameters and return values
```typescript
async loadDocuments(documentsPath: string): Promise<void>
async query(question: string): Promise<string>
```

### Error Handling Patterns
- **Try-Except Blocks**: Comprehensive error handling in all agent creation functions (3/3 files)
- **Graceful Degradation**: Return None or error messages instead of crashing
- **User-Friendly Messages**: Arabic error messages with actionable guidance
```python
except ImportError:
    print("❌ OpenAI غير مثبت. شغّل: pip install 'strands-agents[openai]'")
    return None
except Exception as e:
    print(f"❌ خطأ في إعداد OpenAI: {e}")
    return None
```

### Docstring Format
- **Google Style**: Args section with parameter descriptions (3/3 files)
- **Arabic Documentation**: All docstrings written in Arabic
```python
"""معالج نصوص متقدم.

Args:
    text: النص المراد معالجته
    operation: العملية (upper, lower, reverse, count_words, count_chars)
"""
```

## Semantic Patterns

### Agent Factory Pattern
All files implement factory functions for creating agents with different providers:
```python
def create_bedrock_agent() -> Agent:
def create_anthropic_agent() -> Agent | None:
def create_openai_agent() -> Agent | None:
def create_gemini_agent() -> Agent | None:
```
- **Frequency**: 3/3 files use this pattern
- **Purpose**: Encapsulate provider-specific configuration and error handling

### Tool Decorator Pattern
Custom tools are defined using the @tool decorator:
```python
@tool
def calculator(expression: str) -> str:
    """حاسبة رياضية متقدمة."""
    # implementation
```
- **Frequency**: 2/3 Python files
- **Consistency**: All tools follow same structure with docstrings and type hints

### Environment Variable Management
- **Manual .env Loading**: Custom load_env_file() function (1/3 files)
- **os.environ.get()**: Standard pattern for API key retrieval (3/3 files)
```python
api_key = os.environ.get("ANTHROPIC_API_KEY")
if not api_key:
    print("مفتاح ANTHROPIC_API_KEY غير موجود")
    return None
```

### Interactive CLI Pattern
Both Python files implement interactive menu-driven interfaces:
```python
while True:
    choice = input("\\nاختر موفر (1-6): ").strip()
    if choice == "6":
        break
    # handle choice
```
- **Nested Loops**: Outer loop for provider selection, inner loop for conversation
- **Back Navigation**: Support for returning to main menu with 'رجوع' or 'back'
- **Keyboard Interrupt Handling**: Graceful exit on Ctrl+C

### Agent Configuration Pattern
Consistent structure for agent initialization:
```python
return Agent(
    model=model,  # or model_id string
    tools=[tool1, tool2, tool3],
    system_prompt="Arabic instructions..."
)
```

## Internal API Usage

### Strands SDK (Python)
```python
from strands import Agent, tool
from strands_tools import calculator, python_repl, http_request

# Tool definition
@tool
def custom_tool(param: str) -> str:
    """Tool description in Arabic"""
    return result

# Agent creation
agent = Agent(
    tools=[calculator, custom_tool],
    system_prompt="System instructions"
)

# Agent invocation
response = agent(user_input)
```

### Model Context Protocol SDK (TypeScript)
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Server initialization
const server = new Server(
  { name: 'my-agent-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [/* tool definitions */] };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // handle tool execution
});

// Server connection
const transport = new StdioServerTransport();
await server.connect(transport);
```

### LangChain Integration (TypeScript)
```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { DynamicTool } from "@langchain/core/tools";

// Model setup
const model = new ChatAnthropic({
  model: "claude-3-sonnet-20240229",
  temperature: 0,
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Custom tool
const customTool = new DynamicTool({
  name: "tool_name",
  description: "Tool description",
  func: async (input: string) => {
    // implementation
    return result;
  },
});

// Agent creation
const prompt = await pull("hwchase17/react");
const agent = await createReactAgent({ llm: model, tools, prompt });
const agentExecutor = new AgentExecutor({ agent, tools, verbose: true });

// Agent invocation
const result = await agentExecutor.invoke({ input: "user query" });
```

### LlamaIndex Integration (TypeScript)
```typescript
import {
  VectorStoreIndex,
  SimpleDirectoryReader,
  OpenAI,
  Settings,
} from "llamaindex";

// Configure LLM
Settings.llm = new OpenAI({
  model: "gpt-4",
  apiKey: process.env.OPENAI_API_KEY,
});

// Load and index documents
const reader = new SimpleDirectoryReader();
const documents = await reader.loadData(documentsPath);
const index = await VectorStoreIndex.fromDocuments(documents);

// Query engine
const queryEngine = index.asQueryEngine();
const response = await queryEngine.query({ query: question });

// Chat engine
const chatEngine = index.asChatEngine();
const response = await chatEngine.chat({ message: question });
```

## Code Idioms

### Safe Evaluation Pattern
```python
safe_dict = {
    "__builtins__": {},
    "abs": abs, "round": round, "sqrt": math.sqrt,
    "pi": math.pi, "e": math.e
}
result = eval(expression, safe_dict)
```
- **Purpose**: Execute user expressions safely without exposing dangerous builtins
- **Frequency**: 1/3 files (calculator tool)

### Emoji Status Indicators
```python
print("🚀 مرحباً بك في مثال Strands المتقدم!")
print("✅ تم تفعيل {agent_name} Agent")
print("❌ خطأ: {e}")
print("🤖 يعمل...")
print("👋 وداعاً!")
```
- **Frequency**: 1/3 files (advanced_agent_example.py)
- **Purpose**: Visual feedback for different states (success, error, processing, exit)

### Dictionary-Based Mock Data
```python
weather_data = {
    "القاهرة": "مشمس، 28°م",
    "الرياض": "حار، 35°م",
    "دبي": "مشمس، 32°م"
}
return weather_data.get(city, f"لا توجد بيانات طقس لـ {city}")
```
- **Frequency**: 2/3 files
- **Purpose**: Demonstrate tool functionality without external API dependencies

### Model Configuration Dictionary
```python
bedrock_models = {
    "1": "anthropic.claude-sonnet-4-20250514-v1:0 (افتراضي)",
    "2": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "3": "us.amazon.nova-premier-v1:0",
}
```
- **Purpose**: User-friendly model selection with Arabic labels

## Best Practices

### API Key Validation
Always check for API keys before attempting to create agents:
```python
if not os.environ.get('AWS_BEDROCK_API_KEY'):
    print("مفتاح AWS_BEDROCK_API_KEY غير موجود")
    continue
```

### Verbose Agent Execution
Enable verbose mode for debugging and transparency:
```typescript
const agentExecutor = new AgentExecutor({
  agent,
  tools,
  verbose: true,  // Shows reasoning steps
});
```

### Timeout Configuration
Set reasonable timeouts for HTTP requests:
```python
response = requests.get(url, timeout=10)
```

### Async/Await Consistency
TypeScript code consistently uses async/await for all asynchronous operations (3/3 async functions in TypeScript file)

### Main Guard Pattern
All Python files use the standard main guard:
```python
if __name__ == "__main__":
    main()
```

### Tool Composition
Combine built-in and custom tools for comprehensive agent capabilities:
```python
tools=[calculator, python_repl, http_request, get_weather_info, simple_translate]
```
