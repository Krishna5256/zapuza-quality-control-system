
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  serialNumber: string;
  name: string;
  createdAt: string;
  inspections: {
    id: number;
    parameter: string;
    measuredValue: number;
    minValue: number;
    maxValue: number;
    status: "PENDING" | "PASS" | "FAIL";
    approval?: {
      status: "PENDING" | "APPROVED" | "REJECTED";
    } | null;
  }[];
  operations: {
    id: number;
    name: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  }[];
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PASS: "bg-emerald-50 text-emerald-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    FAIL: "bg-red-50 text-red-700",
    REJECTED: "bg-red-50 text-red-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    PENDING: "bg-amber-50 text-amber-700",
    ON_HOLD: "bg-orange-50 text-orange-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load products.");
        }

        const data: Product[] = await response.json();

        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load products. Please refresh the page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const inspections = products.flatMap((product) =>
    product.inspections.map((inspection) => ({
      ...inspection,
      productName: product.name,
      serialNumber: product.serialNumber,
    }))
  );

  const totalProducts = products.length;
  const pendingInspections = inspections.filter(
    (inspection) =>
      inspection.approval?.status === "PENDING" ||
      (!inspection.approval &&
        inspection.status === "PENDING")
  ).length;
  const failedInspections = inspections.filter(
    (inspection) =>
      inspection.status === "FAIL" ||
      inspection.approval?.status === "REJECTED"
  ).length;
  const completedOperations = products.reduce(
    (total, product) =>
      total +
      product.operations.filter(
        (operation) => operation.status === "COMPLETED"
      ).length,
    0
  );
  const totalOperations = products.reduce(
    (total, product) => total + product.operations.length,
    0
  );

  const navigation = [
    { title: "Products", description: "Register and track products", href: "/products", icon: "▦" },
    { title: "Quality Inspections", description: "Record measurements and results", href: "/inspections", icon: "✓" },
    { title: "Supervisor Review", description: "Review inspection decisions", href: "/approvals", icon: "◎" },
    { title: "Production Operations", description: "Track process steps and holds", href: "/operations", icon: "⚙" },
    { title: "Dispatch", description: "Check dispatch eligibility", href: "/dispatch", icon: "↗" },
  ];

  const stats = [
    {
      label: "Total Products",
      value: loading ? "—" : totalProducts,
      detail: "Registered products",
      icon: "▦",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending Review",
      value: loading ? "—" : pendingInspections,
      detail: "Inspections to review",
      icon: "◷",
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Failed / Rejected",
      value: loading ? "—" : failedInspections,
      detail: "Require attention",
      icon: "!",
      color: "bg-red-50 text-red-700",
    },
    {
      label: "Operations Complete",
      value: loading ? "—" : `${completedOperations}/${totalOperations}`,
      detail: "Completed production steps",
      icon: "✓",
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xl font-bold text-white">
              Z
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">Zapuza</span>
              <span className="text-xs text-slate-500">Factory Quality System</span>
            </span>
          </Link>

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-700">
              <span>⌂</span> Dashboard
            </Link>
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                <span className="w-5 text-center">{item.icon}</span>
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-sm font-semibold">Quality first</p>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              Complete inspections and production checks before dispatch.
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-xs font-medium text-slate-500">ZAPUZA / WORKSPACE</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight">Factory Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">Operations overview</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">QS</span>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-7 text-white sm:p-10">
              <div className="max-w-2xl">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                  FACTORY OPERATIONS
                </span>
                <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                  Quality you can track.
                  <br />
                  Production you can trust.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Monitor product inspections, supervisor decisions, production progress, and dispatch readiness from one workspace.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/products" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-950 transition hover:bg-blue-50">
                    View Products →
                  </Link>
                  <Link href="/inspections" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                    Quality Inspections
                  </Link>
                </div>
              </div>
            </section>

            {loadError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {loadError}
              </div>
            )}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold">Production Overview</h2>
                <p className="mt-1 text-sm text-slate-500">Current counts based on registered products and inspection records.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${stat.color}`}>
                        {stat.icon}
                      </span>
                    </div>
                    <p className="mt-5 text-3xl font-bold tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="font-bold">Recent Products</h2>
                    <p className="mt-1 text-xs text-slate-500">Latest registered products</p>
                  </div>
                  <Link href="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">View all →</Link>
                </div>

                {loading ? (
                  <p className="p-8 text-sm text-slate-500">Loading products…</p>
                ) : products.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="font-semibold">No products found</p>
                    <p className="mt-2 text-sm text-slate-500">Register a product to start tracking factory quality.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {products.slice(0, 5).map((product) => {
                      const latestInspection = [...product.inspections].sort((a, b) => b.id - a.id)[0];
                      return (
                        <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-lg">▦</span>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{product.serialNumber}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {latestInspection ? <StatusBadge status={latestInspection.status} /> : <StatusBadge status="PENDING" />}
                            <p className="mt-1 text-xs text-slate-400">{product.operations.length} operations</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-bold">Quick Actions</h2>
                <p className="mt-1 text-sm text-slate-500">Navigate to a workflow</p>
                <div className="mt-5 space-y-3">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg group-hover:bg-blue-100">{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
                      </span>
                      <span className="text-slate-400">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-bold">Recent Inspections</h2>
                <p className="mt-1 text-xs text-slate-500">Latest recorded quality measurements</p>
              </div>

              {loading ? (
                <p className="p-8 text-sm text-slate-500">Loading inspections…</p>
              ) : inspections.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No inspections recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Product</th>
                        <th className="px-5 py-3 font-semibold">Parameter</th>
                        <th className="px-5 py-3 font-semibold">Measurement</th>
                        <th className="px-5 py-3 font-semibold">Result</th>
                        <th className="px-5 py-3 font-semibold">Approval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...inspections].sort((a, b) => b.id - a.id).slice(0, 6).map((inspection) => (
                        <tr key={inspection.id}>
                          <td className="px-5 py-4">
                            <p className="font-semibold">{inspection.productName}</p>
                            <p className="mt-1 text-xs text-slate-500">{inspection.serialNumber}</p>
                          </td>
                          <td className="px-5 py-4">{inspection.parameter}</td>
                          <td className="px-5 py-4">
                            {inspection.measuredValue} <span className="text-xs text-slate-400">({inspection.minValue}–{inspection.maxValue})</span>
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={inspection.status} /></td>
                          <td className="px-5 py-4">
                            {inspection.approval ? <StatusBadge status={inspection.approval.status} /> : <StatusBadge status="PENDING" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500">
              <p>Zapuza Factory Operations & Quality Control System</p>
              <p>Quality • Traceability • Production</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
