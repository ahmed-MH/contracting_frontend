import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMeta } from '../../types';

export const DEFAULT_PAGE_SIZE = 10;

export function createClientPageMeta(total: number, page: number, limit = DEFAULT_PAGE_SIZE): PageMeta {
    const lastPage = Math.max(1, Math.ceil(total / limit));
    return {
        total,
        page: Math.min(Math.max(1, page), lastPage),
        limit,
        lastPage,
    };
}

export function getPageItems<T>(items: T[], meta: PageMeta): T[] {
    const start = (meta.page - 1) * meta.limit;
    return items.slice(start, start + meta.limit);
}

export default function PaginationControls({
    meta,
    onPageChange,
}: {
    meta?: PageMeta;
    onPageChange: (page: number) => void;
}) {
    if (!meta || meta.lastPage <= 1) return null;

    return (
        <div className="flex items-center justify-between gap-3 border-t border-brand-light/70 px-5 py-4 text-sm text-brand-slate dark:border-brand-light/10 dark:text-brand-light/70">
            <span>
                Page {meta.page} of {meta.lastPage} - {meta.total} total
            </span>
            <div className="flex items-center gap-2">
                <button
                    disabled={meta.page <= 1}
                    onClick={() => onPageChange(meta.page - 1)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    <ChevronLeft size={14} />
                    Previous
                </button>
                <button
                    disabled={meta.page >= meta.lastPage}
                    onClick={() => onPageChange(meta.page + 1)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-brand-light/70 bg-brand-light/70 px-3 font-semibold text-brand-navy transition hover:border-brand-mint hover:text-brand-mint disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light"
                >
                    Next
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
