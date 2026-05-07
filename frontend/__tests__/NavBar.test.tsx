import { render, screen } from '@testing-library/react'
import { NavBar } from '@/components/NavBar'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/api', () => ({
  auth: { logout: jest.fn().mockResolvedValue({}) },
}))

describe('NavBar', () => {
  it('affiche le logo Pulse', () => {
    render(<NavBar pseudo="romain" />)
    expect(screen.getByText('Pulse')).toBeInTheDocument()
  })

  it('affiche le pseudo de l\'utilisateur', () => {
    render(<NavBar pseudo="romain" />)
    expect(screen.getByText('romain')).toBeInTheDocument()
  })

  it('affiche le badge de notifications si unreadCount > 0', () => {
    render(<NavBar pseudo="romain" unreadCount={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('n\'affiche pas le badge si unreadCount = 0', () => {
    render(<NavBar pseudo="romain" unreadCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
