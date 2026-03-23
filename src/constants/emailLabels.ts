/**
 * Shared email label options — used across Hotel and Affiliate modals.
 * Covers the full spectrum of business email types in a hospitality / B2B context.
 */
export const EMAIL_LABELS = [
    // ── Direction & Administration ────────────────────────────────────
    { value: 'Direction',       label: 'Direction Générale' },
    { value: 'Administration',  label: 'Administration' },
    { value: 'Juridique',       label: 'Juridique' },

    // ── Commercial & Contracting ──────────────────────────────────────
    { value: 'Commercial',      label: 'Commercial' },
    { value: 'Contracting',     label: 'Contracting' },
    { value: 'Booking',         label: 'Réservations (Booking)' },
    { value: 'Stop Sales',      label: 'Stop Sales / Disponibilités' },
    { value: 'SPO',             label: 'SPO / Promotions' },
    { value: 'Early Booking',   label: 'Early Booking' },
    { value: 'Groups',          label: 'Groupes & Évènements' },

    // ── Finance & Comptabilité ────────────────────────────────────────
    { value: 'Comptabilité',    label: 'Comptabilité' },
    { value: 'Facturation',     label: 'Facturation' },
    { value: 'Trésorerie',      label: 'Trésorerie / Paiements' },

    // ── Opérationnel ─────────────────────────────────────────────────
    { value: 'Réceptions',      label: 'Réceptioniste / Front-Office' },
    { value: 'Informatique',    label: 'Informatique / IT' },
    { value: 'Housekeeping',    label: 'Housekeeping' },
    { value: 'Restauration',    label: 'Restauration & Bar' },

    // ── Générique ────────────────────────────────────────────────────
    { value: 'General',         label: 'Général' },
    { value: 'Autre',           label: 'Autre' },
] as const;

export type EmailLabelValue = typeof EMAIL_LABELS[number]['value'];
