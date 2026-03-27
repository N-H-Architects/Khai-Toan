import React from 'react';

interface InputGroupProps {
  label: string;
  subLabel?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  subLabel, 
  children, 
  className = '', 
  labelClassName 
}) => {
  // Use passed labelClassName or default to gray-700 if not provided
  const labelClass = labelClassName 
    ? `block text-sm font-medium mb-1 ${labelClassName}`
    : 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className={`mb-4 ${className}`}>
      <label className={labelClass}>
        {label}
      </label>
      <div className="flex gap-2 items-center">
        {children}
      </div>
      {subLabel && <p className="text-xs text-gray-500 mt-1 italic">{subLabel}</p>}
    </div>
  );
};

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  onValueChange: (val: number) => void;
  suffix?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ value, onValueChange, suffix, className = '', ...props }) => {
  const formatValue = (val: number) => {
    if (val === 0) return '';
    return val.toLocaleString('vi-VN');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const normalizedValue = rawValue.replace(',', '.');
    const numValue = parseFloat(normalizedValue) || 0;
    onValueChange(numValue);
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        value={formatValue(value)}
        onChange={handleChange}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};