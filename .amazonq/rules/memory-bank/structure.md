# Project Structure

## Directory Organization

```
e:\agents/
├── .amazonq/                    # Amazon Q IDE configuration
│   └── rules/
│       └── memory-bank/         # Project documentation and memory bank
├── .kiro/                       # Kiro framework configuration
│   ├── settings/
│   │   └── mcp.json            # MCP server settings
│   └── specs/
│       └── agents-integration/ # Agent integration specifications
├── .env                         # Environment variables and API keys
├── advanced_agent_example.py    # Advanced Python agent implementation
├── agent_example_windows.py     # Windows-specific Python agent
├── my agent.ts                  # TypeScript MCP agent server
├── package.json                 # Node.js dependencies and scripts
├── tsconfig.json               # TypeScript compiler configuration
├── agents.code-workspace       # VS Code workspace configuration
├── AGENTS.md                   # Project documentation
└── checkpoint_agents_setup.md  # Setup checkpoint documentation
```

## Core Components

### Agent Implementations
- **agent_example_windows.py**: Windows-optimized Python agent with proper path handling and OS-specific configurations
- **advanced_agent_example.py**: Sophisticated Python agent demonstrating advanced patterns and capabilities
- **my agent.ts**: TypeScript-based MCP agent server using the official MCP SDK

### Configuration Files
- **.kiro/settings/mcp.json**: Configures MCP server connections and agent integration points
- **.env**: Stores API keys (Groq, Anthropic) and environment-specific settings
- **tsconfig.json**: TypeScript compilation settings with ES2022 target and ESNext modules

### Documentation
- **AGENTS.md**: Comprehensive project documentation covering architecture, workflow, and dependencies
- **checkpoint_agents_setup.md**: Setup instructions and configuration checkpoints

## Architectural Patterns

### MCP Protocol Integration
The project follows the Model Context Protocol standard for agent communication:
- Standardized message passing between agents and AI systems
- Tool/resource registration and discovery
- Prompt template management
- Server-client architecture

### Multi-Language Support
- **Python Track**: Uses native Python with potential LangChain integration
- **TypeScript Track**: Leverages @modelcontextprotocol/sdk for type-safe agent development
- Both tracks can interoperate through MCP protocol

### Agent Server Pattern
Agents are implemented as servers that:
1. Register available tools and capabilities
2. Listen for requests from MCP clients
3. Execute requested operations
4. Return structured responses

### Development Workflow
1. Configure MCP settings in .kiro/settings/mcp.json
2. Implement agent logic in Python or TypeScript
3. Register tools and handlers
4. Test through MCP client connections
5. Deploy as standalone agent servers
