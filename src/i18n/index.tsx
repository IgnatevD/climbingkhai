import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { uk, type Dict } from './uk'
import { en } from './en'

export type Lang = 'uk' | 'en'
export const LANGS: Lang[] = ['uk', 'en']
const DICTS: Record<Lang, Dict> = { uk, en }

/** Мова визначається адресою: /en/... — англійська, решта — українська. */
export function langFromPath(pathname: string): Lang {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'uk'
}

/** Шлях без мовного префікса: /en/about → /about */
export function stripLang(pathname: string): string {
  const p = pathname.replace(/^\/en(?=\/|$)/, '')
  return p === '' ? '/' : p
}

/** Локалізований шлях: to('about') → /about або /en/about */
export function localize(lang: Lang, to: string): string {
  const clean = '/' + to.replace(/^\/+/, '')
  if (lang === 'uk') return clean
  return clean === '/' ? '/en' : `/en${clean}`
}

type I18n = { lang: Lang; t: Dict; to: (path: string) => string; pick: <T>(v: Record<Lang, T>) => T }
const I18nContext = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const lang = langFromPath(pathname)

  const value = useMemo<I18n>(
    () => ({
      lang,
      t: DICTS[lang],
      to: (path: string) => localize(lang, path),
      pick: (v) => v[lang],
    }),
    [lang],
  )

  useEffect(() => {
    document.documentElement.lang = lang
    // hreflang-посилання для пошукових систем: та сама сторінка іншою мовою
    const base = stripLang(pathname)
    LANGS.forEach((l) => {
      let link = document.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${l}"]`)
      if (!link) {
        link = document.createElement('link')
        link.rel = 'alternate'
        link.hreflang = l
        document.head.append(link)
      }
      link.href = location.origin + localize(l, base)
    })
  }, [lang, pathname])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
