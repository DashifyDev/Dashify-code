import { cn } from '@/lib/utils';

export function RadioGroup({ className = '', value, onChange, name, children, ...props }) {
  return (
    <div className={cn('space-y-2', className)} role='radiogroup' {...props}>
      {children}
    </div>
  );
}

export function RadioItem({ className = '', value, checked, onChange, label, name, ...props }) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors',
        className
      )}
    >
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className='w-4 h-4 text-[#63899e] border-gray-300 focus:ring-2 focus:ring-[#63899e] cursor-pointer'
      />
      <span className='text-sm font-medium text-gray-700 group-hover:text-[#63899e] transition-colors'>
        {label}
      </span>
    </label>
  );
}

