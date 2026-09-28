import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  AirVent, ArrowRight, Banknote, Bell, Box, CalendarDays, Check, ChevronRight, CircleDollarSign,
  ClipboardList, Clock3, Gauge, History, Home, LogOut, MapPin, Menu, Package, PanelLeftClose, PanelLeftOpen, Plus, Search,
  Settings, ShieldCheck, Sparkles, Trash2, UserRound, Users, Wrench, X,
} from 'lucide-react'
import { api, ApiError } from './api'
import { SystemAlert } from './SystemAlert'
import type { Appointment, Customer, DashboardData, Employee, Status, User, WorkOrder } from './types'
import { AgendaPageV2, CatalogPage, CustomerDetail, EquipmentDetail, EquipmentPage, FinancePage, OperationsPage, QuotesPage, RoutesVehiclesPage, TeamPage } from './Modules'
import { DocumentsPage } from './DocumentsPage'
import { SettingsPageV2 } from './SettingsPageV2'

const statusLabels: Record<Status, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', traveling: 'Em deslocamento', arrived: 'No local',
  in_service: 'Em atendimento', awaiting_approval: 'Aguardando aprovação', completed: 'Concluído', cancelled: 'Cancelado',
}

const money = (value: number | string = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
const dateTime = (value: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const time = (value: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const todayInput = new Date().toISOString().slice(0, 10)
const todayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
const currentWeekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date())
const currentDayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(new Date())

function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status-${status}`}><span />{statusLabels[status]}</span>
}

function Button({ children, kind = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button-${kind} ${className}`} {...props}>{children}</button>
}

function Empty({ icon = <ClipboardList />, title, text }: { icon?: ReactNode; title: string; text: string }) {
  return <div className="empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>
}

function Loading() { return <div className="loading"><span /><span /><span /></div> }

function ConfirmDialog({ title, children, confirmLabel, busy, onClose, onConfirm }: { title: string; children: ReactNode; confirmLabel: string; busy?: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="modal-layer"><button className="modal-backdrop" onClick={onClose} aria-label="Fechar" /><section className="modal confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title"><div className="modal-header"><div className="modal-heading"><span className="modal-symbol confirm-symbol"><Trash2 /></span><div><p className="eyebrow">CONFIRMAÇÃO</p><h2 id="confirm-dialog-title">{title}</h2></div></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X /></button></div><div className="confirm-dialog-body">{children}</div><div className="modal-actions"><Button type="button" kind="ghost" onClick={onClose}>Cancelar</Button><Button type="button" kind="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Excluindo...' : confirmLabel}</Button></div></section></div>
}

function useRemote<T>(path: string, initial: T) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = async () => { setLoading(true); setError(''); try { setData(await api.get<T>(path)) } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao carregar') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [path])
  return { data, loading, error, reload: load }
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('admin@apollo.com.br')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
      localStorage.setItem('apollo.token', result.token); localStorage.setItem('apollo.user', JSON.stringify(result.user)); onLogin(result.user)
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Não foi possível entrar.') } finally { setBusy(false) }
  }
  return <main className="login-page">
    <section className="login-brand">
      <div className="brand brand-large"><span><AirVent /></span> Apollo</div>
      <div className="brand-copy"><p>Operação em movimento</p><h1>Do primeiro chamado ao pagamento, tudo no lugar.</h1><div className="brand-points"><span><Check /> Agenda e equipe em tempo real</span><span><Check /> Histórico completo por equipamento</span><span><Check /> Jornada simples para o técnico</span></div></div>
      <div className="brand-glow" />
    </section>
    <section className="login-panel">
      <form className="login-card" onSubmit={submit}>
        <div className="mobile-brand"><AirVent /> Apollo</div>
        <p className="eyebrow">ÁREA SEGURA</p><h2>Bem-vindo de volta</h2><p className="muted">Acesse a operação da sua equipe.</p>
        <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <SystemAlert>{error}</SystemAlert>}
        <Button disabled={busy}>{busy ? 'Entrando...' : 'Entrar no sistema'} <ArrowRight size={18} /></Button>
        <div className="demo-hint"><ShieldCheck size={17} /><span>Demo: admin@apollo.com.br<br />Senha: password</span></div>
      </form>
    </section>
  </main>
}

const navItems = [
  ['/', 'Visão geral', Gauge], ['/central', 'Central do dia', Sparkles], ['/agenda', 'Agenda', CalendarDays], ['/ordens', 'Ordens de serviço', ClipboardList],
  ['/clientes', 'Clientes', Users], ['/equipamentos', 'Equipamentos', AirVent], ['/catalogo', 'Serviços e produtos', Package], ['/financeiro', 'Financeiro', CircleDollarSign],
  ['/documentos', 'Orçamentos e recibos', Banknote], ['/operacoes', 'Estoque e operação', Box], ['/rotas', 'Rotas e veículos', MapPin], ['/equipe', 'Equipe e ponto', Clock3], ['/configuracoes', 'Configurações', Settings],
] as const

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('apollo.sidebar') === 'collapsed')
  const [notice, setNotice] = useState('')
  const technicianNav = [['/tecnico', 'Minha agenda', CalendarDays], ['/ordens', 'Minhas ordens', ClipboardList]] as const
  const navigation = user.role === 'technician' ? technicianNav : navItems
  const toggleSidebar = () => setCollapsed(value => { const next = !value; localStorage.setItem('apollo.sidebar', next ? 'collapsed' : 'expanded'); return next })
  return <div className={`shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand-row"><div className="brand"><span><AirVent /></span><b>Apollo</b></div><button className="sidebar-collapse" onClick={toggleSidebar} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button></div><button className="close-menu" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button>
      <nav>{navigation.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} title={collapsed ? label : undefined}><Icon /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-user"><div className="avatar">{user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div><div className="sidebar-user-copy"><strong>{user.name}</strong><span>{user.role === 'admin' ? 'Administrador' : 'Técnico'}</span></div><button onClick={onLogout} aria-label="Sair" title="Sair"><LogOut /></button></div>
    </aside>
    {open && <button className="overlay" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
    <section className="main-area">
      <header className="topbar"><button className="menu-button" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button><div className="topbar-date"><span>{currentWeekday}</span><strong>{currentDayMonth}</strong></div><div className="topbar-actions"><button onClick={() => setNotice('Você não tem novas notificações.')} aria-label="Notificações"><Bell /></button></div></header>
      {notice && <div className="toast-region"><SystemAlert tone="info" onDismiss={() => setNotice('')}>{notice}</SystemAlert></div>}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/central" element={<DayCenter />} />
        <Route path="/agenda" element={<AgendaPageV2 />} />
        <Route path="/clientes" element={<Customers />} />
        <Route path="/clientes/:id" element={<CustomerDetail />} />
        <Route path="/equipamentos" element={<EquipmentPage />} />
        <Route path="/equipamentos/:id" element={<EquipmentDetail />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/financeiro" element={<FinancePage />} />
        <Route path="/orcamentos" element={<QuotesPage />} />
        <Route path="/documentos" element={<DocumentsPage />} />
        <Route path="/operacoes" element={<OperationsPage />} />
        <Route path="/rotas" element={<RoutesVehiclesPage />} />
        <Route path="/equipe" element={<TeamPage />} />
        <Route path="/configuracoes" element={<SettingsPageV2 />} />
        <Route path="/ordens" element={<Orders />} />
        <Route path="/ordens/nova" element={<NewOrder />} />
        <Route path="/ordens/:id" element={<OrderDetail />} />
        <Route path="/tecnico" element={<TechnicianHome user={user} />} />
        <Route path="*" element={<ModulePlaceholder />} />
      </Routes>
    </section>
    <nav className="bottom-nav">{user.role === 'technician' ? <><NavLink to="/tecnico"><Home /><span>Hoje</span></NavLink><NavLink to="/ordens"><ClipboardList /><span>Minhas OS</span></NavLink></> : <><NavLink to="/"><Home /><span>Início</span></NavLink><NavLink to="/central"><CalendarDays /><span>Agenda</span></NavLink><NavLink to="/ordens"><ClipboardList /><span>OS</span></NavLink><NavLink to="/clientes"><Users /><span>Clientes</span></NavLink></>}</nav>
  </div>
}

function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div><div className="page-actions">{children}</div></div>
}

function Dashboard() {
  const { data, loading, error } = useRemote<DashboardData>('/dashboard', { metrics: { appointments_today: 0, completed_today: 0, in_progress: 0, technicians_working: 0, revenue_today: 0, revenue_month: 0, receivable: 0, overdue: 0 }, upcoming: [], preventive_due: 0, low_stock: 0 })
  const cards = [
    ['Atendimentos hoje', data.metrics.appointments_today, CalendarDays, 'blue'], ['Concluídos', data.metrics.completed_today, Check, 'green'],
    ['Em andamento', data.metrics.in_progress, Wrench, 'orange'], ['A receber', money(data.metrics.receivable), Banknote, 'purple'],
  ] as const
  return <main className="content"><PageHeader eyebrow="VISÃO GERAL" title="Bom dia, Kauã"><NavLink className="button button-secondary" to="/central">Abrir central do dia <ArrowRight /></NavLink></PageHeader>
    {error && <SystemAlert>{error}</SystemAlert>}{loading ? <Loading /> : <>
      <section className="metric-grid">{cards.map(([label, value, Icon, color]) => <article className="metric-card" key={label}><div className={`metric-icon ${color}`}><Icon /></div><div><span>{label}</span><strong>{value}</strong></div><small>Atualizado agora</small></article>)}</section>
      <section className="dashboard-grid"><article className="panel schedule-panel"><div className="panel-title"><div><p className="eyebrow">OPERAÇÃO</p><h2>Próximos atendimentos</h2></div><NavLink to="/central">Ver agenda <ChevronRight /></NavLink></div>
        <div className="schedule-list">{data.upcoming.length ? data.upcoming.map(item => <NavLink to={item.work_order ? `/ordens/${item.work_order.id}` : '/central'} className="schedule-row" key={item.id}><time>{time(item.scheduled_at)}</time><div className="timeline-mark" /><div className="schedule-info"><strong>{item.customer.name}</strong><span><MapPin /> {item.address.district} · {item.type}</span></div><div className="schedule-tech"><span className="mini-avatar">{item.technician?.name?.[0] ?? '?'}</span>{item.technician?.name ?? 'Sem técnico'}</div><StatusBadge status={item.status} /><ChevronRight className="row-arrow" /></NavLink>) : <Empty title="Agenda livre" text="Não há atendimentos próximos." />}</div>
      </article><aside className="right-stack"><article className="revenue-card"><div><p>Faturamento do mês</p><strong>{money(data.metrics.revenue_month)}</strong><span>Recebido no período</span></div><div className="revenue-ring"><span>{Math.min(99, Math.round(data.metrics.revenue_month / 400))}%</span></div></article>
        <article className="panel alert-panel"><div className="panel-title"><h2>Atenção</h2></div><NavLink to="/equipamentos"><span className="alert-icon"><AirVent /></span><div><strong>{data.preventive_due} manutenções próximas</strong><small>Equipamentos para contato</small></div><ChevronRight /></NavLink><NavLink to="/catalogo"><span className="alert-icon warm"><Box /></span><div><strong>{data.low_stock} itens com estoque baixo</strong><small>Reposição recomendada</small></div><ChevronRight /></NavLink></article>
      </aside></section>
    </>}</main>
}

function DayCenter({ agenda = false }: { agenda?: boolean }) {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayInput); const [status, setStatus] = useState(''); const [search, setSearch] = useState('')
  const path = `/appointments?date=${date}${status ? `&status=${status}` : ''}`
  const { data, loading, error } = useRemote<Appointment[]>(path, [])
  const filtered = data.filter(x => x.customer.name.toLowerCase().includes(search.toLowerCase()))
  return <main className="content"><PageHeader eyebrow="OPERAÇÃO EM TEMPO REAL" title={agenda ? 'Agenda' : 'Central do dia'}><Button onClick={() => navigate('/agenda')}><Plus /> Novo atendimento</Button></PageHeader>
    <div className="filters"><label className="search"><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente" /></label><input aria-label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} /><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="icon-button"><CalendarDays /></button></div>
    {error && <SystemAlert>{error}</SystemAlert>}{loading ? <Loading /> : <section className="day-board"><div className="day-summary"><div><span>Rota do dia</span><strong>{filtered.length} atendimentos</strong></div><div className="day-avatars">{[...new Set(filtered.map(x => x.technician?.name).filter(Boolean))].map(name => <span key={name}>{name?.[0]}</span>)}</div></div>
      <div className="day-list">{filtered.map(item => <article className="day-item" key={item.id}><div className="day-time"><strong>{time(item.scheduled_at)}</strong><span>{item.duration_minutes} min</span></div><div className={`day-line line-${item.status}`}><span /></div><div className="day-content"><div className="day-main"><div><h3>{item.customer.name}</h3><p><MapPin /> {item.address.district}, {item.address.city}</p></div><StatusBadge status={item.status} /></div><div className="day-meta"><span><Wrench /> {item.type}</span><span><UserRound /> {item.technician?.name ?? 'Não atribuído'}</span>{item.equipment && <span><AirVent /> {item.equipment.brand} {item.equipment.btus?.toLocaleString('pt-BR')} BTUs</span>}</div></div><button className="more-button" onClick={() => navigate(item.work_order ? `/ordens/${item.work_order.id}` : '/agenda')} aria-label={`Abrir atendimento de ${item.customer.name}`}><ChevronRight /></button></article>)}{!filtered.length && <Empty title="Nenhum atendimento" text="Ajuste os filtros ou crie um novo agendamento." />}</div>
    </section>}</main>
}

function Customers() {
  const [search, setSearch] = useState(''); const [modal, setModal] = useState(false); const [errorMessage, setErrorMessage] = useState('')
  const { data, loading, error, reload } = useRemote<Customer[]>('/customers', [])
  const filtered = data.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.phone?.includes(search))
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setErrorMessage(''); const form = new FormData(event.currentTarget)
    try { await api.post('/customers', Object.fromEntries(form)); setModal(false); await reload() } catch (e) { setErrorMessage(e instanceof Error ? e.message : 'Erro ao salvar') }
  }
  return <main className="content"><PageHeader eyebrow="RELACIONAMENTO" title="Clientes"><Button onClick={() => setModal(true)}><Plus /> Novo cliente</Button></PageHeader>
    <div className="toolbar"><label className="search"><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome ou telefone" /></label><span>{filtered.length} clientes</span></div>
    {error && <SystemAlert>{error}</SystemAlert>}{loading ? <Loading /> : <section className="panel table-panel"><div className="data-table"><div className="table-head customer-grid"><span>Cliente</span><span>Contato</span><span>Endereços</span><span>Equipamentos</span><span>OS</span><span /></div>{filtered.map(customer => <NavLink to={`/clientes/${customer.id}`} className="table-row customer-grid" key={customer.id}><div className="customer-name"><span className="avatar soft">{customer.name[0]}</span><div><strong>{customer.name}</strong><small>{customer.document || 'Documento não informado'}</small></div></div><div><strong>{customer.phone}</strong><small>{customer.email}</small></div><span>{customer.addresses?.length ?? 0}</span><span>{customer.equipment?.length ?? 0}</span><span>{customer.work_orders_count ?? 0}</span><span className="icon-button"><ChevronRight /></span></NavLink>)}</div></section>}
    {modal && <div className="modal-layer"><button className="modal-backdrop" onClick={() => setModal(false)} aria-label="Fechar" /><form className="modal" onSubmit={create}><div className="modal-header"><div><p className="eyebrow">CADASTRO</p><h2>Novo cliente</h2></div><button type="button" className="icon-button" onClick={() => setModal(false)}><X /></button></div><div className="form-grid"><label className="span-2">Nome completo ou razão social<input name="name" required /></label><label>CPF/CNPJ<input name="document" /></label><label>Telefone<input name="phone" required /></label><label>WhatsApp<input name="whatsapp" /></label><label>E-mail<input name="email" type="email" /></label><label className="span-2">Observações<textarea name="notes" rows={3} /></label></div>{errorMessage && <SystemAlert>{errorMessage}</SystemAlert>}<div className="modal-actions"><Button type="button" kind="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button>Salvar cliente</Button></div></form></div>}
  </main>
}

function Orders() {
  const [status, setStatus] = useState(''); const [search, setSearch] = useState(''); const [creating, setCreating] = useState(false)
  const { data, loading, error } = useRemote<WorkOrder[]>(`/work-orders${status ? `?status=${status}` : ''}`, [])
  const filtered = data.filter(x => x.number.toLowerCase().includes(search.toLowerCase()) || x.customer.name.toLowerCase().includes(search.toLowerCase()))
  const active = filtered.filter(order => ['traveling', 'arrived', 'in_service', 'awaiting_approval'].includes(order.status)).length
  const completed = filtered.filter(order => order.status === 'completed').length
  const openBalance = filtered.reduce((sum, order) => sum + Number(order.balance), 0)
  return <main className="content orders-page"><PageHeader eyebrow="NÚCLEO OPERACIONAL" title="Ordens de serviço"><Button className="orders-create-button" onClick={() => setCreating(true)}><Plus /> Nova OS</Button></PageHeader>
    <section className="order-summary-strip"><article><span>Total de ordens</span><strong>{filtered.length}</strong><small>no filtro atual</small></article><article className="summary-active"><span>Em operação</span><strong>{active}</strong><small>exigem acompanhamento</small></article><article className="summary-completed"><span>Concluídas</span><strong>{completed}</strong><small>serviços finalizados</small></article><article className="summary-balance"><span>Saldo em aberto</span><strong>{money(openBalance)}</strong><small>a receber</small></article></section>
    <div className="filters order-filters"><label className="search"><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por OS ou cliente" /></label><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    {error && <SystemAlert>{error}</SystemAlert>}{loading ? <Loading /> : <section className="order-cards">{filtered.map(order => <NavLink to={`/ordens/${order.id}`} className={`order-card order-card-${order.status}`} key={order.id}><div className="order-card-accent" /><div className="order-top"><div><span>{order.number}</span><h3>{order.customer.name}</h3></div><StatusBadge status={order.status} /></div><p className="order-problem">{order.problem_reported || 'Atendimento técnico sem descrição informada.'}</p><div className="order-details"><span><CalendarDays /> {dateTime(order.scheduled_at)}</span><span><MapPin /> {order.address.district}, {order.address.city}</span><span><UserRound /> {order.technician?.name ?? 'Sem técnico atribuído'}</span></div><div className="order-footer"><div><small>Valor total</small><strong>{money(order.total)}</strong></div><div><small>{order.balance > 0 ? 'Saldo pendente' : 'Pagamento'}</small><strong className={order.balance > 0 ? 'text-warn' : 'text-ok'}>{order.balance > 0 ? money(order.balance) : 'Quitado'}</strong></div><span className="order-open"><ChevronRight /></span></div></NavLink>)}{!filtered.length && <Empty title="Nenhuma ordem encontrada" text="Crie uma OS ou altere os filtros." />}</section>}{creating && <NewOrderForm onClose={() => setCreating(false)} />}</main>
}

function NewOrderForm({ onClose, standalone = false }: { onClose: () => void; standalone?: boolean }) {
  const navigate = useNavigate()
  const { data: customers } = useRemote<Customer[]>('/customers', [])
  const { data: employees } = useRemote<Employee[]>('/employees', [])
  const { data: services } = useRemote<Array<{ id: number; name: string; default_price: number }>>('/services', [])
  const [customerId, setCustomerId] = useState(''); const [serviceLines, setServiceLines] = useState<Array<{ id: string; quantity: string; price: string }>>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const customer = customers.find(item => item.id === Number(customerId)); const selectedServiceLines = serviceLines.filter(line => line.id); const serviceTotal = selectedServiceLines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.price) || 0), 0)
  const addServiceLine = () => setServiceLines(lines => [...lines, { id: '', quantity: '1', price: '' }])
  const updateServiceLine = (index: number, changes: Partial<{ id: string; quantity: string; price: string }>) => setServiceLines(lines => lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...changes } : line))
  const removeServiceLine = (index: number) => setServiceLines(lines => lines.filter((_, lineIndex) => lineIndex !== index))
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setError(''); const fields = new FormData(event.currentTarget)
    try { const created = await api.post<WorkOrder>('/work-orders', { customer_id: Number(fields.get('customer_id')), address_id: Number(fields.get('address_id')), equipment_id: fields.get('equipment_id') ? Number(fields.get('equipment_id')) : null, technician_id: fields.get('technician_id') ? Number(fields.get('technician_id')) : null, scheduled_at: fields.get('scheduled_at'), problem_reported: fields.get('problem_reported'), notes: fields.get('notes'), services: serviceLines.filter(line => line.id).map(line => ({ service_id: Number(line.id), quantity: Number(line.quantity), unit_price: Number(line.price), discount: 0 })) }); navigate(`/ordens/${created.id}`) } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível criar a OS.') } finally { setBusy(false) }
  }
  const form = <form className={`modal order-form-modal ${standalone ? 'order-form-standalone' : ''}`} onSubmit={submit}>
    <div className="modal-header order-form-header"><div className="modal-heading"><span className="modal-symbol"><ClipboardList /></span><div><p className="eyebrow">NOVA ORDEM DE SERVIÇO</p><h2>Organize o atendimento</h2><small>Preencha o essencial agora. O restante pode ser atualizado durante o serviço.</small></div></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar"><X /></button></div>
    <div className="order-form-progress"><div className="active"><span>1</span><div><strong>Cliente</strong><small>Local e equipamento</small></div></div><i /><div className={customerId ? 'active' : ''}><span>2</span><div><strong>Atendimento</strong><small>Agenda e responsável</small></div></div><i /><div className={customerId && selectedServiceLines.length ? 'active' : ''}><span>3</span><div><strong>Confirmar</strong><small>Revise e crie a OS</small></div></div></div>
    <div className="order-form-layout"><div className="order-form-fields">
      <section className="order-form-section"><div className="order-section-title"><span><UserRound /></span><div><h3>Cliente e local</h3><p>Vincule a ordem ao cadastro e ao equipamento correto.</p></div></div><div className="form-grid"><label className="span-2">Cliente <em>obrigatório</em><select name="customer_id" required value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Selecione um cliente</option>{customers.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Endereço<select name="address_id" required disabled={!customer}><option value="">{customer ? 'Selecione o local' : 'Escolha o cliente primeiro'}</option>{customer?.addresses?.map(item => <option value={item.id} key={item.id}>{item.label} · {item.district}</option>)}</select></label><label>Equipamento<select name="equipment_id" disabled={!customer}><option value="">Sem equipamento vinculado</option>{customer?.equipment?.map(item => <option value={item.id} key={item.id}>{item.brand} {item.btus?.toLocaleString('pt-BR')} BTUs · {item.location}</option>)}</select></label></div></section>
      <section className="order-form-section"><div className="order-section-title"><span><CalendarDays /></span><div><h3>Planejamento do atendimento</h3><p>Defina quando, quem e quais serviços serão executados.</p></div></div><div className="form-grid"><label>Data e hora <em>obrigatório</em><input name="scheduled_at" type="datetime-local" required defaultValue={`${todayInput}T14:00`} /></label><label>Técnico responsável<select name="technician_id"><option value="">Atribuir depois</option>{employees.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div className="service-selector span-2"><div className="service-selector-head"><label>Serviços iniciais <small>Adicione um ou mais serviços</small></label><button type="button" className="service-add-button" onClick={addServiceLine}><Plus /> Adicionar serviço</button></div>{serviceLines.length ? <div className="service-lines">{serviceLines.map((line, index) => <div className="service-line" key={`${index}-${line.id}`}><select aria-label={`Serviço ${index + 1}`} value={line.id} required onChange={e => { const selected = services.find(item => item.id === Number(e.target.value)); updateServiceLine(index, { id: e.target.value, price: selected ? String(selected.default_price) : '' }) }}><option value="">Selecione o serviço</option>{services.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select><input aria-label={`Quantidade do serviço ${index + 1}`} type="number" min="0.01" step="0.01" value={line.quantity} onChange={e => updateServiceLine(index, { quantity: e.target.value })} /><input aria-label={`Valor do serviço ${index + 1}`} type="number" min="0" step="0.01" value={line.price} placeholder="Valor" onChange={e => updateServiceLine(index, { price: e.target.value })} /><button type="button" className="icon-button service-remove" onClick={() => removeServiceLine(index)} aria-label="Remover serviço"><X /></button></div>)}</div> : <div className="service-empty"><Wrench /> Nenhum serviço adicionado ainda.</div>}</div><label className="span-2">Problema relatado <em>obrigatório</em><textarea name="problem_reported" rows={3} required placeholder="Ex.: equipamento liga, mas não refrigera e apresenta ruído..." /></label><label className="span-2">Observações internas <small>Opcional — visível apenas para a equipe</small><textarea name="notes" rows={2} placeholder="Acesso ao local, contato alternativo ou orientação para o técnico" /></label></div></section>
    </div><aside className="order-form-summary"><p className="eyebrow">RESUMO DA OS</p><h3>{customer?.name ?? 'Cliente não selecionado'}</h3><div className="order-summary-placeholder"><span><MapPin /></span><p>{customer ? `${customer.addresses?.length ?? 0} local(is) disponível(is)` : 'Escolha um cliente para liberar endereço e equipamento.'}</p></div><dl><div><dt>Serviços iniciais</dt><dd>{selectedServiceLines.length ? `${selectedServiceLines.length} selecionado(s)` : 'A definir'}</dd></div><div><dt>Valor previsto</dt><dd>{selectedServiceLines.length ? money(serviceTotal) : '—'}</dd></div><div><dt>Status inicial</dt><dd><span className="summary-status">Agendada</span></dd></div></dl>{selectedServiceLines.length > 0 && <div className="order-summary-services">{selectedServiceLines.map((line, index) => <span key={`${index}-${line.id}`}>{services.find(item => item.id === Number(line.id))?.name ?? 'Serviço pendente'}</span>)}</div>}<div className="order-summary-tip"><ShieldCheck /><span>A OS será criada com histórico e poderá receber itens, fotos e pagamentos.</span></div></aside></div>
    {error && <div className="order-form-error"><SystemAlert>{error}</SystemAlert></div>}<div className="modal-actions order-form-actions"><Button type="button" kind="ghost" onClick={onClose}>Cancelar</Button><Button disabled={busy}>{busy ? 'Criando ordem...' : 'Criar ordem de serviço'} <ArrowRight /></Button></div>
  </form>
  return standalone ? form : <div className="modal-layer"><button className="modal-backdrop" onClick={onClose} aria-label="Fechar" />{form}</div>
}

function NewOrder() {
  const navigate = useNavigate()
  return <main className="content order-create-page"><button className="back-link" onClick={() => navigate('/ordens')}>← Voltar para ordens</button><NewOrderForm standalone onClose={() => navigate('/ordens')} /></main>
}

function OrderDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const { data: order, loading, error, reload } = useRemote<WorkOrder | null>(`/work-orders/${id}`, null); const { data: services } = useRemote<Array<{ id: number; name: string; default_price: number }>>('/services', []); const { data: products } = useRemote<Array<{ id: number; name: string; sale_price: number; stock: number }>>('/products', []); const [busy, setBusy] = useState(false); const [modal, setModal] = useState<'notes' | 'item' | 'payment' | 'photo' | null>(null); const [formError, setFormError] = useState(''); const [confirmDelete, setConfirmDelete] = useState(false)
  const transition = async (action: string) => { setBusy(true); try { await api.post(`/work-orders/${id}/transition`, { action }); await reload() } finally { setBusy(false) } }
  const saveNotes = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setFormError(''); try { await api.put(`/work-orders/${id}`, Object.fromEntries(new FormData(event.currentTarget))); setModal(null); await reload() } catch (e) { setFormError(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { setBusy(false) } }
  const addItem = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setFormError(''); const form = new FormData(event.currentTarget); const type = String(form.get('type')); try { await api.post(`/work-orders/${id}/${type === 'service' ? 'services' : 'products'}`, { [`${type}_id`]: Number(form.get('item_id')), quantity: Number(form.get('quantity')), unit_price: Number(form.get('unit_price')), discount: Number(form.get('discount') || 0) }); setModal(null); await reload() } catch (e) { setFormError(e instanceof Error ? e.message : 'Não foi possível adicionar o item.') } finally { setBusy(false) } }
  const registerPayment = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setFormError(''); try { const form = new FormData(event.currentTarget); await api.post(`/work-orders/${id}/payments`, { amount: Number(form.get('amount')), method: form.get('method'), paid_at: form.get('paid_at') || undefined, notes: form.get('notes') || undefined }); setModal(null); await reload() } catch (e) { setFormError(e instanceof Error ? e.message : 'Não foi possível registrar o pagamento.') } finally { setBusy(false) } }
  const uploadPhoto = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setFormError(''); try { const form = new FormData(event.currentTarget); await api.upload(`/work-orders/${id}/attachments`, form); setModal(null); await reload() } catch (e) { setFormError(e instanceof Error ? e.message : 'Não foi possível enviar a foto.') } finally { setBusy(false) } }
  const deleteOrder = async () => { if (!id) return; setBusy(true); try { await api.delete(`/work-orders/${id}`); navigate('/ordens') } catch (e) { setFormError(e instanceof Error ? e.message : 'Não foi possível excluir a OS.'); setConfirmDelete(false) } finally { setBusy(false) } }
  if (loading) return <main className="content"><Loading /></main>; if (error || !order) return <main className="content"><SystemAlert>{error || 'OS não encontrada'}</SystemAlert></main>
  const next: Partial<Record<Status, [string, string]>> = { scheduled: ['start_travel', 'Iniciar deslocamento'], confirmed: ['start_travel', 'Iniciar deslocamento'], traveling: ['arrive', 'Cheguei ao cliente'], arrived: ['start_service', 'Iniciar serviço'], in_service: ['complete', 'Finalizar serviço'] }
  const address = `${order.address.street}, ${order.address.number}, ${order.address.district}, ${order.address.city}`
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const whatsapp = order.customer.whatsapp || order.customer.phone
  const workflow: Array<{ status: Status; label: string }> = [{ status:'scheduled', label:'Agendada' }, { status:'traveling', label:'Deslocamento' }, { status:'arrived', label:'No local' }, { status:'in_service', label:'Em serviço' }, { status:'completed', label:'Concluída' }]
  const workflowStatus: Status = order.status === 'confirmed' ? 'scheduled' : order.status === 'awaiting_approval' ? 'in_service' : order.status
  const workflowIndex = workflow.findIndex(step => step.status === workflowStatus)
  return <main className="content order-detail-page"><button className="back-link" onClick={() => navigate(-1)}>← Voltar para ordens</button><PageHeader eyebrow={order.number} title={order.customer.name}><div className="order-header-actions"><StatusBadge status={order.status} /><Button kind="danger" onClick={() => setConfirmDelete(true)}><Trash2 /> Excluir OS</Button></div></PageHeader>
    <section className={`order-progress ${order.status === 'cancelled' ? 'is-cancelled' : ''}`}>{order.status === 'cancelled' ? <div className="cancelled-progress"><X /> Ordem cancelada</div> : workflow.map((step, index) => <div className={index < workflowIndex ? 'done' : index === workflowIndex ? 'current' : ''} key={step.status}><span>{index < workflowIndex ? <Check /> : index + 1}</span><small>{step.label}</small></div>)}</section>
    <section className="order-layout"><div className="order-main"><article className="panel detail-hero"><div><p>Atendimento</p><h2>{order.problem_reported || 'Atendimento técnico'}</h2><span><MapPin /> {address}</span><div className="contact-row"><a href={`tel:${order.customer.phone}`}>Ligar</a>{whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>}<a href={mapUrl} target="_blank" rel="noreferrer">Abrir no mapa</a></div></div>{next[order.status] && <Button className="big-action" disabled={busy} onClick={() => transition(next[order.status]![0])}>{next[order.status]![1]} <ArrowRight /></Button>}</article>
      <article className="panel"><div className="panel-title"><h2>Diagnóstico e execução</h2><Button kind="ghost" onClick={() => setModal('notes')}>Editar</Button></div><div className="detail-grid"><div><span>Problema relatado</span><p>{order.problem_reported || 'Não informado'}</p></div><div><span>Diagnóstico técnico</span><p>{order.diagnosis || 'Aguardando preenchimento'}</p></div><div><span>Solução realizada</span><p>{order.solution || 'Aguardando preenchimento'}</p></div><div><span>Recomendações</span><p>{order.recommendations || 'Nenhuma recomendação'}</p></div></div></article>
      <article className="panel"><div className="panel-title"><h2>Itens da OS</h2><Button kind="secondary" onClick={() => setModal('item')}><Plus /> Adicionar item</Button></div><div className="items-table">{[...(order.services ?? []), ...(order.products ?? [])].map(item => <div key={`${item.name}-${item.id}`}><span>{item.quantity}×</span><strong>{item.name}</strong><span>{money(item.unit_price)}</span><b>{money(item.total)}</b></div>)}{!(order.services?.length || order.products?.length) && <Empty title="Nenhum item" text="Adicione serviços e produtos utilizados." />}</div><div className="total-row"><span>Total da ordem</span><strong>{money(order.total)}</strong></div></article>
      <article className="panel"><div className="panel-title"><h2>Fotos do atendimento</h2><Button kind="ghost" onClick={() => setModal('photo')}><Plus /> Enviar foto</Button></div><div className="attachment-list">{order.attachments?.length ? order.attachments.map(file => <div key={file.id}><span>{file.category}</span><a href={`/storage/${file.path}`} target="_blank" rel="noreferrer">Abrir foto</a></div>) : <p className="muted panel-padding">Registre fotos antes, durante ou depois do serviço.</p>}</div></article></div>
      <aside className="order-aside"><article className="panel"><h2>Resumo</h2><dl><div><dt>Técnico</dt><dd>{order.technician?.name ?? 'Não atribuído'}</dd></div><div><dt>Agendado</dt><dd>{dateTime(order.scheduled_at)}</dd></div><div><dt>Recebido</dt><dd className="text-ok">{money(order.received)}</dd></div><div><dt>Saldo</dt><dd className="text-warn">{money(order.balance)}</dd></div></dl>{order.balance > 0 && <Button className="full" onClick={() => setModal('payment')}><Banknote /> Registrar pagamento</Button>}</article><article className="panel"><div className="panel-title"><h2>Linha do tempo</h2><History /></div><div className="history-list">{order.status_history?.map(event => <div key={event.id}><span className={`history-dot line-${event.to_status}`} /><div><strong>{statusLabels[event.to_status]}</strong><small>{dateTime(event.occurred_at)}</small></div></div>)}</div></article></aside></section>
    {modal === 'notes' && <div className="modal-layer"><button className="modal-backdrop" onClick={() => setModal(null)} aria-label="Fechar" /><form className="modal" onSubmit={saveNotes}><div className="modal-header"><h2>Diagnóstico e execução</h2><button className="icon-button" type="button" onClick={() => setModal(null)}><X /></button></div><div className="form-grid"><label className="span-2">Diagnóstico<textarea name="diagnosis" defaultValue={order.diagnosis} rows={3} /></label><label className="span-2">Solução realizada<textarea name="solution" defaultValue={order.solution} rows={3} /></label><label className="span-2">Recomendações<textarea name="recommendations" defaultValue={order.recommendations} rows={2} /></label><label className="span-2">Observações internas<textarea name="notes" defaultValue={order.notes} rows={2} /></label></div>{formError && <SystemAlert>{formError}</SystemAlert>}<div className="modal-actions"><Button type="button" kind="ghost" onClick={() => setModal(null)}>Cancelar</Button><Button disabled={busy}>Salvar</Button></div></form></div>}
    {modal === 'item' && <div className="modal-layer"><button className="modal-backdrop" onClick={() => setModal(null)} aria-label="Fechar" /><form className="modal" onSubmit={addItem}><div className="modal-header"><h2>Adicionar item</h2><button className="icon-button" type="button" onClick={() => setModal(null)}><X /></button></div><ItemFields services={services} products={products} />{formError && <SystemAlert>{formError}</SystemAlert>}<div className="modal-actions"><Button type="button" kind="ghost" onClick={() => setModal(null)}>Cancelar</Button><Button disabled={busy}>Adicionar</Button></div></form></div>}
    {modal === 'payment' && <div className="modal-layer"><button className="modal-backdrop" onClick={() => setModal(null)} aria-label="Fechar" /><form className="modal" onSubmit={registerPayment}><div className="modal-header"><h2>Registrar pagamento</h2><button className="icon-button" type="button" onClick={() => setModal(null)}><X /></button></div><div className="form-grid"><label>Valor<input name="amount" required type="number" min="0.01" max={order.balance} step="0.01" defaultValue={order.balance} /></label><label>Forma<select name="method"><option value="pix">PIX</option><option value="cash">Dinheiro</option><option value="credit_card">Cartão de crédito</option><option value="debit_card">Cartão de débito</option><option value="transfer">Transferência</option><option value="bank_slip">Boleto</option></select></label><label>Data<input name="paid_at" type="datetime-local" /></label><label className="span-2">Observação<input name="notes" /></label></div>{formError && <SystemAlert>{formError}</SystemAlert>}<div className="modal-actions"><Button type="button" kind="ghost" onClick={() => setModal(null)}>Cancelar</Button><Button disabled={busy}>Confirmar</Button></div></form></div>}
    {modal === 'photo' && <div className="modal-layer"><button className="modal-backdrop" onClick={() => setModal(null)} aria-label="Fechar" /><form className="modal" onSubmit={uploadPhoto}><div className="modal-header"><h2>Adicionar foto</h2><button className="icon-button" type="button" onClick={() => setModal(null)}><X /></button></div><div className="form-grid"><label>Categoria<select name="category"><option value="before">Antes do serviço</option><option value="during">Durante o serviço</option><option value="after">Depois do serviço</option><option value="equipment">Equipamento</option><option value="problem">Problema</option><option value="other">Outro</option></select></label><label>Imagem<input name="photo" type="file" accept="image/*" required /></label></div>{formError && <SystemAlert>{formError}</SystemAlert>}<div className="modal-actions"><Button type="button" kind="ghost" onClick={() => setModal(null)}>Cancelar</Button><Button disabled={busy}>Enviar foto</Button></div></form></div>}
    {confirmDelete && <ConfirmDialog title="Excluir esta ordem de serviço?" confirmLabel="Excluir OS" busy={busy} onClose={() => setConfirmDelete(false)} onConfirm={() => void deleteOrder()}><p>Ela sairá da listagem operacional e ficará arquivada. Os dados relacionados não serão apagados definitivamente.</p><SystemAlert tone="info">Essa ação não pode ser desfeita pela tela atual.</SystemAlert></ConfirmDialog>}
  </main>
}

function ItemFields({ services, products }: { services: Array<{ id: number; name: string; default_price: number }>; products: Array<{ id: number; name: string; sale_price: number; stock: number }> }) {
  const [type, setType] = useState<'service' | 'product'>('service'); const items = type === 'service' ? services : products
  return <div className="form-grid"><label>Tipo<select name="type" value={type} onChange={e => setType(e.target.value as 'service' | 'product')}><option value="service">Serviço</option><option value="product">Produto</option></select></label><label>Item<select name="item_id" required>{items.map(item => <option key={item.id} value={item.id}>{item.name}{type === 'product' ? ` · estoque ${(item as { stock: number }).stock}` : ''}</option>)}</select></label><label>Quantidade<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label><label>Valor unitário<input name="unit_price" type="number" min="0" step="0.01" defaultValue={items[0] ? (type === 'service' ? (items[0] as { default_price: number }).default_price : (items[0] as { sale_price: number }).sale_price) : 0} required /></label><label>Desconto<input name="discount" type="number" min="0" step="0.01" defaultValue="0" /></label></div>
}

function TechnicianHome({ user }: { user: User }) {
  const { data, loading, error, reload } = useRemote<{ clock_status: string; appointments: Appointment[] }>('/technician/today', { clock_status: 'off', appointments: [] }); const [busy, setBusy] = useState(false)
  const clock = async (action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => { setBusy(true); try { await api.post('/time-entries/clock', { action }); await reload() } finally { setBusy(false) } }
  return <main className="content technician"><div className="tech-greeting"><div><p>Olá, {user.name.split(' ')[0]}</p><h1>Seu dia de trabalho</h1><span>{todayLabel}</span></div><span className="avatar">{user.name[0]}</span></div>{data.clock_status === 'off' ? <Button className="clock-button" onClick={() => clock('clock_in')} disabled={busy}><Clock3 /> Bater entrada<span>Registre o início do seu dia</span></Button> : data.clock_status === 'on_break' ? <Button className="clock-button working" onClick={() => clock('break_end')} disabled={busy}><Clock3 /> Retornar do intervalo<span>Jornada pausada</span></Button> : <div className="tech-clock-actions"><Button className="clock-button working" onClick={() => clock('break_start')} disabled={busy}><Clock3 /> Iniciar intervalo<span>Faça uma pausa na jornada</span></Button><Button kind="secondary" onClick={() => clock('clock_out')} disabled={busy}>Encerrar jornada</Button></div>}
    <div className="tech-section-title"><h2>Minha agenda</h2><span>{data.appointments.length} atendimentos</span></div>{error && <SystemAlert>{error}</SystemAlert>}{loading ? <Loading /> : <div className="tech-appointments">{data.appointments.map(item => <NavLink to={item.work_order ? `/ordens/${item.work_order.id}` : '/central'} key={item.id}><time>{time(item.scheduled_at)}</time><div><StatusBadge status={item.status} /><h3>{item.customer.name}</h3><span><MapPin /> {item.address.district}</span><p>{item.type}</p></div><ChevronRight /></NavLink>)}</div>}
  </main>
}

function ModulePlaceholder() { return <main className="content"><PageHeader eyebrow="MÓDULO PREPARADO" title="Em evolução" /><section className="panel"><Empty icon={<Wrench />} title="Estrutura pronta para o próximo ciclo" text="Este módulo já está previsto na navegação e no modelo de dados do MVP." /></section></main> }

export default function App() {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('apollo.user') ?? 'null') } catch { return null } })
  useEffect(() => {
    const invalidateSession = () => setUser(null)
    window.addEventListener('apollo:unauthorized', invalidateSession)
    return () => window.removeEventListener('apollo:unauthorized', invalidateSession)
  }, [])
  const logout = async () => { try { await api.post('/auth/logout') } catch { /* local logout still proceeds */ } localStorage.removeItem('apollo.token'); localStorage.removeItem('apollo.user'); setUser(null) }
  if (!user) return <Login onLogin={setUser} />
  if (user.role === 'technician' && location.pathname === '/') return <Navigate to="/tecnico" replace />
  return <Shell user={user} onLogout={logout} />
}

