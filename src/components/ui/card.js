import { cn } from '@/lib/utils';

export function Card({ className = '', ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-gray-300/60',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({ className = '', ...props }) {
  return (
    <h3
      className={cn('text-2xl font-semibold leading-none tracking-tight text-[#63899e]', className)}
      {...props}
    />
  );
}

export function CardDescription({ className = '', ...props }) {
  return (
    <p
      className={cn('text-sm text-gray-600', className)}
      {...props}
    />
  );
}

export function CardContent({ className = '', ...props }) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props} />
  );
}

export function CardFooter({ className = '', ...props }) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
  );
}

