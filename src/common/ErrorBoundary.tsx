import { ReactNode, PureComponent } from 'react';

type ErrorBoundaryProps = {
  children?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends PureComponent<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  static getDerivedStateFromError<TError extends Error>(
    error: TError
  ): Partial<ErrorBoundaryState> {
    return {
      hasError: !!error,
      error,
    }
  }

  static displayName = 'ErrorBoundary'

  state: ErrorBoundaryState = {
    hasError: false,
  }

  componentDidCatch(receivedError: unknown): void {
    // console.warn(`An error has occurred: ${receivedError}`);
    console.warn(receivedError);
  }

  render(): ReactNode {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return null;
    }

    return children;
  }
}
