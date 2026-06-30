export interface ResilienceOptions {
  timeout: {
    duration: number; // ms — e.g. 5000
  };
  retry: {
    maxAttempts: number; // e.g. 3
    initialDelay: number; // ms — e.g. 500
    maxDelay: number; // ms — e.g. 5000
  };
  circuitBreaker: {
    threshold: number; // 0.5 = 50% failure rate trips
    duration: number; // ms — rolling window, e.g. 30000
    halfOpenAfter: number; // ms — cooldown before probe, e.g. 10000
    minimumSampleSize?: number; // don't trip until N calls, e.g. 5
  };
}

export type ResilienceOptionsMap = Record<string, ResilienceOptions>;

// Sensible defaults per service name
export const DEFAULT_RESILIENCE_OPTIONS: ResilienceOptionsMap = {
  // TCP_PDF_GENERATOR_SERVICE: {
  //   timeout: { duration: 30_000 }, // puppeteer is slow
  //   retry: { maxAttempts: 2, initialDelay: 1000, maxDelay: 10_000 },
  //   circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 15_000, minimumSampleSize: 5 },
  // },
  TCP_PDF_GENERATOR_SERVICE: {
    timeout: { duration: 1_000 },
    retry: { maxAttempts: 1, initialDelay: 100, maxDelay: 300 },
    circuitBreaker: {
      threshold: 0.5,
      duration: 5_000,
      halfOpenAfter: 3_000,
      minimumSampleSize: 2,
    },
  },
  TCP_MEDIA_SERVICE: {
    timeout: { duration: 15_000 },
    retry: { maxAttempts: 3, initialDelay: 500, maxDelay: 5000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  TCP_INVOICE_SERVICE: {
    timeout: { duration: 5_000 },
    retry: { maxAttempts: 2, initialDelay: 300, maxDelay: 3000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  TCP_AUTHORIZE_SERVICE: {
    timeout: { duration: 5_000 },
    retry: { maxAttempts: 2, initialDelay: 300, maxDelay: 3000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  GRPC_AUTHORIZER_SERVICE: {
    timeout: { duration: 5_000 },
    retry: { maxAttempts: 2, initialDelay: 300, maxDelay: 3000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  GRPC_USER_ACCESS_SERVICE: {
    timeout: { duration: 5_000 },
    retry: { maxAttempts: 2, initialDelay: 300, maxDelay: 3000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  TCP_PRODUCT_SERVICE: {
    timeout: { duration: 5_000 },
    retry: { maxAttempts: 2, initialDelay: 300, maxDelay: 3000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  TCP_USER_ACCESS_SERVICE: {
    timeout: { duration: 5_000 },
    retry: { maxAttempts: 2, initialDelay: 300, maxDelay: 3000 },
    circuitBreaker: { threshold: 0.5, duration: 30_000, halfOpenAfter: 10_000 },
  },
  // ...add more services as needed
};
