import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-2">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-bold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              The app ran into an unexpected error. Try restarting.
            </p>
            <Button
              onClick={this.handleReset}
              className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
