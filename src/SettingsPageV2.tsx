import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Building2, FileImage, Landmark, MapPin, Palette, Save, Upload } from 'lucide-react'
import { api } from './api'
import { Btn, Header, Loader, Notice, useData } from './Modules'

export type CompanySettings = {
  id?: number; company_name: string; legal_name?: string; document?: string; state_registration?: string;
  municipal_registration?: string; contact_name?: string; phone?: string; whatsapp?: string; email?: string;
  website?: string; zip_code?: string; street?: string; number?: string; complement?: string; district?: string;
  city?: string; state?: string; pix_key?: string; slogan?: string; document_accent_color?: string;
  document_footer_text?: string; quote_terms?: string; receipt_terms?: string; timezone: string;
  logo_image_url?: string; document_header_image_url?: string; document_footer_image_url?: string;
}

function SettingsSection({ icon, title, description, children }: { icon:ReactNode; title:string; description:string; children:ReactNode }) {
  return <section className="settings-section panel"><div className="settings-section-head"><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div></div>{children}</section>
}

function ImageField({ name, label, hint, current, variant }: { name:string; label:string; hint:string; current?:string; variant:'logo'|'header'|'footer' }) {
  const [preview, setPreview] = useState(current || '')
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }
  return <label className={`branding-upload branding-${variant}`}><span className="branding-preview">{preview ? <img src={preview} alt={`Prévia de ${label.toLowerCase()}`} /> : <FileImage />}</span><span className="branding-copy"><strong>{label}</strong><small>{hint}</small><em><Upload /> Selecionar imagem</em></span><input type="file" name={name} accept="image/png,image/jpeg,image/webp" onChange={change} /></label>
}

export function SettingsPageV2() {
  const { data, loading, error, reload } = useData<CompanySettings>('/settings', { company_name:'Minha empresa', timezone:'America/Sao_Paulo' })
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      await api.upload<CompanySettings>('/settings', new FormData(event.currentTarget))
      setTone('success'); setMessage('Configurações da empresa salvas. Os documentos já usam a nova identidade visual.'); await reload()
    } catch (err) {
      setTone('error'); setMessage(err instanceof Error ? err.message : 'Não foi possível salvar as configurações.')
    } finally { setBusy(false) }
  }

  if (loading) return <main className="content"><Loader /></main>
  return <main className="content settings-page"><Header eyebrow="ADMINISTRAÇÃO" title="Configurações da empresa" />
    <div className="settings-intro"><div><Palette /><span><strong>Identidade dos documentos</strong><small>Estas informações aparecem automaticamente nos orçamentos e recibos.</small></span></div><a href="/documentos">Ver documentos</a></div>
    <form onSubmit={submit} key={`${data.id}-${data.logo_image_url}-${data.document_header_image_url}-${data.document_footer_image_url}`}>
      <SettingsSection icon={<Palette />} title="Identidade visual" description="Imagens e cores usadas no cabeçalho, rodapé e marca da empresa.">
        <div className="branding-grid"><ImageField name="logo_image" label="Logotipo" hint="PNG, JPG ou WebP · formato quadrado" current={data.logo_image_url} variant="logo" /><ImageField name="document_header_image" label="Imagem do cabeçalho" hint="Recomendado: 1400 × 240 px" current={data.document_header_image_url} variant="header" /><ImageField name="document_footer_image" label="Imagem do rodapé" hint="Recomendado: 1400 × 160 px" current={data.document_footer_image_url} variant="footer" /></div>
        <div className="form-grid settings-fields"><label>Cor principal dos documentos<div className="color-field"><input name="document_accent_color" type="color" defaultValue={data.document_accent_color || '#15576A'} /><input aria-label="Código da cor principal" defaultValue={data.document_accent_color || '#15576A'} readOnly /></div></label><label>Slogan<input name="slogan" defaultValue={data.slogan} placeholder="Excelência em refrigeração e climatização" /></label></div>
      </SettingsSection>

      <SettingsSection icon={<Building2 />} title="Dados fiscais" description="Identificação legal exibida nos documentos emitidos.">
        <div className="form-grid settings-fields"><label>Nome fantasia<input name="company_name" defaultValue={data.company_name} required /></label><label>Razão social<input name="legal_name" defaultValue={data.legal_name} /></label><label>CNPJ/CPF<input name="document" defaultValue={data.document} placeholder="00.000.000/0000-00" /></label><label>Inscrição estadual<input name="state_registration" defaultValue={data.state_registration} /></label><label>Inscrição municipal<input name="municipal_registration" defaultValue={data.municipal_registration} /></label><label>Responsável pela empresa<input name="contact_name" defaultValue={data.contact_name} /></label></div>
      </SettingsSection>

      <SettingsSection icon={<MapPin />} title="Contato e endereço" description="Canais oficiais e localização da empresa.">
        <div className="form-grid settings-fields"><label>Telefone<input name="phone" defaultValue={data.phone} /></label><label>WhatsApp<input name="whatsapp" defaultValue={data.whatsapp} /></label><label>E-mail<input name="email" type="email" defaultValue={data.email} /></label><label>Site<input name="website" defaultValue={data.website} placeholder="www.suaempresa.com.br" /></label><label>CEP<input name="zip_code" defaultValue={data.zip_code} /></label><label>Rua / avenida<input name="street" defaultValue={data.street} /></label><label>Número<input name="number" defaultValue={data.number} /></label><label>Complemento<input name="complement" defaultValue={data.complement} /></label><label>Bairro<input name="district" defaultValue={data.district} /></label><label>Cidade<input name="city" defaultValue={data.city} /></label><label>UF<input name="state" maxLength={2} defaultValue={data.state} /></label><label>Fuso horário<select name="timezone" defaultValue={data.timezone || 'America/Sao_Paulo'}><option value="America/Sao_Paulo">Brasília · São Paulo</option><option value="America/Manaus">Manaus</option><option value="America/Belem">Belém</option><option value="America/Fortaleza">Fortaleza</option></select></label></div>
      </SettingsSection>

      <SettingsSection icon={<Landmark />} title="Financeiro e textos padrão" description="Dados de recebimento e condições incluídas automaticamente.">
        <div className="form-grid settings-fields"><label className="span-2">Chave PIX<input name="pix_key" defaultValue={data.pix_key} /></label><label className="span-2">Texto do rodapé<textarea name="document_footer_text" rows={2} defaultValue={data.document_footer_text} placeholder="Agradecemos pela preferência." /></label><label className="span-2">Condições padrão do orçamento<textarea name="quote_terms" rows={3} defaultValue={data.quote_terms} placeholder="Prazo, garantia, condições de pagamento..." /></label><label className="span-2">Declaração padrão do recibo<textarea name="receipt_terms" rows={3} defaultValue={data.receipt_terms} placeholder="Declaramos que recebemos o valor descrito..." /></label></div>
      </SettingsSection>
      {error && <Notice text={error} />}{message && <Notice text={message} tone={tone} />}
      <div className="settings-save"><Btn disabled={busy}><Save /> {busy ? 'Salvando...' : 'Salvar configurações'}</Btn></div>
    </form>
  </main>
}
