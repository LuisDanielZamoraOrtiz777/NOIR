"use client";

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("❌ Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-light p-4">
          <div className="text-center" style={{ maxWidth: 500 }}>
            <div className="mb-4">
              <span style={{ fontSize: 64 }}>⚠️</span>
            </div>
            <h2 className="h4 fw-bold mb-3">Algo salió mal</h2>
            <p className="text-muted mb-4">
              Ocurrió un error inesperado. Nuestro equipo ha sido notificado.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 p-3 bg-danger bg-opacity-10 rounded text-start" style={{ fontSize: 12 }}>
                <p className="text-danger fw-bold mb-2">{this.state.error.toString()}</p>
                <pre className="text-muted mb-0" style={{ whiteSpace: "pre-wrap" }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
            <button
              className="btn btn-light px-4"
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.href = "/";
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}