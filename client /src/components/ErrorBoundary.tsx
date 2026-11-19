import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children:ReactNode;
};

interface State {
    hasError:boolean;
    error:Error | null;
};

export class ErrorBoundary extends Component<Props,State> {
    constructor(props:Props) {
        super(props);
        this.state = {hasError:false,error:null};
    }

    // 1. Այս ֆունկցիան աշխատում է սխալի պահին և թույլ է տալիս թարմացնել State-ը
    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }


    // 2. Այստեղ մենք կարող ենք սխալն ուղարկել մեր մոնիթորինգի համակարգին (օր.՝ Sentry)
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error in UI:', error, errorInfo);
        // Ապագայում այստեղ կարող ենք ավելացնել՝ logService.logError(error)
    }

    public render() {
        if (this.state.hasError) {
            // Սա Fallback UI-ն է, որը կտեսնի յուզերը՝ սպիտակ էկրանի փոխարեն
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-red-100 dark:border-red-900/30">
                        <span className="text-6xl block mb-4">🚨</span>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Oops! Something went wrong.
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            We've been notified and are working to fix the issue.
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-left overflow-auto mb-6">
                            <code className="text-xs text-red-600 dark:text-red-400">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.assign('/')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            );
        }

        // Եթե սխալ չկա, նկարում ենք բուն հավելվածը
        return this.props.children;
    }
}