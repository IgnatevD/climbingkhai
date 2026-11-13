import { createContext, useContext } from 'react'
import type { Member, Settings } from './model'

export type AdminCtx = {
  user: string
  members: Member[]
  settings: Settings
  /** Додати або оновити учасників у локальному стані (після відповіді сервера) */
  mergeMembers: (list: Member[]) => void
  removeMember: (id: string) => void
  setSettings: (s: Settings) => void
  notify: (text: string, error?: boolean) => void
}

export const Ctx = createContext<AdminCtx | null>(null)
export const useAdmin = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAdmin outside provider')
  return c
}
