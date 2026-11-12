/** Контакти та спільні дані клубу — змінюються в одному місці. */
export const SITE = {
  phone: '+380680505597',
  phoneDisplay: '+38 068 050 55 97',
  email: 'coach@climbing.kharkov.ua',
  instagram: 'https://www.instagram.com/climbing.kharkov.ua/',
  instagramHandle: '@climbing.kharkov.ua',
  oldSite: 'https://www.climbing.kharkov.ua',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=%D0%9B%D0%B5%D0%B3%D0%BA%D0%BE%D0%B0%D1%82%D0%BB%D0%B5%D1%82%D0%B8%D1%87%D0%BD%D0%B8%D0%B9+%D0%BC%D0%B0%D0%BD%D0%B5%D0%B6+%D0%A5%D0%90%D0%86+%D0%A5%D0%B0%D1%80%D0%BA%D1%96%D0%B2',
  /** Карта завантажується лише після натискання кнопки (без зайвих запитів і cookies до кліку). */
  mapEmbed: 'https://maps.google.com/maps?q=%D0%9B%D0%B5%D0%B3%D0%BA%D0%BE%D0%B0%D1%82%D0%BB%D0%B5%D1%82%D0%B8%D1%87%D0%BD%D0%B8%D0%B9+%D0%BC%D0%B0%D0%BD%D0%B5%D0%B6+%D0%A5%D0%90%D0%86+%D0%A5%D0%B0%D1%80%D0%BA%D1%96%D0%B2&z=15&output=embed',
  promalp: {
    phones: [
      { href: '+380990661751', display: '+38 099 066 17 51' },
      { href: '+380932043434', display: '+38 093 204 34 34' },
    ],
    email: 'utc.alpindustry@gmail.com',
    site: 'https://utc-alpindustry.org',
  },
  schedule: {
    adults: [
      { day: 'tue', time: '17:00–20:00' },
      { day: 'thu', time: '17:00–20:00' },
      { day: 'sat', time: '12:00–15:00' },
    ],
    kids: [
      { day: 'tue', time: '17:00–18:30' },
      { day: 'thu', time: '17:00–18:30' },
      { day: 'sat', time: '10:30–12:00' },
    ],
  },
} as const

/**
 * Фото зі старого сайту. За замовчуванням беруться з climbing.kharkov.ua.
 * Щоб зберігати їх у проєкті: `npm run media:sync`, потім у .env — VITE_MEDIA_BASE=/legacy
 */
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE as string | undefined) ?? SITE.oldSite

export const media = (path: string) => `${MEDIA_BASE}${encodeURI(path)}`

export const IMAGES = {
  wall: '/images/forcontent/stend_small.jpg',
  mentor: '/images/igor1.jpg',
  newYear: '/images/ng_xai.jpg',
  promalp: [
    '/images/promalp/01.jpg',
    '/images/stories/prom_alp1.jpg',
    '/images/promalp/03.jpg',
    '/images/stories/prom_alp3.jpg',
    '/images/promalp/dsc_0045.jpg',
    '/images/stories/prom_alp2.jpg',
  ],
} as const
