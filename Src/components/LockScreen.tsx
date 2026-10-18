import React, { useState, useEffect, useRef } from 'react';
import { SecurityConfig } from '../types';
import { Lock, Delete, KeyRound, Grid, ShieldAlert } from 'lucide-react';

interface LockScreenProps {
  security: SecurityConfig;
  onUnlock: () => void;
  language: 'ar' | 'en';
}

export const LockScreen: React.FC<LockScreenProps> = ({ security, onUnlock, language }) => {
  const [mode, setMode] = useState<'pin' | 'pattern'>(security.type === 'pattern' ? 'pattern' : 'pin');
  const [pinInput, setPinInput] = useState<string>('');
  const [patternInput, setPatternInput] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const isRTL = language === 'ar';

  const requiredLength = security.pin ? security.pin.length : 4;

  const handlePinDigit = (digit: string) => {
    if (pinInput.length >= 6) return;
    const next = pinInput + digit;
    setPinInput(next);
    setErrorMsg('');

    if (next.length === requiredLength) {
      if (next === security.pin) {
        onUnlock();
      } else {
        setErrorMsg(isRTL ? 'رمز PIN غير صحيح!' : 'Incorrect PIN!');
        setTimeout(() => {
          setPinInput('');
          setErrorMsg('');
        }, 1000);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  // Pattern handling
  const patternGridRef = useRef<HTMLDivElement>(null);

  const getDotIndexFromPoint = (clientX: number, clientY: number): number | null => {
    if (!patternGridRef.current) return null;
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      if (el.hasAttribute('data-dot-index')) {
        return parseInt(el.getAttribute('data-dot-index')!, 10);
      }
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setPatternInput([]);
    setErrorMsg('');

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dot = getDotIndexFromPoint(clientX, clientY);
    if (dot !== null) {
      setPatternInput([dot]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dot = getDotIndexFromPoint(clientX, clientY);
    if (dot !== null && !patternInput.includes(dot)) {
      setPatternInput((prev) => [...prev, dot]);
    }
  };

  const handleTouchEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (patternInput.length < 4) {
      setErrorMsg(isRTL ? 'ارسم 4 نقاط على الأقل' : 'Draw at least 4 dots');
      setPatternInput([]);
      return;
    }

    if (JSON.stringify(patternInput) === JSON.stringify(security.pattern)) {
      onUnlock();
    } else {
      setErrorMsg(isRTL ? 'النمط غير مطابق!' : 'Pattern does not match!');
      setTimeout(() => {
        setPatternInput([]);
        setErrorMsg('');
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#140b2a] to-[#0a0a1a] p-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-[#14142b]/95 p-6 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-500/40 animate-pulse-glow">
          <Lock className="h-10 w-10 text-white" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white">
          {isRTL ? 'المحفظة المالية الذكية' : 'Smart Wallet'}
        </h2>
        <p className="mt-1 text-sm text-purple-200/70">
          {isRTL ? 'التطبيق مقفل لحماية بياناتك المالية' : 'Locked for security'}
        </p>

        {/* Lock Mode Switcher if both configured */}
        <div className="mt-5 flex gap-2 rounded-xl bg-purple-950/40 p-1 border border-purple-800/40">
          <button
            type="button"
            onClick={() => setMode('pin')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'pin' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>PIN</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('pattern')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'pattern' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>{isRTL ? 'النمط' : 'Pattern'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/20 py-1.5 text-xs font-bold text-red-300 border border-red-500/40 animate-bounce">
            <ShieldAlert className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Mode */}
        {mode === 'pin' && (
          <div className="mt-6">
            <div className="mb-6 flex justify-center gap-3">
              {Array.from({ length: requiredLength }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                    i < pinInput.length
                      ? 'scale-110 border-purple-400 bg-purple-500 shadow-md shadow-purple-500/60'
                      : 'border-purple-800/80 bg-purple-950/40'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="flex h-14 items-center justify-center rounded-2xl border border-purple-900/50 bg-purple-950/30 text-2xl font-bold text-purple-100 transition-all hover:bg-purple-600 active:scale-95 active:bg-purple-700"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="flex h-14 items-center justify-center rounded-2xl border border-purple-900/50 bg-purple-950/30 text-2xl font-bold text-purple-100 transition-all hover:bg-purple-600 active:scale-95 active:bg-purple-700"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="flex h-14 items-center justify-center rounded-2xl border border-purple-900/50 bg-purple-950/40 text-purple-300 transition-all hover:bg-red-600/40 active:scale-95"
              >
                <Delete className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Pattern Mode */}
        {mode === 'pattern' && (
          <div className="mt-6">
            <p className="mb-3 text-xs text-purple-300">
              {isRTL ? 'صل النقاط حسب النمط المحفوظ' : 'Connect the dots in order'}
            </p>
            <div
              ref={patternGridRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              className="mx-auto grid h-64 w-64 select-none grid-cols-3 grid-rows-3 gap-4 rounded-2xl border border-purple-800/40 bg-purple-950/30 p-6 touch-none"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                const isActive = patternInput.includes(index);
                return (
                  <div
                    key={index}
                    data-dot-index={index}
                    className="flex items-center justify-center"
                  >
                    <div
                      className={`h-6 w-6 rounded-full border-2 transition-transform duration-200 ${
                        isActive
                          ? 'scale-125 border-purple-300 bg-pink-500 shadow-lg shadow-pink-500/70'
                          : 'border-purple-700/60 bg-purple-900/40'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
