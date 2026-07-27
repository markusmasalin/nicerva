type Props = {
  imageUrl?: string | null
}

const HEIGHT = 33

export function BottleIcon({ imageUrl }: Props) {
  if (imageUrl) {
    return <img src={imageUrl} style={{ height: HEIGHT, width: 'auto', display: 'block' }} />
  }

  return (
    <svg height={HEIGHT} viewBox="0 0 10 20" style={{ display: 'block' }}>
      <rect x="3" y="0" width="4" height="5" rx="1" fill="currentColor" />
      <rect x="0" y="5" width="10" height="15" rx="2" fill="currentColor" />
    </svg>
  )
}
