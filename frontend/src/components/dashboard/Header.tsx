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
    <header className="bg-[#FAF8F5]/80 backdrop-blur-md border-b border-[#E7E5E4] px-6 py-4 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search documents by title or owner..."
          className="w-full bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917] shadow-2xs"
        />
      </div>

      {/* Control Bar: Sort, Filter, Grid/List Toggle */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
        {/* Filter Dropdown */}
        <div className="flex items-center space-x-1 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl px-3 py-1.5 shadow-2xs">
          <Filter className="w-3.5 h-3.5 text-[#78716C]" />
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#44403C] focus:outline-none cursor-pointer"
          >
            <option value="all">All Formats</option>
            <option value="blank">Blank Docs</option>
            <option value="template">Templates</option>
            <option value="docx">Word (.docx)</option>
            <option value="markdown">Markdown (.md)</option>
            <option value="pdf">PDF (.pdf)</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-1 bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl px-3 py-1.5 shadow-2xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#78716C]" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#44403C] focus:outline-none cursor-pointer"
          >
            <option value="updated">Last Updated</option>
            <option value="title">Title A-Z</option>
            <option value="created">Created Date</option>
          </select>
        </div>

        {/* Grid / List Toggle */}
        <div className="flex items-center bg-[#F4F0EA] border border-[#E7E5E4] rounded-xl p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs font-bold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            title="List View"
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs font-bold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
