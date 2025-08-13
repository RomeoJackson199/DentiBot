import { useEffect, useMemo, useState, MouseEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import { MessageSquare, Calendar, CreditCard, AlertTriangle, Heart } from 'lucide-react'

interface NavItem {
  key: 'chat' | 'all' | 'appointments' | 'payments' | 'emergency'
  label: string
  icon: (props: { className?: string }) => JSX.Element
}

export function MobileBottomNav() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState<string>(() => {
    try {
      return localStorage.getItem('pd_tab') || 'chat'
    } catch {
      return 'chat'
    }
  })

  useEffect(() => {
    if (!isMobile) return
    const previousPadding = document.body.style.paddingBottom
    document.body.style.paddingBottom = '80px'

    const handler = (e: Event) => {
      try {
        const custom = e as CustomEvent
        if (custom && typeof custom.detail === 'string') {
          setActive(custom.detail)
        }
      } catch {
        // no-op
      }
    }
    window.addEventListener('set_pd_tab', handler as EventListener)
    return () => {
      window.removeEventListener('set_pd_tab', handler as EventListener)
      document.body.style.paddingBottom = previousPadding
    }
  }, [isMobile])

  const items: NavItem[] = useMemo(() => ([
    { key: 'chat', label: 'Chat', icon: (props) => <MessageSquare className={props.className} /> },
    { key: 'all', label: 'All', icon: (props) => <Heart className={props.className} /> },
    { key: 'appointments', label: 'Appts', icon: (props) => <Calendar className={props.className} /> },
    { key: 'payments', label: 'Pay', icon: (props) => <CreditCard className={props.className} /> },
    { key: 'emergency', label: 'SOS', icon: (props) => <AlertTriangle className={props.className} /> },
  ]), [])

  if (!isMobile) return null

  const goTab = (tab: NavItem['key']) => (e: MouseEvent) => {
    e.preventDefault()
    try {
      localStorage.setItem('pd_tab', tab)
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent('set_pd_tab', { detail: tab }))
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard')
    }
    setActive(tab)
  }

  const isItemActive = (key: NavItem['key']) => {
    if (location.pathname !== '/dashboard') {
      if (location.pathname === '/chat' && key === 'chat') return true
      if (location.pathname === '/emergency-triage' && key === 'emergency') return true
    }
    return active === key
  }

  return (
    <nav className="mobile-nav md:hidden">
      <div className="mx-auto max-w-3xl flex items-center justify-around gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const selected = isItemActive(item.key)
          return (
            <button
              key={item.key}
              onClick={goTab(item.key)}
              aria-label={item.label}
              className={
                'flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-colors ' +
                (selected ? 'text-dental-primary bg-dental-neutral' : 'text-muted-foreground')
              }
            >
              <Icon className={selected ? 'h-6 w-6' : 'h-6 w-6 opacity-80'} />
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}