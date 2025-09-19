import React from 'react';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars' | 'ring';

interface LoadingSpinnerProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  color?: string;
  text?: string;
  className?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'text-indigo-600',
  text,
  className = '',
  overlay = false
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = (): React.ReactElement => {
    const spinnerSize = sizeClasses[size];

    switch (variant) {
      case 'spinner':
        return (
          <div className={`${spinnerSize} ${color} animate-spin`}>
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} ${color.replace('text-', 'bg-')} rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={`${spinnerSize} ${color.replace('text-', 'bg-')} rounded-full animate-pulse`} />
        );

      case 'bars':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-1 ${color.replace('text-', 'bg-')} animate-pulse rounded-full`}
                style={{
                  height: size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '20px' : size === 'lg' ? '24px' : '32px',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className={`${spinnerSize} ${color} animate-spin`}>
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <circle
                className="opacity-75"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="15.708"
              />
            </svg>
          </div>
        );

      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} ${color} font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Skeleton loader component
export const SkeletonLoader: React.FC<{
  className?: string;
  lines?: number;
  avatar?: boolean;
}> = ({ className = '', lines = 3, avatar = false }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex space-x-4">
        {avatar && (
          <div className="rounded-full bg-gray-300 h-10 w-10"></div>
        )}
        <div className="flex-1 space-y-2 py-1">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`h-4 bg-gray-300 rounded ${
                i === lines - 1 ? 'w-2/3' : 'w-full'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse p-4 ${className}`}>
      <div className="rounded-lg bg-gray-300 h-48 w-full mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className={`h-4 bg-gray-300 rounded ${
                      colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'w-16' : 'w-24'
                    }`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoadingSpinner;