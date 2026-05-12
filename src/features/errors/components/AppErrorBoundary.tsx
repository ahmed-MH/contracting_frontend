import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import UnexpectedErrorPage from '../pages/UnexpectedErrorPage';

interface RouteErrorBoundaryProps {
    children: ReactNode;
    resetKey: string;
}

interface RouteErrorBoundaryState {
    hasError: boolean;
}

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
    state: RouteErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): RouteErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Unhandled route error', error, errorInfo);
    }

    componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
        if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
            this.setState({ hasError: false });
        }
    }

    reset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return <UnexpectedErrorPage onRetry={this.reset} />;
        }

        return this.props.children;
    }
}

export default function AppErrorBoundary({ children }: { children: ReactNode }) {
    const location = useLocation();

    return (
        <RouteErrorBoundary resetKey={location.pathname}>
            {children}
        </RouteErrorBoundary>
    );
}
