import { useEffect, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { useWine } from '../features/wines'
import { useUpdateBottle } from '../features/inventory'
import type { Bottle, NewBottle } from '../features/inventory'
import { useCreateTasting } from '../features/tastings'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'
import { getLocalGreeting, getCountryFlag } from '../shared/localGreetings'
import { useTranslation, useLanguage } from './LanguageContext'
import { getTagLabel, getFoodPairingLabel } from '../shared/tagLabels'

type Props = {
  bottle: Bottle
  onClose: () => void
}

type TagOption = { emoji: string; key: string }

const PRIMARY_TAGS: TagOption[] = [
  { emoji: '🍒', key: 'fruity' },
  { emoji: '🪶', key: 'elegant' },
  { emoji: '🧈', key: 'silky' },
  { emoji: '⚡', key: 'acidic' },
  { emoji: '🌳', key: 'tannic' },
  { emoji: '🍫', key: 'full_bodied' },
  { emoji: '🔥', key: 'spicy' },
  { emoji: '💎', key: 'mineral' },
  { emoji: '✨', key: 'balanced' },
  { emoji: '🔁', key: 'would_buy_again' },
]

// Laajennettu, kovakoodattu hakulista "+ Lisää tageja" -kenttää varten.
const EXTENDED_TAGS = [
  'smoky',
  'leathery',
  'floral',
  'nutty',
  'vanilla',
  'tart',
  'berry',
  'citrus',
  'ripe',
  'earthy',
  'herbal',
  'peppery',
  'oaky',
  'soft',
  'dry',
  'sweet',
  'fresh',
  'rich',
  'light',
  'rustic',
  'firm',
  'smooth',
  'aromatic',
  'cherry',
  'plum',
  'blackcurrant',
  'raspberry',
  'orange_peel',
  'peachy',
  'appley',
]

const FOOD_PAIRINGS: TagOption[] = [
  { emoji: '🥩', key: 'steak' },
  { emoji: '🧀', key: 'cheese' },
  { emoji: '🍝', key: 'pasta' },
  { emoji: '🍄', key: 'mushroom' },
  { emoji: '🐟', key: 'fish' },
  { emoji: '🍕', key: 'pizza' },
]

const SAVED_TOAST_MS = 2700

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

function tagPillStyle(selected: boolean): CSSProperties {
  return {
    border: `1px solid ${COLORS.line}`,
    borderRadius: '20px',
    padding: '10px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    background: selected ? COLORS.wineRed : '#FFFFFF',
    color: selected ? COLORS.bg : COLORS.text,
  }
}

function foodPillStyle(selected: boolean): CSSProperties {
  return {
    border: `1px solid ${COLORS.line}`,
    borderRadius: '20px',
    padding: '8px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    background: selected ? COLORS.wineRed : '#FFFFFF',
    color: selected ? COLORS.bg : COLORS.text,
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

type PendingAction = 'save' | 'skip' | null

export function TastingModal({ bottle, onClose }: Props) {
  const t = useTranslation()
  const language = useLanguage()
  const { data: wine } = useWine(bottle.wineId)

  const [rating, setRating] = useState<number | null>(null)
  const [score100, setScore100] = useState<number | null>(null)
  const [showScore100Input, setShowScore100Input] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagSearch, setShowTagSearch] = useState(false)
  const [tagQuery, setTagQuery] = useState('')
  const [foodPairing, setFoodPairing] = useState<string | null>(null)
  const [showFoodInput, setShowFoodInput] = useState(false)
  const [customFood, setCustomFood] = useState('')
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [showSavedToast, setShowSavedToast] = useState(false)

  const updateBottle = useUpdateBottle()
  const createTasting = useCreateTasting()

  useEffect(() => {
    if (!showSavedToast) return
    const timer = setTimeout(onClose, SAVED_TOAST_MS)
    return () => clearTimeout(timer)
  }, [showSavedToast, onClose])

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((existing) => existing !== tag) : [...current, tag]))
  }

  function addTagFromSearch(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current : [...current, tag]))
    setTagQuery('')
  }

  function handleTagQueryKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && tagQuery.trim() !== '') {
      e.preventDefault()
      addTagFromSearch(tagQuery.trim())
    }
  }

  function commitCustomFood() {
    if (customFood.trim() !== '') {
      setFoodPairing(customFood.trim())
    }
    setShowFoodInput(false)
  }

  function consumedPayload(): NewBottle {
    return {
      wineId: bottle.wineId,
      purchasePrice: bottle.purchasePrice,
      purchaseDate: bottle.purchaseDate,
      location: bottle.location,
      status: 'consumed',
      note: bottle.note,
    }
  }

  async function handleSkip() {
    setPendingAction('skip')
    try {
      await updateBottle.mutateAsync({ id: bottle.id, bottle: consumedPayload() })
      onClose()
    } catch {
      alert('Pullon merkintä juoduksi epäonnistui.')
      setPendingAction(null)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPendingAction('save')
    try {
      await createTasting.mutateAsync({
        wineId: bottle.wineId,
        bottleId: bottle.id,
        rating,
        score100,
        tags: selectedTags,
        foodPairing,
        note: note || null,
        tastedAt: todayIsoDate(),
      })
      await updateBottle.mutateAsync({ id: bottle.id, bottle: consumedPayload() })
      setShowSavedToast(true)
    } catch {
      alert('Maistelun tallennus epäonnistui.')
      setPendingAction(null)
    }
  }

  if (showSavedToast && wine) {
    const greeting = getLocalGreeting(wine.country)
    const flag = getCountryFlag(wine.country)
    return (
      <>
        <style>{`
          @keyframes tasting-saved-toast {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
            8% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            88% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: COLORS.bg,
            border: `1px solid ${COLORS.line}`,
            padding: '24px 32px',
            borderRadius: '12px',
            textAlign: 'center',
            animation: `tasting-saved-toast ${SAVED_TOAST_MS}ms ease forwards`,
            zIndex: 300,
          }}
        >
          <div style={{ fontSize: '28px', color: COLORS.text }}>
            {flag ? `${flag} ` : ''}
            {greeting}
          </div>
          <div style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '8px' }}>{t('tasting_saved_message')}</div>
        </div>
      </>
    )
  }

  if (!wine) {
    return (
      <Modal title={t('tasting_loading_title')} onClose={onClose}>
        <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{t('common_loading')}</p>
      </Modal>
    )
  }

  const extraSelectedTags = selectedTags.filter((tag) => !PRIMARY_TAGS.some((primaryTag) => primaryTag.key === tag))
  const matchingExtendedTags = EXTENDED_TAGS.filter(
    (tag) =>
      getTagLabel(tag, language).toLowerCase().includes(tagQuery.trim().toLowerCase()) && !selectedTags.includes(tag),
  )
  const isCustomFoodSelected = foodPairing != null && !FOOD_PAIRINGS.some((f) => f.key === foodPairing)
  const isPending = pendingAction !== null

  return (
    <Modal title={wine.vintage != null ? `${wine.name} ${wine.vintage}` : wine.name} onClose={onClose}>
      <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginTop: '-8px', marginBottom: '16px' }}>
        {wine.producer}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '14px', color: COLORS.text, marginBottom: '8px' }}>{t('tasting_rating_question')}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '30px',
                  lineHeight: 1,
                  color: rating != null && value <= rating ? COLORS.wineRed : COLORS.line,
                }}
              >
                ★
              </button>
            ))}
          </div>
          {showScore100Input ? (
            <input
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
              value={score100 ?? ''}
              onChange={(e) => setScore100(e.target.value ? Number(e.target.value) : null)}
              style={{ ...FIELD_STYLE, maxWidth: '120px', marginTop: '8px' }}
            />
          ) : (
            <span
              onClick={() => setShowScore100Input(true)}
              style={{ display: 'inline-block', marginTop: '8px', fontSize: '13px', color: COLORS.textMuted, cursor: 'pointer' }}
            >
              {t('tasting_score100_link')}
            </span>
          )}
        </div>

        <div>
          <div style={{ fontSize: '14px', color: COLORS.text, marginBottom: '8px' }}>{t('tasting_tags_question')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {PRIMARY_TAGS.map(({ emoji, key }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleTag(key)}
                style={tagPillStyle(selectedTags.includes(key))}
              >
                {emoji} {getTagLabel(key, language)}
              </button>
            ))}
            {extraSelectedTags.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleTag(tag)} style={tagPillStyle(true)}>
                {getTagLabel(tag, language)}
              </button>
            ))}
          </div>

          {showTagSearch ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <input
                autoFocus
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                onKeyDown={handleTagQueryKeyDown}
                placeholder={t('tasting_tag_search_placeholder')}
                style={FIELD_STYLE}
              />
              {matchingExtendedTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {matchingExtendedTags.map((tag) => (
                    <span key={tag} onClick={() => addTagFromSearch(tag)} style={tagPillStyle(false)}>
                      {getTagLabel(tag, language)}
                    </span>
                  ))}
                </div>
              )}
              {tagQuery.trim() !== '' && (
                <span
                  onClick={() => addTagFromSearch(tagQuery.trim())}
                  style={{ fontSize: '13px', color: COLORS.textMuted, cursor: 'pointer' }}
                >
                  {t('tasting_add_custom_tag').replace('{query}', tagQuery.trim())}
                </span>
              )}
            </div>
          ) : (
            <span
              onClick={() => setShowTagSearch(true)}
              style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: COLORS.textMuted, cursor: 'pointer' }}
            >
              {t('tasting_add_tags_link')}
            </span>
          )}
        </div>

        <div>
          <div style={{ fontSize: '14px', color: COLORS.text, marginBottom: '8px' }}>{t('tasting_food_question')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {FOOD_PAIRINGS.map(({ emoji, key }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFoodPairing(foodPairing === key ? null : key)}
                style={foodPillStyle(foodPairing === key)}
              >
                {emoji} {getFoodPairingLabel(key, language)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowFoodInput(true)}
              style={{ ...foodPillStyle(isCustomFoodSelected), display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} color="currentColor" />
              {isCustomFoodSelected ? foodPairing : ''}
            </button>
          </div>
          {showFoodInput && (
            <input
              autoFocus
              value={customFood}
              onChange={(e) => setCustomFood(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitCustomFood()
                }
              }}
              onBlur={commitCustomFood}
              placeholder={t('tasting_custom_food_placeholder')}
              style={{ ...FIELD_STYLE, marginTop: '10px' }}
            />
          )}
        </div>

        <textarea
          placeholder={t('tasting_notes_placeholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ ...FIELD_STYLE, fontFamily: 'inherit' }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="submit" disabled={isPending} style={{ ...buttonStyle, opacity: isPending ? 0.6 : 1 }}>
            {pendingAction === 'save' ? t('common_saving') : t('common_save')}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            style={{ ...buttonStyle, opacity: isPending ? 0.6 : 1 }}
          >
            {pendingAction === 'skip' ? t('common_marking') : t('tasting_skip_link')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
