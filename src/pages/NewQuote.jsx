import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RoomEditor from "../components/RoomEditor";
import InvoicePreview from "../components/InvoicePreview";
import ExtrasEditor from "../components/ExtrasEditor";
import ClientSection from "../components/ClientSection";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import ROOM_CONFIG from "../json/roomConfig";
import PricingSection from "../components/PricingSection";

const DRAFT_KEY = "invoice_draft";

// Get default dimensions for items
function getItemDefaults(roomName, itemName) {
  const globalDefaults = ROOM_CONFIG.defaultDimensions || {
    height: 8.5,
    width: 1,
    depth: 1,
  };

  const room = ROOM_CONFIG.rooms?.find((r) => r.name === roomName);
  if (!room)
    return {
      frame: { ...globalDefaults },
      box: { ...globalDefaults },
    };

  const item = room.items?.find((i) => i.name === itemName) || {};
  return {
    frame: {
      height: item.defaultFrame?.height ?? globalDefaults.height,
      width: item.defaultFrame?.width ?? globalDefaults.width,
    },
    box: {
      height: item.defaultBox?.height ?? globalDefaults.height,
      width: item.defaultBox?.width ?? globalDefaults.width,
      depth: item.defaultBox?.depth ?? globalDefaults.depth,
    },
  };
}

export default function NewQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Refs
  const prevIdRef = useRef(id);
  const isEditingRef = useRef(!!id);
  const isLoadingDraftRef = useRef(false);
  const draftRestoredRef = useRef(false);
  const userEditedGlobalRateRef = useRef(false);

  // State
  const [client, setClient] = useState({
    name: "",
    mobile: "",
    email: "",
    siteAddress: "",
    siteMapLink: "",
  });

  const [globalFrameRate, setGlobalFrameRate] = useState(0);
  const [globalBoxRate, setGlobalBoxRate] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [extrasState, setExtrasState] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  /* ==================
        AUTH REDIRECT
  ==================== */
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  /* ==================
        LOAD DRAFT
  ==================== */
  useEffect(() => {
    if (!id && !draftLoaded && user) {
      isLoadingDraftRef.current = true;
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const d = JSON.parse(saved);
          setClient(d.client || {});
          const savedFrameRate = d.globalFrameRate || 0;
          const savedBoxRate =
            typeof d.globalBoxRate === "number"
              ? d.globalBoxRate
              : savedFrameRate * 1.4;

          setGlobalFrameRate(savedFrameRate);
          setGlobalBoxRate(savedBoxRate);

          setRooms(d.rooms || []);
          setUseCurrentLocation(d.useCurrentLocation || false);
          setExtrasState(Array.isArray(d.extrasState) ? d.extrasState : []);
          draftRestoredRef.current = true;
        }
      } catch (e) {
        console.error("Draft Error:", e);
      }
      setDraftLoaded(true);
      setTimeout(() => (isLoadingDraftRef.current = false), 120);
    }
  }, [id, draftLoaded, user]);

  /* ==============================
        RESET WHEN SWITCHING MODE
  =============================== */
  useEffect(() => {
    if (isEditingRef.current && !id && prevIdRef.current && !id) {
      setClient({
        name: "",
        mobile: "",
        email: "",
        siteAddress: "",
        siteMapLink: "",
      });
      setGlobalFrameRate(0);
      setGlobalBoxRate(0);
      setRooms([]);
      setExtrasState([]);
      setUseCurrentLocation(false);
      setDraftLoaded(false);
      userEditedGlobalRateRef.current = false;
    }
    prevIdRef.current = id;
    isEditingRef.current = !!id;
  }, [id]);

  /* ============================
        LOAD EXISTING INVOICE
  ============================= */
  useEffect(() => {
    if (!id || !user) return;

    if (!user.isAdmin) {
      alert("Only admin can edit invoices.");
      navigate("/history");
      return;
    }

    async function fetchInvoice() {
      try {
        setIsLoading(true);
        const res = await api.get(`/invoices/${id}`);
        const invoice = res.data;

        setClient(invoice.client);

        const invoiceFrameRate = invoice.pricing.frameRate || 0;
        const invoiceBoxRate =
          typeof invoice.pricing.boxRate === "number"
            ? invoice.pricing.boxRate
            : invoiceFrameRate * 1.4;

        setGlobalFrameRate(invoiceFrameRate);
        setGlobalBoxRate(invoiceBoxRate);
        userEditedGlobalRateRef.current = false;

        setRooms(
          invoice.rooms.map((r) => ({
            name: r.name,
            description: r.description,
            frameRate: r.frameRate,
            boxRate:
              typeof r.boxRate === "number"
                ? r.boxRate
                : invoiceBoxRate ?? invoiceFrameRate * 1.4,
            isCustomRate: r.frameRate !== invoice.pricing.frameRate,
            items: r.items.map((i) => ({
              name: i.name,
              frame: { ...i.frame },
              box: { ...i.box },
              totalPrice: i.totalPrice,
            })),
            accessories: r.accessories || [],
          }))
        );

        setExtrasState(
          invoice.extras.map((ex, i) => ({
            id: ex._id?.toString() || `${i}-${Date.now()}`,
            key: ex.key,
            label: ex.label,
            type: ex.type,
            inputs: ex.inputs,
            total: Number(ex.total),
          }))
        );

        setUseCurrentLocation(!!invoice.client.siteMapLink);
      } catch (e) {
        console.error("Load Invoice Error:", e);
        alert("Failed to load invoice");
        navigate("/history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoice();
  }, [id, user, navigate]);

  /* ================================
        AUTO SAVE DRAFT (NEW ONLY)
  ================================= */
  useEffect(() => {
    if (id || isLoadingDraftRef.current) return;

    const t = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          client,
          globalFrameRate,
          globalBoxRate,
          rooms,
          extrasState,
          useCurrentLocation,
          timestamp: Date.now(),
        })
      );
    }, 900);

    return () => clearTimeout(t);
  }, [
    client,
    globalFrameRate,
    globalBoxRate,
    rooms,
    extrasState,
    useCurrentLocation,
    id,
  ]);

  /* ======================================================
        GLOBAL RATES CHANGE → OVERWRITE ROOM RATES
  ======================================================= */
  useEffect(() => {
    // Skip once after draft restore
    if (draftRestoredRef.current) {
      draftRestoredRef.current = false;
      return;
    }

    // Skip initial load on edit mode (until user changes)
    if (id && !userEditedGlobalRateRef.current) return;

    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        frameRate: globalFrameRate,
        boxRate: globalBoxRate,
      }))
    );
  }, [globalFrameRate, globalBoxRate, id]);

  /* ====================
        ROOM HANDLERS
  ===================== */
  const addRoom = () =>
    setRooms((p) => [
      ...p,
      {
        name: "",
        description: "",
        frameRate: globalFrameRate,
        boxRate: globalBoxRate || globalFrameRate * 1.4,
        isCustomRate: false,
        items: [],
        accessories: [],
      },
    ]);

  const removeRoom = (i) => setRooms((p) => p.filter((_, x) => x !== i));
  const updateRoom = (i, updated) =>
    setRooms((p) => {
      const copy = [...p];
      copy[i] = updated;
      return copy;
    });

  /* ====================
        TOTALS FUNCTION
  ===================== */
  const computeGrandTotal = () => {
    const roomsTotal = rooms.reduce((sum, r) => {
      const items = (r.items || []).reduce(
        (s, i) => s + (i.totalPrice || 0),
        0
      );
      const acc = (r.accessories || []).reduce(
        (s, a) => s + Number(a.price || 0) * Number(a.qty || 0),
        0
      );
      return sum + items + acc;
    }, 0);

    const extrasTotal = extrasState.reduce(
      (s, e) => s + Number(e.total || 0),
      0
    );

    return roomsTotal + extrasTotal;
  };

  /* ====================
        SAVE INVOICE
  ===================== */
  const buildPayload = () => ({
    client,
    pricing: {
      frameRate: globalFrameRate,
      boxRate: globalBoxRate,
    },
    rooms,
    extras: extrasState.map((e) => ({
      key: e.key,
      label: e.label,
      type: e.type,
      inputs: e.inputs,
      total: e.total,
    })),
    grandTotal: computeGrandTotal(),
    createdBy: user.username,
    role: user.isAdmin ? "admin" : "Engineer",
  });

  const handleSaveInvoice = async () => {
    if (!client.siteAddress.trim()) {
      alert("Site address is required to save the invoice.");
      return;
    }

    try {
      setIsLoading(true);
      setSaveStatus({ type: "loading", message: "Saving invoice..." });

      if (id) {
        await api.put(`/invoices/${id}`, buildPayload());
        setSaveStatus({
          type: "success",
          message: "Invoice updated successfully!",
        });
        setTimeout(() => {
          navigate("/history");
        }, 1500);
      } else {
        await api.post("/invoices", buildPayload());
        setSaveStatus({
          type: "success",
          message: "Invoice created successfully!",
        });
        localStorage.removeItem(DRAFT_KEY);
        setTimeout(() => {
          navigate("/history");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus({
        type: "error",
        message: "Failed to save invoice. Please try again.",
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     SAVE AS NEW INVOICE (POST)
  ========================= */
  const handleSaveAsNewInvoice = async () => {
    if (!client.siteAddress.trim()) {
      alert("Site address is required to save the invoice.");
      return;
    }

    try {
      setIsLoading(true);
      setSaveStatus({ type: "loading", message: "Saving as new invoice..." });

      await api.post("/invoices", buildPayload());

      setSaveStatus({
        type: "success",
        message: "Invoice saved as new successfully!",
      });
      setTimeout(() => {
        navigate("/history");
      }, 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus({
        type: "error",
        message: "Failed to save invoice. Please try again.",
      });
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
        CLEAR DRAFT HANDLER
  ========================= */
  const handleClearDraft = () => {
    if (
      !confirm(
        "Are you sure you want to clear the current draft? This action cannot be undone."
      )
    )
      return;

    setClient({
      name: "",
      mobile: "",
      email: "",
      siteAddress: "",
      siteMapLink: "",
    });
    setGlobalFrameRate(0);
    setGlobalBoxRate(0);
    setRooms([]);
    setExtrasState([]);
    setUseCurrentLocation(false);
    localStorage.removeItem(DRAFT_KEY);
    userEditedGlobalRateRef.current = false;
    setSaveStatus({ type: "info", message: "Draft cleared successfully." });
    setTimeout(() => setSaveStatus(null), 2000);
  };

  /* =========================
          UI RENDER
  ========================= */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {id ? "Loading Invoice..." : "Loading Quote Builder..."}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {id ? "Fetching invoice details..." : "Preparing your workspace..."}
          </p>
        </div>
      </div>
    );
  }

  const grandTotal = computeGrandTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {id
                    ? `Edit Invoice #${id.substring(0, 8)}...`
                    : "Create New Quote"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {extrasState.length} extra
                    {extrasState.length !== 1 ? "s" : ""}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      id
                        ? "bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700 dark:text-amber-300"
                        : "bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-300"
                    }`}
                  >
                    {id ? "Edit Mode" : "New Quote"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Total Estimate
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ₹{grandTotal.toLocaleString()}
                </div>
              </div>
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

      {/* Status Messages */}
      {saveStatus && (
        <div className={`fixed top-20 right-4 z-50 max-w-sm animate-fade-in`}>
          <div
            className={`rounded-xl p-4 shadow-lg border ${
              saveStatus.type === "success"
                ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200 dark:border-green-800/30"
                : saveStatus.type === "error"
                ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200 dark:border-red-800/30"
                : saveStatus.type === "loading"
                ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30"
                : "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {saveStatus.type === "loading" ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : saveStatus.type === "success" ? (
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
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
              ) : saveStatus.type === "error" ? (
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
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
              ) : (
                <svg
                  className="w-5 h-5 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <p
                className={`font-medium ${
                  saveStatus.type === "success"
                    ? "text-green-700 dark:text-green-300"
                    : saveStatus.type === "error"
                    ? "text-red-700 dark:text-red-300"
                    : saveStatus.type === "loading"
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                {saveStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 py-3 space-y-6">
        {/* CLIENT SECTION */}
        <ClientSection
          client={client}
          setClient={setClient}
          useCurrentLocation={useCurrentLocation}
          setUseCurrentLocation={setUseCurrentLocation}
          onClearDraft={handleClearDraft}
          canClearDraft={!id}
        />

        {/* PRICING SECTION */}
        <PricingSection
          globalFrameRate={globalFrameRate}
          globalBoxRate={globalBoxRate}
          onChangeFrameRate={(value) => {
            userEditedGlobalRateRef.current = true;
            setGlobalFrameRate(value);
            setGlobalBoxRate(value * 1.4);
          }}
          onChangeBoxRate={(value) => {
            userEditedGlobalRateRef.current = true;
            setGlobalBoxRate(value);
          }}
        />

        {/* ROOMS SECTION */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Rooms & Items
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add and configure rooms with their respective items
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                </div>
                <button
                  onClick={addRoom}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
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
                  Add Room
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <RoomEditor
                    room={room}
                    getItemDefaults={getItemDefaults}
                    onChange={(updated) => updateRoom(index, updated)}
                    onRemoveRoom={() => removeRoom(index)}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No rooms added yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Start by adding your first room to begin your quote
                </p>
                <button
                  onClick={addRoom}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
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
                  Add First Room
                </button>
              </div>
            )}
          </div>
        </div>

        {/* EXTRAS SECTION */}
        <ExtrasEditor extras={extrasState} setExtras={setExtrasState} />

        {/* PREVIEW SECTION */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Invoice Preview
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Review your quote before finalizing
            </p>
          </div>
          <div className="p-6">
            <InvoicePreview
              client={client}
              rooms={rooms}
              frameworkRate={globalFrameRate}
              boxRate={globalBoxRate}
              useCurrentLocation={useCurrentLocation}
              extras={extrasState}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white">
                {id ? "Update Invoice" : "Save Quote"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {id
                  ? "Update the invoice or save it as a new quote"
                  : "Save this quote as an invoice"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {id ? (
                <>
                  <button
                    onClick={handleSaveInvoice}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    Update Invoice
                  </button>

                  <button
                    onClick={handleSaveAsNewInvoice}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    Save As New Invoice
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSaveInvoice}
                  disabled={isLoading || !client.siteAddress.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
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
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                  )}
                  Save Invoice
                </button>
              )}

              <button
                onClick={() => navigate("/history")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-700 dark:to-gray-600 hover:from-gray-900 hover:to-gray-800 dark:hover:from-gray-600 dark:hover:to-gray-500 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
