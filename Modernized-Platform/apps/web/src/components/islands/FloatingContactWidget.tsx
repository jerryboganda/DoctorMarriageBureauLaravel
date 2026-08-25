import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, X, Send, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Popup Menu */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-brand-100/80 overflow-hidden transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Doctor Marriage Bureau</h4>
                <p className="text-white/80 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Matchmakers Online Now
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close contact options"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options Body */}
          <div className="p-4 space-y-2.5 bg-gradient-to-b from-brand-50/30 to-white">
            <p className="text-xs text-navy-600 mb-2">
              Connect directly with our dedicated matrimonial consultants:
            </p>

            {/* WhatsApp */}
            <a 
              href="https://wa.me/923368899996?text=Assalam%20o%20Alaikum,%20I%20am%20interested%20in%20Doctor%20Marriage%20Bureau%20matchmaking%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  WA
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-emerald-950 group-hover:text-emerald-700">Chat on WhatsApp</h5>
                  <p className="text-[11px] text-emerald-700">+92 33 68899 996 (Instant Reply)</p>
                </div>
              </div>
              <Send className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Direct Phone Call */}
            <a 
              href="tel:+923368899996"
              className="flex items-center justify-between p-3 rounded-xl bg-navy-50 hover:bg-navy-100/80 border border-navy-200/60 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-navy-800 text-white flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-navy-950 group-hover:text-navy-700">Direct Phone Call</h5>
                  <p className="text-[11px] text-navy-600">+92 33 68899 996 / +92 339 8080808</p>
                </div>
              </div>
              <Phone className="w-4 h-4 text-navy-600" />
            </a>

            {/* Email Support */}
            <a 
              href="mailto:support@doctormarriagebureau.com.pk"
              className="flex items-center justify-between p-3 rounded-xl bg-brand-50 hover:bg-brand-100/80 border border-brand-200/60 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center shadow-sm">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-brand-950 group-hover:text-brand-700">Email Bureau Support</h5>
                  <p className="text-[11px] text-brand-700">support@doctormarriagebureau.com.pk</p>
                </div>
              </div>
              <Mail className="w-4 h-4 text-brand-600" />
            </a>
          </div>

          {/* Footer note */}
          <div className="bg-navy-50 px-4 py-2.5 border-t border-navy-100/80 flex items-center justify-center gap-1.5 text-[11px] text-navy-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Confidential & Secure Matrimonial Support</span>
          </div>

        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group p-4 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-xl shadow-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/40 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
        aria-label="Open contact and support menu"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
        </span>
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  );
}
