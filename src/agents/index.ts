import CheriAgent from './cheriAgent'
import Zorathia from './zorathia'
import Watcher from './watcher'
import MemoryCore from './memoryCore'
import { CurrentSession } from './sessions'


export const AgentSession = {
  cheri: new CheriAgent(),
  zora: new Zorathia(),
  watcher: new Watcher(),
  memory: new MemoryCore()
}
