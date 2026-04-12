import React from 'react';
import { useTranslation } from 'react-i18next';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => {
    const { t } = useTranslation('common');
    void t;
    const baseStyles = 'transition-all duration-300 rounded-xl font-semibold px-4 py-2 inline-flex items-center justify-center';

    const variants = {
      primary: 'bg-brand-mint text-white hover:bg-brand-mint/90',
      secondary: 'bg-transparent border border-brand-navy text-brand-navy hover:bg-brand-mint/10 dark:border-brand-light dark:text-brand-light dark:hover:bg-brand-light/10',
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
