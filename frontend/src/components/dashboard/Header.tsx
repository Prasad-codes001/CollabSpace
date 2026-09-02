import React from 'react';
import { Search, LayoutGrid, List, Filter, ArrowUpDown } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  filterType,
  onFilterChange,
}) => {
  return (
    <header className="bg-[#FAF8F5]/80 dark:bg-[#181614]/80 backdrop-blur-md border-b border-[#E7E5E4] dark:border-[#383430] px-6 py-4 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search documents by title or owner..."
          className="w-full bg-[#FFFFFF] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1C1917] dark:text-[#FAF8F5] placeholder-[#78716C] dark:placeholder-[#8C857F] focus:outline-none focus:ring-2 focus:ring-[#1C1917] dark:focus:ring-[#D97706] shadow-2xs transition-colors"
        />
      </div>

      {/* Control Bar: Sort, Filter, Grid/List Toggle */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
        {/* Filter Dropdown */}
        <div className="flex items-center space-x-1 bg-[#FFFFFF] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-xl px-3 py-1.5 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E]" />
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#44403C] dark:text-[#E7E5E4] focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">All Formats</option>
            <option value="blank" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Blank Docs</option>
            <option value="template" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Templates</option>
            <option value="docx" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Word (.docx)</option>
            <option value="markdown" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Markdown (.md)</option>
            <option value="pdf" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">PDF (.pdf)</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-1 bg-[#FFFFFF] dark:bg-[#221F1D] border border-[#E7E5E4] dark:border-[#383430] rounded-xl px-3 py-1.5 shadow-2xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E]" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#44403C] dark:text-[#E7E5E4] focus:outline-none cursor-pointer"
          >
            <option value="updated" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Last Updated</option>
            <option value="title" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Title A-Z</option>
            <option value="created" className="bg-white dark:bg-[#221F1D] text-[#1C1917] dark:text-[#FAF8F5]">Created Date</option>
          </select>
        </div>

        {/* Grid / List Toggle */}
        <div className="flex items-center bg-[#F4F0EA] dark:bg-[#181614] border border-[#E7E5E4] dark:border-[#383430] rounded-xl p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#FFFFFF] dark:bg-[#332F2B] text-[#1C1917] dark:text-[#FAF8F5] shadow-xs font-bold'
                : 'text-[#78716C] dark:text-[#8C857F] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            title="List View"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-[#FFFFFF] dark:bg-[#332F2B] text-[#1C1917] dark:text-[#FAF8F5] shadow-xs font-bold'
                : 'text-[#78716C] dark:text-[#8C857F] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
