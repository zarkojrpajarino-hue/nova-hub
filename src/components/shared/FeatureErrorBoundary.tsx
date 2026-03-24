/**
 * FeatureErrorBoundary — V5.5.6
 *
 * Reusable error boundary that shows "Something went wrong" + Retry button.
 * Wraps feature areas to prevent a single component crash from taking down the app.
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  /** Optional label to show which area failed */
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[FeatureErrorBoundary${this.props.featureName ? ` — ${this.props.featureName}` : ''}]`,
      error,
      errorInfo.componentStack,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.props.featureName
                ? `An error occurred in ${this.props.featureName}. Please try again.`
                : 'An unexpected error occurred. Please try again.'}
            </p>
            {this.state.error && (
              <p className="text-xs text-muted-foreground/60 mt-2 font-mono max-w-md truncate">
                {this.state.error.message}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={this.handleRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
