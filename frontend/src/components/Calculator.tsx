import { useState, useMemo } from 'react'

interface CalculatorProps {
  price: number
}

const MORTGAGE_RATE = 0.16
const ISLAMIC_MARKUP = 0.25

function fmtCur(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + ' млн ₽'
  if (n >= 1_000) return Math.round(n / 1_000) + ' тыс ₽'
  return Math.round(n) + ' ₽'
}

export default function Calculator({ price }: CalculatorProps) {
  const [mode, setMode] = useState<'mortgage' | 'islamic'>('mortgage')
  const [downPct, setDownPct] = useState(20)
  const [years, setYears] = useState(15)

  const mortgage = useMemo(() => {
    const down = price * (downPct / 100)
    const principal = price - down
    const n = years * 12
    const r = MORTGAGE_RATE / 12
    const monthly = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPay = monthly * n + down
    return { down, monthly, totalPay, overpay: totalPay - price }
  }, [price, downPct, years])

  const islamic = useMemo(() => {
    const down = price * (downPct / 100)
    const principal = price - down
    const totalCost = principal * (1 + ISLAMIC_MARKUP)
    const n = years * 12
    const monthly = totalCost / n
    const totalPay = monthly * n + down
    return { down, monthly, totalCost, totalPay, markup: totalCost - principal }
  }, [price, downPct, years])

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <h3 className="font-semibold text-slate-900">Калькулятор</h3>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setMode('mortgage')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'mortgage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Ипотека
        </button>
        <button
          onClick={() => setMode('islamic')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'islamic' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Рассрочка
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Первый взнос</span>
            <span className="font-medium text-slate-900">{downPct}% · {fmtCur(price * downPct / 100)}</span>
          </div>
          <input type="range" min={10} max={60} value={downPct}
            onChange={e => setDownPct(Number(e.target.value))}
            className="w-full accent-indigo-600" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600">Срок</span>
            <span className="font-medium text-slate-900">{years} лет</span>
          </div>
          <input type="range" min={1} max={30} value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="w-full accent-indigo-600" />
        </div>
      </div>

      {mode === 'mortgage' ? (
        <>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="bg-indigo-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">В месяц</span>
              <span className="text-lg font-bold text-indigo-700">{fmtCur(mortgage.monthly)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg px-3 py-2 flex flex-col">
                <span className="text-xs text-slate-500">Всего</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">{fmtCur(mortgage.totalPay)}</span>
              </div>
              <div className="bg-amber-50 rounded-lg px-3 py-2 flex flex-col">
                <span className="text-xs text-slate-500">Переплата</span>
                <span className="text-sm font-bold text-amber-700 mt-0.5">{fmtCur(mortgage.overpay)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Ставка {(MORTGAGE_RATE * 100).toFixed(0)}% · аннуитетный платёж</p>
        </>
      ) : (
        <>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="bg-emerald-50 rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">В месяц</span>
              <span className="text-lg font-bold text-emerald-700">{fmtCur(islamic.monthly)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg px-3 py-2 flex flex-col">
                <span className="text-xs text-slate-500">Всего</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5">{fmtCur(islamic.totalPay)}</span>
              </div>
              <div className="bg-teal-50 rounded-lg px-3 py-2 flex flex-col">
                <span className="text-xs text-slate-500">Наценка</span>
                <span className="text-sm font-bold text-teal-700 mt-0.5">{fmtCur(islamic.markup)}</span>
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-800 space-y-1">
            <div className="font-semibold">Исламская рассрочка (Мурабаха)</div>
            <div>Без процентов. Наценка {(ISLAMIC_MARKUP * 100).toFixed(0)}%. Сумма фиксирована: <strong>{fmtCur(islamic.totalCost)}</strong></div>
          </div>
        </>
      )}
    </div>
  )
}
