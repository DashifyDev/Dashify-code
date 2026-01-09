import { cn } from '@/lib/utils';

export function Badge({ className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'bg-[#63899e] text-white',
    secondary: 'bg-gray-100 text-gray-800',
    outline: 'border border-gray-300 text-gray-800',
  };
  
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

