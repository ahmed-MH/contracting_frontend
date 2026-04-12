import { useTranslation } from 'react-i18next';
interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  tone?: 'auto' | 'light' | 'dark';
}

export const Logo = ({ className = '', variant = 'full', tone = 'auto' }: LogoProps) => {
    const { t } = useTranslation('common');
    void t;
  const isMark = variant === 'mark';
  const lineColorClass = tone === 'light'
    ? 'stroke-brand-light'
    : tone === 'dark'
      ? 'stroke-brand-navy'
      : 'stroke-brand-navy dark:stroke-brand-light';
  const textColorClass = tone === 'light'
    ? 'text-brand-light'
    : tone === 'dark'
      ? 'text-brand-navy'
      : 'text-brand-navy dark:text-brand-light';

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={isMark ? '28' : '32'}
        height={isMark ? '28' : '32'}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <line
          x1="10"
          y1="6"
          x2="10"
          y2="26"
          strokeWidth="4"
          strokeLinecap="round"
          className={`${lineColorClass} transition-colors duration-300`}
        />
        <path
          d="M10 8H18C21.3137 8 24 10.6863 24 14C24 17.3137 21.3137 20 18 20H10"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-brand-mint"
        />
      </svg>

      {!isMark && (
        <span className={`-ml-[7px] text-2xl font-extrabold tracking-tight transition-colors duration-300 ${textColorClass}`}>
          ricify
        </span>
      )}
    </div>
  );
};
