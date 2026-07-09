import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  href = '/',
  className,
  showText = true,
}: {
  href?: string;
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 group', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft transition-transform group-hover:scale-105">
        <GraduationCap className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-xl font-extrabold tracking-tight text-foreground">
          Exam<span className="text-primary">Hub</span>
        </span>
      )}
    </Link>
  );
}