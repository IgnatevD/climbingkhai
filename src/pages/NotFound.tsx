import { Link } from 'react-router'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { Holds } from '../components/ui'
import './NotFound.css'

/** 404: скелелаз зірвався, але висить на мотузці. */
export default function NotFound() {
  const { t, to } = useI18n()
  usePageMeta(`404 — ${t.meta.short}`)
  return (
    <section className="nf wall-dots">
      <Holds count={9} seed={404} />
      <div className="container nf__inner">
        <svg className="nf__fall" viewBox="0 0 120 220" aria-hidden="true">
          <circle cx="60" cy="10" r="8" className="nf__anchor" />
          <g className="nf__swing">
            <path d="M60 10 V120" className="nf__rope" />
            <g transform="translate(60 150) rotate(180)">
              <circle cx="0" cy="-22" r="10" className="nf__head" />
              <path d="M0 -12 L0 14 M0 -4 L-16 -20 M0 -4 L16 -18 M0 14 L-14 34 M0 14 L14 32" className="nf__body" />
            </g>
          </g>
        </svg>
        <p className="nf__code">404</p>
        <h1 className="h2">{t.notFound.title}</h1>
        <p className="lead">{t.notFound.text}</p>
        <Link to={to('/')} className="btn btn--primary">{t.notFound.home} <span className="arrow">→</span></Link>
      </div>
    </section>
  )
}
