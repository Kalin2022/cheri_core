export default class CheriAgent {
    private tone: string = 'neutral'
  
    speak(input: string): string {
      // Later: hook into tone routing
      return `Cheri: [${this.tone}] ${this.generateResponse(input)}`
    }
  
    private generateResponse(input: string): string {
      // Placeholder logic
      return `Now you’ve got my attention. What are you really after?`
    }
  
    setTone(tone: string) {
      this.tone = tone
    }
  }
  