import type { Group, Member, Session, Settings, Visit } from './model'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin/${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: init.body ? { 'content-type': 'application/json', ...init.headers } : init.headers,
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* не JSON — наприклад, функція недоступна локально */
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? (res.status === 404 ? 'API недоступне (сайт запущено без Netlify Functions?)' : `Помилка ${res.status}`)
    throw new ApiError(res.status, msg)
  }
  return data as T
}

const put = (body: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(body) })
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const api = {
  me: () => call<{ user: string }>('me'),
  login: (login: string, password: string) => call<{ user: string }>('login', post({ login, password })),
  logout: () => call('logout', { method: 'POST' }),
  state: () => call<{ user: string; members: Member[]; settings: Settings }>('state'),

  saveMember: (m: Partial<Member>) => call<{ member: Member }>('member', put(m)),
  deleteMember: (id: string) => call('member?id=' + encodeURIComponent(id), { method: 'DELETE' }),
  savePass: (p: { memberId: string; id?: string; sessions: number; from: string; until: string; amount: number; used?: number }) =>
    call<{ member: Member }>('pass', post(p)),
  deletePass: (memberId: string) => call<{ member: Member }>('pass?memberId=' + encodeURIComponent(memberId), { method: 'DELETE' }),

  sessions: (from: string, to: string) => call<{ sessions: Session[] }>(`sessions?from=${from}&to=${to}`),
  saveSession: (date: string, group: Group, visits: Record<string, Visit>) =>
    call<{ session: Session; members: Member[] }>('session', put({ date, group, visits })),

  saveSettings: (s: Settings) => call<{ settings: Settings }>('settings', put(s)),
}
