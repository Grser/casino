import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type GameVariant = {
  id: string
  name: string
  minBetCents: number
  maxBetCents: number
  houseEdgePercent: number
}

type Game = {
  id: string
  code: string
  name: string
  type: string
  variants: GameVariant[]
}

type Wallet = {
  userId: string
  balanceCents: number
  currency: string
}

type RegistrationResult = {
  id: string
  username: string
  email: string
  countryCode: string
  wallet: Wallet
}

const DEFAULT_API_URL = import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : '/api'
const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL
const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111'

const tabs = ['Lobby', 'En vivo', 'Mesa', 'Cartas', 'Promociones', 'Historial']

function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [selectedType, setSelectedType] = useState('Todos')
  const [maxHouseEdge, setMaxHouseEdge] = useState(5)
  const [activeUserId, setActiveUserId] = useState(
    () => window.localStorage.getItem('casinoUserId') ?? DEMO_USER_ID
  )
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    const loadLobby = async () => {
      setLoading(true)
      setError('')

      try {
        const [gamesResponse, walletResponse] = await Promise.all([
          fetch(`${API_URL}/games`),
          fetch(`${API_URL}/wallet/${activeUserId}`)
        ])

        if (!gamesResponse.ok || !walletResponse.ok) {
          throw new Error('No se pudo conectar con el backend del casino.')
        }

        const gamesData: Game[] = await gamesResponse.json()
        const walletData: Wallet = await walletResponse.json()

        setGames(gamesData)
        setWallet(walletData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido cargando el panel.')
      } finally {
        setLoading(false)
      }
    }

    void loadLobby()
  }, [activeUserId])

  const availableTypes = useMemo(() => ['Todos', ...new Set(games.map((game) => game.type))], [games])

  const filteredGames = useMemo(() => {
    const term = search.trim().toLowerCase()

    return games.filter((game) => {
      const matchesSearch =
        !term || game.name.toLowerCase().includes(term) || game.type.toLowerCase().includes(term)
      const matchesType = selectedType === 'Todos' || game.type === selectedType
      const lowestEdge = Math.min(...game.variants.map((variant) => variant.houseEdgePercent))
      const matchesEdge = Number.isFinite(lowestEdge) ? lowestEdge <= maxHouseEdge : true

      return matchesSearch && matchesType && matchesEdge
    })
  }, [games, search, selectedType, maxHouseEdge])

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreatingUser(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()
    const countryCode = String(formData.get('countryCode') || '').trim().toUpperCase()

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, countryCode })
      })

      if (!response.ok) {
        throw new Error('No se pudo crear el usuario. Revisa si ya existe.')
      }

      const data: RegistrationResult = await response.json()
      window.localStorage.setItem('casinoUserId', data.id)
      setActiveUserId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setCreatingUser(false)
    }
  }

  return (
    <main className="panel">
      <header className="top-nav">
        <div className="logo">Casino Clawn</div>
        <nav>
          <a href="#">Inicio</a>
          <a href="#">Torneos</a>
          <a href="#">Jackpots</a>
          <a href="#">VIP</a>
          <a href="#">Soporte 24/7</a>
        </nav>
        <div className="wallet-strip">
          <small>Saldo disponible</small>
          <strong>{wallet ? formatMoney(wallet.balanceCents, wallet.currency) : '---'}</strong>
        </div>
      </header>

      <section className="hero-band">
        <h1>Bienvenido a Casino Clawn</h1>
        <p>Juega nuestros títulos en vivo con límites reales y filtros funcionales por tipo y ventaja de la casa.</p>
      </section>

      <section className="tabs-row">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={tab === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </section>

      <section className="filters">
        <label>
          Tipo de juego
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ventaja máxima de la casa: {maxHouseEdge.toFixed(1)}%
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.1}
            value={maxHouseEdge}
            onChange={(event) => setMaxHouseEdge(Number(event.target.value))}
          />
        </label>

        <label>
          Buscar juego
          <input
            placeholder="Ej: Blackjack, Ruleta..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      <section className="filters">
        <form onSubmit={handleCreateUser}>
          <strong>Crear usuario rápido</strong>
          <input name="username" placeholder="Usuario" required />
          <input name="email" type="email" placeholder="correo@casino.dev" required />
          <input name="password" type="password" placeholder="Contraseña" required />
          <input name="countryCode" placeholder="ES" maxLength={2} required />
          <button type="submit" disabled={creatingUser}>
            {creatingUser ? 'Creando...' : 'Crear usuario'}
          </button>
          <small>Usuario activo: {activeUserId}</small>
        </form>
      </section>

      {loading && <p className="feedback">Cargando lobby…</p>}
      {error && <p className="feedback error">{error}</p>}

      {!loading && !error && (
        <section className="inventory-grid">
          {filteredGames.map((game) => {
            const minBet = Math.min(...game.variants.map((variant) => variant.minBetCents))
            const maxBet = Math.max(...game.variants.map((variant) => variant.maxBetCents))
            const bestEdge = Math.min(...game.variants.map((variant) => variant.houseEdgePercent))

            return (
              <article key={game.id} className="item-card">
                <p className="chip">{game.type}</p>
                <h3>{game.name}</h3>
                <p>
                  Apuesta: {formatMoney(minBet, wallet?.currency ?? 'USD')} -{' '}
                  {formatMoney(maxBet, wallet?.currency ?? 'USD')}
                </p>
                <small>Mejor ventaja de la casa: {bestEdge.toFixed(2)}%</small>
                <button>Jugar ahora</button>
              </article>
            )
          })}
          {filteredGames.length === 0 && (
            <p className="feedback">No hay juegos con esos filtros. Ajusta el tipo o la ventaja máxima.</p>
          )}
        </section>
      )}
    </main>
  )
}

export default App
