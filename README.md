# RateAtlas · TaxLens (`rateatlas-frontend`)

> React + TypeScript frontend that visualizes RateAtlas tax history insights and calculators.
>
> Part of the [RateAtlas](../README.md) stack.

This repository is the **frontend outline** for the Marginal Tax Rate Calculator ecosystem. It complements the backend services:

- **Spring Boot API** (`Marginal-tax-rate-calculator`)
- **Python ingestion microservice** (`tax-bracket-ingest`)

## 🚀 Overview

This frontend is built with **React + TypeScript (via Vite)** and provides:

- **Interactive Dashboard** — visualize U.S. tax trends over 160+ years
- **Tax Calculator** — input year, filing status, and income to compute marginal & effective tax rates
- **Data Visualization** — charts built with [Recharts](https://recharts.org/) for trends and bracket breakdowns

## 🛠 Tech Stack

- **React 18 + TypeScript**
- **Vite** (fast dev server & build) (in progress)
- **Axios** (API client) (in progress)
- **Recharts** (data visualization) (in progress)
- **Tailwind CSS** (undetermined, for utility-first styling)

## 📂 Project Structure

```txt
src/
 ├─ types.ts              # Strongly typed DTOs matching backend API
 ├─ api.ts                # Typed Axios client for /tax/history & /tax/calc
 ├─ components/
 │   ├─ TrendCard.tsx     # Line/Bar chart card (reusable)
 │   └─ BracketTable.tsx  # Bracket breakdown table
 ├─ TaxRatesApp.tsx       # Main dashboard + calculator
 └─ main.tsx              # Entry point
```

## 🔧 Local Development

1. Create a new project:

   ```bash
   npm create vite@latest tax-ui -- --template react-ts
   cd tax-ui
   npm i axios recharts
   ```

2. Add the files from this repo into `src/`.
3. Start your backend on **<http://localhost:8080>**.
4. Start the frontend:

   ```bash
   npm run dev
   ```

   Visit [http://localhost:5173](http://localhost:5173).

### Proxy Configuration

During development, Vite can proxy API calls:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### Environment Variables

For production builds, expose the backend directly to the client bundle:

```sh
RATE_ATLAS_API_BASE_URL=https://api.example.com/api/v1
```

During development you can either keep the same value or point at your local backend (e.g., `http://localhost:8080/api/v1`). Vite automatically injects variables prefixed with `VITE_`, and we also whitelist `RATE_ATLAS_` so the client can read `RATE_ATLAS_API_BASE_URL`.

## 📊 Features

- Explore historical **top marginal rates** and **bracket counts**
- Filter by **filing status** and **year range**
- Run tax calculations for a given year + income
- View detailed **bracket breakdown tables**

## 🔗 Related Repos

- [Marginal-tax-rate-calculator (Spring Boot backend)](https://github.com/CHA0sTIG3R/Marginal-tax-rate-calculator)
- [tax-bracket-ingest (Python ingestion microservice)](https://github.com/CHA0sTIG3R/tax-bracket-ingest)

## 📜 License

[Unlicensed coming soon]
