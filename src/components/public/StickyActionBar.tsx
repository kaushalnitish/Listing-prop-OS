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

  const agentName = contact.agentName || 'Estate Representative';
  const agentInitial = agentName.charAt(0).toUpperCase();
  const agencyTitle = contact.agencyName || contact.agentRole || 'Property Advisor';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/80 p-2 sm:p-4 shadow-lg w-full max-w-full overflow-hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* Agent Info Snippet */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 min-w-0">
          <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200/80 flex items-center justify-center font-serif font-semibold text-stone-800 text-xs shrink-0 shadow-2xs">
            {agentInitial}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-stone-900 truncate">
              {agentName}
            </p>
            <p className="text-[10px] text-stone-500 font-mono truncate">
              {agencyTitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full sm:w-auto flex items-center gap-2 sm:gap-2.5 justify-end min-w-0">
          {/* Call Button */}
          {contact.phone && (
            <a
              href={callUrl}
              className="flex-1 sm:flex-none px-2.5 sm:px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200/80 text-stone-800 font-medium text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 transition-all active:scale-[0.98] shadow-2xs min-w-0"
            >
              <Phone className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              <span className="truncate">Call Direct</span>
            </a>
          )}

          {/* WhatsApp / Inquire Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-3 sm:px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-xs active:scale-[0.98] min-w-0"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none shrink-0" />
            <span className="truncate">Inquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

