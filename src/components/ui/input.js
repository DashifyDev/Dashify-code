import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(({ className = '', type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base',
        'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-gray-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-200',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

