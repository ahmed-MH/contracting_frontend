import React from 'react';
import { useTranslation } from 'react-i18next';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const { t } = useTranslation('common');
    void t;
    const baseStyles = 'focus-brand inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-60';

    const variants = {
      primary: 'bg-brand-mint text-brand-light hover:bg-brand-mint/90',
      secondary: 'bg-white/60 border border-brand-slate/25 text-brand-navy hover:border-brand-mint/40 hover:bg-brand-mint/10 dark:bg-transparent dark:border-brand-light/40 dark:text-brand-light dark:hover:bg-brand-light/10',
      danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500/85 dark:hover:bg-red-500',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
