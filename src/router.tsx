import { createBrowserRouter, type RouteObject } from 'react-router'
import { Layout } from './components/Layout'

/**
 * Маршрути. Кожна сторінка — окремий файл, що завантажується лише при переході (code splitting).
 * Українська — без префікса (/about), англійська — з префіксом /en (/en/about).
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default })

const pages: RouteObject[] = [
  { index: true, lazy: page(() => import('./pages/Home')) },
  { path: 'about', lazy: page(() => import('./pages/About')) },
  { path: 'training', lazy: page(() => import('./pages/Training')) },
  { path: 'promalp', lazy: page(() => import('./pages/Promalp')) },
  { path: 'events', lazy: page(() => import('./pages/Events')) },
  { path: 'events/:slug', lazy: page(() => import('./pages/EventPage')) },
  { path: 'gallery', lazy: page(() => import('./pages/Gallery')) },
  { path: 'contacts', lazy: page(() => import('./pages/Contacts')) },
  { path: '*', lazy: page(() => import('./pages/NotFound')) },
]

export const router = createBrowserRouter([
  // Облік занять для тренерів — окрема сторінка без шапки сайту
  { path: '/admin', lazy: page(() => import('./admin/AdminApp')) },
  { path: '/en', Component: Layout, children: pages },
  { path: '/', Component: Layout, children: pages },
])
