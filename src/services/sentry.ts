export interface LoggerContext {
  [key: string]: unknown;
}

class SentryMock {
  public init(): void {
    console.log('%c[Sentry Mock] Initialized tracking service', 'color: #3b82f6; font-weight: bold;');
  }

  public captureException(error: unknown, context?: LoggerContext): void {
    console.group('%c[Sentry Mock] Captured Exception', 'color: #ef4444; font-weight: bold;');
    console.error(error);
    if (context) {
      console.log('Context metadata:', context);
    }
    console.groupEnd();
  }

  public captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: LoggerContext
  ): void {
    const colors = {
      info: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };
    
    console.group(`%c[Sentry Mock] [${level.toUpperCase()}] Message`, `color: ${colors[level]}; font-weight: bold;`);
    console.log(message);
    if (context) {
      console.log('Context metadata:', context);
    }
    console.groupEnd();
  }
}

export const sentryService = new SentryMock();
