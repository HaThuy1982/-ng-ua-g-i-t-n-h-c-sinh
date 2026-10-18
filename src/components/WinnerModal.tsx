import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, UserMinus, X, Sparkles, Volume2 } from 'lucide-react';
import { Marble } from '../types';

interface WinnerModalProps {
  winner: Marble | null;
  isOpen: boolean;
  onClose: () => void;
  onRestartRace: () => void;
  onRemoveWinnerAndRerace: () => void;
}

export function speakStudentCall(name: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const text = `Mời em ${name} lên bảng!`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.toLowerCase().includes('vi'));
      if (viVoice) {
        utterance.voice = viVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Audio or speech synthesis not allowed or supported
    }
  }
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  isOpen,
  onClose,
  onRestartRace,
  onRemoveWinnerAndRerace,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      // Announce student name through speech synthesis
      speakStudentCall(winner.name);

      // Trigger joyful fireworks/confetti blast
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#ffd700', '#f59e0b', '#38bdf8', '#f43f5e', '#a855f7'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#ffd700', '#f59e0b', '#38bdf8', '#f43f5e', '#a855f7'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#111e48] via-[#0d1637] to-[#070c20] border-2 border-amber-400 rounded-3xl p-8 text-center shadow-[0_0_80px_rgba(255,215,0,0.5),0_25px_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Decorative Golden Ambient Rays */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy with Glowing Halo */}
        <div className="relative inline-block mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/30 via-amber-300/20 to-transparent flex items-center justify-center mx-auto ring-4 ring-amber-400/50 shadow-[0_0_30px_rgba(255,215,0,0.4)] animate-bounce duration-1000">
            <Trophy className="w-10 h-10 text-amber-300 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-spin duration-3000" />
        </div>

        {/* Subtitle with calling announcement */}
        <p className="text-xs uppercase tracking-[3px] font-bold text-amber-300 mb-1 flex items-center justify-center gap-1.5">
          <span>📢 GỌI TÊN HỌC SINH LÊN BẢNG</span>
        </p>

        {/* Winner Name in Giant Gold Typography */}
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(255,215,0,0.6)] mb-2">
          {winner.name}
        </h2>

        {/* Voice replay & time badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <button
            onClick={() => speakStudentCall(winner.name)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="Nghe lại loa phát âm gọi tên học sinh"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Gọi lại tên bằng loa</span>
          </button>

          {winner.finishTime !== undefined && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-sky-400/40 text-sky-200 text-xs font-bold shadow-sm">
              <span>⏱️ Về đích sau: <strong className="text-amber-300">{winner.finishTime}s</strong></span>
            </div>
          )}
        </div>

        {/* Call to Action Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-200 text-sm font-semibold mb-6 shadow-inner">
          <span>📋 Mời em <strong>{winner.name}</strong> lên bảng nghiệm thu thực hành!</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRestartRace}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.45)] hover:shadow-[0_0_30px_rgba(255,215,0,0.65)] active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Gọi Tên Lượt Kế Tiếp</span>
          </button>

          <button
            onClick={onRemoveWinnerAndRerace}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-amber-400/30 hover:border-amber-400 text-amber-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            title="Loại học sinh này để các lượt sau không gọi trùng lặp"
          >
            <UserMinus className="w-4 h-4 text-amber-400" />
            <span>Đã Gọi - Loại Khỏi Lượt Sau</span>
          </button>
        </div>
      </div>
    </div>
  );
};
