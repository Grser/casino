# Arquitectura base recomendada (casino online)

## Capas

1. **API Gateway / Backend API**
   - Autenticación y autorización.
   - Exposición de endpoints para wallet, lobby y juego.

2. **Game Engine**
   - Lógica determinista de cada juego (blackjack, ruleta, slots).
   - Resolución de rondas, payouts, estados y eventos.

3. **Wallet & Ledger**
   - Saldo del jugador.
   - Registro transaccional inmutable para auditoría.

4. **Risk / Compliance**
   - Límites de apuesta, geobloqueo, KYC, AML, autoexclusión.

5. **Observabilidad**
   - Logs estructurados.
   - Métricas de latencia, RTP y errores por mesa/variante.

## Flujo para una apuesta (Blackjack)

1. Cliente crea sesión de juego.
2. Cliente envía apuesta.
3. API bloquea saldo en wallet (transacción BET).
4. Game Engine reparte cartas y calcula resultado.
5. API liquida la apuesta (PAYOUT si gana, 0 si pierde, devolución si push).
6. Se persiste `blackjack_hands` con detalle de cartas y marcador final.

## Buenas prácticas para producción

- RNG certificado y auditado.
- Firmado de eventos críticos.
- Idempotencia en depósitos/retiros y apuestas.
- Soporte multi-moneda y tipo de cambio controlado.
- Separar tablas de lectura analítica (BI) de tablas transaccionales.
