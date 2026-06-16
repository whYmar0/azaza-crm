import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { clientsApi, propertiesApi, selectionsApi } from '../api/client'
import type { Client, Interaction, MatchItem, Property } from '../types'
import StatusPill from '../components/StatusPill'
import MatchCard from '../components/MatchCard'
import { ArrowLeft, Phone, Mail, Send, Trash2, ChevronDown, ListChecks, X } from 'lucide-react'

const CHANNEL_ICONS: Record<string, string> = {
  call: '📞', whatsapp: '💬', email: '✉️', visit: '🏠', note: '📝', auto: '🤖', api: '🔌',
}

const STATUS_OPTIONS: { value: Client['status']; label: string; color: string }[] = [
  { value: 'new',  label: 'Новый',    color: 'bg-slate-100 text-slate-700' },
  { value: 'warm', label: 'Тёплый',   color: 'bg-amber-100 text-amber-700' },
  { value: 'hot',  label: 'Горячий',  color: 'bg-red-100 text-red-700' },
  { value: 'cold', label: 'Холодный', color: 'bg-blue-100 text-blue-700' },
]

const WISHES_TAGS = [
  { key: 'парк',        label: '🌳 Парк' },
  { key: 'школа',      label: '🏫 Школа' },
  { key: 'детский сад', label: '🧸 Детский сад' },
  { key: 'транспорт',  label: '🚌 Транспорт' },
  { key: 'магазин',    label: '🛒 Магазин' },
  { key: 'тихий район', label: '🏡 Тихий район' },
  { key: 'новостройка', label: '🏗 Новостройка' },
]

function fmtDate(d: string) {
  return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ClientForm({ onCreated }: { onCreated: (id: number) => void }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    status: 'new' as Client['status'],
    purchase_power: 'Средняя' as 'Высокая' | 'Средняя' | 'Низкая',
    budget_min: '', budget_max: '', rooms_wanted: '2', area_wanted: '',
    wishes_tags: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm((f: typeof form) => ({ ...f, [k]: v }))

  const toggleTag = (tag: string) => setForm(f => ({
    ...f,
    wishes_tags: f.wishes_tags.includes(tag)
      ? f.wishes_tags.filter(t => t !== tag)
      : [...f.wishes_tags, tag],
  }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const c = await clientsApi.create({
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        status: form.status,
        purchase_power: form.purchase_power,
        budget_min: form.budget_min ? Number(form.budget_min) : 0,
        budget_max: form.budget_max ? Number(form.budget_max) : 0,
        rooms_wanted: form.rooms_wanted ? Number(form.rooms_wanted) : 0,
        area_wanted: form.area_wanted ? Number(form.area_wanted) : 0,
        wishes_tags: form.wishes_tags,
      })
      onCreated(c.id)
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/clients" className="text-slate-500 hover:text-slate-800"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-slate-900">Новый клиент</h1>
      </div>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Имя *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Иванов Иван Иванович" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+7 (928) 000-00-00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="client@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="new">Новый</option>
              <option value="warm">Тёплый</option>
              <option value="hot">Горячий</option>
              <option value="cold">Холодный</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Платёжеспособность</label>
            <select value={form.purchase_power} onChange={e => set('purchase_power', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Низкая">Низкая</option>
              <option value="Средняя">Средняя</option>
              <option value="Высокая">Высокая</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Бюджет min, ₽</label>
            <input type="number" value={form.budget_min} onChange={e => set('budget_min', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="3000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Бюджет max, ₽</label>
            <input type="number" value={form.budget_max} onChange={e => set('budget_max', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="7000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Комнат</label>
            <input type="number" min="1" max="10" value={form.rooms_wanted} onChange={e => set('rooms_wanted', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Площадь, м²</label>
            <input type="number" value={form.area_wanted} onChange={e => set('area_wanted', e.target.value)}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="60" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Пожелания по инфраструктуре</label>
            <div className="flex flex-wrap gap-2">
              {WISHES_TAGS.map(tag => (
                <button type="button" key={tag.key} onClick={() => toggleTag(tag.key)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${form.wishes_tags.includes(tag.key) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Сохранение...' : 'Создать клиента'}
        </button>
      </form>
    </div>
  )
}

function StatusDropdown({ client, onUpdate }: { client: Client; onUpdate: (c: Client) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const cur = STATUS_OPTIONS.find(s => s.value === client.status) ?? STATUS_OPTIONS[0]

  const change = async (val: Client['status']) => {
    setOpen(false)
    if (val === client.status) return
    setSaving(true)
    try {
      const updated = await clientsApi.update(client.id, { ...client, status: val })
      onUpdate(updated)
    } finally { setSaving(false) }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} disabled={saving}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${cur.color}`}>
        {cur.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-28">
          {STATUS_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => change(opt.value)}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors ${opt.color.includes('text') ? opt.color.split(' ')[1] : ''}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SelectionModal({ client, onClose, onCreated }: {
  client: Client
  onClose: () => void
  onCreated: () => void
}) {
  const [allProps, setAllProps] = useState<Property[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    propertiesApi.list({ status: 'free' }).then(setAllProps)
  }, [])

  const toggle = (id: number) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const create = async () => {
    if (selected.length === 0) return
    setSaving(true)
    try {
      await selectionsApi.create({ client_id: client.id, property_ids: selected })
      onCreated()
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Создать подборку для {client.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {allProps.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Нет свободных объектов</div>
          ) : allProps.map(p => (
            <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.includes(p.id) ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)}
                className="w-4 h-4 accent-indigo-600" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{p.title}</div>
                <div className="text-xs text-slate-500 truncate">{p.address}</div>
              </div>
              <div className="text-sm font-semibold text-slate-700 flex-shrink-0">
                {(p.price / 1_000_000).toFixed(1)}M
              </div>
            </label>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 flex items-center gap-3">
          <span className="text-sm text-slate-500">{selected.length} выбрано</span>
          <button onClick={create} disabled={saving || selected.length === 0}
            className="ml-auto bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? 'Создание...' : 'Создать подборку'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [note, setNote] = useState('')
  const [noteChannel, setNoteChannel] = useState<'call' | 'whatsapp' | 'note' | 'email' | 'visit'>('note')
  const [tab, setTab] = useState<'info' | 'match' | 'history'>('info')
  const [sending, setSending] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSelection, setShowSelection] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const isNew = id === 'new'
  const numId = isNew ? NaN : Number(id)

  const load = async () => {
    if (isNew || isNaN(numId)) return
    try {
      const c = await clientsApi.get(numId)
      setClient(c)
    } catch { navigate('/clients') }
  }

  const loadMatch = async () => {
    if (isNew || isNaN(numId)) return
    const m = await clientsApi.match(numId)
    setMatches(m.sort((a, b) => b.match.score - a.match.score))
  }

  useEffect(() => { load() }, [numId, isNew])
  useEffect(() => { if (tab === 'match') loadMatch() }, [tab, numId])

  const sendNote = async () => {
    if (!note.trim() || isNaN(numId)) return
    setSending(true)
    await clientsApi.addInteraction(numId, { channel: noteChannel, direction: 'out', text: note })
    setNote('')
    await load()
    setSending(false)
  }

  const deleteClient = async () => {
    if (isNaN(numId)) return
    setDeleting(true)
    setDeleteError('')
    try {
      await clientsApi.delete(numId)
      navigate('/clients')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Не удалось удалить клиента')
      setDeleting(false)
    }
  }

  if (isNew) return <ClientForm onCreated={newId => navigate(`/clients/${newId}`)} />
  if (!client) return <div className="text-slate-400 p-8 text-center">Загрузка...</div>

  const interactions: Interaction[] = [...(client.interactions ?? [])].reverse()

  return (
    <div className="space-y-5">
      {showSelection && (
        <SelectionModal client={client} onClose={() => setShowSelection(false)} onCreated={() => {}} />
      )}

      <div className="flex items-center gap-3">
        <Link to="/clients" className="text-slate-500 hover:text-slate-800"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <StatusDropdown client={client} onUpdate={setClient} />
            <span className="text-sm text-slate-500">{client.purchase_power}</span>
          </div>
        </div>
        <button onClick={() => setShowSelection(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
          <ListChecks className="w-4 h-4" />
          Подборка
        </button>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">Удалить клиента?</span>
            <button onClick={deleteClient} disabled={deleting}
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

      <div className="flex gap-1 border-b border-slate-200">
        {[{ key: 'info', label: 'Профиль' }, { key: 'match', label: 'Подбор' }, { key: 'history', label: 'История' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Контакты</h3>
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href={`tel:${client.phone}`} className="text-slate-700">{client.phone}</a>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${client.email}`} className="text-slate-700">{client.email}</a>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h3 className="font-semibold text-slate-900">Пожелания</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">Комнат:</span> <span className="font-medium">{client.rooms_wanted || '—'}</span></div>
              <div><span className="text-slate-500">Площадь:</span> <span className="font-medium">{client.area_wanted ? `${client.area_wanted} м²` : '—'}</span></div>
              <div><span className="text-slate-500">Бюджет min:</span> <span className="font-medium">{client.budget_min > 0 ? `${(client.budget_min / 1e6).toFixed(1)}M ₽` : '—'}</span></div>
              <div><span className="text-slate-500">Бюджет max:</span> <span className="font-medium">{client.budget_max > 0 ? `${(client.budget_max / 1e6).toFixed(1)}M ₽` : '—'}</span></div>
            </div>
            {(client.wishes_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {client.wishes_tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'match' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Загрузка подбора...</div>
          ) : (
            matches.map(({ property, match }) => (
              <div key={property.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <MatchCard match={match} compact />
                  <div className="flex-1">
                    <Link to={`/properties/${property.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {property.title}
                    </Link>
                    <div className="text-sm text-slate-500 mt-0.5">{property.address}</div>
                    <div className="text-sm font-semibold text-slate-800 mt-1">
                      {(property.price / 1e6).toFixed(2)} млн ₽
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.rows.slice(0, 2).map((row, i) => (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                          row.status === 'ok' ? 'bg-emerald-50 text-emerald-700' :
                          row.status === 'warn' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                        }`}>{row.text}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
            <select value={noteChannel} onChange={e => setNoteChannel(e.target.value as typeof noteChannel)}
              className="border border-slate-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="note">📝 Заметка</option>
              <option value="call">📞 Звонок</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="email">✉️ Email</option>
              <option value="visit">🏠 Визит</option>
            </select>
            <input value={note} onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendNote()}
              placeholder="Добавить заметку..."
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={sendNote} disabled={!note.trim() || sending}
              className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>

          {interactions.length === 0 ? (
            <div className="text-slate-400 text-center py-8">Нет истории взаимодействий</div>
          ) : (
            <div className="space-y-2">
              {interactions.map(interaction => (
                <div key={interaction.id} className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
                  <span className="text-xl">{CHANNEL_ICONS[interaction.channel] ?? '💬'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-700 capitalize">{interaction.channel}</span>
                      <span className="text-xs text-slate-400">{fmtDate(interaction.created_at)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${interaction.direction === 'in' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                        {interaction.direction === 'in' ? 'входящий' : 'исходящий'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{interaction.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
