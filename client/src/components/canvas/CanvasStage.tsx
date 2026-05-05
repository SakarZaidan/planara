import { useRef, useCallback, type RefObject } from 'react'
import { Stage, Layer, Rect, Text, Transformer, Line, Arc, Group } from 'react-konva'
import type Konva from 'konva'
import type { CanvasRoom, CanvasPlacedItem, CanvasSymbol, CanvasWall, CanvasState, ActiveTool, SymbolType } from '@/pages/CanvasPage'

const STAGE_W = 2400
const STAGE_H = 1600
const GRID = 20

const CATEGORY_COLORS: Record<string, string> = {
  Sofa: '#B38B6D', Bed: '#8A9A8B', 'Dining Table': '#c9a48a',
  Wardrobe: '#6b7a6c', 'Coffee Table': '#B38B6D', Armchair: '#a8b8a9',
  'Office Chair': '#9a9a8f', 'TV & Storage': '#6b7a6c',
}

interface Props {
  present: CanvasState
  activeTool: ActiveTool
  wallInProgress: { x: number; y: number } | null
  previewPos: { x: number; y: number } | null
  selectedId: string | null
  stageScale: number
  stagePos: { x: number; y: number }
  stageRef: RefObject<Konva.Stage | null>
  onSelect: (id: string | null) => void
  onRoomDraw: (room: CanvasRoom) => void
  onWallClick: (x: number, y: number) => void
  onWallDblClick: (x: number, y: number) => void
  onSymbolPlace: (type: SymbolType, x: number, y: number) => void
  onItemMove: (id: string, x: number, y: number) => void
  onItemResize: (id: string, x: number, y: number, w: number, h: number) => void
  onPreviewMove: (pos: { x: number; y: number } | null) => void
  onStageScaleChange: (scale: number) => void
  onStagePosChange: (pos: { x: number; y: number }) => void
}

export default function CanvasStage({
  present, activeTool, wallInProgress, previewPos, selectedId,
  stageScale, stagePos, stageRef,
  onSelect, onRoomDraw, onWallClick, onWallDblClick, onSymbolPlace,
  onItemMove, onItemResize, onPreviewMove, onStageScaleChange, onStagePosChange,
}: Props) {
  const drawStart = useRef<{ x: number; y: number } | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const selectedNodeRef = useRef<Konva.Node | null>(null)

  const SYMBOL_TOOLS = new Set<ActiveTool>(['door', 'window', 'stairs', 'ramp', 'elevator'])

  const snap = (v: number) => Math.round(v / GRID) * GRID

  const toStageCoords = useCallback((stage: Konva.Stage, px: number, py: number) => ({
    x: snap((px - stage.x()) / stage.scaleX()),
    y: snap((py - stage.y()) / stage.scaleY()),
  }), [])

  const getPointer = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()!
    const p = stage.getPointerPosition()!
    const pos = toStageCoords(stage, p.x, p.y)

    if (activeTool === 'wall') {
      const SNAP = GRID * 1.5
      for (const wall of present.walls) {
        for (const ep of [{ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 }]) {
          if (Math.abs(ep.x - pos.x) <= SNAP && Math.abs(ep.y - pos.y) <= SNAP) return ep
        }
      }
    }
    return pos
  }, [toStageCoords, activeTool, present.walls])

  const getCursor = () => {
    if (activeTool === 'wall') return wallInProgress ? 'crosshair' : 'crosshair'
    if (activeTool === 'room') return 'crosshair'
    if (SYMBOL_TOOLS.has(activeTool)) return 'cell'
    return 'default'
  }

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()!
    const mousePoint = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
    const factor = e.evt.deltaY < 0 ? 1.12 : 1 / 1.12
    const newScale = Math.max(0.2, Math.min(4, oldScale * factor))
    onStageScaleChange(newScale)
    onStagePosChange({ x: pointer.x - mousePoint.x * newScale, y: pointer.y - mousePoint.y * newScale })
  }, [stageRef, onStageScaleChange, onStagePosChange])

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'wall' || !wallInProgress) return
    onPreviewMove(getPointer(e))
  }, [activeTool, wallInProgress, onPreviewMove, getPointer])

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getPointer(e)
    if (activeTool === 'select') {
      if (e.target === e.target.getStage() || e.target.id() === '') onSelect(null)
      return
    }
    if (activeTool === 'wall') { onWallClick(pos.x, pos.y); return }
    if (SYMBOL_TOOLS.has(activeTool)) { onSymbolPlace(activeTool as SymbolType, pos.x, pos.y); return }
  }, [activeTool, getPointer, onSelect, onWallClick, onSymbolPlace])

  const handleDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'wall') return
    const pos = getPointer(e)
    onWallDblClick(pos.x, pos.y)
  }, [activeTool, getPointer, onWallDblClick])

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'room') return
    const pos = getPointer(e)
    drawStart.current = pos
  }, [activeTool, getPointer])

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'room' || !drawStart.current) return
    const pos = getPointer(e)
    const x = Math.min(drawStart.current.x, pos.x)
    const y = Math.min(drawStart.current.y, pos.y)
    const w = Math.abs(pos.x - drawStart.current.x)
    const h = Math.abs(pos.y - drawStart.current.y)
    drawStart.current = null
    if (w < GRID || h < GRID) return
    onRoomDraw({ id: crypto.randomUUID(), x, y, width: w, height: h, label: '' })
  }, [activeTool, getPointer, onRoomDraw])

  const attachTransformer = useCallback((node: Konva.Node | null) => {
    selectedNodeRef.current = node
    if (transformerRef.current) {
      transformerRef.current.nodes(node ? [node] : [])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [])

  // ── Grid ───────────────────────────────────────────────────────────────────

  const gridLines = () => {
    const lines = []
    for (let x = 0; x <= STAGE_W; x += GRID)
      lines.push(<Line key={`v${x}`} points={[x, 0, x, STAGE_H]} stroke="#8A9A8B" strokeWidth={0.3} opacity={0.25} />)
    for (let y = 0; y <= STAGE_H; y += GRID)
      lines.push(<Line key={`h${y}`} points={[0, y, STAGE_W, y]} stroke="#8A9A8B" strokeWidth={0.3} opacity={0.25} />)
    return lines
  }

  // ── Symbol rendering ───────────────────────────────────────────────────────

  const renderSymbol = (sym: CanvasSymbol) => {
    const isDraggable = activeTool === 'select'
    const isSelected = selectedId === sym.id

    const groupProps = {
      key: sym.id,
      id: sym.id,
      x: sym.x,
      y: sym.y,
      rotation: sym.rotation,
      draggable: isDraggable,
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => { e.cancelBubble = true; onSelect(sym.id) },
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => onItemMove(sym.id, snap(e.target.x()), snap(e.target.y())),
      ref: isSelected ? (node: Konva.Group | null) => attachTransformer(node) : undefined,
    }

    if (sym.type === 'door') {
      return (
        <Group {...groupProps}>
          <Line points={[0, 0, 40, 0]} stroke="#32352C" strokeWidth={3} lineCap="square" />
          <Line points={[0, 0, 0, -40]} stroke="#32352C" strokeWidth={1.5} />
          <Arc x={0} y={0} innerRadius={0} outerRadius={40} angle={90} rotation={270} stroke="#32352C" strokeWidth={1} fill="transparent" dash={[4, 2]} />
          <Rect x={-4} y={-44} width={48} height={48} fill="transparent" />
        </Group>
      )
    }
    if (sym.type === 'window') {
      return (
        <Group {...groupProps}>
          <Rect x={0} y={-8} width={60} height={16} fill="white" stroke="#32352C" strokeWidth={2} />
          <Line points={[15, -6, 15, 6]} stroke="#8A9A8B" strokeWidth={1} />
          <Line points={[30, -6, 30, 6]} stroke="#8A9A8B" strokeWidth={1} />
          <Line points={[45, -6, 45, 6]} stroke="#8A9A8B" strokeWidth={1} />
        </Group>
      )
    }
    if (sym.type === 'stairs') {
      const treads = Array.from({ length: 7 }, (_, i) => (
        <Line key={i} points={[0, i * 11, 60, i * 11]} stroke="#6b7a6c" strokeWidth={1} />
      ))
      return (
        <Group {...groupProps}>
          <Rect x={0} y={0} width={60} height={77} fill="#e8e4db" stroke="#32352C" strokeWidth={2} />
          {treads}
          <Line points={[30, 68, 30, 10]} stroke="#32352C" strokeWidth={1.5} />
          <Line points={[24, 18, 30, 10, 36, 18]} stroke="#32352C" strokeWidth={1.5} />
        </Group>
      )
    }
    if (sym.type === 'ramp') {
      return (
        <Group {...groupProps}>
          <Rect x={0} y={0} width={80} height={40} fill="#e8e4db" stroke="#32352C" strokeWidth={2} />
          <Line points={[0, 40, 80, 0]} stroke="#32352C" strokeWidth={1} />
          <Text text="RAMP" fontSize={9} x={22} y={16} fill="#9a9a8f" fontFamily="Inter, sans-serif" />
        </Group>
      )
    }
    // elevator
    return (
      <Group {...groupProps}>
        <Rect x={0} y={0} width={40} height={40} fill="#e8e4db" stroke="#32352C" strokeWidth={2} />
        <Line points={[2, 2, 38, 38]} stroke="#32352C" strokeWidth={1} />
        <Line points={[38, 2, 2, 38]} stroke="#32352C" strokeWidth={1} />
      </Group>
    )
  }

  // ── Walls ──────────────────────────────────────────────────────────────────

  const renderWall = (wall: CanvasWall) => (
    <Line
      key={wall.id}
      id={wall.id}
      points={[wall.x1, wall.y1, wall.x2, wall.y2]}
      stroke="#32352C"
      strokeWidth={wall.thickness}
      lineCap="square"
      hitStrokeWidth={Math.max(wall.thickness, 12)}
      onClick={(e) => {
        // Let symbol tools and the wall tool bubble through to the Stage handler
        if (SYMBOL_TOOLS.has(activeTool) || activeTool === 'wall') return
        e.cancelBubble = true
        onSelect(wall.id)
      }}
    />
  )

  // ── Preview line ───────────────────────────────────────────────────────────

  const renderPreview = () => {
    if (!wallInProgress || !previewPos) return null
    return (
      <Line
        points={[wallInProgress.x, wallInProgress.y, previewPos.x, previewPos.y]}
        stroke="#B38B6D"
        strokeWidth={2}
        dash={[6, 4]}
        listening={false}
      />
    )
  }

  // ── Wall length label for preview ─────────────────────────────────────────

  const previewLabel = () => {
    if (!wallInProgress || !previewPos) return null
    const dx = previewPos.x - wallInProgress.x
    const dy = previewPos.y - wallInProgress.y
    const pxLen = Math.sqrt(dx * dx + dy * dy)
    const meters = (pxLen / GRID / 2).toFixed(1)
    const mx = (wallInProgress.x + previewPos.x) / 2
    const my = (wallInProgress.y + previewPos.y) / 2
    return <Text x={mx + 4} y={my - 14} text={`${meters}m`} fontSize={10} fill="#B38B6D" fontFamily="Inter, sans-serif" listening={false} />
  }

  // ── Scale bar (DOM overlay) ────────────────────────────────────────────────

  const scaleLabel = stageScale >= 1.8 ? '1:50' : stageScale >= 0.7 ? '1:100' : '1:200'
  const scaleBarM = stageScale >= 1.8 ? 5 : stageScale >= 0.7 ? 10 : 20
  const scaleBarPx = scaleBarM * 2 * GRID * stageScale

  return (
    <div className="relative overflow-hidden flex-1 bg-[#F2EFE8]">
      <Stage
        ref={stageRef as RefObject<Konva.Stage>}
        width={window.innerWidth - 264}
        height={window.innerHeight - 88}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={activeTool === 'select' && !wallInProgress}
        style={{ cursor: getCursor() }}
        onWheel={handleWheel}
        onClick={handleClick}
        onDblClick={handleDblClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onDragEnd={(e) => onStagePosChange({ x: e.target.x(), y: e.target.y() })}
      >
        <Layer listening={false}>{gridLines()}</Layer>

        {/* Walls */}
        <Layer>{present.walls.map(renderWall)}</Layer>

        {/* Rooms */}
        <Layer>
          {present.rooms.map(room => (
            <Group key={room.id}>
              <Rect
                id={room.id}
                x={room.x} y={room.y} width={room.width} height={room.height}
                fill="#F2EFE8" stroke="#8A9A8B" strokeWidth={2} dash={[6, 3]} cornerRadius={4}
                onClick={(e) => {
                  if (SYMBOL_TOOLS.has(activeTool) || activeTool === 'wall') return
                  e.cancelBubble = true
                  onSelect(room.id)
                }}
              />
              <Text x={room.x + 8} y={room.y + 8} text={room.label} fontSize={11} fontFamily="Georgia, serif" fontStyle="italic" fill="#6b7a6c" listening={false} />
              <Text x={room.x + 8} y={room.y + 24}
                text={`${(room.width / GRID / 2).toFixed(1)}m × ${(room.height / GRID / 2).toFixed(1)}m`}
                fontSize={9} fontFamily="Inter, sans-serif" fill="#9a9a8f" listening={false} />
            </Group>
          ))}
        </Layer>

        {/* Symbols */}
        <Layer>{present.symbols.map(renderSymbol)}</Layer>

        {/* Furniture */}
        <Layer>
          {present.placedItems.map(item => {
            const isSelected = selectedId === item.id
            const color = CATEGORY_COLORS[item.category] ?? '#B38B6D'
            return (
              <Group
                key={item.id}
                id={item.id}
                x={item.x}
                y={item.y}
                draggable={activeTool === 'select'}
                onClick={(e) => { e.cancelBubble = true; onSelect(item.id) }}
                onDragEnd={(e) => onItemMove(item.id, snap(e.target.x()), snap(e.target.y()))}
                ref={(node: Konva.Group | null) => { if (isSelected) attachTransformer(node) }}
              >
                <Rect
                  x={0} y={0} width={item.width} height={item.height}
                  fill={color} opacity={0.8} cornerRadius={4}
                />
                <Text
                  x={4} y={item.height / 2 - 6}
                  width={item.width - 8} text={item.name} fontSize={9}
                  fontFamily="Inter, sans-serif" fill="white" align="center" listening={false}
                />
              </Group>
            )
          })}

          <Transformer
            ref={transformerRef as RefObject<Konva.Transformer>}
            rotateEnabled={false}
            boundBoxFunc={(_, newBox) => ({
              ...newBox,
              width: Math.max(GRID, snap(newBox.width)),
              height: Math.max(GRID, snap(newBox.height)),
            })}
            onTransformEnd={() => {
              const node = selectedNodeRef.current as Konva.Group | null
              if (!node || !selectedId) return
              const rect = node.findOne('Rect') as Konva.Rect | null
              if (!rect) return
              onItemResize(
                selectedId,
                snap(node.x()), snap(node.y()),
                Math.max(GRID, snap(rect.width() * node.scaleX())),
                Math.max(GRID, snap(rect.height() * node.scaleY())),
              )
              node.scaleX(1); node.scaleY(1)
            }}
          />
        </Layer>

        {/* Wall preview + endpoint indicators */}
        <Layer listening={false}>
          {/* Snap targets: dots on all wall endpoints when wall tool active */}
          {activeTool === 'wall' && present.walls.flatMap(w =>
            [{ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }].map((ep, i) => (
              <Rect
                key={`ep-${w.id}-${i}`}
                x={ep.x - 4} y={ep.y - 4} width={8} height={8}
                fill="#8A9A8B" opacity={0.5} cornerRadius={4}
              />
            ))
          )}
          {/* Start-point anchor */}
          {wallInProgress && (
            <Rect x={wallInProgress.x - 5} y={wallInProgress.y - 5} width={10} height={10} fill="#B38B6D" cornerRadius={5} />
          )}
          {renderPreview()}
          {previewLabel()}
        </Layer>
      </Stage>

      {/* Scale bar overlay */}
      <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1 pointer-events-none">
        <div className="flex items-end gap-1">
          <div style={{ width: scaleBarPx }} className="h-1 bg-[#32352C] rounded-full" />
        </div>
        <p className="text-[9px] text-[#32352C] tracking-widest uppercase">{scaleBarM}m · {scaleLabel}</p>
      </div>

      {/* Zoom level */}
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <p className="text-[9px] text-[#9a9a8f] tracking-widest">{Math.round(stageScale * 100)}%</p>
      </div>
    </div>
  )
}
