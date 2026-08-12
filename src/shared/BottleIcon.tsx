import { BOTTLE_SHAPE_PATHS, type BottleShapeKey } from './bottleShapes'

type Props = {
  imageUrl?: string | null
  shape?: BottleShapeKey
}

const HEIGHT = 33

export function BottleIcon({ imageUrl, shape }: Props) {
  if (imageUrl) {
    return <img src={imageUrl} style={{ height: HEIGHT, width: 'auto', display: 'block' }} />
  }

  const { viewBox, element } = BOTTLE_SHAPE_PATHS[shape ?? 'bordeaux']

  return (
    <svg
      height={HEIGHT}
      viewBox={viewBox}
      fill="currentColor"
      style={{ display: 'block' }}
      dangerouslySetInnerHTML={{ __html: element }}
    />
  )
}
