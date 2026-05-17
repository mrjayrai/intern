import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { NotificationCenter } from './NotificationCenter';

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-border bg-background px-4 md:px-6">
          <NotificationCenter />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
