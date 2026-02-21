import { create } from 'zustand';
import { TabType } from '../components/BottomNav';

interface DashboardState {
    activeTab: TabType;
    modals: {
        filter: boolean;
        premium: boolean;
    };
    setActiveTab: (tab: TabType) => void;
    toggleModal: (modal: 'filter' | 'premium') => void;
    closeAllModals: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    activeTab: 'discover',
    modals: {
        filter: false,
        premium: false,
    },
    setActiveTab: (tab) => set({ activeTab: tab }),
    toggleModal: (modal) => set((state) => ({
        modals: {
            ...state.modals,
            [modal]: !state.modals[modal]
        }
    })),
    closeAllModals: () => set({ modals: { filter: false, premium: false } }),
}));
