import { useCallback, useRef, useState } from "react";

const ACCEPTED = ".jpg,.jpeg,.png,.pdf";
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ onExtract, loading }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      alert("Unsupported file type. Please upload a JPG, PNG, or PDF.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      handleFile(dropped);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onInputChange = useCallback(
    (e) => {
      handleFile(e.target.files[0]);
      e.target.value = "";
    },
    [handleFile]
  );

  const handleSubmit = () => {
    if (file) onExtract(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-5">
      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 cursor-pointer select-none transition-all duration-200 ${
          dragging
            ? "border-indigo-400 bg-indigo-500/10"
            : "border-slate-600 bg-[#1a1d27] hover:border-indigo-500/60 hover:bg-indigo-500/5"
        } ${loading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          onChange={onInputChange}
          className="hidden"
        />

        {/* Icon */}
        <div className={`rounded-full p-4 ${dragging ? "bg-indigo-500/20" : "bg-slate-800"}`}>
          <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-slate-200 font-medium">
            {dragging ? "Drop your invoice here" : "Drag & drop your invoice"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            or <span className="text-indigo-400 font-medium">click to browse</span>
          </p>
          <p className="mt-2 text-xs text-slate-600">JPG, PNG, PDF · Max 10 MB</p>
        </div>
      </div>

      {/* Selected file preview */}
      {file && (
        <div className="flex items-center gap-4 rounded-xl border border-slate-700 bg-[#1a1d27] p-4">
          {preview ? (
            <img
              src={preview}
              alt="Invoice preview"
              className="h-16 w-16 rounded-lg object-cover border border-slate-700"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-slate-200">{file.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{formatBytes(file.size)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
      >
        {loading ? "Extracting…" : "Extract Invoice"}
      </button>
    </div>
  );
}
