import React from 'react';
import { 
  Trophy, 
  Users, 
  Volume2, 
  VolumeX, 
  Music,
  FastForward, 
  Maximize, 
  Minimize, 
  Download, 
  Play, 
  RotateCcw,
  Timer,
  ChevronDown,
  Check
} from 'lucide-react';

interface NavbarProps {
  studentCount: number;
  onOpenStudents: () => void;
  onStartRace: () => void;
  onResetTrack: () => void;
  onDownloadOffline: () => void;
  raceState: 'idle' | 'countdown' | 'racing' | 'finished';
  soundEnabled: boolean;
  onToggleSound: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  speedMultiplier: number;
  onToggleSpeed: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  targetDuration: number;
  onSelectDuration: (seconds: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  studentCount,
  onOpenStudents,
  onStartRace,
  onResetTrack,
  onDownloadOffline,
  raceState,
  soundEnabled,
  onToggleSound,
  musicEnabled,
  onToggleMusic,
  speedMultiplier,
  onToggleSpeed,
  isFullscreen,
  onToggleFullscreen,
  targetDuration,
  onSelectDuration,
}) => {
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = React.useState(false);
  const [customInput, setCustomInput] = React.useState('');

  const isRacing = raceState === 'racing' || raceState === 'countdown';

  return (
    <header className="relative z-30 flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-[#0b1433] via-[#0e1c45] to-[#09112a] border-b border-[#ffd700]/30 shadow-[0_4px_30px_rgba(0,0,0,0.7)]">
      {/* Title & School Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd700] via-[#e5a710] to-[#b37e06] p-[2px] shadow-[0_0_15px_rgba(255,215,0,0.35)] flex items-center justify-center shrink-0">
          <div className="w-full h-full bg-[#091026] rounded-[10px] flex items-center justify-center text-[#ffd700]">
            <Trophy className="w-5 h-5 text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
          </div>
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-extrabold tracking-wide bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,215,0,0.25)]">
            Gọi Tên Học Sinh - Cô giáo Hà Thanh Thuỷ
          </h1>
          <p className="text-xs md:text-sm font-semibold tracking-wider text-sky-300/90 uppercase flex items-center gap-2">
            <span>THPT Lương Ngọc Quyến</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-amber-200/90 font-medium lowercase">đường đua kịch tính gọi học sinh lên bảng</span>
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Student list button */}
        <button
          onClick={onOpenStudents}
          className="px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-amber-400/30 hover:border-amber-400 text-slate-100 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          title="Xem và chỉnh sửa danh sách học sinh"
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Danh Sách</span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            {studentCount}
          </span>
        </button>

        {/* Dramatic Music BGM toggle */}
        <button
          onClick={onToggleMusic}
          className={`px-2.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
            musicEnabled
              ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 shadow-[0_0_10px_rgba(255,215,0,0.2)]'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-700/60'
          }`}
          title={musicEnabled ? 'Tắt nhạc nền kịch tính' : 'Bật nhạc nền kịch tính khi đua'}
        >
          <Music className={`w-4 h-4 ${musicEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">{musicEnabled ? 'Nhạc Đua: Bật' : 'Nhạc Đua: Tắt'}</span>
        </button>

        {/* Sound FX toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 md:px-2.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
            soundEnabled
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
          }`}
          title={soundEnabled ? 'Tắt hiệu ứng va chạm' : 'Bật hiệu ứng va chạm'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Hiệu Ứng: Bật' : 'Hiệu Ứng: Tắt'}</span>
        </button>

        {/* Speed toggle */}
        <button
          onClick={onToggleSpeed}
          className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-amber-400/30 text-amber-200 text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          title="Điều chỉnh tốc độ đua"
        >
          <FastForward className="w-4 h-4 text-amber-400" />
          <span>{speedMultiplier}x</span>
        </button>

        {/* Time Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsTimeDropdownOpen((prev) => !prev)}
            disabled={isRacing}
            className={`px-2.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all active:scale-95 disabled:opacity-50 ${
              isTimeDropdownOpen
                ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-amber-400/30 text-amber-200 hover:text-white'
            }`}
            title="Chọn thời gian thi đấu (tính bằng giây)"
          >
            <Timer className="w-4 h-4 text-amber-400" />
            <span>
              <span className="hidden sm:inline">Thời Gian: </span>
              <strong>{targetDuration}s</strong>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isTimeDropdownOpen && (
            <>
              {/* Backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsTimeDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 p-3 bg-gradient-to-b from-[#111e48] via-[#0d173a] to-[#080d22] border-2 border-amber-400/60 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(255,215,0,0.25)] z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-400/20 text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Chọn Thời Gian (Giây)</span>
                  </span>
                  <span className="text-[10px] text-sky-300/80 font-normal">Tối đa 180s</span>
                </div>

                {/* Preset Buttons Grid */}
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[
                    { secs: 15, label: '15s', desc: 'Chớp nhoáng' },
                    { secs: 20, label: '20s', desc: 'Nhanh' },
                    { secs: 30, label: '30s', desc: 'Chuẩn' },
                    { secs: 45, label: '45s', desc: 'Kịch tính' },
                    { secs: 60, label: '60s', desc: 'Bền bỉ' },
                    { secs: 90, label: '90s', desc: 'Thử thách' },
                  ].map((p) => {
                    const isSelected = targetDuration === p.secs;
                    return (
                      <button
                        key={p.secs}
                        onClick={() => {
                          onSelectDuration(p.secs);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 hover:border-amber-400/50'
                        }`}
                      >
                        <span className="text-xs font-black flex items-center gap-0.5">
                          {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                          {p.label}
                        </span>
                        <span className={`text-[9px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Seconds Input */}
                <div className="pt-2 border-t border-amber-400/20">
                  <label className="block text-[11px] text-slate-300 font-medium mb-1.5">
                    Hoặc nhập số giây tùy chọn:
                  </label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = parseInt(customInput, 10);
                      if (!isNaN(val) && val >= 5 && val <= 180) {
                        onSelectDuration(val);
                        setCustomInput('');
                        setIsTimeDropdownOpen(false);
                      }
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="number"
                      min={5}
                      max={180}
                      placeholder="10 - 180s"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-amber-300 text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500 font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={!customInput || isNaN(parseInt(customInput, 10))}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs disabled:opacity-40 active:scale-95 transition-all shadow-sm"
                    >
                      Áp Dụng
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>


        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className={`px-2.5 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
            isFullscreen
              ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-[0_0_15px_rgba(255,215,0,0.5)]'
              : 'bg-slate-800/80 hover:bg-slate-700/80 border-amber-400/30 text-slate-200 hover:text-white'
          }`}
          title={isFullscreen ? 'Thu nhỏ cửa sổ (Esc hoặc F)' : 'Mở toàn màn hình chiếu lớp (F)'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-slate-950" /> : <Maximize className="w-4 h-4 text-amber-400" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Thu Nhỏ' : 'Toàn Màn Hình'}</span>
        </button>

        {/* Download Standalone Single HTML Button */}
        <button
          onClick={onDownloadOffline}
          className="px-3 py-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-400/40 hover:border-indigo-300 text-indigo-200 text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Tải về 1 file .html duy nhất để mở offline không cần mạng"
        >
          <Download className="w-4 h-4 text-indigo-300" />
          <span className="hidden lg:inline">Tải File HTML Offline</span>
        </button>

        {/* Reset Track Button */}
        <button
          onClick={onResetTrack}
          disabled={isRacing}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-amber-400/30 text-amber-300 disabled:opacity-40 transition-all active:scale-95"
          title="Đặt lại các viên bi về vạch xuất phát"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Big Gleaming Start Button */}
        <button
          onClick={onStartRace}
          disabled={isRacing}
          className="relative px-5 py-2.5 rounded-lg font-black text-xs md:text-sm tracking-wide text-slate-950 uppercase transition-all duration-200 shadow-[0_0_20px_rgba(255,215,0,0.45)] hover:shadow-[0_0_30px_rgba(255,215,0,0.7)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:via-yellow-300 hover:to-amber-400"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Play className="w-4 h-4 fill-slate-950" />
            <span>{isRacing ? 'Đang Đua Gọi Tên...' : 'Bắt Đầu Gọi Tên'}</span>
          </span>
          <div className="absolute inset-0 bg-white/25 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>
    </header>
  );
};
