import type { Lang } from '../i18n'

export type Album = {
  id: string
  year: number
  title: Record<Lang, string>
  /** Кількість фото в повному альбомі на старому сайті */
  total: number
  /** Шлях до папки з мініатюрами та імена файлів (phoca_thumb_l_*) */
  dir: string
  files: string[]
}

const ALBUM_URL = 'https://www.climbing.kharkov.ua/index.php?option=com_phocagallery&view=category&Itemid=6&id='
export const albumSource = (id: string) => ALBUM_URL + id
export const photoPath = (a: Album, file: string) => `/images/phocagallery/${a.dir}thumbs/phoca_thumb_l_${file}`

export const ALBUMS: Album[] = [
  { id: '29', year: 2011, title: { uk: 'Червоний Камінь, літо', en: 'Chervonyi Kamin, summer' }, total: 20, dir: 'KrKamen2011/', files: ['img_1538_ .jpg', 'img_1539_ .jpg', 'img_1540_ .jpg', 'img_1541_ .jpg', 'img_1542_ .jpg', 'img_1543_ .jpg', 'img_1544_ .jpg', 'img_1546_ .jpg'] },
  { id: '28', year: 2010, title: { uk: 'Монблан', en: 'Mont Blanc' }, total: 20, dir: 'Monblan2010/', files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '7.jpg', '7a.jpg', '7b.jpg', '8.jpg'] },
  { id: '27', year: 2010, title: { uk: 'Кам’янець — Довбуша', en: 'Kamianets — Dovbush' }, total: 20, dir: 'Kamenec_Dovbusha2010/', files: ['kamenec_dovbusha 007.jpg', 'kamenec_dovbusha 011.jpg', '_igp8188.jpg', '_igp8199.jpg', '_igp8206.jpg', '_igp8217.jpg', '_igp8219.jpg', 'kamenec_dovbusha 130.jpg'] },
  { id: '25', year: 2010, title: { uk: 'SPACE CUP', en: 'SPACE CUP' }, total: 7, dir: 'SC_2010/', files: ['2.jpg', '3.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', 'prizepi.jpg'] },
  { id: '23', year: 2010, title: { uk: 'Кривий Ріг, березень', en: 'Kryvyi Rih, March' }, total: 19, dir: 'Kr_rog2010/', files: ['1.jpg', 'pr_m.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg'] },
  { id: '20', year: 2009, title: { uk: 'Скелі Довбуша, серпень', en: 'Dovbush Rocks, August' }, total: 20, dir: 'Dovbusha_2009/', files: ['11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg', '17.jpg', '18.jpg'] },
  { id: '19', year: 2009, title: { uk: 'Наші у Валенсії', en: 'Our team in Valencia' }, total: 20, dir: 'valensia/', files: ['img_5954.jpg', 'img_5975.jpg', 'img_5986.jpg', 'img_6069.jpg', 'img_6071.jpg', 'img_6074.jpg', 'img_6212.jpg', 'img_5599.jpg'] },
  { id: '18', year: 2009, title: { uk: 'Червоний Камінь, червень', en: 'Chervonyi Kamin, June' }, total: 20, dir: 'KK_06_2009/', files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'] },
  { id: '14', year: 2009, title: { uk: 'Червоний Камінь, травень', en: 'Chervonyi Kamin, May' }, total: 20, dir: 'KK_may09/', files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'] },
  { id: '11', year: 2009, title: { uk: 'SPACE CUP', en: 'SPACE CUP' }, total: 20, dir: 'Space_cup_2009/', files: ['sp09_1.jpg', 'sp09_2.jpg', 'sp09_3.jpg', 'sp09_4.jpg', 'sp09_5.jpg', 'sp09_6.jpg', 'sp09_7.jpg', 'sp09_8.jpg'] },
  { id: '17', year: 2009, title: { uk: 'SPACE CUP — фото Д. Колесниченка', en: 'SPACE CUP — by D. Kolesnychenko' }, total: 20, dir: 'SC_Denis/', files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg'] },
  { id: '13', year: 2009, title: { uk: 'SPACE CUP — фото В. Марієнка', en: 'SPACE CUP — by V. Mariienko' }, total: 20, dir: 'SP_Marienko/', files: ['den.jpg', 'den3.jpg', 'gop.jpg', 'ol.jpg', 'ol3.jpg', 'ol4.jpg', 'olezka.jpg', 'olezka2.jpg'] },
  { id: '15', year: 2009, title: { uk: 'SPACE CUP — Вовка & Ко', en: 'SPACE CUP — Vovka & Co' }, total: 20, dir: 'SP_Vovik/', files: ['004.jpg', '005.jpg', '006.jpg', '007.jpg', '008.jpg', '009.jpg', '01.jpg', '02.jpg'] },
  { id: '8', year: 2009, title: { uk: 'Чемпіонат України з боулдерингу, Львів', en: 'Ukrainian Bouldering Championship, Lviv' }, total: 20, dir: '', files: ['lviiv11.jpg', 'lviv1.jpg', 'lviv2.jpg', 'lviv3.jpg', 'lviv4.jpg', 'lviv5.jpg', 'lviv6.jpg', 'lviv7.jpg'] },
  { id: '10', year: 2009, title: { uk: 'Пам’яті Ю. І. Григоренка-Пригоди', en: 'In memory of Yu. Hryhorenko-Pryhoda' }, total: 18, dir: 'veterani2009/', files: ['veterani1.jpg', 'veterani2.jpg', 'veterani3.jpg', 'veterani4.jpg', 'veterani5.jpg', 'veterani6.jpg', 'veterani7.jpg', 'veterani8.jpg'] },
  { id: '9', year: 2009, title: { uk: '«Золота ящірка»', en: '“Golden Lizard”' }, total: 20, dir: '', files: ['dnepr1.jpg', 'dnepr3.jpg', 'dnepr4.jpg', 'dnepr_alex.jpg', 'dnepr_alex2.jpg', 'dnepr_chelombitko.jpg', 'dnepr_deti.jpg', 'dnepr_ilya.jpg'] },
  { id: '16', year: 2009, title: { uk: 'Молодіжний чемпіонат України', en: 'Ukrainian Youth Championship' }, total: 20, dir: 'MCHU09/', files: ['1.jpg', '2.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg'] },
  { id: '12', year: 2009, title: { uk: 'Нікополь, діти', en: 'Nikopol, kids' }, total: 20, dir: 'Nikopol_deti/', files: ['31.jpg', '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg'] },
  { id: '3', year: 2008, title: { uk: '«Зеніт», грудень', en: '“Zenit”, December' }, total: 6, dir: '', files: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg'] },
  { id: '1', year: 2008, title: { uk: 'Одеса', en: 'Odesa' }, total: 20, dir: 'Odessa08/', files: ['ale.jpg', 'alena.jpg', 'alena2.jpg', 'dzubyak.jpg', 'gus.jpg', 'gus2.jpg', 'gus4.jpg', 'ko2.jpg'] },
  { id: '6', year: 2008, title: { uk: 'Червоний Камінь, осінь', en: 'Chervonyi Kamin, autumn' }, total: 20, dir: '', files: ['andr.jpg', 'belka.jpg', 'bomba.jpg', 'dimon.jpg', 'dimon1.jpg', 'dosyg.jpg', 'gena.jpg', 'gena1.jpg'] },
  { id: '4', year: 2008, title: { uk: 'Судак', en: 'Sudak' }, total: 20, dir: '', files: ['vovka.jpg', '11.jpg', '12.jpg', '13.jpg', '45.jpg', '111.jpg', '787.jpg', 'aaa.jpg'] },
  { id: '5', year: 2007, title: { uk: 'Макіївка', en: 'Makiivka' }, total: 20, dir: '', files: ['mak07-1.jpg', 'mak07-2.jpg', 'mak07-3.jpg', 'mak07-4.jpg', 'den.jpg', 'mak07-5.jpg', 'mak07-6.jpg', 'mak7-.jpg'] },
  { id: '2', year: 2007, title: { uk: 'Українка', en: 'Ukrainka' }, total: 14, dir: '', files: ['anasawa.jpg', 'den.jpg', 'denchik.jpg', 'dnepri.jpg', 'dnepri1.jpg', 'eda.jpg', 'ezik2.jpg', 'love is.jpg'] },
]
