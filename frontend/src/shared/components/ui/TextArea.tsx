'use client';

import { Input as AntInput } from 'antd';
import type { TextAreaProps as AntTextAreaProps } from 'antd/es/input/TextArea';
import { cn } from '@/lib/utils';

interface TextAreaProps extends AntTextAreaProps {
  label?: string;
  error?: string;
}

export function TextArea({
  className,
  label,
  error,
  id,
  ...props
}: TextAreaProps) {
  const inputId = id ?? props.name?.toString();
  const status = error ? 'error' : undefined;

  return (
    <div className={cn(label ? 'space-y-1' : undefined, !label && className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <AntInput.TextArea
        id={inputId}
        status={status}
        className={cn('w-full', label && className)}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
