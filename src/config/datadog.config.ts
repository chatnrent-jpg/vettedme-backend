/**
 * ============================================================================
 * VETTED Datadog Configuration - APM & Log Aggregation
 * ============================================================================
 * 
 * Monitors:
 * - API latency and throughput
 * - Database query performance
 * - Cache hit rates
 * - Memory and CPU usage
 * - Error rates and patterns
 * - Custom business metrics
 * 
 * Automatic Alerts:
 * - API latency p99 > 2000ms
 * - Error rate > 5%
 * - Database connection pool > 90%
 * - Memory usage > 80%
 * 
 * ============================================================================
 */

import tracer from 'dd-trace';
import { logger } from '../utils/logger';

/**
 * Initialize Datadog APM
 */
export const initializeDatadog = () => {
  if (process.env.DD_API_KEY && process.env.NODE_ENV === 'production') {
    tracer.init({
      // Service configuration
      service: process.env.DD_SERVICE || 'vetted-api',
      env: process.env.DD_ENV || 'production',
      version: process.env.DD_VERSION || '1.0.0',
      
      // Performance monitoring
      profiling: true,
      runtimeMetrics: true,
      
      // Sampling
      sampleRate: 0.1, // Sample 10% of requests
      
      // Logging
      logInjection: true,
      
      // Tags
      tags: {
        'region': process.env.PRIMARY_REGION || 'us-east',
        'platform': 'railway',
      },
    });
    
    logger.info('✅ Datadog APM initialized');
  } else {
    logger.warn('⚠️  Datadog APM not initialized (missing DD_API_KEY or not in production)');
  }
};

/**
 * Track custom metric
 */
export const trackMetric = (
  name: string,
  value: number,
  tags?: Record<string, string>
) => {
  if (tracer) {
    const metric = tracer.dogstatsd;
    const tagArray = tags ? Object.entries(tags).map(([k, v]) => `${k}:${v}`) : [];
    metric.gauge(name, value, tagArray);
  }
};

/**
 * Increment counter metric
 */
export const incrementCounter = (
  name: string,
  value: number = 1,
  tags?: Record<string, string>
) => {
  if (tracer) {
    const metric = tracer.dogstatsd;
    const tagArray = tags ? Object.entries(tags).map(([k, v]) => `${k}:${v}`) : [];
    metric.increment(name, value, tagArray);
  }
};

/**
 * Track API endpoint latency
 */
export const trackAPILatency = (
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) => {
  trackMetric('api.request.duration', duration, {
    endpoint,
    method,
    status_code: statusCode.toString(),
  });
  
  incrementCounter('api.request.count', 1, {
    endpoint,
    method,
    status_code: statusCode.toString(),
  });
};

/**
 * Track database query latency
 */
export const trackDatabaseQuery = (
  query: string,
  duration: number,
  status: 'success' | 'error'
) => {
  const queryType = query.split(' ')[0].toUpperCase(); // SELECT, INSERT, UPDATE, DELETE
  
  trackMetric('database.query.duration', duration, {
    query_type: queryType,
    status,
  });
  
  incrementCounter('database.query.count', 1, {
    query_type: queryType,
    status,
  });
};

/**
 * Track cache hit/miss
 */
export const trackCacheHit = (cacheKey: string, hit: boolean) => {
  incrementCounter('cache.request', 1, {
    cache_key: cacheKey,
    result: hit ? 'hit' : 'miss',
  });
};

/**
 * Track biometric verification
 */
export const trackBiometricVerification = (
  provider: string,
  result: 'success' | 'failure',
  duration: number
) => {
  trackMetric('biometric.verification.duration', duration, {
    provider,
    result,
  });
  
  incrementCounter('biometric.verification.count', 1, {
    provider,
    result,
  });
};

/**
 * Track payment processing
 */
export const trackPaymentProcessing = (
  provider: string,
  amount: number,
  currency: string,
  status: 'success' | 'failure',
  duration: number
) => {
  trackMetric('payment.processing.duration', duration, {
    provider,
    currency,
    status,
  });
  
  trackMetric('payment.amount', amount, {
    provider,
    currency,
    status,
  });
  
  incrementCounter('payment.processing.count', 1, {
    provider,
    currency,
    status,
  });
};

/**
 * Track webhook processing
 */
export const trackWebhookProcessing = (
  webhookType: string,
  status: 'success' | 'failure',
  duration: number
) => {
  trackMetric('webhook.processing.duration', duration, {
    webhook_type: webhookType,
    status,
  });
  
  incrementCounter('webhook.processing.count', 1, {
    webhook_type: webhookType,
    status,
  });
};

/**
 * Track rate limit hits
 */
export const trackRateLimitHit = (
  endpoint: string,
  limitType: string
) => {
  incrementCounter('rate_limit.exceeded', 1, {
    endpoint,
    limit_type: limitType,
  });
};

/**
 * Track error occurrence
 */
export const trackError = (
  errorType: string,
  endpoint?: string,
  statusCode?: number
) => {
  incrementCounter('error.count', 1, {
    error_type: errorType,
    endpoint: endpoint || 'unknown',
    status_code: statusCode?.toString() || 'unknown',
  });
};

/**
 * Track business metric: contractor signups
 */
export const trackContractorSignup = (country: string, trustScore: number) => {
  incrementCounter('business.contractor.signup', 1, {
    country,
  });
  
  trackMetric('business.contractor.trust_score', trustScore, {
    country,
  });
};

/**
 * Track business metric: contract creation
 */
export const trackContractCreation = (amount: number, currency: string) => {
  incrementCounter('business.contract.created', 1, {
    currency,
  });
  
  trackMetric('business.contract.amount', amount, {
    currency,
  });
};

/**
 * Track business metric: milestone payment
 */
export const trackMilestonePayment = (
  amount: number,
  platformFee: number,
  currency: string
) => {
  incrementCounter('business.milestone.paid', 1, {
    currency,
  });
  
  trackMetric('business.milestone.amount', amount, {
    currency,
  });
  
  trackMetric('business.platform.revenue', platformFee, {
    currency,
  });
};

/**
 * Track regional performance
 */
export const trackRegionalPerformance = (
  region: string,
  latency: number
) => {
  trackMetric('regional.latency', latency, {
    region,
  });
};

/**
 * Track auto-scaling event
 */
export const trackAutoScaling = (
  instanceCount: number,
  cpuUsage: number,
  memoryUsage: number
) => {
  trackMetric('autoscaling.instance_count', instanceCount);
  trackMetric('autoscaling.cpu_usage', cpuUsage);
  trackMetric('autoscaling.memory_usage', memoryUsage);
};

export default {
  initializeDatadog,
  trackMetric,
  incrementCounter,
  trackAPILatency,
  trackDatabaseQuery,
  trackCacheHit,
  trackBiometricVerification,
  trackPaymentProcessing,
  trackWebhookProcessing,
  trackRateLimitHit,
  trackError,
  trackContractorSignup,
  trackContractCreation,
  trackMilestonePayment,
  trackRegionalPerformance,
  trackAutoScaling,
};
