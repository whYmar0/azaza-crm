import { useEffect, useState } from 'react'
import { whatsappApi } from '../api/client'
import { MessageCircle, Link2, Link2Off, ExternalLink, Send, BadgeCheck } from 'lucide-react'

export default function WhatsAppPage() {
  const [connected, setConnected] = useState(false)
  const [displayPhone, setDisplayPhone] = useState('')
  const [verifiedName, setVerifiedName] = useState('')
  const [token, setToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const [testTo, setTestTo] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  useEffect(() => {
    whatsappApi.get().then(r => {
      setConnected(r.connected)
      setDisplayPhone(r.display_phone ?? '')
      setVerifiedName(r.verified_name ?? '')
    }).catch(() => {})
  }, [])

  const connect = async () => {
    if (!token.trim() || !phoneNumberId.trim()) return
    setConnecting(true)
    setError('')
    try {
      const r = await whatsappApi.connect(token.trim(), phoneNumberId.trim())
      setConnected(true)
      setDisplayPhone(r.display_phone)
      setVerifiedName(r.verified_name)
      setToken('')
      setPhoneNumberId('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка подключения')
    } finally { setConnecting(false) }
  }

  const disconnect = async () => {
    await whatsappApi.disconnect()
    setConnected(false)
    setDisplayPhone('')
    setVerifiedName('')
  }

  const sendTest = async () => {
    if (!testTo.trim() || !testMessage.trim()) return
    setSending(true)
    setSendResult('')
    try {
      await whatsappApi.sendTest(testTo.trim(), testMessage.trim())
      setSendResult('Сообщение отправлено')
      setTestMessage('')
    } catch (e: unknown) {
      setSendResult(e instanceof Error ? e.message : 'Ошибка отправки')
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">WhatsApp</h1>
          <p className="text-sm text-slate-500">Подключение через WhatsApp Business Cloud API (Meta)</p>
        </div>
      </div>

      {!connected ? (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number ID</label>
              <input
                value={phoneNumberId}
                onChange={e => setPhoneNumberId(e.target.value)}
                placeholder="109876543210123"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Access Token</label>
              <input
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="EAABwzLixnjYBO..."
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button onClick={connect} disabled={!token.trim() || !phoneNumberId.trim() || connecting}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                <Link2 className="w-4 h-4" />
                {connecting ? 'Подключение...' : 'Подключить'}
              </button>
              <button onClick={() => setShowGuide(v => !v)}
                className="text-sm text-indigo-600 hover:text-indigo-800 underline">
                {showGuide ? 'Скрыть инструкцию' : 'Где взять Phone Number ID и токен?'}
              </button>
            </div>
          </div>

          {showGuide && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 max-w-2xl space-y-5">
              <h3 className="font-semibold text-slate-900">Пошаговая инструкция</h3>

              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: 'Создайте Meta Developer App с продуктом WhatsApp',
                    desc: null,
                    link: { href: 'https://developers.facebook.com/apps', label: 'developers.facebook.com/apps' },
                    sub: [
                      'Нажмите «Создать приложение» → тип: «Бизнес»',
                      'В дашборде нажмите «Добавить продукт» → найдите «WhatsApp» → «Настройка»',
                    ],
                  },
                  {
                    step: 2,
                    title: 'Найдите Phone Number ID',
                    desc: 'В разделе WhatsApp → API Setup отображается тестовый номер от Meta и его «Phone number ID» — скопируйте его.',
                  },
                  {
                    step: 3,
                    title: 'Получите временный (или постоянный) токен',
                    desc: null,
                    sub: [
                      'В том же разделе API Setup есть «Temporary access token» — действует 24 часа, подходит для теста',
                      'Для постоянного токена: System Users в Meta Business Settings → создайте системного пользователя → выдайте права whatsapp_business_messaging → сгенерируйте токен без ограничения по времени',
                    ],
                  },
                  {
                    step: 4,
                    title: 'Добавьте получателя в тестовый список',
                    desc: 'Пока приложение не прошло App Review, сообщения можно отправлять только на номера, добавленные в список тестовых получателей (To field) в том же разделе API Setup.',
                  },
                  {
                    step: 5,
                    title: 'Вставьте Phone Number ID и токен выше',
                    desc: 'После подключения можно отправить тестовое сообщение прямо из этой страницы.',
                  },
                ].map(item => (
                  <div key={item.step} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{item.title}</div>
                      {item.desc && <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>}
                      {item.link && (
                        <a href={item.link.href} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-0.5">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {item.link.label}
                        </a>
                      )}
                      {item.sub && (
                        <ul className="mt-1 space-y-0.5 list-disc list-inside text-sm text-slate-600">
                          {item.sub.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Важно:</strong> Без App Review работает только тестовый номер Meta и только с заранее добавленными получателями. Для своего номера и рассылки всем клиентам нужно пройти верификацию бизнеса в Meta.
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1">
                  {verifiedName || displayPhone}
                  {verifiedName && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{displayPhone}</div>
              </div>
              <span className="ml-2 flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Подключён
              </span>
            </div>
            <button onClick={disconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors">
              <Link2Off className="w-4 h-4" />
              Отключить
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 max-w-xl">
            <h3 className="font-semibold text-slate-900">Тестовое сообщение</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Номер получателя</label>
              <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="79991234567"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Текст</label>
              <textarea value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={3}
                placeholder="Здравствуйте! Это тестовое сообщение из Nearby CRM."
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
            </div>
            {sendResult && <p className="text-sm text-slate-600">{sendResult}</p>}
            <button onClick={sendTest} disabled={!testTo.trim() || !testMessage.trim() || sending}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4" />
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
