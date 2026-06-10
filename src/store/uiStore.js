import { create } from 'zustand'

export const useUiStore = create((set) => ({
  activeTab: 'matches',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))