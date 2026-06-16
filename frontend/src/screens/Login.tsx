import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home } from 'lucide-react'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password, orgName || undefined)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: 'login' | 'register') => {
    setMode(m)
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4 shadow-md">
            <Home className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight">Nearby CRM</h1>
          <p className="text-slate-500 mt-1.5 text-[13px]">CRM для умного подбора недвижимости</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
          <div className="flex mb-5 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-colors ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-slate-50 focus:bg-white transition-colors"
                  required
                />
              </div>
            )}
            {mode === 'register' && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Компания (необязательно)
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-slate-50 focus:bg-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] text-slate-900 bg-slate-50 focus:bg-white transition-colors"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-[12px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm mt-1"
            >
              {loading
                ? mode === 'login' ? 'Входим...' : 'Регистрируем...'
                : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
