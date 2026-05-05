import { useState, useRef, useCallback, useEffect } from 'react'
import { Download, FileCode } from 'lucide-react'
import jsPDF from 'jspdf'
import type Konva from 'konva'
import CanvasStage from '@/components/canvas/CanvasStage'
import CanvasToolbar from '@/components/canvas/CanvasToolbar'
import type { IkeaItem } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActiveTool =
  | 'select' | 'wall' | 'room'
  | 'door' | 'window' | 'stairs' | 'ramp' | 'elevator'

export type SymbolType = 'door' | 'window' | 'stairs' | 'ramp' | 'elevator'

export interface CanvasWall {
  id: string
  x1: number; y1: number; x2: number; y2: number
  thickness: number
}

export interface CanvasRoom {
  id: string
  x: number; y: number; width: number; height: number
  label: string
}

export interface CanvasPlacedItem {
  id: string; itemId: string; name: string; category: string
  x: number; y: number; width: number; height: number
}

export interface CanvasSymbol {
  id: string; type: SymbolType
  x: number; y: number
  rotation: number
}

export interface CanvasState {
  walls: CanvasWall[]
  rooms: CanvasRoom[]
  placedItems: CanvasPlacedItem[]
  symbols: CanvasSymbol[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL: CanvasState = { walls: [], rooms: [], placedItems: [], symbols: [] }

const SYMBOL_TOOLS = new Set<ActiveTool>(['door', 'window', 'stairs', 'ramp', 'elevator'])

const FURNITURE_SIZE: Record<string, { w: number; h: number }> = {
  Sofa: { w: 120, h: 60 }, Bed: { w: 80, h: 100 }, 'Dining Table': { w: 100, h: 80 },
  Wardrobe: { w: 80, h: 40 }, 'Coffee Table': { w: 60, h: 60 },
  Armchair: { w: 60, h: 60 }, 'Office Chair': { w: 60, h: 60 }, 'TV & Storage': { w: 120, h: 40 },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CanvasPage() {
  const [present, setPresent] = useState<CanvasState>(INITIAL)
  const [past, setPast] = useState<CanvasState[]>([])
  const [future, setFuture] = useState<CanvasState[]>([])

  const [wallInProgress, setWallInProgress] = useState<{ x: number; y: number } | null>(null)
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null)

  const [activeTool, setActiveTool] = useState<ActiveTool>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [roomCounter, setRoomCounter] = useState(1)

  const [stageScale, setStageScale] = useState(1)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [wallThickness, setWallThickness] = useState(8)

  const stageRef = useRef<Konva.Stage | null>(null)
  const lastWallIdRef = useRef<string | null>(null)

  // ── History ──────────────────────────────────────────────────────────────

  const commit = useCallback((next: CanvasState) => {
    setPast(p => [...p.slice(-50), present])
    setFuture([])
    setPresent(next)
  }, [present])

  const undo = useCallback(() => {
    if (past.length === 0) return
    setFuture(f => [present, ...f])
    setPresent(past[past.length - 1])
    setPast(p => p.slice(0, -1))
    setWallInProgress(null)
    setSelectedId(null)
  }, [present, past])

  const redo = useCallback(() => {
    if (future.length === 0) return
    setPast(p => [...p, present])
    setPresent(future[0])
    setFuture(f => f.slice(1))
    setSelectedId(null)
  }, [present, future])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRoomDraw = useCallback((room: CanvasRoom) => {
    const labeled = { ...room, label: `Room ${roomCounter}` }
    commit({ ...present, rooms: [...present.rooms, labeled] })
    setRoomCounter(c => c + 1)
    setActiveTool('select')
  }, [present, commit, roomCounter])

  const handleWallClick = useCallback((x: number, y: number) => {
    if (!wallInProgress) {
      setWallInProgress({ x, y })
      return
    }
    if (Math.abs(x - wallInProgress.x) < 2 && Math.abs(y - wallInProgress.y) < 2) return
    const id = crypto.randomUUID()
    lastWallIdRef.current = id
    const newWall: CanvasWall = { id, x1: wallInProgress.x, y1: wallInProgress.y, x2: x, y2: y, thickness: wallThickness }
    commit({ ...present, walls: [...present.walls, newWall] })
    setWallInProgress({ x, y })
  }, [wallInProgress, present, commit, wallThickness])

  const handleWallDblClick = useCallback((_x: number, _y: number) => {
    // Remove the last segment added by the preceding click (part of dblclick pair)
    if (lastWallIdRef.current) {
      const walls = present.walls.filter(w => w.id !== lastWallIdRef.current)
      commit({ ...present, walls })
      lastWallIdRef.current = null
    }
    setWallInProgress(null)
    setPreviewPos(null)
    setActiveTool('select')
  }, [present, commit])

  const handleSymbolPlace = useCallback((type: SymbolType, x: number, y: number) => {
    const sym: CanvasSymbol = { id: crypto.randomUUID(), type, x, y, rotation: 0 }
    commit({ ...present, symbols: [...present.symbols, sym] })
    setActiveTool('select')
  }, [present, commit])

  const handlePlaceFurniture = useCallback((item: IkeaItem) => {
    const size = FURNITURE_SIZE[item.category] ?? { w: 80, h: 80 }
    const placed: CanvasPlacedItem = {
      id: crypto.randomUUID(), itemId: item.id, name: item.name, category: item.category,
      x: 100 + (present.placedItems.length % 8) * 20,
      y: 100 + (present.placedItems.length % 8) * 20,
      width: size.w, height: size.h,
    }
    commit({ ...present, placedItems: [...present.placedItems, placed] })
  }, [present, commit])

  const handleItemMove = useCallback((id: string, x: number, y: number) => {
    commit({
      ...present,
      placedItems: present.placedItems.map(i => i.id === id ? { ...i, x, y } : i),
      symbols: present.symbols.map(s => s.id === id ? { ...s, x, y } : s),
    })
  }, [present, commit])

  const handleItemResize = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    commit({ ...present, placedItems: present.placedItems.map(i => i.id === id ? { ...i, x, y, width: w, height: h } : i) })
  }, [present, commit])

  const handleRotateSymbol = useCallback((id: string) => {
    commit({
      ...present,
      symbols: present.symbols.map(s => s.id === id ? { ...s, rotation: (s.rotation + 90) % 360 } : s),
    })
  }, [present, commit])

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return
    commit({
      walls: present.walls.filter(w => w.id !== selectedId),
      rooms: present.rooms.filter(r => r.id !== selectedId),
      placedItems: present.placedItems.filter(i => i.id !== selectedId),
      symbols: present.symbols.filter(s => s.id !== selectedId),
    })
    setSelectedId(null)
  }, [selectedId, present, commit])

  const handleClear = useCallback(() => {
    commit(INITIAL)
    setWallInProgress(null)
    setPreviewPos(null)
    setSelectedId(null)
    setRoomCounter(1)
  }, [commit])

  const handleScaleChange = useCallback((scale: number) => {
    setStageScale(scale)
    setStagePos({ x: 0, y: 0 })
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); return }
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === 'y' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); redo(); return }

      if (e.key === 'Escape') { setWallInProgress(null); setPreviewPos(null); setActiveTool('select'); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { handleDeleteSelected(); return }
      if (e.key === 'r' || e.key === 'R') { if (selectedId) handleRotateSymbol(selectedId); return }

      if (e.key === 'v' || e.key === 'V') setActiveTool('select')
      if (e.key === 'w' || e.key === 'W') setActiveTool('wall')
      if (e.key === 'd' || e.key === 'D') setActiveTool('door')
      if (e.key === 'n' || e.key === 'N') setActiveTool('window')
      if (e.key === 's' || e.key === 'S') setActiveTool('stairs')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, handleDeleteSelected, handleRotateSymbol, selectedId])

  const handleExportPdf = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const dataUrl = stage.toDataURL({ pixelRatio: 2 })
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1400, 900] })
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1400, 900)
    if (present.placedItems.length > 0) {
      pdf.addPage([800, 400], 'landscape')
      pdf.setFontSize(14); pdf.setFont('helvetica', 'italic')
      pdf.text('Furniture List', 40, 40)
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
      present.placedItems.forEach((item, i) => pdf.text(`${i + 1}. ${item.name} (${item.category})`, 40, 58 + i * 16))
    }
    pdf.save('planara-canvas.pdf')
  }, [present.placedItems])

  const handleExportDxf = useCallback(() => {
    const lines: string[] = []
    const px2m = (v: number) => (v / 20 / 2).toFixed(4)  // GRID=20, scale 1:100 (20px = 0.5m)

    lines.push('0', 'SECTION', '2', 'HEADER',
      '9', '$INSUNITS', '70', '6',  // 6 = meters
      '0', 'ENDSEC')
    lines.push('0', 'SECTION', '2', 'TABLES',
      '0', 'TABLE', '2', 'LAYER', '70', '4',
      '0', 'LAYER', '2', 'WALLS',   '70', '0', '62', '7', '6', 'CONTINUOUS',
      '0', 'LAYER', '2', 'ROOMS',   '70', '0', '62', '3', '6', 'CONTINUOUS',
      '0', 'LAYER', '2', 'SYMBOLS', '70', '0', '62', '5', '6', 'CONTINUOUS',
      '0', 'ENDTAB', '0', 'ENDSEC')
    lines.push('0', 'SECTION', '2', 'ENTITIES')

    present.walls.forEach(w => {
      lines.push('0', 'LINE', '8', 'WALLS',
        '10', px2m(w.x1), '20', px2m(-w.y1), '30', '0.0',
        '11', px2m(w.x2), '21', px2m(-w.y2), '31', '0.0')
    })

    present.rooms.forEach(r => {
      const x0 = px2m(r.x), y0 = px2m(-r.y)
      const x1 = px2m(r.x + r.width), y1 = px2m(-(r.y + r.height))
      lines.push('0', 'LWPOLYLINE', '8', 'ROOMS', '90', '4', '70', '1',
        '10', x0, '20', y0, '10', x1, '20', y0,
        '10', x1, '20', y1, '10', x0, '20', y1)
    })

    present.symbols.forEach(s => {
      lines.push('0', 'TEXT', '8', 'SYMBOLS',
        '10', px2m(s.x), '20', px2m(-s.y), '30', '0.0',
        '40', '0.3', '1', s.type.toUpperCase())
    })

    present.placedItems.forEach(i => {
      const x0 = px2m(i.x), y0 = px2m(-i.y)
      const x1 = px2m(i.x + i.width), y1 = px2m(-(i.y + i.height))
      lines.push('0', 'LWPOLYLINE', '8', 'FURNITURE', '90', '4', '70', '1',
        '10', x0, '20', y0, '10', x1, '20', y0,
        '10', x1, '20', y1, '10', x0, '20', y1)
      lines.push('0', 'TEXT', '8', 'FURNITURE',
        '10', px2m(i.x + i.width / 2), '20', px2m(-(i.y + i.height / 2)), '30', '0.0',
        '40', '0.2', '1', i.name)
    })

    lines.push('0', 'ENDSEC', '0', 'EOF')
    const blob = new Blob([lines.join('\n')], { type: 'application/dxf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'planara-canvas.dxf'; a.click()
    URL.revokeObjectURL(url)
  }, [present])

  const isEmpty = !present.walls.length && !present.rooms.length && !present.placedItems.length && !present.symbols.length
  const selectedSymbol = present.symbols.find(s => s.id === selectedId) ?? null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#8A9A8B]/15 bg-[#F2EFE8] shrink-0">
        <div>
          <h2 className="font-serif italic text-[#32352C] text-xl">Design Canvas</h2>
          <p className="text-[9px] text-[#9a9a8f] tracking-widest uppercase">
            {present.walls.length} Wall{present.walls.length !== 1 ? 's' : ''} · {present.rooms.length} Room{present.rooms.length !== 1 ? 's' : ''} · {present.placedItems.length} Item{present.placedItems.length !== 1 ? 's' : ''} · {present.symbols.length} Symbol{present.symbols.length !== 1 ? 's' : ''}
            {wallInProgress && <span className="ml-3 text-[#B38B6D]">· Drawing wall — double-click to finish</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportDxf}
            disabled={isEmpty}
            className="flex items-center gap-2 border border-[#8A9A8B]/20 text-[#9a9a8f] px-4 py-2 rounded-full text-[10px] tracking-widest uppercase hover:border-[#8A9A8B] hover:text-[#32352C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileCode size={11} />
            Export DXF
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isEmpty}
            className="flex items-center gap-2 border border-[#8A9A8B]/20 text-[#9a9a8f] px-4 py-2 rounded-full text-[10px] tracking-widest uppercase hover:border-[#8A9A8B] hover:text-[#32352C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={11} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <CanvasToolbar
          activeTool={activeTool}
          present={present}
          selectedSymbol={selectedSymbol}
          stageScale={stageScale}
          wallThickness={wallThickness}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onToolChange={setActiveTool}
          onScaleChange={handleScaleChange}
          onWallThicknessChange={setWallThickness}
          onRotateSymbol={() => { if (selectedId) handleRotateSymbol(selectedId) }}
          onDeleteSelected={handleDeleteSelected}
          onClear={handleClear}
          onUndo={undo}
          onRedo={redo}
          onPlaceFurniture={handlePlaceFurniture}
        />
        <CanvasStage
          present={present}
          activeTool={activeTool}
          wallInProgress={wallInProgress}
          previewPos={previewPos}
          selectedId={selectedId}
          stageScale={stageScale}
          stagePos={stagePos}
          stageRef={stageRef}
          onSelect={setSelectedId}
          onRoomDraw={handleRoomDraw}
          onWallClick={handleWallClick}
          onWallDblClick={handleWallDblClick}
          onSymbolPlace={handleSymbolPlace}
          onItemMove={handleItemMove}
          onItemResize={handleItemResize}
          onPreviewMove={setPreviewPos}
          onStageScaleChange={setStageScale}
          onStagePosChange={setStagePos}
        />
      </div>
    </div>
  )
}
