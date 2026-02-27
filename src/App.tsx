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

const tabs = ['Inventario', 'Misiones', 'Recarga', 'Sistema de afiliados', 'Configuraciones', 'Historial']

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

  useEffect(() => {
    const loadLobby = async () => {
      setLoading(true)
      setError('')

      try {
        const [gamesResponse, walletResponse] = await Promise.all([
          fetch(`${API_URL}/games`),
          fetch(`${API_URL}/wallet/1`)
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
  }, [])

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games
    const term = search.toLowerCase()
    return games.filter((game) => game.name.toLowerCase().includes(term) || game.type.toLowerCase().includes(term))
  }, [games, search])

  return (
    <main className="panel">
      <header className="top-nav">
        <div className="logo">keydrop</div>
        <nav>
          <a href="#">Get Free</a>
          <a href="#">Giveaways</a>
          <a href="#">Skin Changer</a>
          <a href="#">Upgrader</a>
          <a href="#">Case Battle</a>
        </nav>
        <div className="wallet-strip">
          <div>
            <small>Saldo de la cartera</small>
            <strong>{wallet ? formatMoney(wallet.balanceCents, wallet.currency) : '---'}</strong>
          </div>
        </div>
      </header>

      <section className="hero-band" />

      <section className="profile-card">
        <img src="https://i.pravatar.cc/120?img=12" alt="avatar" className="avatar" />
        <div className="profile-meta">
          <h1>Jugador Casino</h1>
          <p className="rank">BRONZE IV · Siguiente rango en progreso</p>
          <p className="trade-link">https://steamcommunity.com/tradeoffer/new/?partner=CASINO&amp;token=123</p>
        </div>
        <div className="coins-box">
          <small>Monedas</small>
          <strong>{wallet ? Math.floor(wallet.balanceCents / 100) : 0}</strong>
        </div>
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
        <input placeholder="Tipo de juego" />
        <input placeholder="Clasificación" />
        <input
          placeholder="Búsqueda"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      {loading && <p className="feedback">Cargando panel…</p>}
      {error && <p className="feedback error">{error}</p>}

      {!loading && !error && (
        <section className="inventory-grid">
          {filteredGames.map((game) => (
            <article key={game.id} className="item-card">
              <h3>{game.name}</h3>
              <p>{game.type}</p>
              <small>{game.variants.length} variantes</small>
            </article>
          ))}
          {filteredGames.length === 0 && <p className="feedback">No hay juegos para ese filtro.</p>}
        </section>
      )}
    </main>
  )
}

export default App
