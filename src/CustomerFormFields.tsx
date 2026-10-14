import type { Customer } from './types'

export function CustomerFormFields({ customer }: { customer?: Partial<Customer> }) {
  return <div className="customer-form-fields">
    <section className="customer-form-section">
      <div className="customer-form-section-title"><span>01</span><div><h3>Dados cadastrais</h3><p>Identificação para localizar o cliente e emitir documentos.</p></div></div>
      <div className="form-grid">
        <label className="span-2">Nome completo ou razão social <em>obrigatório</em><input name="name" required defaultValue={customer?.name ?? ''} placeholder="Ex.: Maria da Silva ou Empresa Ltda." autoComplete="organization" /></label>
        <label>CPF/CNPJ <em>obrigatório</em><input name="document" required defaultValue={customer?.document ?? ''} placeholder="000.000.000-00" autoComplete="off" /></label>
      </div>
    </section>
    <section className="customer-form-section">
      <div className="customer-form-section-title"><span>02</span><div><h3>Contato principal</h3><p>Use os dados de quem acompanha os atendimentos.</p></div></div>
      <div className="form-grid">
        <label className="span-2">Nome de contato<input name="contact_name" defaultValue={customer?.contact_name ?? ''} placeholder="Pessoa responsável pelo atendimento" autoComplete="name" /></label>
        <label>Número de telefone <em>obrigatório</em><input name="phone" type="tel" required defaultValue={customer?.phone ?? ''} placeholder="(00) 00000-0000" autoComplete="tel" /></label>
        <label>WhatsApp<input name="whatsapp" type="tel" defaultValue={customer?.whatsapp ?? ''} placeholder="(00) 00000-0000" autoComplete="off" /></label>
        <label className="span-2">E-mail<input name="email" type="email" defaultValue={customer?.email ?? ''} placeholder="contato@empresa.com.br" autoComplete="email" /></label>
      </div>
    </section>
    <section className="customer-form-section customer-form-notes">
      <div className="customer-form-section-title"><span>03</span><div><h3>Observações</h3><p>Informações úteis para a equipe no próximo atendimento.</p></div></div>
      <label className="customer-notes-field"><span>Notas internas</span><textarea name="notes" rows={3} defaultValue={customer?.notes ?? ''} placeholder="Preferências de contato, horários ou outros detalhes..." /></label>
    </section>
  </div>
}
