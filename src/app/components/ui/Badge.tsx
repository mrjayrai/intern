import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          {
            'bg-secondary text-secondary-foreground': variant === 'default',
            'bg-emerald-100 text-emerald-800': variant === 'success',
            'bg-amber-100 text-amber-800': variant === 'warning',
            'bg-red-100 text-red-800': variant === 'error',
            'bg-blue-100 text-blue-800': variant === 'info',
            'bg-purple-100 text-purple-800': variant === 'purple',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
