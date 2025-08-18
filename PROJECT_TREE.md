# 🧠 Velvet Core - Project Structure Tree

## 📁 Root Directory
```
velvet_core/
├── 📄 index.html                    # Main HTML entry point
├── 📄 vite.config.ts                # Vite configuration
├── 📄 tsconfig.json                 # TypeScript configuration
├── 📄 package.json                  # Project dependencies
├── 📄 package-lock.json             # Locked dependencies
├── 📄 README.md                     # Project documentation
├── 📄 README_phase_two.md           # Phase two documentation
├── 📄 checklist.md                  # Development checklist
├── 📄 whisperback_manifest.json     # Whisperback system manifest
├── 📄 starter_interests_manifest.json # Starter interests configuration
├── 📄 example.ts                    # Example implementation
├── 📄 interface.ts                  # Interface definitions
└── 📁 .vite/                       # Vite build cache
    ├── 📄 deps/_metadata.json
    └── 📄 deps/package.json
```

## 🧠 Enhanced Core Engines
```
📁 engines/                          # Core engine system
├── 📄 index.ts                      # Clean re-exports for all engines
├── 📁 companion/                    # Enhanced companion engine
│   ├── 📄 cheriCompanionEngine.ts   # Advanced emotional AI companion
│   └── 📄 example-usage.ts         # Usage examples and patterns
├── 📁 memory/                       # Memory management system
│   ├── 📄 MemoryLog.ts              # Memory logging and retrieval
│   └── 📄 CompanionMemoryHooks.ts   # React hooks for memory system
├── 📄 whisperbackEngine.ts          # Enhanced whisperback with memory integration
├── 📄 engineInterface.ts            # Engine adapter interface
├── 📄 engineRouter.ts               # Engine routing system
├── 📄 engineAdapter_mistral.ts      # Mistral AI engine adapter
├── 📄 engineAdapter_stub.ts         # Stub engine for testing
├── 📄 engineTestSuite.ts            # Engine testing framework
├── 📄 fallbackManager.ts            # Fallback engine management
├── 📄 hierarchyController.ts        # Engine hierarchy control
└── 📄 thoughtClassifier.ts          # Thought classification system
```

## 🧠 Brain System
```
📁 brain/                            # Cognitive processing system
├── 📄 behaviorEngine.ts             # Behavior decision engine
├── 📄 feelingSystem.ts              # Emotional state management
├── 📄 internalMonologueEngine.ts    # Internal thought processing
└── 📄 toneRouter.ts                 # Tone and mood routing
```

## 🧠 Memory & Whisperback
```
📁 memory/                           # Memory management
└── 📄 whisperback.ts                # Whisperback memory system

📁 ui/hooks/                         # React hooks
└── 📄 useWhisperback.ts             # Whisperback React hook
```

## 🧠 Core Agent System
```
📁 src/                              # Main source code
├── 📁 agents/                       # AI agent implementations
│   ├── 📄 cheriAgent.ts             # Cheri agent core
│   ├── 📄 index.ts                  # Agent exports
│   ├── 📄 memoryCore.ts             # Memory core system
│   ├── 📄 sessions.ts               # Session management
│   ├── 📄 watcher.ts                # Agent monitoring
│   └── 📄 zorathia.ts               # Zorathia agent
├── 📁 core/                         # Core system components
│   ├── 📄 core.ts                   # Main core system
│   ├── 📄 emotion.ts                # Emotional processing
│   ├── 📄 fabric.ts                 # System fabric
│   ├── 📄 memory.ts                 # Memory management
│   ├── 📄 mood_engine.ts            # Mood processing engine
│   └── 📄 types.ts                  # Type definitions
└── 📄 main.tsx                      # React demo application
```

## 🧠 Interest Tracking System
```
📁 cheri_core/                       # Cheri-specific components
└── 📁 engines/                      # Interest tracking engines
    ├── 📄 interest_tracker.ts       # Advanced interest management
    ├── 📄 interface.ts              # Interest system interfaces
    └── 📄 example.ts                # Interest tracking examples
```

## 🎭 Ambient Content System
```
📁 ambient_content/                  # Rich ambient companionship
├── 📁 reading_snippets/             # Literary content
│   ├── 📄 hitchhiker_excerpt.txt    # Hitchhiker's Guide excerpt
│   ├── 📄 poe_the_raven.txt         # Edgar Allan Poe excerpt
│   └── 📄 discworld_blurb.txt       # Discworld excerpt
├── 📁 radio_lines/                  # Radio-style content
│   └── 📄 noir_quotes.json          # Noir radio quotes
└── 📁 humming/                      # Audio ambient content
    ├── 📄 hum_1.ogg                 # Ambient humming 1
    ├── 📄 hum_2.ogg                 # Ambient humming 2
    └── 📄 crossword_mutter.ogg      # Crossword muttering
```

## 🧪 UI Components & Testing
```
📁 ui/                               # User interface components
├── 📄 ToneVisualizer.tsx            # Tone visualization component
├── 📄 toneMatrixTest.tsx            # Tone matrix testing
└── 📁 hooks/                        # Custom React hooks
    └── 📄 useWhisperback.ts         # Whisperback integration hook
```

## 🚀 Sprint Seed Projects
```
📁 cheri_core_sprint_seed/           # Sprint development version
├── 📄 package.json                  # Sprint dependencies
├── 📄 package-lock.json             # Sprint locked dependencies
├── 📄 README.md                     # Sprint documentation
├── 📄 dev_roadmap.md                # Development roadmap
├── 📄 Sprint_Checklist.md           # Sprint completion checklist
├── 📄 tsconfig.json                 # Sprint TypeScript config
├── 📄 vite.config.ts                # Sprint Vite config
├── 📁 src/                          # Sprint source code
│   ├── 📄 App.tsx                   # Main application
│   ├── 📄 index.html                # HTML entry point
│   ├── 📄 index.ts                  # Main entry point
│   ├── 📄 main.tsx                  # React entry point
│   ├── 📁 adapters/                 # Storage adapters
│   │   └── 📁 storage/
│   │       ├── 📄 InMemoryAdapter.ts
│   │       └── 📄 StorageAdapter.ts
│   ├── 📁 agents/                   # Agent implementations
│   │   ├── 📄 cheri.ts              # Cheri agent
│   │   └── 📄 zora.ts               # Zora agent
│   ├── 📁 bridges/                  # System bridges
│   │   ├── 📁 skills/
│   │   │   └── 📄 SkillsRegistry.ts
│   │   └── 📁 zorathia/
│   │       └── 📄 Zorathia.ts
│   ├── 📁 cli/                      # Command line interface
│   │   └── 📄 zora.ts               # Zora CLI
│   ├── 📁 core/                     # Core systems
│   │   ├── 📄 eventBus.ts           # Event bus system
│   │   ├── 📄 memoryManager.ts      # Memory management
│   │   ├── 📄 monologueEngine.ts    # Monologue processing
│   │   ├── 📄 sanctuary.ts          # Sanctuary system
│   │   └── 📄 toneRouter.ts         # Tone routing
│   ├── 📁 security/                 # Security systems
│   │   └── 📄 securityKernel.ts     # Security kernel
│   ├── 📁 server/                   # Server components
│   │   ├── 📄 http.ts               # HTTP server
│   │   └── 📄 index.ts              # Server entry point
│   ├── 📁 tests/                    # Testing
│   │   └── 📄 smoke.ts              # Smoke tests
│   ├── 📁 types/                    # Type definitions
│   │   ├── 📄 events.ts             # Event types
│   │   └── 📄 topics.ts             # Topic types
│   └── 📁 ui/                       # User interface
│       ├── 📄 cheriOverlay.tsx      # Cheri overlay component
│       ├── 📄 journalViewer.tsx     # Journal viewer
│       └── 📄 ToneBadge.tsx         # Tone badge component
└── 📁 dist/                         # Built distribution files
    └── [compiled JavaScript files]
```

## 🔧 Build & Configuration
```
📁 dist/                             # Production build output
└── 📄 index.html                    # Built HTML file
```

## 📦 Package Archives
```
📄 cheri_core_phase_two.zip          # Phase two package archive
📄 velvet_core_sprint_seed.zip       # Sprint seed package archive
```

---

## 🌟 **Key Features & Capabilities**

### **🧠 Enhanced Companion Engine**
- **Emotion State System**: dreamy, hopeful, curious, reflective, neutral
- **Trust-Based Interactions**: 5-level trust progression
- **Time-Based Mood Blending**: Automatic mood adaptation
- **Interest-Focused Responses**: Dynamic based on user interests
- **Ambient Content**: Reading, humming, muttering, spontaneous questions

### **💭 Memory & Reflection System**
- **Memory Logging**: Emotional event tracking
- **Companion Memory Hooks**: React integration
- **Whisperback Integration**: Memory-powered reflections
- **Trust Thresholds**: Access control based on relationship level

### **🎭 Ambient Companionship**
- **Literary Snippets**: Classic literature excerpts
- **Radio-Style Content**: Noir quotes and atmospheric content
- **Audio Elements**: Humming, muttering, ambient sounds
- **Contextual Responses**: Environment and time-aware interactions

### **🔧 Technical Architecture**
- **Clean Import System**: Centralized exports via engines/index.ts
- **Modular Design**: Separated concerns and clear interfaces
- **TypeScript Support**: Full type safety and IntelliSense
- **React Integration**: Hooks and components for UI integration
- **Vite Build System**: Fast development and optimized production builds

---

## 🚀 **Development Status**

✅ **Completed Systems:**
- Enhanced Whisperback with emotional memory
- Interest tracking with sentiment analysis
- Memory reflection bundle with companion hooks
- Companion mode bundle with ambient content
- Advanced companion engine with emotion states
- Interactive React demo application

🔄 **Active Development:**
- Memory-powered whisperback integration
- Trust-based interaction depth
- Time-based mood blending
- Ambient content generation

📋 **Next Steps:**
- Integration with main Cheri agent
- Customization and configuration
- Performance optimization
- Extended ambient content library

---

*This project represents a sophisticated AI companion system with advanced emotional intelligence, memory management, and ambient companionship capabilities.* 🧠✨
