import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { ALBUMS, albumSource, photoPath } from '../content/gallery'
import { PageHero, Photo } from '../components/ui'
import { Lightbox } from '../components/Lightbox'
import { InstagramFeed } from '../components/InstagramFeed'
import { IconExternal } from '../components/Icons'
import './pages.css'
import './Gallery.css'

export default function Gallery() {
  const { t, pick } = useI18n()
  usePageMeta(`${t.nav.gallery} — ${t.meta.short}`, t.gallery.lead)
  const years = useMemo(() => [...new Set(ALBUMS.map((a) => a.year))], [])
  const [year, setYear] = useState<number | null>(null)
  const [open, setOpen] = useState<{ album: string; index: number } | null>(null)

  const albums = year ? ALBUMS.filter((a) => a.year === year) : ALBUMS
  const current = open ? ALBUMS.find((a) => a.id === open.album) : undefined

  return (
    <>
      <PageHero grade={t.gallery.grade} gradeValue="📷" title={t.gallery.title} lead={t.gallery.lead}>
        <div className="chips" role="group" aria-label={t.gallery.grade} data-reveal>
          <button type="button" className="chip" aria-pressed={year === null} onClick={() => setYear(null)}>{t.gallery.all}</button>
          {years.map((y) => <button key={y} type="button" className="chip" aria-pressed={year === y} onClick={() => setYear(y)}>{y}</button>)}
        </div>
      </PageHero>

      <InstagramFeed limit={8} />

      <section className="section">
        <div className="container albums">
          {albums.map((a, ai) => (
            <article key={a.id} className="album card" data-reveal style={{ '--delay': `${(ai % 2) * 90}ms` } as React.CSSProperties}>
              <header className="album__head">
                <div>
                  <span className="album__year">{a.year}</span>
                  <h2 className="h3">{pick(a.title)}</h2>
                </div>
                <span className="album__count">{a.total} {t.gallery.photos}</span>
              </header>
              <ul role="list" className="album__grid">
                {a.files.slice(0, 6).map((f, i) => (
                  <li key={f}>
                    <button type="button" className="album__thumb" onClick={() => setOpen({ album: a.id, index: i })} aria-label={`${t.gallery.open}: ${pick(a.title)}, ${i + 1}`}>
                      <Photo src={photoPath(a, f)} alt="" />
                    </button>
                  </li>
                ))}
              </ul>
              <a href={albumSource(a.id)} target="_blank" rel="noopener" className="album__more">{t.gallery.fullAlbum} <IconExternal width={14} height={14} /></a>
            </article>
          ))}
        </div>
      </section>

      {current && open && (
        <Lightbox
          title={pick(current.title)}
          photos={current.files.map((f) => photoPath(current, f))}
          index={open.index}
          onIndex={(index) => setOpen({ album: current.id, index })}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}
