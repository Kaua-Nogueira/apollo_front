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

export function CustomerFormFields({ customer }: { customer?: Partial<Customer> }) {
  const [docValue, setDocValue] = useState(() => maskCpfCnpj(customer?.document ?? ''))
  const [whatsappValue, setWhatsappValue] = useState(() => maskPhone(customer?.whatsapp || customer?.phone || ''))

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
    <section className="customer-form-section customer-form-notes">
      <div className="customer-form-section-title"><span>03</span><div><h3>Observações</h3><p>Informações úteis para a equipe no próximo atendimento.</p></div></div>
      <label className="customer-notes-field"><span>Notas internas</span><textarea name="notes" rows={3} defaultValue={customer?.notes ?? ''} placeholder="Preferências de contato, horários ou outros detalhes..." /></label>
    </section>
  </div>
}
