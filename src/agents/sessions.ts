import CheriAgent from './cheriAgent'
import Zorathia from './zorathia'
import Watcher from './watcher'
import MemoryCore from './memoryCore'

export class CheriSession {
  cheri: CheriAgent
  zora: Zorathia
  watcher: Watcher
  memory: MemoryCore
  sessionId: string
  createdAt: Date

  constructor(sessionId: string = crypto.randomUUID()) {
    this.sessionId = sessionId
    this.createdAt = new Date()
    this.cheri = new CheriAgent()
    this.zora = new Zorathia()
    this.watcher = new Watcher()
    this.memory = new MemoryCore()
  }

  reset() {
    this.cheri = new CheriAgent()
    this.zora = new Zorathia()
    this.watcher = new Watcher()
    this.memory = new MemoryCore()
  }

  summarizeSession(): Record<string, any> {
    return {
      sessionId: this.sessionId,
      createdAt: this.createdAt.toISOString(),
      memoryLog: this.memory.recall(),
    }
  }
}

export const CurrentSession = new CheriSession()
