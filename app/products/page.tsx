
"use client";

import { useEffect, useState, type FormEvent } from "react";

type Product = {
  id: number;
  serialNumber: string;
  name: string;
  createdAt: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [serialNumber, setSerialNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Could not load products.");

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: serialNumber.trim(),
          name: name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not create product."
        );
      }

      setSerialNumber("");
      setName("");
      setSuccess("Product registered successfully.");
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

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
            Factory Management
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Product Management
          </h1>
          <p className="mt-2 text-slate-600">
            Register manufactured products and track their serial numbers.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Products</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {products.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Latest Registration</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {products[0]?.serialNumber || "No products yet"}
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Register New Product
          </h2>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="serialNumber"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Serial Number
              </label>
              <input
                id="serialNumber"
                value={serialNumber}
                onChange={(event) => setSerialNumber(event.target.value)}
                placeholder="e.g. PRD-002"
                required
                maxLength={100}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="productName"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Product Name
              </label>
              <input
                id="productName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Steel Component"
                required
                maxLength={150}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Registering..." : "Register Product"}
              </button>
            </div>
          </form>

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
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Registered Products
            </h2>
            <button
              onClick={() => void loadProducts()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-slate-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-slate-500">
              No products registered yet. Use the form above to add one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Serial Number</th>
                    <th className="px-6 py-4 font-semibold">Product Name</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold">Product ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                        {product.serialNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {product.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        #{product.id}
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
