import { create } from 'zustand';

interface ContractWizardState {
    currentStep: number;
    contractData: Record<string, any>;
    periods: any[];
    rooms: any[];
    
    // Actions
    setStep: (step: number) => void;
    updateContractData: (data: Partial<Record<string, any>>) => void;
    addPeriod: (period: any) => void;
    resetWizard: () => void;
}

const initialState = {
    currentStep: 1,
    contractData: {},
    periods: [],
    rooms: [],
};

export const useContractWizardStore = create<ContractWizardState>((set) => ({
    ...initialState,
    
    setStep: (step) => set({ currentStep: step }),
    
    updateContractData: (data) => set((state) => ({ 
        contractData: { ...state.contractData, ...data } 
    })),
    
    addPeriod: (period) => set((state) => ({ 
        periods: [...state.periods, period] 
    })),
    
    resetWizard: () => set(initialState),
}));
