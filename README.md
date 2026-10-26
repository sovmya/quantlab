# QuantLab: Strategy Backtesting Platform

Full-stack (MERN) platform to build price datasets, backtest trading strategies, and analyse risk/return metrics.

## Links

- **Live Website:** https://quantlab-drab.vercel.app/
- **Backend Health Check:** https://quantlab-bzr6.onrender.com/api/health
- **Demo Video:** https://drive.google.com/file/d/1DCd7EjVkzIYcPB7nGGfMGeHleaPldFp4/view?usp=sharing

## Features
- Secure auth: bcrypt, JWT in HttpOnly cookie, rate-limited login, generic errors
- Datasets: seeded Geometric Brownian Motion generator, or CSV upload (Yahoo-style)
- Strategies: SMA Crossover, RSI Mean Reversion, Bollinger Bands (params validated server-side)
- Backtest engine: fees, one-bar execution delay (no look-ahead bias), Buy & Hold benchmark
- Metrics: total return, CAGR, annualised volatility, Sharpe ratio, max drawdown, win rate
- Equity-curve chart vs benchmark, trade log, saved history
- Unit tests for indicators and engine

## Tech
React (Vite), React Router, Context API, Axios, Recharts · Node, Express · MongoDB, Mongoose · helmet, express-rate-limit

## Architecture
```
backend/   routes → controllers → services (engine, strategies, indicators) → models
frontend/  pages → components → context → services/api
```
In dev and prod the frontend calls `/api/*` (Vite proxy / Vercel rewrite), so the session cookie is first-party and no CORS config is needed.

## Local setup
Requirements: Node 18+, a MongoDB Atlas cluster.

```bash
git clone https://github.com/sovmya/quantlab.git
cd quantlab/backend
npm install
cp .env.example .env     # then fill in MONGO_URI and JWT_SECRET
npm test                 # engine unit tests
npm run dev              # http://localhost:5000
```
New terminal:
```bash
cd quantlab/frontend
npm install
npm run dev              # http://localhost:5173
```

## API
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register, /login, /logout | - | Auth |
| GET | /api/auth/me | ✔ | Current user |
| GET | /api/datasets | ✔ | List |
| POST | /api/datasets/generate, /upload | ✔ | Create dataset |
| GET/DELETE | /api/datasets/:id | ✔ | Read / delete |
| GET | /api/backtests/strategies | ✔ | Strategy definitions |
| POST | /api/backtests | ✔ | Run backtest |
| GET/DELETE | /api/backtests, /api/backtests/:id | ✔ | History |

## Security
Passwords hashed (bcrypt), never returned · HttpOnly/Secure cookies · every query scoped to the logged-in user · strict input validation (type, range, ObjectId) · rate limiting · helmet headers · body-size limits · central error handler (no stack traces) · secrets only in `.env`.

## Methodology notes
- Signals computed at close of day *t* execute at close of day *t+1*.
- Long-only, fully invested or in cash; fee charged on each buy and sell.
- Sharpe = mean/σ of daily returns × √252 (risk-free = 0).
- Synthetic prices follow GBM; results on simulated data illustrate mechanics, not real-market edge.

## Limitations / future work
Multi-asset portfolios, short selling, parameter-grid optimisation, walk-forward testing, live market data.