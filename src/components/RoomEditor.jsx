// RoomEditor.jsx — diversified (Frame + Box) implementation
import { useEffect, useCallback } from "react";
import ROOM_CONFIG_JSON from "../json/roomConfig.json";
import { formatINR } from "../utils/calculations";

// Rooms config and sensible defaults
const ROOM_CONFIG = ROOM_CONFIG_JSON.rooms || [];
const GLOBAL_DEFAULT = ROOM_CONFIG_JSON.defaultDimensions || {
  height: 9,
  width: 1,
  depth: 1,
};

// -----------------------------------------
// NORMALIZATION
// -----------------------------------------
function normalizeToStructured(item = {}) {
  if (item.frame && item.box) {
    return {
      name: item.name || "",
      frame: {
        height: Number(item.frame.height || 0),
        width: Number(item.frame.width || 0),
        area: Number(item.frame.area || 0),
        price: Number(item.frame.price || 0),
      },
      box: {
        height: Number(item.box.height || 0),
        width: Number(item.box.width || 0),
        depth: Number(item.box.depth ?? GLOBAL_DEFAULT.depth),
        area: Number(item.box.area || 0),
        price: Number(item.box.price || 0),
      },
      totalPrice: Number(item.totalPrice || 0),
    };
  }

  // old structure fallback
  const h = Number(item.height ?? GLOBAL_DEFAULT.height);
  const w = Number(item.width ?? GLOBAL_DEFAULT.width);
  const d = Number(item.depth ?? GLOBAL_DEFAULT.depth);
  const workType = item.workType || "frame";

  if (workType === "frame") {
    const area = h * w;
    return {
      name: item.name || "",
      frame: { height: h, width: w, area, price: 0 },
      box: { height: 0, width: 0, depth: 0, area: 0, price: 0 },
      totalPrice: 0,
    };
  }

  const boxArea = h * w * d;
  return {
    name: item.name || "",
    frame: { height: 0, width: 0, area: 0, price: 0 },
    box: { height: h, width: w, depth: d, area: boxArea, price: 0 },
    totalPrice: 0,
  };
}

// -----------------------------------------
// CALCULATOR
// -----------------------------------------
function calcDiversified(item = {}, frameRate = 0, boxRateInput) {
  const fr = Number(frameRate) || 0;
  const br =
    typeof boxRateInput === "number" && !Number.isNaN(boxRateInput)
      ? boxRateInput
      : fr * 1.4;

  const fh = Number(item.frame?.height || 0);
  const fw = Number(item.frame?.width || 0);
  const bh = Number(item.box?.height || 0);
  const bw = Number(item.box?.width || 0);
  const bd = Number(item.box?.depth || 0);

  const frameArea = fh * fw;
  const boxArea = bh * bw * bd;

  const framePrice = frameArea * fr;
  const boxPrice = boxArea * br;

  return {
    name: item.name || "",
    frame: {
      height: fh,
      width: fw,
      area: frameArea,
      price: framePrice,
    },
    box: {
      height: bh,
      width: bw,
      depth: bd,
      area: boxArea,
      price: boxPrice,
    },
    totalPrice: framePrice + boxPrice,
  };
}

// -----------------------------------------
// COMPONENT START
// -----------------------------------------
export default function RoomEditor({
  room,
  onChange = () => {},
  onRemoveRoom,
}) {
  // normalize
  const safeRoom = {
    name: room.name || "",
    description: room.description || "",
    frameRate: Number(room.frameRate || 0),
    boxRate:
      typeof room.boxRate === "number"
        ? Number(room.boxRate)
        : Number(room.frameRate || 0) * 1.4,
    items: (room.items || []).map(normalizeToStructured),
    accessories: room.accessories || [],
  };

  const roomConfig = ROOM_CONFIG.find((r) => r.name === safeRoom.name) ||
    ROOM_CONFIG.find((r) => r.name === "Other") || {
      items: [],
      descriptions: [],
      accessories: [],
    };

  // -----------------------------------------
  // RECALCULATE ITEMS WHEN rate or items change
  // -----------------------------------------
  useEffect(() => {
    const recalculated = safeRoom.items.map((it) =>
      calcDiversified(it, safeRoom.frameRate, safeRoom.boxRate)
    );

    if (JSON.stringify(recalculated) !== JSON.stringify(room.items)) {
      onChange({ ...safeRoom, items: recalculated });
    }
  }, [safeRoom.frameRate, safeRoom.boxRate, room.items]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------
  // ITEM UPDATE
  // -----------------------------------------
  const updateItem = useCallback(
    (index, changes) => {
      const items = [...safeRoom.items];
      let base = { ...items[index] };

      // Change name → load defaults
      if (typeof changes.name === "string" && changes.name !== base.name) {
        const cfg =
          roomConfig.items?.find((i) => i.name === changes.name) || {};
        const f = cfg.defaultFrame || {};
        const b = cfg.defaultBox || {};

        base = {
          name: changes.name,
          frame: {
            height: Number(f.height ?? GLOBAL_DEFAULT.height),
            width: Number(f.width ?? GLOBAL_DEFAULT.width),
            area: 0,
            price: 0,
          },
          box: {
            height: Number(b.height ?? GLOBAL_DEFAULT.height),
            width: Number(b.width ?? GLOBAL_DEFAULT.width),
            depth: Number(b.depth ?? GLOBAL_DEFAULT.depth),
            area: 0,
            price: 0,
          },
          totalPrice: 0,
        };
      } else {
        // update dims
        base = {
          ...base,
          frame: { ...base.frame, ...(changes.frame || {}) },
          box: { ...base.box, ...(changes.box || {}) },
        };
      }

      items[index] = calcDiversified(
        base,
        safeRoom.frameRate,
        safeRoom.boxRate
      );
      onChange({ ...safeRoom, items });
    },
    [safeRoom, roomConfig, onChange]
  );

  const addItem = useCallback(() => {
    onChange({
      ...safeRoom,
      items: [
        ...safeRoom.items,
        normalizeToStructured({ height: 0, width: 0, depth: 0 }),
      ],
    });
  }, [safeRoom, onChange]);

  const removeItem = (index) => {
    onChange({
      ...safeRoom,
      items: safeRoom.items.filter((_, i) => i !== index),
    });
  };

  // -----------------------------------------
  // ACCESSORIES
  // -----------------------------------------
  const addAccessory = () => {
    onChange({
      ...safeRoom,
      accessories: [...safeRoom.accessories, { name: "", price: 0, qty: 1 }],
    });
  };

  const updateAccessory = (i, changes) => {
    const acc = [...safeRoom.accessories];
    acc[i] = { ...acc[i], ...changes };
    onChange({ ...safeRoom, accessories: acc });
  };

  const removeAccessory = (i) => {
    onChange({
      ...safeRoom,
      accessories: safeRoom.accessories.filter((_, x) => x !== i),
    });
  };

  const roomTotal =
    safeRoom.items.reduce((s, it) => s + it.totalPrice, 0) +
    safeRoom.accessories.reduce((s, a) => s + a.price * a.qty, 0);

  // -----------------------------------------
  // ENHANCED UI
  // -----------------------------------------
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200 overflow-hidden">
      {/* Room Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {safeRoom.name || "Untitled Room"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {safeRoom.description || "No description selected"}
              </p>
            </div>
          </div>
          <button
            onClick={onRemoveRoom}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 font-medium text-sm"
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
            Remove Room
          </button>
        </div>
      </div>

      {/* Room Configuration */}
      <div className="p-6">
        {/* Room Details & Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room Type
            </label>
            <select
              value={safeRoom.name}
              onChange={(e) =>
                onChange({ ...safeRoom, name: e.target.value, description: "" })
              }
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-500">
                Select Room Type
              </option>
              {ROOM_CONFIG.map((r) => (
                <option
                  key={r.name}
                  value={r.name}
                  className="text-gray-900 dark:text-white"
                >
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <select
              value={safeRoom.description}
              onChange={(e) =>
                onChange({ ...safeRoom, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
            >
              <option value="" className="text-gray-500">
                Select Description
              </option>
              {(roomConfig.descriptions || []).map((d) => (
                <option
                  key={d}
                  value={d}
                  className="text-gray-900 dark:text-white"
                >
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frame Rate (₹/sqft)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={safeRoom.frameRate}
                onChange={(e) => {
                  const newFrame = Number(e.target.value || 0);
                  onChange({
                    ...safeRoom,
                    frameRate: newFrame,
                    boxRate: newFrame * 1.4, // room-wise auto sync
                  });
                }}
                className="w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Box Rate (₹/sqft)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={safeRoom.boxRate}
                onChange={(e) =>
                  onChange({
                    ...safeRoom,
                    boxRate: Number(e.target.value || 0),
                  })
                }
                className="w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Default: 1.4× frame rate. Changing frame rate resets box rate.
            </p>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Room Items ({safeRoom.items.length})
            </h4>
            <button
              onClick={addItem}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Item
            </button>
          </div>

          {safeRoom.items.map((item, i) => (
            <div
              key={i}
              className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              {/* Item Header */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Item Type
                    </label>
                    <select
                      value={item.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
                    >
                      <option value="" className="text-gray-500">
                        Select Item
                      </option>
                      {(roomConfig.items || []).map((opt) => (
                        <option
                          key={opt.name}
                          value={opt.name}
                          className="text-gray-900 dark:text-white"
                        >
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Item Total
                      </div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatINR(item.totalPrice)}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Frame & Box Dimensions */}
              <div className="p-5 space-y-6">
                {/* Frame Section */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                    <h5 className="font-semibold text-blue-800 dark:text-blue-300">
                      Frame Dimensions
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Width (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.frame.width}
                        onChange={(e) =>
                          updateItem(i, {
                            frame: { width: Number(e.target.value) },
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Height (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.frame.height}
                        onChange={(e) =>
                          updateItem(i, {
                            frame: { height: Number(e.target.value) },
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Area
                      </div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {item.frame.area.toFixed(2)} sqft
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Price
                      </div>
                      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {formatINR(item.frame.price)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box Section */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-100 dark:border-green-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400"></div>
                    <h5 className="font-semibold text-green-800 dark:text-green-300">
                      Box Dimensions
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Width (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.box.width}
                        onChange={(e) =>
                          updateItem(i, {
                            box: { width: Number(e.target.value) },
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Height (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.box.height}
                        onChange={(e) =>
                          updateItem(i, {
                            box: { height: Number(e.target.value) },
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Depth (ft)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.box.depth}
                        onChange={(e) =>
                          updateItem(i, {
                            box: {
                              depth:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Area
                      </div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {item.box.area.toFixed(2)} sqft
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Price
                      </div>
                      <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatINR(item.box.price)}
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeItem(i)}
                        className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 font-medium text-sm"
                      >
                        Remove Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Accessories Section */}
        {roomConfig.accessories.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                Accessories ({safeRoom.accessories.length})
              </h4>
              <button
                onClick={addAccessory}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Accessory
              </button>
            </div>

            {safeRoom.accessories.map((acc, i) => {
              const total = acc.price * acc.qty;
              return (
                <div
                  key={i}
                  className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Accessory
                      </label>
                      <select
                        value={acc.name}
                        onChange={(e) => {
                          const selected = roomConfig.accessories.find(
                            (a) => a.name === e.target.value
                          );
                          if (!selected) return;
                          updateAccessory(i, {
                            name: selected.name,
                            price: selected.price,
                          });
                        }}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 transition-all duration-200 text-gray-900 dark:text-white"
                      >
                        <option value="" className="text-gray-500">
                          Select Accessory
                        </option>
                        {roomConfig.accessories.map((a) => (
                          <option
                            key={a.name}
                            value={a.name}
                            className="text-gray-900 dark:text-white"
                          >
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Price (₹)
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                          ₹
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={acc.price}
                          onChange={(e) =>
                            updateAccessory(i, {
                              price: Number(e.target.value || 0),
                            })
                          }
                          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 transition-all duration-200 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={acc.qty}
                        onChange={(e) =>
                          updateAccessory(i, {
                            qty: Number(e.target.value || 1),
                          })
                        }
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 transition-all duration-200 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total
                      </div>
                      <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {formatINR(total)}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => removeAccessory(i)}
                        className="w-full px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5 text-center">
            <svg
              className="w-12 h-12 text-amber-400 dark:text-amber-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
              No Accessories Available
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              No accessories are configured for the{" "}
              <strong>{safeRoom.name}</strong> room type.
            </p>
          </div>
        )}

        {/* Room Total */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                Room Summary
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {safeRoom.items.length} items • {safeRoom.accessories.length}{" "}
                accessories
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Room Total
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(roomTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
