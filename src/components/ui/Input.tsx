import React from 'react';
import { useTranslation } from 'react-i18next';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    const { t } = useTranslation('common');
    void t;
    return (
      <input
        ref={ref}
        className={[
          // Base tokens: colors, transitions, placeholder — NO sizing, rounding, or focus ring.
          // Callers define all of those to avoid Tailwind class conflicts.
          'w-full transition-colors duration-300',
          'bg-white border border-brand-slate/30 text-brand-navy',
          'dark:bg-brand-navy/80 dark:border-brand-slate/50 dark:text-brand-light',
          'placeholder:text-brand-slate/50 dark:placeholder:text-brand-slate/40',
          'focus:outline-none', // callers add focus:ring-* and focus:border-*
          className,
        ].join(' ')}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
