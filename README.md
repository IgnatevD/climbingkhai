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

## Облік занять для тренерів — `/admin`

Сторінка `/admin` (не індексується пошуковиками): вхід за логіном і паролем, далі чотири вкладки:

- **Заняття** — дата підставляється автоматично (сьогодні або найближче заняття за розкладом), стрілки ‹ › перескакують між днями занять, перемикач «Дорослі / Діти». Тап по імені — присутній. Оплата підставляється сама: є чинний абонемент — списується заняття, немає — разовий тариф (суму можна змінити). Новий відвідувач — просто введіть ім'я в пошук і натисніть Enter. Зберігається автоматично.
- **Учасники** — таблиця з пошуком і фільтрами, додати / змінити / видалити, оформити або виправити абонемент. Абонементи, що закінчуються (≤1 заняття або ≤3 дні), підсвічуються жовтим, прострочені — червоним.
- **Звіт** — будь-який період (швидкі кнопки: цей / минулий місяць, 7 днів, 3 місяці), таблиця «учасник × заняття», підсумки та гроші, кнопка «Завантажити (Excel)» (CSV, відкривається в Excel / Google Таблицях) і «Друк».
- **Налаштування** — дні занять (типово Вт, Чт, Сб), час груп, ціна разового заняття та абонемента, резервна копія всіх даних.

### Налаштування доступу (один раз)

Netlify → Site configuration → Environment variables → додати:

| Змінна | Значення |
|---|---|
| `ADMIN_LOGIN` | логін, напр. `coach` |
| `ADMIN_PASSWORD` | надійний пароль (12+ символів) |
| `ADMIN_SECRET` | *(необов'язково)* будь-який довгий випадковий рядок |

Кілька тренерів — замість двох перших змінних одна: `ADMIN_USERS` = `anna:пароль1;oleg:пароль2`.
Після додавання змінних — **Deploys → Trigger deploy**. Зміна пароля автоматично розлогінює всі пристрої.

### Локально

`npm run dev` → http://localhost:5173/admin, вхід **admin / admin** (або свої `ADMIN_LOGIN` / `ADMIN_PASSWORD` у файлі `.env.local`). Окремий сервер запускати не треба: функції працюють прямо у Vite, а локальні дані лежать у `.netlify/dev-blobs/` (не потрапляють у git і не пов'язані з даними на сайті).

Дані зберігаються в Netlify Blobs (сховище `club`) — окрема база не потрібна. Після 8 невдалих спроб входу з однієї адреси вхід блокується на 15 хвилин.
