export function resolveAssetUrl(value?: string | null) {
    const raw = value?.trim();
    if (!raw) return null;
    if (/^(data:image|https?:\/\/|blob:)/i.test(raw)) return raw;

    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') as string;
    const backendOrigin = apiBase.replace(/\/api\/?$/i, '').replace(/\/$/, '');
    return `${backendOrigin}/${raw.replace(/^\/+/, '').replace(/^api\/+/i, '')}`;
}

export function isRemoteAssetUrl(value?: string | null) {
    return /^https?:\/\//i.test(value?.trim() ?? '');
}
