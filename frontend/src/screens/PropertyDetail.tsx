import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { propertiesApi } from '../api/client'
import type { NearbyPlace, Property } from '../types'
import StatusPill from '../components/StatusPill'
import MapPanel from '../components/MapPanel'
import Calculator from '../components/Calculator'
import { ArrowLeft, Layers, Calendar, CreditCard, MapPin, Upload, Sparkles, Tag, X, Pencil, Check, LocateFixed, Plus, Trash2 } from 'lucide-react'

const TWOGIS_KEY = 'adca2f24-661a-4a2a-a21c-8784c14c8765'

function fmtPrice(p: Property) {
  if (p.type === 'rent') return `${p.price.toLocaleString('ru-RU')} ₽/мес`
  return `${(p.price / 1_000_000).toFixed(2)} млн ₽`
}

interface Suggestion {
  id: string; full_name: string; name: string
  lat?: number; lon?: number
}

function AddressAutocomplete({ value, onChange, onSelect, onAutoFill }: {
  value: string
  onChange: (v: string) => void
  onSelect: (address: string, lat: number, lng: number) => void
  onAutoFill?: (lat: number, lng: number) => void
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(false)
  const suggestionsRef = useRef<Suggestion[]>([])
  const requestIdRef = useRef(0)

  useEffect(() => { suggestionsRef.current = suggestions }, [suggestions])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (q: string) => {
    onChange(q)
    selectedRef.current = false
    if (timer.current) clearTimeout(timer.current)
    const requestId = ++requestIdRef.current
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('hm_token')
        const res = await fetch(`/api/v1/geo/suggest?q=${encodeURIComponent(q)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (requestId !== requestIdRef.current) return
        const items: Suggestion[] = data.items ?? []
        setSuggestions(items)
        setOpen(items.length > 0)
        if (items.length > 0 && items[0].lat != null && items[0].lon != null && onAutoFill) {
          onAutoFill(items[0].lat, items[0].lon)
        }
      } catch { setSuggestions([]) }
      finally { setLoading(false) }
    }, 350)
  }

  const pick = (s: Suggestion) => {
    selectedRef.current = true
    const addr = s.full_name || s.name
    onChange(addr); setOpen(false); setSuggestions([])
    if (s.lat != null && s.lon != null) onSelect(addr, s.lat, s.lon)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      if (!selectedRef.current && suggestionsRef.current.length > 0) {
        pick(suggestionsRef.current[0])
      }
    }, 200)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input required value={value} onChange={e => search(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          className="w-full border border-slate-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="г. Грозный, ул. Путина, 1"
          name="address-2gis-search" autoComplete="off" autoCorrect="off" spellCheck="false"
          data-lpignore="true" data-1p-ignore />
        {loading && <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-56 overflow-y-auto">
          {suggestions.map(s => (
            <li key={s.id} onMouseDown={() => pick(s)}
              className="flex items-start gap-2 px-3 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm border-b border-slate-100 last:border-0">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-800 leading-snug">{s.name}</div>
                <div className="text-slate-400 text-xs leading-snug">{s.full_name}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PropertyForm({ onCreated }: { onCreated: (id: number) => void }) {
  const [form, setForm] = useState({
    title: '', address: '', type: 'sale', status: 'free',
    price: '', rooms: '2', area: '', lat: '43.3169', lng: '45.6987',
    ready_date: '', installment: false,
  })
  const [saving, setSaving] = useState(false)
  const [coordsFromMap, setCoordsFromMap] = useState(false)
  const set = (k: string, v: string | boolean) => setForm((f: typeof form) => ({ ...f, [k]: v }))

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    setForm(f => ({ ...f, address, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
    setCoordsFromMap(true)
  }

  const handleAutoFill = (lat: number, lng: number) => {
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
    setCoordsFromMap(true)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const p = await propertiesApi.create({
        title: form.title, address: form.address,
        type: form.type as 'sale' | 'rent',
        status: form.status as 'free' | 'booked' | 'sold',
        price: Number(form.price), rooms: Number(form.rooms),
        area: Number(form.area), lat: Number(form.lat), lng: Number(form.lng),
        price_per_m2: form.area ? Math.round(Number(form.price) / Number(form.area)) : 0,
        ready_date: form.ready_date,
        installment: form.installment,
      })
      onCreated(p.id)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/properties" className="text-slate-500 hover:text-slate-800"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-slate-900">Новый объект</h1>
      </div>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ЖК Столица, 2к квартира" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Адрес <span className="ml-1 text-xs font-normal text-indigo-500">— начните вводить, выберите из 2ГИС</span>
            </label>
            <AddressAutocomplete value={form.address} onChange={v => set('address', v)} onSelect={handleAddressSelect} onAutoFill={handleAutoFill} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Тип</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="sale">Продажа</option>
              <option value="rent">Аренда</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="free">Свободен</option>
              <option value="booked">Забронирован</option>
              <option value="sold">Продан</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Цена, ₽</label>
            <input required type="number" value={form.price} onChange={e => set('price', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="5000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Комнат</label>
            <input required type="number" min="1" max="10" value={form.rooms} onChange={e => set('rooms', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Площадь, м²</label>
            <input required type="number" value={form.area} onChange={e => set('area', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="65" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Дата сдачи</label>
            <input type="date" value={form.ready_date} onChange={e => set('ready_date', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="installment" checked={form.installment}
              onChange={e => set('installment', e.target.checked)}
              className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="installment" className="text-sm text-slate-700">Рассрочка доступна</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Широта {coordsFromMap && <span className="ml-1 text-xs text-emerald-600">✓ из 2ГИС</span>}
            </label>
            <input type="number" step="any" value={form.lat}
              onChange={e => { set('lat', e.target.value); setCoordsFromMap(false) }}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Долгота</label>
            <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Сохранение...' : 'Создать объект'}
        </button>
      </form>
    </div>
  )
}

function CoverUpload({ property, onUploaded }: { property: Property; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await propertiesApi.uploadCover(property.id, file)
      onUploaded(res.cover_url)
    } finally { setUploading(false) }
  }

  return (
    <div className="relative group">
      {property.cover_url ? (
        <img src={property.cover_url} alt={property.title}
          className="w-full h-48 object-cover rounded-lg border border-slate-200" />
      ) : (
        <div className="w-full h-48 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Upload className="w-8 h-8 mx-auto mb-2" />
            <div className="text-sm">Нет обложки</div>
          </div>
        </div>
      )}
      <button onClick={() => inputRef.current?.click()} disabled={uploading}
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity text-white text-sm font-medium gap-2">
        <Upload className="w-4 h-4" />
        {uploading ? 'Загрузка...' : 'Изменить фото'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

function PhotoGallery({ property, onChange }: { property: Property; onChange: (p: Property) => void }) {
  const [uploading, setUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const photos = property.photos ?? []

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const res = await propertiesApi.uploadPhotos(property.id, files)
      onChange({ ...property, photos: res.photos })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (url: string) => {
    setDeletingUrl(url)
    try {
      const res = await propertiesApi.deletePhoto(property.id, url)
      onChange({ ...property, photos: res.photos })
    } finally { setDeletingUrl(null) }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Фотографии</h3>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          {uploading ? 'Загрузка...' : 'Добавить фото'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>
      {photos.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-6">Нет фотографий</div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {photos.map(url => (
            <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => handleDelete(url)} disabled={deletingUrl === url}
                className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DescriptionPanel({ property, onChange }: { property: Property; onChange: (p: Property) => void }) {
  const [desc, setDesc] = useState(property.description || '')
  const [tags, setTags] = useState<string[]>(property.tags || [])
  const [newTag, setNewTag] = useState('')
  const [editing, setEditing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await propertiesApi.generateDescription(property.id)
      setDesc(res.description)
      setTags(res.tags)
      setEditing(true)
      onChange({ ...property, description: res.description, tags: res.tags })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка'
      alert(msg.includes('not configured') ? 'Добавьте GROQ_API_KEY в .env файл' : 'Ошибка генерации: ' + msg)
    } finally { setGenerating(false) }
  }

  const save = async () => {
    setSaving(true)
    try {
      await propertiesApi.updateDescription(property.id, { description: desc, tags })
      onChange({ ...property, description: desc, tags })
      setEditing(false)
    } finally { setSaving(false) }
  }

  const addTag = () => {
    const t = newTag.trim()
    if (t && !tags.includes(t)) { setTags([...tags, t]); setEditing(true) }
    setNewTag('')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Описание</h3>
        <div className="flex gap-2">
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-md hover:bg-violet-700 disabled:opacity-50 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? 'Генерация...' : 'Groq AI'}
          </button>
          {editing ? (
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 text-xs border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
              Редактировать
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Описание объекта..." />
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed">
          {desc || <span className="text-slate-400 italic">Нет описания. Нажмите Groq AI для генерации.</span>}
        </p>
      )}

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Теги</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
              {tag}
              {editing && (
                <button onClick={() => { setTags(tags.filter(t => t !== tag)) }}
                  className="ml-0.5 hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
          {editing && (
            <div className="flex items-center gap-1">
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="border border-slate-300 rounded-full px-2 py-0.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="+ тег" />
              <button onClick={addTag} className="text-indigo-600 text-xs hover:text-indigo-800">OK</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddressEditor({ property, onChange }: { property: Property; onChange: (p: Property) => void }) {
  const [editing, setEditing] = useState(false)
  const [addr, setAddr] = useState(property.address)
  const [saving, setSaving] = useState(false)

  const handleSelect = async (address: string, lat: number, lng: number) => {
    setSaving(true)
    try {
      const updated = await propertiesApi.update(property.id, { ...property, address, lat, lng })
      onChange(updated)
      setEditing(false)
    } finally { setSaving(false) }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-slate-500 text-sm mt-0.5">{property.address}</p>
        <button onClick={() => { setAddr(property.address); setEditing(true) }}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-0.5">
          <LocateFixed className="w-3 h-3" />Изменить адрес
        </button>
      </div>
    )
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="flex-1 max-w-sm">
        <AddressAutocomplete value={addr} onChange={setAddr} onSelect={handleSelect} />
      </div>
      {saving && <span className="text-xs text-slate-400">Сохранение...</span>}
      <button onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-slate-600">Отмена</button>
    </div>
  )
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [nearby, setNearby] = useState<NearbyPlace[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const isNew = id === 'new'
  const numId = isNew ? NaN : Number(id)

  useEffect(() => {
    if (isNew || isNaN(numId)) return
    propertiesApi.get(numId).then(setProperty).catch(() => navigate('/properties'))
    propertiesApi.nearby(numId).then(setNearby).catch(() => {})
  }, [numId, isNew])

  const deleteProperty = async () => {
    if (isNaN(numId)) return
    setDeleting(true)
    setDeleteError('')
    try {
      await propertiesApi.delete(numId)
      navigate('/properties')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Не удалось удалить объект')
      setDeleting(false)
    }
  }

  if (isNew) return <PropertyForm onCreated={newId => navigate(`/properties/${newId}`)} />
  if (!property) return <div className="text-slate-400 p-8 text-center">Загрузка...</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/properties" className="text-slate-500 hover:text-slate-800"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{property.title}</h1>
            <StatusPill status={property.status} type="property" />
            <span className="text-sm text-slate-500">{property.type === 'sale' ? 'Продажа' : 'Аренда'}</span>
          </div>
          <AddressEditor property={property} onChange={p => { setProperty(p); propertiesApi.nearby(p.id).then(setNearby).catch(() => {}) }} />
        </div>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Удалить объект?</span>
            <button onClick={deleteProperty} disabled={deleting}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors">
              {deleting ? 'Удаление...' : 'Да'}
            </button>
            <button onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }} disabled={deleting}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-md hover:bg-slate-200 transition-colors">Нет</button>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 text-sm rounded-md hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
          {deleteError}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <CoverUpload property={property} onUploaded={url => setProperty(p => p ? { ...p, cover_url: url } : p)} />

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{fmtPrice(property)}</div>
                <div className="text-xs text-slate-500 mt-0.5">цена</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-xl font-bold text-slate-900">
                  <Layers className="w-5 h-5 text-slate-400" />{property.rooms}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">комнат</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{property.area} м²</div>
                <div className="text-xs text-slate-500 mt-0.5">площадь</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">
                  {property.price_per_m2 > 0 ? `${Math.round(property.price_per_m2 / 1000)}K` : '—'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">₽/м²</div>
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-100 text-sm flex-wrap">
              {property.ready_date && property.ready_date !== '' && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  Сдача: {property.ready_date}
                </div>
              )}
              {property.installment && (
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CreditCard className="w-4 h-4" />Рассрочка
                </div>
              )}
              {property.promo && (
                <div className="text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full text-xs">{property.promo}</div>
              )}
            </div>
          </div>

          <PhotoGallery property={property} onChange={setProperty} />

          <DescriptionPanel property={property} onChange={setProperty} />

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Карта и инфраструктура</h3>
            <MapPanel lat={property.lat} lng={property.lng} nearby={nearby} />
          </div>
        </div>

        <div className="space-y-4">
          {property.type === 'sale' && property.price > 0 && (
            <Calculator price={property.price} />
          )}
        </div>
      </div>
    </div>
  )
}
