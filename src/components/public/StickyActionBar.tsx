import React from 'react';
import { AgentContact } from '../../types';
import { Phone, MessageSquare } from 'lucide-react';

interface StickyActionBarProps {
  contact: AgentContact;
  propertyTitle: string;
  price: number;
  currency: string;
}

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  contact,
  propertyTitle,
  price,
  currency,
}) => {
  const formattedPrice = new Intl.NumberFormat('en-US').format(price);

  // Clean WhatsApp number (digits only)
  const cleanWhatsApp = (contact.whatsappNumber || contact.phone || '').replace(/\D/g, '');

  const defaultMessage = `Hi ${contact.agentName}, I am inquiring about "${propertyTitle}" listed at ${currency}${formattedPrice}. Could you please share further details?`;

  const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  const callUrl = `tel:${contact.phone.replace(/\s+/g, '')}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 p-4 shadow-2xl">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Agent Info Snippet */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-medium text-zinc-200 text-sm shrink-0">
            {contact.agentName.charAt(0)}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-zinc-100">
              {contact.agentName}
            </p>
            <p className="text-[11px] text-zinc-400 font-mono">
              {contact.agencyName || 'Director of Estates'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full sm:w-auto flex items-center gap-3 justify-end">
          {/* Call Button */}
          <a
            href={callUrl}
            className="flex-1 sm:flex-none px-5 py-3 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Phone className="w-4 h-4 text-zinc-400" />
            <span>Call Direct</span>
          </a>

          {/* WhatsApp / Inquire Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4 fill-zinc-950 stroke-none" />
            <span>Inquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

