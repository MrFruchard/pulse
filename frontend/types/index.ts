export type UserRole = 'user' | 'moderator' | 'admin'
export type UserStatus = 'active' | 'dormant' | 'suspended'
export type PostIntention = 'QUESTION' | 'SHARE' | 'PROJECT' | 'CHALLENGE'
export type ReactionType = 'LIKE' | 'FIRE' | 'INSIGHTFUL' | 'SUPPORT'
export type NotificationType = 'SESSION_OPEN' | 'REACTION' | 'COMMENT' | 'FOLLOW' | 'REPORT'
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'HARASSMENT' | 'OTHER'

export interface User {
  id: string
  pseudo: string
  avatarUrl: string | null
  bio: string | null
  role: UserRole
  streak: number
  status: UserStatus
  createdAt: string
}

export interface Session {
  id: string
  opensAt: string
  closesAt: string
  isActive: boolean
}

export interface SessionState {
  isActive: boolean
  opensAt: string
  closesAt?: string
  sessionId?: string
}

export interface Post {
  id: string
  userId: string
  sessionId: string
  content: string
  intention: PostIntention
  imageUrl: string | null
  isFlagged: boolean
  createdAt: string
  author: Pick<User, 'pseudo' | 'avatarUrl' | 'streak'>
  reactions: Record<ReactionType, number>
  commentCount: number
  userReaction?: ReactionType
}

export interface Comment {
  id: string
  postId: string
  userId: string
  content: string
  createdAt: string
  author: Pick<User, 'pseudo' | 'avatarUrl'>
}

export interface Notification {
  id: string
  type: NotificationType
  payload: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export type FeedType = 'global' | 'following'

export interface ApiError {
  error: string
}
