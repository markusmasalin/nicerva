type Props = {
  imageUrl?: string | null
}

export function BottleIcon({ imageUrl }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        style={{ width: '11px', height: '22px', objectFit: 'contain', display: 'block' }}
      />
    )
  }

  return (
    <svg width="11" height="22" viewBox="0 0 10 20" style={{ display: 'block' }}>
      <rect x="3" y="0" width="4" height="5" rx="1" fill="currentColor" />
      <rect x="0" y="5" width="10" height="15" rx="2" fill="currentColor" />
    </svg>
  )
}
