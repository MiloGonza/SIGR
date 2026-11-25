import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Se guardan los IDs ya vistos por usuario para que el contador de la barra
// lateral sobreviva a recargas sin necesidad de agregar estado al backend.
const MAX_SEEN_IDS = 200

const keyFor = (userId) => String(userId)

const useNotificationStore = create(
  persist(
    (set, get) => ({
      seenIdsByUser: {},
      unreadByUser: {},

      setUnread: (userId, count) => {
        if (!userId) return
        const key = keyFor(userId)
        const next = Math.max(0, Number(count) || 0)
        if ((get().unreadByUser[key] ?? 0) === next) return
        set((state) => ({
          unreadByUser: { ...state.unreadByUser, [key]: next },
        }))
      },

      markAllSeen: (userId, ids = []) => {
        if (!userId) return
        const key = keyFor(userId)
        const current = get().seenIdsByUser[key] ?? []
        const merged = Array.from(
          new Set([...current, ...ids.map(String)]),
        ).slice(-MAX_SEEN_IDS)
        set((state) => ({
          seenIdsByUser: { ...state.seenIdsByUser, [key]: merged },
          unreadByUser: { ...state.unreadByUser, [key]: 0 },
        }))
      },
    }),
    {
      name: 'sigr-notification-state',
      partialize: (state) => ({
        seenIdsByUser: state.seenIdsByUser,
        unreadByUser: state.unreadByUser,
      }),
    },
  ),
)

export default useNotificationStore
