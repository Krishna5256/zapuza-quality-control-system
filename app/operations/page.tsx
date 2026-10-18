
"use client";

import { useCallback, useEffect, useState } from "react";

type Product = {
  id: number;
  serialNumber: string;
  name: string;
};

type Operation = {
  id: number;
  productId: number;
  sequence: number;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  holdMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
  holdUntil: string | null;
};

export default function OperationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationName, setOperationName] = useState("");
  const [sequence, setSequence] = useState("1");
  const [holdMinutes, setHoldMinutes] = useState("0");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Could not load products.");

    const data = await response.json();
    setProducts(Array.isArray(data) ? data : []);
  }, []);

  const loadOperations = useCallback(async (productId: string) => {
    if (!productId) {
      setOperations([]);
      return;
    }

    const response = await fetch(
      `/api/products/${productId}/operations`
    );

    if (!response.ok) {
      throw new Error("Could not load production operations.");
    }

    const data = await response.json();
    setOperations(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        await loadProducts();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load products."
        );
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [loadProducts]);

  useEffect(() => {
    async function refresh() {
      setError("");
      try {
        await loadOperations(selectedProduct);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load operations."
        );
      }
    }

    void refresh();
  }, [selectedProduct, loadOperations]);

  async function addOperation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedProduct) {
      setError("Select a product first.");
      return;
    }

    const seq = Number(sequence);
    const hold = Number(holdMinutes);

    if (
      !operationName.trim() ||
      !Number.isInteger(seq) ||
      seq < 1 ||
      !Number.isInteger(hold) ||
      hold < 0
    ) {
      setError("Enter a valid operation name, sequence, and hold time.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/products/${selectedProduct}/operations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: operationName.trim(),
            sequence: seq,
            holdMinutes: hold,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not add operation."
        );
      }

      setOperationName("");
      setSequence(String(seq + 1));
      setHoldMinutes("0");
      setMessage("Production operation added successfully.");
      await loadOperations(selectedProduct);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add operation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateOperation(
    operation: Operation,
    action: "START" | "COMPLETE"
  ) {
    setError("");
    setMessage("");
    setBusyId(operation.id);

    try {
      const response = await fetch(
        `/api/products/${selectedProduct}/operations/${operation.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `Could not ${action.toLowerCase()} operation.`
        );
      }

      setMessage(
        action === "START"
          ? `${operation.name} started successfully.`
          : `${operation.name} completed successfully.`
      );

      await loadOperations(selectedProduct);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Operation update failed."
      );
    } finally {
      setBusyId(null);
    }
  }

  function statusStyle(status: string) {
    if (status === "COMPLETED") return "bg-green-100 text-green-800";
    if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-800";
    if (status === "ON_HOLD") return "bg-red-100 text-red-800";
    return "bg-amber-100 text-amber-800";
  }

  function holdRemaining(operation: Operation) {
    if (!operation.holdUntil) return null;

    const remaining =
      new Date(operation.holdUntil).getTime() - Date.now();

    if (remaining <= 0) return "Hold completed";

    const totalSeconds = Math.ceil(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `Hold remaining: ${hours}h ${minutes}m ${seconds}s`;
  }

  const completedCount = operations.filter(
    (operation) => operation.status === "COMPLETED"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <a
          href="/"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </a>

        <div className="mb-8 mt-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Manufacturing
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Production Operations
          </h1>
          <p className="mt-2 text-slate-600">
            Manage manufacturing steps, sequence, completion, and hold times.
          </p>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="product"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Select Product
          </label>
          <select
            id="product"
            value={selectedProduct}
            onChange={(event) => {
              setSelectedProduct(event.target.value);
              setMessage("");
              setError("");
              setSequence("1");
            }}
            className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Choose a product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.serialNumber} — {product.name}
              </option>
            ))}
          </select>
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Operations</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {operations.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {completedCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Remaining</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {operations.length - completedCount}
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Add Production Operation
          </h2>

          <form
            onSubmit={addOperation}
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div>
              <label
                htmlFor="operationName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Operation Name
              </label>
              <input
                id="operationName"
                value={operationName}
                onChange={(event) => setOperationName(event.target.value)}
                placeholder="e.g. Cutting"
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="sequence"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sequence Number
              </label>
              <input
                id="sequence"
                type="number"
                min="1"
                step="1"
                value={sequence}
                onChange={(event) => setSequence(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="holdMinutes"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Hold Time (minutes)
              </label>
              <input
                id="holdMinutes"
                type="number"
                min="0"
                step="1"
                value={holdMinutes}
                onChange={(event) => setHoldMinutes(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving || !selectedProduct}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Adding..." : "Add Operation"}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {message}
          </p>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Operation Sequence
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Start and complete each step in sequence.
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedProduct}
              onClick={() => void loadOperations(selectedProduct)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {!selectedProduct ? (
            <p className="p-6 text-slate-500">
              Select a product to view its operations.
            </p>
          ) : loading ? (
            <p className="p-6 text-slate-500">Loading operations...</p>
          ) : operations.length === 0 ? (
            <p className="p-6 text-slate-500">
              No operations have been configured for this product yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {operations
                .slice()
                .sort((a, b) => a.sequence - b.sequence)
                .map((operation) => (
                  <div
                    key={operation.id}
                    className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700">
                        {operation.sequence}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {operation.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Required hold: {operation.holdMinutes} minute(s)
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(operation.status)}`}
                          >
                            {operation.status.replace("_", " ")}
                          </span>
                          {operation.holdUntil && (
                            <span className="text-xs text-slate-600">
                              {holdRemaining(operation)}
                            </span>
                          )}
                        </div>
                        {operation.startedAt && (
                          <p className="mt-2 text-xs text-slate-500">
                            Started:{" "}
                            {new Date(operation.startedAt).toLocaleString()}
                          </p>
                        )}
                        {operation.completedAt && (
                          <p className="mt-1 text-xs text-slate-500">
                            Completed:{" "}
                            {new Date(operation.completedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {operation.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            void updateOperation(operation, "START")
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {busyId === operation.id ? "Saving..." : "Start"}
                        </button>
                      )}
                      {operation.status === "IN_PROGRESS" && (
                        <button
                          type="button"
                          disabled={busyId !== null}
                          onClick={() =>
                            void updateOperation(operation, "COMPLETE")
                          }
                          className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          {busyId === operation.id ? "Saving..." : "Complete"}
                        </button>
                      )}
                      {operation.status === "COMPLETED" && (
                        <span className="self-center text-sm font-semibold text-green-700">
                          Step completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
