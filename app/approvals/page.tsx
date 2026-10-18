
"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  serialNumber: string;
  name: string;
};

type Approval = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewer?: string | null;
  reason?: string | null;
  reviewedAt?: string | null;
};

type Inspection = {
  id: number;
  productId: number;
  parameter: string;
  measuredValue: number;
  minValue: number;
  maxValue: number;
  status: "PENDING" | "PASS" | "FAIL";
  createdAt: string;
  product?: Product;
  approval?: Approval | null;
};

export default function ApprovalsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [reviewer, setReviewer] = useState("Quality Supervisor");
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadInspections() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/inspections");

      if (!response.ok) {
        throw new Error("Could not load inspection records.");
      }

      const data = await response.json();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInspections();
  }, []);

  async function reviewInspection(
    inspection: Inspection,
    status: "APPROVED" | "REJECTED"
  ) {
    setError("");
    setMessage("");

    if (!reviewer.trim()) {
      setError("Enter the supervisor's name.");
      return;
    }

    const reason = reasons[inspection.id]?.trim() ?? "";

    if (status === "REJECTED" && !reason) {
      setError("Enter a reason before rejecting the inspection.");
      return;
    }

    setBusyId(inspection.id);

    try {
      const response = await fetch(
        `/api/inspections/${inspection.id}/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            reviewer: reviewer.trim(),
            ...(status === "REJECTED" ? { reason } : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not save the decision."
        );
      }

      setMessage(
        `Inspection #${inspection.id} was ${status.toLowerCase()} successfully.`
      );

      await loadInspections();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setBusyId(null);
    }
  }

  const pending = inspections.filter((item) => !item.approval);
  const approved = inspections.filter(
    (item) => item.approval?.status === "APPROVED"
  );
  const rejected = inspections.filter(
    (item) => item.approval?.status === "REJECTED"
  );

  function badgeStyle(status: string) {
    if (status === "APPROVED" || status === "PASS") {
      return "bg-green-100 text-green-800";
    }

    if (status === "REJECTED" || status === "FAIL") {
      return "bg-red-100 text-red-800";
    }

    return "bg-amber-100 text-amber-800";
  }

  function productLabel(inspection: Inspection) {
    return (
      inspection.product?.serialNumber ??
      `Product #${inspection.productId}`
    );
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
            Inspection Approvals
          </h1>
          <p className="mt-2 text-slate-600">
            Review inspection measurements and record supervisor decisions.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Awaiting Review</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pending.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {approved.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {rejected.length}
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Supervisor Details
          </h2>
          <label
            htmlFor="reviewer"
            className="mb-2 mt-4 block text-sm font-medium text-slate-700"
          >
            Reviewer Name
          </label>
          <input
            id="reviewer"
            value={reviewer}
            onChange={(event) => setReviewer(event.target.value)}
            maxLength={100}
            required
            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
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

        <section className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Pending Inspection Reviews
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Approve or reject each inspection that has not been reviewed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadInspections()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading inspections...</p>
          ) : pending.length === 0 ? (
            <p className="p-6 text-slate-500">
              No inspections are awaiting review.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {pending.map((inspection) => (
                <div key={inspection.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {productLabel(inspection)} — {inspection.parameter}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Inspection #{inspection.id} ·{" "}
                        {new Date(inspection.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(inspection.status)}`}
                    >
                      {inspection.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Measured Value</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {inspection.measuredValue}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Permitted Range</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {inspection.minValue} – {inspection.maxValue}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Inspection Result</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {inspection.status}
                      </p>
                    </div>
                  </div>

                  {inspection.status === "FAIL" && (
                    <p className="mt-3 text-sm font-medium text-red-700">
                      Warning: this measurement is outside the permitted range.
                    </p>
                  )}

                  <div className="mt-5">
                    <label
                      htmlFor={`reason-${inspection.id}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Rejection Reason (required only when rejecting)
                    </label>
                    <textarea
                      id={`reason-${inspection.id}`}
                      value={reasons[inspection.id] ?? ""}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [inspection.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      maxLength={500}
                      placeholder="Explain why this inspection is rejected"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() =>
                        void reviewInspection(inspection, "APPROVED")
                      }
                      className="rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {busyId === inspection.id ? "Saving..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() =>
                        void reviewInspection(inspection, "REJECTED")
                      }
                      className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {busyId === inspection.id ? "Saving..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Review History
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading review history...</p>
          ) : approved.length + rejected.length === 0 ? (
            <p className="p-6 text-slate-500">
              No decisions have been recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Parameter</th>
                    <th className="px-5 py-4 font-semibold">Result</th>
                    <th className="px-5 py-4 font-semibold">Decision</th>
                    <th className="px-5 py-4 font-semibold">Reviewer</th>
                    <th className="px-5 py-4 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspections
                    .filter((item) => item.approval)
                    .map((inspection) => (
                      <tr key={inspection.id}>
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                          {productLabel(inspection)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {inspection.parameter}
                        </td>
                        <td className="px-5 py-4">{inspection.status}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle(inspection.approval!.status)}`}
                          >
                            {inspection.approval!.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {inspection.approval!.reviewer || "—"}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {inspection.approval!.reason || "—"}
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
