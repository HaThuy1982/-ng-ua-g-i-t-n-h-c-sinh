import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { TrackCanvas } from './components/TrackCanvas';
import { StudentManagerModal } from './components/StudentManagerModal';
import { WinnerModal } from './components/WinnerModal';
import { Marble, RaceState } from './types';
import { sound } from './utils/audio';
import { downloadStandaloneHtmlFile } from './utils/offlineHtmlGenerator';
import { History, Sparkles, CheckCircle2 } from 'lucide-react';

const COLOR_PALETTES = [
  { primary: '#ff3366', secondary: '#ff99b3' },
  { primary: '#00d2ff', secondary: '#80e8ff' },
  { primary: '#ffaa00', secondary: '#ffe066' },
  { primary: '#10b981', secondary: '#6ee7b7' },
  { primary: '#8b5cf6', secondary: '#c4b5fd' },
  { primary: '#ec4899', secondary: '#fbcfe8' },
  { primary: '#f43f5e', secondary: '#fda4af' },
  { primary: '#eab308', secondary: '#fef08a' },
  { primary: '#06b6d4', secondary: '#a5f3fc' },
  { primary: '#3b82f6', secondary: '#93c5fd' },
  { primary: '#d946ef', secondary: '#f5d0fe' },
  { primary: '#14b8a6', secondary: '#99f6e4' },
];

const INITIAL_NAMES = `Nguyễn Hoàng Long
Trần Thị Mai Anh
Lê Đức Minh
Phạm Thuỳ Trang
Vũ Gia Huy
Đặng Ngọc Bảo
Bùi Khánh Linh`;

export default function App() {
  const [rawNames, setRawNames] = useState<string>(INITIAL_NAMES);
  const [marbles, setMarbles] = useState<Marble[]>([]);
  const [raceState, setRaceState] = useState<RaceState>('idle');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [winner, setWinner] = useState<Marble | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [targetDuration, setTargetDuration] = useState<number>(30); // Race duration in seconds
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const studentNames = useMemo(() => {
    return rawNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  }, [rawNames]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Generate marbles positioned behind starting gate (wide funnel)
  const initMarbles = useCallback((names: string[]) => {
    const funnelLeft = 390;
    const funnelRight = 810;
    const span = funnelRight - funnelLeft;
    const count = names.length;

    const list: Marble[] = names.map((name, idx) => {
      const palette = COLOR_PALETTES[idx % COLOR_PALETTES.length];
      const row = Math.floor(idx / 8);
      const col = idx % 8;
      const totalInRow = Math.min(8, count - row * 8);
      const colStep = span / (totalInRow + 1);

      return {
        id: `m_${idx}_${name}`,
        name,
        x: funnelLeft + (col + 1) * colStep + (Math.random() - 0.5) * 8,
        y: 45 + row * 26 + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0,
        radius: 16,
        color: palette.primary,
        secondaryColor: palette.secondary,
        glow: 0,
        highlightTimer: 0,
        stuckTimer: 0,
      };
    });

    setMarbles(list);
  }, []);

  // Update marbles whenever student names change
  useEffect(() => {
    if (raceState === 'idle') {
      initMarbles(studentNames);
    }
  }, [studentNames, raceState, initMarbles]);

  // Handle Start Race with dramatic countdown and BGM
  const handleStartRace = useCallback(() => {
    if (raceState === 'racing' || raceState === 'countdown') return;

    if (studentNames.length === 0) {
      setIsStudentModalOpen(true);
      return;
    }

    sound.stopBgm(true);
    setWinner(null);
    setIsWinnerModalOpen(false);
    initMarbles(studentNames);

    setRaceState('countdown');
    setCountdownValue(3);
    sound.playCountdown(false);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdownValue(count);

      if (count > 0) {
        sound.playCountdown(false);
      } else if (count === 0) {
        sound.playCountdown(true);
        setRaceState('racing');
        sound.startBgm(); // Start dramatic background music right as marbles drop!
        clearInterval(timer);
      }
    }, 900);
  }, [raceState, studentNames, initMarbles]);

  const handleResetTrack = useCallback(() => {
    sound.stopBgm();
    setRaceState('idle');
    setWinner(null);
    setIsWinnerModalOpen(false);
    initMarbles(studentNames);
  }, [studentNames, initMarbles]);

  const handleFinish = useCallback((winningMarble: Marble) => {
    sound.stopBgm(); // Stop dramatic music immediately upon reaching finish line!
    setRaceState('finished');
    setWinner(winningMarble);
    setSelectedHistory((prev) => [winningMarble.name, ...prev.filter((n) => n !== winningMarble.name)]);
    setTimeout(() => {
      setIsWinnerModalOpen(true);
    }, 350);
  }, []);

  const handleRemoveWinnerAndRerace = () => {
    if (!winner) return;
    const filtered = studentNames.filter((n) => n.toLowerCase() !== winner.name.toLowerCase());
    setRawNames(filtered.join('\n'));
    setIsWinnerModalOpen(false);
    showToast(`Đã loại học sinh: ${winner.name} khỏi danh sách.`);
    setTimeout(() => {
      handleStartRace();
    }, 200);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    sound.setMusicEnabled(next);
    if (!next) {
      sound.stopBgm();
    } else if (raceState === 'racing') {
      sound.startBgm();
    }
  };

  const handleToggleSpeed = () => {
    if (speedMultiplier === 1) setSpeedMultiplier(1.5);
    else if (speedMultiplier === 1.5) setSpeedMultiplier(2);
    else setSpeedMultiplier(1);
  };

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Sync fullscreen state with browser (F11, Esc, or UI)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcuts for classroom presenters (Space = Start/Reset, F = Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in textarea or modal
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (raceState === 'idle' || raceState === 'finished') {
          handleStartRace();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleToggleFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceState, handleStartRace, handleToggleFullscreen]);

  const handleDownloadOffline = () => {
    downloadStandaloneHtmlFile();
    showToast('Đang tải file HTML Offline! Bạn có thể mở trực tiếp mà không cần mạng.');
  };

  // Find leader for live status badge
  const leader = useMemo(() => {
    if (raceState !== 'racing' || marbles.length === 0) return null;
    return marbles.reduce((prev, curr) => (curr.y > prev.y ? curr : prev), marbles[0]);
  }, [marbles, raceState]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b19] font-['Be_Vietnam_Pro',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        studentCount={studentNames.length}
        onOpenStudents={() => setIsStudentModalOpen(true)}
        onStartRace={handleStartRace}
        onResetTrack={handleResetTrack}
        onDownloadOffline={handleDownloadOffline}
        raceState={raceState}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        musicEnabled={musicEnabled}
        onToggleMusic={handleToggleMusic}
        speedMultiplier={speedMultiplier}
        onToggleSpeed={handleToggleSpeed}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        targetDuration={targetDuration}
        onSelectDuration={setTargetDuration}
      />

      {/* Main Playing Field */}
      <main className="relative flex-1 w-full h-full flex flex-col items-center justify-center overflow-hidden">
        {/* Floating Race Status Badge */}
        <div className="absolute top-3 z-20 pointer-events-none flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#091129]/80 border border-amber-400/40 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              raceState === 'racing'
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]'
                : raceState === 'countdown'
                ? 'bg-amber-400 animate-ping'
                : 'bg-sky-400'
            }`}
          />
          <span className="text-xs sm:text-sm font-bold text-amber-200">
            {raceState === 'idle' && `Đường đua sẵn sàng • Thời gian: ${targetDuration}s`}
            {raceState === 'countdown' && `Chuẩn bị xuất phát: ${countdownValue > 0 ? countdownValue : 'GO!'}`}
            {raceState === 'racing' && (leader ? `Đang dẫn đầu: ${leader.name} (Mục tiêu: ${targetDuration}s)` : `Đua gay cấn (${targetDuration}s)!`)}
            {raceState === 'finished' && (winner ? `🏆 Cán đích: ${winner.name}` : 'Cuộc đua kết thúc!')}
          </span>
        </div>

        {/* Previous winners history badge (small pill at bottom-left) */}
        {selectedHistory.length > 0 && (
          <div className="absolute bottom-3 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-400/20 text-xs text-slate-300 backdrop-blur-md">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-200 font-semibold">Đã gọi:</span>
            <span className="truncate max-w-[240px] text-slate-300">
              {selectedHistory.slice(0, 3).join(', ')}
              {selectedHistory.length > 3 && ` (+${selectedHistory.length - 3})`}
            </span>
          </div>
        )}

        {/* Standalone Canvas */}
        <TrackCanvas
          marbles={marbles}
          setMarbles={setMarbles}
          raceState={raceState}
          speedMultiplier={speedMultiplier}
          targetDuration={targetDuration}
          onFinish={handleFinish}
          countdownValue={countdownValue}
        />
      </main>

      {/* Student Manager Modal */}
      <StudentManagerModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        rawNamesText={rawNames}
        onSaveNames={(newText) => {
          setRawNames(newText);
          showToast('Đã lưu danh sách học sinh!');
        }}
      />

      {/* Winner Celebration Modal */}
      <WinnerModal
        winner={winner}
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        onRestartRace={() => {
          setIsWinnerModalOpen(false);
          handleStartRace();
        }}
        onRemoveWinnerAndRerace={handleRemoveWinnerAndRerace}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1c45] border border-amber-400 text-amber-200 text-sm font-semibold shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
