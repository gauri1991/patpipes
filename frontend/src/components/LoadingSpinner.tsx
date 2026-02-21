import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className = '', size = 'default' }: { className?: string; size?: 'small' | 'default' | 'large' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-cyan-600 ${sizeClasses[size]}`} />
    </div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 via-white to-blue-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mx-auto mb-4" />
        <p className="text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}
