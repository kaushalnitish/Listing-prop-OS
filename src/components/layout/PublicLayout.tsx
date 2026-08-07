import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-zinc-100 selection:text-zinc-950">
      <div className="w-full min-h-screen relative">
        {children}
      </div>
    </div>
  );
};

