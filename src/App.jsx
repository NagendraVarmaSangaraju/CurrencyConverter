import { useEffect, useMemo, useState } from "react";
import "./App.css";

const DEFAULT_RATE = 1.1;
const RATE_TICK_MS = 3000; // live rate changes every 3s
const POLL_MS = 1000;      // polling refresh (requirement)

function randomDelta() {
  return Math.random() * 0.1 - 0.05; // [-0.05, +0.05]
}

function parseNumber(text) {
  const v = Number(String(text).trim().replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

function fmt(n, decimals = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(decimals);
}

export default function App() {
  // live rate simulation
  const [rate, setRate] = useState(DEFAULT_RATE);

  // EUR input
  const [eurText, setEurText] = useState("100");

  // polling tick to force refresh
  const [, setPollTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setRate((prev) => Math.max(0.0001, prev + randomDelta()));
    }, RATE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPollTick((x) => x + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const eurAmount = useMemo(() => parseNumber(eurText), [eurText]);

  const usdAmount = useMemo(() => {
    if (!Number.isFinite(eurAmount)) return NaN;
    return eurAmount * rate;
  }, [eurAmount, rate]);

  return (
    <div className="page">
      <h1>Currency Converter</h1>

      <div className="card">
        <div className="label">Live EUR/USD rate</div>
        <div className="rate">{rate.toFixed(4)}</div>
        <div className="hint">Moves every 3 seconds (±0.05). Output refreshes every 1s (polling).</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="grid">
          <div className="field">
            <label>Amount (EUR)</label>
            <input
              value={eurText}
              onChange={(e) => setEurText(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 100"
            />
            {!Number.isFinite(eurAmount) && <div className="warn">Enter a valid number</div>}
          </div>

          <div className="result">
            <div className="label">Result (USD)</div>
            <div className="value">{fmt(usdAmount, 2)}</div>
            <div className="hintSmall">
              {Number.isFinite(eurAmount) ? `${fmt(eurAmount, 2)} EUR → ${fmt(usdAmount, 2)} USD` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
