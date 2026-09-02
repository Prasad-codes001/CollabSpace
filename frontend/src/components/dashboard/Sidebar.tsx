import React from 'react';
import {
  Layers,
  Home,
  FileText,
  Users,
  FolderKanban,
  Clock,
  Star,
  Trash2,
  Settings,
  LogOut,
  Activity,
  Plus,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserAvatar } from '../ui/UserAvatar';

export type DashboardTab =
  | 'home'
  | 'my-documents'
  | 'shared'
  | 'workspaces'
  | 'activity'
  | 'recent'
  | 'starred'
  | 'trash'
  | 'settings';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onNewDoc: () => void;
  onLogout: () => void;
  onLogoClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onNewDoc,
  onLogout,
  onLogoClick,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const mainNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'my-documents', label: 'My Documents', icon: FileText },
    { id: 'shared', label: 'Shared With Me', icon: Users },
    { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <aside aria-label="Application navigation" className="w-64 bg-[#FAF8F5] dark:bg-[#181614] border-r border-[#E7E5E4] dark:border-[#383430] hidden md:flex flex-col justify-between h-screen sticky top-0 shrink-0 text-left select-none transition-colors">
      <div className="p-4 space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-2">
          <button onClick={onLogoClick} className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0">
            <div className="w-8 h-8 rounded-lg bg-[#1C1917] dark:bg-[#221F1D] dark:border dark:border-[#383430] text-[#FAF8F5] flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-editorial text-lg font-bold tracking-tight text-[#1C1917] dark:text-[#FAF8F5]">
                Collab<span className="text-[#D97706]">Space</span>
              </span>
            </div>
          </button>
        </div>

        {/* Action Button Group */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onNewDoc}
            className="w-full flex items-center justify-center gap-2 bg-[#1C1917] hover:bg-[#292524] dark:bg-[#221F1D] dark:hover:bg-[#2B2724] dark:border dark:border-[#383430] text-[#FAF8F5] text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>New Document</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav aria-label="Main navigation" className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as DashboardTab)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#E7E5E4] dark:bg-[#2B2724] text-[#1C1917] dark:text-[#FAF8F5] font-bold border border-transparent dark:border-[#383430]'
                    : 'text-[#57534E] dark:text-[#A8A29E] hover:bg-[#F4F0EA] dark:hover:bg-[#221F1D] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D97706]' : 'text-[#78716C] dark:text-[#8C857F]'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Settings */}
      <div className="p-4 border-t border-[#E7E5E4] dark:border-[#383430] space-y-3">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#57534E] dark:text-[#A8A29E] hover:bg-[#F4F0EA] dark:hover:bg-[#221F1D] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] transition-colors border border-transparent hover:border-[#E7E5E4] dark:hover:border-[#383430]"
        >
          <span className="flex items-center gap-3">
            {theme === 'light' ? <Moon className="w-4 h-4 text-[#78716C]" /> : <Sun className="w-4 h-4 text-[#D97706]" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <span className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-colors ${theme === 'dark' ? 'bg-[#D97706] justify-end' : 'bg-[#E7E5E4] justify-start'}`}>
            <span className="w-3 h-3 bg-white rounded-full shadow-xs block" />
          </span>
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'settings'
              ? 'bg-[#E7E5E4] dark:bg-[#2B2724] text-[#1C1917] dark:text-[#FAF8F5] border border-transparent dark:border-[#383430]'
              : 'text-[#57534E] dark:text-[#A8A29E] hover:bg-[#F4F0EA] dark:hover:bg-[#221F1D] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]'
          }`}
        >
          <Settings className="w-4 h-4 text-[#78716C] dark:text-[#8C857F]" />
          <span>Settings</span>
        </button>

        {/* User Card */}
        <div className="pt-2 flex items-center justify-between px-2 bg-[#F4F0EA] dark:bg-[#221F1D] p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#383430]">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] truncate">
                {user?.name || 'User'}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] hover:bg-[#E7E5E4] dark:hover:bg-[#2B2724] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
