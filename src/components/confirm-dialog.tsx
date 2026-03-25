"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  note,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  busyLabel = "Processando...",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  const confirmBase = danger
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-amber-900 hover:bg-amber-950 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-900/10 bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-amber-950">{title}</h2>
        <p className="mt-3 text-sm text-amber-900/90">{description}</p>
        {note && <p className="mt-2 text-xs text-amber-900/70">{note}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 ${confirmBase}`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
