import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'destructive' | 'info' | 'success';
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'destructive' }) => {
  const variantStyles = {
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    info: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  return (
    <div className={`mb-4 border rounded-xl px-4 py-3 text-sm shrink-0 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150 select-none ${variantStyles[variant]}`}>
      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
      <div className="flex-1 min-w-0 font-medium">{children}</div>
    </div>
  );
};
