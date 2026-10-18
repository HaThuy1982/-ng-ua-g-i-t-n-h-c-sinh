import React, { useState } from 'react';
import { X, Users, Shuffle, RotateCcw, Trash2, Check, Sparkles } from 'lucide-react';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawNamesText: string;
  onSaveNames: (text: string) => void;
}

const PRESETS = [
  {
    label: 'Mẫu chuẩn (7 em)',
    names: [
      'Nguyễn Hoàng Long',
      'Trần Thị Mai Anh',
      'Lê Đức Minh',
      'Phạm Thuỳ Trang',
      'Vũ Gia Huy',
      'Đặng Ngọc Bảo',
      'Bùi Khánh Linh',
    ],
  },
  {
    label: 'Tổ 1 (8 em)',
    names: [
      'Nguyễn Văn An',
      'Trần Bảo Anh',
      'Lê Hoàng Dũng',
      'Phạm Hải Yến',
      'Vũ Minh Khôi',
      'Đặng Thuỳ Linh',
      'Bùi Quốc Hưng',
      'Đỗ Mai Phương',
    ],
  },
  {
    label: 'Tổ 2 (8 em)',
    names: [
      'Hoàng Đức Thắng',
      'Ngô Gia Bảo',
      'Dương Thuỳ Chi',
      'Đinh Quang Hải',
      'Lý Khánh Vân',
      'Mai Anh Tuấn',
      'Lương Minh Nguyệt',
      'Trịnh Tiến Đạt',
    ],
  },
  {
    label: 'Lớp Thực Hành (12 em)',
    names: [
      'Nguyễn Hoàng Long',
      'Trần Thị Mai Anh',
      'Lê Đức Minh',
      'Phạm Thuỳ Trang',
      'Vũ Gia Huy',
      'Đặng Ngọc Bảo',
      'Bùi Khánh Linh',
      'Hoàng Đức Thắng',
      'Ngô Gia Bảo',
      'Dương Thuỳ Chi',
      'Đinh Quang Hải',
      'Lý Khánh Vân',
    ],
  },
];

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  isOpen,
  onClose,
  rawNamesText,
  onSaveNames,
}) => {
  const [inputText, setInputText] = useState(rawNamesText);

  if (!isOpen) return null;

  const currentNames = inputText
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const handleShuffle = () => {
    const list = [...currentNames];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setInputText(list.join('\n'));
  };

  const handleApplyPreset = (presetNames: string[]) => {
    setInputText(presetNames.join('\n'));
  };

  const handleSave = () => {
    onSaveNames(inputText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#101c44] to-[#0a112c] border-2 border-amber-400/40 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.25)] p-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-300">
                Quản Lý Danh Sách Học Sinh
              </h2>
              <p className="text-xs text-sky-200/80">
                Nhập danh sách học sinh tham gia đường đua (mỗi dòng 1 tên)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset quick buttons */}
        <div className="py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-amber-200/70 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Mẫu nhanh:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleApplyPreset(preset.names)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800/80 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400 text-slate-200 hover:text-amber-200 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Main Textarea */}
        <div className="flex-1 flex flex-col min-h-[220px] my-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán hoặc nhập danh sách học sinh tại đây (mỗi em một dòng)..."
            className="w-full h-full flex-1 p-3.5 rounded-xl bg-[#070d24] border border-amber-400/30 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono text-sm leading-relaxed resize-none shadow-inner"
          />
        </div>

        {/* Stats & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-400/20 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/30 text-amber-300 font-bold">
              Tổng số: {currentNames.length} học sinh
            </span>
            <button
              onClick={handleShuffle}
              disabled={currentNames.length <= 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-all disabled:opacity-40"
              title="Đảo thứ tự ngẫu nhiên"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Xáo Trộn</span>
            </button>
            <button
              onClick={() => setInputText('')}
              className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xoá Hết</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,215,0,0.35)] transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Lưu & Cập Nhật Bi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
