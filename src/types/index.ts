// ============================================================
// Tipos globais do Studio Bella
// ============================================================

export type UserRole = 'admin' | 'professional' | 'client'

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'transfer'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'cancelled'

export type ServiceCategory = 'sobrancelha' | 'cilios' | 'combo' | 'outros'

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// ============================================================
// Database entities
// ============================================================

export interface Profile {
  id: string
  email: string
  name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  profile_id: string
  bio: string | null
  instagram: string | null
  active: boolean
  created_at: string
  profile?: Profile
}

export interface Service {
  id: string
  name: string
  description: string | null
  category: ServiceCategory
  duration_minutes: number
  price: number
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  profile_id: string | null
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  tags: string[] | null
  birth_date: string | null
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  client_id: string
  professional_id: string
  service_id: string
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus
  price: number
  notes: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  professional?: Professional
  service?: Service
  payment?: Payment
}

export interface Availability {
  id: string
  professional_id: string
  day_of_week: DayOfWeek
  start_time: string
  end_time: string
  active: boolean
}

export interface BlockedTime {
  id: string
  professional_id: string
  start_at: string
  end_at: string
  reason: string | null
}

export interface Payment {
  id: string
  appointment_id: string
  amount: number
  method: PaymentMethod | null
  status: PaymentStatus
  notes: string | null
  paid_at: string | null
  created_at: string
}

// ============================================================
// API Response types
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// ============================================================
// Dashboard / Analytics
// ============================================================

export interface DashboardStats {
  total_appointments_month: number
  total_revenue_month: number
  total_clients: number
  cancellation_rate: number
  appointments_today: number
  pending_appointments: number
}

export interface RevenueByDay {
  day: string
  revenue: number
  count: number
}

export interface ServiceBreakdown {
  service_name: string
  count: number
  revenue: number
  percentage: number
}

// ============================================================
// Booking flow
// ============================================================

export interface BookingFormData {
  service_id: string
  professional_id: string
  scheduled_at: string
  client_name: string
  client_email: string
  client_phone: string
  notes?: string
}

export interface TimeSlot {
  time: string          // "09:00"
  datetime: string      // ISO string
  available: boolean
}
