// Mouse behaviour of the canvas: drag to pan, wheel to zoom, "fit" and "centre on a state".
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useStore } from '../store'
import { W, H } from '../core/layout'

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function usePanZoom(layout) {
  const ref = useRef(null) // attach to the canvas <div>
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const fitTick = useStore((s) => s.fitTick)
  const focus = useStore((s) => s.focus)
  const viewNow = useRef(view) // always the latest view, for event handlers
  viewNow.current = view
  const drag = useRef(null)

  const size = () => ({ w: ref.current?.clientWidth || 1000, h: ref.current?.clientHeight || 700 })

  // Zoom keeping the point under the cursor (mx, my) fixed.
  const zoomAt = (mx, my, factor) => {
    const v = viewNow.current
    const k = clamp(v.k * factor, 0.15, 2.5)
    setView({ k, x: mx - (mx - v.x) * (k / v.k), y: my - (my - v.y) * (k / v.k) })
  }
  const zoomFromCentre = (factor) => zoomAt(size().w / 2, size().h / 2, factor)

  // Fit everything on screen whenever a new FSM / start state / direction is applied.
  useLayoutEffect(() => {
    if (!layout) return
    const b = layout.L.bounds
    const { w, h } = size()
    const k = clamp(Math.min(w / (b.x1 - b.x0), h / (b.y1 - b.y0)), 0.15, 1.1)
    setView({
      k,
      x: (w - (b.x1 - b.x0) * k) / 2 - b.x0 * k,
      y: (h - (b.y1 - b.y0) * k) / 2 - b.y0 * k,
    })
  }, [fitTick, layout === null]) // eslint-disable-line

  // Centre on a state when asked (clicking a link in the side panel, jumping from Issues).
  useEffect(() => {
    if (!focus || !layout) return
    const p = layout.L.p.get(focus.id)
    if (!p) return
    const { w, h } = size()
    const k = Math.max(viewNow.current.k, 0.85) // zoom in to a readable level if we are zoomed far out
    setView({ k, x: w / 2 - (p.x + W / 2) * k, y: h / 2 - (p.y + H / 2) * k })
  }, [focus]) // eslint-disable-line

  // Wheel zoom. Must be a non-passive listener so the page itself does not scroll.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (ev) => {
      ev.preventDefault()
      useStore.getState().setTip(null)
      const r = el.getBoundingClientRect()
      zoomAt(ev.clientX - r.left, ev.clientY - r.top, Math.exp(-ev.deltaY * 0.0015))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, []) // eslint-disable-line

  // Drag to pan. A click without moving on empty space deselects.
  const handlers = {
    onPointerDown(ev) {
      if (ev.button !== 0 || ev.target.closest('.node, #zoomCtl, #empty button')) return
      useStore.getState().setTip(null)
      drag.current = {
        x: ev.clientX,
        y: ev.clientY,
        vx: viewNow.current.x,
        vy: viewNow.current.y,
        moved: false,
      }
      ref.current.classList.add('panning')
      try {
        ref.current.setPointerCapture(ev.pointerId)
      } catch (e) {}
    },
    onPointerMove(ev) {
      const d = drag.current
      if (!d) return
      const dx = ev.clientX - d.x
      const dy = ev.clientY - d.y
      if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true
      setView({ k: viewNow.current.k, x: d.vx + dx, y: d.vy + dy })
    },
    onPointerUp() {
      const d = drag.current
      if (!d) return
      drag.current = null
      ref.current.classList.remove('panning')
      if (!d.moved && useStore.getState().sel) useStore.getState().select(null, false)
    },
    onPointerCancel() {
      drag.current = null
      ref.current?.classList.remove('panning')
    },
    onMouseLeave: () => useStore.getState().setTip(null),
  }

  return { ref, view, handlers, zoomFromCentre }
}
