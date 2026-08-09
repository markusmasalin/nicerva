import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { QueryProvider } from './app/QueryProvider'
import { WinesPage } from './app/WinesPage'
import { useSession, signOut, LoginForm } from './features/auth'
import { COLORS } from './shared/colors'
import { LanguageProvider, useTranslation } from './app/LanguageContext'
import { OnboardingModal } from './app/OnboardingModal'
import { SettingsModal } from './app/SettingsModal'

type AppContentProps = {
  session: Session | null
  loading: boolean
}

function AppContent({ session, loading }: AppContentProps) {
  const t = useTranslation()
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [onboardingActive, setOnboardingActive] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const needsOnboarding = !!session && session.user.user_metadata?.language == null && !onboardingDismissed

  useEffect(() => {
    if (needsOnboarding) {
      setOnboardingActive(true)
    }
  }, [needsOnboarding])

  if (loading) {
    return <p style={{ padding: '1rem' }}>{t('common_loading')}</p>
  }

  if (!session) {
    return <LoginForm />
  }

  // TILAPÄINEN DEBUG-LOKI — poista kun user_metadata-sisältö on tarkistettu.
  console.log('session.user.user_metadata', session?.user?.user_metadata)

  return (
    <QueryProvider>
      <div className="top-bar">
        <span style={{ color: COLORS.text, letterSpacing: '0.05em', fontSize: '13px', fontWeight: 600 }}>
          NICERVA
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {session.user.user_metadata?.nickname && (
            <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
              {session.user.user_metadata.nickname}
            </span>
          )}
          <span
            onClick={() => setShowSettings(true)}
            style={{ color: COLORS.textMuted, fontSize: '13px', cursor: 'pointer' }}
          >
            {t('app_settings_link')}
          </span>
          <button
            onClick={() => signOut()}
            style={{
              border: `0.5px solid ${COLORS.line}`,
              background: 'transparent',
              color: COLORS.textMuted,
              fontSize: '13px',
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            {t('app_sign_out')}
          </button>
        </div>
      </div>
      <WinesPage />
      {onboardingActive && (
        <OnboardingModal
          onClose={() => {
            setOnboardingActive(false)
            setOnboardingDismissed(true)
          }}
        />
      )}
      {showSettings && <SettingsModal session={session} onClose={() => setShowSettings(false)} />}
    </QueryProvider>
  )
}

export default function App() {
  const { session, loading } = useSession()

  return (
    <LanguageProvider session={session}>
      <AppContent session={session} loading={loading} />
    </LanguageProvider>
  )
}
