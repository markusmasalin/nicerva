import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import {
  useCreateWine,
  useUpdateWine,
  useWines,
  uploadLabelImage,
  identifyWine,
  WineForm,
  WineFilters,
} from '../features/wines'
import type { Wine, NewWine, WineFilterParams, IdentifiedWine, PurchaseInfo, WineType } from '../features/wines'
import { useCreateBottle, useBottleCounts } from '../features/inventory'
import { ensureProducer } from '../features/producers'
import { COLORS } from '../shared/colors'
import { Modal } from '../shared/Modal'
import { similarity } from '../shared/textSimilarity'
import { GROUP_LEVELS, type GroupingMode } from '../shared/groupingModes'
import { CollectionOverview } from './CollectionOverview'
import { CollectionView } from './CollectionView'
import { WineDetailModal } from './WineDetailModal'
import { DuplicateBottleModal } from './DuplicateBottleModal'
import { JustAddedToast } from './JustAddedToast'
import { useTranslation } from './LanguageContext'

const SCANNED_WINE_DEFAULTS: NewWine = {
  name: '',
  producer: '',
  country: '',
  region: '',
  appellation: null,
  grapes: [],
  vintage: null,
  type: 'red',
  notes: null,
  labelImageUrl: null,
}

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

type StatCardProps = {
  // Ei vielä käytössä (kaksi lukua ei tällä hetkellä näytä ikonia), mutta
  // laatikko renderöidään silti kiinteällä korkeudella jotta rakenne on
  // valmiiksi laajennettavissa jos ikoni lisätään myöhemmin.
  icon?: string
  value: number
  label: string
  active: boolean
  onClick: () => void
}

// Kiinteäkorkuinen ikonilaatikko (height 20px, keskitetty flexillä) estää
// numeroiden epätasaisen pystyasettelun eri korttien välillä, koska emojien
// oma render-korkeus vaihtelee merkistä toiseen.
function StatCard({ icon, value, label, active, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        textAlign: 'center',
        cursor: 'pointer',
        padding: '8px 4px 10px',
        borderBottom: active ? `2px solid ${COLORS.text}` : '2px solid transparent',
      }}
    >
      <div style={{ height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
        {icon}
      </div>
      <div style={{ fontSize: '20px', color: COLORS.text, marginTop: '4px' }}>{value}</div>
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: COLORS.textMuted,
          marginTop: '2px',
        }}
      >
        {label}
      </div>
    </div>
  )
}

type IconActionProps = {
  icon: string
  title: string
  active?: boolean
  onClick: () => void
}

// Neljän ikonin rivi kahden luvun alla: €/♥ vaihtavat viewMode:a, 🍷/🛍
// eivät tee vielä mitään paitsi näyttävät "Tulossa pian" -ilmoituksen
// (title-attribuutti hoitaa työpöytä-hoverin, klikkaus mobiilissa).
function IconAction({ icon, title, active, onClick }: IconActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '20px',
        padding: '8px 4px',
        lineHeight: 1,
        borderBottom: active ? `2px solid ${COLORS.text}` : '2px solid transparent',
      }}
    >
      {icon}
    </button>
  )
}

// Muuntaa identify-wine-funktion tunnistaman viinin lomakkeen
// esitäyttödataksi — null-kentät jätetään tyhjiksi, käyttäjä täydentää loput.
function toScannedDraft(identified: IdentifiedWine): NewWine {
  return {
    ...SCANNED_WINE_DEFAULTS,
    name: identified.name ?? '',
    producer: identified.producer ?? '',
    country: identified.country ?? '',
    region: identified.region ?? '',
    appellation: identified.appellation,
    grapes: identified.grapes ?? [],
    vintage: identified.vintage,
    type: identified.type ?? 'red',
  }
}

const NAME_WEIGHT = 0.7
const PRODUCER_WEIGHT = 0.3
const DUPLICATE_CONFIRM_THRESHOLD = 0.75

// Etsii lähimmän jo olemassa olevan viini-identiteetin (name+producer-ryhmä)
// painotetulla samankaltaisuudella. Nimi painaa enemmän kuin tuottaja, koska
// tuottajan kirjoitusasu vaihtelee enemmän etiketistä toiseen.
function findBestMatch(
  wines: Wine[],
  identifiedName: string,
  identifiedProducer: string,
): { wine: Wine; score: number } | null {
  const uniqueIdentities = new Map<string, Wine>()
  for (const wine of wines) {
    const key = `${wine.name.trim().toLowerCase()}|${wine.producer.trim().toLowerCase()}`
    if (!uniqueIdentities.has(key)) uniqueIdentities.set(key, wine)
  }

  let best: { wine: Wine; score: number } | null = null
  for (const wine of uniqueIdentities.values()) {
    const score =
      similarity(identifiedName, wine.name) * NAME_WEIGHT + similarity(identifiedProducer, wine.producer) * PRODUCER_WEIGHT
    if (!best || score > best.score) {
      best = { wine, score }
    }
  }
  return best
}

// Tämä sivu on esimerkki siitä, miten wines- ja inventory-moduulit
// yhdistetään UI:ksi. Huomaa: tämä komponentti tuo kummastakin
// moduulista VAIN niiden index.ts:n kautta julkaistut asiat.
export function WinesPage() {
  const t = useTranslation()
  const [filters, setFilters] = useState<WineFilterParams>({})
  const [editing, setEditing] = useState<Wine | null>(null)
  const [scanDraft, setScanDraft] = useState<NewWine | null>(null)
  const [scannedFrontImage, setScannedFrontImage] = useState<File | null>(null)
  const [scannedBackImage, setScannedBackImage] = useState<File | null>(null)
  const [showScanPreview, setShowScanPreview] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [duplicateMatch, setDuplicateMatch] = useState<Wine | null>(null)
  const [duplicateCandidate, setDuplicateCandidate] = useState<{ matchedWine: Wine; scannedDraft: NewWine } | null>(
    null,
  )
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [comingSoonVisible, setComingSoonVisible] = useState(false)
  const [viewMode, setViewMode] = useState<GroupingMode>('appellation')
  const [detailIdentity, setDetailIdentity] = useState<{ name: string; producer: string } | null>(null)
  const [justAdded, setJustAdded] = useState<{ name: string; type: WineType } | null>(null)
  const frontScanInputRef = useRef<HTMLInputElement>(null)
  const backScanInputRef = useRef<HTMLInputElement>(null)

  const { data: wines = [] } = useWines(filters)
  // Erillinen, suodattamaton kysely — päättää ison NICERVA-otsikon
  // näkyvyyden koko kokoelman koon perusteella, ei nykyisen hakutuloksen.
  const { data: allWines = [], isLoading: allWinesLoading } = useWines()
  const { data: bottleCounts = {} } = useBottleCounts()
  const createWine = useCreateWine()
  const updateWine = useUpdateWine()
  const createBottle = useCreateBottle()

  const frontPreviewUrl = useMemo(
    () => (scannedFrontImage ? URL.createObjectURL(scannedFrontImage) : null),
    [scannedFrontImage],
  )

  function resetFormState() {
    setShowForm(false)
    setEditing(null)
    setScanDraft(null)
    setScannedFrontImage(null)
    setScannedBackImage(null)
  }

  function showComingSoon() {
    setComingSoonVisible(true)
    setTimeout(() => setComingSoonVisible(false), 2000)
  }

  function handleFrontImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!file) return
    setScannedFrontImage(file)
    setScannedBackImage(null)
    setShowScanPreview(true)
  }

  function handleBackImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!file) return
    setScannedBackImage(file)
  }

  function handleCancelScanPreview() {
    setShowScanPreview(false)
    setScannedFrontImage(null)
    setScannedBackImage(null)
  }

  async function handleIdentify() {
    if (!scannedFrontImage) return
    setShowScanPreview(false)
    setScanning(true)
    let candidate: { matchedWine: Wine; scannedDraft: NewWine } | null = null
    let openForm = false
    try {
      const result = await identifyWine(scannedFrontImage, scannedBackImage ?? undefined)
      const draft = toScannedDraft(result.wine)
      const identifiedName = (result.wine.name ?? '').trim()
      const identifiedProducer = (result.wine.producer ?? '').trim()

      const bestMatch =
        identifiedName && identifiedProducer ? findBestMatch(wines, identifiedName, identifiedProducer) : null

      if (bestMatch && bestMatch.score > DUPLICATE_CONFIRM_THRESHOLD) {
        candidate = { matchedWine: bestMatch.wine, scannedDraft: draft }
      } else {
        setScanDraft(draft)
        openForm = true
      }
    } catch {
      // Hiljainen fallback: lomake avataan tyhjänä, otettu kuva tallennetaan silti.
      setScanDraft(null)
      openForm = true
    } finally {
      // Takakuva oli vain väliaikainen apu tunnistukselle — hylätään heti,
      // se ei koskaan tallennu Storageen eikä label_image_url:ksi.
      setScannedBackImage(null)
      setScanning(false)
      setEditing(null)
      if (candidate) {
        setDuplicateCandidate(candidate)
      } else if (openForm) {
        setShowForm(true)
      }
    }
  }

  async function handleSubmit(wine: NewWine, imageFile: File | null, purchaseInfo: PurchaseInfo) {
    const fileToUpload = imageFile ?? scannedFrontImage
    if (editing) {
      updateWine.mutate({ id: editing.id, wine })
      if (fileToUpload) {
        try {
          await uploadLabelImage(wine.name, wine.producer, fileToUpload)
        } catch {
          alert('Kuvan lataus epäonnistui.')
        }
      }
    } else {
      try {
        const created = await createWine.mutateAsync(wine)
        await ensureProducer(wine.producer, wine.country, wine.region)
        await createBottle.mutateAsync({
          wineId: created.id,
          purchasePrice: purchaseInfo.purchasePrice,
          purchaseDate: purchaseInfo.purchaseDate,
          location: null,
          status: 'cellar',
          note: null,
        })
        if (fileToUpload) {
          await uploadLabelImage(wine.name, wine.producer, fileToUpload)
        }
        setJustAdded({ name: created.name, type: created.type })
        setTimeout(() => setJustAdded(null), 3000)
      } catch {
        alert('Viinin tai pullon luonti epäonnistui.')
      }
    }
    resetFormState()
  }

  const countriesWithBottles = new Set(
    wines.filter((wine) => (bottleCounts[wine.id] ?? 0) > 0).map((wine) => wine.country),
  )

  const producerCount = new Set(wines.map((wine) => wine.producer)).size

  return (
    <>
      <div className="page-container">
        {!allWinesLoading && allWines.length === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ margin: 0, letterSpacing: '0.05em', color: COLORS.text }}>NICERVA</h1>
            <p style={{ margin: '0.25rem 0 0', color: COLORS.textMuted }}>{t('login_subtitle')}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
          <input
            placeholder={t('filters_search_placeholder')}
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            style={{
              flex: 1,
              border: 'none',
              borderBottom: `0.5px solid ${COLORS.line}`,
              background: 'transparent',
              color: COLORS.text,
              colorScheme: 'light',
              fontSize: '14px',
              padding: '6px 2px',
            }}
          />
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            aria-label={t('collection_filter_link')}
            title={t('collection_filter_link')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              lineHeight: 1,
              opacity: showFilters ? 1 : 0.7,
            }}
          >
            ⚙️
          </button>
          <input
            ref={frontScanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFrontImageSelected}
          />
        </div>

        {showFilters && (
          <div style={{ marginBottom: '16px' }}>
            <WineFilters filters={filters} onChange={setFilters} hideSearch />
          </div>
        )}

        <div
          style={{
            paddingBottom: '8px',
            marginBottom: '24px',
            borderBottom: `1px solid ${COLORS.line}`,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <StatCard
              value={wines.length}
              label={t('stats_bottles_label')}
              active={viewMode === 'appellation'}
              onClick={() => {
                setFilters({})
                setViewMode('appellation')
              }}
            />
            <StatCard
              value={producerCount}
              label={t('stats_producers_label')}
              active={viewMode === 'producer'}
              onClick={() => setViewMode('producer')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '4px' }}>
            <IconAction icon="€" title={t('view_price')} active={viewMode === 'price'} onClick={() => setViewMode('price')} />
            <IconAction icon="♥" title={t('view_liked')} active={viewMode === 'liked'} onClick={() => setViewMode('liked')} />
            <IconAction icon="🍷" title={t('coming_soon_label')} onClick={showComingSoon} />
            <IconAction icon="🛍" title={t('coming_soon_label')} onClick={showComingSoon} />
          </div>
          {comingSoonVisible && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: COLORS.textMuted, marginTop: '6px' }}>
              {t('coming_soon_label')}
            </div>
          )}
        </div>

        {scanning && (
          <>
            <style>{`
              @keyframes scan-spinner-spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
                padding: '16px',
              }}
            >
              <div
                style={{
                  background: COLORS.bg,
                  color: COLORS.text,
                  borderRadius: '12px',
                  padding: '32px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `3px solid ${COLORS.line}`,
                    borderTopColor: COLORS.wineRed,
                    animation: 'scan-spinner-spin 0.8s linear infinite',
                  }}
                />
                <span style={{ color: COLORS.text, fontSize: '17px' }}>{t('collection_identifying')}</span>
              </div>
            </div>
          </>
        )}

        {showForm && (
          <Modal title={t('wine_add_modal_title')} onClose={resetFormState}>
            <WineForm
              key={editing?.id ?? (scanDraft ? 'scan' : 'new')}
              initial={editing ?? scanDraft ?? undefined}
              isEditing={editing !== null}
              onSubmit={handleSubmit}
              onCancel={resetFormState}
            />
          </Modal>
        )}

        {countriesWithBottles.size >= 2 && <CollectionOverview wines={wines} bottleCounts={bottleCounts} />}

        <CollectionView
          filters={filters}
          groupLevels={GROUP_LEVELS[viewMode]}
          viewMode={viewMode}
          onOpenWine={(identity) => setDetailIdentity(identity)}
        />
      </div>

      {showScanPreview && scannedFrontImage && (
        <Modal title="Etuetiketti otettu" onClose={handleCancelScanPreview}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {frontPreviewUrl && (
              <img
                src={frontPreviewUrl}
                style={{ width: '64px', height: '96px', objectFit: 'cover', borderRadius: '6px' }}
              />
            )}

            <input
              ref={backScanInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleBackImageSelected}
            />
            <span
              onClick={() => backScanInputRef.current?.click()}
              style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}
            >
              {scannedBackImage ? 'Vaihda takaetiketin kuva' : '+ Lisää takaetiketin kuva (valinnainen)'}
            </span>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={handleIdentify} style={buttonStyle}>
                Tunnista
              </button>
            </div>
          </div>
        </Modal>
      )}

      {detailIdentity && (
        <WineDetailModal identity={detailIdentity} onClose={() => setDetailIdentity(null)} />
      )}

      {duplicateCandidate && (
        <Modal title="Onko tämä jo kokoelmassasi?" onClose={() => setDuplicateCandidate(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>
              Onko tämä sama kuin '{duplicateCandidate.matchedWine.name} · {duplicateCandidate.matchedWine.producer}'
              jonka jo omistat?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setDuplicateMatch(duplicateCandidate.matchedWine)
                  setDuplicateCandidate(null)
                }}
                style={buttonStyle}
              >
                Kyllä, lisää pullo tähän
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanDraft(duplicateCandidate.scannedDraft)
                  setDuplicateCandidate(null)
                  setShowForm(true)
                }}
                style={buttonStyle}
              >
                Ei, tämä on eri viini
              </button>
            </div>
          </div>
        </Modal>
      )}

      {duplicateMatch && (
        <DuplicateBottleModal
          matchedWine={duplicateMatch}
          onClose={() => setDuplicateMatch(null)}
          onCreated={() => {
            setJustAdded({ name: duplicateMatch.name, type: duplicateMatch.type })
            setTimeout(() => setJustAdded(null), 3000)
          }}
        />
      )}

      {showAddMenu && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            background: COLORS.bg,
            border: `1px solid ${COLORS.line}`,
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            zIndex: 150,
          }}
        >
          <span
            onClick={() => {
              setShowAddMenu(false)
              frontScanInputRef.current?.click()
            }}
            style={{ color: COLORS.text, fontSize: '13px', cursor: 'pointer', padding: '8px 12px', whiteSpace: 'nowrap' }}
          >
            {t('collection_scan_wine_link')}
          </span>
          <span
            onClick={() => {
              setShowAddMenu(false)
              setScanDraft(null)
              setScannedFrontImage(null)
              setScannedBackImage(null)
              setShowScanPreview(false)
              setDuplicateMatch(null)
              setDuplicateCandidate(null)
              setEditing(null)
              setShowForm(true)
            }}
            style={{ color: COLORS.text, fontSize: '13px', cursor: 'pointer', padding: '8px 12px', whiteSpace: 'nowrap' }}
          >
            {t('collection_add_wine_link')}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAddMenu((current) => !current)}
        aria-label={t('wine_add_modal_title')}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: COLORS.wineRed,
          color: '#FFFFFF',
          fontSize: '28px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          zIndex: 150,
        }}
      >
        +
      </button>

      {justAdded && <JustAddedToast name={justAdded.name} type={justAdded.type} />}
    </>
  )
}
