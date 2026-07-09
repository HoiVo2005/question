import { Loader2 } from 'lucide-react';

export function PageLoading({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center app-bg">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}

export function InlineSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className}`} />;
}