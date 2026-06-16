export interface Organization {
  id: number
  name: string
  created_at: string
}

export interface User {
  id: number
  organization_id: number
  name: string
  email: string
  role: 'admin' | 'head' | 'agent'
  created_at: string
}

export interface Client {
  id: number
  organization_id: number
  name: string
  phone: string
  email: string
  budget_min: number
  budget_max: number
  rooms_wanted: number
  area_wanted: number
  pref_lat: number
  pref_lng: number
  wishes_tags: string[]
  purchase_power: 'Высокая' | 'Средняя' | 'Низкая'
  status: 'new' | 'warm' | 'hot' | 'cold'
  last_contact_at: string | null
  created_at: string
  interactions?: Interaction[]
}

export interface Property {
  id: number
  organization_id: number
  title: string
  type: 'sale' | 'rent'
  address: string
  lat: number
  lng: number
  area: number
  rooms: number
  price: number
  price_per_m2: number
  ready_date: string
  installment: boolean
  promo: string
  status: 'free' | 'booked' | 'sold'
  cover_url: string
  description: string
  tags: string[]
  created_at: string
}

export interface Deal {
  id: number
  organization_id: number
  client_id: number
  property_id: number
  manager_id: number
  type: 'sale' | 'purchase' | 'rent'
  stage: 'new' | 'view' | 'booking' | 'contract' | 'paid' | 'lost'
  amount: number
  notes: string
  created_at: string
  updated_at: string
  client?: Client
  property?: Property
}

export interface Interaction {
  id: number
  client_id: number
  channel: 'call' | 'whatsapp' | 'email' | 'visit' | 'note' | 'auto' | 'api'
  direction: 'in' | 'out'
  text: string
  created_at: string
}

export interface Selection {
  id: number
  client_id: number
  property_ids: number[]
  public_token: string
  created_at: string
  feedbacks?: SelectionFeedback[]
}

export interface SelectionFeedback {
  id: number
  selection_id: number
  property_id: number
  reaction: 'up' | 'down'
  comment: string
  created_at: string
}

export interface NearbyPlace {
  type: 'school' | 'kinder' | 'shop' | 'transport' | 'park'
  name: string
  dist: number
  lat: number
  lng: number
}

export interface MatchRow {
  status: 'ok' | 'warn' | 'bad'
  text: string
}

export interface MatchResult {
  score: number
  rows: MatchRow[]
}

export interface MatchItem {
  property: Property
  match: MatchResult
}

export interface ApiKey {
  id: number
  organization_id: number
  name: string
  key_prefix: string
  scopes: string[]
  created_at: string
}
