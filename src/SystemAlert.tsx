import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export type AlertTone = 'error' | 'success' | 'info'

export function SystemAlert({ children, tone = 'error', onDismiss }: { children: ReactNode; tone?: AlertTone; onDismiss?: () => void }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle
  return <div className={`system-alert system-alert-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    <Icon aria-hidden="true" />
    <div>{children}</div>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Fechar mensagem"><X /></button>}
  </div>
}
