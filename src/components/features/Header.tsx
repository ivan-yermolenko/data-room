import React from 'react';
import { Search, LogIn, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: { name: string; email: string; picture?: string } | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  user,
  onLoginClick,
  onLogoutClick,
  onMenuClick,
}) => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 gap-2 sm:gap-4 shrink-0 text-foreground select-none">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
        title="Open menu"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files and folders..."
            aria-label="Search files and folders"
            className="w-full text-sm bg-background border border-input rounded-xl pl-10 pr-4 py-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex sm:flex-col text-right">
              <span className="text-xs font-semibold truncate max-w-[150px]">{user.name}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{user.email}</span>
            </div>
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {(user.name.trim() || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={onLogoutClick}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            aria-label="Sign In"
            title="Sign In"
            className="flex items-center gap-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary/90 font-medium p-2.5 sm:px-4 sm:py-2 rounded-xl transition-all cursor-pointer border border-primary/20 shrink-0"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
