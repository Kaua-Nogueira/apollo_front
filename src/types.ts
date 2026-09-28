export type Status = 'scheduled' | 'confirmed' | 'traveling' | 'arrived' | 'in_service' | 'awaiting_approval' | 'completed' | 'cancelled'

export interface User { id: number; name: string; email: string; role: 'admin' | 'technician'; employee?: Employee }
export interface Employee { id: number; name: string; phone?: string; specialty?: string; active: boolean; user?: User }
export interface Address { id: number; label: string; street: string; number: string; district: string; city: string; state: string; zip_code?: string }
export interface Equipment { id: number; location: string; type: string; brand?: string; model?: string; btus?: number; serial_number?: string; refrigerant_gas?: string; next_maintenance_at?: string }
export interface Customer { id: number; name: string; document?: string; phone: string; whatsapp?: string; email?: string; active: boolean; addresses?: Address[]; equipment?: Equipment[]; work_orders_count?: number }
export interface Appointment { id: number; scheduled_at: string; duration_minutes: number; type: string; status: Status; notes?: string; customer: Customer; address: Address; technician?: Employee; equipment?: Equipment; work_order?: WorkOrder }
export interface WorkOrderItem { id: number; name: string; quantity: number; unit_price: number; discount: number; total: number }
export interface WorkOrderEvent { id: number; from_status?: Status; to_status: Status; occurred_at: string; notes?: string }
export interface Payment { id: number; amount: number; method: string; paid_at: string }
export interface Attachment { id: number; category: string; path: string; mime_type?: string; size?: number }
export interface WorkOrder { id: number; number: string; status: Status; scheduled_at: string; problem_reported?: string; diagnosis?: string; solution?: string; recommendations?: string; notes?: string; total: number; received: number; balance: number; customer: Customer; address: Address; technician?: Employee; equipment?: Equipment; services?: WorkOrderItem[]; products?: WorkOrderItem[]; payments?: Payment[]; attachments?: Attachment[]; status_history?: WorkOrderEvent[] }
export interface DashboardData { metrics: { appointments_today: number; completed_today: number; in_progress: number; technicians_working: number; revenue_today: number; revenue_month: number; receivable: number; overdue: number }; upcoming: Appointment[]; preventive_due: number; low_stock: number }

