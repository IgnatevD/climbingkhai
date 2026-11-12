import { Suspense } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { I18nProvider, useI18n } from '../i18n'
import { useRevealAll } from '../hooks'
import { Header } from './Header'
import { Footer } from './Footer'
import { Altimeter } from './Altimeter'
import { ChalkDust } from './ChalkDust'

function Shell() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  useRevealAll(pathname)

  return (
    <>
      <a href="#main" className="skip-link">{t.nav.skip}</a>
      <Header />
      <Altimeter />
      <main id="main">
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
          {/* key — щоб кожна сторінка з'являлася з анімацією */}
          <div key={pathname} className="page">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
      <ChalkDust />
      <ScrollRestoration />
    </>
  )
}

export function Layout() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}
