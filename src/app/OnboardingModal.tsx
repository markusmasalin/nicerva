import { useState, type CSSProperties, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'
import { TRANSLATIONS, type TranslationKey } from '../shared/translations'
import type { LanguageCode } from '../shared/countries'

type Props = {
  onClose: () => void
}

const buttonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: 'transparent',
  color: COLORS.textMuted,
  fontSize: '13px',
  padding: '6px 12px',
  cursor: 'pointer',
}

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string }[] = [
  { code: 'fi', label: 'Suomi' },
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
]

const languageOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  padding: '16px',
}

const languageChoiceButtonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: COLORS.bg,
  color: COLORS.text,
  fontSize: '18px',
  padding: '24px 32px',
  cursor: 'pointer',
  borderRadius: '8px',
}

function translate(language: LanguageCode, key: TranslationKey): string {
  return TRANSLATIONS[language][key] ?? TRANSLATIONS.fi[key] ?? key
}

// Kertaluontoinen tervetulomodaali: tallentaa lempinimen ja kielen suoraan
// Supabasen user_metadata-kenttään (auth.updateUser), ei omaa taulua.
//
// Kaksivaiheinen: vaihe A (kielivalinta) tallentaa kielen heti klikkauksesta,
// jotta valinta ei häviä vaikka käyttäjä sulkisi selaimen ennen lomakkeen
// loppuun täyttöä. Vaihe B käyttää juuri valittua chosenLanguage-arvoa eikä
// session.user.user_metadata:aa, koska session-olio ei päivity paikallisesti
// heti updateUser-kutsun jälkeen.
export function OnboardingModal({ onClose }: Props) {
  const [chosenLanguage, setChosenLanguage] = useState<LanguageCode | null>(null)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleChooseLanguage(code: LanguageCode) {
    setChosenLanguage(code)
    const { error } = await supabase.auth.updateUser({ data: { language: code } })
    if (error) {
      console.error(error)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!chosenLanguage) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { nickname, language: chosenLanguage } })
      if (error) throw error
      onClose()
    } catch {
      alert('Tallennus epäonnistui.')
      setSaving(false)
    }
  }

  if (!chosenLanguage) {
    return (
      <div style={languageOverlayStyle}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleChooseLanguage(option.code)}
              style={languageChoiceButtonStyle}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Modal title={translate(chosenLanguage, 'onboarding_title')} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label>
          <div style={FIELD_LABEL_STYLE}>{translate(chosenLanguage, 'onboarding_nickname_label')}</div>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} style={FIELD_STYLE} />
        </label>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving} style={{ ...buttonStyle, opacity: saving ? 0.6 : 1 }}>
            {translate(chosenLanguage, 'common_save')}
          </button>
          <button type="button" onClick={onClose} style={buttonStyle}>
            {translate(chosenLanguage, 'common_skip')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
