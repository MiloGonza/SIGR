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
  // Evita que, al cerrar sesión, las rutas protegidas abran el modal de acceso
  // mientras la cortina todavía está en pantalla.
  loggingOut: false,
  finishLogout: () => set({ loggingOut: false }),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, isOpen: false, loggingOut: true })
  },

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  darkMode: false,
  setDarkMode: (val) => set({ darkMode: val }),
  
  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  triggerCurtain: false,
  setTriggerCurtain: (val) => set({ triggerCurtain: val }),

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
  isOpen: false,
  // Un clic manual para abrir el modal cancela el estado de cierre de sesión.
  setIsOpen: (val) => set((state) => ({
    isOpen: val,
    loggingOut: val ? false : state.loggingOut,
  })),
  mode: 'login',
  setMode: (val) => set({ mode: val }),

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*

  
}))

export default useStore
