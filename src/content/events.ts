import type { Lang } from '../i18n'

export type EventCategory = 'course' | 'competition' | 'trip' | 'club' | 'promalp' | 'tips'
type L<T> = Record<Lang, T>
export type Block = { p: string } | { ul: string[] } | { rows: [string, string][] }

export type ClubEvent = {
  slug: string
  /** Дата початку (ISO). Для постійних курсів — відсутня. */
  date?: string
  dateEnd?: string
  /** Точна дата невідома — показуємо лише місяць і рік */
  approx?: boolean
  pinned?: boolean
  category: EventCategory
  image?: string
  /** Посилання на оригінал на старому сайті */
  source?: string
  title: L<string>
  summary: L<string>
  body: L<Block[]>
}

const OLD = 'https://www.climbing.kharkov.ua/index.php?option=com_content&view=article&id='
const STO = 'https://www.climbing.kharkov.ua/index.php?option=com_content&view=section&layout=blog&id=2&Itemid=4'

export const EVENTS: ClubEvent[] = [
  {
    slug: 'base-course',
    pinned: true,
    category: 'course',
    source: `${OLD}310`,
    title: { uk: 'Базовий курс скелелазіння', en: 'Beginner climbing course' },
    summary: {
      uk: '8 тренувань у групі на 5–8 людей: техніка, страховка й упевненість на висоті.',
      en: '8 sessions in a group of 5–8: technique, belaying and confidence at height.',
    },
    body: {
      uk: [
        { p: 'Курс для тих, хто вперше виходить на стіну або хоче вчитися системно.' },
        { ul: ['Лазити правильно, економно й високо', 'Справлятися зі страхом висоти', 'Страхувати, пристібатися й прив’язуватися', 'Готуватися до лазіння на скелях'] },
        { rows: [['Тренувань', '8'], ['Група', '5–8 осіб'], ['Розклад', '2 рази на тиждень по 1,5 год'], ['Вартість', '1750 грн']] },
        { p: 'Заняття стартують, щойно набирається група. Записатися можна за телефоном +38 068 050 55 97.' },
      ],
      en: [
        { p: 'A course for first-timers and anyone who wants to learn systematically.' },
        { ul: ['Climb correctly, efficiently and high', 'Handle the fear of heights', 'Belay, clip in and tie in', 'Prepare for climbing on rock'] },
        { rows: [['Sessions', '8'], ['Group', '5–8 people'], ['Schedule', 'twice a week, 1.5 h'], ['Price', '1750 UAH']] },
        { p: 'Sessions start as soon as a group is formed. Sign up by phone: +38 068 050 55 97.' },
      ],
    },
  },
  {
    slug: 'irata-2020',
    date: '2020-03-18',
    dateEnd: '2020-03-23',
    category: 'promalp',
    image: '/images/promalp/dsc_0045.jpg',
    source: `${OLD}425`,
    title: { uk: 'Навчання за програмою IRATA', en: 'IRATA rope access training' },
    summary: {
      uk: 'Курс для фахівців мотузкового доступу в навчальному центрі UTC Alpindustry.',
      en: 'A course for rope access technicians at the UTC Alpindustry training centre.',
    },
    body: {
      uk: [
        { p: 'У навчальному центрі UTC Alpindustry (Харків) заплановано навчання фахівців мотузкового доступу за міжнародною програмою IRATA.' },
        { p: 'Заявки до групи — на сайті utc-alpindustry.org, поштою utc.alpindustry@gmail.com або за телефоном +38 099 066 17 51.' },
      ],
      en: [
        { p: 'The UTC Alpindustry training centre in Kharkiv runs a course for rope access technicians under the international IRATA programme.' },
        { p: 'Apply at utc-alpindustry.org, by email at utc.alpindustry@gmail.com or by phone: +38 099 066 17 51.' },
      ],
    },
  },
  {
    slug: 'new-year-2018',
    date: '2018-12-23',
    category: 'club',
    image: '/images/ng_xai.jpg',
    source: `${OLD}424`,
    title: { uk: 'Скелелазний Новий рік', en: 'Climbers’ New Year party' },
    summary: {
      uk: 'Традиційне новорічне лазіння на стенді ХАІ — обов’язково в костюмах.',
      en: 'The traditional New Year climbing party at the KhAI wall — costumes required.',
    },
    body: {
      uk: [
        { p: 'Клуб святкує Новий рік так, як уміє, — на стіні. За старою традицією приходити треба в карнавальному костюмі.' },
        { rows: [['Юні скелелази', '12:30–14:30'], ['Дорослі', '14:30–17:30'], ['Вхід', '100 грн']] },
      ],
      en: [
        { p: 'The club celebrates New Year the way it knows best — on the wall. By old tradition, fancy dress is a must.' },
        { rows: [['Young climbers', '12:30–14:30'], ['Adults', '14:30–17:30'], ['Entry', '100 UAH']] },
      ],
    },
  },
  {
    slug: 'kharkiv-vertical-2018',
    date: '2018-04-29',
    dateEnd: '2018-04-30',
    category: 'competition',
    image: '/images/promalp/01.jpg',
    source: `${OLD}423`,
    title: { uk: 'Першість України верхолазів-висотників «Харківська Вертикаль»', en: '“Kharkiv Vertical” — Ukrainian open for work-at-height pros' },
    summary: {
      uk: 'Відкрита професійна першість на скеледромі «Вертикаль».',
      en: 'An open professional championship at the “Vertykal” climbing gym.',
    },
    body: {
      uk: [
        { p: 'Відкрита професійна першість України серед верхолазів-висотників пройшла на скеледромі «Вертикаль» у Харкові.' },
        { p: 'Інформація щодо участі: +38 099 066 17 51, +38 093 204 34 34, +38 050 364 20 68, utc.alpindustry@gmail.com.' },
      ],
      en: [
        { p: 'The open professional championship of Ukraine for work-at-height specialists was held at the “Vertykal” gym in Kharkiv.' },
        { p: 'Participation info: +38 099 066 17 51, +38 093 204 34 34, +38 050 364 20 68, utc.alpindustry@gmail.com.' },
      ],
    },
  },
  {
    slug: 'kharkiv-championship-2018',
    date: '2018-04-06',
    dateEnd: '2018-04-08',
    category: 'competition',
    source: `${OLD}422`,
    title: { uk: 'Чемпіонат Харкова зі скелелазіння', en: 'Kharkiv Climbing Championship' },
    summary: {
      uk: 'Трудність і швидкість на скеледромі ХАІ. Дати перенесено на 6–8 квітня.',
      en: 'Lead and speed at the KhAI wall. Moved to 6–8 April.',
    },
    body: {
      uk: [
        { p: 'Чемпіонат у дисциплінах «трудність» і «швидкість» пройшов на скеледромі ХАІ. Через технічні причини його перенесли з 18–20 на 6–8 квітня.' },
        { rows: [['6 квітня, 17:00', 'Мандатна комісія'], ['7 квітня, 9:00', 'Парад учасників'], ['7 квітня, 9:30', 'Кваліфікація, траса 1'], ['7 квітня, 11:30', 'Кваліфікація, траса 2'], ['7 квітня, 17:00', 'Фінал трудності'], ['8 квітня, 9:00', 'Швидкість (класика)']] },
        { p: 'Нагородження — після завершення кожного виду.' },
      ],
      en: [
        { p: 'The championship in lead and speed climbing took place at the KhAI wall. For technical reasons it was moved from 18–20 to 6–8 April.' },
        { rows: [['6 April, 17:00', 'Registration committee'], ['7 April, 9:00', 'Athletes’ parade'], ['7 April, 9:30', 'Qualification, route 1'], ['7 April, 11:30', 'Qualification, route 2'], ['7 April, 17:00', 'Lead final'], ['8 April, 9:00', 'Speed (classic)']] },
        { p: 'Medals were awarded after each discipline.' },
      ],
    },
  },
  {
    slug: 'kharkiv-vertical-2017',
    date: '2017-04-28',
    dateEnd: '2017-04-29',
    category: 'competition',
    image: '/images/promalp/03.jpg',
    source: `${OLD}421`,
    title: { uk: '«Харківська Вертикаль» 2017', en: '“Kharkiv Vertical” 2017' },
    summary: {
      uk: 'Професійна першість верхолазів-висотників на скеледромі «Вертикаль».',
      en: 'Professional work-at-height championship at the “Vertykal” gym.',
    },
    body: {
      uk: [
        { p: 'Змагання пройшли на скеледромі «Вертикаль» (просп. Петра Григоренка, 2). Організатори — навчальний центр UTC Alpindustry та партнери, суддівська колегія — під керівництвом А. І. Гриценка.' },
      ],
      en: [
        { p: 'The event took place at the “Vertykal” gym (2 Petra Hryhorenka Ave). Organised by the UTC Alpindustry training centre and partners; the judging panel was led by A. Hrytsenko.' },
      ],
    },
  },
  {
    slug: 'five-keys-alpine-trip',
    date: '2016-10-17',
    category: 'tips',
    source: `${OLD}420`,
    title: { uk: 'П’ять складових вдалого альпвиїзду', en: 'Five keys to a successful alpine trip' },
    summary: {
      uk: 'Поради новачкам, які збираються в перший виїзд, — на прикладі Судака-2016.',
      en: 'Advice for beginners heading on their first trip — based on Sudak 2016.',
    },
    body: {
      uk: [
        { p: 'Розбір того, що робить перший виїзд у гори вдалим: від підготовки на стенді до атмосфери в команді. Текст написано за підсумками альпвиїзду до Судака навесні 2016 року і буде найкориснішим для новачків.' },
        { p: 'Повний текст — на старому сайті клубу.' },
      ],
      en: [
        { p: 'A look at what makes a first mountain trip a success — from training at the wall to the team spirit. Written after the spring 2016 trip to Sudak and most useful for beginners.' },
        { p: 'The full text is on the club’s old website (in Russian).' },
      ],
    },
  },
  {
    slug: 'dovbush-rocks-2016',
    date: '2016-08-13',
    category: 'trip',
    source: `${OLD}419`,
    title: { uk: 'Поїздка на скелі Довбуша', en: 'Trip to Dovbush Rocks' },
    summary: {
      uk: 'Скельно-печерний комплекс з пісковику в Карпатах — звіт про виїзд.',
      en: 'A sandstone rock-and-cave complex in the Carpathians — a trip report.',
    },
    body: {
      uk: [
        { p: 'Скелі Довбуша — пам’ятка природи й історії на Івано-Франківщині, біля села Бубнище, у Поляницькому регіональному парку. Колись тут було море, з дна якого постали скелі з пісковику заввишки близько 80 метрів.' },
        { p: 'За даними археологів, тут було язичницьке капище, а згодом — монастир. Ідеальне місце, щоб поєднати лазіння з історією.' },
      ],
      en: [
        { p: 'Dovbush Rocks are a natural and historical landmark in Ivano-Frankivsk region, near the village of Bubnyshche in the Polianytskyi regional park. Millions of years ago this was a seabed, and the sandstone rocks rising from it are about 80 metres tall.' },
        { p: 'Archaeologists say there was a pagan sanctuary here and later a monastery — a perfect place to combine climbing with history.' },
      ],
    },
  },
  {
    slug: 'sudak-daria-2016',
    date: '2016-05-23',
    category: 'trip',
    source: `${OLD}418`,
    title: { uk: 'Альпвиїзд до Судака: звіт Дарії Гулякіної', en: 'Alpine trip to Sudak: Daria Huliakina’s report' },
    summary: {
      uk: 'Особисті враження учасниці про те, як робити те, що страшно.',
      en: 'A participant’s personal take on doing what scares you.',
    },
    body: {
      uk: [{ p: 'Емоційний звіт про весняний виїзд до Судака: про страх, сміливість і про те, чому варто робити те, що лякає. Повний текст — на старому сайті.' }],
      en: [{ p: 'An emotional report from the spring trip to Sudak — about fear, courage and why it’s worth doing what scares you. Full text on the old website.' }],
    },
  },
  {
    slug: 'sudak-2016',
    date: '2016-04-22',
    dateEnd: '2016-05-02',
    category: 'trip',
    source: `${OLD}417`,
    title: { uk: 'Альпвиїзд до Судака', en: 'Alpine trip to Sudak' },
    summary: {
      uk: 'Подорож починається задовго до потяга — звіт про весняний виїзд.',
      en: 'A journey starts long before the train — a spring trip report.',
    },
    body: {
      uk: [{ p: 'Звіт про виїзд до Судака: як змінюються тренування, коли попереду справжні скелі, і як минули десять днів у Криму. Повний текст — на старому сайті.' }],
      en: [{ p: 'A report on the trip to Sudak: how training changes when real rock is ahead, and how ten days in Crimea went. Full text on the old website.' }],
    },
  },
  {
    slug: 'pro-vertical-2016',
    date: '2016-04-28',
    dateEnd: '2016-04-30',
    category: 'competition',
    image: '/images/stories/prom_alp4.jpg',
    source: `${OLD}416`,
    title: { uk: 'Першість верхолазів-висотників Харкова', en: 'Kharkiv work-at-height championship' },
    summary: {
      uk: 'Командні змагання: транспортування вантажу й евакуація потерпілого на висоті.',
      en: 'Team event: load transport and casualty evacuation at height.',
    },
    body: {
      uk: [{ p: 'Відкрита професійна першість на скеледромі «Вертикаль» у вигляді «Транспортування вантажу та евакуація потерпілого при виконанні робіт на висоті». Змагання командні, по 3 учасники; організації могли заявляти кілька команд.' }],
      en: [{ p: 'An open professional championship at the “Vertykal” gym in “load transport and casualty evacuation during work at height”. Teams of three; organisations could enter several teams.' }],
    },
  },
  {
    slug: 'crimea-april-2016',
    date: '2016-04-15',
    dateEnd: '2016-04-24',
    category: 'trip',
    source: `${OLD}415`,
    title: { uk: 'Альпіністський Крим, Судак', en: 'Mountaineering in Crimea, Sudak' },
    summary: { uk: 'Весняний альпвиїзд клубу до Судака.', en: 'The club’s spring alpine trip to Sudak.' },
    body: {
      uk: [{ p: 'Набір на весняний виїзд до Судака. Щодо участі можна було звертатися до тренера Ігоря Єварницького.' }],
      en: [{ p: 'Sign-up for the spring trip to Sudak. Coach Ihor Yevarnytskyi handled participation.' }],
    },
  },
  {
    slug: 'new-year-2015',
    date: '2015-12-25',
    category: 'club',
    image: '/images/tmp/elka.jpg',
    source: `${OLD}414`,
    title: { uk: 'Новорічне лазіння та канікули', en: 'New Year climbing and holidays' },
    summary: { uk: 'Свято в костюмах і зимові канікули на стенді ХАІ.', en: 'A fancy-dress party and winter break at the KhAI wall.' },
    body: {
      uk: [
        { rows: [['Діти', '16:00'], ['Дорослі', '18:30'], ['Стартовий внесок', '80 грн']] },
        { p: 'Вхід — лише в новорічних костюмах. Канікули на стенді — з 28 грудня по 3 січня; з 4 січня тренування за звичайним розкладом.' },
      ],
      en: [
        { rows: [['Kids', '16:00'], ['Adults', '18:30'], ['Entry fee', '80 UAH']] },
        { p: 'Festive costumes only. The wall was closed from 28 December to 3 January; regular sessions resumed on 4 January.' },
      ],
    },
  },
  {
    slug: 'z-climbing-2015',
    date: '2015-09-01',
    approx: true,
    category: 'competition',
    image: '/images/2015_Z-games/logo.png',
    source: `${OLD}413`,
    title: { uk: 'Z-climbing-2015 і Z-кубок', en: 'Z-climbing 2015 and the Z-Cup' },
    summary: { uk: 'Харківські скелелази привезли із Затоки сонце, драйв і нагороди.', en: 'Kharkiv climbers brought back sun, drive and medals from Zatoka.' },
    body: {
      uk: [{ p: 'Літній фестиваль і кубок у Затоці: море, лазіння й командний дух. Фотозвіт і враження — на старому сайті.' }],
      en: [{ p: 'A summer festival and cup in Zatoka: sea, climbing and team spirit. Photos and impressions are on the old website.' }],
    },
  },
  {
    slug: 'crimea-september-2015',
    date: '2015-09-25',
    dateEnd: '2015-10-04',
    category: 'trip',
    source: `${OLD}412`,
    title: { uk: 'Альпіністський Крим, вересень', en: 'Mountaineering in Crimea, September' },
    summary: { uk: 'Осінній виїзд з окремою групою для мультипітчів.', en: 'An autumn trip with a separate multi-pitch group.' },
    body: {
      uk: [{ p: 'Осінній альпвиїзд до Криму. За достатньої кількості охочих формувалася паралельна група за мультипітчевою програмою.' }],
      en: [{ p: 'An autumn alpine trip to Crimea. With enough interest, a parallel group followed a multi-pitch programme.' }],
    },
  },
  {
    slug: 'evening-before-trip-2015',
    date: '2015-06-08',
    category: 'trip',
    source: `${OLD}411`,
    title: { uk: 'Справа була ввечері', en: 'It was one evening…' },
    summary: { uk: 'Іронічна історія про збори на скелі.', en: 'A humorous story about packing for the crag.' },
    body: {
      uk: [{ p: 'Весела розповідь про те, як збиралися на виїзд на скелі: рюкзаки, продукти, які забули купити, і все, що буває перед дорогою. Повний текст — на старому сайті.' }],
      en: [{ p: 'A light-hearted story about getting ready for a crag trip: backpacks, the food nobody remembered to buy and everything that happens before the road. Full text on the old website.' }],
    },
  },
  {
    slug: 'buky-2015',
    date: '2015-06-08',
    category: 'trip',
    image: '/images/2015_05_Buki/000.jpg',
    source: `${OLD}410`,
    title: { uk: 'Буки: не звіт, а враження', en: 'Buky: impressions, not a report' },
    summary: { uk: 'Віршовані спогади про дощ, вівсянку й скелі Буків.', en: 'Rhymed memories of rain, porridge and the Buky crags.' },
    body: {
      uk: [{ p: 'Віршований звіт про виїзд у Буки — з дощем, конденсатом у наметі та скелями, заради яких усе це варто. Повний текст — на старому сайті.' }],
      en: [{ p: 'A trip report in verse about Buky — rain, condensation in the tent and the rocks that make it all worthwhile. Full text on the old website.' }],
    },
  },
  {
    slug: 'first-time-2015',
    date: '2015-05-15',
    approx: true,
    category: 'trip',
    source: `${OLD}409`,
    title: { uk: 'Мій перший раз', en: 'My first time' },
    summary: { uk: 'Розповідь новачка про перший альпвиїзд.', en: 'A beginner’s story of their first alpine trip.' },
    body: {
      uk: [{ p: 'Перший виїзд очима новачка: збори біля скелелазного центру, дорога, інструктори й перші маршрути на справжній скелі. Повний текст — на старому сайті.' }],
      en: [{ p: 'A first trip through a beginner’s eyes: meeting at the climbing gym, the road, the instructors and the first routes on real rock. Full text on the old website.' }],
    },
  },
  {
    slug: 'crimea-trip-april-2015',
    date: '2015-04-17',
    dateEnd: '2015-04-26',
    category: 'trip',
    image: '/images/2015_04_KR/000.jpg',
    source: `${OLD}408`,
    title: { uk: 'Альпвиїзд до Криму: Think big, act small', en: 'Crimea trip: think big, act small' },
    summary: { uk: 'Звіт про виїзд як крок до великих цілей.', en: 'A trip report about small steps towards big goals.' },
    body: {
      uk: [{ p: 'Звіт про весняний виїзд до Криму з думкою, що великі цілі досягаються маленькими послідовними кроками. Повний текст — на старому сайті.' }],
      en: [{ p: 'A report on the spring Crimea trip built around one idea: big goals are reached through small, consistent steps. Full text on the old website.' }],
    },
  },
  {
    slug: 'may-holidays-2015',
    date: '2015-05-01',
    category: 'club',
    source: `${OLD}407`,
    title: { uk: 'Розклад на травневі свята', en: 'May holidays schedule' },
    summary: { uk: 'Перерва в тренуваннях з 1 по 10 травня.', en: 'No sessions from 1 to 10 May.' },
    body: {
      uk: [{ p: 'На травневі свята тренування не проводилися з 1 по 10 травня. З 11 травня — за звичайним розкладом.' }],
      en: [{ p: 'There were no sessions during the May holidays, 1–10 May. Regular training resumed on 11 May.' }],
    },
  },
  {
    slug: 'kharkiv-vertical-2015',
    date: '2015-05-23',
    dateEnd: '2015-05-24',
    category: 'competition',
    image: '/images/stories/vertical77.jpg',
    source: `${OLD}406`,
    title: { uk: '«Харківська Вертикаль» 2015', en: '“Kharkiv Vertical” 2015' },
    summary: { uk: 'Транспортування вантажу й евакуація потерпілого на висоті.', en: 'Load transport and casualty evacuation at height.' },
    body: {
      uk: [{ p: 'Відкрита професійна першість верхолазів-висотників на скеледромі «Вертикаль». Суддівську колегію очолював А. І. Гриценко.' }],
      en: [{ p: 'An open professional championship for work-at-height specialists at the “Vertykal” gym, judged by a panel led by A. Hrytsenko.' }],
    },
  },
  {
    slug: 'foros-2015',
    date: '2015-04-17',
    dateEnd: '2015-04-26',
    category: 'trip',
    source: `${OLD}405`,
    title: { uk: 'Виїзд до Форосу', en: 'Trip to Foros' },
    summary: { uk: 'Весняний альпвиїзд до Криму.', en: 'A spring alpine trip to Crimea.' },
    body: {
      uk: [{ p: 'Виїзд до Форосу на мікроавтобусі й автомобілі, повернення — автобусом і потягом. Питання щодо участі — до тренера Ігоря.' }],
      en: [{ p: 'Out to Foros by minibus and car, back by bus and train. Questions went to coach Ihor.' }],
    },
  },
  {
    slug: 'european-students-2015',
    date: '2015-08-05',
    dateEnd: '2015-08-09',
    category: 'competition',
    source: STO,
    title: { uk: 'Чемпіонат Європи зі скелелазіння серед студентів', en: 'European University Climbing Championship' },
    summary: { uk: 'Катовіце, Польща: швидкість, боулдеринг і трудність.', en: 'Katowice, Poland: speed, bouldering and lead.' },
    body: {
      uk: [
        { rows: [['5 серпня', 'Технічна нарада, мандатна комісія'], ['6 серпня', 'Відкриття, швидкість'], ['7 серпня', 'Боулдеринг'], ['8 серпня', 'Трудність (кваліфікація), DYNO JUMP'], ['9 серпня', 'Трудність (фінали), закриття']] },
      ],
      en: [
        { rows: [['5 August', 'Technical meeting, registration'], ['6 August', 'Opening, speed'], ['7 August', 'Bouldering'], ['8 August', 'Lead (qualification), DYNO JUMP'], ['9 August', 'Lead (finals), closing']] },
      ],
    },
  },
  {
    slug: 'campus-board',
    date: '2014-05-01',
    approx: true,
    category: 'tips',
    image: '/images/stories/campus_77.jpg',
    source: STO,
    title: { uk: 'Правила роботи на кампус-борді', en: 'How to train on a campus board' },
    summary: { uk: 'Сила проти потужності: як кампус розвиває пальці й руки.', en: 'Strength vs power: how campusing builds fingers and arms.' },
    body: {
      uk: [
        { p: 'Регулярні вправи на кампус-борді розвивають силу пальців і рук, координацію та дозволяють робити потужніші рухи.' },
        { p: 'Сила — це здатність утримувати м’язове скорочення під максимальним навантаженням (більше статика), а потужність — виконати максимальне скорочення за короткий час (більше динаміка).' },
      ],
      en: [
        { p: 'Regular campus board training builds finger and arm strength, coordination and more powerful moves.' },
        { p: 'Strength is the ability to hold a contraction under maximum load (mostly static); power is the ability to produce a maximal contraction quickly (mostly dynamic).' },
      ],
    },
  },
  {
    slug: 'may-beetle-2014',
    date: '2014-05-31',
    category: 'competition',
    source: STO,
    title: { uk: 'Фестиваль «Травневий жук»', en: '“May Beetle” bouldering festival' },
    summary: { uk: 'Близько 40 боулдерингових проблем на відкритті Muraway.', en: 'About 40 boulder problems at the Muraway opening.' },
    body: {
      uk: [{ p: 'Скелелазний фестиваль на честь відкриття центру «Muraway» (вул. Пушкінська, 13): близько 40 боулдерингових проблем різної складності, заліки «любителі» та «профі» — кожен обирав сам.' }],
      en: [{ p: 'A climbing festival for the opening of the Muraway centre (13 Pushkinska St): about 40 boulder problems of all levels, with “amateur” and “pro” categories — everyone chose their own.' }],
    },
  },
]

/** Події від найновіших; закріплені — першими. */
export const sortedEvents = (list: ClubEvent[] = EVENTS) =>
  [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.date ?? '').localeCompare(a.date ?? ''))

export const getEvent = (slug: string) => EVENTS.find((e) => e.slug === slug)
