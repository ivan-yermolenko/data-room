import React, { useState } from 'react';
import { Sidebar } from '@/components/features/Sidebar';
import { Header } from '@/components/features/Header';
import { Breadcrumbs } from '@/components/features/Breadcrumbs';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewFolderClick: () => void;
  onUploadFileClick: () => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children,
  searchQuery,
  onSearchChange,
  onNewFolderClick,
  onUploadFileClick,
}) => {
  const { user, login, logout } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');


  const handleMockLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !emailInput.trim()) return;

    login({
      name: usernameInput.trim(),
      email: emailInput.trim(),
    });

    setUsernameInput('');
    setEmailInput('');
    setShowLoginModal(false);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setUsernameInput('');
    setEmailInput('');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          onNewFolderClick={onNewFolderClick}
          onUploadFileClick={onUploadFileClick}
        />
      </div>

      <div
        className={`md:hidden fixed inset-0 z-40 flex transition-opacity duration-300 ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Sidebar"
      >
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          role="presentation"
        />
        <div
          className={`relative flex flex-col w-64 h-full bg-card border-r border-border shadow-2xl transition-transform duration-300 transform ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            onNewFolderClick={onNewFolderClick}
            onUploadFileClick={onUploadFileClick}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogoutClick={logout}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <Breadcrumbs />

        {/* Workspace Main Panel */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6 relative">
          {children}
        </main>
      </div>

      <Modal
        isOpen={showLoginModal}
        onClose={handleCloseLoginModal}
        title="Sign In to Acme Data Room"
        description="Enter mock credentials to simulate authentication."
      >
        <form onSubmit={handleMockLoginSubmit} className="space-y-4 mt-2">
          <div>
            <label 
              htmlFor="login-fullname" 
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Full Name
            </label>
            <input
              id="login-fullname"
              type="text"
              required
              autoComplete="name"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full text-sm bg-background border border-input rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
          </div>

          <div>
            <label 
              htmlFor="login-email" 
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. john.doe@acme.com"
              className="w-full text-sm bg-background border border-input rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseLoginModal}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground font-medium rounded-xl hover:bg-accent transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/95 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
