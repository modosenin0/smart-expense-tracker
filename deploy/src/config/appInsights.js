import appInsights from "applicationinsights";

// Initialize Application Insights
const initializeAppInsights = () => {
  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    // Setup Application Insights
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();

    console.log("✅ Application Insights initialized");

    // Get the default client
    const client = appInsights.defaultClient;

    // Custom telemetry methods
    const telemetry = {
      // Track custom events
      trackEvent: (name, properties = {}, measurements = {}) => {
        client.trackEvent({ name, properties, measurements });
      },

      // Track custom metrics
      trackMetric: (name, value, properties = {}) => {
        client.trackMetric({ name, value, properties });
      },

      // Track exceptions with context
      trackException: (exception, properties = {}) => {
        client.trackException({ exception, properties });
      },

      // Track custom traces/logs
      trackTrace: (message, severity = 1, properties = {}) => {
        client.trackTrace({ message, severity, properties });
      },

      // Track dependencies (external calls)
      trackDependency: (name, data, duration, success, dependencyType = "HTTP") => {
        client.trackDependency({
          name,
          data,
          duration,
          success,
          dependencyType
        });
      }
    };

    return { client, telemetry };
  } else {
    console.log("⚠️ Application Insights connection string not found");
    return null;
  }
};

export default initializeAppInsights;