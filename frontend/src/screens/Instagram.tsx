import { useEffect, useState } from 'react'
import { instagramApi } from '../api/client'
import { Instagram, Link2, Link2Off, ExternalLink, Heart, MessageCircle, Users, FileImage, RefreshCw } from 'lucide-react'

interface IGProfile {
  id?: string
  username?: string
  media_count?: number
  followers_count?: number
  follows_count?: number
  biography?: string
  profile_picture_url?: string
}

interface IGPost {
  id: string
  caption?: string
  media_type?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
}

export default function InstagramPage() {
  const [connected, setConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [stats, setStats] = useState<{ profile: IGProfile; posts: IGPost[] } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    instagramApi.get().then(r => {
      setConnected(r.connected)
      setUsername(r.username ?? '')
      if (r.connected) loadStats()
    }).catch(() => {})
  }, [])

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const r = await instagramApi.stats()
      const profile = r.profile as IGProfile
      const media = (r.media as { data?: IGPost[] })?.data ?? []
      setStats({ profile, posts: media })
    } catch {}
    finally { setLoadingStats(false) }
  }

  const connect = async () => {
    if (!token.trim()) return
    setConnecting(true)
    setError('')
    try {
      const r = await instagramApi.connect(token.trim())
      setConnected(true)
      setUsername(r.username)
      setToken('')
      loadStats()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка подключения')
    } finally { setConnecting(false) }
  }

  const disconnect = async () => {
    await instagramApi.disconnect()
    setConnected(false)
    setUsername('')
    setStats(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
          <Instagram className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Instagram</h1>
          <p className="text-sm text-slate-500">Статистика вашего Instagram-профиля</p>
        </div>
      </div>

      {!connected ? (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-xl">
            <div className="text-sm font-medium text-slate-700">Введите Access Token вашего Instagram</div>
            <input
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="EAABwzLixnjYBO..."
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button onClick={connect} disabled={!token.trim() || connecting}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                <Link2 className="w-4 h-4" />
                {connecting ? 'Подключение...' : 'Подключить'}
              </button>
              <button onClick={() => setShowGuide(v => !v)}
                className="text-sm text-indigo-600 hover:text-indigo-800 underline">
                {showGuide ? 'Скрыть инструкцию' : 'Как получить токен?'}
              </button>
            </div>
          </div>

          {showGuide && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5">
              <h3 className="font-semibold text-slate-900">Пошаговая инструкция получения токена</h3>

              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Переведите Instagram в Business/Creator аккаунт',
                    desc: 'Instagram → Настройки → Аккаунт → Переключиться на профессиональный аккаунт. Выберите «Бизнес» или «Автор контента».',
                  },
                  {
                    step: 2,
                    title: 'Создайте Meta Developer App',
                    desc: null,
                    link: { href: 'https://developers.facebook.com/apps', label: 'developers.facebook.com/apps' },
                    sub: [
                      'Нажмите «Создать приложение» → тип: «Другое» → «Нет» → «Бизнес»',
                      'Введите название (например: HomeMatch CRM)',
                      'В дашборде нажмите «Добавить продукт» → найдите «Instagram Graph API» → «Настройка»',
                    ],
                  },
                  {
                    step: 3,
                    title: 'Получите User Access Token',
                    desc: null,
                    sub: [
                      'В левом меню: Instagram → API Setup with Instagram Login',
                      'В разделе «Generate access tokens» нажмите «Add or Remove Instagram Testers»',
                      'Добавьте ваш Instagram аккаунт как тестировщика',
                      'В Instagram: Настройки → Приложения → Приглашения → Принять',
                      'Вернитесь в Meta, нажмите «Generate Token» напротив вашего аккаунта',
                      'Скопируйте токен — он действует 60 дней',
                    ],
                  },
                  {
                    step: 4,
                    title: 'Нужны разрешения (Permissions)',
                    desc: 'Для чтения статистики запросите: instagram_basic, instagram_manage_insights, pages_show_list, pages_read_engagement. Для боевого использования нужен App Review (несколько дней).',
                  },
                  {
                    step: 5,
                    title: 'Вставьте токен выше и нажмите «Подключить»',
                    desc: 'После подключения откроется статистика: подписчики, публикации, лайки, комментарии к последним 9 постам.',
                  },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{item.title}</div>
                      {item.desc && <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>}
                      {item.link && (
                        <a href={item.link.href} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-0.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {item.link.label}
                        </a>
                      )}
                      {item.sub && (
                        <ul className="mt-1 space-y-0.5 list-disc list-inside text-sm text-slate-600">
                          {item.sub.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Важно:</strong> Токен без App Review работает только для тестовых аккаунтов (аккаунты-тестировщики). Для полноценной работы с продакшн-аккаунтом требуется прохождение Meta App Review (~3-5 рабочих дней).
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {stats?.profile.profile_picture_url ? (
                <img src={stats.profile.profile_picture_url} alt={username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-pink-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900">@{username}</div>
                {stats?.profile.biography && (
                  <div className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{stats.profile.biography}</div>
                )}
              </div>
              <span className="ml-2 flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Подключён
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={loadStats} disabled={loadingStats}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                Обновить
              </button>
              <button onClick={disconnect}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
                <Link2Off className="w-4 h-4" />
                Отключить
              </button>
            </div>
          </div>

          {stats?.profile && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Users className="w-5 h-5 text-pink-500" />, label: 'Подписчики', value: stats.profile.followers_count ?? '—', bg: 'bg-pink-50' },
                { icon: <FileImage className="w-5 h-5 text-purple-500" />, label: 'Публикации', value: stats.profile.media_count ?? '—', bg: 'bg-purple-50' },
                { icon: <Users className="w-5 h-5 text-indigo-500" />, label: 'Подписки', value: stats.profile.follows_count ?? '—', bg: 'bg-indigo-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-xl p-5 flex items-center gap-4`}>
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">{s.icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{typeof s.value === 'number' ? s.value.toLocaleString('ru-RU') : s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats && stats.posts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Последние публикации</h3>
              <div className="grid grid-cols-3 gap-3">
                {stats.posts.map(post => (
                  <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                    className="group relative rounded-lg overflow-hidden bg-slate-100 aspect-square block">
                    {post.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Instagram className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-medium">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {post.like_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" /> {post.comments_count ?? 0}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {loadingStats && !stats && (
            <div className="text-slate-400 text-center py-12">Загрузка статистики...</div>
          )}
        </div>
      )}
    </div>
  )
}
