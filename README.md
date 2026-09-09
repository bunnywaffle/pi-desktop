# Pi Desktop 🥧⚡

> Modern Electron desktop GUI, manager, and control layer for the **[Pi coding agent](https://pi.dev)**.

![Pi Desktop](https://raw.githubusercontent.com/bunnywaffle/pi-desktop/main/dist/icon.png)

Pi Desktop acts as a frontend, session manager, and visual command center around an existing Pi installation. It interfaces directly with Pi via high-performance JSON-RPC mode over standard input/output.

---

## ✨ Features

- 🔍 **Automatic Pi Detection**: Automatically detects your Pi installation (npm global, curl/installer script, or local PATH) and validates functionality on startup.
- 🚀 **Auto-Start Agent**: Automatically initializes the Pi background RPC session on launch with your default model, provider, and reasoning parameters.
- 📁 **User-Driven Projects & Sessions**: Clean, zero-mock workspace. Open folders on demand and manage individual project sessions.
- 📜 **Load Existing Pi Sessions**: Native loader for sessions stored in ~/.pi/agent/sessions/. Accurately resolves original workspace directories and restores complete conversation transcripts (user turns, thinking chains, tool calls, and assistant responses).
- 🔄 **Revert & Edit Requests**: Hover over any user message in the chat to edit the prompt or rollback the conversation to that specific turn.
- 📦 **Online Package Catalog ([pi.dev/packages](https://pi.dev/packages))**:
  - Discover and 1-click install official & community packages (pi-mcp-adapter, pi-web-access, pi-subagents, @companion-ai/feynman, etc.).
  - Direct 1-click install bar for custom npm packages, GitHub repositories, or direct URLs.
  - Category filters: Extensions, Tools, Skills, and Providers.
- 🧠 **Model Search & Reasoning Control**: Instant fuzzy search across hundreds of online models with thinking/reasoning effort toggles (off, minimal, low, medium, high).
- 🔌 **Custom OpenAI-Compatible Providers**: Add local LLMs (Ollama, LM Studio, vLLM, LocalAI) or proxy endpoints configured natively in Pi's models.json and uth.json.
- 🧩 **Manager Hub**:
  - **Packages**: Installed & online packages manager.
  - **Online Models**: Directory of 400+ models from OpenCode, Kilo, OpenAI, Anthropic, DeepSeek, etc.
  - **Extensions**: Extension options dialog for configuring custom options and environment variables.
  - **Prompts & Themes**: Visual prompt template library and live theme switching.
  - **Raw Pi Terminal**: Interactive embedded terminal for direct CLI interaction.
- 🌉 **TUI-to-GUI Dialog Bridge**: Intercepts interactive Pi prompts (e.g. @juicesharp/rpiv-ask-user-question, confirmations) and renders them as native GUI modals.

---

## 💾 Download Portable Binary

You can download the zero-dependency standalone executable from [**Releases**](https://github.com/bunnywaffle/pi-desktop/releases):

- **Pi Desktop-Portable.exe** (~72 MB)
- No installation required. Double-click and run on Windows 10/11 (x64).

---

## 🛠️ Development & Building

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or higher)
- [Pi coding agent](https://pi.dev) (
pm install -g @mariozechner/pi or installed via script)

### Setup

`ash
git clone https://github.com/bunnywaffle/pi-desktop.git
cd pi-desktop
npm install
`

### Run in Development

`ash
npm run dev
`

### Build Source

`ash
npm run build
`

### Package Portable Executable

`ash
npm run build:portable
`

The output binary will be generated in elease/Pi Desktop-Portable.exe.

---

## 📄 License

MIT License
