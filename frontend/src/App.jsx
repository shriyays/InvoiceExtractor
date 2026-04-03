import { useState, useEffect } from "react";
import UploadZone from "./components/UploadZone";
import ResultCard from "./components/ResultCard";
import LoadingState from "./components/LoadingState";
import ErrorBanner from "./components/ErrorBanner";
import { extractInvoice, getHistory } from "./api/client";

function HistoryItem({ item, index }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#1a1d27] px-4 py-3 text-sm">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-500 font-mono">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-200">
            {item.vendor_name || "Unknown Vendor"}
          </p>
          <p className="text-xs text-slate-500">
            {item.invoice_number ? `#${item.invoice_number}` : "No invoice #"}
            {item.invoice_date ? ` · ${item.invoice_date}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {item.total_amount != null && (
          <span className="font-semibold text-slate-200">
            {item.currency || ""} {item.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        )}
        {item.cached && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
            Cached
          </span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const h = await getHistory();
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      // silently ignore history fetch errors
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExtract = async (file) => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const data = await extractInvoice(file);
      setResult(data);
      fetchHistory();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "An unexpected error occurred. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f1117]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">InvoiceIQ</h1>
            <p className="text-xs text-slate-500 leading-none mt-0.5">AI-powered invoice extraction</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {loading ? (
          <LoadingState />
        ) : result ? (
          <ResultCard data={result} onReset={handleReset} />
        ) : (
          <div className="flex flex-col items-center gap-10">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-100">
                Extract invoice data instantly
              </h2>
              <p className="mt-2 text-slate-500 text-sm max-w-md">
                Upload any invoice image or PDF and AI Vision will extract vendor info, line items,
                totals, and payment terms into clean structured JSON.
              </p>
            </div>
            <UploadZone onExtract={handleExtract} loading={loading} />
          </div>
        )}

        {/* History */}
        {history.length > 0 && !loading && (
          <div className="mt-16">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Recent Extractions
            </h2>
            <div className="flex flex-col gap-2">
              {history.map((item, i) => (
                <HistoryItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
