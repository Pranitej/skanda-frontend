import { formatINR } from "../utils/calculations";

export default function PricingSection({
  globalFrameRate,
  globalBoxRate,
  onChangeFrameRate,
  onChangeBoxRate,
}) {
  const calculatedBoxRate = globalFrameRate * 1.4;
  const isUsingDefault = Math.abs(globalBoxRate - calculatedBoxRate) < 0.01;
  const multiplier =
    globalFrameRate > 0 ? (globalBoxRate / globalFrameRate).toFixed(2) : "0.00";

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white">
            Pricing Rates
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Set global rates for frame and box calculations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
            Multiplier: {multiplier}×
          </div>
        </div>
      </div>

      {/* Rate Inputs - Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Frame Rate Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Frame Rate
            </label>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {formatINR(globalFrameRate)}/sqft
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₹
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter frame rate"
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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Framework rate per square foot
          </div>
        </div>

        {/* Box Rate Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Box Rate
            </label>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-medium ${
                  isUsingDefault
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {formatINR(globalBoxRate)}/sqft
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  isUsingDefault
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                }`}
              >
                {isUsingDefault ? "Auto" : "Custom"}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₹
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border rounded-lg focus:ring-1 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                isUsingDefault
                  ? "border-gray-300 dark:border-gray-600 focus:ring-green-500"
                  : "border-amber-300 dark:border-amber-600 focus:ring-amber-500"
              }`}
              placeholder="Enter box rate"
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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isUsingDefault ? (
              <>Automatically set to 1.4× frame rate</>
            ) : (
              <>Custom box rate applied</>
            )}
          </div>
        </div>
      </div>

      {/* Rate Comparison Bar */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Rate Comparison
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Box/Frame:{" "}
            {globalFrameRate > 0
              ? (globalBoxRate / globalFrameRate).toFixed(2)
              : "0.00"}
            ×
          </span>
        </div>

        <div className="flex items-center h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 flex items-center justify-end pr-2"
            style={{
              width: `${
                globalFrameRate > 0
                  ? Math.min(
                      (globalFrameRate / (globalFrameRate + globalBoxRate)) *
                        100,
                      100
                    )
                  : 50
              }%`,
            }}
          >
            <span className="text-xs font-medium text-white">Frame</span>
          </div>
          <div
            className="h-full bg-green-500 transition-all duration-300 flex items-center pl-2"
            style={{
              width: `${
                globalBoxRate > 0
                  ? Math.min(
                      (globalBoxRate / (globalFrameRate + globalBoxRate)) * 100,
                      100
                    )
                  : 50
              }%`,
            }}
          >
            <span className="text-xs font-medium text-white">Box</span>
          </div>
        </div>

        <div className="flex justify-between mt-1">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Frame: {formatINR(globalFrameRate)}
          </div>
          <div
            className={`text-xs ${
              isUsingDefault
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            Box: {formatINR(globalBoxRate)}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
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
          <div className="space-y-1">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Changing the frame rate automatically updates the box rate to 1.4×
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                Frame: ₹{globalFrameRate}
              </span>
              <span className="text-gray-500">×</span>
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                1.4
              </span>
              <span className="text-gray-500">=</span>
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                Box: ₹{calculatedBoxRate.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Summary */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Frame Rate
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ₹{globalFrameRate}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Box Rate
            </div>
            <div
              className={`text-lg font-bold ${
                isUsingDefault
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              ₹{globalBoxRate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
