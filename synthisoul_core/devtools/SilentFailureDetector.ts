// ===============================
// 🔍 SilentFailureDetector.ts
// ===============================
// Detects modules that silently return empty, skip, or fail without proper error handling

import { moduleTracer } from './ModuleTracer';

interface SilentFailurePattern {
  moduleName: string;
  functionName: string;
  pattern: 'empty_return' | 'null_output' | 'skipped_processing' | 'no_breadcrumbs' | 'rapid_completion' | 'dependency_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  context?: any;
}

interface FailureAnalysis {
  totalFailures: number;
  criticalFailures: number;
  highSeverityFailures: number;
  mediumSeverityFailures: number;
  lowSeverityFailures: number;
  patterns: SilentFailurePattern[];
  recommendations: string[];
  affectedModules: string[];
}

export class SilentFailureDetector {
  private static readonly RAPID_COMPLETION_THRESHOLD = 10; // ms
  private static readonly EXPECTED_BREADCRUMBS_MIN = 2;
  private static readonly CRITICAL_MODULES = [
    'System3FeedbackLoop',
    'ReflectionWhisperbackSync',
    'LLMPostProcessor',
    'ContextPriorityResolver',
    'MemoryTraceTagHistory'
  ];

  static detectSilentFailures(): FailureAnalysis {
    const recentActivations = moduleTracer.getRecentActivations(50);
    const patterns: SilentFailurePattern[] = [];
    
    recentActivations.forEach(activation => {
      // Check for empty returns
      if (activation.status === 'empty' && activation.output === null) {
        patterns.push({
          moduleName: activation.moduleName,
          functionName: activation.functionName,
          pattern: 'empty_return',
          severity: this.getSeverity(activation.moduleName, 'empty_return'),
          description: 'Module returned empty/null without proper error handling',
          timestamp: activation.timestamp,
          context: { trigger: activation.trigger, input: activation.input }
        });
      }
      
      // Check for null outputs
      if (activation.status === 'completed' && activation.output === null) {
        patterns.push({
          moduleName: activation.moduleName,
          functionName: activation.functionName,
          pattern: 'null_output',
          severity: this.getSeverity(activation.moduleName, 'null_output'),
          description: 'Module completed but returned null output',
          timestamp: activation.timestamp,
          context: { trigger: activation.trigger, input: activation.input }
        });
      }
      
      // Check for skipped processing
      // BUT: Treat debounced/skipped with explicit status as healthy (not failures)
      if (activation.status === 'skipped') {
        // Check if output indicates intentional skip/debounce (healthy outcome)
        const output = activation.output;
        const isHealthySkip = output && typeof output === 'object' && 
          (output.status === 'debounced' || output.status === 'skipped');
        
        if (!isHealthySkip) {
          patterns.push({
            moduleName: activation.moduleName,
            functionName: activation.functionName,
            pattern: 'skipped_processing',
            severity: this.getSeverity(activation.moduleName, 'skipped_processing'),
            description: 'Module processing was skipped',
            timestamp: activation.timestamp,
            context: { trigger: activation.trigger, input: activation.input }
          });
        }
      }
      
      // Check for lack of breadcrumbs (indicating silent execution)
      if (activation.breadcrumbs.length < this.EXPECTED_BREADCRUMBS_MIN) {
        patterns.push({
          moduleName: activation.moduleName,
          functionName: activation.functionName,
          pattern: 'no_breadcrumbs',
          severity: this.getSeverity(activation.moduleName, 'no_breadcrumbs'),
          description: `Module executed with only ${activation.breadcrumbs.length} breadcrumbs (expected ${this.EXPECTED_BREADCRUMBS_MIN}+)`,
          timestamp: activation.timestamp,
          context: { breadcrumbs: activation.breadcrumbs, trigger: activation.trigger }
        });
      }
      
      // Check for rapid completion (potential silent failure)
      // BUT: Treat as healthy if module returns debounced/skipped status OR if processed <= 3 items
      if (activation.duration && activation.duration < this.RAPID_COMPLETION_THRESHOLD) {
        const output = activation.output;
        const isHealthyRapid = 
          // Explicit debounced/skipped status
          (output && typeof output === 'object' && 
            (output.status === 'debounced' || output.status === 'skipped')) ||
          // Small work completed successfully
          (output && typeof output === 'object' && 
            output.status === 'ok' && 
            typeof output.processed === 'number' && 
            output.processed <= 3);
        
        // Only warn if rapid completion AND expected work size was large
        // Note: context may not exist on ModuleActivation, so we check input length as fallback
        const activationAny = activation as any;
        const expectedWorkSize = activationAny.context?.expectedWorkSize || 
          (typeof activation.input === 'string' ? activation.input.length : 
           typeof activation.input === 'object' && activation.input !== null ? JSON.stringify(activation.input).length : 0);
        const isLargeWork = expectedWorkSize > 100; // Arbitrary threshold
        
        if (!isHealthyRapid && isLargeWork) {
          patterns.push({
            moduleName: activation.moduleName,
            functionName: activation.functionName,
            pattern: 'rapid_completion',
            severity: this.getSeverity(activation.moduleName, 'rapid_completion'),
            description: `Module completed in ${activation.duration}ms (suspiciously fast for work size ${expectedWorkSize})`,
            timestamp: activation.timestamp,
            context: { duration: activation.duration, trigger: activation.trigger, expectedWorkSize }
          });
        }
      }
      
      // Check for dependency failures
      if (activation.dependencies && activation.dependencies.length > 0) {
        const dependencyFailures = this.checkDependencyFailures(activation, recentActivations);
        dependencyFailures.forEach(failure => patterns.push(failure));
      }
    });
    
    return this.analyzeFailures(patterns);
  }

  static generateFailureReport(): string {
    const analysis = this.detectSilentFailures();
    
    let report = `🔍 Silent Failure Analysis Report\n`;
    report += `═══════════════════════════════════\n\n`;
    
    report += `📊 Summary:\n`;
    report += `  Total Failures: ${analysis.totalFailures}\n`;
    report += `  Critical: ${analysis.criticalFailures}\n`;
    report += `  High: ${analysis.highSeverityFailures}\n`;
    report += `  Medium: ${analysis.mediumSeverityFailures}\n`;
    report += `  Low: ${analysis.lowSeverityFailures}\n\n`;
    
    if (analysis.patterns.length > 0) {
      report += `🚨 Detected Patterns:\n`;
      analysis.patterns.forEach((pattern, index) => {
        const severityEmoji = {
          'critical': '🔴',
          'high': '🟠',
          'medium': '🟡',
          'low': '🟢'
        }[pattern.severity];
        
        report += `  ${index + 1}. ${severityEmoji} ${pattern.moduleName}.${pattern.functionName}\n`;
        report += `     Pattern: ${pattern.pattern}\n`;
        report += `     Description: ${pattern.description}\n`;
        if (pattern.context) {
          report += `     Context: ${JSON.stringify(pattern.context, null, 2)}\n`;
        }
        report += `\n`;
      });
    }
    
    if (analysis.recommendations.length > 0) {
      report += `💡 Recommendations:\n`;
      analysis.recommendations.forEach((rec, index) => {
        report += `  ${index + 1}. ${rec}\n`;
      });
      report += `\n`;
    }
    
    if (analysis.affectedModules.length > 0) {
      report += `🎯 Affected Modules:\n`;
      analysis.affectedModules.forEach(module => {
        report += `  • ${module}\n`;
      });
    }
    
    return report;
  }

  static getCriticalModuleHealth(): Record<string, 'healthy' | 'warning' | 'critical'> {
    const analysis = this.detectSilentFailures();
    const health: Record<string, 'healthy' | 'warning' | 'critical'> = {};
    
    this.CRITICAL_MODULES.forEach(module => {
      const moduleFailures = analysis.patterns.filter(p => p.moduleName === module);
      const criticalFailures = moduleFailures.filter(p => p.severity === 'critical').length;
      const highFailures = moduleFailures.filter(p => p.severity === 'high').length;
      
      if (criticalFailures > 0) {
        health[module] = 'critical';
      } else if (highFailures > 2 || moduleFailures.length > 5) {
        health[module] = 'warning';
      } else {
        health[module] = 'healthy';
      }
    });
    
    return health;
  }

  private static getSeverity(moduleName: string, pattern: string): 'low' | 'medium' | 'high' | 'critical' {
    const isCriticalModule = this.CRITICAL_MODULES.includes(moduleName);
    
    switch (pattern) {
      case 'empty_return':
        return isCriticalModule ? 'high' : 'medium';
      case 'null_output':
        return isCriticalModule ? 'critical' : 'high';
      case 'skipped_processing':
        return isCriticalModule ? 'high' : 'medium';
      case 'no_breadcrumbs':
        return isCriticalModule ? 'medium' : 'low';
      case 'rapid_completion':
        return isCriticalModule ? 'medium' : 'low';
      case 'dependency_failure':
        return isCriticalModule ? 'critical' : 'high';
      default:
        return 'low';
    }
  }

  private static checkDependencyFailures(activation: any, allActivations: any[]): SilentFailurePattern[] {
    const failures: SilentFailurePattern[] = [];
    
    activation.dependencies?.forEach((dep: string) => {
      const depActivation = allActivations.find(a => 
        `${a.moduleName}.${a.functionName}` === dep
      );
      
      if (!depActivation) {
        failures.push({
          moduleName: activation.moduleName,
          functionName: activation.functionName,
          pattern: 'dependency_failure',
          severity: this.getSeverity(activation.moduleName, 'dependency_failure'),
          description: `Dependency ${dep} was not found in recent activations`,
          timestamp: activation.timestamp,
          context: { missingDependency: dep }
        });
      } else if (depActivation.status === 'errored' || depActivation.status === 'empty') {
        failures.push({
          moduleName: activation.moduleName,
          functionName: activation.functionName,
          pattern: 'dependency_failure',
          severity: this.getSeverity(activation.moduleName, 'dependency_failure'),
          description: `Dependency ${dep} failed with status: ${depActivation.status}`,
          timestamp: activation.timestamp,
          context: { failedDependency: dep, dependencyStatus: depActivation.status }
        });
      }
    });
    
    return failures;
  }

  private static analyzeFailures(patterns: SilentFailurePattern[]): FailureAnalysis {
    const criticalFailures = patterns.filter(p => p.severity === 'critical').length;
    const highSeverityFailures = patterns.filter(p => p.severity === 'high').length;
    const mediumSeverityFailures = patterns.filter(p => p.severity === 'medium').length;
    const lowSeverityFailures = patterns.filter(p => p.severity === 'low').length;
    
    const affectedModules = [...new Set(patterns.map(p => p.moduleName))];
    
    const recommendations: string[] = [];
    
    if (criticalFailures > 0) {
      recommendations.push("🔴 Critical failures detected - immediate attention required");
    }
    
    if (patterns.filter(p => p.pattern === 'empty_return').length > 3) {
      recommendations.push("🔄 Multiple empty returns detected - check fallback mechanisms");
    }
    
    if (patterns.filter(p => p.pattern === 'no_breadcrumbs').length > 5) {
      recommendations.push("🍞 Insufficient breadcrumb logging - add more detailed tracing");
    }
    
    if (patterns.filter(p => p.pattern === 'rapid_completion').length > 3) {
      recommendations.push("⚡ Rapid completions detected - verify processing logic");
    }
    
    const criticalModuleFailures = patterns.filter(p => 
      this.CRITICAL_MODULES.includes(p.moduleName) && p.severity === 'high'
    );
    
    if (criticalModuleFailures.length > 0) {
      recommendations.push("🎯 Critical modules showing failures - system stability at risk");
    }
    
    return {
      totalFailures: patterns.length,
      criticalFailures,
      highSeverityFailures,
      mediumSeverityFailures,
      lowSeverityFailures,
      patterns,
      recommendations,
      affectedModules
    };
  }
}

// Convenience functions
export function detectSilentFailures(): FailureAnalysis {
  return SilentFailureDetector.detectSilentFailures();
}

export function generateFailureReport(): string {
  return SilentFailureDetector.generateFailureReport();
}

export function getCriticalModuleHealth(): Record<string, 'healthy' | 'warning' | 'critical'> {
  return SilentFailureDetector.getCriticalModuleHealth();
}
