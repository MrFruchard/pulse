import type { Post, ReactionType } from '@/types'

const INTENTIONS = {
  QUESTION: { label: 'Question', color: 'text-blue-400 bg-blue-400/10' },
  SHARE: { label: 'Partage', color: 'text-green-400 bg-green-400/10' },
  PROJECT: { label: 'Projet', color: 'text-purple-400 bg-purple-400/10' },
  CHALLENGE: { label: 'Challenge', color: 'text-orange-400 bg-orange-400/10' },
}

const PRIVACY_BADGE: Record<string, string> = {
  FOLLOWERS: '👥',
  PRIVATE:   '🔒',
}

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: 'LIKE', emoji: '👍' },
  { type: 'FIRE', emoji: '🔥' },
  { type: 'INSIGHTFUL', emoji: '💡' },
  { type: 'SUPPORT', emoji: '🤝' },
]

interface PostCardProps {
  post: Post
  onReact?: (postId: string, type: ReactionType) => void
}

export function PostCard({ post, onReact }: PostCardProps) {
  const intention = INTENTIONS[post.intention]

  return (
    <article className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold shrink-0">
          {post.author.pseudo[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm">{post.author.pseudo}</span>
            {post.author.streak > 0 && (
              <span className="text-xs text-yellow-500">🔥 {post.author.streak}</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intention.color}`}>
              {intention.label}
            </span>
            {PRIVACY_BADGE[post.privacy] && (
              <span className="text-xs text-gray-500" title={post.privacy === 'FOLLOWERS' ? 'Abonnés seulement' : 'Privé'}>
                {PRIVACY_BADGE[post.privacy]}
              </span>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              {new Date(post.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {REACTIONS.map(({ type, emoji }) => (
              <button
                key={type}
                onClick={() => onReact?.(post.id, type)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition
                  ${post.userReaction === type
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                  }`}
              >
                <span>{emoji}</span>
                {(post.reactions[type] ?? 0) > 0 && (
                  <span>{post.reactions[type]}</span>
                )}
              </button>
            ))}
            <span className="text-xs text-gray-500 ml-auto">
              {post.commentCount} commentaire{post.commentCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
