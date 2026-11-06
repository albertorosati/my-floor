import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Wifi, Check, Copy, ExternalLink } from 'lucide-react';
import { AppLanguage } from '../types/game';

interface PhoneMicModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isConnected: boolean;
  language?: AppLanguage;
}

export const PhoneMicModal: React.FC<PhoneMicModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  isConnected,
  language = 'it',
}) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const companionUrl = `https://albertorosati.github.io/yappik/?room=${encodeURIComponent(roomCode)}`;

  useEffect(() => {
    if (!isOpen) return;

    QRCode.toString(companionUrl, {
      type: 'svg',
      margin: 1,
      width: 220,
      color: {
        dark: '#14121F',
        light: '#FFFDF5',
      },
    })
      .then((svg) => {
        setQrSvg(svg);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [isOpen, companionUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(companionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isIt = language === 'it';

  return (
    <div className="fixed inset-0 z-50 bg-[#14121F]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-paper max-w-md w-full p-6 relative flex flex-col items-center text-center modal-slap-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-paper hover:bg-yellow border-[3px] border-ink shadow-hard-sm transition-transform active:translate-y-0.5"
          aria-label="Chiudi"
        >
          <X className="w-5 h-5 text-ink" />
        </button>

        {/* Modal Header */}
        <div className="w-12 h-12 rounded-2xl bg-yellow border-[3px] border-ink shadow-hard-sm flex items-center justify-center mb-3">
          <Smartphone className="w-6 h-6 text-ink" />
        </div>

        <h3 className="font-display font-black text-2xl text-ink leading-tight mb-1">
          {isIt ? 'Microfono Smartphone' : 'Smartphone Voice Remote'}
        </h3>
        <p className="font-sans font-semibold text-xs sm:text-sm text-ink/75 max-w-xs mb-4">
          {isIt
            ? 'Inquadra il QR con la fotocamera del tuo cellulare per usarlo come microfono wireless!'
            : 'Scan with your mobile camera to use your phone as a live wireless mic!'}
        </p>

        {/* Live Status Pill */}
        <div
          className={`px-3.5 py-1.5 rounded-full border-[2px] border-ink text-xs font-display font-bold flex items-center gap-1.5 mb-4 shadow-hard-sm ${
            isConnected
              ? 'bg-green text-ink animate-bounce'
              : 'bg-yellow text-ink'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>
            {isConnected
              ? isIt
                ? '📱 Telefono Connesso • Riconoscimento Attivo'
                : '📱 Phone Connected • Voice Active'
              : isIt
              ? 'In attesa dello smartphone...'
              : 'Waiting for phone connection...'}
          </span>
        </div>

        {/* QR Code Container */}
        <div className="p-3 bg-paper border-[3px] border-ink rounded-2xl shadow-hard mb-4 flex items-center justify-center">
          {qrSvg ? (
            <div
              className="w-[200px] h-[200px] flex items-center justify-center select-none"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center text-xs font-bold text-ink/50">
              Generazione QR...
            </div>
          )}
        </div>

        {/* How it works steps */}
        <div className="w-full bg-[#1B1B3A]/5 rounded-xl p-3 border-[2px] border-ink/20 text-left mb-4">
          <ol className="text-xs font-sans font-medium text-ink/80 space-y-1 list-decimal list-inside">
            <li>
              {isIt
                ? 'Apri la fotocamera del telefono (Safari o Chrome).'
                : 'Open your phone camera (Safari or Chrome).'}
            </li>
            <li>
              {isIt
                ? 'Tocca il link che appare a schermo.'
                : 'Tap the link banner that pops up.'}
            </li>
            <li>
              {isIt
                ? 'Parla al telefono: le risposte indovineranno le foto su Discord!'
                : 'Speak into your phone: your voice will guess photos on Discord!'}
            </li>
          </ol>
        </div>

        {/* Action Buttons: Copy link & Done */}
        <div className="w-full flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 btn-push py-2.5 px-3 rounded-xl bg-paper text-ink font-display font-bold text-xs flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green" />
                <span>{isIt ? 'Copiato!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{isIt ? 'Copia Link' : 'Copy Link'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-push py-2.5 px-3 rounded-xl bg-yellow text-ink font-display font-black text-xs"
          >
            {isIt ? 'Chiudi' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
