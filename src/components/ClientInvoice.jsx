// src/components/ClientInvoice.jsx
import { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoice = forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;

  const client = invoice.client || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];
  const extras = Array.isArray(invoice.extras) ? invoice.extras : [];
  const pricing = invoice.pricing || {};

  const frameworkRate =
    typeof pricing.frameRate === "number" ? pricing.frameRate : 0;

  const boxRate =
    typeof pricing.boxRate === "number" ? pricing.boxRate : frameworkRate * 1.4;

  const useCurrentLocation = !!client.siteMapLink;

  /* ========================================================= */
  /* SAFE HELPERS                                              */
  /* ========================================================= */

  const safeInputs = (inputs) => ({
    // ceiling related
    surfaces: inputs?.surfaces || [],
    electricalWiring: inputs?.electricalWiring ?? 0,
    electricianCharges: inputs?.electricianCharges ?? 0,
    ceilingLights: inputs?.ceilingLights ?? 0,
    profileLights: inputs?.profileLights ?? 0,

    // ceiling painting
    ceilingPaintingArea: inputs?.ceilingPaintingArea ?? 0,
    ceilingPaintingUnitPrice: inputs?.ceilingPaintingUnitPrice ?? 0,
    ceilingPaintingPrice: inputs?.ceilingPaintingPrice ?? 0,

    // area based
    area: inputs?.area ?? 0,
    unitPrice: inputs?.unitPrice ?? 0,

    // fixed
    price: inputs?.price ?? 0,
  });

  const calcRoomAggregates = (room = {}) => {
    const items = room.items || [];
    const accessories = room.accessories || [];

    let frameAreaTotal = 0;
    let boxAreaTotal = 0;
    let framePriceTotal = 0;
    let boxPriceTotal = 0;

    items.forEach((item) => {
      frameAreaTotal += Number(item.frame?.area || 0);
      boxAreaTotal += Number(item.box?.area || 0);
      framePriceTotal += Number(item.frame?.price || 0);
      boxPriceTotal += Number(item.box?.price || 0);
    });

    const accessoriesTotal = accessories.reduce(
      (sum, a) => sum + Number(a.price || 0) * Number(a.qty || 0),
      0
    );

    const itemsTotal = framePriceTotal + boxPriceTotal;
    const roomTotal = itemsTotal + accessoriesTotal;

    return {
      frameAreaTotal,
      boxAreaTotal,
      framePriceTotal,
      boxPriceTotal,
      accessoriesTotal,
      itemsTotal,
      roomTotal,
    };
  };

  const roomsTotals = rooms.map((room) => calcRoomAggregates(room));

  const roomsTotal = roomsTotals.reduce((sum, r) => sum + r.roomTotal, 0);

  const extrasTotal = extras.reduce(
    (sum, ex) => sum + Number(ex.total || 0),
    0
  );

  const grandTotal =
    typeof invoice.grandTotal === "number"
      ? invoice.grandTotal
      : roomsTotal + extrasTotal;

  const invoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString()
    : "";

  const invoiceIdShort = invoice._id
    ? String(invoice._id).slice(-6).toUpperCase()
    : "";

  /* ========================================================= */
  /* UI START                                                  */
  /* ========================================================= */

  return (
    <div
      ref={ref}
      className="mx-auto bg-white text-black p-6 text-sm border rounded-xl shadow"
      style={{ width: "800px" }}
    >
      {/* ===================================================== */}
      {/* COMPANY HEADER                                        */}
      {/* ===================================================== */}
      <header className="flex items-start justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Logo - update src to your actual logo path */}
          <div className="h-16 w-16 rounded-full border flex items-center justify-center overflow-hidden bg-gray-100">
            <img
              src="/logo.png"
              alt="Skanda Interiors Logo"
              className="h-full w-full object-contain"
              onError={(e) => {
                // fallback if logo not found
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              Skanda Interiors
            </h1>
            <p className="text-xs mt-1 leading-snug max-w-md">
              12-8-295, Opp: HP petrol pump, Santhoshimatha Temple Lane,
              Warangal, Telangana (506002)
            </p>
            <p className="text-xs mt-1">
              <span className="font-medium">Contact:</span> 9700360963,
              9866565057, 9246893307, 779967762
            </p>
            <p className="text-xs">
              <span className="font-medium">Email:</span>{" "}
              interior.skanda@gmail.com
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <p className="text-lg font-semibold tracking-wide">
            CLIENT QUOTATION
          </p>
          {invoiceIdShort && (
            <p className="mt-1">
              <span className="font-medium">Invoice No:</span> {invoiceIdShort}
            </p>
          )}
          {invoiceDate && (
            <p>
              <span className="font-medium">Date:</span> {invoiceDate}
            </p>
          )}
        </div>
      </header>

      {/* CLIENT DETAILS */}
      <div className="border rounded-lg p-4 mb-6 bg-gray-50">
        <h2 className="font-semibold text-lg mb-3">Client Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p>
              <span className="font-medium">Name:</span> {client.name || "—"}
            </p>
            <p>
              <span className="font-medium">Mobile:</span>{" "}
              {client.mobile || "—"}
            </p>
            <p>
              <span className="font-medium">Email:</span> {client.email || "—"}
            </p>
          </div>
          <div>
            <p>
              <span className="font-medium">Site Address:</span>{" "}
              {client.siteAddress || "—"}
            </p>
            <p>
              <span className="font-medium">Location URL:</span>{" "}
              {useCurrentLocation && client.siteMapLink ? (
                <a
                  href={client.siteMapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  {client.siteMapLink}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* PRICING SUMMARY */}
      <div className="border rounded-lg p-4 mb-6 bg-blue-50">
        <h2 className="font-semibold text-lg mb-2">Pricing Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p>
              <span className="font-medium">Global Frame Rate:</span>{" "}
              {frameworkRate ? formatINR(frameworkRate) : "As per discussion"}
            </p>
            <p>
              <span className="font-medium">Global Box Rate:</span>{" "}
              {boxRate ? formatINR(boxRate) : "As per discussion"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">
              Room-wise totals below are derived from these rates and the final
              design measurement for framework and boxwork.
            </p>
          </div>
        </div>
      </div>

      {/* ROOMS (summarised for client) */}
      {rooms.map((room, idx) => {
        const aggregates = roomsTotals[idx] || {};
        const roomFrameRate =
          typeof room.frameRate === "number" && !Number.isNaN(room.frameRate)
            ? room.frameRate
            : frameworkRate || 0;

        const roomBoxRate =
          typeof room.boxRate === "number" && !Number.isNaN(room.boxRate)
            ? room.boxRate
            : boxRate || roomFrameRate * 1.4;

        return (
          <div
            key={idx}
            className="border rounded-lg p-4 mb-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-sm">
                  {room.name} - {room.description}
                </h3>
              </div>
              <div className="text-xs text-gray-700 text-right">
                <div>
                  <span className="font-medium">Room Frame Rate: </span>
                  {roomFrameRate ? formatINR(roomFrameRate) : "—"}
                </div>
                <div>
                  <span className="font-medium">Room Box Rate: </span>
                  {roomBoxRate ? formatINR(roomBoxRate) : "—"}
                </div>
              </div>
            </div>

            <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium border-r w-1/2">
                    Total Frame Work (sqft)
                  </td>
                  <td className="p-2 text-right">
                    {aggregates.frameAreaTotal?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium border-r">
                    Total Box Work (sqft)
                  </td>
                  <td className="p-2 text-right">
                    {aggregates.boxAreaTotal?.toFixed(2) || "0.00"}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium border-r">
                    Roomwise Frame Price
                  </td>
                  <td className="p-2 text-right">
                    {formatINR(aggregates.framePriceTotal || 0)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium border-r">
                    Roomwise Box Price
                  </td>
                  <td className="p-2 text-right">
                    {formatINR(aggregates.boxPriceTotal || 0)}
                  </td>
                </tr>
                {aggregates.accessoriesTotal > 0 && (
                  <tr className="border-b">
                    <td className="p-2 font-medium border-r">
                      Accessories Total
                    </td>
                    <td className="p-2 text-right">
                      {formatINR(aggregates.accessoriesTotal || 0)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="p-2 font-semibold border-r">
                    Room Total (Frame + Box + Accessories)
                  </td>
                  <td className="p-2 text-right font-semibold">
                    {formatINR(aggregates.roomTotal || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* EXTRAS - same rich view as admin */}
      {extras.length > 0 && (
        <div className="border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Extras</h2>

          {extras.map((ex) => {
            const inputs = safeInputs(ex.inputs || {});
            const key = ex._id || ex.id || ex.key;

            return (
              <div key={key} className="mb-4 text-xs">
                <h3 className="font-medium mb-1">{ex.label}</h3>

                {/* CEILING TYPE */}
                {ex.type === "ceiling" && (
                  <>
                    {/* SURFACES */}
                    <table className="w-full border text-xs border-collapse mb-2">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-1">Surface</th>
                          <th className="border p-1">Area (sqft)</th>
                          <th className="border p-1">Unit Price</th>
                          <th className="border p-1">Surface Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(inputs.surfaces || []).map((s, i) => (
                          <tr key={i}>
                            <td className="border p-1">{s.label}</td>
                            <td className="border p-1">{s.area}</td>
                            <td className="border p-1">
                              {formatINR(s.unitPrice)}
                            </td>
                            <td className="border p-1 font-semibold">
                              {formatINR(s.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* SLAB DETAILS */}
                    <table className="w-full border text-xs border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-1">Electrical Wiring</th>
                          <th className="border p-1">Electrician Charges</th>
                          <th className="border p-1">Ceiling Lights</th>
                          <th className="border p-1">Profile Lights</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-1">
                            {formatINR(inputs.electricalWiring)}
                          </td>
                          <td className="border p-1">
                            {formatINR(inputs.electricianCharges)}
                          </td>
                          <td className="border p-1">
                            {formatINR(inputs.ceilingLights)}
                          </td>
                          <td className="border p-1">
                            {formatINR(inputs.profileLights)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* CEILING PAINTING DETAILS */}
                    <table className="w-full border text-xs border-collapse mt-2">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-1">Painting Area (sqft)</th>
                          <th className="border p-1">Unit Price</th>
                          <th className="border p-1">Painting Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-1">
                            {inputs.ceilingPaintingArea}
                          </td>
                          <td className="border p-1">
                            {formatINR(inputs.ceilingPaintingUnitPrice)}
                          </td>
                          <td className="border p-1 font-semibold">
                            {formatINR(inputs.ceilingPaintingPrice)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="text-right font-semibold mt-2">
                      Ceiling Total: {formatINR(ex.total)}
                    </p>
                  </>
                )}

                {/* AREA BASED */}
                {ex.type === "area_based" && (
                  <table className="w-full border text-xs border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-1">Area (sqft)</th>
                        <th className="border p-1">Unit Price</th>
                        <th className="border p-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1">{inputs.area}</td>
                        <td className="border p-1">
                          {formatINR(inputs.unitPrice)}
                        </td>
                        <td className="border p-1 font-semibold">
                          {formatINR(ex.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* FIXED */}
                {ex.type === "fixed" && (
                  <table className="w-full border text-xs border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-1">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1 font-semibold">
                          {formatINR(inputs.price)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}

          <p className="text-right font-bold text-sm mt-2">
            Extras Total: {formatINR(extrasTotal)}
          </p>
        </div>
      )}

      {/* GRAND TOTAL */}
      <div className="text-right text-lg font-bold border-t pt-4">
        Grand Total: {formatINR(grandTotal)}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        * This is a quotation / invoice for client reference. Final values may
        vary based on site conditions and scope changes.
      </p>
    </div>
  );
});

export default ClientInvoice;
