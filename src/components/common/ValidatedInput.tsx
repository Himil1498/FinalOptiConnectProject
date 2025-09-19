import React, { useState, useCallback, forwardRef } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ValidationResult, PasswordStrengthResult } from '../../utils/formValidation';

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: ValidationResult;
  leftIcon?: React.ComponentType<{ className?: string }>;
  showPasswordToggle?: boolean;
  passwordStrength?: PasswordStrengthResult;
  onChange: (value: string) => void;
  onBlur?: () => void;
  helpText?: string;
  containerClassName?: string;
}

const PasswordStrengthIndicator: React.FC<{ strength: PasswordStrengthResult }> = ({ strength }) => {
  const getStrengthColor = () => {
    switch (strength.level) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-orange-500';
      case 'good': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      case 'very-strong': return 'bg-emerald-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = () => {
    return `${(strength.score / 4) * 100}%`;
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Strength</span>
        <span className="text-xs font-medium text-gray-700 capitalize">
          {strength.level.replace('-', ' ')}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: getStrengthWidth() }}
        />
      </div>
      {strength.suggestions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-1">Suggestions:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            {strength.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(({
  label,
  error,
  leftIcon: LeftIcon,
  showPasswordToggle = false,
  passwordStrength,
  onChange,
  onBlur,
  helpText,
  containerClassName = '',
  type: initialType = 'text',
  className = '',
  value,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const type = showPasswordToggle && initialType === 'password'
    ? (showPassword ? 'text' : 'password')
    : initialType;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const getValidationIcon = () => {
    if (!error) return null;

    switch (error.level) {
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'info':
        return error.isValid ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : null;
      default:
        return null;
    }
  };

  const getInputClasses = () => {
    const baseClasses = `block w-full px-3 py-3 border rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200`;

    const leftPadding = LeftIcon ? 'pl-10' : 'pl-3';
    const rightPadding = showPasswordToggle || getValidationIcon() ? 'pr-10' : 'pr-3';

    let borderClasses = '';
    if (error && !error.isValid) {
      borderClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    } else if (error && error.level === 'warning') {
      borderClasses = 'border-amber-300 focus:border-amber-500 focus:ring-amber-500';
    } else if (error && error.isValid && error.level === 'info') {
      borderClasses = 'border-green-300 focus:border-green-500 focus:ring-green-500';
    } else {
      borderClasses = isFocused
        ? 'border-indigo-500 ring-indigo-500'
        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';
    }

    return `${baseClasses} ${leftPadding} ${rightPadding} ${borderClasses} ${className}`;
  };

  const getValidationMessage = () => {
    if (!error || !error.message) return null;

    const colorClasses = {
      error: 'text-red-600',
      warning: 'text-amber-600',
      info: 'text-green-600'
    };

    return (
      <p className={`mt-1 text-sm flex items-start ${colorClasses[error.level || 'error']}`}>
        {getValidationIcon() && <span className="mr-2 mt-0.5 flex-shrink-0">{getValidationIcon()}</span>}
        {error.message}
      </p>
    );
  };

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getInputClasses()}
          {...props}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          )}

          {!showPasswordToggle && getValidationIcon()}
        </div>
      </div>

      {getValidationMessage()}

      {helpText && !error?.message && (
        <p className="text-sm text-gray-500 flex items-start">
          <InformationCircleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
          {helpText}
        </p>
      )}

      {passwordStrength && (
        <PasswordStrengthIndicator strength={passwordStrength} />
      )}
    </div>
  );
});

ValidatedInput.displayName = 'ValidatedInput';

export default ValidatedInput;