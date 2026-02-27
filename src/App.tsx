import { useEffect, useMemo, useState } from 'react'
import './App.css'

type GameVariant = {
  id: number
  name: string
  minBetCents: number
  maxBetCents: number
  houseEdgePercent: number
}

type Game = {
  id: number
  code: string
  name: string
  type: string
  variants: GameVariant[]
}

type Wallet = {
  userId: number
  balanceCents: number
  currency: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  useEffect(() => {
    const loadLobby = async () => {
      setLoading(true)
      setError('')

      try {
        const [gamesResponse, walletResponse] = await Promise.all([
          fetch(`${API_URL}/games`),
          fetch(`${API_URL}/wallet/1`)
        ])

        if (!gamesResponse.ok) {
          throw new Error('No se pudieron cargar los juegos. Revisa que el backend esté activo.')
        }

        if (!walletResponse.ok) {
          throw new Error('No se pudo cargar la cartera del jugador. Verifica la base de datos y el seed.')
        }

        const gamesData: Game[] = await gamesResponse.json()
        const walletData: Wallet = await walletResponse.json()

        setGames(gamesData)
        setWallet(walletData)
        setSelectedGame(gamesData[0] ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido cargando el lobby.')
      } finally {
        setLoading(false)
      }
    }

    void loadLobby()
  }, [])

  const totalVariants = useMemo(
    () => games.reduce((total, game) => total + game.variants.length, 0),
    [games]
  )

  return (
    <main className="lobby">
      <header className="topbar">
        <div>
          <p className="brand">ROYAL JACKPOT</p>
          <h1>Lobby principal del casino</h1>
        </div>

        <div className="wallet">
          <span>Cartera</span>
          <strong>{wallet ? formatMoney(wallet.balanceCents, wallet.currency) : '---'}</strong>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="pill">En vivo</p>
          <h2>Entra a tus mesas y juegos en 1 clic</h2>
          <p className="subtitle">
            Un main claro para acceder a ruleta, blackjack, slots y variantes activas.
          </p>
          <button className="primary" disabled={!selectedGame}>
            {selectedGame ? `Entrar a ${selectedGame.name}` : 'Selecciona un juego'}
          </button>
        </div>

        <div className="hero-stats">
          <article>
            <span>Juegos activos</span>
            <strong>{games.length}</strong>
          </article>
          <article>
            <span>Variantes</span>
            <strong>{totalVariants}</strong>
          </article>
          <article>
            <span>Backend</span>
            <strong>{error ? 'Con errores' : 'Conectado'}</strong>
          </article>
        </div>
      </section>

      {loading && <p className="feedback">Cargando lobby…</p>}
      {error && <p className="feedback error">{error}</p>}

      {!loading && !error && (
        <section className="games-grid">
          {games.map((game) => (
            <article
              key={game.id}
              className={`game-card ${selectedGame?.id === game.id ? 'selected' : ''}`}
              onClick={() => setSelectedGame(game)}
            >
              <div className="game-head">
                <p>{game.type}</p>
                <span>{game.variants.length} variantes</span>
              </div>
              <h3>{game.name}</h3>
              <p className="code">Código: {game.code}</p>
              <ul>
                {game.variants.slice(0, 3).map((variant) => (
                  <li key={variant.id}>
                    <span>{variant.name}</span>
                    <small>
                      {formatMoney(variant.minBetCents)} - {formatMoney(variant.maxBetCents)}
                    </small>
                  </li>
                ))}
              </ul>
              <button className="ghost">Entrar ahora</button>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default App
