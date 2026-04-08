/**
 * Web Vitals monitoring and Core Web Vitals tracking
 * Install: npm install web-vitals
 */

export interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  entries: PerformanceEntry[];
}

class PerformanceMonitor {
  private metrics: Map<string, WebVitalMetric> = new Map();

  // Send metrics to analytics (customize for your analytics service)
  private sendToAnalytics(metric: WebVitalMetric) {
    console.log("Web Vital:", metric);

    // Example: Google Analytics 4
    if (typeof gtag !== "undefined") {
      gtag("event", metric.name, {
        event_category: "Web Vitals",
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value,
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Store metric
    this.metrics.set(metric.name, metric);
  }

  // Initialize Core Web Vitals monitoring
  public initWebVitals() {
    // Dynamic import to avoid bundling if not used
    import("web-vitals")
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.sendToAnalytics.bind(this));
        getFID(this.sendToAnalytics.bind(this));
        getFCP(this.sendToAnalytics.bind(this));
        getLCP(this.sendToAnalytics.bind(this));
        getTTFB(this.sendToAnalytics.bind(this));
      })
      .catch((error) => {
        console.warn("Web Vitals library not available:", error);
      });
  }

  // DOM complexity analyzer
  public analyzeDOMComplexity() {
    const startTime = performance.now();

    const metrics = {
      totalNodes: document.querySelectorAll("*").length,
      maxDepth: this.getMaxDepth(document.body),
      heavyElements: this.findHeavyElements(),
      timestamp: Date.now(),
    };

    const endTime = performance.now();

    console.log("DOM Complexity Analysis:", {
      ...metrics,
      analysisTime: `${endTime - startTime}ms`,
    });

    // Warn if DOM is too complex
    if (metrics.totalNodes > 1500) {
      console.warn("⚠️ DOM complexity is high:", metrics.totalNodes, "nodes");
      console.log("💡 Consider implementing virtual scrolling or lazy loading");
    }

    return metrics;
  }

  private getMaxDepth(element: Element, depth = 0): number {
    let maxDepth = depth;

    for (const child of element.children) {
      maxDepth = Math.max(maxDepth, this.getMaxDepth(child, depth + 1));
    }

    return maxDepth;
  }

  private findHeavyElements() {
    const heavySelectors = [
      'div[class*="grid"]',
      '[class*="flex"]',
      "ul, ol",
      "table",
      "img",
      "svg",
    ];

    return heavySelectors.map((selector) => ({
      selector,
      count: document.querySelectorAll(selector).length,
    }));
  }

  // Monitor bundle sizes
  public async analyzeResourceSizes() {
    if (!("PerformanceObserver" in window)) {
      console.warn("PerformanceObserver not supported");
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.name.includes(".js") || entry.name.includes(".css")) {
          const size = (entry as any).transferSize || 0;
          const name = entry.name.split("/").pop() || entry.name;

          if (size > 100000) {
            // Files larger than 100KB
            console.warn(
              `⚠️ Large resource detected: ${name} (${Math.round(
                size / 1024,
              )}KB)`,
            );
          }

          if (name.includes("lucide") && size > 100000) {
            console.error(
              "❌ Lucide bundle still too large! Tree shaking may not be working.",
            );
          }
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });

    // Stop observing after 10 seconds
    setTimeout(() => observer.disconnect(), 10000);
  }

  // Get current metrics
  public getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Performance budget alerts
  public checkPerformanceBudgets() {
    const budgets = {
      LCP: 2500, // 2.5 seconds
      FID: 100, // 100ms
      CLS: 0.1, // 0.1
      FCP: 1800, // 1.8 seconds
      TTFB: 600, // 600ms
    };

    this.metrics.forEach((metric, name) => {
      const budget = budgets[name as keyof typeof budgets];
      if (budget && metric.value > budget) {
        console.warn(
          `⚠️ ${name} exceeded budget: ${metric.value}ms (budget: ${budget}ms)`,
        );
      }
    });
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring(
  options: {
    enableWebVitals?: boolean;
    enableDOMAnalysis?: boolean;
    enableResourceAnalysis?: boolean;
  } = {},
) {
  const {
    enableWebVitals = true,
    enableDOMAnalysis = true,
    enableResourceAnalysis = true,
  } = options;

  // Initialize monitoring on mount
  if (typeof window !== "undefined") {
    if (enableWebVitals) {
      performanceMonitor.initWebVitals();
    }

    if (enableResourceAnalysis) {
      performanceMonitor.analyzeResourceSizes();
    }

    if (enableDOMAnalysis) {
      // Analyze DOM after initial render
      setTimeout(() => {
        performanceMonitor.analyzeDOMComplexity();
      }, 2000);
    }
  }

  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    checkBudgets: () => performanceMonitor.checkPerformanceBudgets(),
    analyzeDOMComplexity: () => performanceMonitor.analyzeDOMComplexity(),
  };
}
