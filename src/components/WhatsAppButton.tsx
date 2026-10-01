import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/213"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] end-[calc(1.5rem+env(safe-area-inset-right,0px))] z-50 w-14 h-14 bg-visa-green rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      aria-label="WhatsApp Support"
    >
      <MessageCircle className="w-6 h-6 text-accent-foreground" />
    </a>
  );
};

export default WhatsAppButton;
