import { useEffect, useState } from "react";
import "./App.css";

const DEFAULT_RATE = 1.1;
const TICK_MS = 3000;

function randomDelta() {
  // random value between -0.05 and +0.05
  return Math.random() * 0.1 - 0.05;
}

export default function App() {
  const [rate, setRate] = useState(DEFAULT_RATE);

  useEffect(() => {
    const id = setInterval(() => {
      setRate((prev) => Math.max(0.0001, prev + randomDelta()));
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="page">
      <h1>Currency Converter</h1>

      <div className="card">
        <div className="label">Live EUR/USD rate</div>
        <div className="rate">{rate.toFixed(4)}</div>
        <div className="hint">Starts at 1.1 and moves every 3 seconds (±0.05)</div>
      </div>
    </div>
  );
}
