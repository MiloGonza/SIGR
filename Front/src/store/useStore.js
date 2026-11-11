import { create } from 'zustand'

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) ?? null
  } catch {
    return null
  }
}

const useStore = create((set) => ({

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  user: readStoredUser(),
  setUser: (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
    set({ user })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null })
  },

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
