import React from "react";
import ROOM_CONFIG from "../json/roomConfig";
import { formatINR } from "../utils/calculations";

export default function ExtrasEditor({ extras, setExtras }) {
  const extrasConfig = ROOM_CONFIG.extras || [];

  /* -----------------------------------------
      SAFE INPUT NORMALIZER
  ----------------------------------------- */
  const safeInputs = (inputs = {}) => ({
    surfaces: Array.isArray(inputs.surfaces) ? inputs.surfaces : [],
    electricalWiring: Number(inputs.electricalWiring ?? 0),
    electricianCharges: Number(inputs.electricianCharges ?? 0),
    ceilingLights: Number(inputs.ceilingLights ?? 0),
    profileLights: Number(inputs.profileLights ?? 0),
    ceilingPaintingArea:
      inputs.ceilingPaintingArea === "" || inputs.ceilingPaintingArea == null
        ? 0
        : Number(inputs.ceilingPaintingArea),
    ceilingPaintingUnitPrice:
      inputs.ceilingPaintingUnitPrice === "" ||
      inputs.ceilingPaintingUnitPrice == null
        ? 0
        : Number(inputs.ceilingPaintingUnitPrice),
    ceilingPaintingPrice:
      inputs.ceilingPaintingPrice === "" || inputs.ceilingPaintingPrice == null
        ? 0
        : Number(inputs.ceilingPaintingPrice),
    area: inputs.area === "" || inputs.area == null ? "" : Number(inputs.area),
    unitPrice:
      inputs.unitPrice === "" || inputs.unitPrice == null
        ? 0
        : Number(inputs.unitPrice),
    price:
      inputs.price === "" || inputs.price == null ? 0 : Number(inputs.price),
  });

  const getExtraConfig = (key) => extrasConfig.find((e) => e.key === key);

  const findSlab = (totalArea, slabs) => {
    if (!slabs?.length) return null;
    let slab = slabs.find((s) => totalArea >= s.min && totalArea <= s.max);
    return slab || slabs[slabs.length - 1];
  };

  /* -----------------------------------------
      CEILING CALCULATOR
  ----------------------------------------- */
  const computeCeilingFromSurfaces = (
    cfg,
    inputs,
    { forceRecalcPaintingArea = false } = {}
  ) => {
    const surfaces = inputs.surfaces || [];
    const normalized = surfaces.map((s) => {
      const area = Number(s.area || 0);
      const unitPrice = Number(s.unitPrice || 0);
      return {
        ...s,
        area,
        unitPrice,
        price: area * unitPrice,
      };
    });

    const totalArea = normalized.reduce((t, s) => t + s.area, 0);
    const surfacePrice = normalized.reduce((t, s) => t + s.price, 0);
    const slab = findSlab(totalArea, cfg.slabs);

    let wiring = Number(inputs.electricalWiring || 0);
    let charges = Number(inputs.electricianCharges || 0);
    let lights = Number(inputs.ceilingLights || 0);
    let profile = Number(inputs.profileLights || 0);

    if (slab) {
      wiring = Number(slab.electricalWiring || 0);
      charges = Number(slab.electricianCharges || 0);
      lights = Number(slab.ceilingLights || 0);
      profile = Number(slab.profileLights || 0);
    }

    const sgArea = normalized.find((s) => s.type === "saint_gobain")?.area || 0;
    const popArea = normalized.find((s) => s.type === "pop")?.area || 0;
    const defaultPaintingArea = sgArea + popArea;
    const defaultPaintingUnit =
      cfg.ceilingPainting?.unitPrice != null
        ? Number(cfg.ceilingPainting.unitPrice)
        : 0;

    let paintingArea;
    let paintingUnitPrice;

    if (forceRecalcPaintingArea) {
      paintingArea = defaultPaintingArea;
      paintingUnitPrice =
        inputs.ceilingPaintingUnitPrice && inputs.ceilingPaintingUnitPrice > 0
          ? Number(inputs.ceilingPaintingUnitPrice)
          : defaultPaintingUnit;
    } else {
      paintingArea =
        inputs.ceilingPaintingArea && inputs.ceilingPaintingArea > 0
          ? Number(inputs.ceilingPaintingArea)
          : defaultPaintingArea;
      paintingUnitPrice =
        inputs.ceilingPaintingUnitPrice && inputs.ceilingPaintingUnitPrice > 0
          ? Number(inputs.ceilingPaintingUnitPrice)
          : defaultPaintingUnit;
    }

    const paintingPrice = paintingArea * paintingUnitPrice;
    const slabCharges = wiring + charges + lights + profile;

    return {
      inputs: {
        ...inputs,
        surfaces: normalized,
        electricalWiring: wiring,
        electricianCharges: charges,
        ceilingLights: lights,
        profileLights: profile,
        ceilingPaintingArea: paintingArea,
        ceilingPaintingUnitPrice: paintingUnitPrice,
        ceilingPaintingPrice: paintingPrice,
      },
      total: surfacePrice + slabCharges + paintingPrice,
    };
  };

  /* -----------------------------------------
      HANDLERS
  ----------------------------------------- */
  const removeExtra = (id) => {
    setExtras(extras.filter((e) => e.id !== id));
  };

  const handleSelectExtra = (key) => {
    if (!key) return;
    const cfg = getExtraConfig(key);
    if (!cfg) return;
    if (extras.some((ex) => ex.key === key)) return;

    let inputs = safeInputs({});
    let total = 0;
    let computed = null;

    if (cfg.type === "ceiling") {
      const sg = cfg.surfaces.find((s) => s.key === "saint_gobain");
      if (sg) {
        inputs.surfaces = [
          {
            type: sg.key,
            label: sg.label,
            area: "",
            unitPrice: sg.unitPrice,
            price: 0,
          },
        ];
      }
      computed = computeCeilingFromSurfaces(cfg, inputs, {
        forceRecalcPaintingArea: true,
      });
      inputs = computed.inputs;
      total = computed.total;
    } else if (cfg.type === "area_based") {
      inputs.unitPrice = cfg.unitPrice || 0;
      inputs.area = inputs.area || 0;
      total = Number(inputs.area || 0) * Number(inputs.unitPrice || 0);
    } else if (cfg.type === "fixed") {
      inputs.price = cfg.price || 0;
      total = Number(inputs.price || 0);
    }

    const newExtra = {
      id: Date.now(),
      key: cfg.key,
      label: cfg.label,
      type: cfg.type,
      inputs,
      total,
    };

    setExtras([...extras, newExtra]);
  };

  const updateField = (id, type, value) => {
    setExtras(
      extras.map((ex) => {
        if (ex.id !== id) return ex;
        const cfg = getExtraConfig(ex.key);
        let inputs = safeInputs(ex.inputs);

        if (ex.type === "ceiling") {
          let forceRecalcPaintingArea = false;
          if (type === "surface_area") {
            inputs.surfaces[value.index].area = value.area;
            forceRecalcPaintingArea = true;
          }
          if (type === "surface_unitPrice") {
            inputs.surfaces[value.index].unitPrice = value.unitPrice;
          }
          if (
            [
              "electricalWiring",
              "electricianCharges",
              "ceilingLights",
              "profileLights",
            ].includes(type)
          ) {
            inputs[type] = Number(value || 0);
          }
          if (type === "paintingArea") {
            inputs.ceilingPaintingArea = Number(value || 0);
          }
          if (type === "paintingUnitPrice") {
            inputs.ceilingPaintingUnitPrice = Number(value || 0);
          }

          const computed = computeCeilingFromSurfaces(cfg, inputs, {
            forceRecalcPaintingArea,
          });
          return { ...ex, inputs: computed.inputs, total: computed.total };
        }

        if (ex.type === "area_based") {
          if (type === "area") inputs.area = Number(value || 0);
          if (type === "unitPrice") inputs.unitPrice = Number(value || 0);
          const total =
            Number(inputs.area || 0) * Number(inputs.unitPrice || 0);
          return { ...ex, inputs, total };
        }

        if (ex.type === "fixed") {
          inputs.price = Number(value || 0);
          return { ...ex, inputs, total: inputs.price };
        }

        return ex;
      })
    );
  };

  const addSurfaceByClick = (ex, surfaceKey) => {
    const cfg = getExtraConfig("ceiling");
    const next = cfg?.surfaces?.find((s) => s.key === surfaceKey);
    if (!next) return;

    const updatedSurfaces = [
      ...ex.inputs.surfaces,
      {
        type: next.key,
        label: next.label,
        area: "",
        unitPrice: next.unitPrice,
        price: 0,
      },
    ];

    setExtras(
      extras.map((e) => {
        if (e.id !== ex.id) return e;
        const baseInputs = safeInputs({
          ...e.inputs,
          surfaces: updatedSurfaces,
        });
        const computed = computeCeilingFromSurfaces(cfg, baseInputs, {
          forceRecalcPaintingArea: true,
        });
        return { ...e, inputs: computed.inputs, total: computed.total };
      })
    );
  };

  const removeSurface = (ex, index) => {
    const cfg = getExtraConfig("ceiling");
    const updatedSurfaces = ex.inputs.surfaces.filter((_, i) => i !== index);

    setExtras(
      extras.map((e) => {
        if (e.id !== ex.id) return e;
        const baseInputs = safeInputs({
          ...e.inputs,
          surfaces: updatedSurfaces,
        });
        const computed = computeCeilingFromSurfaces(cfg, baseInputs, {
          forceRecalcPaintingArea: true,
        });
        return { ...e, inputs: computed.inputs, total: computed.total };
      })
    );
  };

  const extrasTotal = extras.reduce(
    (sum, ex) => sum + (Number(ex.total) || 0),
    0
  );

  /* -----------------------------------------
      ENHANCED UI
  ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Additional Extras
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add ceiling treatments, custom installations, or fixed-cost items
            </p>
          </div>

          {/* Add Extra Section */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add Extra Item:
              </label>
            </div>
            <select
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 text-gray-900 dark:text-white min-w-[200px]"
              onChange={(e) => {
                handleSelectExtra(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="" className="text-gray-500 dark:text-gray-400">
                + Select an extra...
              </option>
              {extrasConfig.map((cfg) =>
                extras.some((e) => e.key === cfg.key) ? null : (
                  <option
                    key={cfg.key}
                    value={cfg.key}
                    className="text-gray-900 dark:text-white"
                  >
                    {cfg.label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Extras List */}
      {extras.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No extras added yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an extra from the dropdown above to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {extras.map((ex) => {
            const inputs = safeInputs(ex.inputs);

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Extra Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ex.type === "ceiling"
                            ? "bg-blue-500"
                            : ex.type === "area_based"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                      ></div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">
                          {ex.label}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {ex.type.replace("_", " ")} • {formatINR(ex.total)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeExtra(ex.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
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
                      Remove
                    </button>
                  </div>
                </div>

                {/* Extra Content */}
                <div className="p-6">
                  {/* CEILING EXTRA */}
                  {ex.type === "ceiling" && (
                    <div className="space-y-6">
                      {/* Add Surface Button */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Ceiling Surfaces
                        </h4>
                        <select
                          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                          onChange={(e) => {
                            if (!e.target.value) return;
                            addSurfaceByClick(ex, e.target.value);
                            e.target.value = "";
                          }}
                        >
                          <option value="" className="text-gray-500">
                            + Add Surface Type
                          </option>
                          {getExtraConfig("ceiling")
                            ?.surfaces.filter(
                              (s) =>
                                !inputs.surfaces.some((u) => u.type === s.key)
                            )
                            .map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Surface Cards */}
                      <div className="space-y-3">
                        {inputs.surfaces.map((s, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 dark:text-white">
                                  {s.label}
                                </span>
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                  Surface {index + 1}
                                </span>
                              </div>
                              <button
                                onClick={() => removeSurface(ex, index)}
                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 inline-flex items-center"
                              >
                                <svg
                                  className="w-3 h-3 mr-1"
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
                                Remove Surface
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Area (sqft)
                                </label>
                                <input
                                  type="number"
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                                  value={s.area}
                                  onChange={(e) =>
                                    updateField(ex.id, "surface_area", {
                                      index,
                                      area: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Unit Price (₹/sqft)
                                </label>
                                <input
                                  type="number"
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                                  value={s.unitPrice}
                                  onChange={(e) =>
                                    updateField(ex.id, "surface_unitPrice", {
                                      index,
                                      unitPrice: Number(e.target.value),
                                    })
                                  }
                                />
                              </div>

                              <div className="flex flex-col justify-end">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Surface Total
                                </div>
                                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  {formatINR(s.price)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Slab Charges Grid */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3">
                          Electrical & Lighting Charges
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            {
                              key: "electricalWiring",
                              label: "Electrical Wiring",
                            },
                            {
                              key: "electricianCharges",
                              label: "Electrician Charges",
                            },
                            { key: "ceilingLights", label: "Ceiling Lights" },
                            { key: "profileLights", label: "Profile Lights" },
                          ].map(({ key, label }) => (
                            <div key={key}>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {label}
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                                value={inputs[key]}
                                onChange={(e) =>
                                  updateField(
                                    ex.id,
                                    key,
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ceiling Painting */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">
                          Ceiling Painting
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Painting Area (sqft)
                            </label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200"
                              value={inputs.ceilingPaintingArea}
                              onChange={(e) =>
                                updateField(
                                  ex.id,
                                  "paintingArea",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Unit Price (₹/sqft)
                            </label>
                            <input
                              type="number"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200"
                              value={inputs.ceilingPaintingUnitPrice}
                              onChange={(e) =>
                                updateField(
                                  ex.id,
                                  "paintingUnitPrice",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>

                          <div className="flex flex-col justify-end">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Painting Total
                            </div>
                            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {formatINR(inputs.ceilingPaintingPrice || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AREA BASED EXTRA */}
                  {ex.type === "area_based" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Area (sqft)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200"
                          value={inputs.area}
                          onChange={(e) =>
                            updateField(ex.id, "area", Number(e.target.value))
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Unit Price (₹/sqft)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 transition-all duration-200"
                          value={inputs.unitPrice}
                          onChange={(e) =>
                            updateField(
                              ex.id,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Calculated Total
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatINR(ex.total)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FIXED EXTRA */}
                  {ex.type === "fixed" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fixed Price
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
                          value={inputs.price}
                          onChange={(e) =>
                            updateField(ex.id, "price", Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Item Total
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatINR(ex.total)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Extra Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Extra Item Total
                    </span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                      {formatINR(ex.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grand Total */}
      {extras.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Extras Grand Total
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sum of all additional extras
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Items: {extras.length}
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(extrasTotal)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
