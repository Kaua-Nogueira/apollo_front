import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Banknote, FileCheck2, Plus, Printer, ReceiptText, Trash2, UserRound } from 'lucide-react'
import { api } from './api'
import { Btn, Header, Loader, Notice, useData } from './Modules'
import type { Address, Customer, WorkOrder } from './types'

type DocumentType = 'quote' | 'receipt'
type SourceMode = 'registered' | 'manual'
type DocumentItem = { key: string; name: string; quantity: number; unit_price: number }
type CatalogItem = { id: number; name: string; default_price?: number; sale_price?: number }
type CompanySettings = {
  company_name:string; legal_name?:string; document?:string; state_registration?:string; municipal_registration?:string; contact_name?:string;
  phone?:string; whatsapp?:string; email?:string; website?:string; street?:string; number?:string; complement?:string;
  district?:string; city?:string; state?:string; zip_code?:string; pix_key?:string; slogan?:string;
  document_accent_color?:string; document_footer_text?:string; quote_terms?:string; receipt_terms?:string;
  logo_image_url?:string; document_header_image_url?:string; document_footer_image_url?:string;
}
type BusinessDocument = {
  id: number; type: DocumentType; number: string; customer_name: string; customer_document?: string; customer_phone?: string;
  customer_email?: string; customer_address?: string; issued_at: string; valid_until?: string; payment_method?: string;
  subtotal: number; discount: number; total: number; notes?: string; work_order?: { number: string }; items: DocumentItem[]
}

const currency = (value: number | string = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)) : '—'
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }
const newItem = (name = '', unitPrice = 0): DocumentItem => ({ key: `${Date.now()}-${Math.random()}`, name, quantity: 1, unit_price: unitPrice })
const paymentLabels: Record<string, string> = { pix:'PIX', cash:'Dinheiro', credit_card:'Cartão de crédito', debit_card:'Cartão de débito', transfer:'Transferência', bank_slip:'Boleto', other:'Outro' }

function addressText(address?: Address) {
  if (!address) return ''
  return `${address.street}, ${address.number} · ${address.district} · ${address.city}/${address.state}`
}

export function DocumentsPage() {
  const { data: documents, loading, error: loadError, reload } = useData<BusinessDocument[]>('/documents', [])
  const { data: customers } = useData<Customer[]>('/customers', [])
  const { data: orders } = useData<WorkOrder[]>('/work-orders', [])
  const { data: services } = useData<CatalogItem[]>('/services', [])
  const { data: products } = useData<CatalogItem[]>('/products', [])
  const { data: company } = useData<CompanySettings>('/settings', { company_name:'Minha empresa' })
  const [type, setType] = useState<DocumentType>('quote')
  const [source, setSource] = useState<SourceMode>('registered')
  const [customerId, setCustomerId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [workOrderId, setWorkOrderId] = useState('')
  const [manual, setManual] = useState({ name:'', document:'', phone:'', email:'', address:'' })
  const [issuedAt, setIssuedAt] = useState(localDate())
  const [validUntil, setValidUntil] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<DocumentItem[]>([newItem()])
  const [catalogChoice, setCatalogChoice] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'error' | 'success'>('success')
  const [created, setCreated] = useState<BusinessDocument | null>(null)

  const selectedCustomer = customers.find(customer => customer.id === Number(customerId))
  const selectedAddress = selectedCustomer?.addresses?.find(address => address.id === Number(addressId))
  const selectedOrder = orders.find(order => order.id === Number(workOrderId))
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0), [items])
  const total = Math.max(0, subtotal - Number(discount || 0))
  const customerName = source === 'registered' ? selectedCustomer?.name || 'Cliente não selecionado' : manual.name || 'Nome do cliente'
  const customerDocument = source === 'registered' ? selectedCustomer?.document : manual.document
  const customerPhone = source === 'registered' ? selectedCustomer?.phone : manual.phone
  const customerEmail = source === 'registered' ? selectedCustomer?.email : manual.email
  const customerAddress = source === 'registered' ? addressText(selectedAddress) : manual.address
  const companyAddress = [company.street && `${company.street}${company.number ? `, ${company.number}` : ''}`, company.district, [company.city, company.state].filter(Boolean).join('/'), company.zip_code && `CEP ${company.zip_code}`].filter(Boolean).join(' · ')
  const defaultNotes = type === 'quote' ? company.quote_terms : company.receipt_terms
  const previewNotes = notes || defaultNotes || ''

  const updateItem = (key: string, field: keyof Pick<DocumentItem, 'name' | 'quantity' | 'unit_price'>, value: string) => {
    setCreated(null)
    setItems(current => current.map(item => item.key === key ? { ...item, [field]: field === 'name' ? value : Number(value) } : item))
  }

  const addCatalogItem = () => {
    if (!catalogChoice) return
    const [kind, rawId] = catalogChoice.split(':')
    const sourceItem = (kind === 'service' ? services : products).find(item => item.id === Number(rawId))
    if (!sourceItem) return
    setItems(current => [...current.filter(item => item.name || item.unit_price), newItem(sourceItem.name, Number(sourceItem.default_price ?? sourceItem.sale_price ?? 0))])
    setCatalogChoice('')
    setCreated(null)
  }

  const useOrder = (id: string) => {
    setWorkOrderId(id); setCreated(null)
    const order = orders.find(item => item.id === Number(id))
    if (!order) return
    setCustomerId(String(order.customer.id))
    setAddressId(String(order.address.id))
    const orderItems = [...(order.services || []), ...(order.products || [])]
    if (type === 'receipt') {
      setItems([newItem(`Pagamento referente à ${order.number}`, Number(order.received || order.total))])
    } else if (orderItems.length) {
      setItems(orderItems.map(item => ({ key:`order-${item.id}-${item.name}`, name:item.name, quantity:Number(item.quantity), unit_price:Number(item.unit_price) })))
    }
  }

  const selectType = (nextType: DocumentType) => {
    setType(nextType); setCreated(null); setMessage(''); setDiscount(0)
    if (nextType === 'receipt' && selectedOrder) setItems([newItem(`Pagamento referente à ${selectedOrder.number}`, Number(selectedOrder.received || selectedOrder.total))])
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(''); setCreated(null)
    try {
      const document = await api.post<BusinessDocument>('/documents', {
        type,
        customer_id: source === 'registered' && customerId ? Number(customerId) : null,
        address_id: source === 'registered' && addressId ? Number(addressId) : null,
        work_order_id: workOrderId ? Number(workOrderId) : null,
        customer_name: source === 'manual' ? manual.name : undefined,
        customer_document: source === 'manual' ? manual.document : undefined,
        customer_phone: source === 'manual' ? manual.phone : undefined,
        customer_email: source === 'manual' ? manual.email : undefined,
        customer_address: source === 'manual' ? manual.address : undefined,
        issued_at: issuedAt,
        valid_until: type === 'quote' ? validUntil || null : null,
        payment_method: type === 'receipt' ? paymentMethod : null,
        discount: type === 'quote' ? discount : 0,
        notes,
        items: items.filter(item => item.name.trim()).map(({ name, quantity, unit_price }) => ({ name, quantity, unit_price })),
      })
      setCreated(document); setMessage(`${type === 'quote' ? 'Orçamento' : 'Recibo'} ${document.number} emitido com sucesso.`); setMessageTone('success'); await reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível emitir o documento.'); setMessageTone('error')
    } finally { setBusy(false) }
  }

  return <main className="content documents-page">
    <Header eyebrow="DOCUMENTOS COMERCIAIS" title="Orçamentos e recibos" />
    <div className="document-kind-picker" role="group" aria-label="Tipo de documento">
      <button type="button" className={type === 'quote' ? 'active' : ''} onClick={() => selectType('quote')}><Banknote /><span><strong>Orçamento</strong><small>Proposta de serviços e produtos</small></span></button>
      <button type="button" className={type === 'receipt' ? 'active' : ''} onClick={() => selectType('receipt')}><ReceiptText /><span><strong>Recibo</strong><small>Comprovante de valor recebido</small></span></button>
    </div>

    <form className="document-workspace" onSubmit={submit}>
      <section className="document-editor panel">
        <div className="document-section-title"><span>1</span><div><h2>Dados do cliente</h2><p>Use um cadastro existente ou preencha livremente.</p></div></div>
        <nav className="source-switch"><button type="button" className={source === 'registered' ? 'active' : ''} onClick={() => { setSource('registered'); setCreated(null) }}>Cliente cadastrado</button><button type="button" className={source === 'manual' ? 'active' : ''} onClick={() => { setSource('manual'); setCreated(null) }}>Preenchimento manual</button></nav>
        {source === 'registered' ? <div className="form-grid document-fields"><label>Cliente<select required value={customerId} onChange={event => { setCustomerId(event.target.value); setAddressId(''); setCreated(null) }}><option value="">Selecione</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Endereço<select value={addressId} onChange={event => { setAddressId(event.target.value); setCreated(null) }} disabled={!selectedCustomer}><option value="">Sem endereço</option>{selectedCustomer?.addresses?.map(address => <option key={address.id} value={address.id}>{address.label} · {address.district}</option>)}</select></label><label className="span-2">Vincular a uma OS (opcional)<select value={workOrderId} onChange={event => useOrder(event.target.value)}><option value="">Documento avulso</option>{orders.map(order => <option key={order.id} value={order.id}>{order.number} · {order.customer.name} · {currency(order.total)}</option>)}</select></label></div> : <div className="form-grid document-fields"><label>Nome ou razão social<input required value={manual.name} onChange={event => setManual({ ...manual, name:event.target.value })} /></label><label>CPF/CNPJ<input value={manual.document} onChange={event => setManual({ ...manual, document:event.target.value })} /></label><label>Telefone<input value={manual.phone} onChange={event => setManual({ ...manual, phone:event.target.value })} /></label><label>E-mail<input type="email" value={manual.email} onChange={event => setManual({ ...manual, email:event.target.value })} /></label><label className="span-2">Endereço<input value={manual.address} onChange={event => setManual({ ...manual, address:event.target.value })} /></label></div>}

        <div className="document-section-title"><span>2</span><div><h2>Itens e valores</h2><p>Adicione itens do catálogo ou descreva manualmente.</p></div></div>
        <div className="catalog-adder"><select value={catalogChoice} onChange={event => setCatalogChoice(event.target.value)}><option value="">Selecionar do catálogo</option><optgroup label="Serviços">{services.map(service => <option value={`service:${service.id}`} key={`service-${service.id}`}>{service.name} · {currency(service.default_price || 0)}</option>)}</optgroup><optgroup label="Produtos">{products.map(product => <option value={`product:${product.id}`} key={`product-${product.id}`}>{product.name} · {currency(product.sale_price || 0)}</option>)}</optgroup></select><Btn type="button" kind="secondary" onClick={addCatalogItem}><Plus /> Adicionar</Btn></div>
        <div className="document-items-editor"><div className="document-item-head"><span>Descrição</span><span>Qtd.</span><span>Valor unit.</span><span /></div>{items.map((item, index) => <div className="document-item-row" key={item.key}><input aria-label={`Descrição do item ${index + 1}`} required value={item.name} onChange={event => updateItem(item.key, 'name', event.target.value)} placeholder={type === 'quote' ? 'Serviço ou produto' : 'Valor recebido referente a...'} /><input aria-label={`Quantidade do item ${index + 1}`} type="number" min="0.001" step="0.001" required value={item.quantity} onChange={event => updateItem(item.key, 'quantity', event.target.value)} /><input aria-label={`Valor do item ${index + 1}`} type="number" min="0" step="0.01" required value={item.unit_price} onChange={event => updateItem(item.key, 'unit_price', event.target.value)} /><button type="button" className="remove-item" onClick={() => setItems(current => current.length === 1 ? [newItem()] : current.filter(currentItem => currentItem.key !== item.key))} aria-label={`Remover item ${index + 1}`}><Trash2 /></button></div>)}</div>
        <button type="button" className="add-line" onClick={() => setItems(current => [...current, newItem()])}><Plus /> Adicionar linha manual</button>

        <div className="document-section-title"><span>3</span><div><h2>Emissão</h2><p>Datas e detalhes finais do documento.</p></div></div>
        <div className="form-grid document-fields"><label>Data de emissão<input type="date" required value={issuedAt} onChange={event => setIssuedAt(event.target.value)} /></label>{type === 'quote' ? <><label>Validade<input type="date" min={issuedAt} value={validUntil} onChange={event => setValidUntil(event.target.value)} /></label><label>Desconto<input type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={event => setDiscount(Number(event.target.value))} /></label></> : <label>Forma de pagamento<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}>{Object.entries(paymentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>}<label className="span-2">Observações<textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder={type === 'quote' ? 'Condições, garantia e informações adicionais' : 'Declarações ou detalhes do pagamento'} /></label></div>
        {message && <Notice text={message} tone={messageTone} />}
        <div className="document-actions"><Btn disabled={busy}><FileCheck2 /> {busy ? 'Emitindo...' : `Emitir ${type === 'quote' ? 'orçamento' : 'recibo'}`}</Btn>{created && <Btn type="button" kind="secondary" onClick={() => window.print()}><Printer /> Imprimir</Btn>}</div>
      </section>

      <aside className="document-preview-wrap">
        <div className="preview-label"><span>Pré-visualização</span><small>Atualizada automaticamente</small></div>
        <article className="document-preview" id="printable-document" style={{ '--document-accent': company.document_accent_color || '#15576A' } as CSSProperties}>
          {company.document_header_image_url && <img className="preview-header-image" src={company.document_header_image_url} alt="Cabeçalho da empresa" />}
          <header><div className="preview-brand"><span>{company.logo_image_url ? <img src={company.logo_image_url} alt="Logotipo da empresa" /> : <FileCheck2 />}</span><div><strong>{company.company_name || 'Minha empresa'}</strong><small>{company.legal_name || company.slogan || company.document || 'Dados da empresa'}</small></div></div><div className="preview-number"><span>{type === 'quote' ? 'ORÇAMENTO' : 'RECIBO'}</span><strong>{created?.number || 'NOVO DOCUMENTO'}</strong></div></header>
          <section className="preview-meta"><div><small>Emissão</small><strong>{formatDate(issuedAt)}</strong></div>{type === 'quote' ? <div><small>Validade</small><strong>{formatDate(validUntil)}</strong></div> : <div><small>Pagamento</small><strong>{paymentLabels[paymentMethod]}</strong></div>}{selectedOrder && <div><small>Ordem de serviço</small><strong>{selectedOrder.number}</strong></div>}</section>
          <section className="preview-customer"><small>{type === 'quote' ? 'PROPOSTA PARA' : 'RECEBEMOS DE'}</small><h2>{customerName}</h2><p>{[customerDocument, customerPhone, customerEmail].filter(Boolean).join(' · ') || 'Dados de contato não informados'}</p>{customerAddress && <p>{customerAddress}</p>}</section>
          <section className="preview-items"><div className="preview-item header"><span>Descrição</span><span>Qtd.</span><span>Valor</span><span>Total</span></div>{items.filter(item => item.name).map(item => <div className="preview-item" key={item.key}><span>{item.name}</span><span>{item.quantity}</span><span>{currency(item.unit_price)}</span><strong>{currency(item.quantity * item.unit_price)}</strong></div>)}{!items.some(item => item.name) && <p className="preview-empty">Os itens aparecerão aqui.</p>}</section>
          <section className="preview-totals"><div><span>Subtotal</span><strong>{currency(subtotal)}</strong></div>{type === 'quote' && discount > 0 && <div><span>Desconto</span><strong>- {currency(discount)}</strong></div>}<div className="grand-total"><span>{type === 'quote' ? 'Total da proposta' : 'Valor recebido'}</span><strong>{currency(total)}</strong></div></section>
          {previewNotes && <section className="preview-notes"><small>{type === 'quote' ? 'CONDIÇÕES E OBSERVAÇÕES' : 'OBSERVAÇÕES'}</small><p>{previewNotes}</p></section>}
          {type === 'receipt' && <section className="receipt-declaration"><p>{company.receipt_terms || 'Declaramos, para os devidos fins, que recebemos o valor indicado neste documento referente aos itens acima descritos.'}</p><div><span /><small>{company.contact_name || 'Assinatura do responsável'}</small></div></section>}
          {company.document_footer_image_url && <img className="preview-footer-image" src={company.document_footer_image_url} alt="Rodapé da empresa" />}
          <footer><div><strong>{company.company_name || 'Minha empresa'}</strong><span>{[company.document && `CNPJ/CPF ${company.document}`, company.state_registration && `IE ${company.state_registration}`, company.phone, company.email, company.website].filter(Boolean).join(' · ')}</span><span>{companyAddress}</span></div><span>{company.document_footer_text || company.slogan}</span></footer>
        </article>
      </aside>
    </form>

    <section className="documents-history"><div className="panel-title"><div><p className="eyebrow">HISTÓRICO</p><h2>Documentos emitidos</h2></div><span>{documents.length} documentos</span></div>{loadError && <Notice text={loadError} />}{loading ? <Loader /> : <div className="documents-history-grid">{documents.map(document => <article className="panel document-history-card" key={document.id}><span className={`document-type-icon ${document.type}`} >{document.type === 'quote' ? <Banknote /> : <ReceiptText />}</span><div><small>{document.type === 'quote' ? 'Orçamento' : 'Recibo'}</small><strong>{document.number}</strong><p><UserRound /> {document.customer_name}</p></div><div><small>{formatDate(document.issued_at)}</small><strong>{currency(document.total)}</strong></div></article>)}{!documents.length && <div className="empty"><span><ReceiptText /></span><h3>Nenhum documento emitido</h3><p>O primeiro orçamento ou recibo aparecerá aqui.</p></div>}</div>}</section>
  </main>
}
