'use client';

import React, { type ErrorInfo, type ReactNode } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

interface ErrorBoundaryInnerProps extends Props {
  title: string;
  message: string;
  tryAgainLabel: string;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryInnerProps,
  State
> {
  constructor(props: ErrorBoundaryInnerProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {this.props.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{this.props.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {this.props.tryAgainLabel}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  const { t } = useLocale();

  return (
    <ErrorBoundaryClass
      title={t('common.errorBoundaryTitle')}
      message={t('common.errorBoundaryMessage')}
      tryAgainLabel={t('common.tryAgain')}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

export default ErrorBoundary;
