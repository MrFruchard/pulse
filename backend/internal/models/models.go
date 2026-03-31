package models

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string
type UserStatus string
type PostIntention string
type ReactionType string
type NotificationType string
type ReportReason string
type ReportStatus string

const (
	RoleUser      UserRole = "user"
	RoleModerator UserRole = "moderator"
	RoleAdmin     UserRole = "admin"

	StatusActive    UserStatus = "active"
	StatusDormant   UserStatus = "dormant"
	StatusSuspended UserStatus = "suspended"

	IntentionQuestion  PostIntention = "QUESTION"
	IntentionShare     PostIntention = "SHARE"
	IntentionProject   PostIntention = "PROJECT"
	IntentionChallenge PostIntention = "CHALLENGE"

	ReactionLike       ReactionType = "LIKE"
	ReactionFire       ReactionType = "FIRE"
	ReactionInsightful ReactionType = "INSIGHTFUL"
	ReactionSupport    ReactionType = "SUPPORT"

	NotifSessionOpen NotificationType = "SESSION_OPEN"
	NotifReaction    NotificationType = "REACTION"
	NotifComment     NotificationType = "COMMENT"
	NotifFollow      NotificationType = "FOLLOW"
	NotifReport      NotificationType = "REPORT"

	ReportSpam         ReportReason = "SPAM"
	ReportInappropiate ReportReason = "INAPPROPRIATE"
	ReportHarassment   ReportReason = "HARASSMENT"
	ReportOther        ReportReason = "OTHER"

	ReportPending  ReportStatus = "PENDING"
	ReportReviewed ReportStatus = "REVIEWED"
	ReportDismised ReportStatus = "DISMISSED"
)

type User struct {
	ID           uuid.UUID  `db:"id" json:"id"`
	Email        string     `db:"email" json:"-"`
	PasswordHash string     `db:"password_hash" json:"-"`
	Pseudo       string     `db:"pseudo" json:"pseudo"`
	AvatarURL    *string    `db:"avatar_url" json:"avatarUrl"`
	Bio          *string    `db:"bio" json:"bio"`
	Role         UserRole   `db:"role" json:"role"`
	Streak       int        `db:"streak" json:"streak"`
	Status       UserStatus `db:"status" json:"status"`
	CreatedAt    time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt    time.Time  `db:"updated_at" json:"updatedAt"`
}

type Session struct {
	ID        uuid.UUID `db:"id" json:"id"`
	OpensAt   time.Time `db:"opens_at" json:"opensAt"`
	ClosesAt  time.Time `db:"closes_at" json:"closesAt"`
	IsActive  bool      `db:"is_active" json:"isActive"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}

type Post struct {
	ID        uuid.UUID     `db:"id" json:"id"`
	UserID    uuid.UUID     `db:"user_id" json:"userId"`
	SessionID uuid.UUID     `db:"session_id" json:"sessionId"`
	Content   string        `db:"content" json:"content"`
	Intention PostIntention `db:"intention" json:"intention"`
	ImageURL  *string       `db:"image_url" json:"imageUrl"`
	IsFlagged bool          `db:"is_flagged" json:"isFlagged"`
	CreatedAt time.Time     `db:"created_at" json:"createdAt"`
}

type Comment struct {
	ID        uuid.UUID `db:"id" json:"id"`
	PostID    uuid.UUID `db:"post_id" json:"postId"`
	UserID    uuid.UUID `db:"user_id" json:"userId"`
	Content   string    `db:"content" json:"content"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}

type Reaction struct {
	ID        uuid.UUID    `db:"id" json:"id"`
	PostID    uuid.UUID    `db:"post_id" json:"postId"`
	UserID    uuid.UUID    `db:"user_id" json:"userId"`
	Type      ReactionType `db:"type" json:"type"`
	CreatedAt time.Time    `db:"created_at" json:"createdAt"`
}

type Follow struct {
	ID          uuid.UUID `db:"id" json:"id"`
	FollowerID  uuid.UUID `db:"follower_id" json:"followerId"`
	FollowingID uuid.UUID `db:"following_id" json:"followingId"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
}

type Notification struct {
	ID        uuid.UUID        `db:"id" json:"id"`
	UserID    uuid.UUID        `db:"user_id" json:"userId"`
	Type      NotificationType `db:"type" json:"type"`
	Payload   []byte           `db:"payload" json:"payload"`
	IsRead    bool             `db:"is_read" json:"isRead"`
	CreatedAt time.Time        `db:"created_at" json:"createdAt"`
}

type Report struct {
	ID         uuid.UUID    `db:"id" json:"id"`
	PostID     uuid.UUID    `db:"post_id" json:"postId"`
	ReporterID uuid.UUID    `db:"reporter_id" json:"reporterId"`
	Reason     ReportReason `db:"reason" json:"reason"`
	Status     ReportStatus `db:"status" json:"status"`
	CreatedAt  time.Time    `db:"created_at" json:"createdAt"`
}

type SessionAttendance struct {
	ID        uuid.UUID `db:"id" json:"id"`
	UserID    uuid.UUID `db:"user_id" json:"userId"`
	SessionID uuid.UUID `db:"session_id" json:"sessionId"`
	JoinedAt  time.Time `db:"joined_at" json:"joinedAt"`
}
