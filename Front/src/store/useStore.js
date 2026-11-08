import { create } from 'zustand'

const useStore = create((set) => ({

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  darkMode: false,
  setDarkMode: (val) => set({ darkMode: val }),
  
  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  triggerCurtain: false,
  setTriggerCurtain: (val) => set({ triggerCurtain: val }),

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  isOpen: false,
  setIsOpen: (val) => set({ isOpen: val }),
  mode: 'login',
  setMode: (val) => set({ mode: val }),

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*

  
}))

export default useStore
