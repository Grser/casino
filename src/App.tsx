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

type User = {
  id: string
  username: string
  email: string
  countryCode: string
}

type RegistrationResult = User & { wallet: Wallet }

type RoundState = {
  betCents: number
  playerCards: string[]
  dealerCards: string[]
  finished: boolean
  result: '' | 'WIN' | 'LOSS' | 'PUSH'
  message: string
}

const DEFAULT_API_URL = import.meta.env.DEV
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : '/api'
const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL

const tabs = ['Lobby', 'En vivo', 'Mesa', 'Cartas', 'Promociones', 'Historial']
const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function formatMoney(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(cents / 100)
}

function parseCardValue(card: string) {
  const rank = card.slice(0, -1)
  if (rank === 'A') return 11
  if (['K', 'Q', 'J'].includes(rank)) return 10
  return Number(rank)
}

function calculateScore(cards: string[]) {
  let total = 0
  let aces = 0
  for (const card of cards) {
    const value = parseCardValue(card)
    total += value
    if (card.startsWith('A')) aces += 1
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }
  return total
}

function drawCard() {
  return `${RANKS[Math.floor(Math.random() * RANKS.length)]}${SUITS[Math.floor(Math.random() * SUITS.length)]}`
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, init)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg = typeof data.error === 'string' ? data.error : 'Error de servidor'
    throw new Error(msg)
  }
  return data
}

function App() {
  const [games, setGames] = useState<Game[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [selectedType, setSelectedType] = useState('Todos')
  const [maxHouseEdge, setMaxHouseEdge] = useState(5)
  const [activeUserId, setActiveUserId] = useState(() => window.localStorage.getItem('casinoUserId') ?? '')
  const [creatingUser, setCreatingUser] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [cashAction, setCashAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [cashLoading, setCashLoading] = useState(false)
  const [view, setView] = useState<'lobby' | 'blackjack' | 'auth'>('lobby')
  const [round, setRound] = useState<RoundState | null>(null)

  const activeUser = users.find((user) => user.id === activeUserId) ?? null
  const blackjackGame = games.find((game) => game.code === 'BLACKJACK')
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

  const reloadWallet = async (userId: string) => {
    const walletData: Wallet = await request(`/wallet/${userId}`)
    setWallet(walletData)
  }

  const loadInitialData = async () => {
    setLoading(true)
    setError('')
    try {
      const [gamesData, usersData] = await Promise.all([request('/games'), request('/users')])
      setGames(gamesData)
      setUsers(usersData)
      const initialUserId = activeUserId || usersData[0]?.id
      if (!initialUserId) {
        setWallet(null)
      } else {
        setActiveUserId(initialUserId)
        window.localStorage.setItem('casinoUserId', initialUserId)
        await reloadWallet(initialUserId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando el lobby.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeUserId) return
    void reloadWallet(activeUserId).catch(() => setError('No se pudo cargar la wallet del usuario activo.'))
  }, [activeUserId])

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
      const data: RegistrationResult = await request('/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, countryCode })
      })
      setUsers((prev) => [data, ...prev])
      window.localStorage.setItem('casinoUserId', data.id)
      setActiveUserId(data.id)
      setWallet(data.wallet)
      event.currentTarget.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoggingIn(true)
    setError('')
    const formData = new FormData(event.currentTarget)
    const usernameOrEmail = String(formData.get('usernameOrEmail') || '').trim()
    const password = String(formData.get('password') || '').trim()
    try {
      const data: User = await request('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      })
      setActiveUserId(data.id)
      window.localStorage.setItem('casinoUserId', data.id)
      await reloadWallet(data.id)
    } catch (err) {
      setError(err instanceof Error ? 'Login fallido: usuario o contraseña incorrectos.' : 'Login fallido.')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleCashAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeUserId) return
    setCashLoading(true)
    setError('')
    const amount = Number(new FormData(event.currentTarget).get('amount'))
    const amountCents = Math.round(amount * 100)
    try {
      await request(`/wallet/${activeUserId}/${cashAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents })
      })
      await reloadWallet(activeUserId)
      event.currentTarget.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar saldo.')
    } finally {
      setCashLoading(false)
    }
  }

  const startRound = async (betCents: number) => {
    if (!activeUserId || !wallet) return
    setError('')
    try {
      await request(`/wallet/${activeUserId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: betCents })
      })
      await reloadWallet(activeUserId)
      setRound({
        betCents,
        playerCards: [drawCard(), drawCard()],
        dealerCards: [drawCard(), drawCard()],
        finished: false,
        result: '',
        message: 'Tu turno: pide carta o plantarte.'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la mano.')
    }
  }

  const settleRound = async (nextRound: RoundState) => {
    if (!activeUserId) return
    const playerScore = calculateScore(nextRound.playerCards)
    const dealerScore = calculateScore(nextRound.dealerCards)
    let result: RoundState['result'] = 'PUSH'
    let message = `Empate (${playerScore}-${dealerScore}).`

    if (playerScore > 21) {
      result = 'LOSS'
      message = `Te pasaste con ${playerScore}. Pierdes la apuesta.`
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      result = 'WIN'
      message = `Ganaste (${playerScore} vs ${dealerScore}). Pago 1:1 acreditado.`
    } else if (playerScore < dealerScore) {
      result = 'LOSS'
      message = `Dealer gana (${dealerScore} vs ${playerScore}).`
    }

    if (result === 'WIN') {
      await request(`/wallet/${activeUserId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: nextRound.betCents * 2 })
      })
    }

    if (result === 'PUSH') {
      await request(`/wallet/${activeUserId}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: nextRound.betCents })
      })
    }

    await reloadWallet(activeUserId)
    setRound({ ...nextRound, finished: true, result, message })
  }

  const hit = async () => {
    if (!round || round.finished) return
    const nextRound = { ...round, playerCards: [...round.playerCards, drawCard()] }
    if (calculateScore(nextRound.playerCards) > 21) {
      await settleRound(nextRound)
      return
    }
    setRound(nextRound)
  }

  const stand = async () => {
    if (!round || round.finished) return
    const dealerCards = [...round.dealerCards]
    while (calculateScore(dealerCards) < 17) {
      dealerCards.push(drawCard())
    }
    await settleRound({ ...round, dealerCards })
  }

  return (
    <main className="panel">
      <header className="top-nav">
        <div className="logo">Casino Clawn</div>
        <nav>
          <button onClick={() => setView('lobby')}>Lobby</button>
          <button onClick={() => setView('blackjack')}>Blackjack</button>
        </nav>
        <div className="top-nav-right">
          <button className="auth-nav-btn" onClick={() => setView('auth')}>Login / Registro</button>
          <div className="wallet-strip">
            <small>Usuario activo: {activeUser?.username ?? 'Sin sesión'}</small>
            <strong>{wallet ? formatMoney(wallet.balanceCents, wallet.currency) : '---'}</strong>
          </div>
        </div>
      </header>

      <section className="hero-band">
        <h1>Casino 100% funcional</h1>
        <p>Ahora puedes registrar, iniciar sesión, cambiar de usuario y jugar blackjack con saldo real de cada cuenta.</p>
      </section>

      <section className="filters users-grid">
        <form onSubmit={handleCashAction}>
          <strong>Saldo</strong>
          <select value={cashAction} onChange={(event) => setCashAction(event.target.value as 'deposit' | 'withdraw')}>
            <option value="deposit">Depositar</option>
            <option value="withdraw">Retirar</option>
          </select>
          <input name="amount" type="number" min={1} step="0.01" placeholder="Cantidad" required />
          <button disabled={cashLoading}>{cashLoading ? 'Procesando...' : 'Aplicar'}</button>
          <select value={activeUserId} onChange={(event) => setActiveUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </form>
      </section>

      {view === 'auth' && (
        <section className="auth-page users-grid">
          <h2>Acceso de usuario</h2>
          <div className="filters auth-forms-grid">
            <form onSubmit={handleLogin}>
              <strong>Iniciar sesión</strong>
              <input name="usernameOrEmail" placeholder="usuario o email" required />
              <input name="password" type="password" placeholder="contraseña" required />
              <button type="submit" disabled={loggingIn}>{loggingIn ? 'Entrando...' : 'Entrar'}</button>
            </form>

            <form onSubmit={handleCreateUser}>
              <strong>Crear usuario</strong>
              <input name="username" placeholder="Usuario" required />
              <input name="email" type="email" placeholder="correo@casino.dev" required />
              <input name="password" type="password" placeholder="Contraseña" required />
              <input name="countryCode" placeholder="ES" maxLength={2} required />
              <button type="submit" disabled={creatingUser}>{creatingUser ? 'Creando...' : 'Crear'}</button>
            </form>
          </div>
        </section>
      )}

      {view === 'lobby' && (
        <>
          <section className="tabs-row">
            {tabs.map((tab) => (
              <button key={tab} className={tab === activeTab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
                {tab}
              </button>
            ))}
          </section>

          <section className="filters">
            <label>
              Tipo de juego
              <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label>
              Ventaja máxima de la casa: {maxHouseEdge.toFixed(1)}%
              <input type="range" min={0.5} max={8} step={0.1} value={maxHouseEdge} onChange={(event) => setMaxHouseEdge(Number(event.target.value))} />
            </label>
            <label>
              Buscar juego
              <input placeholder="Ej: Blackjack, Ruleta..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </section>

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
                    <p>Apuesta: {formatMoney(minBet, wallet?.currency ?? 'EUR')} - {formatMoney(maxBet, wallet?.currency ?? 'EUR')}</p>
                    <small>Mejor ventaja de la casa: {bestEdge.toFixed(2)}%</small>
                    <button onClick={() => setView(game.code === 'BLACKJACK' ? 'blackjack' : 'lobby')}>
                      {game.code === 'BLACKJACK' ? 'Ir a Blackjack' : 'Disponible pronto'}
                    </button>
                  </article>
                )
              })}
            </section>
          )}
        </>
      )}

      {view === 'blackjack' && (
        <section className="blackjack-board">
          <h2>Blackjack</h2>
          <p>{blackjackGame?.variants[0] ? `Apuesta mínima: ${formatMoney(blackjackGame.variants[0].minBetCents, wallet?.currency ?? 'EUR')}` : 'Juego no configurado'}</p>
          <div className="cards-row"><strong>Dealer:</strong> {round?.dealerCards.join(' ') ?? '-'}</div>
          <div className="cards-row"><strong>Tú:</strong> {round?.playerCards.join(' ') ?? '-'}</div>
          <p>Puntuación: {round ? `${calculateScore(round.playerCards)} vs ${calculateScore(round.dealerCards)}` : '-'}</p>
          <div className="actions-row">
            <button onClick={() => void startRound(Math.max(blackjackGame?.variants[0]?.minBetCents ?? 100, 100))} disabled={!activeUserId}>Nueva mano</button>
            <button onClick={() => void hit()} disabled={!round || round.finished}>Pedir</button>
            <button onClick={() => void stand()} disabled={!round || round.finished}>Plantarse</button>
            <button onClick={() => setView('lobby')}>Volver al lobby</button>
          </div>
          {round?.message && <p className={round.finished ? 'feedback' : ''}>{round.message}</p>}
        </section>
      )}

      {loading && <p className="feedback">Cargando lobby…</p>}
      {error && <p className="feedback error">{error}</p>}
    </main>
  )
}

export default App
