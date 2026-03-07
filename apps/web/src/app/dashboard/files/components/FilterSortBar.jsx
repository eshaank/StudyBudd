"use client";

import { FILTER_OPTIONS, SORT_OPTIONS } from "../../../../constants/files";

export default function FilterSortBar({
  activeFilter,
  setActiveFilter,
  sortBy,
  setSortBy,
  filteredCount,
  totalCount,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveFilter(option.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeFilter === option.id
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">
          {filteredCount} of {totalCount} file{totalCount !== 1 ? "s" : ""}
        </span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
