# Climbing KhAI — сайт Клубу скелелазіння та альпінізму ХАІ

Сучасна версія сайту [climbing.kharkov.ua](https://www.climbing.kharkov.ua): дві мови (UA / EN), світла й темна теми, mobile-first, анімації на тему скелелазіння, стрічка Instagram.

**Стек:** React 19 + TypeScript + Vite, React Router (кожна сторінка вантажиться окремо), Netlify Functions + Netlify Blobs для Instagram. Без важких UI-бібліотек: анімації на CSS та IntersectionObserver.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # збірка в dist/
npm run preview    # перегляд збірки
```

Стрічка Instagram локально працює лише через Netlify CLI: `npx netlify dev`.

## Структура

```
src/
  main.tsx              точка входу
  router.tsx            маршрути (/... — українська, /en/... — англійська)
  i18n/                 переклади: uk.ts (еталон) і en.ts
  content/              дані: site.ts (контакти, розклад), events.ts (події), gallery.ts (альбоми)
  components/           шапка, футер, висотомір, стіна, Instagram, розклад, лайтбокс…
  pages/                сторінки: Home, About, Training, Promalp, Events, EventPage, Gallery, Contacts, NotFound
  hooks/                тема, поява при прокрутці, лічильники, мета-теги
  styles/               tokens.css (усі кольори й розміри), base.css
netlify/functions/      instagram.mts (стрічка), instagram-refresh.mts (продовження токена)
scripts/sync-media.mjs  завантаження фото зі старого сайту
```

## Як змінювати контент

| Що | Де |
|---|---|
| Тексти сторінок | `src/i18n/uk.ts` і `src/i18n/en.ts` (ключі мають збігатися — TypeScript підкаже) |
| Телефон, email, розклад | `src/content/site.ts` |
| Нова подія | додати об'єкт у `src/content/events.ts` — з'явиться на головній, у стрічці й отримає свою сторінку |
| Альбом галереї | `src/content/gallery.ts` |
| Кольори, шрифти, відступи | `src/styles/tokens.css` |

Нова сторінка: створіть `src/pages/Name.tsx`, додайте рядок у `src/router.tsx`, пункт меню — у `NAV` в `Header.tsx` і тексти в обидва файли перекладів.

## Фото зі старого сайту

За замовчуванням фото беруться прямо з climbing.kharkov.ua. Щоб зберегти їх у проєкті:

```bash
npm run media:sync              # завантажить ~220 фото в public/legacy
echo "VITE_MEDIA_BASE=/legacy" > .env
```

## Instagram

Функція `/api/instagram` бере останні пости через офіційний Instagram API (Instagram API with Instagram Login) і кешує їх на 30 хв. Поки токена немає, сайт показує блок «Стежте за нами в Instagram».

1. Акаунт @climbing.kharkov.ua має бути **професійним** (Business або Creator) — перемикається в налаштуваннях Instagram.
2. На [developers.facebook.com](https://developers.facebook.com) створіть застосунок, додайте продукт **Instagram** → *API setup with Instagram login*, підключіть акаунт і згенеруйте **access token** (довгостроковий, 60 днів).
3. У Netlify: Project configuration → Environment variables → `IG_ACCESS_TOKEN` = токен. Зробіть повторний деплой.
4. Далі функція `instagram-refresh` сама продовжує токен щотижня — оновлювати вручну не потрібно.

## Деплой на Netlify

Add new project → Import from GitHub → `climbingkhai`. Налаштування збірки беруться з `netlify.toml` (команда `npm run build`, папка `dist`).
