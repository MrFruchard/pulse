export type UserRole = 'user' | 'moderator' | 'admin'
export type UserStatus = 'active' | 'dormant' | 'suspended'
export type PostIntention = 'QUESTION' | 'SHARE' | 'PROJECT' | 'CHALLENGE'
export type PostPrivacy = 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'
export type ReactionType = 'LIKE' | 'FIRE' | 'INSIGHTFUL' | 'SUPPORT'
export type NotificationType = 'SESSION_OPEN' | 'REACTION' | 'COMMENT' | 'FOLLOW' | 'REPORT' | 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPTED'
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'HARASSMENT' | 'OTHER'

export interface User {
  id: string
  pseudo: string
  avatarUrl: string | null
  bio: string | null
  role: UserRole
  streak: number
  status: UserStatus
  isPrivate: boolean
  createdAt: string
}

export interface FollowRequest {
  id: string
  requesterId: string
  pseudo: string
  avatarUrl: string | null
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
  privacy: PostPrivacy
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
  imageUrl: string | null
  createdAt: string
  authorPseudo: string
  authorAvatarUrl: string | null
}

export interface Notification {
  id: string
  type: NotificationType
  payload: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED'

export interface Report {
  id: string
  postId: string
  reporterId: string
  reason: ReportReason
  status: ReportStatus
  createdAt: string
  postContent: string
  reporterPseudo: string
}

export type FeedType = 'global' | 'following'

export interface ApiError {
  error: string
}
