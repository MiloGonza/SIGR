import { create } from 'zustand'

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
  darkMode: false,
  setDarkMode: (val) => set({ darkMode: val }),
  triggerCurtain: false,
  setTriggerCurtain: (val) => set({ triggerCurtain: val }),
}))

export default useStore
