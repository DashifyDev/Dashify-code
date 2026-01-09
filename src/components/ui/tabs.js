import { cn } from '@/lib/utils';

export function Tabs({ className = '', ...props }) {
  return (
    <div className={cn('w-full', className)} {...props} />
  );
}

export function TabsList({ className = '', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className = '', active = false, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
        'ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-white text-[#63899e] shadow-sm font-bold underline'
          : 'text-gray-600 hover:text-[#63899e]',
        className
      )}
      {...props}
    />
  );
}

