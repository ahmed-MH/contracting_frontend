import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, LoaderCircle, Upload, Wand2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ModalShell from '../../../components/ui/ModalShell';
import { Button } from '../../../components/ui/Button';
import HotelLogoPreview from './HotelLogoPreview';
import { useUploadHotelLogo, type Hotel } from '../hooks/useHotels';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const INPUT_ACCEPT = '.png,.jpg,.jpeg,.webp';

interface HotelLogoUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotelId?: number | null;
    hotelName?: string | null;
    currentLogoUrl?: string | null;
    onUploaded?: (hotel: Hotel) => void;
}

function bytesToSize(value: number) {
    if (value >= 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function loadImageFromUrl(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to read the selected image'));
        image.src = url;
    });
}

async function convertWebpToPng(file: File) {
    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await loadImageFromUrl(objectUrl);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas conversion is not available in this browser');
        }

        context.drawImage(image, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/png', 0.92);
        });

        if (!blob) {
            throw new Error('PNG conversion failed');
        }

        return new File(
            [blob],
            file.name.replace(/\.webp$/i, '.png'),
            { type: 'image/png', lastModified: Date.now() },
        );
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export default function HotelLogoUploadModal({
    isOpen,
    onClose,
    hotelId,
    hotelName,
    currentLogoUrl,
    onUploaded,
}: HotelLogoUploadModalProps) {
    const { t } = useTranslation('common');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [helperNotice, setHelperNotice] = useState<string | null>(null);
    const [isPreparingFile, setIsPreparingFile] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const uploadMutation = useUploadHotelLogo((hotel) => {
        onUploaded?.(hotel);
        handleClose();
    });

    useEffect(() => {
        if (!previewUrl) return;

        return () => {
            URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        if (!isOpen) {
            clearSelection();
        }
    }, [isOpen]);

    const previewLabel = useMemo(() => {
        if (!selectedFile) return null;
        return `${selectedFile.name} • ${bytesToSize(selectedFile.size)}`;
    }, [selectedFile]);

    function clearSelection() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setUploadFile(null);
        setPreviewUrl(null);
        setError(null);
        setHelperNotice(null);
        setIsPreparingFile(false);
        setIsDragging(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function handleClose() {
        clearSelection();
        onClose();
    }

    async function prepareFile(file: File) {
        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
            throw new Error(t('pages.hotel.logoUpload.validation.invalidType', {
                defaultValue: 'Unsupported format. Please choose a PNG, JPG, or WebP image.',
            }));
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(t('pages.hotel.logoUpload.validation.fileTooLarge', {
                defaultValue: 'The logo is too large. Please choose an image smaller than 5 MB.',
            }));
        }

        if (file.type === 'image/webp') {
            const convertedFile = await convertWebpToPng(file);

            if (convertedFile.size > MAX_FILE_SIZE) {
                throw new Error(t('pages.hotel.logoUpload.validation.fileTooLarge', {
                    defaultValue: 'The logo is too large. Please choose an image smaller than 5 MB.',
                }));
            }

            setHelperNotice(t('pages.hotel.logoUpload.notice.webpConverted', {
                defaultValue: 'WebP files are converted to PNG so document previews and PDFs keep rendering correctly.',
            }));
            return convertedFile;
        }

        setHelperNotice(null);
        return file;
    }

    async function handleFiles(files: FileList | File[]) {
        const file = Array.from(files)[0];
        if (!file) return;

        setIsPreparingFile(true);
        setError(null);

        try {
            const nextUploadFile = await prepareFile(file);
            const nextPreviewUrl = URL.createObjectURL(file);

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            setSelectedFile(file);
            setUploadFile(nextUploadFile);
            setPreviewUrl(nextPreviewUrl);
        } catch (selectionError) {
            setSelectedFile(null);
            setUploadFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            setError(selectionError instanceof Error
                ? selectionError.message
                : t('pages.hotel.logoUpload.validation.generic', { defaultValue: 'Unable to use this file.' }));
        } finally {
            setIsPreparingFile(false);
            setIsDragging(false);
        }
    }

    async function handleSave() {
        if (!hotelId) {
            setError(t('pages.hotel.logoUpload.validation.hotelRequired', {
                defaultValue: 'Save the hotel first before uploading its logo.',
            }));
            return;
        }

        if (!uploadFile) {
            setError(t('pages.hotel.logoUpload.validation.fileRequired', {
                defaultValue: 'Choose a logo file before saving.',
            }));
            return;
        }

        uploadMutation.mutate({ id: hotelId, file: uploadFile });
    }

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={handleClose}
            title={t('pages.hotel.logoUpload.title', { defaultValue: 'Upload hotel logo' })}
            subtitle={t('pages.hotel.logoUpload.subtitle', { defaultValue: 'Branding asset for previews, contracts, and proformas' })}
            icon={<ImagePlus size={18} />}
            maxWidth="max-w-3xl"
            footer={(
                <>
                    <Button type="button" variant="secondary" onClick={handleClose}>
                        {t('actions.cancel', { defaultValue: 'Cancel' })}
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSave}
                        disabled={uploadMutation.isPending || isPreparingFile || !uploadFile || !hotelId}
                        className="gap-2 px-6 disabled:cursor-not-allowed"
                    >
                        {uploadMutation.isPending || isPreparingFile
                            ? <LoaderCircle size={16} className="animate-spin" />
                            : <Upload size={16} />}
                        {t('actions.save', { defaultValue: 'Save' })}
                    </Button>
                </>
            )}
        >
            <div className="space-y-6 px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={() => setIsDragging(true)}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(event) => {
                                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                                setIsDragging(false);
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                void handleFiles(event.dataTransfer.files);
                            }}
                            className={`w-full rounded-[28px] border border-dashed px-6 py-8 text-left transition-all ${
                                isDragging
                                    ? 'border-brand-mint bg-brand-mint/10 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]'
                                    : 'border-brand-slate/20 bg-brand-light/60 hover:border-brand-mint/60 hover:bg-brand-mint/5 dark:bg-brand-light/5'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={INPUT_ACCEPT}
                                className="hidden"
                                onChange={(event) => {
                                    if (event.target.files) {
                                        void handleFiles(event.target.files);
                                    }
                                }}
                            />

                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-mint/12 text-brand-mint">
                                    <Upload size={22} />
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-base font-semibold text-brand-navy dark:text-brand-light">
                                            {t('pages.hotel.logoUpload.dropzone.title', { defaultValue: 'Drag and drop a logo here' })}
                                        </p>
                                        <p className="mt-1 text-sm text-brand-slate dark:text-brand-light/75">
                                            {t('pages.hotel.logoUpload.dropzone.subtitle', { defaultValue: 'Or click to browse your files. PNG and JPG are stored directly; WebP is converted automatically for document compatibility.' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-slate">
                                        <span className="rounded-full bg-brand-light px-3 py-1 dark:bg-brand-light/10">PNG</span>
                                        <span className="rounded-full bg-brand-light px-3 py-1 dark:bg-brand-light/10">JPG</span>
                                        <span className="rounded-full bg-brand-light px-3 py-1 dark:bg-brand-light/10">JPEG</span>
                                        <span className="rounded-full bg-brand-light px-3 py-1 dark:bg-brand-light/10">WebP</span>
                                        <span>{t('pages.hotel.logoUpload.dropzone.maxSize', { defaultValue: 'Max 5 MB' })}</span>
                                    </div>
                                </div>
                            </div>
                        </button>

                        {(error || helperNotice || !hotelId) && (
                            <div className="space-y-2">
                                {!hotelId && (
                                    <div className="flex items-start gap-2 rounded-2xl border border-brand-slate/15 bg-brand-slate/5 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light/75">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-brand-mint" />
                                        <span>
                                            {t('pages.hotel.logoUpload.validation.hotelRequired', {
                                                defaultValue: 'Save the hotel first before uploading its logo.',
                                            })}
                                        </span>
                                    </div>
                                )}
                                {helperNotice && (
                                    <div className="flex items-start gap-2 rounded-2xl border border-brand-mint/20 bg-brand-mint/8 px-4 py-3 text-sm text-brand-navy dark:text-brand-light">
                                        <Wand2 size={16} className="mt-0.5 shrink-0 text-brand-mint" />
                                        <span>{helperNotice}</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-start gap-2 rounded-2xl border border-brand-slate/15 bg-brand-slate/5 px-4 py-3 text-sm text-brand-slate dark:border-brand-light/10 dark:bg-brand-light/5 dark:text-brand-light">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[28px] border border-brand-light/70 bg-brand-light/72 p-4 shadow-sm dark:border-brand-light/10 dark:bg-brand-light/5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-slate">
                            {previewUrl
                                ? t('pages.hotel.logoUpload.preview.selected', { defaultValue: 'Selected logo' })
                                : t('pages.hotel.logoUpload.preview.current', { defaultValue: 'Current logo' })}
                        </p>

                        <div className="mt-4">
                            {previewUrl ? (
                                <div className="space-y-3">
                                    <HotelLogoPreview
                                        logoUrl={previewUrl}
                                        hotelName={hotelName}
                                        className="h-44 w-full rounded-[24px]"
                                        imageClassName="p-4"
                                        fallbackMode="icon"
                                    />
                                    <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-brand-slate dark:bg-brand-navy/70 dark:text-brand-light/75">
                                        <p className="font-semibold text-brand-navy dark:text-brand-light">{previewLabel}</p>
                                        <p className="mt-1 text-xs">
                                            {t('pages.hotel.logoUpload.preview.replaceHint', { defaultValue: 'Saving will replace the hotel logo path with the stored local upload URL.' })}
                                        </p>
                                    </div>
                                    <Button type="button" variant="secondary" onClick={clearSelection} className="w-full gap-2">
                                        <X size={15} />
                                        {t('pages.hotel.logoUpload.preview.clear', { defaultValue: 'Discard selection' })}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <HotelLogoPreview
                                        logoUrl={currentLogoUrl}
                                        hotelName={hotelName}
                                        className="h-44 w-full rounded-[24px]"
                                        imageClassName="p-4"
                                        fallbackMode="icon"
                                    />
                                    <p className="rounded-2xl bg-white/70 px-4 py-3 text-xs text-brand-slate dark:bg-brand-navy/70 dark:text-brand-light/75">
                                        {currentLogoUrl
                                            ? t('pages.hotel.logoUpload.preview.currentHint', { defaultValue: 'Existing remote URLs and previously stored local paths stay supported.' })
                                            : t('pages.hotel.logoUpload.preview.emptyHint', { defaultValue: 'No logo is stored yet. Upload one to brand contracts and proformas.' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}
