import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import AdminInvoice from "../components/AdminInvoice";
import { AuthContext } from "../context/AuthContext";

export default function AdminInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Restrict this route to admin only
    if (!user?.isAdmin) {
      setError("Admin access required");
      setTimeout(() => navigate("/history"), 1500);
      return;
    }

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        setError(
          err.response?.data?.message || "Failed to load invoice details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id, navigate, user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-300 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <svg
                className="w-8 h-8 text-blue-500 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Loading Invoice
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fetching invoice details from the server...
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Invoice ID: <span className="font-mono font-medium">{id}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-500 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              {error || "Invoice Not Found"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error === "Admin access required"
                ? "You need administrator privileges to access this page."
                : "The invoice you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/history")}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to History
              </button>
              {error === "Admin access required" ? null : (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state - Invoice loaded
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Admin Invoice Preview
                </span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Invoice ID:{" "}
                  <span className="font-mono font-medium text-gray-800 dark:text-gray-300">
                    {id}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Created:{" "}
                  <span className="font-medium text-gray-800 dark:text-gray-300">
                    {new Date(
                      invoice.createdAt || Date.now()
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="px-2.5 py-1 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                  Admin View
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-300 font-medium"
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
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Print
              </button>
              <button
                onClick={() => navigate("/history")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-700 dark:to-gray-600 hover:from-gray-900 hover:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-500 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Invoice Status Card */}
        <div className="mb-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Invoice Loaded Successfully
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review the invoice details below. This is an administrative
                  preview.
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Total Amount
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ₹{invoice.totalAmount?.toLocaleString() || "0"}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Component Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          <AdminInvoice invoice={invoice} />
        </div>

        {/* Footer Actions */}
        <div className="mt-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-white">
                Admin Actions:
              </span>{" "}
              You can print, export, or manage this invoice
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/edit/${id}`)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all duration-300 font-medium"
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
                Edit Invoice
              </button>
              <button
                onClick={() => navigate("/history")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-700 dark:to-gray-600 hover:from-gray-900 hover:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-500 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                View All Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
