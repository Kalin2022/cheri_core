export default class Watcher {
    observe(input: string): string {
      // Later: tone detection, keyword triggers
      console.log(`[Watcher] Observing input: ${input}`)
      return 'neutral'
    }
  }
  