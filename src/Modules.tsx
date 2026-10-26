import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { AirVent, AlertTriangle, Banknote, Box, CalendarDays, Car, Check, CheckCircle2, ChevronRight, Clock, LogIn, LogOut, MapPin, MessageCircle, Package, Pencil, Plus, ReceiptText, Route as RouteIcon, Search, ShieldCheck, Timer, Trash2, Users, Wrench, X } from 'lucide-react'
import { api } from './api'
import { SystemAlert } from './SystemAlert'
import { CustomerFormFields } from './CustomerFormFields'
import { validateRequiredFields } from './validation'
import type { Customer, Employee } from './types'

const cash = (value: number | string = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
const shortDate = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—'

export function resolveStorageUrl(url?: string | null): string {
  if (!url) return ''

  // 1. If it's localhost or 127.0.0.1 (local dev), normalize to relative /storage so Vite proxy handles it
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/storage\//i.test(url)) {
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/storage\//i, '/storage/')
  }

  // 2. If it's already an absolute URL (e.g. https://api.km5refrigeracoes.com.br/storage/...), keep it
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  // 3. If it's a relative path starting with /storage/:
  if (url.startsWith('/storage/')) {
    const apiUrl = import.meta.env.VITE_API_URL
    if (apiUrl && /^https?:\/\//i.test(apiUrl)) {
      try {
        const apiOrigin = new URL(apiUrl).origin
        return `${apiOrigin}${url}`
      } catch {
        // fallback to relative if invalid URL
      }
    }
    return url
  }

  return url
}

export function useData<T>(path: string, initial: T) {
  const [data, setData] = useState<T>(initial); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const reload = async () => { setLoading(true); setError(''); try { setData(await api.get<T>(path)) } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.') } finally { setLoading(false) } }
  useEffect(() => { void reload() }, [path])
  return { data, loading, error, reload }
}

export function Btn({ children, kind = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary'|'secondary'|'ghost'|'danger' }) { return <button className={`button button-${kind}`} {...props}>{children}</button> }
export function Header({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) { return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div><div className="page-actions">{children}</div></div> }
export function Notice({ text, tone = 'error' }: { text: string; tone?: 'error' | 'success' | 'info' }) { return <SystemAlert tone={tone}>{text}</SystemAlert> }
export function Loader() { return <div className="loading"><span /><span /><span /></div> }
export function Modal({
  title,
  eyebrow,
  subtitle,
  icon,
  children,
  onClose,
  maxWidth,
}: {
  title: string
  eyebrow?: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  onClose: () => void
  maxWidth?: number | string
}) {
  const titleLower = title.toLowerCase()
  const isDelete = titleLower.includes('excluir') || titleLower.includes('remover') || titleLower.includes('cancelar')

  let displayIcon = icon
  if (!displayIcon) {
    if (isDelete) displayIcon = <Trash2 />
    else if (titleLower.includes('editar')) displayIcon = <Pencil />
    else if (titleLower.includes('endereço')) displayIcon = <MapPin />
    else if (titleLower.includes('equipamento')) displayIcon = <AirVent />
    else if (titleLower.includes('cliente') || titleLower.includes('colaborador')) displayIcon = <Users />
    else if (titleLower.includes('atendimento') || titleLower.includes('agenda')) displayIcon = <CalendarDays />
    else if (titleLower.includes('saída') || titleLower.includes('pagamento') || titleLower.includes('receber') || titleLower.includes('caixa')) displayIcon = <Banknote />
    else if (titleLower.includes('jornada') || titleLower.includes('ponto')) displayIcon = <Clock />
    else if (titleLower.includes('serviço')) displayIcon = <Wrench />
    else if (titleLower.includes('produto')) displayIcon = <Package />
    else displayIcon = <Plus />
  }

  let displayEyebrow = eyebrow
  if (!displayEyebrow) {
    if (isDelete) displayEyebrow = 'CONFIRMAÇÃO / ATENÇÃO'
    else if (titleLower.includes('editar')) displayEyebrow = 'EDIÇÃO DE DADOS'
    else if (titleLower.includes('endereço')) displayEyebrow = 'LOCALIZAÇÃO'
    else if (titleLower.includes('equipamento')) displayEyebrow = 'EQUIPAMENTO TÉCNICO'
    else if (titleLower.includes('colaborador')) displayEyebrow = 'EQUIPE / RECURSOS HUMANOS'
    else if (titleLower.includes('cliente')) displayEyebrow = 'RELACIONAMENTO'
    else if (titleLower.includes('saída') || titleLower.includes('despesa') || titleLower.includes('pagamento')) displayEyebrow = 'FINANCEIRO'
    else if (titleLower.includes('atendimento') || titleLower.includes('agenda')) displayEyebrow = 'PLANEJAMENTO'
    else if (titleLower.includes('jornada') || titleLower.includes('ponto')) displayEyebrow = 'CONTROLE DE PONTO'
    else displayEyebrow = 'CADASTRO E GESTÃO'
  }

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" onClick={onClose} aria-label="Fechar" />
      <section
        className={`modal ${isDelete ? 'modal-danger' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={maxWidth ? { maxWidth } : undefined}
      >
        <div className="modal-header">
          <div className="modal-heading">
            <span className={`modal-symbol ${isDelete ? 'danger' : ''}`}>
              {displayIcon}
            </span>
            <div>
              <p className="eyebrow" style={isDelete ? { color: '#ef4444' } : undefined}>
                {displayEyebrow}
              </p>
              <h2>{title}</h2>
              {subtitle && <small>{subtitle}</small>}
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar" type="button">
            <X />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  )
}

function CustomerAddressForm({ busy, message, onSubmit, onCancel }: { busy: boolean; message: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const [zipCode, setZipCode] = useState('')
  const [zipLoading, setZipLoading] = useState(false)
  const [zipError, setZipError] = useState('')
  const [address, setAddress] = useState({ street: '', district: '', city: '', state: '' })
  const lookupZip = async () => {
    const digits = zipCode.replace(/\D/g, '')
    if (digits.length !== 8) return
    setZipLoading(true); setZipError('')
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!response.ok) throw new Error('Não foi possível consultar o CEP agora.')
      const result = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }
      if (result.erro) throw new Error('CEP não encontrado. Você pode preencher o endereço manualmente.')
      setAddress({ street: result.logradouro ?? '', district: result.bairro ?? '', city: result.localidade ?? '', state: result.uf ?? '' })
    } catch (error) {
      setZipError(error instanceof Error ? error.message : 'Falha ao consultar o CEP. Preencha o endereço manualmente.')
    } finally { setZipLoading(false) }
  }
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setZipError('')
    const val = validateRequiredFields(event.currentTarget)
    if (!val.valid) {
      setZipError(val.message)
      return
    }
    onSubmit(event)
  }
  return <form className="customer-address-form" onSubmit={handleFormSubmit} noValidate>
    <div className="customer-address-fields">
      <label className="span-2">CEP<input name="zip_code" inputMode="numeric" autoComplete="postal-code" maxLength={9} value={zipCode} onChange={event => { const digits = event.target.value.replace(/\D/g, '').slice(0, 8); setZipCode(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits) }} onBlur={() => void lookupZip()} placeholder="00000-000" /><small>{zipLoading ? 'Consultando CEP…' : 'Ao sair do campo, buscamos rua, bairro, cidade e estado.'}</small></label>
      <label className="span-2">Nome do endereço <em>obrigatório</em><input name="label" required placeholder="Casa, loja, escritório..." /></label>
      {zipError && <div className="span-2"><Notice text={zipError} /></div>}
      <label className="span-2">Rua<input name="street" value={address.street} onChange={event => setAddress({ ...address, street: event.target.value })} autoComplete="address-line1" /></label>
      <label>Número <em>obrigatório</em><input name="number" required placeholder="Nº" /></label>
      <label>Complemento<input name="complement" placeholder="Bloco, sala..." /></label>
      <label>Bairro<input name="district" value={address.district} onChange={event => setAddress({ ...address, district: event.target.value })} autoComplete="address-level3" /></label>
      <label>Cidade<input name="city" value={address.city} onChange={event => setAddress({ ...address, city: event.target.value })} autoComplete="address-level2" /></label>
      <label>Estado (UF)<input name="state" value={address.state} onChange={event => setAddress({ ...address, state: event.target.value.toUpperCase().slice(0, 2) })} autoComplete="address-level1" maxLength={2} /></label>
    </div>
    {message && <Notice text={message} />}
    <div className="modal-actions"><Btn kind="ghost" type="button" onClick={onCancel}>Cancelar</Btn><Btn disabled={busy || zipLoading}>{busy ? 'Salvando…' : 'Salvar endereço'}</Btn></div>
  </form>
}

type Equipment = { id:number; customer_id:number; location:string; type:string; brand?:string; model?:string; btus?:number; voltage?:string; serial_number?:string; refrigerant_gas?:string; maintenance_interval_months?:number; next_maintenance_at?:string; active:boolean; customer?:Customer; address?:{id:number;label:string;district:string;city:string}; work_orders?:Array<{id:number;number:string;scheduled_at:string;status:string;solution?:string}> }
type CatalogItem = { id:number; name:string; category?:string|null; description?:string|null; default_price?:number; estimated_cost?:number; average_minutes?:number; cost_price?:number; sale_price?:number; stock?:number; minimum_stock?:number; unit?:string; brand?:string|null; code?:string|null; active:boolean }
type Entry = { id:number; type:string; occurred_at:string; employee?:Employee; employee_id?:number; work_date?:string; adjusted?:boolean; notes?:string|null }

export function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: customer, loading, error, reload } = useData<Customer & { addresses: Array<{id:number;label:string;street?:string|null;number:string;district?:string|null;city?:string|null;state?:string|null}>; equipment: Equipment[] }>(`/customers/${id}`, {} as Customer & { addresses: []; equipment: [] })
  const [tab, setTab] = useState<'addresses'|'equipment'|'history'>('addresses')
  const [modal, setModal] = useState<'address'|'equipment'|'edit'|'delete'|null>(null)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'error'|'success'>('error')
  const [busy, setBusy] = useState(false)
  const equipment = customer.equipment as Equipment[] | undefined
  const report = (text: string, tone: 'error'|'success' = 'error') => { setMessage(text); setMessageTone(tone) }
  const submitAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setMessage('')
    try { await api.post(`/customers/${id}/addresses`, Object.fromEntries(f)); setModal(null); report('Endereço adicionado.', 'success'); await reload() }
    catch (err) { report(err instanceof Error ? err.message : 'Erro ao salvar') }
    finally { setBusy(false) }
  }
  const submitEquipment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMessage('')
    const val = validateRequiredFields(e.currentTarget)
    if (!val.valid) { report(val.message); return }
    const f = new FormData(e.currentTarget); setBusy(true)
    try { await api.post('/equipment', {...Object.fromEntries(f), customer_id:Number(id), address_id:Number(f.get('address_id')), btus:f.get('btus')?Number(f.get('btus')):null, maintenance_interval_months:f.get('maintenance_interval_months')?Number(f.get('maintenance_interval_months')):null}); setModal(null); report('Equipamento adicionado.', 'success'); await reload() }
    catch (err) { report(err instanceof Error ? err.message : 'Erro ao salvar') }
    finally { setBusy(false) }
  }
  const submitCustomer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setMessage('')
    const val = validateRequiredFields(e.currentTarget)
    if (!val.valid) { report(val.message); return }
    setBusy(true)
    try { await api.put(`/customers/${id}`, Object.fromEntries(new FormData(e.currentTarget))); setModal(null); report('Cadastro do cliente atualizado.', 'success'); await reload() }
    catch (err) { report(err instanceof Error ? err.message : 'Não foi possível atualizar o cliente.') }
    finally { setBusy(false) }
  }
  const archiveCustomer = async () => {
    setBusy(true); setMessage('')
    try { await api.delete(`/customers/${id}`); navigate('/clientes') }
    catch (err) { report(err instanceof Error ? err.message : 'Não foi possível excluir o cliente.') }
    finally { setBusy(false) }
  }
  if (loading) return <main className="content"><Loader /></main>
  if (error) return <main className="content"><Notice text={error}/></main>
  return <main className="content"><button className="back-link" onClick={()=>navigate('/clientes')}>← Clientes</button>{message && modal === null && <Notice text={message} tone={messageTone}/>}<Header eyebrow="CADASTRO COMPLETO" title={customer.name}><Btn kind="danger" onClick={()=>{setMessage('');setModal('delete')}}><Trash2 /> Excluir</Btn><Btn kind="secondary" onClick={()=>{setMessage('');setModal('edit')}}><Pencil /> Editar cliente</Btn><Btn onClick={()=>{setMessage('');setModal(tab==='equipment'?'equipment':'address')}}><Plus /> {tab==='equipment'?'Equipamento':'Endereço'}</Btn></Header><section className="customer-hero panel"><div className="avatar large">{customer.name?.[0]}</div><div><h2>{customer.name}</h2><p>{customer.contact_name ? `${customer.contact_name} · ` : ''}{customer.phone} · {customer.email||'Sem e-mail'}</p><small>{customer.document||'CPF/CNPJ não informado'}</small></div><div className="hero-stats"><span>{customer.addresses?.length||0}<small>endereços</small></span><span>{equipment?.length||0}<small>equipamentos</small></span></div></section><nav className="tabs"><button className={tab==='addresses'?'active':''} onClick={()=>setTab('addresses')}>Endereços</button><button className={tab==='equipment'?'active':''} onClick={()=>setTab('equipment')}>Equipamentos</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>Histórico</button></nav>{tab==='addresses'&&<section className="card-grid">{customer.addresses?.map(a=><article className="panel compact-card" key={a.id}><MapPin /><div><strong>{a.label}</strong><p>{a.street||'Rua não informada'}, {a.number}<br />{[a.district,a.city].filter(Boolean).join(' · ')||'Localidade não informada'}{a.state?`/${a.state}`:''}</p></div></article>)}</section>}{tab==='equipment'&&<section className="card-grid">{equipment?.map(e=><NavLink className="panel compact-card" to={`/equipamentos/${e.id}`} key={e.id}><AirVent /><div><strong>{e.brand} {e.model}</strong><p>{e.type} · {e.btus?.toLocaleString('pt-BR')} BTUs · {e.location}</p><small>Preventiva: {shortDate(e.next_maintenance_at)}</small></div><ChevronRight /></NavLink>)}</section>}{tab==='history'&&<section className="panel history-panel">{equipment?.flatMap(e=>e.work_orders||[]).map(o=><div className="history-row" key={o.id}><span><Wrench /></span><div><strong>{o.number}</strong><p>{shortDate(o.scheduled_at)} · {o.solution||'Atendimento registrado'}</p></div><NavLink to={`/ordens/${o.id}`}><ChevronRight /></NavLink></div>)}</section>}{modal==='address'&&<Modal title="Novo endereço" onClose={()=>setModal(null)}><CustomerAddressForm busy={busy} message={message} onSubmit={submitAddress} onCancel={()=>setModal(null)} /></Modal>}{modal==='equipment'&&<Modal title="Novo equipamento" onClose={()=>setModal(null)}><form onSubmit={submitEquipment}><div className="form-grid"><label>Endereço<select name="address_id" required>{customer.addresses?.map(a=><option key={a.id} value={a.id}>{a.label} · {a.district}</option>)}</select></label><label>Local no imóvel<input name="location" required placeholder="Sala, quarto..."/></label><label>Tipo<select name="type" defaultValue="Split"><option>Split</option><option>Janela</option><option>Cassete</option><option>Piso teto</option><option>VRF</option><option>Chiller</option><option>Outro</option></select></label><label>Marca<input name="brand"/></label><label>Modelo<input name="model"/></label><label>BTUs<input name="btus" type="number"/></label><label>Gás refrigerante<input name="refrigerant_gas"/></label><label>Periodicidade (meses)<input name="maintenance_interval_months" type="number" defaultValue="6"/></label><label>Próxima preventiva<input name="next_maintenance_at" type="date"/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(null)}>Cancelar</Btn><Btn disabled={busy}>{busy?'Salvando...':'Salvar equipamento'}</Btn></div></form></Modal>}{modal==='edit'&&<Modal title="Editar cliente" onClose={()=>setModal(null)}><form className="customer-form-modal" onSubmit={submitCustomer}><CustomerFormFields customer={customer}/>{message&&<Notice text={message}/>}<div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(null)}>Cancelar</Btn><Btn disabled={busy}>{busy?'Salvando...':'Salvar alterações'}</Btn></div></form></Modal>}{modal==='delete'&&<Modal title="Excluir cliente?" onClose={()=>setModal(null)}><p><strong>{customer.name}</strong> será arquivado e deixará de aparecer na lista. Endereços, equipamentos e ordens de serviço vinculadas serão preservados no histórico.</p>{message&&<Notice text={message}/>}<div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(null)}>Cancelar</Btn><Btn kind="danger" disabled={busy} onClick={()=>void archiveCustomer()}>{busy?'Excluindo...':'Arquivar cliente'}</Btn></div></Modal>}</main>
}

export function EquipmentPage() { const { data,loading,error,reload }=useData<Equipment[]>('/equipment',[]);const [modal,setModal]=useState(false);const {data:customers}=useData<Customer[]>('/customers',[]);const [customerId,setCustomerId]=useState('');const selected=customers.find(c=>c.id===Number(customerId));const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);await api.post('/equipment',{...Object.fromEntries(f),customer_id:Number(f.get('customer_id')),address_id:Number(f.get('address_id')),btus:Number(f.get('btus')||0)});setModal(false);await reload()};return <main className="content"><Header eyebrow="ATIVOS DO CLIENTE" title="Equipamentos"><Btn onClick={()=>setModal(true)}><Plus/> Novo equipamento</Btn></Header>{error&&<Notice text={error}/>} {loading?<Loader/>:<section className="equipment-grid">{data.map(e=><NavLink key={e.id} className="equipment-card panel" to={`/equipamentos/${e.id}`}><span className="equipment-icon"><AirVent/></span><div><strong>{e.brand||'Sem marca'} {e.model}</strong><p>{e.type} · {e.btus?.toLocaleString('pt-BR')} BTUs</p><small>{e.customer?.name} · {e.location}</small></div><ChevronRight/></NavLink>)}</section>}{modal&&<Modal title="Novo equipamento" onClose={()=>setModal(false)}><form onSubmit={submit}><div className="form-grid"><label>Cliente<select name="customer_id" required value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Selecione</option>{customers.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Endereço<select name="address_id" required disabled={!selected}><option value="">Selecione</option>{selected?.addresses?.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></label><label>Local<input name="location" required/></label><label>Tipo<input name="type" defaultValue="Split" required/></label><label>Marca<input name="brand"/></label><label>Modelo<input name="model"/></label><label>BTUs<input name="btus" type="number"/></label><label>Próxima preventiva<input name="next_maintenance_at" type="date"/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Salvar</Btn></div></form></Modal>}</main> }

export function EquipmentDetail(){const {id}=useParams();const nav=useNavigate();const {data:item,loading,error}=useData<Equipment>(`/equipment/${id}`,{} as Equipment);if(loading)return <main className="content"><Loader/></main>;return <main className="content"><button className="back-link" onClick={()=>nav('/equipamentos')}>← Equipamentos</button><Header eyebrow="HISTÓRICO DE MANUTENÇÃO" title={`${item.brand||''} ${item.model||item.type||''}`} /><section className="detail-grid-2"><article className="panel asset-detail"><AirVent/><h2>{item.type} · {item.btus?.toLocaleString('pt-BR')} BTUs</h2><p>{item.customer?.name} · {item.address?.label}</p><dl><div><dt>Local</dt><dd>{item.location}</dd></div><div><dt>Série</dt><dd>{item.serial_number||'—'}</dd></div><div><dt>Gás</dt><dd>{item.refrigerant_gas||'—'}</dd></div><div><dt>Próxima preventiva</dt><dd>{shortDate(item.next_maintenance_at)}</dd></div></dl></article><article className="panel history-panel"><div className="panel-title"><h2>Linha do tempo</h2></div>{item.work_orders?.map(o=><div className="history-row" key={o.id}><span><Wrench/></span><div><strong>{o.number}</strong><p>{shortDate(o.scheduled_at)} · {o.solution||'Atendimento técnico'}</p></div><NavLink to={`/ordens/${o.id}`}><ChevronRight/></NavLink></div>)||<p className="muted">Sem histórico.</p>}</article></section>{error&&<Notice text={error}/>}</main>}

export function CatalogPage(){
  const [tab,setTab]=useState<'services'|'products'>('services')
  const {data:services,reload:reloadServices}=useData<CatalogItem[]>('/services',[])
  const {data:products,reload:reloadProducts}=useData<CatalogItem[]>('/products',[])
  const [modal,setModal]=useState<'create'|'detail'|'edit'|'delete'|null>(null)
  const [selected,setSelected]=useState<CatalogItem|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [notice,setNotice]=useState('')
  const rows=tab==='services'?services:products
  const reload=tab==='services'?reloadServices:reloadProducts
  const beginCreate=()=>{setSelected(null);setMessage('');setModal('create')}
  const showItem=(item:CatalogItem)=>{setSelected(item);setMessage('');setModal('detail')}
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault(); setMessage('')
    const val = validateRequiredFields(event.currentTarget)
    if (!val.valid) { setMessage(val.message); return }
    const f=new FormData(event.currentTarget); setBusy(true)
    const common={name:String(f.get('name')||'').trim(),category:String(f.get('category')||'').trim()||null,active:f.get('active')==='true'}
    const defaultPriceVal = f.get('default_price')
    const estimatedCostVal = f.get('estimated_cost')
    const payload = tab === 'services'
      ? {
          ...common,
          category: String(f.get('category') || '').trim(),
          estimated_cost: estimatedCostVal !== null && estimatedCostVal !== '' ? Number(estimatedCostVal) : 0,
          default_price: defaultPriceVal !== null && defaultPriceVal !== '' ? Number(defaultPriceVal) : 0,
          average_minutes: f.get('average_minutes') ? Number(f.get('average_minutes')) : null,
          description: String(f.get('description') || '').trim() || null
        }
      : {
          ...common,
          unit: String(f.get('unit') || '').trim(),
          brand: String(f.get('brand') || '').trim() || null,
          code: String(f.get('code') || '').trim() || null,
          cost_price: Number(f.get('cost_price')),
          sale_price: Number(f.get('sale_price')),
          stock: Number(f.get('stock')),
          minimum_stock: Number(f.get('minimum_stock'))
        }
    try{if(modal==='edit'&&selected)await api.put(`/${tab}/${selected.id}`,payload);else await api.post(`/${tab}`,payload);setModal(null);setNotice(modal==='edit'?'Cadastro atualizado.':'Cadastro criado.');await reload()}catch(error){setMessage(error instanceof Error?error.message:'Não foi possível salvar o cadastro.')}finally{setBusy(false)}
  }
  const remove=async()=>{if(!selected)return;setBusy(true);setMessage('');try{await api.delete(`/${tab}/${selected.id}`);setModal(null);setSelected(null);setNotice(tab==='services'?'Serviço excluído.':'Produto excluído.');await reload()}catch(error){setMessage(error instanceof Error?error.message:'Não foi possível excluir este cadastro.')}finally{setBusy(false)}}
  const openEdit=()=>{setMessage('');setModal('edit')}
  const itemName=selected?.name??(tab==='services'?'serviço':'produto')
  return <main className="content"><Header eyebrow="CATÁLOGO" title="Serviços e produtos"><Btn onClick={beginCreate}><Plus/> {tab==='services'?'Novo serviço':'Novo produto'}</Btn></Header>
    <nav className="tabs"><button className={tab==='services'?'active':''} onClick={()=>{setTab('services');setSelected(null);setModal(null);setNotice('')}}>Serviços</button><button className={tab==='products'?'active':''} onClick={()=>{setTab('products');setSelected(null);setModal(null);setNotice('')}}>Produtos e peças</button></nav>
    {notice&&<Notice text={notice} tone="success"/>}
    <section className="panel table-panel"><div className="data-table"><div className="table-head catalog-grid"><span>Nome</span><span>Categoria</span><span>{tab==='services'?'Preço padrão':'Estoque'}</span><span>{tab==='services'?'Tempo médio':'Venda'}</span><span>Status</span><span></span></div>{rows.map(item=><button type="button" className="table-row catalog-grid catalog-table-row" key={item.id} onClick={()=>showItem(item)}><strong>{item.name}</strong><span>{item.category||'—'}</span><span>{tab==='services'?cash(item.default_price):`${item.stock??0} ${item.unit||'un'}`}</span><span>{tab==='services'?(item.average_minutes?`${item.average_minutes} min`:'—'):cash(item.sale_price)}</span><span><i className={`catalog-active-dot${item.active?' is-active':''}`}/>{item.active?'Ativo':'Inativo'}</span><ChevronRight/></button>)}</div>{!rows.length&&<div className="empty"><span><Package/></span><h3>{tab==='services'?'Nenhum serviço cadastrado':'Nenhum produto cadastrado'}</h3><p>Cadastre um item para montar o catálogo da empresa.</p></div>}</section>
    {(modal==='create'||modal==='edit')&&<Modal title={modal==='edit'?'Editar cadastro':tab==='services'?'Novo serviço':'Novo produto'} onClose={()=>setModal(null)}><form className="catalog-form" onSubmit={submit}>
      <section className="catalog-form-section"><div className="catalog-form-heading"><span>{tab==='services'?<Wrench/>:<Package/>}</span><div><h3>{tab==='services'?'Dados do serviço':'Dados do produto'}</h3><p>Informações que aparecem no catálogo e nas ordens.</p></div></div><div className="form-grid">
      {tab==='services'?(
        <>
          <label className="span-2">Nome <em>obrigatório</em>
            <input name="name" required maxLength={120} defaultValue={selected?.name??''} placeholder="Ex.: Higienização de ar-condicionado"/>
          </label>
          <label>Categoria <em>obrigatório</em>
            <input name="category" required maxLength={80} defaultValue={selected?.category??''} placeholder="Ex.: Manutenção"/>
          </label>
          <label>Custo <em>obrigatório</em>
            <div className="catalog-input-prefix"><span>R$</span><input name="estimated_cost" type="number" min="0" step="0.01" required defaultValue={selected?.estimated_cost??''} placeholder="0,00"/></div>
          </label>
          <label>Preço padrão <small>Opcional</small>
            <div className="catalog-input-prefix"><span>R$</span><input name="default_price" type="number" min="0" step="0.01" defaultValue={selected?.default_price??''} placeholder="0,00"/></div>
          </label>
          <label>Tempo médio <small>Opcional</small>
            <input name="average_minutes" type="number" min="1" step="1" defaultValue={selected?.average_minutes??''} placeholder="Minutos"/>
          </label>
          <label>Status
            <select name="active" defaultValue={String(selected?.active??true)}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <label className="span-2">Descrição <small>Opcional</small>
            <textarea name="description" rows={3} defaultValue={selected?.description??''} placeholder="Detalhes do serviço, escopo ou observações"/>
          </label>
        </>
      ):(
        <>
          <label className="span-2">Nome <em>obrigatório</em>
            <input name="name" required maxLength={120} defaultValue={selected?.name??''} placeholder="Ex.: Filtro de ar"/>
          </label>
          <label>Categoria
            <input name="category" maxLength={80} defaultValue={selected?.category??''} placeholder="Ex.: Peças"/>
          </label>
          <label>Status
            <select name="active" defaultValue={String(selected?.active??true)}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <label>Unidade <em>obrigatório</em>
            <input name="unit" required maxLength={20} defaultValue={selected?.unit??'un'} placeholder="un, kg, m..."/>
          </label>
          <label>Marca
            <input name="brand" maxLength={80} defaultValue={selected?.brand??''} placeholder="Fabricante"/>
          </label>
          <label>Código
            <input name="code" maxLength={80} defaultValue={selected?.code??''} placeholder="SKU ou referência"/>
          </label>
          <div className="catalog-form-divider span-2"><span>Valores e estoque</span><i/></div>
          <label>Custo <em>obrigatório</em>
            <div className="catalog-input-prefix"><span>R$</span><input name="cost_price" type="number" min="0" step="0.01" required defaultValue={selected?.cost_price??''} placeholder="0,00"/></div>
          </label>
          <label>Preço de venda <em>obrigatório</em>
            <div className="catalog-input-prefix"><span>R$</span><input name="sale_price" type="number" min="0" step="0.01" required defaultValue={selected?.sale_price??''} placeholder="0,00"/></div>
          </label>
          <label>Estoque atual <em>obrigatório</em>
            <input name="stock" type="number" min="0" step="0.001" required defaultValue={selected?.stock??0}/>
          </label>
          <label>Estoque mínimo <em>obrigatório</em>
            <input name="minimum_stock" type="number" min="0" step="0.001" required defaultValue={selected?.minimum_stock??0}/>
          </label>
        </>
      )}</div></section>
      {message&&<Notice text={message}/>}<div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(null)}>Cancelar</Btn><Btn disabled={busy}>{busy?'Salvando…':modal==='edit'?'Salvar alterações':'Criar cadastro'}</Btn></div>
    </form></Modal>}
    {modal==='detail'&&selected&&<Modal title={selected.name} onClose={()=>setModal(null)}><div className="catalog-detail"><div className="catalog-detail-summary"><span className={`catalog-active-dot${selected.active?' is-active':''}`}/><strong>{selected.active?'Ativo no catálogo':'Inativo'}</strong><span>{selected.category||'Sem categoria'}</span></div><div className="catalog-detail-grid">{tab==='services'?<><div><small>Preço padrão</small><strong>{cash(selected.default_price)}</strong></div><div><small>Custo estimado</small><strong>{selected.estimated_cost==null?'—':cash(selected.estimated_cost)}</strong></div><div><small>Tempo médio</small><strong>{selected.average_minutes?`${selected.average_minutes} min`:'—'}</strong></div><div className="span-2"><small>Descrição</small><p>{selected.description||'Sem descrição cadastrada.'}</p></div></>:<><div><small>Preço de venda</small><strong>{cash(selected.sale_price)}</strong></div><div><small>Custo</small><strong>{cash(selected.cost_price)}</strong></div><div><small>Estoque</small><strong>{selected.stock??0} {selected.unit||'un'}</strong></div><div><small>Estoque mínimo</small><strong>{selected.minimum_stock??0} {selected.unit||'un'}</strong></div><div><small>Marca</small><strong>{selected.brand||'—'}</strong></div><div><small>Código</small><strong>{selected.code||'—'}</strong></div></>}</div><div className="catalog-detail-actions"><Btn kind="secondary" onClick={openEdit}><Pencil/> Editar</Btn><Btn kind="danger" onClick={()=>{setMessage('');setModal('delete')}}><Trash2/> Excluir</Btn></div></div></Modal>}
    {modal==='delete'&&selected&&<Modal title={`Excluir ${tab==='services'?'serviço':'produto'}?`} onClose={()=>setModal(null)}><div className="catalog-delete-confirm"><span className="catalog-delete-icon"><Trash2/></span><p>Tem certeza que deseja excluir <strong>{itemName}</strong> do catálogo? Esse item deixará de aparecer para novos cadastros, mas continuará preservado no histórico de ordens.</p>{message&&<Notice text={message}/>}<div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal('detail')}>Voltar</Btn><Btn kind="danger" disabled={busy} onClick={()=>void remove()}>{busy?'Excluindo…':'Excluir item'}</Btn></div></div></Modal>}
  </main>
}

interface DailyShift {
  id: string
  employeeId: number
  employeeName: string
  employeeSpecialty: string
  employeeRole: string
  employeeAvatar: string
  date: string
  dateLabel: string
  weekdayLabel: string
  isToday: boolean
  isYesterday: boolean
  firstClockIn?: Entry
  lastClockOut?: Entry
  allEntries: Entry[]
  durationMinutes: number
  durationFormatted: string
  isOngoing: boolean
  status: 'working' | 'completed' | 'incomplete'
  hasAdjustments: boolean
}

function PontoJornadaSection({
  entries,
  employees,
  reloadEntries,
  loading,
}: {
  entries: Entry[]
  employees: Employee[]
  reloadEntries: () => Promise<void>
  loading?: boolean
}) {
  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const yesterdayStr = useMemo(() => {
    const d = new Date(Date.now() - 86400000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  // Filters
  const [dateFilter, setDateFilter] = useState<string>('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'working' | 'completed' | 'incomplete'>('all')
  const [search, setSearch] = useState<string>('')

  // Detail & Adjustment Modal
  const [selectedShift, setSelectedShift] = useState<DailyShift | null>(null)
  const [adjustingEntryId, setAdjustingEntryId] = useState<number | null>(null)
  const [adjustDatetime, setAdjustDatetime] = useState<string>('')
  const [adjustReason, setAdjustReason] = useState<string>('')
  const [adjustBusy, setAdjustBusy] = useState(false)
  const [adjustMessage, setAdjustMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 1. Group entries by employee + date (One line per employee per day)
  const shifts: DailyShift[] = useMemo(() => {
    const map = new Map<string, Entry[]>()
    const empMap = new Map<number, Employee>()
    for (const emp of employees) {
      empMap.set(emp.id, emp)
    }

    for (const entry of entries) {
      const empId = entry.employee_id || entry.employee?.id
      if (!empId) continue

      let dateStr = ''
      if (entry.work_date && typeof entry.work_date === 'string') {
        dateStr = entry.work_date.slice(0, 10)
      } else if (entry.occurred_at && typeof entry.occurred_at === 'string') {
        const dt = new Date(entry.occurred_at)
        if (!isNaN(dt.getTime())) {
          dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
        }
      }
      if (!dateStr) continue

      const key = `${empId}_${dateStr}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }

    const result: DailyShift[] = []

    for (const [key, shiftEntries] of map.entries()) {
      const [empIdStr, dateStr] = key.split('_')
      const empId = Number(empIdStr)
      const emp = empMap.get(empId) || shiftEntries[0]?.employee

      // Sort chronologically
      const sorted = [...shiftEntries].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())

      const firstClockIn = sorted.find(e => e.type === 'clock_in') ?? (sorted[0]?.type !== 'clock_out' ? sorted[0] : undefined)
      const clockOuts = sorted.filter(e => e.type === 'clock_out')
      const lastClockOut = clockOuts.length ? clockOuts[clockOuts.length - 1] : undefined

      // Duration calculation (pairwise clock_in -> clock_out)
      let totalMinutes = 0
      let activeIn: number | null = null
      let isOngoing = false

      for (const e of sorted) {
        const t = new Date(e.occurred_at).getTime()
        if (isNaN(t)) continue
        if (e.type === 'clock_in') {
          activeIn = t
        } else if (e.type === 'clock_out') {
          if (activeIn !== null) {
            totalMinutes += Math.max(0, Math.round((t - activeIn) / 60000))
            activeIn = null
          }
        }
      }

      if (activeIn !== null && dateStr === todayStr) {
        const now = Date.now()
        if (now > activeIn) {
          totalMinutes += Math.round((now - activeIn) / 60000)
          isOngoing = true
        }
      }

      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      const durationFormatted = `${hours}h ${String(mins).padStart(2, '0')}m`

      // Status
      let status: 'working' | 'completed' | 'incomplete' = 'completed'
      const lastPunch = sorted[sorted.length - 1]
      if (lastPunch.type === 'clock_in') {
        status = dateStr === todayStr ? 'working' : 'incomplete'
      } else if (!lastClockOut) {
        status = dateStr === todayStr ? 'working' : 'incomplete'
      } else {
        status = 'completed'
      }

      // Date info
      const [y, m, d] = dateStr.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(dt).toUpperCase().replace('.', '')
      const label = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dt)
      const isToday = dateStr === todayStr
      const isYesterday = dateStr === yesterdayStr

      const empName = emp?.name || 'Colaborador'
      const empRole = emp?.user?.role === 'employee' ? 'Funcionário' : emp?.user?.role === 'admin' ? 'Administrador' : 'Técnico'
      const empSpecialty = emp?.specialty || empRole

      result.push({
        id: key,
        employeeId: empId,
        employeeName: empName,
        employeeSpecialty: empSpecialty,
        employeeRole: empRole,
        employeeAvatar: empName[0] || 'C',
        date: dateStr,
        dateLabel: label,
        weekdayLabel: weekday,
        isToday,
        isYesterday,
        firstClockIn,
        lastClockOut,
        allEntries: sorted,
        durationMinutes: totalMinutes,
        durationFormatted,
        isOngoing,
        status,
        hasAdjustments: sorted.some(e => Boolean(e.adjusted)),
      })
    }

    // Sort by date DESC, then employeeName ASC
    return result.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      return a.employeeName.localeCompare(b.employeeName)
    })
  }, [entries, employees, todayStr, yesterdayStr])

  // Filtered shifts
  const filteredShifts = shifts.filter(s => {
    if (dateFilter && s.date !== dateFilter) return false
    if (employeeFilter !== 'all' && String(s.employeeId) !== employeeFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search) {
      const term = search.toLowerCase()
      const matchName = s.employeeName.toLowerCase().includes(term)
      const matchRole = s.employeeSpecialty.toLowerCase().includes(term)
      if (!matchName && !matchRole) return false
    }
    return true
  })

  // Metrics
  const uniqueEmployees = new Set(filteredShifts.map(s => s.employeeId)).size
  const workingCount = filteredShifts.filter(s => s.status === 'working').length
  const completedCount = filteredShifts.filter(s => s.status === 'completed').length
  const totalMinutesAll = filteredShifts.reduce((acc, s) => acc + s.durationMinutes, 0)
  const totalHoursFormatted = `${Math.floor(totalMinutesAll / 60)}h ${String(totalMinutesAll % 60).padStart(2, '0')}m`

  const formatTimeOnly = (iso?: string) => {
    if (!iso) return '—'
    const dt = new Date(iso)
    if (isNaN(dt.getTime())) return '—'
    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTimeLocal = (iso?: string) => {
    if (!iso) return ''
    const dt = new Date(iso)
    if (isNaN(dt.getTime())) return ''
    const Y = dt.getFullYear()
    const M = String(dt.getMonth() + 1).padStart(2, '0')
    const D = String(dt.getDate()).padStart(2, '0')
    const h = String(dt.getHours()).padStart(2, '0')
    const m = String(dt.getMinutes()).padStart(2, '0')
    return `${Y}-${M}-${D}T${h}:${m}`
  }

  // Handle Adjustment
  const handleOpenAdjust = (entry: Entry) => {
    setAdjustingEntryId(entry.id)
    setAdjustDatetime(formatDateTimeLocal(entry.occurred_at))
    setAdjustReason('')
    setAdjustMessage(null)
  }

  const handleSaveAdjust = async (entryId: number) => {
    if (!adjustDatetime) {
      setAdjustMessage({ type: 'error', text: 'Informe a nova data e horário.' })
      return
    }
    if (!adjustReason.trim()) {
      setAdjustMessage({ type: 'error', text: 'Informe a justificativa do ajuste.' })
      return
    }
    setAdjustBusy(true)
    setAdjustMessage(null)
    try {
      const occurredAtIso = new Date(adjustDatetime).toISOString()
      await api.put(`/time-entries/${entryId}/adjust`, {
        occurred_at: occurredAtIso,
        reason: adjustReason.trim(),
      })
      setAdjustMessage({ type: 'success', text: 'Horário ajustado com sucesso!' })
      setAdjustingEntryId(null)
      await reloadEntries()
    } catch (e) {
      setAdjustMessage({ type: 'error', text: e instanceof Error ? e.message : 'Falha ao salvar ajuste.' })
    } finally {
      setAdjustBusy(false)
    }
  }

  return (
    <section className="jornada-container">
      {/* Metrics Row */}
      <div className="jornada-metrics-grid">
        <article className="jornada-metric-card">
          <div className="jornada-metric-icon blue"><Users size={22} /></div>
          <div className="jornada-metric-copy">
            <span>Colaboradores no filtro</span>
            <strong>{uniqueEmployees}</strong>
          </div>
        </article>
        <article className="jornada-metric-card">
          <div className="jornada-metric-icon cyan"><Clock size={22} /></div>
          <div className="jornada-metric-copy">
            <span>Jornadas em andamento</span>
            <strong>{workingCount}</strong>
          </div>
        </article>
        <article className="jornada-metric-card">
          <div className="jornada-metric-icon green"><CheckCircle2 size={22} /></div>
          <div className="jornada-metric-copy">
            <span>Jornadas concluídas</span>
            <strong>{completedCount}</strong>
          </div>
        </article>
        <article className="jornada-metric-card">
          <div className="jornada-metric-icon purple"><Timer size={22} /></div>
          <div className="jornada-metric-copy">
            <span>Horas apuradas</span>
            <strong>{totalHoursFormatted}</strong>
          </div>
        </article>
      </div>

      {/* Filters Bar */}
      <div className="jornada-filter-panel">
        <div className="jornada-filter-row">
          <div className="jornada-filter-inputs">
            <div className="jornada-search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar por colaborador ou cargo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="jornada-select-input"
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
            >
              <option value="all">Todos os colaboradores ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
              ))}
            </select>

            <select
              className="jornada-select-input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos os status</option>
              <option value="working">Em andamento</option>
              <option value="completed">Concluídos</option>
              <option value="incomplete">Incompletos (sem saída)</option>
            </select>

            <input
              type="date"
              className="jornada-date-input"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              title="Filtrar por data específica"
            />
          </div>

          <div className="jornada-quick-dates">
            <button
              type="button"
              className={`jornada-quick-btn ${dateFilter === todayStr ? 'active' : ''}`}
              onClick={() => setDateFilter(dateFilter === todayStr ? '' : todayStr)}
            >
              Hoje
            </button>
            <button
              type="button"
              className={`jornada-quick-btn ${dateFilter === yesterdayStr ? 'active' : ''}`}
              onClick={() => setDateFilter(dateFilter === yesterdayStr ? '' : yesterdayStr)}
            >
              Ontem
            </button>
            {dateFilter && (
              <button
                type="button"
                className="jornada-quick-btn"
                onClick={() => setDateFilter('')}
                title="Limpar filtro de data"
              >
                Todas as datas ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shifts Table - 1 line per employee per day */}
      <div className="jornada-table-panel">
        <div className="jornada-table-head">
          <span>Colaborador</span>
          <span>Data</span>
          <span>Entrada</span>
          <span>Saída</span>
          <span>Carga Horária</span>
          <span>Batidas do dia</span>
          <span>Status</span>
          <span></span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Loader /></div>
        ) : filteredShifts.length > 0 ? (
          filteredShifts.map(shift => (
            <div
              className="jornada-table-row"
              key={shift.id}
              onClick={() => setSelectedShift(shift)}
              style={{ cursor: 'pointer' }}
              title="Clique para ver os detalhes e ajustar batidas"
            >
              {/* Employee */}
              <div className="jornada-col-employee">
                <span className="jornada-avatar">{shift.employeeAvatar}</span>
                <div className="jornada-emp-meta">
                  <strong>{shift.employeeName}</strong>
                  <span>{shift.employeeSpecialty}</span>
                </div>
              </div>

              {/* Date */}
              <div className="jornada-col-date">
                <strong>{shift.dateLabel}</strong>
                <small>
                  {shift.weekdayLabel}
                  {shift.isToday && <span className="pill ok" style={{ marginLeft: 6, padding: '1px 5px', fontSize: '0.62rem' }}>Hoje</span>}
                  {shift.isYesterday && <span className="pill" style={{ marginLeft: 6, padding: '1px 5px', fontSize: '0.62rem' }}>Ontem</span>}
                </small>
              </div>

              {/* Entrada */}
              <div>
                {shift.firstClockIn ? (
                  <span className="jornada-time-pill in" title={`Entrada registrada às ${formatTimeOnly(shift.firstClockIn.occurred_at)}`}>
                    <LogIn size={13} /> {formatTimeOnly(shift.firstClockIn.occurred_at)}
                  </span>
                ) : (
                  <span className="jornada-time-pill missing">Sem registro</span>
                )}
              </div>

              {/* Saída */}
              <div>
                {shift.lastClockOut ? (
                  <span className="jornada-time-pill out" title={`Saída registrada às ${formatTimeOnly(shift.lastClockOut.occurred_at)}`}>
                    <LogOut size={13} /> {formatTimeOnly(shift.lastClockOut.occurred_at)}
                  </span>
                ) : shift.status === 'working' ? (
                  <span className="jornada-time-pill working">
                    <span className="pulse-dot" /> Em andamento
                  </span>
                ) : (
                  <span className="jornada-time-pill missing" title="Não houve registro de saída">
                    <AlertTriangle size={13} /> Sem saída
                  </span>
                )}
              </div>

              {/* Horas */}
              <div className="jornada-hours-box">
                <strong>{shift.durationFormatted}</strong>
                {shift.isOngoing && <small>acumulado</small>}
              </div>

              {/* Batidas Sequence */}
              <div>
                <div className="jornada-punches-strip">
                  {shift.allEntries.map((e, idx) => (
                    <span
                      key={e.id ?? idx}
                      className={`punch-step-pill ${e.type === 'clock_in' ? 'in' : 'out'}`}
                      title={`${e.type === 'clock_in' ? 'Entrada' : 'Saída'}: ${formatTimeOnly(e.occurred_at)}`}
                    >
                      {formatTimeOnly(e.occurred_at)}
                    </span>
                  ))}
                  {shift.hasAdjustments && (
                    <span className="pill warn" style={{ padding: '1px 5px', fontSize: '0.62rem' }} title="Possui batida ajustada manualmente">
                      Ajustado
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                {shift.status === 'completed' && <span className="pill ok"><Check size={11} style={{ marginRight: 3 }} /> Concluído</span>}
                {shift.status === 'working' && <span className="pill info"><Clock size={11} style={{ marginRight: 3 }} /> Em andamento</span>}
                {shift.status === 'incomplete' && <span className="pill warn"><AlertTriangle size={11} style={{ marginRight: 3 }} /> Incompleto</span>}
              </div>

              {/* Action */}
              <div style={{ textAlign: 'right' }}>
                <button
                  type="button"
                  className="icon-button"
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedShift(shift)
                  }}
                  title="Ver detalhes da jornada e ajustar"
                >
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Clock size={36} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', color: 'var(--navy)' }}>Nenhuma jornada encontrada</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
              Tente alterar a data ou remover os filtros para visualizar os registros de ponto.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="jornada-mobile-cards">
        {filteredShifts.map(shift => (
          <article className="jornada-card-item" key={shift.id} onClick={() => setSelectedShift(shift)}>
            <div className="jornada-card-head">
              <div className="jornada-col-employee">
                <span className="jornada-avatar">{shift.employeeAvatar}</span>
                <div className="jornada-emp-meta">
                  <strong>{shift.employeeName}</strong>
                  <span>{shift.employeeSpecialty}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--navy)' }}>{shift.dateLabel}</strong>
                <small style={{ color: 'var(--muted)', fontWeight: 700 }}>{shift.weekdayLabel}</small>
              </div>
            </div>

            <div className="jornada-card-times">
              <div className="jornada-card-time-box">
                <span>Entrada</span>
                {shift.firstClockIn ? (
                  <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LogIn size={14} /> {formatTimeOnly(shift.firstClockIn.occurred_at)}
                  </strong>
                ) : (
                  <span style={{ color: 'var(--muted)' }}>—</span>
                )}
              </div>
              <div className="jornada-card-time-box">
                <span>Saída</span>
                {shift.lastClockOut ? (
                  <strong style={{ color: '#991b1b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <LogOut size={14} /> {formatTimeOnly(shift.lastClockOut.occurred_at)}
                  </strong>
                ) : shift.status === 'working' ? (
                  <strong style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="pulse-dot" /> Trabalhando
                  </strong>
                ) : (
                  <strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={14} /> Sem saída
                  </strong>
                )}
              </div>
            </div>

            <div className="jornada-card-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong>{shift.durationFormatted}</strong>
                {shift.status === 'completed' && <span className="pill ok">Concluído</span>}
                {shift.status === 'working' && <span className="pill info">Em andamento</span>}
                {shift.status === 'incomplete' && <span className="pill warn">Incompleto</span>}
              </div>
              <Btn kind="ghost" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Detalhes →</Btn>
            </div>
          </article>
        ))}
      </div>

      {/* Shift Detail & Adjust Modal */}
      {selectedShift && (
        <Modal
          title={`Jornada: ${selectedShift.employeeName} · ${selectedShift.dateLabel}`}
          onClose={() => {
            setSelectedShift(null)
            setAdjustingEntryId(null)
            setAdjustMessage(null)
          }}
        >
          <div>
            <div className="jornada-modal-hero">
              <div className="jornada-modal-hero-item">
                <span>Colaborador</span>
                <strong>{selectedShift.employeeName}</strong>
              </div>
              <div className="jornada-modal-hero-item">
                <span>Data</span>
                <strong>{selectedShift.dateLabel} ({selectedShift.weekdayLabel})</strong>
              </div>
              <div className="jornada-modal-hero-item">
                <span>Carga Horária</span>
                <strong>{selectedShift.durationFormatted}</strong>
              </div>
              <div className="jornada-modal-hero-item">
                <span>Status</span>
                <strong>
                  {selectedShift.status === 'completed' ? 'Concluída' : selectedShift.status === 'working' ? 'Em andamento' : 'Incompleta'}
                </strong>
              </div>
            </div>

            {adjustMessage && (
              <div style={{ marginBottom: 16 }}>
                <Notice text={adjustMessage.text} tone={adjustMessage.type === 'success' ? 'success' : 'error'} />
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <h3 style={{ fontSize: '0.92rem', color: 'var(--navy)', margin: '0 0 4px' }}>Batidas registradas nesta jornada</h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
                Se necessário, clique em "Ajustar" para corrigir um horário esquecido ou incorreto.
              </p>
            </div>

            <div className="jornada-punches-list">
              {selectedShift.allEntries.map((entry, index) => {
                const isEntryIn = entry.type === 'clock_in'
                const isBeingAdjusted = adjustingEntryId === entry.id

                return (
                  <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="jornada-punch-card">
                      <div className="jornada-punch-left">
                        <div className={`jornada-punch-node ${isEntryIn ? 'in' : 'out'}`}>
                          {isEntryIn ? <LogIn size={17} /> : <LogOut size={17} />}
                        </div>
                        <div className="jornada-punch-info">
                          <strong>
                            {index + 1}ª Batida: {isEntryIn ? 'Entrada' : 'Saída'} — {formatTimeOnly(entry.occurred_at)}
                            {entry.adjusted && (
                              <span className="pill warn" style={{ marginLeft: 8, padding: '2px 6px', fontSize: '0.65rem' }}>
                                Ajustado manual
                              </span>
                            )}
                          </strong>
                          <small>
                            Data/Hora: {new Date(entry.occurred_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            {entry.notes ? ` · ${entry.notes}` : ''}
                          </small>
                        </div>
                      </div>

                      <Btn
                        kind="ghost"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => handleOpenAdjust(entry)}
                      >
                        <Pencil size={13} style={{ marginRight: 4 }} /> Ajustar
                      </Btn>
                    </div>

                    {isBeingAdjusted && (
                      <div className="jornada-adjust-form">
                        <strong style={{ fontSize: '0.82rem', color: '#854d0e' }}>
                          Ajustar horário desta batida ({isEntryIn ? 'Entrada' : 'Saída'})
                        </strong>
                        <div className="form-grid">
                          <label>
                            Nova Data e Horário
                            <input
                              type="datetime-local"
                              required
                              value={adjustDatetime}
                              onChange={e => setAdjustDatetime(e.target.value)}
                            />
                          </label>
                          <label>
                            Motivo do ajuste (obrigatório)
                            <input
                              type="text"
                              required
                              placeholder="Ex: Esqueceu de bater, ajuste de 10 min..."
                              value={adjustReason}
                              onChange={e => setAdjustReason(e.target.value)}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Btn kind="ghost" type="button" onClick={() => setAdjustingEntryId(null)}>
                            Cancelar
                          </Btn>
                          <Btn disabled={adjustBusy} onClick={() => void handleSaveAdjust(entry.id)}>
                            {adjustBusy ? 'Salvando...' : 'Confirmar Ajuste'}
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="modal-actions">
              <Btn kind="ghost" type="button" onClick={() => setSelectedShift(null)}>
                Fechar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

export function TeamPage(){
  const {data:employees,reload:reloadEmployees}=useData<Employee[]>('/employees',[]);
  const {data:entries,reload:reloadEntries,loading:entriesLoading}=useData<Entry[]>('/time-entries',[]);
  const [tab,setTab]=useState<'team'|'time'>('team');
  const [modal,setModal]=useState(false);
  const submit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    await api.post('/employees',Object.fromEntries(f));
    setModal(false);
    await reloadEmployees()
  };
  return (
    <main className="content">
      <Header eyebrow="OPERAÇÃO INTERNA" title="Equipe e ponto">
        {tab==='team'&&<Btn onClick={()=>setModal(true)}><Plus/> Novo colaborador</Btn>}
      </Header>
      <nav className="tabs">
        <button className={tab==='team'?'active':''} onClick={()=>setTab('team')}>Colaboradores</button>
        <button className={tab==='time'?'active':''} onClick={()=>setTab('time')}>Ponto e jornada</button>
      </nav>
      {tab==='team' ? (
        <section className="team-grid">
          {employees.map(e=>(
            <article className="panel team-card" key={e.id}>
              <span className="avatar">{e.name?.[0]||'T'}</span>
              <div>
                <strong>{e.name}</strong>
                <p>{e.specialty||(e.user?.role==='employee'?'Funcionário':'Técnico de campo')}</p>
                <small>{e.phone||'Sem telefone'}</small>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                <span className={`pill ${e.user?.role==='employee'?'warn':e.user?.role==='admin'?'ok':''}`}>
                  {e.user?.role==='employee'?'Funcionário':e.user?.role==='admin'?'Admin':'Técnico'}
                </span>
                <span className={e.active?'pill ok':'pill'}>{e.active?'Ativo':'Inativo'}</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <PontoJornadaSection
          entries={entries}
          employees={employees}
          reloadEntries={reloadEntries}
          loading={entriesLoading}
        />
      )}
      {modal&&<Modal title="Novo colaborador" onClose={()=>setModal(false)}><form onSubmit={submit}><div className="form-grid"><label>Nome<input name="name" required/></label><label>E-mail<input name="email" type="email" required/></label><label>Perfil de acesso<select name="role" defaultValue="employee"><option value="employee">Funcionário (Apenas controle de ponto)</option><option value="technician">Técnico (Agenda e ordens de serviço)</option><option value="admin">Administrador (Acesso total)</option></select></label><label>Telefone<input name="phone"/></label><label>Cargo / Especialidade<input name="specialty" placeholder="Ex: Auxiliar operacional, Atendente..."/></label><label>Admissão<input name="hired_at" type="date"/></label><label>Senha inicial<input name="password" type="password" defaultValue="password"/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Criar colaborador</Btn></div></form></Modal>}
    </main>
  )
}


type CashEntry = { id:string; type:'inflow'|'outflow'; description:string; reference?:string|null; amount:number; method:string; occurred_at:string }
type CashSummary = { period:{from:string;to:string}; income:number; expenses:number; balance:number; entries:CashEntry[] }
const paymentLabels:Record<string,string>={pix:'Pix',cash:'Dinheiro',credit_card:'Crédito',debit_card:'Débito',transfer:'Transferência',bank_slip:'Boleto',other:'Outro'}
const localDateInput=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
const firstOfMonth=()=>{const today=new Date();return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`}

export function FinancePage(){const [from,setFrom]=useState(firstOfMonth);const [to,setTo]=useState(()=>localDateInput(new Date()));const {data:cashData,loading,error}=useData<CashSummary>(`/cash?from=${from}&to=${to}`,{period:{from,to},income:0,expenses:0,balance:0,entries:[]});const {data:receivables}=useData<Array<{id:number;amount:number;received:number;status:string;due_date?:string;customer?:Customer;work_order?:{number:string}}>>('/receivables',[]);const {data:report}=useData<{revenue:number;orders:number;completed:number;low_stock:CatalogItem[]}>('/reports',{} as {revenue:number;orders:number;completed:number;low_stock:CatalogItem[]});return <main className="content"><Header eyebrow="FINANCEIRO" title="Caixa"/><section className="cash-filter panel"><div><strong>Movimentação do caixa</strong><span>Entradas de pagamentos registrados nas OS e saídas lançadas.</span></div><label>De<input type="date" value={from} max={to} onChange={event=>setFrom(event.target.value)}/></label><label>Até<input type="date" value={to} min={from} onChange={event=>setTo(event.target.value)}/></label></section>{error&&<Notice text={error}/>}<section className="metric-grid finance-metrics"><article className="metric-card"><Banknote/><div><span>Entradas recebidas</span><strong>{cash(cashData.income)}</strong></div></article><article className="metric-card"><ReceiptText/><div><span>Saídas pagas</span><strong>{cash(cashData.expenses)}</strong></div></article><article className="metric-card"><Check/><div><span>Saldo do período</span><strong>{cash(cashData.balance)}</strong></div></article></section><section className="panel table-panel"><div className="panel-title"><div><h2>Livro-caixa</h2><p>Somente pagamentos efetivamente registrados e despesas pagas entram no saldo.</p></div></div><div className="data-table"><div className="table-head cash-grid"><span>Descrição</span><span>Data</span><span>Forma</span><span>Valor</span></div>{loading?<Loader/>:cashData.entries.length?cashData.entries.map(entry=><div className="table-row cash-grid" key={entry.id}><strong>{entry.description}{entry.reference&&<small>{entry.reference}</small>}</strong><span>{shortDate(entry.occurred_at)}</span><span>{paymentLabels[entry.method]??entry.method}</span><strong className={entry.type==='inflow'?'text-ok':'text-warn'}>{entry.type==='inflow'?'+':'−'} {cash(entry.amount)}</strong></div>):<div className="cash-empty"><Banknote/><strong>Nenhuma movimentação nesse período</strong><span>Pagamentos registrados nas ordens e saídas pagas aparecerão aqui.</span></div>}</div></section><section className="panel table-panel"><div className="panel-title"><div><h2>Contas a receber</h2><p>Valores em aberto não compõem o caixa até o pagamento ser registrado.</p></div></div><div className="data-table"><div className="table-head finance-grid"><span>Cliente / OS</span><span>Vencimento</span><span>Total</span><span>Recebido</span><span>Saldo</span><span>Status</span></div>{receivables.map(x=><div className="table-row finance-grid" key={x.id}><strong>{x.customer?.name}<small>{x.work_order?.number}</small></strong><span>{shortDate(x.due_date)}</span><span>{cash(x.amount)}</span><span className="text-ok">{cash(x.received)}</span><span className="text-warn">{cash(x.amount-x.received)}</span><span className={`pill ${x.status==='paid'?'ok':'warn'}`}>{x.status==='open'?'Aberto':x.status==='partial'?'Parcial':x.status==='overdue'?'Vencido':'Pago'}</span></div>)}</div></section><section className="panel alert-list"><div className="panel-title"><h2>Estoque baixo</h2></div>{report.low_stock?.map(p=><div key={p.id}><Box/><span>{p.name}</span><strong>{p.stock} / mínimo {p.minimum_stock}</strong></div>)}</section></main>}

export function ExpensePage(){const [from,setFrom]=useState(firstOfMonth);const [to,setTo]=useState(()=>localDateInput(new Date()));const {data:expenses,loading,error,reload}=useData<Array<{id:number;description:string;amount:number;method:string;paid_at:string}>>(`/expenses?from=${from}&to=${to}`,[]);const [modal,setModal]=useState(false);const [message,setMessage]=useState('');const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const form=new FormData(event.currentTarget);setMessage('');try{await api.post('/expenses',{description:form.get('description'),amount:Number(form.get('amount')),method:form.get('method'),paid_at:form.get('paid_at')});setModal(false);await reload()}catch(err){setMessage(err instanceof Error?err.message:'Não foi possível registrar a saída.')}};const total=expenses.reduce((sum,item)=>sum+Number(item.amount),0);return <main className="content"><Header eyebrow="FINANCEIRO" title="Saídas"><Btn onClick={()=>setModal(true)}><Plus/> Registrar saída</Btn></Header><section className="cash-filter panel"><div><strong>Despesas pagas</strong><span>Todo lançamento será refletido no Caixa.</span></div><label>De<input type="date" value={from} max={to} onChange={event=>setFrom(event.target.value)}/></label><label>Até<input type="date" value={to} min={from} onChange={event=>setTo(event.target.value)}/></label></section>{error&&<Notice text={error}/>}<section className="metric-grid finance-metrics expense-metrics"><article className="metric-card"><ReceiptText/><div><span>Total de saídas no período</span><strong>{cash(total)}</strong></div></article><article className="metric-card"><CalendarDays/><div><span>Lançamentos</span><strong>{expenses.length}</strong></div></article></section><section className="panel table-panel"><div className="panel-title"><div><h2>Despesas</h2><p>Valores registrados por data de pagamento.</p></div></div><div className="data-table"><div className="table-head cash-grid"><span>Descrição</span><span>Data</span><span>Forma de pagamento</span><span>Valor</span></div>{loading?<Loader/>:expenses.length?expenses.map(item=><div className="table-row cash-grid" key={item.id}><strong>{item.description}</strong><span>{shortDate(item.paid_at)}</span><span>{paymentLabels[item.method]??item.method}</span><strong className="text-warn">− {cash(item.amount)}</strong></div>):<div className="cash-empty"><ReceiptText/><strong>Nenhuma saída nesse período</strong><span>Use “Registrar saída” para lançar uma despesa.</span></div>}</div></section>{modal&&<Modal title="Registrar saída" onClose={()=>setModal(false)}><form onSubmit={submit}><div className="form-grid"><label className="span-2">Descrição<input name="description" required maxLength={180} placeholder="Ex.: combustível, aluguel, material..."/></label><label>Valor<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0,00"/></label><label>Forma de pagamento<select name="method" defaultValue="pix" required>{Object.entries(paymentLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><label>Data<input name="paid_at" type="date" defaultValue={localDateInput(new Date())} required/></label></div>{message&&<Notice text={message}/>}<div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Salvar saída</Btn></div></form></Modal>}</main>}

export function QuotesPage(){const navigate=useNavigate();const {data:quotes,reload}=useData<Array<{id:number;number:string;status:string;total:number;customer?:Customer;valid_until?:string;items?:unknown[]}>>('/quotes',[]);const {data:customers}=useData<Customer[]>('/customers',[]);const {data:services}=useData<CatalogItem[]>('/services',[]);const [modal,setModal]=useState(false);const [customerId,setCustomerId]=useState('');const [serviceId,setServiceId]=useState('');const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);const s=services.find(x=>x.id===Number(serviceId));await api.post('/quotes',{customer_id:Number(customerId),address_id:Number(f.get('address_id')),valid_until:f.get('valid_until'),notes:f.get('notes'),items:[{type:'service',service_id:Number(serviceId),quantity:Number(f.get('quantity')),unit_price:Number(f.get('unit_price')||s?.default_price||0)}]});setModal(false);await reload()};const change=async(q:{id:number},status:string)=>{await api.put(`/quotes/${q.id}`,{status});await reload()};const convert=async(q:{id:number})=>{const order=await api.post<{id:number}>(`/quotes/${q.id}/convert`);navigate(`/ordens/${order.id}`)};const selected=customers.find(c=>c.id===Number(customerId));return <main className="content"><Header eyebrow="PRÉ-ATENDIMENTO" title="Orçamentos"><Btn onClick={()=>setModal(true)}><Plus/> Novo orçamento</Btn></Header><section className="order-cards">{quotes.map(q=><article className="order-card" key={q.id}><div className="order-top"><div><span>{q.number}</span><h3>{q.customer?.name}</h3></div><span className="pill">{q.status==='awaiting_approval'?'Aguardando aprovação':q.status==='approved'?'Aprovado':'Recusado'}</span></div><div className="order-details"><span><CalendarDays/> Válido até {shortDate(q.valid_until)}</span><span><Package/> {q.items?.length||0} item(ns)</span></div><div className="order-footer"><strong>{cash(q.total)}</strong>{q.status==='awaiting_approval'&&<><Btn kind="secondary" onClick={()=>change(q,'approved')}>Aprovar</Btn><Btn kind="ghost" onClick={()=>change(q,'rejected')}>Recusar</Btn></>}{q.status==='approved'&&<Btn onClick={()=>convert(q)}>Converter em OS</Btn>}</div></article>)}</section>{modal&&<Modal title="Novo orçamento" onClose={()=>setModal(false)}><form onSubmit={submit}><div className="form-grid"><label>Cliente<select required value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Selecione</option>{customers.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Endereço<select name="address_id" required><option value="">Selecione</option>{selected?.addresses?.map(a=><option value={a.id} key={a.id}>{a.label}</option>)}</select></label><label>Serviço<select required value={serviceId} onChange={e=>setServiceId(e.target.value)}><option value="">Selecione</option>{services.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label>Quantidade<input name="quantity" type="number" defaultValue="1" min="1" step=".01"/></label><label>Valor<input name="unit_price" type="number" step=".01" defaultValue={services.find(s=>s.id===Number(serviceId))?.default_price}/></label><label>Validade<input name="valid_until" type="date"/></label><label className="span-2">Observações<textarea name="notes"/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Criar orçamento</Btn></div></form></Modal>}</main>}

export function OperationsPage(){const [tab,setTab]=useState<'stock'|'preventive'|'audit'|'whatsapp'>('stock');const {data:moves,reload:movesReload}=useData<Array<{id:number;type:string;quantity:number;occurred_at:string;product?:CatalogItem;reason?:string}>>('/inventory-movements',[]);const {data:products}=useData<CatalogItem[]>('/products',[]);const {data:preventive}=useData<Equipment[]>('/preventive-maintenance',[]);const {data:audit}=useData<Array<{id:number;action:string;created_at:string;user?:{name:string};reason?:string}>>('/audit-logs',[]);const {data:templates,reload:templateReload}=useData<Array<{id:number;key:string;name:string;channel:string;body:string}>>('/notification-templates',[]);const [modal,setModal]=useState(false);const submitStock=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);await api.post(`/products/${f.get('product_id')}/stock-adjustment`,{quantity:Number(f.get('quantity')),type:f.get('type'),reason:f.get('reason')});setModal(false);await movesReload()};const submitTemplate=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();await api.post('/notification-templates',Object.fromEntries(new FormData(e.currentTarget)));setModal(false);await templateReload()};return <main className="content"><Header eyebrow="CONTROLE OPERACIONAL" title="Operações"><Btn onClick={()=>setModal(true)}><Plus/> {tab==='stock'?'Ajustar estoque':tab==='whatsapp'?'Novo modelo':'Novo registro'}</Btn></Header><nav className="tabs wide"><button className={tab==='stock'?'active':''} onClick={()=>setTab('stock')}>Estoque</button><button className={tab==='preventive'?'active':''} onClick={()=>setTab('preventive')}>Preventivas</button><button className={tab==='audit'?'active':''} onClick={()=>setTab('audit')}>Auditoria</button><button className={tab==='whatsapp'?'active':''} onClick={()=>setTab('whatsapp')}>WhatsApp</button></nav>{tab==='stock'&&<section className="panel table-panel"><div className="data-table"><div className="table-head stock-grid"><span>Produto</span><span>Tipo</span><span>Quantidade</span><span>Saldo</span><span>Motivo</span><span>Data</span></div>{moves.map(m=><div className="table-row stock-grid" key={m.id}><strong>{m.product?.name}</strong><span>{m.type}</span><span className={m.quantity<0?'text-warn':'text-ok'}>{m.quantity>0?'+':''}{m.quantity}</span><span>{m.product?.stock}</span><span>{m.reason}</span><span>{shortDate(m.occurred_at)}</span></div>)}</div></section>}{tab==='preventive'&&<section className="equipment-grid">{preventive.map(e=><NavLink to={`/equipamentos/${e.id}`} className="equipment-card panel" key={e.id}><AirVent/><div><strong>{e.customer?.name}</strong><p>{e.brand} {e.btus?.toLocaleString('pt-BR')} BTUs · {e.location}</p><small>Prevista para {shortDate(e.next_maintenance_at)}</small></div><ChevronRight/></NavLink>)}</section>}{tab==='audit'&&<section className="panel history-panel">{audit.map(a=><div className="history-row" key={a.id}><span><ShieldCheck/></span><div><strong>{a.action}</strong><p>{a.user?.name||'Sistema'} · {shortDate(a.created_at)} · {a.reason||'Sem observação'}</p></div></div>)}</section>}{tab==='whatsapp'&&<section className="template-grid">{templates.map(t=><article className="panel template-card" key={t.id}><MessageCircle/><strong>{t.name}</strong><small>{t.key} · {t.channel}</small><p>{t.body}</p></article>)}</section>}{modal&&tab==='stock'&&<Modal title="Ajustar estoque" onClose={()=>setModal(false)}><form onSubmit={submitStock}><div className="form-grid"><label>Produto<select name="product_id">{products.map(p=><option value={p.id} key={p.id}>{p.name} ({p.stock} {p.unit})</option>)}</select></label><label>Tipo<select name="type"><option value="entry">Entrada</option><option value="exit">Saída</option><option value="adjustment">Ajuste</option></select></label><label>Quantidade (+ ou -)<input name="quantity" type="number" step=".001" required/></label><label>Motivo<input name="reason" required/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Registrar</Btn></div></form></Modal>}{modal&&tab==='whatsapp'&&<Modal title="Modelo de mensagem" onClose={()=>setModal(false)}><form onSubmit={submitTemplate}><div className="form-grid"><label>Chave<input name="key" required placeholder="technician_on_the_way"/></label><label>Nome<input name="name" required/></label><label>Canal<input name="channel" defaultValue="whatsapp"/></label><label className="span-2">Mensagem<textarea name="body" required placeholder="Olá {cliente}, o técnico {tecnico} está a caminho."/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Salvar modelo</Btn></div></form></Modal>}</main>}

export function RoutesVehiclesPage(){const [tab,setTab]=useState<'routes'|'vehicles'>('routes');const {data:routes,reload:reloadRoutes}=useData<Array<{id:number;route_date:string;status:string;technician?:Employee;vehicle?:{model:string;license_plate:string};stops?:unknown[]}>>('/route-plans',[]);const {data:vehicles,reload:reloadVehicles}=useData<Array<{id:number;license_plate:string;model:string;brand?:string;mileage:number;active:boolean}>>('/vehicles',[]);const {data:employees}=useData<Employee[]>('/employees',[]);const [modal,setModal]=useState(false);const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);if(tab==='vehicles'){await api.post('/vehicles',{...Object.fromEntries(f),mileage:Number(f.get('mileage')||0)});await reloadVehicles()}else{await api.post('/route-plans',{technician_id:f.get('technician_id')?Number(f.get('technician_id')):null,vehicle_id:f.get('vehicle_id')?Number(f.get('vehicle_id')):null,route_date:f.get('route_date'),notes:f.get('notes'),stops:[]});await reloadRoutes()}setModal(false)};return <main className="content"><Header eyebrow="LOGÍSTICA" title="Rotas e veículos"><Btn onClick={()=>setModal(true)}><Plus/> {tab==='routes'?'Nova rota':'Novo veículo'}</Btn></Header><nav className="tabs"><button className={tab==='routes'?'active':''} onClick={()=>setTab('routes')}>Rotas diárias</button><button className={tab==='vehicles'?'active':''} onClick={()=>setTab('vehicles')}>Veículos</button></nav>{tab==='routes'?<section className="route-grid">{routes.map(r=><article className="panel route-card" key={r.id}><RouteIcon/><div><strong>{shortDate(r.route_date)}</strong><p>{r.technician?.name||'Sem técnico'} · {r.vehicle?`${r.vehicle.model} (${r.vehicle.license_plate})`:'Sem veículo'}</p><small>{r.stops?.length||0} paradas · {r.status}</small></div></article>)}</section>:<section className="card-grid">{vehicles.map(v=><article className="panel compact-card" key={v.id}><Car/><div><strong>{v.brand} {v.model}</strong><p>{v.license_plate} · {v.mileage.toLocaleString('pt-BR')} km</p><small>{v.active?'Ativo':'Inativo'}</small></div></article>)}</section>}{modal&&<Modal title={tab==='routes'?'Nova rota diária':'Novo veículo'} onClose={()=>setModal(false)}><form onSubmit={submit}><div className="form-grid">{tab==='routes'?<><label>Técnico<select name="technician_id"><option value="">Selecione</option>{employees.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label><label>Veículo<select name="vehicle_id"><option value="">Selecione</option>{vehicles.map(v=><option value={v.id} key={v.id}>{v.model} · {v.license_plate}</option>)}</select></label><label>Data<input name="route_date" type="date" required/></label><label className="span-2">Observações<textarea name="notes"/></label></>:<><label>Placa<input name="license_plate" required/></label><label>Modelo<input name="model" required/></label><label>Marca<input name="brand"/></label><label>Ano<input name="year" type="number"/></label><label>Quilometragem<input name="mileage" type="number"/></label></>}</div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Salvar</Btn></div></form></Modal>}</main>}

export function SettingsPage(){const {data,loading,error,reload}=useData<{company_name:string;document?:string;phone?:string;whatsapp?:string;email?:string;city?:string;state?:string;timezone:string}>('/settings',{company_name:'FrioFlow',timezone:'America/Sao_Paulo'});const [message,setMessage]=useState('');const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setMessage('');try{await api.put('/settings',Object.fromEntries(new FormData(e.currentTarget)));setMessage('Configurações salvas.');await reload()}catch(err){setMessage(err instanceof Error?err.message:'Não foi possível salvar.')}};if(loading)return <main className="content"><Loader/></main>;return <main className="content"><Header eyebrow="ADMINISTRAÇÃO" title="Configurações"/><form className="panel create-order" onSubmit={submit}><div className="form-section"><h2>Dados da empresa</h2><div className="form-grid"><label>Nome da empresa<input name="company_name" defaultValue={data.company_name} required/></label><label>CPF/CNPJ<input name="document" defaultValue={data.document}/></label><label>Telefone<input name="phone" defaultValue={data.phone}/></label><label>WhatsApp<input name="whatsapp" defaultValue={data.whatsapp}/></label><label>E-mail<input name="email" type="email" defaultValue={data.email}/></label><label>Cidade<input name="city" defaultValue={data.city}/></label><label>UF<input name="state" maxLength={2} defaultValue={data.state}/></label><label>Fuso horário<select name="timezone" defaultValue={data.timezone}><option value="America/Sao_Paulo">America/Sao_Paulo</option></select></label></div></div>{error&&<Notice text={error}/>} {message&&<Notice text={message} tone="success"/>}<div className="create-actions"><Btn>Salvar configurações</Btn></div></form></main>}

type AgendaAppointment = { id:number; scheduled_at:string; duration_minutes:number; type:string; status:string; customer:Customer; address:{district:string}; technician?:Employee }
const toLocalDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const addDays = (date: Date, days: number) => { const next = new Date(date); next.setDate(next.getDate() + days); return next }

export function AgendaPageV2() {
  const now = new Date()
  const today = toLocalDate(now)
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')
  const [modal, setModal] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [message, setMessage] = useState('')
  const { data: appointments, reload, error, loading } = useData<AgendaAppointment[]>('/appointments', [])
  const { data: customers } = useData<Customer[]>('/customers', [])
  const { data: employees } = useData<Employee[]>('/employees', [])
  const customer = customers.find(c => c.id === Number(customerId))
  const start = view === 'day' ? now : view === 'week' ? addDays(now, -((now.getDay() + 6) % 7)) : new Date(now.getFullYear(), now.getMonth(), 1)
  const end = view === 'day' ? now : view === 'week' ? addDays(start, 6) : new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const visibleAppointments = appointments.filter(appointment => {
    const scheduled = toLocalDate(new Date(appointment.scheduled_at))
    return scheduled >= toLocalDate(start) && scheduled <= toLocalDate(end)
  })
  const rangeLabel = view === 'day'
    ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
    : view === 'week'
      ? `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(start)} a ${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(end)}`
      : new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage('')
    const form = new FormData(event.currentTarget)
    try {
      await api.post('/appointments', { customer_id:Number(customerId), address_id:Number(form.get('address_id')), equipment_id:form.get('equipment_id') ? Number(form.get('equipment_id')) : null, technician_id:form.get('technician_id') ? Number(form.get('technician_id')) : null, scheduled_at:form.get('scheduled_at'), duration_minutes:Number(form.get('duration_minutes')), type:form.get('type'), notes:form.get('notes') })
      setModal(false); await reload()
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Não foi possível agendar o atendimento.') }
  }
  return <main className="content"><Header eyebrow="PLANEJAMENTO" title="Agenda"><Btn onClick={() => setModal(true)}><Plus /> Novo atendimento</Btn></Header>
    <div className="calendar-strip"><strong>{now.getDate()}</strong><span>{rangeLabel}</span><div><button type="button" className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Dia</button><button type="button" className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Semana</button><button type="button" className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>Mês</button></div></div>
    {error && <Notice text={error} />}{loading ? <Loader /> : <section className="day-board"><div className="day-list">{visibleAppointments.map(appointment => <article className="day-item" key={appointment.id}><div className="day-time"><strong>{new Date(appointment.scheduled_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}</strong><span>{appointment.duration_minutes} min</span></div><div className="day-line"><span /></div><div className="day-content"><div className="day-main"><div><h3>{appointment.customer.name}</h3><p><MapPin /> {appointment.address.district}</p></div><span className="pill">{appointment.status}</span></div><div className="day-meta"><span><Wrench /> {appointment.type}</span><span><Users /> {appointment.technician?.name || 'Sem técnico'}</span></div></div></article>)}{!visibleAppointments.length && <div className="empty"><span><CalendarDays /></span><h3>Agenda livre</h3><p>Não há atendimentos neste período.</p></div>}</div></section>}
    {message && <Notice text={message} />}{modal && <Modal title="Novo atendimento" onClose={() => setModal(false)}><form onSubmit={submit}><div className="form-grid"><label>Cliente<select required value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="">Selecione</option>{customers.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Endereço<select name="address_id" required disabled={!customer}><option value="">Selecione</option>{customer?.addresses?.map(address => <option value={address.id} key={address.id}>{address.label}</option>)}</select></label><label>Equipamento<select name="equipment_id"><option value="">Sem equipamento</option>{customer?.equipment?.map(equipment => <option value={equipment.id} key={equipment.id}>{equipment.brand} {equipment.location}</option>)}</select></label><label>Técnico<select name="technician_id"><option value="">A definir</option>{employees.map(employee => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></label><label>Data e hora<input name="scheduled_at" type="datetime-local" required defaultValue={`${today}T14:00`} /></label><label>Duração<input name="duration_minutes" type="number" min="15" defaultValue="90" required /></label><label>Tipo<select name="type"><option>Visita técnica</option><option>Manutenção</option><option>Instalação</option><option>Limpeza</option><option>Retorno</option><option>Garantia</option><option>Orçamento</option></select></label><label className="span-2">Observação<textarea name="notes" /></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={() => setModal(false)}>Cancelar</Btn><Btn>Agendar</Btn></div></form></Modal>}
  </main>
}

export function AgendaPage(){const today=new Date().toISOString().slice(0,10);const {data:appointments,reload}=useData<Array<{id:number;scheduled_at:string;type:string;status:string;customer:Customer;address:{district:string};technician?:Employee}>>(`/appointments?date=${today}`,[]);const {data:customers}=useData<Customer[]>('/customers',[]);const {data:employees}=useData<Employee[]>('/employees',[]);const [modal,setModal]=useState(false);const [customerId,setCustomerId]=useState('');const customer=customers.find(c=>c.id===Number(customerId));const submit=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);await api.post('/appointments',{customer_id:Number(customerId),address_id:Number(f.get('address_id')),equipment_id:f.get('equipment_id')?Number(f.get('equipment_id')):null,technician_id:f.get('technician_id')?Number(f.get('technician_id')):null,scheduled_at:f.get('scheduled_at'),duration_minutes:Number(f.get('duration_minutes')),type:f.get('type'),notes:f.get('notes')});setModal(false);await reload()};return <main className="content"><Header eyebrow="PLANEJAMENTO" title="Agenda"><Btn onClick={()=>setModal(true)}><Plus/> Novo atendimento</Btn></Header><div className="calendar-strip"><strong>{new Date().getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR',{month:'long'}).format(new Date())}</span><div><button>Dia</button><button className="active">Semana</button><button>Mês</button></div></div><section className="day-board">{appointments.map(a=><article className="day-item" key={a.id}><div className="day-time"><strong>{new Date(a.scheduled_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</strong><span>90 min</span></div><div className="day-line"><span/></div><div className="day-content"><div className="day-main"><div><h3>{a.customer.name}</h3><p><MapPin/> {a.address.district}</p></div><span className="pill">{a.status}</span></div><div className="day-meta"><span><Wrench/>{a.type}</span><span><Users/>{a.technician?.name||'Sem técnico'}</span></div></div></article>)}</section>{modal&&<Modal title="Novo atendimento" onClose={()=>setModal(false)}><form onSubmit={submit}><div className="form-grid"><label>Cliente<select required value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Selecione</option>{customers.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>Endereço<select name="address_id" required><option value="">Selecione</option>{customer?.addresses?.map(a=><option value={a.id} key={a.id}>{a.label}</option>)}</select></label><label>Equipamento<select name="equipment_id"><option value="">Sem equipamento</option>{customer?.equipment?.map(e=><option value={e.id} key={e.id}>{e.brand} {e.location}</option>)}</select></label><label>Técnico<select name="technician_id"><option value="">A definir</option>{employees.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label><label>Data e hora<input name="scheduled_at" type="datetime-local" required defaultValue={`${today}T14:00`}/></label><label>Duração<input name="duration_minutes" type="number" defaultValue="90"/></label><label>Tipo<select name="type"><option>Visita técnica</option><option>Manutenção</option><option>Instalação</option><option>Limpeza</option><option>Retorno</option><option>Garantia</option><option>Orçamento</option></select></label><label className="span-2">Observação<textarea name="notes"/></label></div><div className="modal-actions"><Btn kind="ghost" type="button" onClick={()=>setModal(false)}>Cancelar</Btn><Btn>Agendar</Btn></div></form></Modal>}</main>}
