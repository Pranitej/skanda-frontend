import { formatINR } from "../utils/calculations";

export default function PricingSection({
  globalFrameRate,
  globalBoxRate,
  onChangeFrameRate,
  onChangeBoxRate,
}) {
  const calculatedBoxRate = globalFrameRate * 1.4;
  const isUsingDefault = Math.abs(globalBoxRate - calculatedBoxRate) < 0.01;

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-all duration-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full"></div>
          Global Pricing Configuration
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Set framework and boxwork rates for all calculations
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Framework Rate Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl transform group-hover:scale-[1.01] transition-all duration-300"></div>
          <div className="relative bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-800/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Framework Rate
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Per square foot
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                Primary
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate (₹/sqft)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter framework rate"
                  value={globalFrameRate}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    onChangeFrameRate(value);
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                  /sqft
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Current Value
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatINR(globalFrameRate)}
              </div>
            </div>
          </div>
        </div>

        {/* Boxwork Rate Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl transform group-hover:scale-[1.01] transition-all duration-300"></div>
          <div
            className={`relative bg-white dark:bg-gray-800 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 ${
              isUsingDefault
                ? "border-green-200 dark:border-green-800/30"
                : "border-amber-200 dark:border-amber-800/30"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                    isUsingDefault
                      ? "bg-gradient-to-br from-green-500 to-green-600"
                      : "bg-gradient-to-br from-amber-500 to-amber-600"
                  }`}
                >
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Boxwork Rate
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Per square foot
                  </p>
                </div>
              </div>
              <div
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  isUsingDefault
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                }`}
              >
                {isUsingDefault ? "Auto-calculated" : "Custom"}
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate (₹/sqft)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full pl-9 pr-4 py-3 bg-white dark:bg-gray-800 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    isUsingDefault
                      ? "border-gray-300 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400"
                      : "border-amber-300 dark:border-amber-600 focus:ring-amber-500 dark:focus:ring-amber-400"
                  }`}
                  placeholder="Enter boxwork rate"
                  value={globalBoxRate}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    onChangeBoxRate(value);
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
                  /sqft
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Current Value
                </div>
                <div
                  className={`text-lg font-bold ${
                    isUsingDefault
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {formatINR(globalBoxRate)}
                </div>
              </div>
              {isUsingDefault && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  <div>1.4× framework rate</div>
                  <div className="font-medium">
                    {formatINR(calculatedBoxRate)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800 dark:text-white">
              Pricing Guidelines
            </h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  By default, boxwork rate is automatically calculated as{" "}
                  <strong className="text-gray-800 dark:text-white">
                    1.4×
                  </strong>{" "}
                  the framework rate.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Changing the framework rate will{" "}
                  <strong className="text-gray-800 dark:text-white">
                    reset the box rate
                  </strong>{" "}
                  to 1.4× and update all rooms.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  You can manually override the box rate for custom
                  calculations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Rate Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-medium text-gray-800 dark:text-white">
              Rate Summary
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current pricing multiplier:{" "}
              <span className="font-bold">1.4×</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Framework
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatINR(globalFrameRate)}
              </div>
            </div>
            <div className="w-8 text-center">
              <svg
                className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Boxwork
              </div>
              <div
                className={`text-lg font-bold ${
                  isUsingDefault
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {formatINR(globalBoxRate)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Multiplier
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {(globalBoxRate / globalFrameRate).toFixed(1)}×
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
