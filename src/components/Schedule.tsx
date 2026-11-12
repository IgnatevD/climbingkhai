import { useI18n } from '../i18n'
import { SITE } from '../content/site'
import './Schedule.css'

const DAYS = ['tue', 'thu', 'sat'] as const
const START = 10 // 10:00
const END = 20 // 20:00
const toHours = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h + m / 60 }

/** Тижневий розклад у вигляді шкали часу — як топо-схема маршруту. */
export function Schedule() {
  const { t } = useI18n()
  const groups = [
    { key: 'adults' as const, label: t.training.adults, slots: SITE.schedule.adults },
    { key: 'kids' as const, label: t.training.kids, slots: SITE.schedule.kids },
  ]

  return (
    <div className="schedule">
      <div className="schedule__legend">
        {groups.map((g) => <span key={g.key} className={`schedule__key schedule__key--${g.key}`}>{g.label}</span>)}
      </div>

      <div className="schedule__grid">
        <div className="schedule__hours" aria-hidden="true">
          {Array.from({ length: (END - START) / 2 + 1 }, (_, i) => START + i * 2).map((h) => (
            <span key={h} style={{ '--pos': (h - START) / (END - START) } as React.CSSProperties}>{h}:00</span>
          ))}
        </div>

        {DAYS.map((day) => (
          <div key={day} className="schedule__day">
            <div className="schedule__dayname">
              <span className="schedule__short">{t.training.days[day]}</span>
              <span className="schedule__long">{t.training.daysLong[day]}</span>
            </div>
            <div className="schedule__lane" aria-hidden="true">
              {groups.map((g) =>
                g.slots.filter((s) => s.day === day).map((s) => {
                  const [from, to] = s.time.split('–')
                  const a = (toHours(from) - START) / (END - START)
                  const b = (toHours(to) - START) / (END - START)
                  return (
                    <div
                      key={g.key}
                      className={`schedule__slot schedule__slot--${g.key}`}
                      style={{ '--a': a, '--b': b } as React.CSSProperties}
                      title={`${g.label}: ${s.time}`}
                    >
                      <b>{g.label}</b>
                      <span>{s.time}</span>
                    </div>
                  )
                }),
              )}
            </div>
            <p className="schedule__text">
              {groups.map((g) => g.slots.filter((s) => s.day === day).map((s) => (
                <span key={g.key} className={`schedule__key schedule__key--${g.key}`}>{g.label}: <b>{s.time}</b></span>
              )))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
