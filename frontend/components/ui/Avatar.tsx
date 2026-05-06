interface AvatarProps {
  pseudo: string
  avatarUrl?: string | null
  size?: number
}

export function Avatar({ pseudo, avatarUrl, size = 32 }: AvatarProps) {
  const hue = pseudo.charCodeAt(0) % 360
  const fontSize = Math.round(size * 0.42)

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={pseudo}
        width={size}
        height={size}
        style={{ borderRadius: '50%', flexShrink: 0 }}
        className="border border-border-subtle object-cover"
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, hsl(${hue}, 30%, 35%), hsl(${hue}, 25%, 22%))`,
        fontSize,
        flexShrink: 0,
      }}
      className="flex items-center justify-center font-semibold text-white/85 border border-border-subtle"
    >
      {pseudo[0].toUpperCase()}
    </div>
  )
}
