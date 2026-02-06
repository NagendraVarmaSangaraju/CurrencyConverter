import { useEffect, useMemo, useRef, useState } from "react";
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
  const [liveRate, setLiveRate] = useState(DEFAULT_RATE);

  // mode: "EUR" => EUR->USD, "USD" => USD->EUR
  const [mode, setMode] = useState("EUR");
  const [inputText, setInputText] = useState("100");

  // override
  const [overrideText, setOverrideText] = useState("");
  const [overrideOn, setOverrideOn] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState("");

  // history (last 5)
  const [history, setHistory] = useState([]);
  const lastKeyRef = useRef(null);

  // polling tick (explicit requirement)
  const [, setPollTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveRate((prev) => Math.max(0.0001, prev + randomDelta()));
    }, RATE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPollTick((x) => x + 1), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const overrideRate = useMemo(() => {
    const v = parseNumber(overrideText);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [overrideText]);

  const effectiveRate = useMemo(() => {
    if (overrideOn && overrideRate != null) return overrideRate;
    return liveRate;
  }, [overrideOn, overrideRate, liveRate]);

  // auto-disable override if >= 2% drift
  useEffect(() => {
    if (!overrideOn) return;
    if (overrideRate == null) return;

    const drift = Math.abs(overrideRate - liveRate) / liveRate;
    if (drift >= 0.02) {
      setOverrideOn(false);
      setOverrideMsg("Override disabled (≥ 2% away from live rate).");
    }
  }, [overrideOn, overrideRate, liveRate]);

  useEffect(() => {
    if (!overrideMsg) return;
    const t = setTimeout(() => setOverrideMsg(""), 2500);
    return () => clearTimeout(t);
  }, [overrideMsg]);

  const inputAmount = useMemo(() => parseNumber(inputText), [inputText]);

  const outputAmount = useMemo(() => {
    if (!Number.isFinite(inputAmount)) return NaN;
    if (effectiveRate <= 0) return NaN;
    return mode === "EUR" ? inputAmount * effectiveRate : inputAmount / effectiveRate;
  }, [inputAmount, effectiveRate, mode]);

  const fromCcy = mode === "EUR" ? "EUR" : "USD";
  const toCcy = mode === "EUR" ? "USD" : "EUR";

  // continuity on switch
  function switchMode(nextMode) {
    if (nextMode === mode) return;
    if (Number.isFinite(outputAmount)) {
      setInputText(fmt(outputAmount, 2));
    }
    setMode(nextMode);
  }

  // record history (last 5)
  useEffect(() => {
    if (!Number.isFinite(inputAmount) || !Number.isFinite(outputAmount)) return;

    const overrideShown = overrideOn && overrideRate != null ? overrideRate : null;

    // "key" prevents duplicate rows when nothing materially changed
    const key =
      `${mode}|${fmt(inputAmount, 6)}|${fmt(outputAmount, 6)}|` +
      `${fmt(liveRate, 6)}|${overrideShown == null ? "—" : fmt(overrideShown, 6)}`;

    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const row = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      liveRate,
      override: overrideShown,
      fromCcy,
      toCcy,
      fromAmount: inputAmount,
      toAmount: outputAmount,
    };

    setHistory((prev) => [row, ...prev].slice(0, 5));
  }, [inputAmount, outputAmount, mode, liveRate, overrideOn, overrideRate, fromCcy, toCcy]);

  return (
    <div className="page">
      <h1>Currency Converter</h1>

      <div className="card">
        <div className="label">Live EUR/USD rate</div>
        <div className="rate">{liveRate.toFixed(4)}</div>
        <div className="hint">Moves every 3 seconds (±0.05). Output refreshes every 1s (polling).</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="h2">Override FX rate</h2>

        <div className="grid2">
          <div className="field">
            <label>EUR/USD override</label>
            <input
              value={overrideText}
              onChange={(e) => {
                setOverrideText(e.target.value);
                setOverrideMsg("");
              }}
              inputMode="decimal"
              placeholder="e.g. 1.105"
            />
            <div className="hintSmall">Auto-disables if drift ≥ 2% vs live.</div>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={overrideOn}
              onChange={(e) => {
                setOverrideOn(e.target.checked);
                setOverrideMsg("");
              }}
              disabled={overrideText.trim() === ""}
            />
            Enable override
          </label>
        </div>

        <div className="hintSmall">
          Effective rate: <b>{effectiveRate.toFixed(4)}</b>{" "}
          {overrideOn && overrideRate != null ? "(override)" : "(live)"}
        </div>

        {overrideMsg && <div className="toast">{overrideMsg}</div>}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="switch" role="group" aria-label="Conversion direction">
          <button className={mode === "EUR" ? "active" : ""} onClick={() => switchMode("EUR")}>
            EUR → USD
          </button>
          <button className={mode === "USD" ? "active" : ""} onClick={() => switchMode("USD")}>
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

      {/* History table */}
      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="h2">Last 5 conversions</h2>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Live FX</th>
                <th>Override</th>
                <th>Input</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No history yet.
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.ts).toLocaleTimeString()}</td>
                    <td>{fmt(r.liveRate, 4)}</td>
                    <td>{r.override == null ? "—" : fmt(r.override, 4)}</td>
                    <td>
                      {fmt(r.fromAmount, 2)} {r.fromCcy}
                    </td>
                    <td>
                      {fmt(r.toAmount, 2)} {r.toCcy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="footer">
        Polling: {POLL_MS}ms • Tick: {RATE_TICK_MS}ms
      </footer>
    </div>
  );
}
