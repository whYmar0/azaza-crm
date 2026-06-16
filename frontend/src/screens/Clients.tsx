import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clientsApi } from '../api/client'
import type { Client } from '../types'
import StatusPill from '../components/StatusPill'
import { Search, Plus, Phone } from 'lucide-react'

const STATUS_TABS = [
  { key: '', label: 'Все' },
  { key: 'hot', label: 'Горячие' },
  { key: 'warm', label: 'Тёплые' },
  { key: 'new', label: 'Новые' },
  { key: 'cold', label: 'Холодные' },
]

function fmtBudget(min: number, max: number) {
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`
  return `${fmt(min)} – ${fmt(max)} ₽`
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    clientsApi.list({ status: status || undefined, search: search || undefined })
      .then(setClients)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [status])
  useEffect(() => {
    const t = setTimeout(load, 350)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Клиенты</h1>
          <p className="text-sm text-slate-500">{clients.length} клиентов</p>
        </div>
        <Link
          to="/clients/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                status === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Телефон</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Бюджет</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Пожелания</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Загрузка...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Клиенты не найдены</td>
              </tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {client.name}
                    </Link>
                    {client.email && <div className="text-xs text-slate-400">{client.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5" />
                      {client.phone || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {client.budget_max > 0 ? fmtBudget(client.budget_min, client.budget_max) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(client.wishes_tags ?? []).slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={client.status} type="client" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
