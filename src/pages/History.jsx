// src/pages/History.jsx
import { useEffect, useState, useContext, useRef } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../utils/calculations";
import { useReactToPrint } from "react-to-print";
import AdminInvoice from "../components/AdminInvoice";
import ClientInvoice from "../components/ClientInvoice";

export default function History() {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // For download-as-PDF
  const [downloadInvoice, setDownloadInvoice] = useState(null);
  const [downloadType, setDownloadType] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const navigate = useNavigate();
  const printRef = useRef(null);

  // react-to-print v3: use contentRef
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: downloadInvoice?.client?.name
      ? `Invoice - ${downloadInvoice.client.name}`
      : "Invoice",
    onAfterPrint: () => {
      setDownloadInvoice(null);
      setDownloadType(null);
      setIsDownloading(false);
    },
    onPrintError: () => {
      alert("Failed to generate PDF. Please try again.");
      setIsDownloading(false);
    },
  });

  // Fetch all invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await api.get("/invoices");
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setInvoices(data);
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const matchesSearch = inv.client?.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    if (selectedFilter === "recent") {
      const invoiceDate = new Date(inv.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && invoiceDate > thirtyDaysAgo;
    }

    if (selectedFilter === "high-value") {
      return matchesSearch && inv.grandTotal > 50000;
    }

    if (selectedFilter === "admin-only") {
      return matchesSearch && user?.isAdmin;
    }

    return matchesSearch;
  });

  // Sort invoices by date (newest first)
  const sortedInvoices = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Delete invoice (admin only)
  const handleDelete = async (id) => {
    if (!user?.isAdmin) return alert("Access denied!");

    const invoice = invoices.find((inv) => inv._id === id);
    const clientName = invoice?.client?.name || "this invoice";

    if (
      !confirm(
        `Are you sure you want to delete the invoice for ${clientName}? This action cannot be undone.`
      )
    )
      return;

    try {
      await api.delete(`/invoices/${id}`);
      setInvoices((prev) => prev.filter((inv) => inv._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete invoice.");
    }
  };

  // Edit invoice (admin only)
  const handleEdit = (id) => {
    if (!user?.isAdmin) return alert("Access denied!");
    navigate(`/new-quote/${id}`);
  };

  // Download as PDF: fetch full invoice then trigger print
  const handleDownload = async (id, type) => {
    try {
      setIsDownloading(true);
      const res = await api.get(`/invoices/${id}`);
      setDownloadInvoice(res.data);
      setDownloadType(type);
    } catch (err) {
      console.error("Failed to fetch invoice for download:", err);
      alert("Failed to fetch invoice for download.");
      setIsDownloading(false);
    }
  };

  // When downloadInvoice + downloadType are ready, trigger react-to-print
  useEffect(() => {
    if (downloadInvoice && downloadType) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        handlePrint();
      }, 100);
    }
  }, [downloadInvoice, downloadType, handlePrint]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                Invoice History
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View, manage, and download all your invoices
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
                  placeholder="Search by client name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by
                </label>
                <select
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                >
                  <option value="all">All Invoices</option>
                  <option value="recent">Last 30 Days</option>
                  <option value="high-value">High Value (&gt; ₹50k)</option>
                  {user?.isAdmin && (
                    <option value="admin-only">Admin Only</option>
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => navigate("/new-quote")}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create New Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Loading Invoices
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching your invoice history...
            </p>
          </div>
        ) : (
          <>
            {/* Invoices Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              {sortedInvoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                          Client
                        </th>
                        <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                          Date
                        </th>
                        <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                          Total Amount
                        </th>
                        <th className="text-left p-4 font-medium text-gray-700 dark:text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInvoices.map((inv) => (
                        <tr
                          key={inv._id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 flex items-center justify-center">
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {inv.client?.name?.charAt(0)?.toUpperCase() ||
                                    "C"}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {inv.client?.name || "Unnamed Client"}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {inv.client?.email || "No email"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-gray-800 dark:text-gray-200">
                              {inv.createdAt
                                ? new Date(inv.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )
                                : "-"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {inv.createdAt
                                ? new Date(inv.createdAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : ""}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {formatINR(
                                inv.grandTotal != null ? inv.grandTotal : "0.00"
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {/* Preview Buttons */}
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 text-sm font-medium"
                                onClick={() =>
                                  navigate(`/invoices/client/${inv._id}`)
                                }
                                title="Client Preview"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                Client
                              </button>

                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 text-sm font-medium"
                                onClick={() =>
                                  navigate(`/invoices/admin/${inv._id}`)
                                }
                                title="Admin Preview"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                Admin
                              </button>

                              {/* Download Buttons */}
                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-800/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all duration-200 text-sm font-medium"
                                onClick={() =>
                                  handleDownload(inv._id, "client")
                                }
                                disabled={isDownloading}
                                title="Download Client PDF"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                Client PDF
                              </button>

                              <button
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 text-sm font-medium"
                                onClick={() => handleDownload(inv._id, "admin")}
                                disabled={isDownloading}
                                title="Download Admin PDF"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Admin PDF
                              </button>

                              {/* Admin-only actions */}
                              {user?.isAdmin && (
                                <>
                                  <button
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-200 text-sm font-medium"
                                    onClick={() => handleEdit(inv._id)}
                                    title="Edit Invoice"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                      />
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 text-sm font-medium"
                                    onClick={() => handleDelete(inv._id)}
                                    title="Delete Invoice"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No invoices found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {search
                      ? "Try a different search term"
                      : "Get started by creating your first invoice"}
                  </p>
                  <button
                    onClick={() => navigate("/new-quote")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Create New Invoice
                  </button>
                </div>
              )}
            </div>

            {/* Downloading Overlay */}
            {isDownloading && (
              <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                      Preparing PDF
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Your invoice is being generated. This will only take a
                      moment...
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Hidden printable invoice (for react-to-print PDF) */}
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={printRef}>
            {downloadInvoice && downloadType === "client" && (
              <ClientInvoice invoice={downloadInvoice} />
            )}
            {downloadInvoice && downloadType === "admin" && (
              <AdminInvoice invoice={downloadInvoice} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
