import React, { ErrorInfo, ReactNode } from 'react';
import i18n from '../utils/i18n';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-lg text-red-900">
                    <h1 className="text-2xl font-bold mb-4">
                        {i18n.t('errors.somethingWentWrong')}
                    </h1>
                    <p className="mb-4">{i18n.t('errors.appCrashed')}</p>
                    <div className="bg-white p-4 rounded border border-red-100 overflow-auto max-h-96 text-sm font-mono whitespace-pre-wrap">
                        {this.state.error?.toString()}
                        <hr className="my-2 border-red-100" />
                        {this.state.errorInfo?.componentStack}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        {i18n.t('errors.reloadPage')}
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
