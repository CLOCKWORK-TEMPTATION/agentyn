# CLAUDE.md
##تحدث دائما باللغعة العربية  مع المستخدم 
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains multi-agent AI implementations using two different frameworks:
1. **Strands Agents SDK (Python)** - Amazon Bedrock-based agents with support for multiple LLM providers
2. **MCP Server with LangChain (TypeScript)** - Model Context Protocol server with LangChain and LlamaIndex integration

Both implementations support custom tools and multi-provider architectures, allowing flexible agent development across different AI platforms.

## Development Environment Setup

### Python Environment
The Python codebase uses a virtual environment located in `venv/`.

**Activate virtual environment:**
- Windows: `venv\Scripts\activate`
- Unix/Mac: `source venv/bin/activate`

**Install Python dependencies:**
```bash
pip install strands-agents strands-agents-tools
pip install 'strands-agents[anthropic]'  # For Anthropic Claude
pip install 'strands-agents[openai]'     # For OpenAI GPT
pip install 'strands-agents[gemini]'     # For Google Gemini
```

### TypeScript/Node Environment
The TypeScript codebase uses npm/npx for package management.

**Install dependencies:**
```bash
npm install
```

**Run the MCP server:**
```bash
npm start
```

This executes `tsx "my agent.ts"` which starts the MCP server with stdio transport.

## Environment Variables

The project uses `.env` file for configuration. Required variables:

- `AWS_BEDROCK_API_KEY` - Amazon Bedrock API key (base64 encoded)
- `ANTHROPIC_API_KEY` - Direct Anthropic API key (optional)
- `OPENAI_API_KEY` - OpenAI API key (optional, for LlamaIndex)
- `GOOGLE_API_KEY` - Google Gemini API key (optional)

The Python examples include a custom `.env` loader since `python-dotenv` has Windows compatibility issues with `fcntl`.

## Running Agents

### Python Strands Agents

**Basic agent with default Bedrock model:**
```bash
python advanced_agent_example.py
```

**Agent with multiple provider options:**
```bash
python agent_example_windows.py
```

The interactive menu lets you choose between:
1. Amazon Bedrock (default: `anthropic.claude-sonnet-4-20250514-v1:0`)
2. Amazon Bedrock with custom model selection
3. Anthropic Claude (direct)
4. OpenAI GPT
5. Google Gemini

**Available Bedrock models:**
- `anthropic.claude-sonnet-4-20250514-v1:0` (default)
- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `us.amazon.nova-premier-v1:0`
- `us.amazon.nova-pro-v1:0`
- `us.meta.llama3-2-90b-instruct-v1:0`

### TypeScript MCP Server

The MCP server runs as a background process using stdio transport. It provides:
- Calculator tool with math.js for complex expressions
- LangChain ReAct agent with custom tools
- LlamaIndex document agent for RAG workflows

The server connects via `StdioServerTransport` and logs to stderr.

## Architecture

### Python Strands Architecture

**Agent Creation Pattern:**
```python
from strands import Agent, tool

@tool
def custom_tool(param: str) -> str:
    """Tool description for LLM understanding."""
    # Implementation
    return result

agent = Agent(
    tools=[custom_tool, calculator, http_request],
    system_prompt="Agent instructions..."
)

response = agent("User query")
```

**Custom Tools:**
All custom tools use the `@tool` decorator and include:
- Type hints for parameters
- Docstring describing purpose and arguments
- Error handling that returns user-friendly messages

**Multi-Provider Pattern:**
Each provider (Bedrock, Anthropic, OpenAI, Gemini) has a separate factory function (`create_<provider>_agent()`) that:
1. Checks for required API keys in environment
2. Imports provider-specific model class
3. Configures model with appropriate parameters
4. Returns configured Agent instance or None on failure

### TypeScript MCP Architecture

**MCP Server Structure:**
- Uses `@modelcontextprotocol/sdk` for server implementation
- Registers tools via `server.tool()` with Zod schemas
- Connects via stdio transport for IPC with clients

**LangChain Integration:**
- `ChatAnthropic` model with Claude Sonnet 4.5
- ReAct agent pattern via `createReactAgent()`
- Custom `DynamicTool` implementations for domain-specific functionality

**LlamaIndex Integration:**
- `DocumentAgent` class for RAG workflows
- `VectorStoreIndex` for document embedding and retrieval
- `SimpleDirectoryReader` for loading documents from filesystem
- Separate query engine and chat engine interfaces

### Tool Development Guidelines

**Python Tools (Strands):**
- Always use `@tool` decorator
- Include comprehensive docstrings with Args section
- Return strings (agent handles display)
- Catch exceptions and return error messages as strings
- Use type hints for all parameters

**TypeScript Tools (MCP):**
- Define Zod schemas for parameter validation
- Return objects with `content` array containing text objects
- Set `isError: true` for error responses
- Use `describe()` on Zod schemas for LLM context

**Common Tools Pattern:**
Both codebases implement similar tool categories:
- Calculator (math expressions)
- HTTP requests (API calls, web fetching)
- Text processing (transformation, analysis)
- Weather info (example external data)

## Windows-Specific Considerations

The Python code is specifically adapted for Windows:
1. Custom `.env` file loader (avoids `fcntl` dependency)
2. Uses `venv\Scripts\activate` instead of `source venv/bin/activate`
3. All file paths use Windows-compatible formats

## Testing Agent Tools

**Test calculator tool:**
```python
agent("احسب sqrt(144) + 2**3")  # Expected: 20.0
```

**Test HTTP tool:**
```python
agent("اجلب بيانات من https://api.github.com/users/octocat")
```

**Test text processing:**
```python
agent("عد الكلمات في النص: hello world from AI")  # Expected: 5
```

## Common Commands

**Python development:**
```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Run interactive agent
python agent_example_windows.py

# Run advanced multi-provider example
python advanced_agent_example.py
```

**TypeScript development:**
```bash
# Install dependencies
npm install

# Start MCP server
npm start

# Type checking
npx tsc --noEmit
```

## Code Organization

- `agent_example_windows.py` - Main interactive agent with multi-provider support
- `advanced_agent_example.py` - Additional provider examples and custom tools
- `my agent.ts` - MCP server with LangChain and LlamaIndex integration
- `checkpoint_agents_setup.md` - Detailed Arabic documentation of setup process
- `package.json` - Node dependencies and scripts
- `tsconfig.json` - TypeScript configuration (ES2022, ESNext modules)
- `.env` - Environment variables (not committed, required for operation)

## Integration Points

The TypeScript MCP server can be integrated with the Python agents through:
1. MCP protocol for tool registration
2. Shared HTTP endpoints if web server is added
3. Common data formats (JSON) for inter-agent communication

Both implementations follow tool-based agent patterns where:
- Tools are registered with schemas/descriptions
- LLM decides which tools to call based on user queries
- Tool results are returned to LLM for final response synthesis
