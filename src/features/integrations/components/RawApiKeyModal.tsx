import { useTranslation } from 'react-i18next';
import { Copy, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../../components/ui/Modal';

interface RawApiKeyModalProps {
    isOpen: boolean;
    rawKey: string | null;
    onClose: () => void;
}

export default function RawApiKeyModal({ isOpen, rawKey, onClose }: RawApiKeyModalProps) {
    const { t } = useTranslation('common');
    const copyRawKey = async () => {
        if (!rawKey) return;
        await navigator.clipboard.writeText(rawKey);
        toast.success(t('pages.integrations.docs.copied'));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pages.integrations.keys.rawKey.title')}
            maxWidth="max-w-2xl"
        >
            <div className="space-y-5">
                <div className="rounded-[1.5rem] border border-brand-mint/25 bg-brand-mint/8 p-4">
                    <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-mint/12 text-brand-mint">
                            <ShieldAlert size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-brand-navy dark:text-brand-light">
                                {t('pages.integrations.keys.rawKey.description')}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-brand-slate dark:text-brand-light/75">
                                {t('pages.integrations.keys.rawKey.hint')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[1.5rem] border border-brand-navy/10 bg-brand-navy p-4 text-brand-light shadow-inner dark:border-brand-light/10">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-light/65">
                            {t('pages.integrations.keys.rawKey.copyNow')}
                        </p>
                        <button
                            type="button"
                            onClick={() => void copyRawKey()}
                            className="inline-flex items-center gap-2 rounded-xl border border-brand-light/10 bg-brand-light/10 px-3 py-2 text-xs font-semibold text-brand-light transition hover:bg-brand-light/20 focus:outline-none focus:ring-2 focus:ring-brand-mint/40"
                        >
                            <Copy size={14} />
                            {t('actions.copy')}
                        </button>
                    </div>
                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all font-mono text-sm leading-6">
                        {rawKey}
                    </pre>
                </div>
            </div>
        </Modal>
    );
}
