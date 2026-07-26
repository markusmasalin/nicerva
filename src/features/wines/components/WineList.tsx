import { Fragment } from 'react'
import type { Wine } from '../types'

type Props = {
  wines: Wine[]
  bottleCounts?: Record<string, number>
  expandedWineId?: string | null
  onToggleBottles: (id: string) => void
  onEdit: (wine: Wine) => void
  onDelete: (id: string) => void
  renderBottles?: (wineId: string) => React.ReactNode
}

export function WineList({
  wines,
  bottleCounts,
  expandedWineId,
  onToggleBottles,
  onEdit,
  onDelete,
  renderBottles,
}: Props) {
  if (wines.length === 0) {
    return <p>Ei viinejä hakuehdoilla.</p>
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nimi</th>
          <th>Tuottaja</th>
          <th>Maa / Alue</th>
          <th>Appellation</th>
          <th>Vuosikerta</th>
          <th>Tyyppi</th>
          <th>Pulloja</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {wines.map((wine) => (
          <Fragment key={wine.id}>
            <tr>
              <td>{wine.name}</td>
              <td>{wine.producer}</td>
              <td>
                {wine.country} / {wine.region}
              </td>
              <td>{wine.appellation ?? '-'}</td>
              <td>{wine.vintage ?? '-'}</td>
              <td>{wine.type}</td>
              <td>
                <button onClick={() => onToggleBottles(wine.id)}>
                  {bottleCounts?.[wine.id] ?? 0} pulloa
                </button>
              </td>
              <td>
                <button onClick={() => onEdit(wine)}>Muokkaa</button>
                <button onClick={() => onDelete(wine.id)}>Poista</button>
              </td>
            </tr>
            {expandedWineId === wine.id && renderBottles && (
              <tr>
                <td colSpan={8}>{renderBottles(wine.id)}</td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
