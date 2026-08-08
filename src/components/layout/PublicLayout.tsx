import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans antialiased selection:bg-stone-200 selection:text-stone-900">
      <div className="w-full min-h-screen relative">
        {children}
      </div>
    </div>
  );
};


