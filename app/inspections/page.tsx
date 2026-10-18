
"use client";

import { useEffect, useState, type FormEvent } from "react";

type Product = {
  id: number;
  serialNumber: string;
  name: string;
};

type Approval = {
  status: string;
  reviewer?: string | null;
};

type Inspection = {
  id: number;
  productId: number;
  parameter: string;
  measuredValue: number;
  minValue: number;
  maxValue: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  product?: Product;
  approval?: Approval | null;
};

export default function InspectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [productId, setProductId] = useState("");
  const [parameter, setParameter] = useState("");
  const [measuredValue, setMeasuredValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, inspectionsResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/inspections"),
      ]);

      if (!productsResponse.ok || !inspectionsResponse.ok) {
        throw new Error("Unable to load products or inspection records.");
      }

      const productsData = await productsResponse.json();
      const inspectionsData = await inspectionsResponse.json();

      setProducts(Array.isArray(productsData) ? productsData : []);
      setInspections(Array.isArray(inspectionsData) ? inspectionsData : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const measured = Number(measuredValue);
    const minimum = Number(minValue);
    const maximum = Number(maxValue);

    if (
      !productId ||
      !parameter.trim() ||
      measuredValue.trim() === "" ||
      minValue.trim() === "" ||
      maxValue.trim() === "" ||
      !Number.isFinite(measured) ||
      !Number.isFinite(minimum) ||
      !Number.isFinite(maximum)
    ) {
      setError("Please complete all required fields with valid numbers.");
      return;
    }

    if (minimum > maximum) {
      setError("Minimum value cannot be greater than maximum value.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(productId),
          parameter: parameter.trim(),
          measuredValue: measured,
          minValue: minimum,
          maxValue: maximum,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Unable to create inspection."
        );
      }

      const passed = measured >= minimum && measured <= maximum;

      setSuccess(
        `Inspection recorded successfully. Result: ${passed ? "PASS" : "FAIL"}.`
      );
      setParameter("");
      setMeasuredValue("");
      setMinValue("");
      setMaxValue("");
      setNotes("");

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function statusStyle(status: string) {
    if (status === "PASS") return "bg-green-100 text-green-800";
    if (status === "FAIL") return "bg-red-100 text-red-800";
    return "bg-amber-100 text-amber-800";
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <a
          href="/"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </a>

        <div className="mb-8 mt-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Quality Control
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Quality Inspections
          </h1>
          <p className="mt-2 text-slate-600">
            Record product measurements and check them against acceptable limits.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Inspections</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inspections.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Passed</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {inspections.filter((item) => item.status === "PASS").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Failed</p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {inspections.filter((item) => item.status === "FAIL").length}
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Record Inspection
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label
                htmlFor="product"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Product
              </label>
              <select
                id="product"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.serialNumber} — {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="parameter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Quality Parameter
              </label>
              <input
                id="parameter"
                value={parameter}
                onChange={(event) => setParameter(event.target.value)}
                placeholder="e.g. Diameter or Final PDI"
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="measured"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Measured Value
              </label>
              <input
                id="measured"
                type="number"
                step="any"
                value={measuredValue}
                onChange={(event) => setMeasuredValue(event.target.value)}
                placeholder="e.g. 10"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="minimum"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Minimum Acceptable Value
              </label>
              <input
                id="minimum"
                type="number"
                step="any"
                value={minValue}
                onChange={(event) => setMinValue(event.target.value)}
                placeholder="e.g. 9.5"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="maximum"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Maximum Acceptable Value
              </label>
              <input
                id="maximum"
                type="number"
                step="any"
                value={maxValue}
                onChange={(event) => setMaxValue(event.target.value)}
                placeholder="e.g. 10.5"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Notes (Optional)
              </label>
              <input
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Additional inspection details"
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end lg:col-span-3">
              <button
                type="submit"
                disabled={saving || products.length === 0}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              >
                {saving ? "Saving..." : "Submit Inspection"}
              </button>
            </div>
          </form>

          {products.length === 0 && !loading && (
            <p className="mt-4 text-sm text-amber-700">
              Register a product before recording an inspection.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </p>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Inspection History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Measurements and recorded inspection results.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading inspections...</p>
          ) : inspections.length === 0 ? (
            <p className="p-6 text-slate-500">
              No inspections recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Parameter</th>
                    <th className="px-5 py-4 font-semibold">Measured</th>
                    <th className="px-5 py-4 font-semibold">Allowed Range</th>
                    <th className="px-5 py-4 font-semibold">Result</th>
                    <th className="px-5 py-4 font-semibold">Approval</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        {inspection.product?.serialNumber ??
                          products.find((p) => p.id === inspection.productId)
                            ?.serialNumber ??
                          `Product #${inspection.productId}`}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {inspection.parameter}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {inspection.measuredValue}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {inspection.minValue} – {inspection.maxValue}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(inspection.status)}`}
                        >
                          {inspection.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {inspection.approval?.status ?? "Awaiting review"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {new Date(inspection.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
