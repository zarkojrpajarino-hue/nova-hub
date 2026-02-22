/**
 * VALIDATED INPUT
 *
 * Input component con validación en tiempo real
 * Muestra feedback inmediato mientras el usuario escribe
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { ValidationResult } from '@/utils/validation';
import { cn } from '@/lib/utils';

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate: (value: string) => ValidationResult;
  type?: 'text' | 'textarea' | 'email' | 'url' | 'number';
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  debounceMs?: number;
}

export function ValidatedInput({
  label,
  value,
  onChange,
  validate,
  type = 'text',
  placeholder,
  required = false,
  helpText,
  debounceMs = 500,
}: ValidatedInputProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
  const [isTouched, setIsTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Debounced validation
  useEffect(() => {
    if (!isTouched) return;

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const result = validate(value);
      setValidationResult(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, validate, debounceMs, isTouched]);

  const handleChange = (newValue: string) => {
    if (!isTouched) setIsTouched(true);
    onChange(newValue);
  };

  const handleBlur = () => {
    setIsTouched(true);
    const result = validate(value);
    setValidationResult(result);
  };

  const showError = isTouched && !validationResult.isValid && validationResult.error;
  const showWarning = isTouched && validationResult.isValid && validationResult.warning;
  const showSuccess =
    isTouched && validationResult.isValid && !validationResult.warning && value.length > 0;
  const showSuggestion = isTouched && validationResult.suggestion;

  const inputClassName = cn(
    'transition-colors',
    showError && 'border-red-500 focus:ring-red-500',
    showWarning && 'border-yellow-500 focus:ring-yellow-500',
    showSuccess && 'border-green-500 focus:ring-green-500'
  );

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {isValidating && (
          <span className="text-xs text-gray-400 animate-pulse">Validando...</span>
        )}
      </Label>

      <div className="relative">
        <InputComponent
          type={type === 'textarea' ? undefined : type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClassName}
          rows={type === 'textarea' ? 3 : undefined}
        />

        {/* Validation icon */}
        {!isValidating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {showSuccess && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            {showWarning && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
            {showError && <AlertCircle className="h-5 w-5 text-red-500" />}
          </div>
        )}
      </div>

      {/* Error message */}
      {showError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {validationResult.error}
        </p>
      )}

      {/* Warning message */}
      {showWarning && (
        <p className="text-sm text-yellow-600 flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          {validationResult.warning}
        </p>
      )}

      {/* Suggestion */}
      {showSuggestion && (
        <p className="text-sm text-blue-600 italic">💡 {validationResult.suggestion}</p>
      )}

      {/* Help text */}
      {helpText && !showError && !showWarning && !showSuggestion && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
