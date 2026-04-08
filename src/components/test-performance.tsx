import { useEffect } from "react";
import { usePerformanceMonitoring } from "@/lib/performance";

export default function TestPerformanceMonitoring() {
  const { getMetrics, checkBudgets, analyzeDOMComplexity } =
    usePerformanceMonitoring({
      enableWebVitals: true,
      enableDOMAnalysis: true,
      enableResourceAnalysis: true,
    });

  useEffect(() => {
    // Test the monitoring after component mounts
    setTimeout(() => {
      console.log("=== PERFORMANCE TEST ===");
      console.log("Current metrics:", getMetrics());
      checkBudgets();
      analyzeDOMComplexity();
    }, 3000); // Wait 3 seconds for metrics to collect
  }, [getMetrics, checkBudgets, analyzeDOMComplexity]);

  return (
    <div>
      <h1>Performance Monitoring Test</h1>
      <p>Check browser console for performance metrics!</p>

      {/* Create some DOM complexity for testing */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex items-center p-4 bg-gray-100">
            <img
              src={`/test-image-${i}.jpg`}
              alt={`Test ${i}`}
              width="100"
              height="100"
            />
            <div>
              <p>Test item {i}</p>
              <span>Performance test element</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
