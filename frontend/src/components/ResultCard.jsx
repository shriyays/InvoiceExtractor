function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.8 ? "bg-emerald-500" : score >= 0.5 ? "bg-yellow-500" : "bg-red-500";
  const label =
    score >= 0.8 ? "text-emerald-400" : score >= 0.5 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${label}`}>{pct}%</span>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-200 break-words">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#1a1d27] p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function formatCurrency(val, currency) {
  if (val == null) return "—";
  const sym = currency || "";
  return `${sym} ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

export default function ResultCard({ data, onReset }) {
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice_${data.invoice_number || "extracted"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cur = data.currency || "";

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
      {/* ── Section 1: Header ── */}
      <Section title="Invoice Details">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Field label="Invoice #" value={data.invoice_number} />
          <Field label="Invoice Date" value={data.invoice_date} />
          <Field label="Due Date" value={data.due_date} />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Extraction Confidence
            </p>
            <ConfidenceBar score={data.confidence_score} />
          </div>
          {data.cached && (
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              Cached
            </span>
          )}
          <span className="shrink-0 rounded-full bg-slate-700/60 px-3 py-1 text-xs text-slate-400 border border-slate-600">
            {data.latency_ms} ms
          </span>
        </div>
      </Section>

      {/* ── Section 2: Vendor & Client ── */}
      <div className="grid grid-cols-2 gap-5">
        <Section title="Vendor">
          <div className="flex flex-col gap-3">
            <Field label="Name" value={data.vendor_name} />
            <Field label="Address" value={data.vendor_address} />
            <Field label="Email" value={data.vendor_email} />
            <Field label="Phone" value={data.vendor_phone} />
          </div>
        </Section>
        <Section title="Client">
          <div className="flex flex-col gap-3">
            <Field label="Name" value={data.client_name} />
            <Field label="Address" value={data.client_address} />
          </div>
        </Section>
      </div>

      {/* ── Section 3: Line Items ── */}
      <Section title="Line Items">
        {data.line_items && data.line_items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.line_items.map((item, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-800 ${i % 2 === 0 ? "" : "bg-slate-800/30"}`}
                  >
                    <td className="py-2.5 pr-4 text-slate-200">{item.description || "—"}</td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">
                      {item.quantity ?? "—"}
                    </td>
                    <td className="py-2.5 text-right text-slate-300 tabular-nums">
                      {item.unit_price != null
                        ? item.unit_price.toLocaleString("en-US", { minimumFractionDigits: 2 })
                        : "—"}
                    </td>
                    <td className="py-2.5 text-right text-slate-200 font-medium tabular-nums">
                      {item.total != null
                        ? item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No line items detected.</p>
        )}
      </Section>

      {/* ── Section 4: Totals ── */}
      <Section title="Totals">
        <div className="flex flex-col items-end gap-2 text-sm">
          {data.subtotal != null && (
            <div className="flex gap-8">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-200 tabular-nums w-32 text-right">
                {formatCurrency(data.subtotal, cur)}
              </span>
            </div>
          )}
          {data.tax != null && (
            <div className="flex gap-8">
              <span className="text-slate-500">Tax</span>
              <span className="text-slate-200 tabular-nums w-32 text-right">
                {formatCurrency(data.tax, cur)}
              </span>
            </div>
          )}
          {data.discount != null && (
            <div className="flex gap-8">
              <span className="text-slate-500">Discount</span>
              <span className="text-emerald-400 tabular-nums w-32 text-right">
                − {formatCurrency(data.discount, cur)}
              </span>
            </div>
          )}
          <div className="mt-2 flex gap-8 border-t border-slate-700 pt-3">
            <span className="text-slate-300 font-semibold text-base">Total</span>
            <span className="text-white font-bold text-xl tabular-nums w-32 text-right">
              {formatCurrency(data.total_amount, cur)}
            </span>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Additional ── */}
      {(data.payment_terms || data.notes) && (
        <Section title="Additional Information">
          <div className="flex flex-col gap-3">
            <Field label="Payment Terms" value={data.payment_terms} />
            <Field label="Notes" value={data.notes} />
          </div>
        </Section>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <button
          onClick={downloadJson}
          className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 active:scale-[0.98]"
        >
          Download JSON
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98]"
        >
          Extract Another
        </button>
      </div>
    </div>
  );
}
