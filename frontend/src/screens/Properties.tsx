import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { propertiesApi } from '../api/client'
import type { Property } from '../types'
import StatusPill from '../components/StatusPill'
import { Plus, Home, Layers, SlidersHorizontal, X } from 'lucide-react'

function fmtPrice(p: Property) {
  if (p.type === 'rent') return `${p.price.toLocaleString('ru-RU')} ₽/мес`
  return `${(p.price / 1_000_000).toFixed(2)} млн ₽`
}

const INFRA_TAGS = [
  { key: 'парк', label: '🌳 Парк' },
  { key: 'школа', label: '🏫 Школа' },
  { key: 'детский сад', label: '🧸 Детский сад' },
]

export default function Properties() {
  const [props, setProps] = useState<Property[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [roomsFilter, setRoomsFilter] = useState(0)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [infraTags, setInfraTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    propertiesApi.list({
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      rooms: roomsFilter || undefined,
      price_min: priceMin ? Number(priceMin) : undefined,
      price_max: priceMax ? Number(priceMax) : undefined,
    }).then(data => {
      if (infraTags.length > 0) {
        setProps(data.filter(p => infraTags.every(tag => (p.tags ?? []).some(t => t.toLowerCase().includes(tag)))))
      } else {
        setProps(data)
      }
    }).finally(() => setLoading(false))
  }, [statusFilter, typeFilter, roomsFilter, priceMin, priceMax, infraTags])

  const hasActiveFilters = roomsFilter > 0 || priceMin || priceMax || infraTags.length > 0

  const clearFilters = () => {
    setRoomsFilter(0)
    setPriceMin('')
    setPriceMax('')
    setInfraTags([])
  }

  const toggleInfra = (tag: string) => {
    setInfraTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Объекты</h1>
          <p className="text-sm text-slate-500">{props.length} объектов</p>
        </div>
        <Link
          to="/properties/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </Link>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          {[{ key: '', label: 'Все' }, { key: 'free', label: 'Свободные' }, { key: 'booked', label: 'Забронированные' }, { key: 'sold', label: 'Проданные' }].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${statusFilter === f.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ key: '', label: 'Все' }, { key: 'sale', label: 'Продажа' }, { key: 'rent', label: 'Аренда' }].map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${typeFilter === f.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${showFilters || hasActiveFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <SlidersHorizontal className="w-4 h-4" />
          Фильтры
          {hasActiveFilters && <span className="ml-1 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{(roomsFilter > 0 ? 1 : 0) + (priceMin || priceMax ? 1 : 0) + infraTags.length}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Дополнительные фильтры</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
                <X className="w-3 h-3" /> Сбросить
              </button>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Количество комнат</div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(r => (
                <button key={r} onClick={() => setRoomsFilter(r === roomsFilter ? 0 : r)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${roomsFilter === r && r > 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-white'}`}>
                  {r === 0 ? 'Любое' : r === 4 ? '4+' : `${r} комн.`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Цена, ₽</div>
            <div className="flex items-center gap-3">
              <input type="number" placeholder="От" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                className="w-36 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-slate-400">—</span>
              <input type="number" placeholder="До" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                className="w-36 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="flex gap-1">
                {[3, 5, 7, 10].map(m => (
                  <button key={m} onClick={() => setPriceMax(String(m * 1_000_000))}
                    className="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                    до {m}M
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Инфраструктура рядом</div>
            <div className="flex gap-2 flex-wrap">
              {INFRA_TAGS.map(tag => (
                <button key={tag.key} onClick={() => toggleInfra(tag.key)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${infraTags.includes(tag.key) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 text-slate-600 hover:bg-white'}`}>
                  {tag.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Фильтр по тегам, добавленным к объектам (через Groq AI)</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-12">Загрузка...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {props.map(prop => (
            <Link key={prop.id} to={`/properties/${prop.id}`}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {prop.cover_url ? (
                <img src={prop.cover_url} alt={prop.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Home className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 leading-tight text-sm">{prop.title}</h3>
                  <StatusPill status={prop.status} type="property" />
                </div>
                <p className="text-xs text-slate-500 mb-2 truncate">{prop.address}</p>
                <div className="text-base font-bold text-slate-900 mb-2">{fmtPrice(prop)}</div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{prop.rooms} комн.</span>
                  <span>{prop.area} м²</span>
                  {prop.price_per_m2 > 0 && prop.type === 'sale' && (
                    <span>{Math.round(prop.price_per_m2).toLocaleString('ru-RU')} ₽/м²</span>
                  )}
                </div>
                {(prop.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {prop.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {props.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400">Объекты не найдены</div>
          )}
        </div>
      )}
    </div>
  )
}
