import { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../utils/calculations";
import { renderToStaticMarkup } from "react-dom/server";
import AdminInvoice from "../components/AdminInvoice";
import ClientInvoice from "../components/ClientInvoice";
import { exportHtmlToPdf } from "../utils/exportHtmlPdf";

export default function History() {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await api.get("/invoices");
      setInvoices(Array.isArray(res.data) ? res.data : res.data?.data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = invoices.filter((inv) => {
    const m = inv.client?.name?.toLowerCase().includes(search.toLowerCase());
    if (selectedFilter === "recent") {
      const d = new Date(inv.createdAt);
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      return m && d > limit;
    }
    if (selectedFilter === "high-value") return m && inv.grandTotal > 50000;
    if (selectedFilter === "admin-only") return m && user?.isAdmin;
    return m;
  });

  const sortedInvoices = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleDownload = async (id, type) => {
    try {
      setIsDownloading(true);

      const invoice = (await api.get(`/invoices/${id}`)).data;
      const Component = type === "admin" ? AdminInvoice : ClientInvoice;

      const html = `<!DOCTYPE html>
       <html>
       <head>
         <meta charset="utf-8"/>
         <script src="https://cdn.tailwindcss.com"></script>
       </head>
       <body>${renderToStaticMarkup(<Component invoice={invoice} />)}</body>
       </html>`;

      exportHtmlToPdf(html, `Skanda-${type}-Invoice-${id.slice(-6)}.pdf`);

      // alert(type);

      // const res = await api.post(
      //   "/pdf/render",
      //   { html },
      //   { responseType: "blob" }
      // );

      // const blob = new Blob([res.data], { type: "application/pdf" });
      // const url = window.URL.createObjectURL(blob);

      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `Skanda-${type}-Invoice-${id.slice(-6)}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // a.remove();
      // URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user?.isAdmin) return alert("Access denied");
    if (!confirm("Delete this invoice permanently?")) return;
    await api.delete(`/invoices/${id}`);
    setInvoices((p) => p.filter((i) => i._id !== id));
  };

  const handleEdit = (id) => user?.isAdmin && navigate(`/new-quote/${id}`);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-2xl font-bold">Invoice History</h1>
        <button
          onClick={() => navigate("/new-quote")}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          New Invoice
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input
          className="border p-2 rounded"
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="recent">Last 30 days</option>
          <option value="high-value">High value</option>
          {user?.isAdmin && <option value="admin-only">Admin only</option>}
        </select>
      </div>

      {loading ? (
        <p className="text-center py-10">Loading...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Date</th>
                <th className="p-3">Total</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv) => (
                <tr key={inv._id} className="border-t">
                  <td className="p-3">{inv.client?.name}</td>
                  <td className="p-3">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-bold text-green-600">
                    {formatINR(inv.grandTotal)}
                  </td>
                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => navigate(`/invoices/client/${inv._id}`)}
                      className="text-blue-600"
                    >
                      Client
                    </button>
                    <button
                      onClick={() => navigate(`/invoices/admin/${inv._id}`)}
                      className="text-green-600"
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => handleDownload(inv._id, "client")}
                      className="text-indigo-600"
                    >
                      Client PDF
                    </button>
                    <button
                      onClick={() => handleDownload(inv._id, "admin")}
                      className="text-purple-600"
                    >
                      Admin PDF
                    </button>
                    {user?.isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(inv._id)}
                          className="text-amber-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="text-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDownloading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow text-center">
            <p className="font-bold mb-2">Generating PDF…</p>
            <p>Please wait</p>
          </div>
        </div>
      )}
    </div>
  );
}
