import { useState } from 'react'
import {
  MousePointer2, Square, Minus, DoorOpen, RectangleHorizontal,
  AlignJustify, TrendingUp, ArrowUpDown,
  Undo2, Redo2, RotateCw, Trash2, Search, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCatalog } from '@/hooks/useCatalog'
import { cn } from '@/lib/utils'
import type { ActiveTool, CanvasState, CanvasSymbol } from '@/pages/CanvasPage'
import type { IkeaItem } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLS: { tool: ActiveTool; label: string; Icon: React.ComponentType<{ size?: number }>; shortcut: string }[] = [
  { tool: 'select',   label: 'Select',  Icon: MousePointer2,      shortcut: 'V' },
  { tool: 'wall',     label: 'Wall',    Icon: Minus,              shortcut: 'W' },
  { tool: 'room',     label: 'Room',    Icon: Square,             shortcut: '' },
  { tool: 'door',     label: 'Door',    Icon: DoorOpen,           shortcut: 'D' },
  { tool: 'window',   label: 'Window',  Icon: RectangleHorizontal,shortcut: 'N' },
  { tool: 'stairs',   label: 'Stairs',  Icon: AlignJustify,       shortcut: 'S' },
  { tool: 'ramp',     label: 'Ramp',    Icon: TrendingUp,         shortcut: '' },
  { tool: 'elevator', label: 'Elev.',   Icon: ArrowUpDown,        shortcut: '' },
]

const SCALE_OPTIONS = [
  { label: '1:50',  value: 2.0 },
  { label: '1:100', value: 1.0 },
  { label: '1:200', value: 0.5 },
]

const SYMBOL_LABEL: Record<string, string> = {
  door: 'Door', window: 'Window', stairs: 'Stairs', ramp: 'Ramp', elevator: 'Elevator',
}

const TOOL_HINT: Partial<Record<ActiveTool, string>> = {
  select:   'Click to select · Scroll to zoom',
  wall:     'Click to draw · Dbl-click to finish',
  room:     'Click and drag to draw',
  door:     'Click on canvas to place',
  window:   'Click on canvas to place',
  stairs:   'Click on canvas to place',
  ramp:     'Click on canvas to place',
  elevator: 'Click on canvas to place',
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  activeTool: ActiveTool
  present: CanvasState
  selectedSymbol: CanvasSymbol | null
  stageScale: number
  wallThickness: number
  canUndo: boolean
  canRedo: boolean
  onToolChange: (tool: ActiveTool) => void
  onScaleChange: (scale: number) => void
  onWallThicknessChange: (thickness: number) => void
  onRotateSymbol: () => void
  onDeleteSelected: () => void
  onClear: () => void
  onUndo: () => void
  onRedo: () => void
  onPlaceFurniture: (item: IkeaItem) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CanvasToolbar({
  activeTool,
  present,
  selectedSymbol,
  stageScale,
  wallThickness,
  canUndo,
  canRedo,
  onToolChange,
  onScaleChange,
  onWallThicknessChange,
  onRotateSymbol,
  onDeleteSelected,
  onClear,
  onUndo,
  onRedo,
  onPlaceFurniture,
}: Props) {
  const { token } = useAuth()
  const [furnitureSearch, setFurnitureSearch] = useState('')

  const { data, isLoading } = useCatalog(
    { search: furnitureSearch || undefined, offset: 0, limit: 8 },
    token
  )

  const furnitureItems = data?.items ?? []

  const hasElements =
    present.walls.length > 0 || present.rooms.length > 0 || present.symbols.length > 0

  return (
    <div
      className="w-64 shrink-0 flex flex-col border-r border-[#8A9A8B]/15 overflow-y-auto"
      style={{ background: '#F2EFE8' }}
    >

      {/* ── Tool grid ─────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-[#8A9A8B]/15">
        <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-3">Tools</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TOOLS.map(({ tool, label, Icon, shortcut }) => (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              title={shortcut ? `${label} (${shortcut})` : label}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 rounded-xl text-[8px] tracking-wider uppercase transition-colors',
                activeTool === tool
                  ? 'bg-[#8A9A8B] text-white'
                  : 'bg-white/70 text-[#9a9a8f] border border-[#8A9A8B]/20 hover:border-[#8A9A8B]/50',
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-[#B38B6D] mt-2 text-center min-h-[14px]">
          {TOOL_HINT[activeTool] ?? ''}
        </p>
      </div>

      {/* ── Undo / Redo ───────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[#8A9A8B]/15 flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] tracking-widest uppercase border border-[#8A9A8B]/20 bg-white/70 text-[#9a9a8f] hover:border-[#8A9A8B]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 size={11} /> Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] tracking-widest uppercase border border-[#8A9A8B]/20 bg-white/70 text-[#9a9a8f] hover:border-[#8A9A8B]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 size={11} /> Redo
        </button>
      </div>

      {/* ── Scale selector ────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[#8A9A8B]/15 flex flex-col gap-3">
        <div>
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">Scale</p>
          <div className="flex gap-1">
            {SCALE_OPTIONS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => onScaleChange(value)}
                className={cn(
                  'flex-1 py-1 rounded-lg text-[9px] tracking-wider uppercase transition-colors',
                  Math.abs(stageScale - value) < 0.05
                    ? 'bg-[#8A9A8B] text-white'
                    : 'bg-white/70 text-[#9a9a8f] border border-[#8A9A8B]/20 hover:border-[#8A9A8B]/50',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Wall thickness — only shown when wall tool is active */}
        {activeTool === 'wall' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">Wall Width</p>
              <span className="text-[9px] text-[#32352C]">{wallThickness}px</span>
            </div>
            <input
              type="range"
              min={4}
              max={24}
              step={2}
              value={wallThickness}
              onChange={(e) => onWallThicknessChange(Number(e.target.value))}
              className="w-full accent-[#8A9A8B]"
            />
          </div>
        )}
      </div>

      {/* ── Selected symbol controls ──────────────────────────────────────── */}
      {selectedSymbol && (
        <div className="px-4 py-3 border-b border-[#8A9A8B]/15">
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">
            Selected · {SYMBOL_LABEL[selectedSymbol.type]}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onRotateSymbol}
              title="Rotate 90° (R)"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] tracking-widest uppercase border border-[#8A9A8B]/20 bg-white/70 text-[#9a9a8f] hover:border-[#8A9A8B]/50 transition-colors"
            >
              <RotateCw size={11} /> Rotate
            </button>
            <button
              onClick={onDeleteSelected}
              title="Delete (Delete)"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[9px] tracking-widest uppercase border border-red-200 bg-white/70 text-red-400 hover:border-red-400 transition-colors"
            >
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <p className="text-[9px] text-[#9a9a8f] mt-1.5 text-center">
            {selectedSymbol.rotation}° · Press R to rotate
          </p>
        </div>
      )}

      {/* ── Elements list ─────────────────────────────────────────────────── */}
      {hasElements && (
        <div className="p-4 border-b border-[#8A9A8B]/15">
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-2">Elements</p>
          <div className="flex flex-col gap-1">
            {present.walls.length > 0 && (
              <div className="flex items-center px-3 py-1.5 bg-white/30 rounded-xl">
                <p className="text-[10px] text-[#9a9a8f] flex-1">
                  {present.walls.length} Wall{present.walls.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {present.rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between bg-white/50 rounded-xl px-3 py-1.5">
                <div>
                  <p className="text-[10px] font-serif italic text-[#32352C]">{room.label}</p>
                  <p className="text-[8px] text-[#9a9a8f]">
                    {(room.width / 40).toFixed(1)}m × {(room.height / 40).toFixed(1)}m
                  </p>
                </div>
              </div>
            ))}
            {present.symbols.map((sym) => (
              <div key={sym.id} className="flex items-center justify-between bg-white/50 rounded-xl px-3 py-1.5">
                <p className="text-[10px] font-serif italic text-[#32352C]">{SYMBOL_LABEL[sym.type]}</p>
                <span className="text-[8px] text-[#9a9a8f]">{sym.rotation}°</span>
              </div>
            ))}
            {present.placedItems.length > 0 && (
              <div className="flex items-center px-3 py-1.5 bg-white/30 rounded-xl">
                <p className="text-[10px] text-[#9a9a8f] flex-1">
                  {present.placedItems.length} Furniture piece{present.placedItems.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Furniture search ──────────────────────────────────────────────── */}
      <div className="p-4 flex-1">
        <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase mb-3">Add Furniture</p>
        <div className="relative mb-3">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9a8f]" />
          <input
            value={furnitureSearch}
            onChange={(e) => setFurnitureSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-[#8A9A8B]/20 bg-white/70 text-[11px] text-[#32352C] outline-none focus:border-[#8A9A8B] placeholder:text-[#b0ada6] transition-colors"
          />
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-[#e8e4db] animate-pulse" />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {furnitureItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPlaceFurniture(item)}
              className="flex items-center gap-3 bg-white/50 rounded-xl px-3 py-2 hover:bg-white/80 transition-colors text-left"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#e8e4db] shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-serif italic text-[#32352C] truncate">{item.name}</p>
                <p className="text-[9px] text-[#9a9a8f] truncate">
                  {item.category} · {item.price_kwd.toFixed(3)} KWD
                </p>
              </div>
            </button>
          ))}
          {!isLoading && furnitureItems.length === 0 && furnitureSearch && (
            <p className="text-[10px] text-[#9a9a8f] text-center py-4">No results</p>
          )}
          {!isLoading && furnitureItems.length === 0 && !furnitureSearch && (
            <p className="text-[10px] text-[#9a9a8f] text-center py-4 leading-relaxed">
              Catalog is loading or empty.<br />Search to browse furniture.
            </p>
          )}
        </div>
      </div>

      {/* ── Clear canvas ──────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-[#8A9A8B]/15">
        <button
          onClick={onClear}
          className="flex items-center justify-center gap-2 w-full text-[10px] tracking-widest uppercase text-[#9a9a8f] border border-[#8A9A8B]/20 py-2 rounded-full hover:border-red-300 hover:text-red-400 transition-colors"
        >
          <Trash2 size={11} />
          Clear Canvas
        </button>
      </div>

    </div>
  )
}
