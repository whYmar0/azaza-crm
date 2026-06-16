import { useEffect, useState } from 'react'
import { clientsApi } from '../api/client'
import { dealsApi } from '../api/client'
import { propertiesApi } from '../api/client'
import type { Client, Deal, Property } from '../types'
import { Users, Building2, Handshake, TrendingUp, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const STAGES = ['new', 'view', 'booking', 'contract', 'paid'] as const
const STAGE_LABELS: Record<string, string> = {
  new: 'Новые',
  view: 'Просмотр',
  booking: 'Бронирование',
  contract: 'Договор',
  paid: 'Оплачен',
}

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-slate-400',
  view: 'bg-blue-400',
  booking: 'bg-amber-400',
  contract: 'bg-violet-500',
  paid: 'bg-emerald-500',
}

function fmtPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₽`
  return `${(n / 1000).toFixed(0)} тыс ₽`
}

function daysSince(dateStr: string | null) {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86_400_000)
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [props, setProps] = useState<Property[]>([])

  useEffect(() => {
    clientsApi.list().then(setClients)
    dealsApi.list().then(setDeals)
    propertiesApi.list().then(setProps)
  }, [])

  const freeProps = props.filter(p => p.status === 'free').length
  const activeDeals = deals.filter(d => !['paid', 'lost'].includes(d.stage)).length
  const totalRevenue = deals.filter(d => d.stage === 'paid').reduce((s, d) => s + d.amount, 0)

  const lapsed = clients
    .filter(c => daysSince(c.last_contact_at) >= 20)
    .sort((a, b) => daysSince(b.last_contact_at) - daysSince(a.last_contact_at))
    .slice(0, 5)

  const maxStageCount = Math.max(...STAGES.map(s => deals.filter(d => d.stage === s).length), 1)

  const stats = [
    { label: 'Клиентов',          value: clients.length,                               icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-100' },
    { label: 'Свободных объектов',value: freeProps,                                    icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Активных сделок',   value: activeDeals,                                  icon: Handshake, color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
    { label: 'Выручка (закрытые)',value: totalRevenue > 0 ? fmtPrice(totalRevenue) : '0 ₽', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[18px] font-bold text-slate-900">Дашборд</h1>
        <p className="text-slate-500 text-[13px] mt-0.5">Обзор агентства</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white border ${border} rounded-xl p-5 shadow-card`}>
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
            <div className="text-[12px] text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <h2 className="text-[14px] font-semibold text-slate-900 mb-5">Воронка сделок</h2>
          <div className="space-y-3.5">
            {STAGES.map(stage => {
              const count = deals.filter(d => d.stage === stage).length
              const pct = Math.round((count / maxStageCount) * 100)
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-[12px] text-slate-500 w-28 flex-shrink-0">{STAGE_LABELS[stage]}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full ${STAGE_COLORS[stage]} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-[14px] font-semibold text-slate-900">Давно без контакта</h2>
          </div>
          {lapsed.length === 0 ? (
            <p className="text-[12px] text-slate-400 text-center py-4">Все клиенты в контакте ✓</p>
          ) : (
            <div className="space-y-3">
              {lapsed.map(client => (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="flex items-center justify-between group"
                >
                  <div>
                    <div className="text-[13px] font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                      {client.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{client.phone}</div>
                  </div>
                  <span className="text-[11px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                    {daysSince(client.last_contact_at)} дн.
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
