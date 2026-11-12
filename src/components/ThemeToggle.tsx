import { useTheme } from '../hooks'
import { useI18n } from '../i18n'
import './ThemeToggle.css'

/** Перемикач «день / ніч»: сонце й місяць над гірським хребтом. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { t } = useI18n()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      data-mode={theme}
      aria-label={dark ? t.nav.toLight : t.nav.toDark}
      title={dark ? t.theme.light : t.theme.dark}
      onClick={(e) => toggle({ x: e.clientX, y: e.clientY })}
    >
      <svg viewBox="0 0 64 32" aria-hidden="true">
        <defs>
          <clipPath id="tt-clip"><rect width="64" height="32" rx="16" /></clipPath>
        </defs>
        <g clipPath="url(#tt-clip)">
          <rect className="tt-sky" width="64" height="32" />
          <g className="tt-stars">
            <circle cx="12" cy="8" r="1" /><circle cx="22" cy="5" r="0.8" /><circle cx="8" cy="15" r="0.7" /><circle cx="27" cy="11" r="0.9" />
          </g>
          <g className="tt-orb">
            <circle className="tt-sun" cx="0" cy="0" r="7" />
            <circle className="tt-moon-cut" cx="4" cy="-3" r="6" />
          </g>
          <path className="tt-far" d="M0 32 L12 19 L19 25 L30 13 L42 24 L50 18 L64 30 V32Z" />
          <path className="tt-near" d="M0 32 L8 26 L16 30 L26 22 L36 30 L48 24 L64 32Z" />
        </g>
      </svg>
    </button>
  )
}
