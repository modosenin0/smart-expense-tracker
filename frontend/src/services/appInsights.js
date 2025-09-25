import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

// Create React plugin
const reactPlugin = new ReactPlugin();

// Application Insights configuration
const appInsights = new ApplicationInsights({
  config: {
    connectionString: 'InstrumentationKey=00ea5f56-bbd0-46e6-89b4-346ac9676e09;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=89b09bf2-e6c8-4b3e-a1ab-df6b584d2112',
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: {
        history: null // Will be set when we have React Router history
      }
    },
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    enableUnhandledPromiseRejectionTracking: true
  }
});

// Initialize Application Insights
appInsights.loadAppInsights();

// Custom telemetry methods for easy use throughout the app
export const telemetry = {
  // Track page views
  trackPageView: (name, properties = {}) => {
    appInsights.trackPageView({ name, properties });
  },

  // Track custom events
  trackEvent: (name, properties = {}, measurements = {}) => {
    appInsights.trackEvent({ name, properties, measurements });
  },

  // Track exceptions
  trackException: (error, properties = {}) => {
    appInsights.trackException({ 
      exception: error, 
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  },

  // Track metrics
  trackMetric: (name, value, properties = {}) => {
    appInsights.trackMetric({ name, average: value, properties });
  },

  // Track traces/logs
  trackTrace: (message, severityLevel = 1, properties = {}) => {
    appInsights.trackTrace({ message, severityLevel, properties });
  },

  // Set user context
  setUser: (userId, userName) => {
    appInsights.setAuthenticatedUserContext(userId, userName);
  },

  // Clear user context
  clearUser: () => {
    appInsights.clearAuthenticatedUserContext();
  }
};

export { appInsights, reactPlugin };