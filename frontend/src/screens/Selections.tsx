import { useEffect, useState } from 'react'
import { selectionsApi, propertiesApi } from '../api/client'
import type { Property, Selection } from '../types'
import { Link } from 'react-router-dom'
import { ExternalLink, Plus } from 'lucide-react'

export default function Selections() {
  const [selections, setSelections] = useState<Selection[]>([])
  const [allProps, setAllProps] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([selectionsApi.list(), propertiesApi.list()]).then(([sels, props]) => {
      setSelections(sels)
      setAllProps(props)
    }).finally(() => setLoading(false))
  }, [])

  const getProp = (id: number) => allProps.find(p => p.id === id)

  const publicURL = (token: string) =>
    `${window.location.origin}/s/${token}`

  if (loading) {
    return <div className="text-slate-400 text-center py-12">Загрузка...</div>
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Подборки</h1>
          <p className="text-sm text-slate-500">{selections.length} подборок</p>
        </div>
      </div>

      {selections.length === 0 ? (
        <div className="text-slate-400 text-center py-12">Подборок пока нет</div>
      ) : (
        <div className="space-y-4">
          {selections.map(sel => (
            <div key={sel.id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Подборка #{sel.id} для клиента #{sel.client_id}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(sel.created_at).toLocaleDateString('ru-RU')} · {sel.property_ids?.length ?? 0} объектов
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={publicURL(sel.public_token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Открыть
                  </a>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-3">
                {(sel.property_ids ?? []).map(propId => {
                  const p = getProp(propId)
                  return p ? (
                    <Link
                      key={propId}
                      to={`/properties/${p.id}`}
                      className="text-xs bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2 py-1 rounded transition-colors"
                    >
                      {p.title}
                    </Link>
                  ) : (
                    <span key={propId} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      #{propId}
                    </span>
                  )
                })}
              </div>

              {(sel.feedbacks ?? []).length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-medium text-slate-600 mb-2">Реакции клиента</div>
                  <div className="flex gap-3 flex-wrap">
                    {sel.feedbacks!.map(fb => (
                      <div key={fb.id} className="flex items-center gap-1.5 text-sm">
                        <span>{fb.reaction === 'up' ? '👍' : '👎'}</span>
                        <span className="text-slate-600">#{fb.property_id}</span>
                        {fb.comment && <span className="text-slate-400 text-xs">— {fb.comment}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-400 font-mono truncate">
                  Ссылка: {publicURL(sel.public_token)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
