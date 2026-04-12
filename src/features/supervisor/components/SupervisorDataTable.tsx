import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface SupervisorTableColumn<T> {
    key: string;
    label: string;
    className?: string;
    render: (row: T) => ReactNode;
}

interface SupervisorDataTableProps<T> {
    columns: SupervisorTableColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
}

export function SupervisorDataTable<T>({
    columns,
    rows,
    rowKey,
}: SupervisorDataTableProps<T>) {
    const { t } = useTranslation('common');
    void t;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-white/60 text-brand-slate dark:bg-white/5">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`px-5 py-4 font-semibold uppercase tracking-[0.18em] ${column.className ?? ''}`}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/60 dark:divide-white/10">
                    {rows.map((row) => (
                        <tr key={rowKey(row)} className="bg-white/35 dark:bg-transparent">
                            {columns.map((column) => (
                                <td key={column.key} className={`px-5 py-4 align-top ${column.className ?? ''}`}>
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
