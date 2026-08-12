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
  const [showAccountMenu, setShowAccountMenu] = useState(false)

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
        <div style={{ position: 'relative', width: '32px' }}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((current) => !current)}
            aria-label={t('app_menu_label')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              padding: '4px',
              color: COLORS.text,
            }}
          >
            ☰
          </button>

          {showAccountMenu && (
            <>
              <div
                onClick={() => setShowAccountMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
              />
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  minWidth: '180px',
                  background: COLORS.bg,
                  border: `0.5px solid ${COLORS.line}`,
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  padding: '8px',
                  zIndex: 100,
                }}
              >
                {session.user.user_metadata?.nickname && (
                  <div style={{ color: COLORS.textMuted, fontSize: '12px', padding: '8px 12px' }}>
                    {session.user.user_metadata.nickname}
                  </div>
                )}
                <div
                  onClick={() => {
                    setShowSettings(true)
                    setShowAccountMenu(false)
                  }}
                  style={{ color: COLORS.text, fontSize: '13px', cursor: 'pointer', padding: '8px 12px' }}
                >
                  {t('app_settings_link')}
                </div>
                <div
                  onClick={() => {
                    setShowAccountMenu(false)
                    signOut()
                  }}
                  style={{ color: COLORS.text, fontSize: '13px', cursor: 'pointer', padding: '8px 12px' }}
                >
                  {t('app_sign_out')}
                </div>
              </div>
            </>
          )}
        </div>

        <span style={{ color: COLORS.text, letterSpacing: '0.05em', fontSize: '13px', fontWeight: 600 }}>
          NICERVA
        </span>

        <div style={{ width: '32px' }} />
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
