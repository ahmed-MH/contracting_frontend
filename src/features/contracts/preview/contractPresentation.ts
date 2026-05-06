import type { Contract } from '../types/contract.types';
import type { Hotel } from '../../hotel/types/hotel.types';
import type { ContractLineData } from '../services/contract.service';
import type { ExchangeRate } from '../../exchange-rates/types/exchange-rate.types';
import type { ContractSupplement } from '../../catalog/supplements/types/supplements.types';
import type { ContractReduction } from '../../catalog/reductions/types/reductions.types';
import type { ContractEarlyBooking } from '../../catalog/early-bookings/types/early-bookings.types';
import type { ContractSpo } from '../../catalog/spos/types/spos.types';
import type { ContractCancellationRule } from '../../catalog/cancellation/types/cancellation.types';

export type ContractPreviewLanguage = 'fr' | 'en';

const CURRENCY_DECIMALS: Record<string, number> = {
    JPY: 0,
    TND: 3,
};

export interface ContractPresentationFx {
    sourceCurrency: string;
    outputCurrency: string;
    rate: number;
    rateDate: string;
    source: 'BASE_CURRENCY' | 'EXCHANGE_RATE_TABLE';
    valuesUsed: Record<string, number>;
    isConvertible: boolean;
}

export interface ContractPresentationContext {
    language: ContractPreviewLanguage;
    sourceCurrency: string;
    outputCurrency: string;
    fx: ContractPresentationFx;
}

export interface ContractPreviewCommercialData {
    contract: Contract;
    prices: ContractLineData[];
    supplements: ContractSupplement[];
    reductions: ContractReduction[];
    earlyBookings: ContractEarlyBooking[];
    spos: ContractSpo[];
    cancellations: ContractCancellationRule[];
}

const normalizeCurrency = (currency?: string | null) => (currency || '').trim().toUpperCase();

const toIsoDate = (value?: string | Date | null) => {
    if (!value) return new Date().toISOString().slice(0, 10);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
    return date.toISOString().slice(0, 10);
};

const rateAppliesOn = (rate: ExchangeRate, date: Date) => {
    const effectiveDate = new Date(rate.effectiveDate);

    if (Number.isNaN(effectiveDate.getTime())) return false;
    if (effectiveDate.getTime() > date.getTime()) return false;
    return true;
};

export function exchangeRatePairKey(from: string, to: string) {
    return `${normalizeCurrency(from)}_${normalizeCurrency(to)}`;
}

const selectCurrentRate = (rates: ExchangeRate[], fromCurrency: string, toCurrency: string, asOf = new Date()) => {
    const from = normalizeCurrency(fromCurrency);
    const to = normalizeCurrency(toCurrency);
    const matching = rates
        .filter((rate) => normalizeCurrency(rate.fromCurrency) === from && normalizeCurrency(rate.toCurrency) === to)
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    return matching.find((rate) => rateAppliesOn(rate, asOf)) ?? matching[0] ?? null;
};

export function buildExchangeRatePairs(rates: ExchangeRate[], quoteCurrency?: string | null) {
    void quoteCurrency;
    const ratePairs: Record<string, number> = {};
    const rateDates: Record<string, string> = {};

    const pairKeys = [...new Set(rates
        .map((rate) => `${normalizeCurrency(rate.fromCurrency)}_${normalizeCurrency(rate.toCurrency)}`)
        .filter((pair) => !pair.startsWith('_') && !pair.endsWith('_')))];

    pairKeys.forEach((pair) => {
        const [fromCurrency, toCurrency] = pair.split('_');
        const currentRate = selectCurrentRate(rates, fromCurrency, toCurrency);
        const value = Number(currentRate?.rate);

        if (!currentRate || !Number.isFinite(value) || value <= 0) return;

        const key = exchangeRatePairKey(fromCurrency, toCurrency);
        ratePairs[key] = value;
        rateDates[key] = toIsoDate(currentRate.effectiveDate);
    });

    return { ratePairs, rateDates };
}

export function convertAmount(
    amount: number,
    from: string,
    to: string,
    rates: Record<string, number>,
): number {
    const source = normalizeCurrency(from);
    const target = normalizeCurrency(to);

    if (source === target) return amount;

    const directKey = exchangeRatePairKey(source, target);
    const inverseKey = exchangeRatePairKey(target, source);
    const directRate = rates[directKey];
    const inverseRate = rates[inverseKey];

    if (directRate != null) {
        return amount * directRate;
    }

    if (inverseRate != null) {
        return amount / inverseRate;
    }

    throw new Error(`Missing exchange rate for ${source} -> ${target}`);
}

const resolveDirectConversionRate = (
    source: string,
    target: string,
    ratePairs: Record<string, number>,
    rateDates: Record<string, string>,
) => {
    if (source === target) {
        return {
            rate: 1,
            rateDate: new Date().toISOString().slice(0, 10),
            valuesUsed: { [exchangeRatePairKey(source, target)]: 1 },
        };
    }

    const directKey = exchangeRatePairKey(source, target);
    const inverseKey = exchangeRatePairKey(target, source);

    if (ratePairs[directKey] != null) {
        return {
            rate: ratePairs[directKey],
            rateDate: rateDates[directKey] ?? new Date().toISOString().slice(0, 10),
            valuesUsed: { [directKey]: ratePairs[directKey] },
        };
    }

    if (ratePairs[inverseKey] != null) {
        const rate = 1 / ratePairs[inverseKey];
        return {
            rate,
            rateDate: rateDates[inverseKey] ?? new Date().toISOString().slice(0, 10),
            valuesUsed: { [inverseKey]: ratePairs[inverseKey] },
        };
    }

    return null;
};

export function currencyDecimals(currency: string) {
    return CURRENCY_DECIMALS[normalizeCurrency(currency)] ?? 2;
}

export function roundCurrency(amount: number, currency: string) {
    const factor = 10 ** currencyDecimals(currency);
    return Math.round((Number.isFinite(amount) ? amount : 0) * factor) / factor;
}

export function resolveFxContext({
    sourceCurrency,
    outputCurrency,
    hotelCurrency,
    rates,
}: {
    sourceCurrency: string;
    outputCurrency: string;
    hotelCurrency?: string | null;
    rates: ExchangeRate[];
}): ContractPresentationFx {
    const source = normalizeCurrency(sourceCurrency);
    const target = normalizeCurrency(outputCurrency);
    const hotelBase = normalizeCurrency(hotelCurrency || source);
    const { ratePairs, rateDates } = buildExchangeRatePairs(rates, hotelBase);

    if (!source || !target || source === target) {
        return {
            sourceCurrency: source,
            outputCurrency: target || source,
            rate: 1,
            rateDate: new Date().toISOString().slice(0, 10),
            source: 'BASE_CURRENCY',
            valuesUsed: { [source]: 1 },
            isConvertible: true,
        };
    }

    const directConversion = resolveDirectConversionRate(source, target, ratePairs, rateDates);
    if (directConversion && Number.isFinite(directConversion.rate)) {
        return {
            sourceCurrency: source,
            outputCurrency: target,
            rate: directConversion.rate,
            rateDate: directConversion.rateDate,
            source: 'EXCHANGE_RATE_TABLE',
            valuesUsed: directConversion.valuesUsed,
            isConvertible: true,
        };
    }

    const sourceToBase = resolveDirectConversionRate(source, hotelBase, ratePairs, rateDates);
    const baseToTarget = resolveDirectConversionRate(hotelBase, target, ratePairs, rateDates);
    if (sourceToBase && baseToTarget) {
        const rate = sourceToBase.rate * baseToTarget.rate;
        return {
            sourceCurrency: source,
            outputCurrency: target,
            rate,
            rateDate: baseToTarget.rateDate,
            source: 'EXCHANGE_RATE_TABLE',
            valuesUsed: { ...sourceToBase.valuesUsed, ...baseToTarget.valuesUsed },
            isConvertible: Number.isFinite(rate),
        };
    }

    return {
        sourceCurrency: source,
        outputCurrency: target,
        rate: 1,
        rateDate: new Date().toISOString().slice(0, 10),
        source: 'EXCHANGE_RATE_TABLE',
        valuesUsed: {},
        isConvertible: false,
    };
}

export function convertMoneyValue(value: number | string | null | undefined, presentation: ContractPresentationContext) {
    const amount = Number(value ?? 0);
    if (!presentation.fx.isConvertible) return Number.isFinite(amount) ? amount : 0;
    return roundCurrency((Number.isFinite(amount) ? amount : 0) * presentation.fx.rate, presentation.outputCurrency);
}

const isFixedModifier = (type?: string | null) => Boolean(type && !['PERCENTAGE', 'FREE', 'FORMULA'].includes(type));

const convertPeriodOverrides = <T extends { overrideValue?: number | string | null }>(
    periods: T[] | undefined,
    shouldConvert: boolean,
    presentation: ContractPresentationContext,
) => periods?.map((period) => ({
    ...period,
    overrideValue: shouldConvert && period.overrideValue != null
        ? convertMoneyValue(period.overrideValue, presentation)
        : period.overrideValue,
})) ?? [];

export function convertContractPreviewData(
    data: ContractPreviewCommercialData,
    presentation: ContractPresentationContext,
): ContractPreviewCommercialData {
    const contract: Contract = {
        ...data.contract,
        currency: presentation.outputCurrency,
        depositAmount: data.contract.depositAmount != null
            ? convertMoneyValue(data.contract.depositAmount, presentation)
            : data.contract.depositAmount,
        paymentPolicy: data.contract.paymentPolicy
            ? {
                ...data.contract.paymentPolicy,
                deposit: data.contract.paymentPolicy.deposit?.type === 'AMOUNT'
                    ? {
                        ...data.contract.paymentPolicy.deposit,
                        value: convertMoneyValue(data.contract.paymentPolicy.deposit.value, presentation),
                        currency: presentation.outputCurrency,
                    }
                    : data.contract.paymentPolicy.deposit,
            }
            : data.contract.paymentPolicy,
    };

    return {
        contract,
        prices: data.prices.map((line) => ({
            ...line,
            prices: line.prices.map((price) => ({
                ...price,
                amount: convertMoneyValue(price.amount, presentation),
            })),
        })),
        supplements: data.supplements.map((supplement) => {
            const shouldConvert = isFixedModifier(supplement.type);
            return {
                ...supplement,
                value: shouldConvert ? convertMoneyValue(supplement.value, presentation) : supplement.value,
                applicablePeriods: convertPeriodOverrides(supplement.applicablePeriods, shouldConvert, presentation),
            };
        }),
        reductions: data.reductions.map((reduction) => {
            const shouldConvert = isFixedModifier(reduction.calculationType);
            return {
                ...reduction,
                value: shouldConvert ? convertMoneyValue(reduction.value, presentation) : reduction.value,
                applicablePeriods: convertPeriodOverrides(reduction.applicablePeriods, shouldConvert, presentation),
            };
        }),
        earlyBookings: data.earlyBookings.map((offer) => {
            const shouldConvert = isFixedModifier(offer.calculationType);
            return {
                ...offer,
                value: shouldConvert ? convertMoneyValue(offer.value, presentation) : offer.value,
                applicablePeriods: convertPeriodOverrides(offer.applicablePeriods, shouldConvert, presentation),
            };
        }),
        spos: data.spos.map((spo) => {
            const shouldConvert = spo.benefitType === 'FIXED_DISCOUNT';
            return {
                ...spo,
                value: shouldConvert ? convertMoneyValue(spo.value, presentation) : spo.value,
                benefitValue: shouldConvert ? convertMoneyValue(spo.benefitValue, presentation) : spo.benefitValue,
                applicablePeriods: convertPeriodOverrides(spo.applicablePeriods, shouldConvert, presentation),
            };
        }),
        cancellations: data.cancellations.map((rule) => {
            const shouldConvert = rule.penaltyType === 'FIXED_AMOUNT';
            return {
                ...rule,
                baseValue: shouldConvert ? convertMoneyValue(rule.baseValue, presentation) : rule.baseValue,
                applicablePeriods: convertPeriodOverrides(rule.applicablePeriods, shouldConvert, presentation),
            };
        }),
    };
}

export function conversionNote(presentation: ContractPresentationContext) {
    if (presentation.sourceCurrency === presentation.outputCurrency) return null;
    if (!presentation.fx.isConvertible) return null;
    return {
        en: `Converted from ${presentation.sourceCurrency} using rate 1 ${presentation.sourceCurrency} = ${presentation.fx.rate.toFixed(6)} ${presentation.outputCurrency} on ${presentation.fx.rateDate}`,
        fr: `Converti depuis ${presentation.sourceCurrency} au taux de 1 ${presentation.sourceCurrency} = ${presentation.fx.rate.toFixed(6)} ${presentation.outputCurrency} le ${presentation.fx.rateDate}`,
    }[presentation.language];
}

export function translatedName<T extends Record<string, unknown>>(value: T | null | undefined, fallback: string, language: ContractPreviewLanguage) {
    if (!value) return fallback;
    const translations = value.translations as Record<string, string> | undefined;
    const nameTranslations = value.nameTranslations as Record<string, string> | undefined;
    const localizedName = value[`name_${language}`] ?? value[`name${language.toUpperCase()}`];

    if (typeof localizedName === 'string' && localizedName.trim()) return localizedName;
    if (translations?.[language]) return translations[language];
    if (nameTranslations?.[language]) return nameTranslations[language];
    if (typeof value.name === 'string' && value.name.trim()) return value.name;
    if (typeof value.code === 'string' && value.code.trim()) return value.code;
    return fallback;
}

export function paymentMethodLabel(value?: string | null, language: ContractPreviewLanguage = 'en') {
    const labels = {
        en: {
            BANK_TRANSFER: 'Bank transfer',
            SWIFT_TRANSFER: 'SWIFT transfer',
            BANK_CHECK: 'Bank check',
            BANK_DRAFT: 'Banker / bank draft',
            CASH: 'Cash',
            CREDIT_CARD: 'Credit card',
            PAYMENT_GATEWAY: 'Payment gateway',
            OTHER: 'Other',
        },
        fr: {
            BANK_TRANSFER: 'Virement bancaire local',
            SWIFT_TRANSFER: 'Virement SWIFT',
            BANK_CHECK: 'Cheque bancaire',
            BANK_DRAFT: 'Cheque de banque / banker',
            CASH: 'Especes',
            CREDIT_CARD: 'Carte bancaire',
            PAYMENT_GATEWAY: 'Plateforme de paiement',
            OTHER: 'Autre',
        },
    } as const;
    if (!value) return language === 'fr' ? 'Selon accord' : 'As agreed';
    return labels[language][value as keyof typeof labels.en] ?? value.toLowerCase().replace(/_/g, ' ');
}

export function paymentConditionLabel(value?: string | null, language: ContractPreviewLanguage = 'en') {
    if (!value) return language === 'fr' ? 'Conditions de paiement a confirmer par les parties.' : 'Payment terms to be confirmed by the parties.';
    if (value === 'PREPAYMENT_100' || value === 'FULL_PREPAYMENT') return language === 'fr' ? '100% prepaiement' : '100% prepayment';
    if (value === 'DEPOSIT' || value === 'PARTIAL_DEPOSIT') return language === 'fr' ? 'Acompte partiel' : 'Partial deposit';
    if (value === 'CREDIT_DAYS_FROM_INVOICE') return language === 'fr' ? 'Credit depuis emission de facture' : 'Credit from invoice issue';
    if (value === 'PAYMENT_ON_ARRIVAL') return language === 'fr' ? "Paiement a l'arrivee" : 'Payment on arrival';
    if (value === 'PAYMENT_ON_DEPARTURE') return language === 'fr' ? 'Paiement au depart' : 'Payment on departure';
    if (value === 'CUSTOM') return language === 'fr' ? 'Condition specifique' : 'Custom condition';
    return value.toLowerCase().replace(/_/g, ' ');
}

function paymentBasisLabel(value?: string, language: ContractPreviewLanguage = 'en') {
    const labels = {
        INVOICE_ISSUE: language === 'fr' ? 'emission de facture' : 'invoice issue',
        INVOICE_RECEIPT: language === 'fr' ? 'reception de facture' : 'invoice receipt',
        CHECK_OUT: language === 'fr' ? 'depart client' : 'check-out',
    };
    return value ? labels[value as keyof typeof labels] ?? value.toLowerCase().replace(/_/g, ' ') : labels.INVOICE_ISSUE;
}

function dueTriggerLabel(value?: string, language: ContractPreviewLanguage = 'en') {
    const labels = {
        BOOKING_CONFIRMATION: language === 'fr' ? 'a la confirmation de reservation' : 'at booking confirmation',
        BEFORE_CHECK_IN: language === 'fr' ? 'avant check-in' : 'before check-in',
        INVOICE_ISSUE: language === 'fr' ? 'a emission de facture' : 'at invoice issue',
        CUSTOM: language === 'fr' ? 'selon condition specifique' : 'by custom condition',
    };
    return value ? labels[value as keyof typeof labels] ?? value.toLowerCase().replace(/_/g, ' ') : '';
}

export function buildPaymentPolicyItems(contract: Contract, hotel: Hotel | null, language: ContractPreviewLanguage) {
    const isFr = language === 'fr';
    const policy = contract.paymentPolicy;
    const methods = policy?.methods?.map((method) => method.type) ?? contract.paymentMethods ?? [];
    const conditions = policy?.conditions ?? [];
    const bankAccount = hotel?.bankAccounts?.find((account) => account.id === (policy?.selectedHotelBankAccountId ?? contract.selectedHotelBankAccountId));
    const bankName = bankAccount?.bankName ?? hotel?.bankName;
    const accountNumber = bankAccount?.accountNumber ?? hotel?.accountNumber;
    const rib = bankAccount?.rib ?? accountNumber;
    const iban = bankAccount?.iban ?? hotel?.ibanCode;
    const swiftCode = bankAccount?.swiftCode ?? hotel?.swiftCode;

    const conditionLines = conditions.length > 0
        ? conditions.map((condition) => {
            if (condition.type === 'FULL_PREPAYMENT' || condition.type === 'PREPAYMENT_100') return paymentConditionLabel(condition.type, language);
            if (condition.type === 'PARTIAL_DEPOSIT' || condition.type === 'DEPOSIT') {
                const deposit = policy?.deposit;
                if (!deposit) return paymentConditionLabel(condition.type, language);
                const value = deposit.type === 'PERCENTAGE'
                    ? `${deposit.value}%`
                    : `${new Intl.NumberFormat('fr-FR').format(Number(deposit.value ?? 0))} ${deposit.currency ?? contract.currency}`;
                return [
                    isFr ? `Acompte: ${value}` : `Deposit: ${value}`,
                    deposit.refundable ? (isFr ? 'remboursable' : 'refundable') : (isFr ? 'non remboursable' : 'non-refundable'),
                    deposit.dueTrigger ? `${isFr ? 'du' : 'due'} ${dueTriggerLabel(deposit.dueTrigger, language)}` : null,
                ].filter(Boolean).join(', ');
            }
            if (condition.type === 'CREDIT_DAYS_FROM_INVOICE') {
                return isFr
                    ? `${condition.days ?? 0} jours de credit depuis ${paymentBasisLabel(condition.basis, language)}`
                    : `${condition.days ?? 0} days credit from ${paymentBasisLabel(condition.basis, language)}`;
            }
            if (condition.type === 'CUSTOM') return condition.label || condition.notes || paymentConditionLabel(condition.type, language);
            return paymentConditionLabel(condition.type, language);
        })
        : [
            contract.paymentCondition
                ? paymentConditionLabel(contract.paymentCondition, language)
                : (isFr ? 'Conditions de paiement a confirmer par les parties.' : 'Payment terms to be confirmed by the parties.'),
        ];

    return [
        methods.length ? `${isFr ? 'Methodes de paiement' : 'Payment methods'}: ${methods.map((method) => paymentMethodLabel(method, language)).join(', ')}.` : null,
        `${isFr ? 'Conditions de paiement' : 'Payment conditions'}: ${conditionLines.join(' / ')}.`,
        bankName ? `${isFr ? 'Banque' : 'Bank'}: ${bankName}.` : null,
        rib ? `${isFr ? 'Compte / RIB' : 'Account / RIB'}: ${rib}.` : null,
        iban ? `IBAN: ${iban}.` : null,
        swiftCode ? `SWIFT/BIC: ${swiftCode}.` : null,
        bankAccount?.currency ? `${isFr ? 'Devise bancaire' : 'Bank currency'}: ${bankAccount.currency}.` : null,
    ].filter(Boolean);
}
