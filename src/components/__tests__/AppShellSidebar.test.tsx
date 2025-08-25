import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'

// Silence heavy notification center and analytics in this suite
jest.mock('@/components/notifications/ModernNotificationCenter', () => ({
  ModernNotificationCenter: () => null,
}))

jest.mock('@/lib/analyticsEvents', () => ({
  emitAnalyticsEvent: jest.fn(),
}))

// Mock supabase client broadly for this suite
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      signOut: jest.fn().mockResolvedValue({})
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
        }))
      }))
    })),
    channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })), unsubscribe: jest.fn() })),
  }
}))

// Helper to set viewport width
function setViewport(width: number) {
  // jsdom doesn't fully support resize, but our useIsMobile uses matchMedia and innerWidth
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  // trigger matchMedia listeners
  const listeners = (window.matchMedia as unknown as jest.Mock)
  if (typeof listeners === 'function') {
    // @ts-ignore
    listeners.mockImplementation((query: string) => ({
      matches: width < 768,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  }
}

describe('AppShell sidebar controls', () => {
  beforeEach(() => {
    document.cookie = 'sidebar:state=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('renders desktop collapse button at 1280 and toggles cookie/state', async () => {
    setViewport(1280)
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    )

    // Desktop header toggle visible by its text label within header
    const header = await screen.findByRole('banner')
    const desktopBtn = await within(header).findByRole('button', { name: /collapse|expand/i })
    expect(desktopBtn).toBeInTheDocument()
    const mobileTrigger = within(header).queryByLabelText(/toggle sidebar/i)
    expect(mobileTrigger).not.toBeInTheDocument()

    // Click to toggle collapsed
    await user.click(desktopBtn)

    await waitFor(() => {
      // Cookie should be written with expanded|collapsed
      expect(document.cookie).toMatch(/sidebar:state=collapsed|expanded/)
    })
  })

  it('renders mobile trigger at 375 and not the desktop button', async () => {
    setViewport(375)
    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    )

    const allMobileTriggers = await screen.findAllByLabelText(/toggle sidebar/i)
    expect(allMobileTriggers.length).toBeGreaterThan(0)
    const desktopBtn = screen.queryByRole('button', { name: /collapse sidebar|expand sidebar/i })
    expect(desktopBtn).not.toBeInTheDocument()
  })

  it('loads collapsed when cookie is set to collapsed', async () => {
    document.cookie = 'sidebar:state=collapsed; Path=/'
    setViewport(1280)
    render(
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    )

    // Sidebar root should reflect data-state
    const sidebarRoot = await screen.findByRole('navigation', { name: /primary/i })
    // Walk up to the nearest element with data-state
    const el = sidebarRoot.closest('[data-state]') || document.querySelector('[data-state]')
    expect(el).toHaveAttribute('data-state', 'collapsed')

    // Collapsed mode active
    expect(el).toHaveAttribute('data-collapsible', 'icon')
  })
})

