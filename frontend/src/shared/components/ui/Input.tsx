'use client';

import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps, InputRef } from 'antd/es/input';
import { cn } from '@/lib/utils';
import { forwardRef, useCallback } from 'react';

interface InputProps extends Omit<AntInputProps, 'status'> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, type, ...props },
  ref,
) {
  const inputId = id ?? props.name?.toString();
  const status = error ? 'error' : undefined;

  const setRefs = useCallback(
    (node: InputRef | null) => {
      const nativeInput = node?.input ?? null;
      if (typeof ref === 'function') {
        ref(nativeInput);
      } else if (ref) {
        ref.current = nativeInput;
      }
    },
    [ref],
  );

  const inputElement =
    type === 'password' ? (
      <AntInput.Password
        id={inputId}
        status={status}
        className={cn('w-full', className)}
        {...props}
        ref={setRefs}
      />
    ) : (
      <AntInput
        id={inputId}
        type={type}
        status={status}
        className={cn('w-full', className)}
        {...props}
        ref={setRefs}
      />
    );

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      {inputElement}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
