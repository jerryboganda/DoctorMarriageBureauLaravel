import { ReactNode } from 'react';

export default function BlankLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50 to-cyan-100">
      {children}
    </div>
  );
}
