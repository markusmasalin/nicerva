import { useState, type CSSProperties } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Modal } from '../shared/Modal'
import { FIELD_STYLE, FIELD_LABEL_STYLE } from '../shared/fieldStyles'
import { COLORS } from '../shared/colors'
import { useTranslation } from './LanguageContext'
import type { LanguageCode } from '../shared/countries'

type Props = {
  session: Session
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

const languageChoiceButtonStyle: CSSProperties = {
  border: `0.5px solid ${COLORS.line}`,
  background: COLORS.bg,
  color: COLORS.text,
  fontSize: '18px',
  padding: '24px 32px',
  cursor: 'pointer',
  borderRadius: '8px',
}

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string }[] = [
  { code: 'fi', label: 'Suomi' },
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
]

export function SettingsModal({ session, onClose }: Props) {
  const t = useTranslation()
  const [nickname, setNickname] = useState(session.user.user_metadata?.nickname ?? '')
  const [saving, setSaving] = useState(false)

  async function handleChooseLanguage(code: LanguageCode) {
    const { error } = await supabase.auth.updateUser({ data: { language: code } })
    if (error) {
      console.error(error)
    }
  }

  async function handleSaveNickname() {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { nickname } })
      if (error) throw error
    } catch {
      alert('Tallennus epäonnistui.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('app_settings_link')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <div style={FIELD_LABEL_STYLE}>{t('onboarding_language_label')}</div>
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

        <label>
          <div style={FIELD_LABEL_STYLE}>{t('onboarding_nickname_label')}</div>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} style={FIELD_STYLE} />
          <button
            type="button"
            onClick={handleSaveNickname}
            disabled={saving}
            style={{ ...buttonStyle, marginTop: '8px', opacity: saving ? 0.6 : 1 }}
          >
            {t('common_save')}
          </button>
        </label>

        <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>{t('settings_theme_coming_soon')}</p>
      </div>
    </Modal>
  )
}
