import { useEffect, useState } from 'react'
import { dealsApi } from '../api/client'
import type { Deal } from '../types'
import KanbanBoard from '../components/KanbanBoard'

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    dealsApi.list().then(setDeals).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const lost = deals.filter(d => d.stage === 'lost').length
  const paid = deals.filter(d => d.stage === 'paid').length
  const active = deals.filter(d => !['paid', 'lost'].includes(d.stage)).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Сделки</h1>
          <p className="text-sm text-slate-500">
            {active} активных · {paid} закрытых · {lost} потеряно
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-12">Загрузка...</div>
      ) : (
        <KanbanBoard deals={deals} onUpdate={load} />
      )}

      {deals.filter(d => d.stage === 'lost').length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-700 mb-3">Потерянные сделки</h3>
          <div className="space-y-2">
            {deals.filter(d => d.stage === 'lost').map(deal => (
              <div key={deal.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{deal.property?.title ?? `Объект #${deal.property_id}`}</span>
                <span className="text-slate-500">{deal.client?.name ?? `Клиент #${deal.client_id}`}</span>
                <span className="text-slate-400">{(deal.amount / 1e6).toFixed(2)} млн ₽</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
