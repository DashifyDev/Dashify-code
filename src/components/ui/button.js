import { cn } from '@/lib/utils';

export function Button({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63899e] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-[#63899e] text-white hover:bg-[#4a6d7e] shadow-sm hover:shadow-md border-0',
    outline: 'border border-solid border-[#63899e] bg-transparent text-[#63899e] hover:bg-[#63899e] hover:text-white',
    ghost: 'hover:bg-gray-100 hover:text-[#63899e]',
    link: 'underline-offset-4 hover:underline text-[#63899e]',
  };
  
  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

