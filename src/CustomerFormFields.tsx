import { useState } from 'react'
import type { Customer } from './types'

export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5')
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function CustomerFormFields({ customer }: { customer?: Partial<Customer> }) {
  const [docValue, setDocValue] = useState(() => maskCpfCnpj(customer?.document ?? ''))
  const [whatsappValue, setWhatsappValue] = useState(() => maskPhone(customer?.whatsapp || customer?.phone || ''))

  const primaryAddress = customer?.addresses?.[0]
  const [zipCode, setZipCode] = useState(() => maskCep(primaryAddress?.zip_code ?? ''))
  const [street, setStreet] = useState(() => primaryAddress?.street ?? '')
  const [number, setNumber] = useState(() => primaryAddress?.number ?? '')
  const [complement, setComplement] = useState(() => primaryAddress?.complement ?? '')
  const [district, setDistrict] = useState(() => primaryAddress?.district ?? '')
  const [city, setCity] = useState(() => primaryAddress?.city ?? '')
  const [state, setState] = useState(() => primaryAddress?.state ?? '')
  const [zipLoading, setZipLoading] = useState(false)
  const [zipHint, setZipHint] = useState('')

  const lookupZip = async (rawZip: string) => {
    const digits = rawZip.replace(/\D/g, '')
    if (digits.length !== 8) return
    setZipLoading(true)
    setZipHint('Consultando CEP...')
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!response.ok) throw new Error()
      const result = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }
      if (result.erro) {
        setZipHint('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      if (result.logradouro) setStreet(result.logradouro)
      if (result.bairro) setDistrict(result.bairro)
      if (result.localidade) setCity(result.localidade)
      if (result.uf) setState(result.uf.toUpperCase())
      setZipHint('Endereço preenchido automaticamente.')
    } catch {
      setZipHint('Não foi possível consultar o CEP. Preencha manualmente.')
    } finally {
      setZipLoading(false)
    }
  }

  return <div className="customer-form-fields">
    <section className="customer-form-section">
      <div className="customer-form-section-title"><span>01</span><div><h3>Dados cadastrais</h3><p>Identificação para localizar o cliente e emitir documentos.</p></div></div>
      <div className="form-grid">
        <label className="span-2">Nome completo ou razão social <em>obrigatório</em><input name="name" required defaultValue={customer?.name ?? ''} placeholder="Ex.: Maria da Silva ou Empresa Ltda." autoComplete="organization" /></label>
        <label className="span-2">CPF ou CNPJ <small style={{ fontWeight: 400, color: '#7a8b94' }}>Opcional</small><input name="document" value={docValue} onChange={e => setDocValue(maskCpfCnpj(e.target.value))} placeholder="000.000.000-00 ou 00.000.000/0000-00" autoComplete="off" /></label>
      </div>
    </section>
    <section className="customer-form-section">
      <div className="customer-form-section-title"><span>02</span><div><h3>Contato principal</h3><p>Use os dados de quem acompanha os atendimentos.</p></div></div>
      <div className="form-grid">
        <label className="span-2">Nome de contato <small style={{ fontWeight: 400, color: '#7a8b94' }}>Opcional</small><input name="contact_name" defaultValue={customer?.contact_name ?? ''} placeholder="Pessoa responsável pelo atendimento" autoComplete="name" /></label>
        <label>WhatsApp <em>obrigatório</em>
          <input
            name="whatsapp"
            type="tel"
            required
            value={whatsappValue}
            onChange={e => setWhatsappValue(maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            autoComplete="tel"
          />
          <input type="hidden" name="phone" value={whatsappValue} />
        </label>
        <label>E-mail <small style={{ fontWeight: 400, color: '#7a8b94' }}>Opcional</small><input name="email" type="email" defaultValue={customer?.email ?? ''} placeholder="contato@empresa.com.br" autoComplete="email" /></label>
      </div>
    </section>
    <section className="customer-form-section">
      <div className="customer-form-section-title"><span>03</span><div><h3>Endereço principal</h3><p>Local de atendimento para ordens de serviço e manutenções.</p></div></div>
      <div className="form-grid">
        <label>
          CEP <small style={{ fontWeight: 400, color: '#7a8b94' }}>Opcional</small>
          <input
            name="zip_code"
            inputMode="numeric"
            value={zipCode}
            onChange={e => {
              const val = maskCep(e.target.value)
              setZipCode(val)
              if (val.replace(/\D/g, '').length === 8) {
                void lookupZip(val)
              }
            }}
            onBlur={() => void lookupZip(zipCode)}
            placeholder="00000-000"
            autoComplete="postal-code"
            maxLength={9}
          />
          {zipHint && <small style={{ display: 'block', marginTop: 3, color: zipLoading ? '#267c8c' : '#7a8b94', fontSize: '0.66rem' }}>{zipHint}</small>}
        </label>
        <label>
          Identificação do local
          <input
            name="address_label"
            defaultValue={primaryAddress?.label || 'Principal'}
            placeholder="Ex.: Principal, Matriz, Casa..."
          />
        </label>
        <label className="span-2">
          Rua / Logradouro
          <input
            name="street"
            value={street}
            onChange={e => setStreet(e.target.value)}
            placeholder="Rua, avenida, travessa..."
            autoComplete="address-line1"
          />
        </label>
        <label>
          Número
          <input
            name="number"
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder="Nº ou S/N"
          />
        </label>
        <label>
          Complemento <small style={{ fontWeight: 400, color: '#7a8b94' }}>Opcional</small>
          <input
            name="complement"
            value={complement}
            onChange={e => setComplement(e.target.value)}
            placeholder="Apto, sala, galpão..."
          />
        </label>
        <label>
          Bairro
          <input
            name="district"
            value={district}
            onChange={e => setDistrict(e.target.value)}
            placeholder="Bairro"
            autoComplete="address-level3"
          />
        </label>
        <label>
          Cidade
          <input
            name="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Cidade"
            autoComplete="address-level2"
          />
        </label>
        <label>
          Estado (UF)
          <input
            name="state"
            maxLength={2}
            value={state}
            onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="UF (ex.: MA, SP)"
            autoComplete="address-level1"
          />
        </label>
      </div>
    </section>
    <section className="customer-form-section customer-form-notes">
      <div className="customer-form-section-title"><span>04</span><div><h3>Observações</h3><p>Informações úteis para a equipe no próximo atendimento.</p></div></div>
      <label className="customer-notes-field"><span>Notas internas</span><textarea name="notes" rows={2} defaultValue={customer?.notes ?? ''} placeholder="Preferências de contato, horários ou outros detalhes..." /></label>
    </section>
  </div>
}
