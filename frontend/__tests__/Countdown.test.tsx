import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    sessionState: {
      isActive: false,
      opensAt: new Date(Date.now() + 3600_000).toISOString(),
    },
    loading: false,
  }),
}))

import { Countdown } from '@/components/Countdown'

describe('Countdown', () => {
  it('s\'affiche sans erreur', () => {
    const { container } = render(<Countdown />)
    expect(container).not.toBeEmptyDOMElement()
  })

  it('affiche les labels heures, minutes, secondes', () => {
    render(<Countdown />)
    expect(screen.getByText('heures')).toBeInTheDocument()
    expect(screen.getByText('minutes')).toBeInTheDocument()
    expect(screen.getByText('secondes')).toBeInTheDocument()
  })
})
