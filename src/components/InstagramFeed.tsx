import { useInstagram } from '../hooks/useInstagram'
import { useI18n } from '../i18n'
import { SITE } from '../content/site'
import { Grade, Holds } from './ui'
import { IconInstagram, IconExternal } from './Icons'
import './InstagramFeed.css'

/**
 * Стрічка Instagram. Дані — з серверної функції /api/instagram (Netlify),
 * яка звертається до Instagram API і кешує відповідь.
 */
export function InstagramFeed({ limit = 8 }: { limit?: number }) {
  const { t } = useI18n()
  const { ref, ...state } = useInstagram<HTMLElement>(limit)

  return (
    <section ref={ref} className="section ig" aria-labelledby="ig-title">
      <div className="container">
        <div className="ig__head">
          <div className="section-head">
            <div data-reveal><Grade value="IG">{t.instagram.grade}</Grade></div>
            <h2 id="ig-title" className="h2" data-reveal>{t.instagram.title}</h2>
            <p className="lead" data-reveal>{t.instagram.text}</p>
          </div>
          <a href={SITE.instagram} target="_blank" rel="noopener" className="btn btn--ghost ig__follow" data-reveal>
            <IconInstagram /> {t.instagram.follow} <span className="ig__handle">{SITE.instagramHandle}</span>
          </a>
        </div>

        {state.status === 'idle' && (
          <div className="ig__grid" aria-busy="true" aria-label={t.instagram.loading}>
            {Array.from({ length: limit }, (_, i) => <div key={i} className="ig__tile ig__tile--skeleton" />)}
          </div>
        )}

        {state.status === 'ready' && (
          <ul role="list" className="ig__grid">
            {state.posts.map((p, i) => (
              <li key={p.id} data-reveal="scale" style={{ '--delay': `${(i % 4) * 70}ms` } as React.CSSProperties}>
                <a href={p.permalink} target="_blank" rel="noopener" className="ig__tile" aria-label={`${t.instagram.open}: ${p.caption.slice(0, 80)}`}>
                  <img src={p.image} alt={p.caption.slice(0, 120)} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  {p.type !== 'IMAGE' && <span className="ig__badge">{p.type === 'VIDEO' ? '▶' : '❐'}</span>}
                  <span className="ig__caption">{p.caption}</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {state.status === 'off' && (
          <a href={SITE.instagram} target="_blank" rel="noopener" className="ig__fallback card" data-reveal>
            <Holds count={10} seed={7} />
            <span className="ig__fallback-icon"><IconInstagram width={34} height={34} /></span>
            <span className="ig__fallback-text">
              <b className="h3">{t.instagram.fallbackTitle}</b>
              <span className="muted">{t.instagram.fallbackText}</span>
              <span className="ig__fallback-link">{SITE.instagramHandle} <IconExternal width={16} height={16} /></span>
            </span>
          </a>
        )}
      </div>
    </section>
  )
}
