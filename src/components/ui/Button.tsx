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
      secondary: 'bg-transparent border border-brand-navy text-brand-navy hover:bg-brand-mint/10 dark:border-brand-light dark:text-brand-light dark:hover:bg-brand-light/10',
      danger: 'bg-brand-slate/20 text-brand-light hover:bg-brand-slate/35 dark:bg-brand-slate/35 dark:hover:bg-brand-slate/50',
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
