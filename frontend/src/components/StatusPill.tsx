interface StatusPillProps {
  status: string
  type?: 'client' | 'property' | 'deal' | 'stage'
}

const clientColors: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  warm: 'bg-amber-100 text-amber-700',
  hot: 'bg-red-100 text-red-700',
  cold: 'bg-blue-100 text-blue-700',
}

const propertyColors: Record<string, string> = {
  free: 'bg-emerald-100 text-emerald-700',
  booked: 'bg-amber-100 text-amber-700',
  sold: 'bg-slate-100 text-slate-500',
}

const stageColors: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  view: 'bg-blue-100 text-blue-700',
  booking: 'bg-amber-100 text-amber-700',
  contract: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-500',
}

const labels: Record<string, string> = {
  new: 'Новый',
  warm: 'Тёплый',
  hot: 'Горячий',
  cold: 'Холодный',
  free: 'Свободен',
  booked: 'Забронирован',
  sold: 'Продан',
  view: 'Просмотр',
  booking: 'Бронирование',
  contract: 'Договор',
  paid: 'Оплачен',
  lost: 'Потерян',
}

export default function StatusPill({ status, type = 'client' }: StatusPillProps) {
  const colorMap = type === 'property' ? propertyColors : type === 'stage' ? stageColors : clientColors
  const color = colorMap[status] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {labels[status] ?? status}
    </span>
  )
}
