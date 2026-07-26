import { QueryProvider } from './app/QueryProvider'
import { WinesPage } from './app/WinesPage'
import { useSession, signOut, LoginForm } from './features/auth'
import { COLORS } from './shared/colors'

export default function App() {
  const { session, loading } = useSession()

  if (loading) {
    return <p style={{ padding: '1rem' }}>Ladataan...</p>
  }

  if (!session) {
    return <LoginForm />
  }

  return (
    <QueryProvider>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem 1rem' }}>
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
          Kirjaudu ulos
        </button>
      </div>
      <WinesPage />
    </QueryProvider>
  )
}
