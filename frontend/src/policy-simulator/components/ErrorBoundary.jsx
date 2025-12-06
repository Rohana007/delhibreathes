import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Error Boundary for Policy Simulator Components
 * Prevents crashes from breaking the entire page
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Policy Simulator Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl" style={{ 
          backgroundColor: '#FEF2F2',
          border: '1px solid #DC2626',
        }}>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#DC2626' }}>
              Component Error
            </h3>
          </div>
          <p className="text-sm" style={{ color: '#991B1B' }}>
            {this.state.error?.message || 'An error occurred while rendering this component.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
            }}
          >
            Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

