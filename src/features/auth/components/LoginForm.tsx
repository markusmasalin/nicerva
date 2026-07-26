import { useState, type FormEvent } from 'react'
import { signIn } from '../api'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kirjautuminen epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 300, margin: '4rem auto' }}>
      <h1>Kirjaudu sisään</h1>
      <input type="email" placeholder="Sähköposti" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Salasana" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Kirjaudutaan...' : 'Kirjaudu'}</button>
    </form>
  )
}
