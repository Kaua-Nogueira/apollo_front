export type Status = 'scheduled' | 'confirmed' | 'traveling' | 'arrived' | 'in_service' | 'awaiting_approval' | 'completed' | 'cancelled'

export interface User { id: number; name: string; email: string; role: 'admin' | 'technician' | 'employee'; employee?: Employee }

export interface PontoEntry {
  id: number
  type: 'clock_in' | 'clock_out' | string
  time: string
  occurred_at: string
  notes?: string
}

export interface PontoHistoryDay {
  date: string
  entries_count: number
  first_time?: string
  last_time?: string
  last_type?: string
  entries: PontoEntry[]
}

export interface PontoData {
  selected_date: string
  month: string
  day_entries: PontoEntry[]
  dates_with_entries: string[]
  clock_status: 'off' | 'working' | 'completed'
  next_action: 'clock_in' | 'clock_out'
  next_action_label: string
  recent_history: PontoHistoryDay[]
  month_stats: {
    days_worked: number
    total_entries: number
  }
  employee: {
    id: number
    name: string
    specialty?: string
  }
}
export interface Employee { id: number; name: string; phone?: string; specialty?: string; active: boolean; user?: User }
export interface Address { id: number; label: string; street?: string | null; number: string; district?: string | null; city?: string | null; state?: string | null; zip_code?: string | null }
export interface Equipment { id: number; location: string; type: string; brand?: string; model?: string; btus?: number; serial_number?: string; refrigerant_gas?: string; next_maintenance_at?: string }
export interface Customer { id: number; name: string; contact_name?: string; document?: string; phone: string; whatsapp?: string; email?: string; notes?: string; active: boolean; addresses?: Address[]; equipment?: Equipment[]; work_orders_count?: number }
export interface Appointment { id: number; scheduled_at: string; duration_minutes: number; type: string; status: Status; notes?: string; customer: Customer; address: Address; technician?: Employee; equipment?: Equipment; work_order?: WorkOrder }
export interface WorkOrderItem { id: number; name: string; quantity: number; unit_price: number; discount: number; total: number }
export interface WorkOrderEvent { id: number; from_status?: Status; to_status: Status; occurred_at: string; notes?: string }
export interface Payment { id: number; amount: number; method: string; paid_at: string }
export interface Attachment { id: number; category: string; path: string; mime_type?: string; size?: number }
export type DocumentType = 'quote' | 'receipt'
export interface BusinessDocumentItem { id?: number; key?: string; name: string; quantity: number; unit_price: number; total?: number }
export interface BusinessDocument {
  id: number
  type: DocumentType
  number: string
  customer_id?: number | null
  work_order_id?: number | null
  customer_name: string
  customer_document?: string
  customer_phone?: string
  customer_email?: string
  customer_address?: string
  issued_at: string
  valid_until?: string
  payment_method?: string
  status?: string
  subtotal: number
  discount: number
  total: number
  notes?: string
  work_order?: { id: number; number: string; total?: number; status?: string }
  customer?: Customer
  items: BusinessDocumentItem[]
}

export interface WorkOrder {
  id: number
  number: string
  status: Status
  scheduled_at: string
  problem_reported?: string
  diagnosis?: string
  solution?: string
  recommendations?: string
  notes?: string
  subtotal?: number
  discount?: number
  total: number
  received: number
  balance: number
  customer: Customer
  address: Address
  technician?: Employee
  equipment?: Equipment
  services?: WorkOrderItem[]
  products?: WorkOrderItem[]
  payments?: Payment[]
  attachments?: Attachment[]
  status_history?: WorkOrderEvent[]
  documents?: BusinessDocument[]
}
export interface DashboardData { metrics: { appointments_today: number; completed_today: number; in_progress: number; technicians_working: number; revenue_today: number; revenue_month: number; receivable: number; overdue: number }; upcoming: Appointment[]; preventive_due: number; low_stock: number }

