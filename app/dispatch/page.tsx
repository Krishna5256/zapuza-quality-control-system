
"use client";

import { useCallback, useEffect, useState } from "react";

type Product = {
  id: number;
  serialNumber: string;
  name: string;
  dispatches?: {
    id: number;
    dispatchedAt: string;
    dispatchedBy: string;
  }[];
};

type Operation = {
  id: number;
  sequence: number;
  name: string;
  status: string;
  holdMinutes: number;
  holdUntil: string | null;
};

type Inspection = {
  id: number;
  parameter: string;
  status: string;
  approval?: {
    status: string;
    reviewer?: string | null;
  } | null;
};

type ProductDetails = {
  id: number;
  serialNumber: string;
  name: string;
  operations: Operation[];
  inspections: Inspection[];
  dispatches: {
    id: number;
    dispatchedAt: string;
    dispatchedBy: string;
  }[];
};

export default function DispatchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [dispatchedBy, setDispatchedBy] = useState("Dispatch Supervisor");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Could not load products.");

    const data = await response.json();
    setProducts(Array.isArray(data) ? data : []);
  }, []);

  const loadDetails = useCallback(async (productId: string) => {
    if (!productId) {
      setDetails(null);
      return;
    }

    setLoadingDetails(true);

    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Could not load product details.");

      const allProducts = await response.json();
      const product = allProducts.find(
        (item: ProductDetails) => item.id === Number(productId)
      );

      if (!product) throw new Error("Selected product was not found.");

      setDetails(product as ProductDetails);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load product details."
      );
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        await loadProducts();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load products."
        );
      } finally {
        setLoadingProducts(false);
      }
    }

    void initialize();
  }, [loadProducts]);

  useEffect(() => {
    setError("");
    setMessage("");
    void loadDetails(selectedProductId);
  }, [selectedProductId, loadDetails]);

  async function refresh() {
    setError("");
    try {
      await loadProducts();
      await loadDetails(selectedProductId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not refresh data."
      );
    }
  }

  async function dispatchProduct() {
    if (!selectedProductId) {
      setError("Select a product first.");
      return;
    }

    if (!dispatchedBy.trim()) {
      setError("Enter the name of the person dispatching the product.");
      return;
    }

    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/products/${selectedProductId}/dispatch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dispatchedBy: dispatchedBy.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Dispatch was not permitted."
        );
      }

      setMessage("Product dispatched successfully.");
      await loadProducts();
      await loadDetails(selectedProductId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Dispatch failed."
      );
      await loadDetails(selectedProductId);
    } finally {
      setSubmitting(false);
    }
  }

  const operations = details?.operations ?? [];
  const inspections = details?.inspections ?? [];
  const dispatches = details?.dispatches ?? [];

  const allOperationsComplete =
    operations.length > 0 &&
    operations.every((operation) => operation.status === "COMPLETED");

  const holdsComplete =
    operations.length > 0 &&
    operations.every(
      (operation) =>
        operation.holdUntil !== null &&
        new Date(operation.holdUntil).getTime() <= Date.now()
    );

  const finalPdi = inspections.find(
    (inspection) => inspection.parameter === "Final PDI"
  );

  const finalPdiApproved =
    finalPdi?.status === "PASS" &&
    finalPdi.approval?.status === "APPROVED";

  const alreadyDispatched = dispatches.length > 0;

  const checks = [
    {
      label: "Production operations configured",
      passed: operations.length > 0,
      detail:
        operations.length > 0
          ? `${operations.length} operation(s) found`
          : "No operations configured",
    },
    {
      label: "All operations completed",
      passed: allOperationsComplete,
      detail: allOperationsComplete
        ? "Every operation is completed"
        : "Complete all operations first",
    },
    {
      label: "Required hold periods elapsed",
      passed: holdsComplete,
      detail: holdsComplete
        ? "All operation holds have elapsed"
        : "Wait until all required holds have elapsed",
    },
    {
      label: "Final PDI passed and approved",
      passed: finalPdiApproved,
      detail: finalPdiApproved
        ? "Final PDI is approved"
        : "A passing, approved Final PDI is required",
    },
    {
      label: "Not previously dispatched",
      passed: !alreadyDispatched,
      detail: alreadyDispatched
        ? "This product has already been dispatched"
        : "Product has not been dispatched",
    },
  ];

  const locallyEligible = checks.every((check) => check.passed);

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
            Shipment Control
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Product Dispatch
          </h1>
          <p className="mt-2 text-slate-600">
            Verify quality and production requirements before dispatching a product.
          </p>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label
            htmlFor="product"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Select Product
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              id="product"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Choose a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.serialNumber} — {product.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
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

        {loadingProducts || loadingDetails ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading product information...
          </section>
        ) : !selectedProductId ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Select a product to review its dispatch eligibility.
          </section>
        ) : details ? (
          <>
            <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Dispatch Readiness
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Product: {details.serialNumber} — {details.name}
              </p>

              <div className="mt-5 space-y-3">
                {checks.map((check) => (
                  <div
                    key={check.label}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 p-4"
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        check.passed
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {check.passed ? "✓" : "!"}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {check.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Production Summary
                </h2>
              </div>

              {operations.length === 0 ? (
                <p className="p-6 text-slate-500">
                  No production operations have been added.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Sequence</th>
                        <th className="px-5 py-4 font-semibold">Operation</th>
                        <th className="px-5 py-4 font-semibold">Status</th>
                        <th className="px-5 py-4 font-semibold">Hold Until</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {operations
                        .slice()
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((operation) => (
                          <tr key={operation.id}>
                            <td className="px-5 py-4">{operation.sequence}</td>
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {operation.name}
                            </td>
                            <td className="px-5 py-4">{operation.status}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {operation.holdUntil
                                ? new Date(operation.holdUntil).toLocaleString()
                                : "Not completed"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Quality Inspection Summary
                </h2>
              </div>

              {inspections.length === 0 ? (
                <p className="p-6 text-slate-500">
                  No inspections have been recorded.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Parameter</th>
                        <th className="px-5 py-4 font-semibold">Result</th>
                        <th className="px-5 py-4 font-semibold">Approval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspections.map((inspection) => (
                        <tr key={inspection.id}>
                          <td className="px-5 py-4 font-medium text-slate-900">
                            {inspection.parameter}
                          </td>
                          <td className="px-5 py-4">{inspection.status}</td>
                          <td className="px-5 py-4">
                            {inspection.approval?.status ?? "Awaiting review"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Dispatch Authorization
              </h2>

              {alreadyDispatched ? (
                <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                  This product has already been dispatched by{" "}
                  {dispatches[0].dispatchedBy} on{" "}
                  {new Date(dispatches[0].dispatchedAt).toLocaleString()}.
                </p>
              ) : (
                <>
                  <label
                    htmlFor="dispatchedBy"
                    className="mb-2 mt-4 block text-sm font-medium text-slate-700"
                  >
                    Dispatched By
                  </label>
                  <input
                    id="dispatchedBy"
                    value={dispatchedBy}
                    onChange={(event) => setDispatchedBy(event.target.value)}
                    maxLength={100}
                    required
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => void dispatchProduct()}
                    disabled={submitting || !locallyEligible}
                    className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : "Authorize Dispatch"}
                  </button>

                  {!locallyEligible && (
                    <p className="mt-3 text-sm text-amber-700">
                      Dispatch is unavailable until all readiness checks pass.
                      The backend will also validate every requirement.
                    </p>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Could not load the selected product.
          </section>
        )}
      </div>
    </main>
  );
}
