import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return <Loader2 className="animate-spin text-primary-500" style={{ width: size, height: size }} />;
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <LoadingSpinner size={36} />
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-gray-500 dark:text-gray-400">
      <LoadingSpinner size={20} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

export function ButtonLoader({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {children}
    </span>
  );
}
