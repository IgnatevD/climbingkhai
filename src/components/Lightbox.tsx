import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n'
import { media } from '../content/site'
import { IconChevron, IconClose } from './Icons'
import './Lightbox.css'

type Props = { photos: string[]; index: number; title: string; onClose: () => void; onIndex: (i: number) => void }

/** Перегляд фото на весь екран: стрілки, Esc, свайпи на телефоні. */
export function Lightbox({ photos, index, title, onClose, onIndex }: Props) {
  const { t } = useI18n()
  const closeRef = useRef<HTMLButtonElement>(null)
  const touch = useRef<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const go = (d: number) => { setLoaded(false); onIndex((index + d + photos.length) % photos.length) }

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = ''; prev?.focus() }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Попереднє завантаження сусідніх фото
  useEffect(() => {
    ;[1, -1].forEach((d) => { const img = new Image(); img.src = media(photos[(index + d + photos.length) % photos.length]) })
  }, [index, photos])

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        touch.current = null
      }}
    >
      <div className="lightbox__top">
        <span className="lightbox__title">{title} · {index + 1}/{photos.length}</span>
        <button ref={closeRef} type="button" className="lightbox__btn" onClick={onClose} aria-label={t.gallery.close}><IconClose /></button>
      </div>
      <figure className={`lightbox__figure${loaded ? ' is-loaded' : ''}`} key={index}>
        <img src={media(photos[index])} alt={`${title} — ${index + 1}`} onLoad={() => setLoaded(true)} />
      </figure>
      <button type="button" className="lightbox__btn lightbox__nav lightbox__nav--prev" onClick={() => go(-1)} aria-label={t.gallery.prev}><IconChevron dir="left" /></button>
      <button type="button" className="lightbox__btn lightbox__nav lightbox__nav--next" onClick={() => go(1)} aria-label={t.gallery.next}><IconChevron /></button>
    </div>,
    document.body,
  )
}
