import { useState } from 'react'
import { dealsApi } from '../api/client'
import type { Deal } from '../types'
import StatusPill from './StatusPill'
import { Building2, User } from 'lucide-react'

const STAGES = [
  { key: 'new', label: 'Новые' },
  { key: 'view', label: 'Просмотр' },
  { key: 'booking', label: 'Бронирование' },
  { key: 'contract', label: 'Договор' },
  { key: 'paid', label: 'Оплачен' },
] as const

function fmtPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₽`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₽`
  return `${n} ₽`
}

interface KanbanBoardProps {
  deals: Deal[]
  onUpdate: () => void
}

export default function KanbanBoard({ deals, onUpdate }: KanbanBoardProps) {
  const [dragging, setDragging] = useState<Deal | null>(null)
  const [over, setOver] = useState<string | null>(null)

  const byStage = (stage: string) => deals.filter(d => d.stage === stage)

  const handleDrop = async (stage: string) => {
    if (!dragging || dragging.stage === stage) {
      setDragging(null)
      setOver(null)
      return
    }
    await dealsApi.updateStage(dragging.id, stage)
    setDragging(null)
    setOver(null)
    onUpdate()
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map(({ key, label }) => (
        <div
          key={key}
          className={`flex-shrink-0 w-60 bg-slate-100 rounded-lg p-3 transition-colors ${
            over === key ? 'bg-indigo-50 ring-2 ring-indigo-300' : ''
          }`}
          onDragOver={e => { e.preventDefault(); setOver(key) }}
          onDragLeave={() => setOver(null)}
          onDrop={() => handleDrop(key)}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">{label}</span>
            <span className="text-xs bg-white border border-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center">
              {byStage(key).length}
            </span>
          </div>

          <div className="space-y-2">
            {byStage(key).map(deal => (
              <div
                key={deal.id}
                draggable
                onDragStart={() => setDragging(deal)}
                onDragEnd={() => { setDragging(null); setOver(null) }}
                className="bg-white border border-slate-200 rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <span className="text-sm font-medium text-slate-900 leading-tight">
                    {deal.property?.title ?? `Объект #${deal.property_id}`}
                  </span>
                  <StatusPill status={deal.stage} type="stage" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3 h-3" />
                    {deal.client?.name ?? `Клиент #${deal.client_id}`}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Building2 className="w-3 h-3" />
                    {fmtPrice(deal.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
