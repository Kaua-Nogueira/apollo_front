import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Banknote, ClipboardCheck, Eye, FileCheck2, MessageCircle,
  Plus, Printer, ReceiptText, Search, Trash2, UserRound, Wrench, X
} from 'lucide-react'
import { api } from './api'
import { Btn, Header, Loader, Notice, resolveStorageUrl, useData } from './Modules'
import type { Address, BusinessDocument, Customer, Employee, WorkOrder } from './types'

type DocumentType = 'quote' | 'receipt'
type SourceMode = 'registered' | 'manual'
type TabMode = 'receipts' | 'quotes' | 'create' | 'view'
type DocumentItem = { key: string; name: string; quantity: number; unit_price: number }
type CatalogItem = { id: number; name: string; default_price?: number; sale_price?: number }
type CompanySettings = {
  company_name: string; legal_name?: string; document?: string; state_registration?: string; municipal_registration?: string; contact_name?: string;
  phone?: string; whatsapp?: string; email?: string; website?: string; street?: string; number?: string; complement?: string;
  district?: string; city?: string; state?: string; zip_code?: string; pix_key?: string; slogan?: string;
  document_accent_color?: string; document_footer_text?: string; quote_terms?: string; receipt_terms?: string;
  logo_image_url?: string; document_header_image_url?: string; document_footer_image_url?: string;
}

const currency = (value: number | string = 0) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`)) : '—'
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` }
const newItem = (name = '', unitPrice = 0): DocumentItem => ({ key: `${Date.now()}-${Math.random()}`, name, quantity: 1, unit_price: unitPrice })
const paymentLabels: Record<string, string> = { pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão de crédito', debit_card: 'Cartão de débito', transfer: 'Transferência', bank_slip: 'Boleto', other: 'Outro' }

function addressText(address?: Address) {
  if (!address) return ''
  return `${address.street}, ${address.number} · ${address.district} · ${address.city}/${address.state}`
}

function printDocument() {
  const el = document.getElementById('printable-document')
  if (!el) {
    window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    window.print()
    return
  }

  const docTitle = el.querySelector('.preview-doc-num-tag strong, .preview-number strong')?.textContent || 'Documento'

  doc.open()
  doc.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-height: 100% !important;
      background: #ffffff !important;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #27414f;
    }
    .document-preview {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      display: flex !important;
      flex-direction: column !important;
      min-height: 100vh !important;
      box-sizing: border-box !important;
    }
    .preview-header-image {
      width: 100% !important;
      height: auto !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
    }
    .preview-footer-image {
      width: 100% !important;
      height: auto !important;
      display: block !important;
      margin-top: auto !important;
      padding: 0 !important;
      border: 0 !important;
    }
    .preview-doc-header-strip {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 14px !important;
      padding: 12px 25px !important;
      background: #f8fafc !important;
      border-bottom: 1px solid #e5ecee !important;
    }
    .preview-doc-kind-tag span {
      display: inline-block !important;
      padding: 5px 12px !important;
      border-radius: 8px !important;
      background: var(--document-accent, #15576A) !important;
      color: #ffffff !important;
      font-weight: 800 !important;
      font-size: 0.74rem !important;
      letter-spacing: 0.08em !important;
    }
    .preview-doc-num-tag {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      text-align: right !important;
      gap: 1px !important;
    }
    .preview-doc-num-tag small {
      color: #8498a2 !important;
      font-size: 0.58rem !important;
      font-weight: 800 !important;
      letter-spacing: 0.08em !important;
    }
    .preview-doc-num-tag strong {
      color: #1c3644 !important;
      font-weight: 800 !important;
      font-size: 0.9rem !important;
    }
    .document-preview>header {
      min-height: 105px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 16px !important;
      padding: 22px 25px !important;
      background: linear-gradient(135deg, var(--document-accent, #15576A), #1d6673) !important;
      color: #ffffff !important;
    }
    .preview-brand {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }
    .preview-brand>span {
      width: 37px !important;
      height: 37px !important;
      display: grid !important;
      place-items: center !important;
      border-radius: 11px !important;
      background: #c5eeee !important;
      color: #194d5c !important;
    }
    .preview-brand strong { font-size: 0.95rem !important; font-weight: 800 !important; }
    .preview-brand small { color: #b8d1d8 !important; font-size: 0.62rem !important; }
    .preview-number {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-end !important;
      text-align: right !important;
      gap: 2px !important;
    }
    .preview-number span { color: #a9d4dc !important; font-size: 0.59rem !important; font-weight: 800 !important; letter-spacing: 0.12em !important; }
    .preview-number strong { font-size: 0.72rem !important; font-weight: 700 !important; }
    .preview-meta {
      display: flex !important;
      gap: 28px !important;
      padding: 16px 25px !important;
      border-bottom: 1px solid #e8eef0 !important;
      background: #f9fbfc !important;
    }
    .preview-meta div { display: flex !important; flex-direction: column !important; gap: 3px !important; }
    .preview-meta small, .preview-customer>small, .preview-notes small { color: #8b9ba3 !important; font-size: 0.58rem !important; font-weight: 800 !important; letter-spacing: 0.08em !important; }
    .preview-meta strong { color: #3d5663 !important; font-size: 0.7rem !important; }
    .preview-customer { padding: 22px 25px 16px !important; }
    .preview-customer h2 { margin: 6px 0 5px !important; color: #17394a !important; font-size: 1.12rem !important; }
    .preview-customer p { margin: 3px 0 !important; color: #6e828d !important; font-size: 0.67rem !important; line-height: 1.45 !important; }
    .preview-items { margin: 0 25px !important; border: 1px solid #e2e9ec !important; border-radius: 10px !important; overflow: hidden !important; }
    .preview-item {
      min-height: 40px !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) 42px 78px 82px !important;
      gap: 7px !important;
      align-items: center !important;
      padding: 7px 10px !important;
      border-top: 1px solid #edf2f3 !important;
      font-size: 0.65rem !important;
    }
    .preview-item.header {
      min-height: 31px !important;
      border-top: 0 !important;
      background: #f3f7f8 !important;
      color: #82929a !important;
      font-size: 0.56rem !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
    }
    .preview-item span:first-child { overflow-wrap: anywhere !important; }
    .preview-item span:not(:first-child), .preview-item strong { text-align: right !important; }
    .preview-totals { width: 235px !important; align-self: flex-end !important; margin: 15px 25px 5px !important; }
    .preview-totals div { display: flex !important; justify-content: space-between !important; padding: 6px 0 !important; color: #6d8089 !important; font-size: 0.68rem !important; }
    .preview-totals .grand-total { margin-top: 4px !important; padding: 11px 0 0 !important; border-top: 1px solid #dfe8ea !important; color: #153e50 !important; }
    .preview-totals .grand-total strong { font-weight: 800 !important; font-size: 1.02rem !important; }
    .preview-notes, .receipt-declaration { margin: 12px 25px 0 !important; padding: 13px 15px !important; border-radius: 10px !important; background: #f5f8f9 !important; }
    .preview-notes p, .receipt-declaration p { margin: 5px 0 0 !important; color: #687d87 !important; font-size: 0.64rem !important; line-height: 1.55 !important; white-space: pre-wrap !important; }
    .receipt-declaration { margin-top: 17px !important; background: #f8fbfb !important; }
    .receipt-declaration>div { width: 190px !important; margin: 27px auto 0 !important; text-align: center !important; }
    .receipt-declaration>div span { display: block !important; border-top: 1px solid #9aabb2 !important; }
    .receipt-declaration>div small { color: #72858e !important; font-size: 0.58rem !important; }
    .document-preview>footer {
      margin-top: auto !important;
      min-height: 60px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 15px !important;
      padding: 15px 25px !important;
      border-top: 1px solid #e5ecee !important;
      color: #78909a !important;
      font-size: 0.6rem !important;
    }
    .document-preview>footer div { display: flex !important; flex-direction: column !important; gap: 2px !important; }
    .document-preview>footer strong { color: #35525f !important; }
    .preview-item, .preview-totals, .preview-notes, .receipt-declaration {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  </style>
</head>
<body>
  ${el.outerHTML}
</body>
</html>`)
  doc.close()

  const images = Array.from(iframe.contentWindow?.document.images || [])
  const triggerPrint = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        window.print()
      } finally {
        setTimeout(() => { iframe.remove() }, 2000)
      }
    }, 150)
  }

  if (images.length === 0 || images.every(img => img.complete)) {
    triggerPrint()
  } else {
    let pending = images.length
    images.forEach(img => {
      img.onload = img.onerror = () => {
        pending--
        if (pending <= 0) triggerPrint()
      }
    })
    setTimeout(triggerPrint, 1500)
  }
}

export function DocumentsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const { data: documents, loading, error: loadError, reload } = useData<BusinessDocument[]>('/documents', [])
  const { data: customers } = useData<Customer[]>('/customers', [])
  const { data: orders } = useData<WorkOrder[]>('/work-orders', [])
  const { data: services } = useData<CatalogItem[]>('/services', [])
  const { data: products } = useData<CatalogItem[]>('/products', [])
  const { data: employees } = useData<Employee[]>('/employees', [])
  const { data: company } = useData<CompanySettings>('/settings', { company_name: 'Minha empresa' })

  const [tab, setTab] = useState<TabMode>(() => searchParams.get('doc_id') ? 'view' : (searchParams.get('tab') as TabMode) || (searchParams.get('order_id') ? 'create' : 'receipts'))
  const [searchTerm, setSearchTerm] = useState('')
  const [type, setType] = useState<DocumentType>('quote')
  const [receiptOrigin, setReceiptOrigin] = useState<'order' | 'standalone'>('order')
  const [source, setSource] = useState<SourceMode>('registered')
  const [customerId, setCustomerId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [workOrderId, setWorkOrderId] = useState('')
  const [manual, setManual] = useState({ name: '', document: '', phone: '', email: '', address: '' })
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

  // Confirmation Modal for Quote -> Work Order
  const [confirmQuote, setConfirmQuote] = useState<BusinessDocument | null>(null)
  const [confirmScheduledAt, setConfirmScheduledAt] = useState('')
  const [confirmTechId, setConfirmTechId] = useState('')
  const [confirmProblem, setConfirmProblem] = useState('')
  const [confirmNotes, setConfirmNotes] = useState('')
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  const isOrderReceipt = type === 'receipt' && receiptOrigin === 'order'
  const selectedCustomer = customers.find(customer => customer.id === Number(customerId))
  const selectedAddress = selectedCustomer?.addresses?.find(address => address.id === Number(addressId))
  const selectedOrder = orders.find(order => order.id === Number(workOrderId))
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0), [items])
  const total = Math.max(0, subtotal - Number(discount || 0))

  const formCustomerName = isOrderReceipt
    ? (selectedOrder ? selectedOrder.customer.name : 'Selecione uma Ordem de Serviço')
    : source === 'registered' ? selectedCustomer?.name || 'Cliente não selecionado' : manual.name || 'Nome do cliente'

  const formCustomerDoc = isOrderReceipt
    ? selectedOrder?.customer?.document
    : source === 'registered' ? selectedCustomer?.document : manual.document

  const formCustomerPhone = isOrderReceipt
    ? (selectedOrder?.customer?.phone || selectedOrder?.customer?.whatsapp)
    : source === 'registered' ? selectedCustomer?.phone : manual.phone

  const formCustomerEmail = isOrderReceipt
    ? selectedOrder?.customer?.email
    : source === 'registered' ? selectedCustomer?.email : manual.email

  const formCustomerAddress = isOrderReceipt
    ? (selectedOrder?.address ? addressText(selectedOrder.address) : '')
    : source === 'registered' ? addressText(selectedAddress) : manual.address

  const companyAddress = [company.street && `${company.street}${company.number ? `, ${company.number}` : ''}`, company.district, [company.city, company.state].filter(Boolean).join('/'), company.zip_code && `CEP ${company.zip_code}`].filter(Boolean).join(' · ')
  const defaultNotes = type === 'quote' ? company.quote_terms : company.receipt_terms

  // Variables used in preview (prefer values from loaded/created document when viewing)
  const previewType = created?.type || type
  const previewDocNumber = created?.number || 'NOVO DOCUMENTO'
  const previewIssuedAt = created ? created.issued_at : issuedAt
  const previewValidUntil = created ? created.valid_until : validUntil
  const previewPaymentMethod = created ? (created.payment_method || 'pix') : paymentMethod
  const previewCustomerName = created ? created.customer_name : formCustomerName
  const previewCustomerDoc = created ? created.customer_document : formCustomerDoc
  const previewCustomerPhone = created ? created.customer_phone : formCustomerPhone
  const previewCustomerEmail = created ? created.customer_email : formCustomerEmail
  const previewCustomerAddress = created ? created.customer_address : formCustomerAddress
  const previewItems = created && created.items && created.items.length > 0
    ? created.items.map(i => ({ key: `item-${i.id}`, name: i.name, quantity: Number(i.quantity), unit_price: Number(i.unit_price) }))
    : items
  const previewSubtotal = created ? Number(created.subtotal) : subtotal
  const previewDiscount = created ? Number(created.discount || 0) : discount
  const previewTotal = created ? Number(created.total) : total
  const previewNotesText = created ? (created.notes || '') : (notes || defaultNotes || '')
  const previewOrderNumber = created ? created.work_order?.number : selectedOrder?.number

  // Lists of receipts and quotes
  const allDocs = Array.isArray(documents) ? documents : []
  const receiptsList = useMemo(() => allDocs.filter(d => d.type === 'receipt'), [allDocs])
  const quotesList = useMemo(() => allDocs.filter(d => d.type === 'quote'), [allDocs])

  const filteredReceipts = useMemo(() => {
    if (!searchTerm.trim()) return receiptsList
    const term = searchTerm.toLowerCase()
    return receiptsList.filter(r =>
      r.number.toLowerCase().includes(term) ||
      r.customer_name.toLowerCase().includes(term) ||
      (r.work_order?.number && r.work_order.number.toLowerCase().includes(term)) ||
      String(r.total).includes(term)
    )
  }, [receiptsList, searchTerm])

  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return quotesList
    const term = searchTerm.toLowerCase()
    return quotesList.filter(q =>
      q.number.toLowerCase().includes(term) ||
      q.customer_name.toLowerCase().includes(term) ||
      String(q.total).includes(term)
    )
  }, [quotesList, searchTerm])

  const whatsappUrl = useMemo(() => {
    if (!created) return ''
    const phone = created.customer_phone || (created.customer?.whatsapp || created.customer?.phone)
    if (!phone) return ''
    const cleanPhone = phone.replace(/\D/g, '')
    const msg = `Olá, ${created.customer_name}! Segue o comprovante do seu ${created.type === 'quote' ? 'Orçamento' : 'Recibo'} *${created.number}* no valor de ${currency(created.total)}. Agradecemos pela preferência!`
    return `https://wa.me/55${cleanPhone.replace(/^55/, '')}?text=${encodeURIComponent(msg)}`
  }, [created])

  // Support URL parameters (?doc_id=... or ?order_id=... or ?type=...)
  useEffect(() => {
    const docId = searchParams.get('doc_id')
    if (docId) {
      void (async () => {
        try {
          const doc = await api.get<BusinessDocument>(`/documents/${docId}`)
          if (doc) {
            setCreated(doc)
            setType(doc.type)
            setTab('view')
          }
        } catch {
          const found = allDocs.find(d => d.id === Number(docId))
          if (found) {
            setCreated(found)
            setType(found.type)
            setTab('view')
          }
        }
      })()
    }

    const typeParam = searchParams.get('type')
    if (typeParam === 'receipt' || typeParam === 'quote') {
      setType(typeParam)
      if (typeParam === 'quote') setWorkOrderId('')
    }

    const orderIdParam = searchParams.get('order_id')
    if (orderIdParam && orders.length) {
      setType('receipt')
      setReceiptOrigin('order')
      setTab('create')
      useOrder(orderIdParam)
    }

    const tabParam = searchParams.get('tab') as TabMode | null
    if (tabParam && ['receipts', 'quotes', 'create', 'view'].includes(tabParam)) {
      setTab(tabParam)
    }
  }, [searchParams, orders])

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

  const mapOrderItems = (targetOrder: WorkOrder): DocumentItem[] => {
    const orderServices = (targetOrder.services || []).map(s => ({
      key: `svc-${s.id}-${s.name}`,
      name: s.name,
      quantity: Number(s.quantity),
      unit_price: Number(s.unit_price),
    }))
    const orderProducts = (targetOrder.products || []).map(p => ({
      key: `prd-${p.id}-${p.name}`,
      name: p.name,
      quantity: Number(p.quantity),
      unit_price: Number(p.unit_price),
    }))
    const combined = [...orderServices, ...orderProducts]
    if (combined.length) return combined
    return [newItem(`Atendimento referente à ${targetOrder.number}`, Number(targetOrder.total || 0))]
  }

  const useOrder = (id: string) => {
    setWorkOrderId(id)
    setCreated(null)
    const order = orders.find(item => item.id === Number(id))
    if (!order) {
      setCustomerId('')
      setAddressId('')
      setItems([newItem()])
      return
    }
    setCustomerId(String(order.customer.id))
    if (order.address?.id) setAddressId(String(order.address.id))
    setItems(mapOrderItems(order))
    setDiscount(Number(order.discount || 0))
    if (order.payments && order.payments.length > 0) {
      setPaymentMethod(order.payments[order.payments.length - 1].method || 'pix')
    }
  }

  const clearOrder = () => {
    setWorkOrderId('')
    setCustomerId('')
    setAddressId('')
    setItems([newItem()])
    setDiscount(0)
    setCreated(null)
  }

  const selectType = (nextType: DocumentType) => {
    setType(nextType)
    setCreated(null)
    setMessage('')
    setDiscount(0)
    if (nextType === 'quote') {
      setWorkOrderId('')
      setItems([newItem()])
    } else {
      setReceiptOrigin('order')
      if (selectedOrder) {
        setItems(mapOrderItems(selectedOrder))
      }
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setCreated(null)

    const isOrderReceiptMode = type === 'receipt' && receiptOrigin === 'order'
    if (isOrderReceiptMode && !workOrderId) {
      setMessage('Selecione uma Ordem de Serviço para emitir o recibo.')
      setMessageTone('error')
      setBusy(false)
      return
    }

    try {
      const docCustomerId = isOrderReceiptMode
        ? (selectedOrder ? selectedOrder.customer.id : null)
        : source === 'registered' && customerId ? Number(customerId) : null

      const docAddressId = isOrderReceiptMode
        ? (selectedOrder?.address?.id ?? null)
        : source === 'registered' && addressId ? Number(addressId) : null

      const docWorkOrderId = isOrderReceiptMode && workOrderId ? Number(workOrderId) : null
      const isManual = !isOrderReceiptMode && source === 'manual'

      const document = await api.post<BusinessDocument>('/documents', {
        type,
        customer_id: docCustomerId,
        address_id: docAddressId,
        work_order_id: docWorkOrderId,
        customer_name: isManual ? manual.name : undefined,
        customer_document: isManual ? manual.document : undefined,
        customer_phone: isManual ? manual.phone : undefined,
        customer_email: isManual ? manual.email : undefined,
        customer_address: isManual ? manual.address : undefined,
        issued_at: issuedAt,
        valid_until: type === 'quote' ? validUntil || null : null,
        payment_method: type === 'receipt' ? paymentMethod : null,
        discount: Number(discount || 0),
        notes,
        items: items.filter(item => item.name.trim()).map(({ name, quantity, unit_price }) => ({ name, quantity, unit_price })),
      })
      setCreated(document)
      setTab('view')
      setMessage(`${type === 'quote' ? 'Orçamento' : 'Recibo'} ${document.number} emitido com sucesso.`)
      setMessageTone('success')
      await reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Não foi possível emitir o documento.')
      setMessageTone('error')
    } finally {
      setBusy(false)
    }
  }

  // Open the confirmation modal to convert quote to OS
  const openConfirmModal = (quote: BusinessDocument) => {
    setConfirmQuote(quote)
    const inOneHour = new Date(Date.now() + 3600000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const formattedDate = `${inOneHour.getFullYear()}-${pad(inOneHour.getMonth() + 1)}-${pad(inOneHour.getDate())}T${pad(inOneHour.getHours())}:${pad(inOneHour.getMinutes())}`
    setConfirmScheduledAt(formattedDate)
    setConfirmTechId('')
    setConfirmProblem(`Atendimento referente ao Orçamento ${quote.number} aprovado pelo cliente`)
    setConfirmNotes(quote.notes || '')
    setConfirmError('')
  }

  // Submit confirmed quote conversion to OS
  const handleConfirmGenerateOs = async (event: FormEvent) => {
    event.preventDefault()
    if (!confirmQuote) return
    setConfirmBusy(true)
    setConfirmError('')
    try {
      const res = await api.post<{ message: string; data: WorkOrder }>(`/documents/${confirmQuote.id}/generate-work-order`, {
        scheduled_at: confirmScheduledAt || undefined,
        technician_id: confirmTechId ? Number(confirmTechId) : null,
        problem_reported: confirmProblem || undefined,
        notes: confirmNotes || undefined,
      })
      setConfirmQuote(null)
      await reload()
      navigate(`/ordens/${res.data.id}`)
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Não foi possível gerar a Ordem de Serviço.')
    } finally {
      setConfirmBusy(false)
    }
  }

  const openDocViewer = (doc: BusinessDocument) => {
    setCreated(doc)
    setType(doc.type)
    setTab('view')
  }

  return (
    <main className="content documents-page">
      <Header eyebrow="DOCUMENTOS COMERCIAIS" title="Orçamentos e recibos" />

      {/* Primary Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={tab === 'receipts' ? 'active' : ''}
          onClick={() => { setTab('receipts'); setCreated(null); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ReceiptText size={16} /> Recibos Emitidos ({receiptsList.length})
        </button>
        <button
          type="button"
          className={tab === 'quotes' ? 'active' : ''}
          onClick={() => { setTab('quotes'); setCreated(null); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Banknote size={16} /> Orçamentos ({quotesList.length})
        </button>
        <button
          type="button"
          className={tab === 'create' ? 'active' : ''}
          onClick={() => { setTab('create'); setCreated(null); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Emitir Novo Documento
        </button>
        {tab === 'view' && created && (
          <button
            type="button"
            className="active"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Eye size={16} /> {created.type === 'quote' ? 'Orçamento' : 'Recibo'} {created.number}
          </button>
        )}
      </div>

      {loadError && <Notice text={loadError} />}
      {message && <Notice text={message} tone={messageTone} />}

      {/* TAB: VIEW DOCUMENT (Dedicated full-screen viewer) */}
      {tab === 'view' && created && (
        <section className="document-viewer-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <button
              type="button"
              className="back-link"
              onClick={() => setTab(created.type === 'quote' ? 'quotes' : 'receipts')}
              style={{ margin: 0, fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              ← Voltar para todos os {created.type === 'quote' ? 'orçamentos' : 'recibos'}
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn kind="secondary" onClick={() => printDocument()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Printer size={16} /> Imprimir / Salvar PDF
              </Btn>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16a34a', color: '#fff', border: 'none' }}
                >
                  <MessageCircle size={16} /> Enviar WhatsApp
                </a>
              )}
              {created.work_order_id && (
                <Link
                  to={`/ordens/${created.work_order_id}`}
                  className="button button-ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Wrench size={16} /> Ver OS {created.work_order?.number}
                </Link>
              )}
              <Btn
                kind="ghost"
                onClick={() => { setCreated(null); setTab('create'); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} /> Emitir outro
              </Btn>
            </div>
          </div>

          <article className="document-preview standalone-preview" id={tab === 'view' ? 'printable-document' : 'printable-document-viewer'} style={{ '--document-accent': company.document_accent_color || '#15576A' } as CSSProperties}>
            {company.document_header_image_url ? (
              <>
                <img
                  className="preview-header-image"
                  src={resolveStorageUrl(company.document_header_image_url)}
                  alt="Cabeçalho da empresa"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="preview-doc-header-strip">
                  <div className="preview-doc-kind-tag">
                    <span>{previewType === 'quote' ? 'ORÇAMENTO' : 'RECIBO'}</span>
                  </div>
                  <div className="preview-doc-num-tag">
                    <small>DOCUMENTO Nº</small>
                    <strong>{previewDocNumber}</strong>
                  </div>
                </div>
              </>
            ) : (
              <header>
                <div className="preview-brand">
                  <span>{company.logo_image_url ? (
                    <img
                      src={resolveStorageUrl(company.logo_image_url)}
                      alt="Logotipo da empresa"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : <FileCheck2 />}</span>
                  <div><strong>{company.company_name || 'Minha empresa'}</strong><small>{company.legal_name || company.slogan || company.document || 'Dados da empresa'}</small></div>
                </div>
                <div className="preview-number">
                  <span>{previewType === 'quote' ? 'ORÇAMENTO' : 'RECIBO'}</span>
                  <strong>{previewDocNumber}</strong>
                </div>
              </header>
            )}
            <section className="preview-meta">
              <div><small>Emissão</small><strong>{formatDate(previewIssuedAt)}</strong></div>
              {previewType === 'quote' ? (
                <div><small>Validade</small><strong>{formatDate(previewValidUntil)}</strong></div>
              ) : (
                <div><small>Pagamento</small><strong>{paymentLabels[previewPaymentMethod] || 'PIX'}</strong></div>
              )}
              {previewOrderNumber && <div><small>Ordem de serviço</small><strong>{previewOrderNumber}</strong></div>}
            </section>
            <section className="preview-customer">
              <small>{previewType === 'quote' ? 'PROPOSTA PARA' : 'RECEBEMOS DE'}</small>
              <h2>{previewCustomerName}</h2>
              <p>{[previewCustomerDoc, previewCustomerPhone, previewCustomerEmail].filter(Boolean).join(' · ') || 'Dados de contato não informados'}</p>
              {previewCustomerAddress && <p>{previewCustomerAddress}</p>}
            </section>
            <section className="preview-items">
              <div className="preview-item header"><span>Descrição</span><span>Qtd.</span><span>Valor</span><span>Total</span></div>
              {previewItems.filter(item => item.name).map(item => (
                <div className="preview-item" key={item.key}>
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>{currency(item.unit_price)}</span>
                  <strong>{currency(item.quantity * item.unit_price)}</strong>
                </div>
              ))}
              {!previewItems.some(item => item.name) && <p className="preview-empty">Os itens aparecerão aqui.</p>}
            </section>
            <section className="preview-totals">
              <div><span>Subtotal</span><strong>{currency(previewSubtotal)}</strong></div>
              {previewDiscount > 0 && <div><span>Desconto</span><strong>- {currency(previewDiscount)}</strong></div>}
              <div className="grand-total">
                <span>{previewType === 'quote' ? 'Total da proposta' : 'Valor recebido'}</span>
                <strong>{currency(previewTotal)}</strong>
              </div>
            </section>
            {previewNotesText && (
              <section className="preview-notes">
                <small>{previewType === 'quote' ? 'CONDIÇÕES E OBSERVAÇÕES' : 'OBSERVAÇÕES'}</small>
                <p>{previewNotesText}</p>
              </section>
            )}
            {previewType === 'receipt' && (
              <section className="receipt-declaration">
                <p>{company.receipt_terms || 'Declaramos, para os devidos fins, que recebemos o valor indicado neste documento referente aos itens acima descritos.'}</p>
                <div><span /><small>{company.contact_name || 'Assinatura do responsável'}</small></div>
              </section>
            )}
            {company.document_footer_image_url ? (
              <img
                className="preview-footer-image"
                src={resolveStorageUrl(company.document_footer_image_url)}
                alt="Rodapé da empresa"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <footer>
                <div>
                  <strong>{company.company_name || 'Minha empresa'}</strong>
                  <span>{[company.document && `CNPJ/CPF ${company.document}`, company.state_registration && `IE ${company.state_registration}`, company.phone, company.email, company.website].filter(Boolean).join(' · ')}</span>
                  <span>{companyAddress}</span>
                </div>
                <span>{company.document_footer_text || company.slogan}</span>
              </footer>
            )}
          </article>
        </section>
      )}

      {/* TAB: RECEIBOS EMITIDOS */}
      {tab === 'receipts' && (
        <section className="receipts-list-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="eyebrow">COMPROVANTES FINANCEIROS</p>
              <h2 style={{ margin: 0 }}>Recibos emitidos</h2>
            </div>
            <Btn onClick={() => { setType('receipt'); setReceiptOrigin('order'); setTab('create'); setCreated(null); }}>
              <Plus /> Emitir Recibo
            </Btn>
          </div>

          <section className="order-summary-strip" style={{ marginBottom: 16 }}>
            <article>
              <span>Total de recibos</span>
              <strong>{receiptsList.length}</strong>
              <small>emitidos no sistema</small>
            </article>
            <article className="summary-completed">
              <span>Total recebido</span>
              <strong>{currency(receiptsList.reduce((s, r) => s + Number(r.total || 0), 0))}</strong>
              <small>soma dos comprovantes</small>
            </article>
            <article className="summary-active">
              <span>Vinculados a OS</span>
              <strong>{receiptsList.filter(r => r.work_order_id).length}</strong>
              <small>ordens com recibo</small>
            </article>
          </section>

          <div className="toolbar" style={{ marginBottom: 16 }}>
            <label className="search">
              <Search />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por número (REC-...), cliente, OS ou valor"
              />
            </label>
            <span>{filteredReceipts.length} recibos encontrados</span>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><Loader /></div>
          ) : (
            <section className="panel table-panel">
              <div className="data-table">
                <div className="table-head" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '10px 16px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--muted)' }}>
                  <span>Número</span>
                  <span>Cliente</span>
                  <span>Emissão</span>
                  <span>Pagamento</span>
                  <span>OS de Origem</span>
                  <span>Valor Total</span>
                  <span>Ações</span>
                </div>
                {filteredReceipts.map(rec => (
                  <div
                    className="table-row"
                    key={rec.id}
                    style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #edf1f3', cursor: 'pointer' }}
                    onClick={() => openDocViewer(rec)}
                    title="Clique para visualizar o recibo completo"
                  >
                    <div>
                      <strong style={{ color: '#0f766e' }}>{rec.number}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.72rem' }}>Recibo</small>
                    </div>
                    <div>
                      <strong>{rec.customer_name}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.72rem' }}>{rec.customer_document || 'Sem documento'}</small>
                    </div>
                    <span>{formatDate(rec.issued_at)}</span>
                    <span>{paymentLabels[rec.payment_method || 'pix']}</span>
                    <div>
                      {rec.work_order_id ? (
                        <Link
                          to={`/ordens/${rec.work_order_id}`}
                          onClick={e => e.stopPropagation()}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#166534', fontWeight: 600, fontSize: '0.8rem' }}
                          title="Abrir Ordem de Serviço vinculada"
                        >
                          <Wrench size={13} /> {rec.work_order?.number || `OS #${rec.work_order_id}`}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Avulso</span>
                      )}
                    </div>
                    <strong style={{ color: '#166534' }}>{currency(rec.total)}</strong>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <Btn
                        kind="secondary"
                        style={{ minHeight: 30, padding: '0 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => openDocViewer(rec)}
                        title="Visualizar e imprimir recibo"
                      >
                        <Eye size={13} /> Ver Recibo
                      </Btn>
                    </div>
                  </div>
                ))}
                {!filteredReceipts.length && (
                  <div className="empty" style={{ padding: 48, textAlign: 'center' }}>
                    <ReceiptText size={40} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                    <h3>Nenhum recibo encontrado</h3>
                    <p>{searchTerm ? 'Tente buscar com outros termos.' : 'Emita seu primeiro recibo a partir de uma OS ou de forma avulsa.'}</p>
                    <Btn onClick={() => { setType('receipt'); setReceiptOrigin('order'); setTab('create'); setCreated(null); }} style={{ marginTop: 12 }}>
                      <Plus /> Emitir Primeiro Recibo
                    </Btn>
                  </div>
                )}
              </div>
            </section>
          )}
        </section>
      )}

      {/* TAB: ORÇAMENTOS */}
      {tab === 'quotes' && (
        <section className="quotes-list-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="eyebrow">PROPOSTAS COMERCIAIS</p>
              <h2 style={{ margin: 0 }}>Orçamentos</h2>
            </div>
            <Btn onClick={() => { setType('quote'); setTab('create'); setCreated(null); }}>
              <Plus /> Novo Orçamento
            </Btn>
          </div>

          <div className="toolbar" style={{ marginBottom: 16 }}>
            <label className="search">
              <Search />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por número (ORC-...), cliente ou valor"
              />
            </label>
            <span>{filteredQuotes.length} orçamentos</span>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><Loader /></div>
          ) : (
            <section className="panel table-panel">
              <div className="data-table">
                <div className="table-head" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '10px 16px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--muted)' }}>
                  <span>Número</span>
                  <span>Cliente</span>
                  <span>Emissão</span>
                  <span>Validade</span>
                  <span>Status / OS</span>
                  <span>Valor Total</span>
                  <span>Ações</span>
                </div>
                {filteredQuotes.map(q => (
                  <div
                    className="table-row"
                    key={q.id}
                    style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1fr auto', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #edf1f3', cursor: 'pointer' }}
                    onClick={() => openDocViewer(q)}
                    title="Clique para visualizar o orçamento"
                  >
                    <div>
                      <strong>{q.number}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.72rem' }}>Orçamento</small>
                    </div>
                    <div>
                      <strong>{q.customer_name}</strong>
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.72rem' }}>{q.customer_document || 'Sem documento'}</small>
                    </div>
                    <span>{formatDate(q.issued_at)}</span>
                    <span>{q.valid_until ? formatDate(q.valid_until) : 'Indeterminado'}</span>
                    <div>
                      {q.work_order_id ? (
                        <span className="pill ok" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          Aprovado · OS vinculada
                        </span>
                      ) : (
                        <span className="pill info" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          Pendente
                        </span>
                      )}
                    </div>
                    <strong>{currency(q.total)}</strong>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <Btn
                        kind="secondary"
                        style={{ minHeight: 30, padding: '0 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => openDocViewer(q)}
                      >
                        <Eye size={13} /> Ver
                      </Btn>
                      {!q.work_order_id && (
                        <Btn
                          style={{ minHeight: 30, padding: '0 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => openConfirmModal(q)}
                        >
                          <Wrench size={13} /> Gerar OS
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
                {!filteredQuotes.length && (
                  <div className="empty" style={{ padding: 48, textAlign: 'center' }}>
                    <Banknote size={40} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                    <h3>Nenhum orçamento encontrado</h3>
                    <p>{searchTerm ? 'Tente buscar com outros termos.' : 'Crie sua primeira proposta comercial.'}</p>
                    <Btn onClick={() => { setType('quote'); setTab('create'); setCreated(null); }} style={{ marginTop: 12 }}>
                      <Plus /> Criar Orçamento
                    </Btn>
                  </div>
                )}
              </div>
            </section>
          )}
        </section>
      )}

      {/* TAB: CREATE DOCUMENT (Workspace) */}
      {tab === 'create' && (
        <div className="create-document-container">
          <div className="document-kind-picker" role="group" aria-label="Tipo de documento">
            <button type="button" className={type === 'quote' ? 'active' : ''} onClick={() => selectType('quote')}>
              <Banknote />
              <span><strong>Orçamento</strong><small>Proposta de serviços e produtos</small></span>
            </button>
            <button type="button" className={type === 'receipt' ? 'active' : ''} onClick={() => selectType('receipt')}>
              <ReceiptText />
              <span><strong>Recibo</strong><small>Comprovante de valor recebido</small></span>
            </button>
          </div>

          <form className="document-workspace" onSubmit={submit}>
            <section className="document-editor panel">
              {type === 'receipt' ? (
                <>
                  <div className="document-section-title">
                    <span>1</span>
                    <div>
                      <h2>Origem do Recibo</h2>
                      <p>Emita a partir de uma OS existente ou crie um recibo avulso.</p>
                    </div>
                  </div>

                  <nav className="source-switch">
                    <button
                      type="button"
                      className={receiptOrigin === 'order' ? 'active' : ''}
                      onClick={() => {
                        setReceiptOrigin('order')
                        setCreated(null)
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <ClipboardCheck size={16} /> De uma Ordem de Serviço (OS)
                    </button>
                    <button
                      type="button"
                      className={receiptOrigin === 'standalone' ? 'active' : ''}
                      onClick={() => {
                        setReceiptOrigin('standalone')
                        clearOrder()
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <UserRound size={16} /> Recibo avulso (sem OS)
                    </button>
                  </nav>

                  {receiptOrigin === 'order' ? (
                    <div style={{ marginTop: 12 }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Selecione a Ordem de Serviço (OS) <em>*</em></span>
                        <select
                          required
                          value={workOrderId}
                          onChange={event => useOrder(event.target.value)}
                          style={{ padding: '8px 10px', fontSize: '0.88rem', borderRadius: 6 }}
                        >
                          <option value="">Escolha a OS para emitir o recibo...</option>
                          {orders.map(order => (
                            <option key={order.id} value={order.id}>
                              {order.number} — {order.customer.name} — {currency(order.total)} {order.balance > 0 ? `(Saldo: ${currency(order.balance)})` : '(Quitada)'}
                            </option>
                          ))}
                        </select>
                      </label>

                      {selectedOrder ? (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <strong style={{ color: '#166534', fontSize: '0.86rem' }}>✓ OS {selectedOrder.number} vinculada</strong>
                            <button
                              type="button"
                              onClick={clearOrder}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
                            >
                              Limpar / Escolher outra OS
                            </button>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#14532d', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 12px' }}>
                            <div><span style={{ color: '#4b5563' }}>Cliente:</span> <strong>{selectedOrder.customer.name}</strong></div>
                            <div><span style={{ color: '#4b5563' }}>CPF/CNPJ:</span> {selectedOrder.customer.document || 'Não informado'}</div>
                            <div><span style={{ color: '#4b5563' }}>Endereço:</span> {selectedOrder.address ? addressText(selectedOrder.address) : 'Não informado'}</div>
                            <div><span style={{ color: '#4b5563' }}>Total da OS:</span> <strong>{currency(selectedOrder.total)}</strong> {selectedOrder.balance > 0 ? <span style={{ color: '#b45309' }}>(Saldo: {currency(selectedOrder.balance)})</span> : <span style={{ color: '#16a34a' }}>(Quitada)</span>}</div>
                          </div>
                          <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#475569' }}>
                            * Os dados do cliente, endereço e os itens da OS foram carregados automaticamente abaixo.
                          </p>
                        </div>
                      ) : (
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                          Selecione a OS acima para carregar automaticamente o cliente, endereço e itens do atendimento.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: 12 }}>
                      <nav className="source-switch" style={{ marginBottom: 12 }}>
                        <button
                          type="button"
                          className={source === 'registered' ? 'active' : ''}
                          onClick={() => { setSource('registered'); setCreated(null) }}
                        >
                          Cliente cadastrado
                        </button>
                        <button
                          type="button"
                          className={source === 'manual' ? 'active' : ''}
                          onClick={() => { setSource('manual'); setCreated(null) }}
                        >
                          Preenchimento manual
                        </button>
                      </nav>

                      {source === 'registered' ? (
                        <div className="form-grid document-fields">
                          <label>
                            Cliente
                            <select
                              required
                              value={customerId}
                              onChange={event => { setCustomerId(event.target.value); setAddressId(''); setCreated(null) }}
                            >
                              <option value="">Selecione o cliente</option>
                              {customers.map(customer => (
                                <option key={customer.id} value={customer.id}>{customer.name}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Endereço
                            <select
                              value={addressId}
                              onChange={event => { setAddressId(event.target.value); setCreated(null) }}
                              disabled={!selectedCustomer}
                            >
                              <option value="">Sem endereço</option>
                              {selectedCustomer?.addresses?.map(address => (
                                <option key={address.id} value={address.id}>{address.label} · {address.district}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : (
                        <div className="form-grid document-fields">
                          <label>Nome ou razão social<input required value={manual.name} onChange={event => setManual({ ...manual, name: event.target.value })} /></label>
                          <label>CPF/CNPJ<input value={manual.document} onChange={event => setManual({ ...manual, document: event.target.value })} /></label>
                          <label>Telefone<input value={manual.phone} onChange={event => setManual({ ...manual, phone: event.target.value })} /></label>
                          <label>E-mail<input type="email" value={manual.email} onChange={event => setManual({ ...manual, email: event.target.value })} /></label>
                          <label className="span-2">Endereço<input value={manual.address} onChange={event => setManual({ ...manual, address: event.target.value })} /></label>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="document-section-title">
                    <span>1</span>
                    <div>
                      <h2>Dados do cliente</h2>
                      <p>Selecione um cliente cadastrado ou preencha os dados manualmente.</p>
                    </div>
                  </div>
                  <nav className="source-switch">
                    <button
                      type="button"
                      className={source === 'registered' ? 'active' : ''}
                      onClick={() => { setSource('registered'); setCreated(null) }}
                    >
                      Cliente cadastrado
                    </button>
                    <button
                      type="button"
                      className={source === 'manual' ? 'active' : ''}
                      onClick={() => { setSource('manual'); setCreated(null) }}
                    >
                      Preenchimento manual
                    </button>
                  </nav>
                  {source === 'registered' ? (
                    <div className="form-grid document-fields">
                      <label>
                        Cliente
                        <select
                          required
                          value={customerId}
                          onChange={event => { setCustomerId(event.target.value); setAddressId(''); setCreated(null) }}
                        >
                          <option value="">Selecione o cliente</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Endereço
                        <select
                          value={addressId}
                          onChange={event => { setAddressId(event.target.value); setCreated(null) }}
                          disabled={!selectedCustomer}
                        >
                          <option value="">Sem endereço</option>
                          {selectedCustomer?.addresses?.map(address => (
                            <option key={address.id} value={address.id}>{address.label} · {address.district}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <div className="form-grid document-fields">
                      <label>Nome ou razão social<input required value={manual.name} onChange={event => setManual({ ...manual, name: event.target.value })} /></label>
                      <label>CPF/CNPJ<input value={manual.document} onChange={event => setManual({ ...manual, document: event.target.value })} /></label>
                      <label>Telefone<input value={manual.phone} onChange={event => setManual({ ...manual, phone: event.target.value })} /></label>
                      <label>E-mail<input type="email" value={manual.email} onChange={event => setManual({ ...manual, email: event.target.value })} /></label>
                      <label className="span-2">Endereço<input value={manual.address} onChange={event => setManual({ ...manual, address: event.target.value })} /></label>
                    </div>
                  )}
                </>
              )}

              <div className="document-section-title">
                <span>2</span>
                <div><h2>Itens e valores</h2><p>Adicione itens do catálogo ou descreva manualmente.</p></div>
              </div>
              <div className="catalog-adder">
                <select value={catalogChoice} onChange={event => setCatalogChoice(event.target.value)}>
                  <option value="">Selecionar do catálogo</option>
                  <optgroup label="Serviços">{services.map(service => <option value={`service:${service.id}`} key={`service-${service.id}`}>{service.name} · {currency(service.default_price || 0)}</option>)}</optgroup>
                  <optgroup label="Produtos">{products.map(product => <option value={`product:${product.id}`} key={`product-${product.id}`}>{product.name} · {currency(product.sale_price || 0)}</option>)}</optgroup>
                </select>
                <Btn type="button" kind="secondary" onClick={addCatalogItem}><Plus /> Adicionar</Btn>
              </div>
              <div className="document-items-editor">
                <div className="document-item-head"><span>Descrição</span><span>Qtd.</span><span>Valor unit.</span><span /></div>
                {items.map((item, index) => (
                  <div className="document-item-row" key={item.key}>
                    <input aria-label={`Descrição do item ${index + 1}`} required value={item.name} onChange={event => updateItem(item.key, 'name', event.target.value)} placeholder={type === 'quote' ? 'Serviço ou produto' : 'Valor recebido referente a...'} />
                    <input aria-label={`Quantidade do item ${index + 1}`} type="number" min="0.001" step="0.001" required value={item.quantity} onChange={event => updateItem(item.key, 'quantity', event.target.value)} />
                    <input aria-label={`Valor do item ${index + 1}`} type="number" min="0" step="0.01" required value={item.unit_price} onChange={event => updateItem(item.key, 'unit_price', event.target.value)} />
                    <button type="button" className="remove-item" onClick={() => setItems(current => current.length === 1 ? [newItem()] : current.filter(currentItem => currentItem.key !== item.key))} aria-label={`Remover item ${index + 1}`}><Trash2 /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="add-line" onClick={() => setItems(current => [...current, newItem()])}><Plus /> Adicionar linha manual</button>

              <div className="document-section-title">
                <span>3</span>
                <div><h2>Emissão</h2><p>Datas e detalhes finais do documento.</p></div>
              </div>
              <div className="form-grid document-fields">
                <label>Data de emissão<input type="date" required value={issuedAt} onChange={event => setIssuedAt(event.target.value)} /></label>
                {type === 'quote' ? (
                  <>
                    <label>Validade<input type="date" min={issuedAt} value={validUntil} onChange={event => setValidUntil(event.target.value)} /></label>
                    <label>Desconto<input type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={event => setDiscount(Number(event.target.value))} /></label>
                  </>
                ) : (
                  <>
                    <label>Forma de pagamento
                      <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}>
                        {Object.entries(paymentLabels).map(([val, lbl]) => <option value={val} key={val}>{lbl}</option>)}
                      </select>
                    </label>
                    <label>Desconto aplicado<input type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={event => setDiscount(Number(event.target.value))} /></label>
                  </>
                )}
                <label className="span-2">Observações
                  <textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder={type === 'quote' ? 'Condições, garantia e informações adicionais' : 'Declarações ou detalhes do pagamento'} />
                </label>
              </div>
              <div className="document-actions">
                <Btn disabled={busy}><FileCheck2 /> {busy ? 'Emitindo...' : `Emitir ${type === 'quote' ? 'orçamento' : 'recibo'}`}</Btn>
              </div>
            </section>

            <aside className="document-preview-wrap">
              <div className="preview-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span>Pré-visualização</span>
                  <small>Atualizada automaticamente</small>
                </div>
              </div>
              <article className="document-preview" id={tab === 'create' ? 'printable-document' : 'printable-document-editor'} style={{ '--document-accent': company.document_accent_color || '#15576A' } as CSSProperties}>
                {company.document_header_image_url ? (
                  <>
                    <img
                      className="preview-header-image"
                      src={resolveStorageUrl(company.document_header_image_url)}
                      alt="Cabeçalho da empresa"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                    <div className="preview-doc-header-strip">
                      <div className="preview-doc-kind-tag">
                        <span>{previewType === 'quote' ? 'ORÇAMENTO' : 'RECIBO'}</span>
                      </div>
                      <div className="preview-doc-num-tag">
                        <small>DOCUMENTO Nº</small>
                        <strong>{previewDocNumber}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <header>
                    <div className="preview-brand">
                      <span>{company.logo_image_url ? (
                        <img
                          src={resolveStorageUrl(company.logo_image_url)}
                          alt="Logotipo da empresa"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : <FileCheck2 />}</span>
                      <div><strong>{company.company_name || 'Minha empresa'}</strong><small>{company.legal_name || company.slogan || company.document || 'Dados da empresa'}</small></div>
                    </div>
                    <div className="preview-number">
                      <span>{previewType === 'quote' ? 'ORÇAMENTO' : 'RECIBO'}</span>
                      <strong>{previewDocNumber}</strong>
                    </div>
                  </header>
                )}
                <section className="preview-meta">
                  <div><small>Emissão</small><strong>{formatDate(previewIssuedAt)}</strong></div>
                  {previewType === 'quote' ? (
                    <div><small>Validade</small><strong>{formatDate(previewValidUntil)}</strong></div>
                  ) : (
                    <div><small>Pagamento</small><strong>{paymentLabels[previewPaymentMethod] || 'PIX'}</strong></div>
                  )}
                  {previewOrderNumber && <div><small>Ordem de serviço</small><strong>{previewOrderNumber}</strong></div>}
                </section>
                <section className="preview-customer">
                  <small>{previewType === 'quote' ? 'PROPOSTA PARA' : 'RECEBEMOS DE'}</small>
                  <h2>{previewCustomerName}</h2>
                  <p>{[previewCustomerDoc, previewCustomerPhone, previewCustomerEmail].filter(Boolean).join(' · ') || 'Dados de contato não informados'}</p>
                  {previewCustomerAddress && <p>{previewCustomerAddress}</p>}
                </section>
                <section className="preview-items">
                  <div className="preview-item header"><span>Descrição</span><span>Qtd.</span><span>Valor</span><span>Total</span></div>
                  {previewItems.filter(item => item.name).map(item => (
                    <div className="preview-item" key={item.key}>
                      <span>{item.name}</span>
                      <span>{item.quantity}</span>
                      <span>{currency(item.unit_price)}</span>
                      <strong>{currency(item.quantity * item.unit_price)}</strong>
                    </div>
                  ))}
                  {!previewItems.some(item => item.name) && <p className="preview-empty">Os itens aparecerão aqui.</p>}
                </section>
                <section className="preview-totals">
                  <div><span>Subtotal</span><strong>{currency(previewSubtotal)}</strong></div>
                  {previewDiscount > 0 && <div><span>Desconto</span><strong>- {currency(previewDiscount)}</strong></div>}
                  <div className="grand-total">
                    <span>{previewType === 'quote' ? 'Total da proposta' : 'Valor recebido'}</span>
                    <strong>{currency(previewTotal)}</strong>
                  </div>
                </section>
                {previewNotesText && (
                  <section className="preview-notes">
                    <small>{previewType === 'quote' ? 'CONDIÇÕES E OBSERVAÇÕES' : 'OBSERVAÇÕES'}</small>
                    <p>{previewNotesText}</p>
                  </section>
                )}
                {previewType === 'receipt' && (
                  <section className="receipt-declaration">
                    <p>{company.receipt_terms || 'Declaramos, para os devidos fins, que recebemos o valor indicado neste documento referente aos itens acima descritos.'}</p>
                    <div><span /><small>{company.contact_name || 'Assinatura do responsável'}</small></div>
                  </section>
                )}
                {company.document_footer_image_url ? (
                  <img
                    className="preview-footer-image"
                    src={resolveStorageUrl(company.document_footer_image_url)}
                    alt="Rodapé da empresa"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <footer>
                    <div>
                      <strong>{company.company_name || 'Minha empresa'}</strong>
                      <span>{[company.document && `CNPJ/CPF ${company.document}`, company.state_registration && `IE ${company.state_registration}`, company.phone, company.email, company.website].filter(Boolean).join(' · ')}</span>
                      <span>{companyAddress}</span>
                    </div>
                    <span>{company.document_footer_text || company.slogan}</span>
                  </footer>
                )}
              </article>
            </aside>
          </form>
        </div>
      )}

      {/* Confirmation Modal to convert quote to OS */}
      {confirmQuote && (
        <div className="modal-layer">
          <button className="modal-backdrop" onClick={() => setConfirmQuote(null)} aria-label="Fechar" />
          <form className="modal" onSubmit={handleConfirmGenerateOs} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-heading">
                <span className="modal-symbol" style={{ background: '#ecfdf5', color: '#10b981' }}><Wrench /></span>
                <div>
                  <p className="eyebrow">CONVERSÃO EM OS</p>
                  <h2>Gerar Ordem de Serviço</h2>
                  <small>Orçamento {confirmQuote.number}</small>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setConfirmQuote(null)}><X /></button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700 }}>CLIENTE</span>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--navy)' }}>{confirmQuote.customer_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700 }}>ITENS DO ORÇAMENTO</span>
                  <span style={{ fontSize: '0.82rem' }}>{confirmQuote.items?.length || 0} serviço(s)/produto(s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700 }}>VALOR TOTAL DA OS</span>
                  <strong style={{ fontSize: '1.05rem', color: '#166534', fontFamily: 'Manrope, sans-serif' }}>{currency(confirmQuote.total)}</strong>
                </div>
              </div>

              <div className="form-grid">
                <label>Data e Hora Agendada
                  <input
                    type="datetime-local"
                    required
                    value={confirmScheduledAt}
                    onChange={e => setConfirmScheduledAt(e.target.value)}
                  />
                </label>
                <label>Técnico Responsável
                  <select value={confirmTechId} onChange={e => setConfirmTechId(e.target.value)}>
                    <option value="">A definir / Sem técnico</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} {emp.specialty ? `(${emp.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="span-2">Problema / Descrição do Atendimento
                  <textarea
                    rows={2}
                    required
                    value={confirmProblem}
                    onChange={e => setConfirmProblem(e.target.value)}
                    placeholder="Ex: Instalação e manutenção preventiva aprovadas no orçamento"
                  />
                </label>
                <label className="span-2">Observações Adicionais
                  <textarea
                    rows={2}
                    value={confirmNotes}
                    onChange={e => setConfirmNotes(e.target.value)}
                    placeholder="Informações relevantes para a execução"
                  />
                </label>
              </div>

              {confirmError && <div className="form-error" style={{ marginTop: 12 }}>{confirmError}</div>}
            </div>

            <div className="modal-actions" style={{ padding: '16px 24px calc(16px + env(safe-area-inset-bottom))' }}>
              <Btn type="button" kind="ghost" onClick={() => setConfirmQuote(null)}>Cancelar</Btn>
              <Btn disabled={confirmBusy}>
                <ClipboardCheck /> {confirmBusy ? 'Gerando OS...' : 'Confirmar e Gerar OS'}
              </Btn>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
