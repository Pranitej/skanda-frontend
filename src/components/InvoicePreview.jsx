import React from "react";
import { formatINR } from "../utils/calculations";

export default function InvoicePreview({
  client,
  rooms,
  frameworkRate, // ✅ global frame rate from parent (NewQuote)
  boxRate, // ✅ global box rate from parent (NewQuote)
  useCurrentLocation,
  extras = [],
}) {
  /* ========================================================= */
  /* SAFE HELPERS */
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

  const calculateItemTotal = (item) => {
    const framePrice = Number(item.frame?.price || 0);
    const boxPrice = Number(item.box?.price || 0);
    return framePrice + boxPrice;
  };

  const calculateRoomTotal = (room) => {
    const itemsTotal = room.items.reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0
    );
    const accessoriesTotal = (room.accessories || []).reduce(
      (sum, acc) => sum + (acc.price || 0) * (acc.qty || 0),
      0
    );
    return itemsTotal + accessoriesTotal;
  };

  const roomsTotal = rooms.reduce(
    (sum, room) => sum + calculateRoomTotal(room),
    0
  );

  const extrasTotal = extras.reduce(
    (sum, ex) => sum + Number(ex.total || 0),
    0
  );

  const grandTotal = roomsTotal + extrasTotal;

  /* ========================================================= */
  /* UI START */
  /* ========================================================= */

  return (
    <div className="mx-auto bg-white border rounded-xl shadow p-6 text-sm">
      {/* CLIENT DETAILS */}
      <div className="border rounded-lg p-4 mb-8 bg-gray-50">
        <h2 className="font-semibold text-lg mb-3">Client Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p>
              <span className="font-medium">Name:</span> {client.name || " —"}
            </p>
            <p>
              <span className="font-medium">Mobile:</span>{" "}
              {client.mobile || " —"}
            </p>
            <p>
              <span className="font-medium">Email:</span> {client.email || " —"}
            </p>
          </div>
          <div>
            <p>
              <span className="font-medium">Manual Address:</span>{" "}
              {client.siteAddress || " —"}
            </p>
            <p>
              <span className="font-medium">Location URL:</span>{" "}
              {useCurrentLocation && client.siteMapLink ? (
                <a
                  href={client.siteMapLink}
                  target="_blank"
                  className="text-blue-600 underline break-all"
                  rel="noreferrer"
                >
                  {client.siteMapLink}
                </a>
              ) : (
                " —"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* GLOBAL PRICING SUMMARY */}
      <div className="border rounded-lg p-4 mb-6 bg-blue-50">
        <h2 className="font-semibold text-lg mb-2">Pricing Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p>
              <span className="font-medium">Global Frame Rate:</span>{" "}
              {frameworkRate ? formatINR(frameworkRate) : "—"}
            </p>
            <p>
              <span className="font-medium">Global Box Rate:</span>{" "}
              {boxRate
                ? formatINR(boxRate)
                : frameworkRate
                ? formatINR(frameworkRate * 1.4)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">
              Room-wise rates shown below will default to these global rates
              unless they are customized for a specific room.
            </p>
          </div>
        </div>
      </div>

      {/* ROOMS */}
      {rooms.map((room, roomIndex) => {
        const roomFrameRate =
          typeof room.frameRate === "number" && !Number.isNaN(room.frameRate)
            ? room.frameRate
            : frameworkRate || 0;

        const roomBoxRate =
          typeof room.boxRate === "number" && !Number.isNaN(room.boxRate)
            ? room.boxRate
            : boxRate || roomFrameRate * 1.4;

        return (
          <div key={roomIndex} className="mb-10">
            <div className="flex justify-between items-end mb-1">
              <h2 className="text-lg font-semibold">
                {room.name} - {room.description}
              </h2>
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

            {/* ITEMS TABLE */}
            <table className="w-full border text-xs border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-1">Item</th>
                  <th className="border p-1">Work</th>
                  <th className="border p-1">W</th>
                  <th className="border p-1">H</th>
                  <th className="border p-1">D</th>
                  <th className="border p-1">Area</th>
                  <th className="border p-1">Price</th>
                  <th className="border p-1">Item Total</th>
                </tr>
              </thead>
              <tbody>
                {room.items.map((item, itemIndex) => {
                  const hasFrame = item.frame && item.frame.area > 0;
                  const hasBox = item.box && item.box.area > 0;
                  const itemTotal = calculateItemTotal(item);
                  const rowSpan = hasFrame && hasBox ? 2 : 1;

                  return (
                    <React.Fragment key={itemIndex}>
                      <tr>
                        <td
                          rowSpan={rowSpan}
                          className="border p-1 font-medium"
                        >
                          {item.name}
                        </td>

                        {hasFrame && (
                          <>
                            <td className="border p-1">Frame</td>
                            <td className="border p-1">{item.frame.width}</td>
                            <td className="border p-1">{item.frame.height}</td>
                            <td className="border p-1 text-center">—</td>
                            <td className="border p-1">{item.frame.area}</td>
                            <td className="border p-1">
                              {formatINR(item.frame.price)}
                            </td>
                          </>
                        )}

                        {!hasFrame && hasBox && (
                          <>
                            <td className="border p-1">Box</td>
                            <td className="border p-1">{item.box.width}</td>
                            <td className="border p-1">{item.box.height}</td>
                            <td className="border p-1">{item.box.depth}</td>
                            <td className="border p-1">{item.box.area}</td>
                            <td className="border p-1">
                              {formatINR(item.box.price)}
                            </td>
                          </>
                        )}

                        <td
                          rowSpan={rowSpan}
                          className="border p-1 font-semibold"
                        >
                          {formatINR(itemTotal)}
                        </td>
                      </tr>

                      {hasFrame && hasBox && (
                        <tr>
                          <td className="border p-1">Box</td>
                          <td className="border p-1">{item.box.width}</td>
                          <td className="border p-1">{item.box.height}</td>
                          <td className="border p-1">{item.box.depth}</td>
                          <td className="border p-1">{item.box.area}</td>
                          <td className="border p-1">
                            {formatINR(item.box.price)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* ACCESSORIES TABLE */}
            {room.accessories?.length > 0 && (
              <table className="w-full border text-xs border-collapse mt-2">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-1">Accessory</th>
                    <th className="border p-1">Unit Price</th>
                    <th className="border p-1">Qty</th>
                    <th className="border p-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {room.accessories.map((acc, idx) => {
                    const total = (acc.price || 0) * (acc.qty || 0);
                    return (
                      <tr key={idx}>
                        <td className="border p-1">{acc.name}</td>
                        <td className="border p-1">{formatINR(acc.price)}</td>
                        <td className="border p-1">{acc.qty}</td>
                        <td className="border p-1">{formatINR(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <p className="text-right font-bold mt-2 text-sm">
              Room Total: {formatINR(calculateRoomTotal(room))}
            </p>
          </div>
        );
      })}

      <hr className="my-6" />

      {/* ========================================== */}
      {/*                 EXTRAS                    */}
      {/* ========================================== */}

      {extras.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Extras</h2>

          {extras.map((ex) => {
            const inputs = safeInputs(ex.inputs);

            return (
              <div key={ex.id} className="mb-6">
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

          {/* EXTRAS TOTAL */}
          <p className="text-right font-bold text-sm mt-2">
            Extras Total: {formatINR(extrasTotal)}
          </p>
        </div>
      )}

      {/* GRAND TOTAL */}
      <div className="text-right text-lg font-bold border-t pt-4">
        Grand Total: {formatINR(grandTotal)}
      </div>
    </div>
  );
}
