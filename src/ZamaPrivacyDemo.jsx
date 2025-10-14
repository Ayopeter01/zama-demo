import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SAMPLE_TXS = [
  {
    txId: "0x8a1f...c3d4",
    from: "0x4b12a6f1e3b4c5d67890aa1234567890abcdef12",
    to: "0x9c44b2d3a1e4f5b67890bb223344556677889900",
    amount: 12.3456,
    token: "USDC",
    memo: "Salary - August",
    timestamp: "2025-09-10T13:24:00Z",
    claimable: true,
    claimed: false,
    claimSecret: "CLAIM-8900",
    private: true,
  },
  {
    txId: "0x2b3e...f9a7",
    from: "0x33b21c8a7a3d6f5a0123456789abcdef01234567",
    to: "0x4e90f3c2b1a4d5e67890cc334455667788990011",
    amount: 0.987,
    token: "ETH",
    memo: "Swap: ETH -> DAI",
    timestamp: "2025-09-12T09:02:45Z",
    claimable: false,
    claimed: false,
    claimSecret: null,
    private: false,
  },
  {
    txId: "0x7f6c...11b2",
    from: "0x77a11fbb22cc33dd44ee55ff66778899aabbccdd",
    to: "0x55a22b33c44d55e66f77g88h99i00j11k22l33m",
    amount: 1000000,
    token: "DAI",
    memo: "Locked: Staking",
    timestamp: "2025-09-18T18:00:00Z",
    claimable: true,
    claimed: false,
    claimSecret: "CLAIM-33M",
    private: true,
  },
];

function shortDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
}

function obfuscateAddress(addr) {
  if (!addr) return "—";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function obfuscateAmount(amount) {
  if (amount <= 1) return "< 1";
  if (amount <= 100) return Math.round(amount).toString();
  if (amount <= 10000) return Math.round(amount / 10) * 10 + " ±";
  if (amount <= 1000000) return Math.round(amount / 100) * 100 + " ±";
  return "> 1M";
}

function OwnerRow({ tx }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-700/40 bg-gradient-to-b from-slate-800/60 to-slate-900/50 backdrop-blur-sm shadow-md flex flex-col md:flex-row gap-4 md:items-center">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400">Tx</div>
        <div className="font-mono text-sm text-slate-100 truncate">{tx.txId}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400">From</div>
        <div className="truncate text-sm text-slate-200">{tx.from}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400">To</div>
        <div className="truncate text-sm text-slate-200">{tx.to}</div>
      </div>
      <div className="flex-1 text-right md:text-left">
        <div className="text-xs text-slate-400">Amount</div>
        <div className="font-semibold text-sky-300">{tx.amount} {tx.token}</div>
      </div>
      <div className="flex-1 md:flex-none md:w-48">
        <div className="text-xs text-slate-400">Memo</div>
        <div className="truncate text-sm text-slate-200">{tx.memo}</div>
      </div>
      <div className="text-xs text-slate-500 md:ml-3">{shortDate(tx.timestamp)}</div>
    </div>
  );
}

function PublicRow({ tx, onOpenClaim }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-700/30 bg-slate-900/50 backdrop-blur-sm shadow-sm flex flex-col md:flex-row gap-4 md:items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400">Tx</div>
          {tx.private && <div className="text-xxs px-2 py-0.5 rounded-full bg-indigo-700 text-indigo-100 text-[10px]">🔒 Private</div>}
        </div>
        <div className="font-mono text-sm text-slate-200 truncate">{tx.txId}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400">From</div>
        <div className="truncate text-sm text-slate-300">{obfuscateAddress(tx.from)}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400">To</div>
        <div className="truncate text-sm text-slate-300">{obfuscateAddress(tx.to)}</div>
      </div>

      <div className="flex-1 text-right md:text-left">
        <div className="text-xs text-slate-400">Amount</div>
        <div className="font-semibold text-slate-100 text-sm">
          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800/40 backdrop-blur-sm">{obfuscateAmount(tx.amount)} {tx.token}</span>
        </div>
      </div>

      <div className="flex-1 md:flex-none md:w-48">
        <div className="text-xs text-slate-400">Memo</div>
        <div className="truncate text-sm text-slate-300">{tx.private ? "Encrypted — only visible to recipient" : "—"}</div>
      </div>

      <div className="flex items-center gap-3 md:ml-3">
        {tx.claimable && !tx.claimed ? (
          <button
            onClick={() => onOpenClaim(tx)}
            className="px-3 py-1 rounded-full bg-emerald-500/90 text-slate-900 text-sm font-semibold">
            Claim
          </button>
        ) : tx.claimed ? (
          <div className="text-sm text-emerald-400">Claimed</div>
        ) : (
          <div className="text-sm text-slate-500">Public</div>
        )}
        <div className="text-xs text-slate-500">{shortDate(tx.timestamp)}</div>
      </div>
    </div>
  );
}

function ClaimModal({ tx, onClose, onClaim }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reveal, setReveal] = useState(false);

  async function submitClaim(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    if (!tx) {
      setError("Missing transaction");
      setLoading(false);
      return;
    }

    // Demo verification: match input to tx.claimSecret.
    if (input.trim() === tx.claimSecret) {
      onClaim(tx.txId);
      setLoading(false);
      onClose();
    } else {
      setError("Incorrect claim secret — check the Discord demo post or reveal the demo secret below.");
      setLoading(false);
    }
  }

  if (!tx) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ scale: 0.99, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 max-w-lg w-full bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">Claim transfer <span className="text-sm text-slate-400">🔐</span></h3>
        <p className="text-sm text-slate-400 mt-2">This transfer was sent privately. Enter the claim secret you received from the sender or use the demo reveal to test the flow.</p>

        <div className="mt-4 font-mono text-sm bg-slate-800/60 p-3 rounded text-slate-200">Tx: {tx.txId}</div>

        <form onSubmit={submitClaim} className="mt-4 space-y-3">
          <div>
            <label className="text-sm block mb-1 text-slate-300">Claim secret</label>
            <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full border border-slate-700 rounded p-2 bg-slate-800 text-slate-100" placeholder="Enter claim secret" />
          </div>

          {error && <div className="text-sm text-rose-400">{error}</div>}

          <div className="flex gap-2 justify-between items-center">
            <div className="text-sm text-slate-400">Demo secret is hidden by default for security testing.</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setReveal((r) => !r)} className="px-3 py-1 rounded border border-slate-700 text-sm">{reveal ? "Hide demo secret" : "Reveal demo secret"}</button>
              <button type="submit" disabled={loading} className="px-3 py-1 rounded bg-emerald-500 text-slate-900">{loading ? "Claiming..." : "Claim"}</button>
            </div>
          </div>

          {reveal && (
            <div className="mt-2 text-xs text-slate-300 bg-slate-800/60 p-2 rounded font-mono">{tx.claimSecret}</div>
          )}
        </form>

        <div className="mt-4 text-xs text-slate-500">In production: never store secrets client-side. Use server-side verification or ZK proofs/relayer flows.</div>
      </motion.div>
    </div>
  );
}

export default function ZamaPrivacyDemo() {
  const [view, setView] = useState("owner");
  const [selected, setSelected] = useState(null);
  const [txs, setTxs] = useState(SAMPLE_TXS);
  const [claimTx, setClaimTx] = useState(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      const newTx = {
        txId: "0x" + Math.random().toString(16).slice(2, 10) + "...",
        from: "0x" + Math.random().toString(16).slice(2, 20),
        to: "0x" + Math.random().toString(16).slice(2, 20),
        amount: Number((Math.random() * 200).toFixed(4)),
        token: ["ETH", "DAI", "USDC"][Math.floor(Math.random() * 3)],
        memo: "(demo)",
        timestamp: new Date().toISOString(),
        claimable: random > 0.6,
        claimed: false,
        claimSecret: random > 0.6 ? "CLAIM-" + Math.random().toString(36).slice(-4).toUpperCase() : null,
        private: random > 0.5,
      };
      setTxs((p) => [newTx, ...p].slice(0, 20));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  function openClaim(tx) {
    setClaimTx(tx);
  }

  function closeClaim() {
    setClaimTx(null);
  }

  function handleClaimed(txId) {
    setTxs((prev) => prev.map((t) => (t.txId === txId ? { ...t, claimed: true } : t)));
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Zama — Transaction Privacy Demo</h1>
            <p className="text-sm text-slate-400 mt-1">A privacy-forward demo: compare the owner’s decrypted view with the public, privacy-preserving view.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-400">View:</div>
            <div className="rounded-full bg-slate-800 p-1 flex items-center">
              <button
                onClick={() => setView("owner")}
                className={`px-3 py-1 rounded-full ${view === "owner" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>
                Owner
              </button>
              <button
                onClick={() => setView("public")}
                className={`ml-1 px-3 py-1 rounded-full ${view === "public" ? "bg-indigo-600 text-white" : "text-slate-300"}`}>
                Public
              </button>
            </div>
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <h2 className="text-lg font-medium mb-2">Transactions</h2>
              <div className="space-y-3">
                {txs.map((tx) => (
                  <div key={tx.txId} onClick={() => setSelected(tx.txId)}>
                    {view === "owner" ? <OwnerRow tx={tx} /> : <PublicRow tx={tx} onOpenClaim={openClaim} />}
                  </div>
                ))}
              </div>
            </div>

            <aside className="col-span-1">
              <div className="p-4 rounded-2xl border bg-slate-900/70 shadow-sm">
                <h3 className="font-semibold">Privacy-first cues</h3>
                <ul className="mt-2 text-sm space-y-2 list-disc list-inside text-slate-300">
                  <li>🔒 Private transfers show a lock badge and encrypted memo text.</li>
                  <li>👁️ Owner view shows decrypted data only the recipient/app should see.</li>
                  <li>📡 Public view shows obfuscated addresses and coarse amounts — enough to verify, not to surveil.</li>
                </ul>

                <div className="mt-3 text-sm text-slate-400">Design choices: dark palette for trust, slower updates, hidden demo secrets by default. Replace demo logic with a relayer/zk flow before production.</div>

                <div className="mt-4">
                  <a href="https://zama.ai" target="_blank" rel="noreferrer" className="text-sm underline">Zama docs &gt;</a>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-2xl border bg-slate-900/70 shadow-sm">
                <h4 className="font-medium">Selected</h4>
                {selected ? (
                  <div className="mt-2 text-sm font-mono text-slate-200">{selected}</div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">Click a transaction to select it</div>
                )}
              </div>
            </aside>
          </div>

          <section className="p-4 rounded-2xl border bg-slate-900/70 shadow-sm">
            <h3 className="text-lg font-medium">Content and testing checklist</h3>
            <ol className="list-decimal list-inside mt-2 text-sm space-y-2 text-slate-300">
              <li>Local dev: run <code>npm run dev</code> and verify Owner/Public toggle works.</li>
              <li>Claim flow: switch to Public, click "Claim" on a claimable tx, reveal demo secret, then enter it to mark claimed.</li>
              <li>Simulated live: new txs appear every 15s. Confirm claimable badge appears sometimes.</li>
              <li>Privacy check: remove demo secrets and move verification server-side before deploying.</li>
            </ol>
          </section>

        </motion.section>

        <footer className="mt-6 text-sm text-slate-500">Made for Zama creators — adapt visuals/copy to match brand. Replace sample data with live testnet data for demos.</footer>
      </div>

      {claimTx && (
        <ClaimModal tx={claimTx} onClose={closeClaim} onClaim={handleClaimed} />
      )}
    </div>
  );
}

