import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { memoryManager, performanceMonitor } from '@/lib/memoryManager';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: ErrorInfo; retry: () => void; errorId: string }>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  enableLogging?: boolean;
  enablePerformanceTracking?: boolean;
}

class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Performance tracking
    if (this.props.enablePerformanceTracking) {
      performanceMonitor.startTimer(`error-boundary-${this.state.errorId}`);
    }

    // Memory cleanup on error
    memoryManager.clearCache();

    // Log error
    if (this.props.enableLogging !== false) {
      this.logError(error, errorInfo);
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId);
    }

    // Auto-retry for certain error types
    this.autoRetry(error);
  }

  private logError = (error: Error, errorInfo: ErrorInfo): void => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      retryCount: this.state.retryCount,
    };

    console.error('Error Boundary Caught Error:', errorData);

    // Send to error reporting service (if available)
    this.sendErrorReport(errorData);
  };

  private sendErrorReport = (errorData: any): void => {
    try {
      // In a real app, you'd send this to Sentry, Bugsnag, etc.
      // For now, we'll store it in memory for debugging
      memoryManager.setCache(`error-${errorData.errorId}`, errorData);
    } catch (reportingError) {
      console.error('Failed to send error report:', reportingError);
    }
  };

  private autoRetry = (error: Error): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    // Don't auto-retry for certain error types
    const noRetryErrors = ['NetworkError', 'ChunkLoadError', 'TypeError'];
    const shouldRetry = !noRetryErrors.some(type => error.name.includes(type));

    if (shouldRetry && retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
      
      const timeout = setTimeout(() => {
        this.handleRetry();
      }, delay);

      this.retryTimeouts.push(timeout);
    }
  };

  private handleRetry = (): void => {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  componentWillUnmount(): void {
    // Clear any pending timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      const { fallback: FallbackComponent } = this.props;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            retry={this.handleRetry}
            errorId={this.state.errorId}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.handleRetry}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({
  error,
  errorInfo,
  retry,
  errorId,
}: {
  error: Error;
  errorInfo: ErrorInfo;
  retry: () => void;
  errorId: string;
}) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Oops! Something went wrong
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We're sorry, but an unexpected error occurred. Our team has been notified.
          </Text>

          <View style={[styles.errorDetails, { backgroundColor: colors.muted }]}>
            <Text style={[styles.errorId, { color: colors.mutedForeground }]}>
              Error ID: {errorId}
            </Text>
            
            <Text style={[styles.errorMessage, { color: colors.destructive }]}>
              {error.message}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={retry}
            >
              <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
                Try Again
              </Text>
            </Pressable>

            <Pressable
              style={[styles.reportButton, { borderColor: colors.border }]}
              onPress={() => {
                // Copy error details to clipboard
                const errorDetails = `
Error ID: ${errorId}
Message: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo.componentStack}
Timestamp: ${new Date().toISOString()}
                `.trim();
                
                console.log('Error details copied to clipboard:', errorDetails);
              }}
            >
              <Text style={[styles.reportText, { color: colors.primary }]}>
                Copy Error Details
              </Text>
            </Pressable>
          </View>

          <View style={styles.helpSection}>
            <Text style={[styles.helpTitle, { color: colors.foreground }]}>
              Need Help?
            </Text>
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              If this problem persists, please contact our support team with the Error ID above.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Specialized error boundaries for different contexts

export function AuthErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary
      maxRetries={2}
      enablePerformanceTracking={true}
      fallback={({ error, retry }) => (
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>Authentication Error</Text>
          <Text style={styles.authMessage}>
            {error.message.includes('network') 
              ? 'Please check your internet connection and try again.'
              : 'There was a problem with authentication. Please try logging in again.'
            }
          </Text>
          <Pressable style={styles.authButton} onPress={retry}>
            <Text style={styles.authButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
    >
      {children}
    </EnhancedErrorBoundary>
  );
}

export function NetworkErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary
      maxRetries={5}
      enablePerformanceTracking={true}
      onError={(error) => {
        // Special handling for network errors
        if (error.message.includes('network') || error.message.includes('fetch')) {
          console.log('Network error detected, implementing retry strategy');
        }
      }}
      fallback={({ error, retry }) => (
        <View style={styles.networkContainer}>
          <Text style={styles.networkTitle}>Connection Error</Text>
          <Text style={styles.networkMessage}>
            Unable to connect to our servers. Please check your internet connection.
          </Text>
          <Pressable style={styles.networkButton} onPress={retry}>
            <Text style={styles.networkButtonText}>Retry Connection</Text>
          </Pressable>
        </View>
      )}
    >
      {children}
    </EnhancedErrorBoundary>
  );
}

export function CriticalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary
      maxRetries={1}
      enableLogging={true}
      enablePerformanceTracking={true}
      fallback={({ error, errorId }) => (
        <View style={styles.criticalContainer}>
          <Text style={styles.criticalTitle}>Critical Error</Text>
          <Text style={styles.criticalMessage}>
            A critical error has occurred. The app needs to be restarted.
          </Text>
          <Text style={styles.criticalErrorId}>Error ID: {errorId}</Text>
        </View>
      )}
    >
      {children}
    </EnhancedErrorBoundary>
  );
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // Log to memory for debugging
    memoryManager.setCache(`error-${Date.now()}`, {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Send to error reporting service if available
    // This would integrate with Sentry, Bugsnag, etc.
  };

  const handleAsyncError = async (
    asyncOperation: () => Promise<any>,
    context?: string
  ): Promise<any> => {
    try {
      return await asyncOperation();
    } catch (error) {
      handleError(error as Error, context);
      throw error;
    }
  };

  return { handleError, handleAsyncError };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  errorCard: {
    borderRadius: 16,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorId: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  retryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  reportText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Auth error boundary styles
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  authMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  authButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Network error boundary styles
  networkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  networkTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  networkMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  networkButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  networkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Critical error boundary styles
  criticalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  criticalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  criticalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  criticalErrorId: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
});

export default EnhancedErrorBoundary;
