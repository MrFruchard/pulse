import { render, screen, fireEvent } from '@testing-library/react'
import { PostCard } from '@/components/PostCard'
import type { Post } from '@/types'

jest.mock('@/components/CommentSection', () => ({
  CommentSection: () => <div data-testid="comment-section" />,
}))

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 'post-1',
  userId: 'user-1',
  sessionId: 'session-1',
  content: 'Contenu du post de test',
  intention: 'SHARE',
  privacy: 'PUBLIC',
  imageUrl: null,
  isFlagged: false,
  createdAt: new Date().toISOString(),
  author: { pseudo: 'testuser', avatarUrl: null, streak: 3 },
  reactions: { LIKE: 2, FIRE: 1, INSIGHTFUL: 0, SUPPORT: 0 },
  commentCount: 4,
  userReaction: undefined,
  ...overrides,
})

describe('PostCard', () => {
  it('affiche le contenu du post', () => {
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('Contenu du post de test')).toBeInTheDocument()
  })

  it('affiche le pseudo de l\'auteur', () => {
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('affiche le streak si > 1', () => {
    render(<PostCard post={makePost()} />)
    expect(screen.getByText(/🔥.*3/)).toBeInTheDocument()
  })

  it('affiche le badge intention', () => {
    render(<PostCard post={makePost({ intention: 'QUESTION' })} />)
    expect(screen.getByText('Question')).toBeInTheDocument()
  })

  it('affiche les compteurs de réactions', () => {
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('2')).toBeInTheDocument() // LIKE count
  })

  it('affiche le nombre de commentaires', () => {
    render(<PostCard post={makePost()} />)
    expect(screen.getByText(/4 commentaires/)).toBeInTheDocument()
  })

  it('affiche la section commentaires au clic', () => {
    render(<PostCard post={makePost()} />)
    const btn = screen.getByLabelText(/afficher les commentaires/i)
    fireEvent.click(btn)
    expect(screen.getByTestId('comment-section')).toBeInTheDocument()
  })

  it('masque la section commentaires au second clic', () => {
    render(<PostCard post={makePost()} />)
    const btn = screen.getByLabelText(/afficher les commentaires/i)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(screen.queryByTestId('comment-section')).not.toBeInTheDocument()
  })

  it('affiche l\'initiale de l\'auteur en avatar', () => {
    render(<PostCard post={makePost()} />)
    expect(screen.getByText('T')).toBeInTheDocument() // 'testuser'[0].toUpperCase()
  })

  it('ne réagit pas si onReact non fourni', () => {
    render(<PostCard post={makePost()} />)
    const btn = screen.getByLabelText(/aimer/i)
    expect(() => fireEvent.click(btn)).not.toThrow()
  })
})
