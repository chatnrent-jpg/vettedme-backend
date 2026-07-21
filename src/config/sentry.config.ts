/**
 * ============================================================================
 * VETTED Sentry Configuration - Backend Error Tracking
 * ============================================================================
 * 
 * Captures and reports:
 * - Unhandled exceptions
 * - API errors (5xx, 429)
 * - Biometric verification failures
 * - Webhook processing errors
 * - Database query errors
 * - Performance traces
 * 
 * Automatic Alerts:
 * - >3 5xx errors in 60 seconds
 * - >3 429 lockouts in 60 seconds
 * - Biometric endpoint failures
 * - Webhook delivery failures
 * 
 * ============================================================================
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { RewriteFrames } from '@sentry/integrations';
import type { Request, Response, NextFunction } from 'express';

/**
 * Initialize Sentry for backend error tracking
 */
export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Release tracking
    release: `vetted-backend@${process.env.APP_VERSION || '1.0.0'}`,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // Performance profiling
      new ProfilingIntegration(),
      
      // Rewrite stack traces for better error tracking
      new RewriteFrames({
        root: global.__dirname || process.cwd(),
      }),
      
      // HTTP instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Express instrumentation
      new Sentry.Integrations.Express({
        app: true,
      }),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send test errors
      if (process.env.NODE_ENV === 'test') {
        return null;
      }
      
      // Add custom context
      if (hint.originalException) {
        const error = hint.originalException as any;
        
        // Add user context if available
        if (error.userId) {
          event.user = {
            id: error.userId,
            email: error.userEmail,
          };
        }
        
        // Add request context if available
        if (error.requestId) {
          event.contexts = {
            ...event.contexts,
            request: {
              request_id: error.requestId,
              endpoint: error.endpoint,
              method: error.method,
            },
          };
        }
      }
      
      return event;
    },
    
    // Ignore expected errors
    ignoreErrors: [
      'AbortError',
      'NetworkError',
      'Non-Error promise rejection captured',
    ],
    
    // Sample health checks and static files
    beforeSendTransaction(event) {
      // Don't track health check endpoints
      if (event.transaction?.includes('/health')) {
        return null;
      }
      
      // Don't track static files
      if (event.transaction?.includes('/static/')) {
        return null;
      }
      
      return event;
    },
  });
  
  console.log('✅ Sentry initialized for backend error tracking');
};

/**
 * Express middleware for Sentry request handling
 */
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'role'],
  });
};

/**
 * Express middleware for Sentry tracing
 */
export const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Express middleware for Sentry error handling
 */
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture 5xx errors
      if (error.status && error.status >= 500) {
        return true;
      }
      
      // Capture 429 rate limit errors
      if (error.status === 429) {
        return true;
      }
      
      // Capture all unhandled errors
      return true;
    },
  });
};

/**
 * Capture critical error with custom context
 */
export const captureCriticalError = (
  error: Error,
  context: {
    endpoint?: string;
    userId?: string;
    requestId?: string;
    severity?: 'fatal' | 'error' | 'warning';
    tags?: Record<string, string>;
  }
) => {
  Sentry.withScope((scope) => {
    // Set severity
    scope.setLevel(context.severity || 'error');
    
    // Add tags
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Add user context
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    // Add context
    scope.setContext('error_details', {
      endpoint: context.endpoint,
      requestId: context.requestId,
    });
    
    // Capture exception
    Sentry.captureException(error);
  });
};

/**
 * Capture biometric verification error (CRITICAL)
 */
export const captureBiometricError = (
  error: Error,
  userId: string,
  passportId: string,
  provider: string
) => {
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('error_type', 'biometric_verification');
    scope.setTag('provider', provider);
    scope.setUser({ id: userId });
    scope.setContext('biometric_details', {
      passportId,
      provider,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
  });
};

/**
 * Capture webhook processing error (CRITICAL)
 */
export const captureWebhookError = (
  error: Error,
  webhookType: string,
  payload: any
) => {
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('error_type', 'webhook_processing');
    scope.setTag('webhook_type', webhookType);
    scope.setContext('webhook_details', {
      type: webhookType,
      payload: JSON.stringify(payload).substring(0, 1000), // Limit payload size
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
  });
};

/**
 * Capture rate limit exceeded (WARNING)
 */
export const captureRateLimitExceeded = (
  endpoint: string,
  userId: string | null,
  ipAddress: string
) => {
  Sentry.withScope((scope) => {
    scope.setLevel('warning');
    scope.setTag('error_type', 'rate_limit_exceeded');
    scope.setTag('endpoint', endpoint);
    
    if (userId) {
      scope.setUser({ id: userId });
    }
    
    scope.setContext('rate_limit_details', {
      endpoint,
      ipAddress,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureMessage(`Rate limit exceeded: ${endpoint}`, 'warning');
  });
};

/**
 * Capture database query error
 */
export const captureDatabaseError = (
  error: Error,
  query: string,
  duration: number
) => {
  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('error_type', 'database_query');
    scope.setContext('database_details', {
      query: query.substring(0, 500), // Limit query size
      duration,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
  });
};

/**
 * Capture payment processing error (CRITICAL)
 */
export const capturePaymentError = (
  error: Error,
  milestoneId: string,
  contractId: string,
  amount: number,
  provider: string
) => {
  Sentry.withScope((scope) => {
    scope.setLevel('fatal');
    scope.setTag('error_type', 'payment_processing');
    scope.setTag('provider', provider);
    scope.setContext('payment_details', {
      milestoneId,
      contractId,
      amount,
      provider,
      timestamp: new Date().toISOString(),
    });
    
    Sentry.captureException(error);
  });
};

/**
 * Track performance metric
 */
export const trackPerformance = (
  operation: string,
  duration: number,
  tags?: Record<string, string>
) => {
  const transaction = Sentry.startTransaction({
    name: operation,
    op: 'performance',
  });
  
  if (tags) {
    Object.entries(tags).forEach(([key, value]) => {
      transaction.setTag(key, value);
    });
  }
  
  transaction.setMeasurement('duration', duration, 'millisecond');
  transaction.finish();
};

export default {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureCriticalError,
  captureBiometricError,
  captureWebhookError,
  captureRateLimitExceeded,
  captureDatabaseError,
  capturePaymentError,
  trackPerformance,
};
