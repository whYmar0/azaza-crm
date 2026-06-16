import { useEffect, useRef, useState } from 'react'
import type { NearbyPlace } from '../types'

interface MapPanelProps {
  lat: number
  lng: number
  nearby?: NearbyPlace[]
}

declare global {
  interface Window {
    mapgl?: {
      Map: new (container: HTMLElement | string, options: object) => MapInstance
      Marker: new (map: MapInstance, options: object) => MarkerInstance
    }
  }
}

interface MapInstance {
  destroy(): void
}
interface MarkerInstance {
  destroy(): void
}

const TWOGIS_KEY = import.meta.env.VITE_TWOGIS_KEY || 'adca2f24-661a-4a2a-a21c-8784c14c8765'

export const poiColors: Record<string, string> = {
  school:    '#4f46e5',
  kinder:    '#10b981',
  shop:      '#f59e0b',
  transport: '#3b82f6',
  park:      '#84cc16',
}

const poiLabels: Record<string, string> = {
  school:    'Школа',
  kinder:    'Дет. сад',
  shop:      'Магазин',
  transport: 'Транспорт',
  park:      'Парк',
}

const poiEmoji: Record<string, string> = {
  school: '🏫', kinder: '🧸', shop: '🛒', transport: '🚌', park: '🌳',
}

function distLabel(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`
}

function StaticMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <svg viewBox="0 0 400 256" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="256" fill="#f1f5f9" />
      <rect x="0" y="120" width="400" height="8" fill="#e2e8f0" />
      <rect x="192" y="0" width="8" height="256" fill="#e2e8f0" />
      <rect x="60" y="60" width="80" height="50" rx="4" fill="#e2e8f0" />
      <rect x="260" y="80" width="70" height="40" rx="4" fill="#e2e8f0" />
      <rect x="150" y="150" width="100" height="60" rx="4" fill="#e2e8f0" />
      <circle cx="200" cy="128" r="14" fill="#4f46e5" />
      <circle cx="200" cy="122" r="6" fill="white" />
      <circle cx="200" cy="138" r="2" fill="#4f46e5" />
      <text x="200" y="172" textAnchor="middle" fontSize="11" fill="#64748b">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </text>
    </svg>
  )
}

export default function MapPanel({ lat, lng, nearby = [] }: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !lat || !lng) return

    const init = () => {
      if (!window.mapgl) return
      try {
        if (mapRef.current) { mapRef.current.destroy(); mapRef.current = null }

        const map = new window.mapgl.Map(containerRef.current!, {
          center: [lng, lat],
          zoom: 15,
          key: TWOGIS_KEY,
        })
        mapRef.current = map
        setMapReady(true)

        setTimeout(() => {
          try {
            if (!mapRef.current || !window.mapgl) return
            const redPin = [
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 50" width="34" height="50">',
              '<path d="M17 0C7.6 0 0 7.6 0 17c0 9.4 17 33 17 33s17-23.6 17-33C34 7.6 26.4 0 17 0z" fill="#ef4444"/>',
              '<circle cx="17" cy="17" r="7" fill="white"/>',
              '</svg>',
            ].join('')
            const iconUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(redPin)
            new window.mapgl.Marker(map, {
              coordinates: [lng, lat],
              icon: iconUrl,
              size: [34, 50],
              anchor: [0.5, 1],
            })
          } catch (e) { console.warn('marker error', e) }
        }, 800)
      } catch {
        setMapFailed(true)
      }
    }

    if (window.mapgl) {
      init()
    } else {
      let attempts = 0
      const interval = setInterval(() => {
        attempts++
        if (window.mapgl) { clearInterval(interval); init() }
        else if (attempts > 20) { clearInterval(interval); setMapFailed(true) }
      }, 300)
      return () => clearInterval(interval)
    }
    return () => { mapRef.current?.destroy(); mapRef.current = null }
  }, [lat, lng, nearby])

  const legendTypes = [...new Set(nearby.map(p => p.type))]
  const sorted = [...nearby].sort((a, b) => a.dist - b.dist)

  return (
    <div className="space-y-3">
      <div className="w-full h-64 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative" style={{ minHeight: 256 }}>
        <div ref={containerRef} className="absolute inset-0" />
        {(mapFailed || (!mapReady && !window.mapgl)) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <StaticMap lat={lat} lng={lng} />
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-slate-700">Что рядом</h4>
          {sorted.map((place, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-base leading-none">{poiEmoji[place.type] ?? '📍'}</span>
              <span className="text-slate-500 text-xs w-20 flex-shrink-0">{poiLabels[place.type] ?? place.type}</span>
              <span className="text-slate-800 truncate flex-1">{place.name}</span>
              <span className="text-slate-400 text-xs flex-shrink-0">{distLabel(place.dist)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
