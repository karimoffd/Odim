import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fff', borderRadius: '16px', margin: '20px', border: '1px solid #fee2e2', color: '#991b1b' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 600 }}>
            {this.props.fallbackTitle || "Tizimda kutilmagan xatolik yuz berdi"}
          </h2>
          <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#7f1d1d' }}>
            {this.state.error?.message || "Komponentni yuklashda xatolik yuz berdi."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
            }}
          >
            Qayta urinib ko'rish
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
