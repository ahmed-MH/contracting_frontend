import { useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import clsx from 'clsx';
import { resolveAssetUrl } from '../../../lib/asset-url';

interface HotelLogoPreviewProps {
    logoUrl?: string | null;
    hotelName?: string | null;
    className?: string;
    imageClassName?: string;
    fallbackClassName?: string;
    fallbackMode?: 'initial' | 'icon';
}

export default function HotelLogoPreview({
    logoUrl,
    hotelName,
    className,
    imageClassName,
    fallbackClassName,
    fallbackMode = 'initial',
}: HotelLogoPreviewProps) {
    const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl), [logoUrl]);
    const [hasImageError, setHasImageError] = useState(false);

    useEffect(() => {
        setHasImageError(false);
    }, [resolvedLogoUrl]);

    const fallbackLabel = (hotelName?.trim()?.slice(0, 1) || 'H').toUpperCase();

    return (
        <div className={clsx('flex items-center justify-center overflow-hidden rounded-2xl border border-brand-light/70 bg-white dark:border-brand-light/10 dark:bg-brand-navy/60', className)}>
            {resolvedLogoUrl && !hasImageError ? (
                <img
                    src={resolvedLogoUrl}
                    alt={hotelName ? `${hotelName} logo` : 'Hotel logo'}
                    className={clsx('h-full w-full object-contain', imageClassName)}
                    onError={() => setHasImageError(true)}
                />
            ) : (
                <div className={clsx('flex h-full w-full items-center justify-center bg-brand-light/70 text-brand-navy dark:bg-brand-light/5 dark:text-brand-light', fallbackClassName)}>
                    {fallbackMode === 'icon'
                        ? <Building2 size={28} className="text-brand-mint" />
                        : <span className="text-2xl font-black tracking-tight">{fallbackLabel}</span>}
                </div>
            )}
        </div>
    );
}
