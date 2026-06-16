import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi } from '../api/client'
import type { Property, Selection, SelectionFeedback } from '../types'
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'

function fmtPrice(p: Property) {
  if (p.type === 'rent') return `${p.price.toLocaleString('ru-RU')} ₽/мес`
  return `${(p.price / 1_000_000).toFixed(2)} млн ₽`
}

export default function PublicSelection() {
  const { token } = useParams<{ token: string }>()
  const [selection, setSelection] = useState<Selection | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [reactions, setReactions] = useState<Record<number, 'up' | 'down'>>({})
  const [comments, setComments] = useState<Record<number, string>>({})
  const [sent, setSent] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    publicApi.getSelection(token).then(data => {
      setSelection(data.selection)
      setProperties(data.properties ?? [])
      const existingReactions: Record<number, 'up' | 'down'> = {}
      const existingSent = new Set<number>()
      for (const fb of data.selection.feedbacks ?? []) {
        existingReactions[fb.property_id] = fb.reaction as 'up' | 'down'
        existingSent.add(fb.property_id)
      }
      setReactions(existingReactions)
      setSent(existingSent)
    }).finally(() => setLoading(false))
  }, [token])

  const sendFeedback = async (propertyId: number) => {
    if (!token || !reactions[propertyId]) return
    await publicApi.addFeedback(token, {
      property_id: propertyId,
      reaction: reactions[propertyId],
      comment: comments[propertyId] ?? '',
    })
    setSent(prev => new Set(prev).add(propertyId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!selection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-xl font-bold text-slate-900">Подборка не найдена</h1>
          <p className="text-slate-500 mt-1">Проверьте ссылку у вашего агента</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Ваша подборка объектов</h1>
          <p className="text-slate-500 text-sm mt-1">
            {properties.length} объектов · оцените каждый
          </p>
        </div>

        <div className="space-y-4">
          {properties.map(prop => (
            <div key={prop.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="mb-3">
                <h3 className="font-semibold text-slate-900">{prop.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{prop.address}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4 bg-slate-50 rounded-lg p-3">
                <div>
                  <div className="font-bold text-slate-900">{fmtPrice(prop)}</div>
                  <div className="text-xs text-slate-500">цена</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">{prop.rooms} комн.</div>
                  <div className="text-xs text-slate-500">комнат</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">{prop.area} м²</div>
                  <div className="text-xs text-slate-500">площадь</div>
                </div>
              </div>

              {prop.promo && (
                <div className="mb-3 text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg">
                  {prop.promo}
                </div>
              )}

              {sent.has(prop.id) ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Ваша реакция отправлена {reactions[prop.id] === 'up' ? '👍' : '👎'}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReactions(r => ({ ...r, [prop.id]: 'up' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                        reactions[prop.id] === 'up'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:border-emerald-300'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Нравится
                    </button>
                    <button
                      onClick={() => setReactions(r => ({ ...r, [prop.id]: 'down' }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                        reactions[prop.id] === 'down'
                          ? 'border-red-400 bg-red-50 text-red-600'
                          : 'border-slate-200 text-slate-600 hover:border-red-300'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Не нравится
                    </button>
                  </div>

                  {reactions[prop.id] && (
                    <div className="space-y-2">
                      <input
                        value={comments[prop.id] ?? ''}
                        onChange={e => setComments(c => ({ ...c, [prop.id]: e.target.value }))}
                        placeholder="Комментарий (необязательно)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => sendFeedback(prop.id)}
                        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Отправить реакцию
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8 text-xs text-slate-400">
          HomeMatch CRM · подбор объектов по образу жизни
        </div>
      </div>
    </div>
  )
}
