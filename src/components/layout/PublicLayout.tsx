import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans antialiased selection:bg-stone-200 selection:text-stone-900 overflow-x-hidden max-w-full">
      <div className="w-full max-w-full relative overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};


