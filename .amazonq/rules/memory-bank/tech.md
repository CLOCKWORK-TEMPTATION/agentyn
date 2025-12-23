# Technology Stack

## Programming Languages

### TypeScript
- **Version**: 5.3.3
- **Target**: ES2022
- **Module System**: ESNext with ESM (ES Modules)
- **Configuration**: Strict mode enabled with full type checking
- **Node Types**: @types/node ^20.11.0

### Python
- **Implementation**: Standard Python 3.x
- **Usage**: Agent implementations and automation scripts
- **Style**: Modern Python with type hints support

## Runtime & Execution

### Node.js
- **Module Type**: ESM (type: "module" in package.json)
- **Loader**: ts-node/esm for TypeScript execution
- **Start Command**: `npm start` runs TypeScript agent directly

### TypeScript Execution
- **ts-node**: ^10.9.2 for runtime TypeScript execution
- **Module Resolution**: Node-style with esModuleInterop enabled

## Core Dependencies

### MCP (Model Context Protocol)
- **@modelcontextprotocol/sdk**: ^0.5.0
- Primary framework for building MCP-compliant agent servers
- Provides standardized protocol implementation

### LangChain Ecosystem
- **langchain**: ^0.1.30 - Core LangChain framework
- **@langchain/anthropic**: ^0.1.0 - Anthropic/Claude integration
- **@langchain/community**: ^0.0.45 - Community integrations
- **@langchain/core**: ^0.1.52 - Core LangChain abstractions

### LlamaIndex
- **llamaindex**: ^0.1.0
- Document indexing and retrieval framework
- Enables RAG (Retrieval-Augmented Generation) patterns

## Development Tools

### Build System
- **Vite**: Implied through project structure (though not in package.json)
- **TypeScript Compiler**: tsc via typescript package
- **Module Bundling**: ESM native support

### Configuration Files
- **tsconfig.json**: TypeScript compiler options
- **package.json**: Dependencies and scripts
- **.env**: Environment variables (API keys, configuration)

## Development Commands

```bash
# Install dependencies
npm install

# Start TypeScript agent server
npm start

# Run Python agents directly
python agent_example_windows.py
python advanced_agent_example.py
```

## Environment Variables

Required environment variables (stored in .env):
- **GROQ_API_KEY**: Groq API authentication
- **ANTHROPIC_API_KEY**: Anthropic/Claude API authentication
- Additional MCP-specific configuration as needed

## Integration Points

### MCP Configuration
- Location: `.kiro/settings/mcp.json`
- Defines agent server connections and capabilities
- Manages tool registration and discovery

### Workspace Configuration
- **agents.code-workspace**: VS Code multi-root workspace
- Enables organized development across multiple agent implementations
