import { useState, useRef, useEffect } from 'react';

const PIN = import.meta.env.VITE_ACCESS_PIN as string;

export default function PinGate({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN) {
      sessionStorage.setItem('kfo_auth', '1');
      onSuccess();
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="pin-gate">
      <div className="pin-card">
        <h1>KFO Funnel Tracker</h1>
        <p className="pin-subtitle">hagar.kollegen, kieferorthopädie am stadttheater</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="PIN eingeben"
            className={error ? 'pin-input error' : 'pin-input'}
            autoComplete="off"
          />
          {error && <p className="pin-error">Falscher PIN</p>}
          <button type="submit" className="pin-button">
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
