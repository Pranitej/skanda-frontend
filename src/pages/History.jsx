import { useEffect, useState, useContext, useRef } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../utils/calculations";
import AdminInvoice from "../components/AdminInvoice";
import ClientInvoice from "../components/ClientInvoice";
import { useReactToPrint } from "react-to-print";

export default function History() {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [printInvoice, setPrintInvoice] = useState(null);
  const [printType, setPrintType] = useState("admin");
  const printRef = useRef(null);

  const navigate = useNavigate();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Skanda Invoice",
  });

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

  const triggerPrint = async (id, type) => {
    const invoice = (await api.get(`/invoices/${id}`)).data;
    setPrintType(type);
    setPrintInvoice(invoice);
    setTimeout(() => handlePrint(), 100);
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
                      onClick={() => triggerPrint(inv._id, "admin")}
                      className="text-indigo-600"
                    >
                      Print Admin
                    </button>

                    <button
                      onClick={() => triggerPrint(inv._id, "client")}
                      className="text-teal-600"
                    >
                      Print Client
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

      {/* Hidden Print Mount */}
      <div className="hidden print:block">
        <div id="print-root">
          <div ref={printRef} className="print-page">
            {printInvoice &&
              (printType === "admin" ? (
                <AdminInvoice invoice={printInvoice} />
              ) : (
                <ClientInvoice invoice={printInvoice} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
