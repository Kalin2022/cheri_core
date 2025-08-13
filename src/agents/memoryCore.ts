export default class MemoryCore {
    private shortTerm: string[] = []
  
    remember(phrase: string) {
      this.shortTerm.push(phrase)
      console.log(`[Memory] Remembered: "${phrase}"`)
    }
  
    recall(): string[] {
      return this.shortTerm
    }
  }
  