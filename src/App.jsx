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
  const [rate, setRate] = useState(DEFAULT_RATE);

  // switch: "EUR" means input EUR output USD; "USD" means input USD output EUR
  const [mode, setMode] = useState("EUR");

  const [inputText, setInputText] = useState("100");

  // polling tick
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

  const inputAmount = useMemo(() => parseNumber(inputText), [inputText]);

  const outputAmount = useMemo(() => {
    if (!Number.isFinite(inputAmount)) return NaN;
    if (rate <= 0) return NaN;

    return mode === "EUR" ? inputAmount * rate : inputAmount / rate;
  }, [inputAmount, rate, mode]);

  const fromCcy = mode === "EUR" ? "EUR" : "USD";
  const toCcy = mode === "EUR" ? "USD" : "EUR";

  // continuity: on switch, current output becomes new input
  function switchMode(nextMode) {
    if (nextMode === mode) return;

    if (Number.isFinite(outputAmount)) {
      setInputText(fmt(outputAmount, 2));
    }
    setMode(nextMode);
  }

  return (
    <div className="page">
      <h1>Currency Converter</h1>

      <div className="card">
        <div className="label">Live EUR/USD rate</div>
        <div className="rate">{rate.toFixed(4)}</div>
        <div className="hint">Moves every 3 seconds (±0.05). Output refreshes every 1s (polling).</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="switch" role="group" aria-label="Conversion direction">
          <button
            className={mode === "EUR" ? "active" : ""}
            onClick={() => switchMode("EUR")}
          >
            EUR → USD
          </button>
          <button
            className={mode === "USD" ? "active" : ""}
            onClick={() => switchMode("USD")}
          >
            USD → EUR
          </button>
        </div>

        <div className="grid">
          <div className="field">
            <label>Amount ({fromCcy})</label>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              inputMode="decimal"
              placeholder={`Enter ${fromCcy}`}
            />
            {!Number.isFinite(inputAmount) && <div className="warn">Enter a valid number</div>}
            <div className="hintSmall">Switching keeps continuity: output becomes the next input.</div>
          </div>

          <div className="result">
            <div className="label">Result ({toCcy})</div>
            <div className="value">{fmt(outputAmount, 2)}</div>
            <div className="hintSmall">
              {Number.isFinite(inputAmount)
                ? `${fmt(inputAmount, 2)} ${fromCcy} → ${fmt(outputAmount, 2)} ${toCcy}`
                : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
