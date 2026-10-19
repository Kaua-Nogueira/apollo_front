import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, History, LogIn, LogOut, Sparkles, UserCheck, AlertCircle,
  CalendarDays, ArrowLeft, ArrowRight
} from 'lucide-react'
import { api, ApiError } from './api'
import type { PontoData, User } from './types'

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const eventLabels: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
  clock_in: { label: 'Entrada', icon: LogIn, color: '#16a34a' },
  clock_out: { label: 'Saída', icon: LogOut, color: '#dc2626' },
}

const formatDatePt = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dt)
}

const formatShortDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', weekday: 'short' }).format(dt)
}

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function EmployeePontoPage({ user }: { user: User }) {
  const todayStr = getTodayStr()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as 'ponto' | 'calendar' | 'history') || 'ponto'

  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [viewDate, setViewDate] = useState(new Date())
  const [pontoData, setPontoData] = useState<PontoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Keep live time clock ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentMonthStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`

  const loadData = async (date: string, month: string) => {
    setLoading(true)
    try {
      const res = await api.get<PontoData>(`/employee/ponto?date=${date}&month=${month}`)
      setPontoData(res)
    } catch (e) {
      setFeedback({ type: 'error', message: e instanceof Error ? e.message : 'Erro ao carregar dados do ponto.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData(selectedDate, currentMonthStr)
  }, [selectedDate, currentMonthStr])

  const setTab = (tab: 'ponto' | 'calendar' | 'history') => {
    setSearchParams(tab === 'ponto' ? {} : { tab })
  }

  // Single button clock punch
  const handleSinglePunch = async () => {
    setBusy(true)
    setFeedback(null)
    try {
      await api.post('/time-entries/clock', {
        date: selectedDate,
        action: 'auto',
      })
      setFeedback({
        type: 'success',
        message: `Ponto registrado com sucesso para ${formatDatePt(selectedDate)}!`,
      })
      await loadData(selectedDate, currentMonthStr)
    } catch (e) {
      setFeedback({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Não foi possível registrar o ponto.',
      })
    } finally {
      setBusy(false)
    }
  }

  // Day step navigation (previous day / next day)
  const stepDay = (offset: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d + offset)
    const newDateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    setSelectedDate(newDateStr)
    if (dt.getMonth() !== viewDate.getMonth() || dt.getFullYear() !== viewDate.getFullYear()) {
      setViewDate(new Date(dt.getFullYear(), dt.getMonth(), 1))
    }
  }

  // Month navigation for calendar
  const prevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const jumpToToday = () => {
    setSelectedDate(todayStr)
    setViewDate(new Date())
  }

  // Calendar builder
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarDays: Array<{ day: number; dayStr: string } | null> = []
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    calendarDays.push({ day, dayStr })
  }

  const isTodaySelected = selectedDate === todayStr

  // Render Punch Action Card
  const renderPunchCard = () => (
    <section className="panel ponto-action-card">
      <div className="ponto-action-heading">
        <div>
          <p className="eyebrow">REGISTRO DE PONTO</p>
          <h2>{pontoData?.next_action_label ?? 'Bater Ponto'}</h2>
        </div>
        <div className="ponto-status-tag">
          <span className={`status-indicator ${pontoData?.clock_status ?? 'off'}`} />
          <span>
            {pontoData?.clock_status === 'working' ? 'Jornada em andamento (Entrada registrada)' :
             pontoData?.clock_status === 'completed' ? 'Jornada concluída (Saída registrada)' : 'Sem registros nesta data'}
          </span>
        </div>
      </div>

      <div className="ponto-target-banner">
        <span className="target-icon"><CalendarIcon size={16} /></span>
        <div className="target-text">
          <small>Data selecionada para o registro</small>
          <strong>{formatDatePt(selectedDate)}</strong>
        </div>
        {!isTodaySelected && (
          <button type="button" className="target-back-today" onClick={jumpToToday}>
            Ir para Hoje
          </button>
        )}
      </div>

      {/* BOTÃO ÚNICO */}
      <button
        type="button"
        className={`ponto-big-button ${pontoData?.clock_status === 'working' ? 'is-working' : ''}`}
        onClick={handleSinglePunch}
        disabled={busy}
        aria-label="Bater ponto na data selecionada"
      >
        <div className="ponto-btn-icon">
          <Clock size={32} />
        </div>
        <div className="ponto-btn-copy">
          <strong>{busy ? 'Gravando batida...' : (pontoData?.next_action_label ?? 'Bater Ponto')}</strong>
          <span>Clique para bater ponto em {selectedDate.split('-').reverse().join('/')}</span>
        </div>
        <Sparkles className="ponto-btn-sparkle" size={24} />
      </button>
    </section>
  )

  // Render Day Entries Timeline
  const renderDayEntries = () => (
    <section className="panel ponto-day-entries">
      <div className="panel-title">
        <div>
          <p className="eyebrow">REGISTROS DA DATA</p>
          <h2>Batidas em {formatShortDate(selectedDate)}</h2>
        </div>
        <span className="ponto-count-badge">
          {pontoData?.day_entries.length ?? 0} {pontoData?.day_entries.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {loading ? (
        <div className="loading"><span /><span /><span /></div>
      ) : pontoData?.day_entries.length ? (
        <div className="ponto-timeline">
          {pontoData.day_entries.map((entry, index) => {
            const ev = eventLabels[entry.type] ?? { label: entry.type, icon: Clock, color: '#475569' }
            const Icon = ev.icon
            return (
              <div className="ponto-timeline-item" key={entry.id ?? index}>
                <div className="timeline-node" style={{ backgroundColor: ev.color }}>
                  <Icon size={16} color="#fff" />
                </div>
                <div className="timeline-content">
                  <div>
                    <strong>{ev.label}</strong>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.72rem' }}>Batida registrada</small>
                  </div>
                  <time>{entry.time}</time>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="ponto-empty-day">
          <History size={32} />
          <p>Nenhuma batida registrada nesta data.</p>
          <small>Toque no botão acima para bater o ponto para o dia {selectedDate.split('-').reverse().join('/')}.</small>
        </div>
      )}
    </section>
  )

  // Render Calendar Component
  const renderCalendar = (showPunchActionBelow = false) => (
    <>
      <section className="panel ponto-calendar-card">
        <div className="ponto-calendar-header">
          <button
            type="button"
            className="icon-button"
            onClick={prevMonth}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="calendar-title">
            <strong>{monthNames[month]} {year}</strong>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={nextMonth}
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="calendar-grid weekdays">
          {weekDays.map(wd => (
            <span key={wd} className="weekday-label">{wd}</span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="calendar-grid days">
          {calendarDays.map((item, idx) => {
            if (!item) {
              return <div key={`empty-${idx}`} className="calendar-day empty-day" />
            }
            const hasPonto = pontoData?.dates_with_entries.includes(item.dayStr)
            const isSelected = item.dayStr === selectedDate
            const isToday = item.dayStr === todayStr

            return (
              <button
                type="button"
                key={item.dayStr}
                className={`calendar-day ${hasPonto ? 'has-ponto' : ''} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
                onClick={() => setSelectedDate(item.dayStr)}
                aria-label={`Dia ${item.day} de ${monthNames[month]}`}
              >
                <span className="day-number">{item.day}</span>
                {hasPonto && <span className="presence-dot" title="Presença registrada" />}
              </button>
            )
          })}
        </div>

        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-dot green" /> Presença registrada
          </span>
          <span className="legend-item">
            <span className="legend-dot blue" /> Data selecionada
          </span>
        </div>
      </section>

      {/* When in dedicated calendar tab on mobile, show the punch button & day entries right below */}
      {showPunchActionBelow && (
        <div className="calendar-punch-area">
          {renderPunchCard()}
          {renderDayEntries()}
        </div>
      )}
    </>
  )

  // Render History Component
  const renderHistory = () => (
    <>
      <section className="panel ponto-stats-card">
        <h3>Resumo de {monthNames[month]}</h3>
        <div className="ponto-stats-grid">
          <div className="stat-box">
            <span className="stat-label">Dias Presentes</span>
            <strong className="stat-value">{pontoData?.month_stats.days_worked ?? 0}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total de Batidas</span>
            <strong className="stat-value">{pontoData?.month_stats.total_entries ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="panel ponto-history-section">
        <div className="panel-title">
          <div>
            <p className="eyebrow">HISTÓRICO RECENTE</p>
            <h2>Presenças Anteriores</h2>
          </div>
          <span className="ponto-month-tag">Últimos dias</span>
        </div>

        {pontoData?.recent_history.length ? (
          <div className="ponto-history-list">
            {pontoData.recent_history.map(item => {
              const isSelected = item.date === selectedDate
              return (
                <article
                  key={item.date}
                  className={`ponto-history-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(item.date)
                    setTab('ponto')
                  }}
                  title="Toque para ver ou registrar nesta data"
                >
                  <div className="history-date-col">
                    <span className="history-dot" />
                    <div>
                      <strong>{formatShortDate(item.date)}</strong>
                      <small>{item.date.split('-').reverse().slice(0, 2).join('/')}</small>
                    </div>
                  </div>

                  <div className="history-times-col">
                    <span>Entrada: <strong>{item.first_time ?? '—'}</strong></span>
                    {item.last_time && (
                      <span>Saída: <strong>{item.last_time}</strong></span>
                    )}
                  </div>

                  <div className="history-badge-col">
                    <span className="pill ok">
                      <UserCheck size={13} style={{ marginRight: 4 }} />
                      {item.entries_count} {item.entries_count === 1 ? 'batida' : 'batidas'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="ponto-empty-day">
            <History size={28} />
            <p>Nenhum histórico anterior registrado.</p>
          </div>
        )}
      </section>
    </>
  )

  return (
    <main className="content ponto-page-container">
      {/* Top greeting banner */}
      <div className="ponto-header-card panel">
        <div className="ponto-header-left">
          <p className="eyebrow">CONTROLE DE PONTO</p>
          <h1>Olá, {user.name.split(' ')[0]}</h1>
          <p className="ponto-employee-role">Perfil: Funcionário · {user.email}</p>
        </div>
        <div className="ponto-live-clock">
          <Clock size={24} />
          <span>{currentTime.toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>

      {feedback && (
        <div className={`system-alert system-alert-${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <div>{feedback.message}</div>
          <button type="button" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Mobile-Friendly Segmented Tabs */}
      <nav className="ponto-segmented-tabs" aria-label="Navegação do ponto">
        <button
          type="button"
          className={`seg-tab ${activeTab === 'ponto' ? 'active' : ''}`}
          onClick={() => setTab('ponto')}
        >
          <Clock size={16} />
          <span>Bater Ponto</span>
        </button>
        <button
          type="button"
          className={`seg-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setTab('calendar')}
        >
          <CalendarDays size={16} />
          <span>Calendário</span>
        </button>
        <button
          type="button"
          className={`seg-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          <History size={16} />
          <span>Presenças</span>
        </button>
      </nav>

      {/* Quick Day Switcher on Mobile/Desktop */}
      <div className="ponto-day-stepper panel">
        <button
          type="button"
          className="day-step-btn"
          onClick={() => stepDay(-1)}
          title="Dia anterior"
        >
          <ArrowLeft size={16} />
          <span className="btn-label-desktop">Dia anterior</span>
        </button>

        <div className="day-stepper-center">
          <CalendarIcon size={16} />
          <strong>{formatDatePt(selectedDate)}</strong>
          {isTodaySelected ? (
            <span className="badge-today">Hoje</span>
          ) : (
            <button type="button" className="badge-jump-today" onClick={jumpToToday}>
              Voltar p/ Hoje
            </button>
          )}
        </div>

        <button
          type="button"
          className="day-step-btn"
          onClick={() => stepDay(1)}
          title="Próximo dia"
        >
          <span className="btn-label-desktop">Próximo dia</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Mobile view respects the activeTab */}
      <div className="ponto-view-wrapper">
        {/* On desktop, if activeTab === 'ponto', show side-by-side dashboard layout */}
        {activeTab === 'ponto' && (
          <div className="ponto-layout-grid">
            <div className="ponto-main-col">
              {renderPunchCard()}
              {renderDayEntries()}
            </div>
            <div className="ponto-side-col desktop-only">
              {renderCalendar(false)}
              {renderHistory()}
            </div>
          </div>
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="ponto-calendar-view">
            {renderCalendar(true)}
          </div>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <div className="ponto-history-view">
            {renderHistory()}
          </div>
        )}
      </div>
    </main>
  )
}
