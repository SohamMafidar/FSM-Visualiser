// The app's single shared state (zustand). Every component reads from here.
// To find where something is changed, search for the action name, e.g. "select" or "loadTrace".
import { create } from 'zustand'
import { parseRelaxed } from './core/relaxedParser'
import { normalizeDocument } from './core/normalize'
import { buildGraph } from './core/graph'
import { runLint } from './core/lint'
import { extractNames } from './core/trace'

// Machines with <= 2 CPU cores (typical slow VDI) start with "Reduced effects" on.
const looksSlow = () =>
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
  (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

let toastTimer

export const useStore = create((set, get) => ({
  // ---------- the FSM ----------
  G: null, //          the graph (see core/graph.js)
  start: null, //      id of the start state
  issues: [], //       linter results (see core/lint.js)

  // ---------- view settings ----------
  dir: 'TB', //        'TB' = top-down, 'LR' = left-to-right
  labels: true, //     show condition labels on lines
  lite: !!looksSlow(), // "Reduced effects"
  view: { x: 0, y: 0, k: 1 }, // pan (x, y) and zoom (k) of the canvas
  fitTick: 0, //       bump this number to make the canvas re-fit itself
  focus: null, //      { id, tick }: ask the canvas to centre on a state

  // ---------- what the user is doing ----------
  sel: null, //        selected state id
  q: '', //            search text
  tab: 'details', //   side panel tab: details | paths | issues | trace
  pf: { from: null, to: null, pick: null }, // path finder choices
  traceRaw: null, //   pasted/uploaded log text
  traceReverse: false, // log is newest-first
  traceMsg: null, //   error message for the trace tab
  modal: null, //      null | { kind: 'load' } | { kind: 'data', id }
  toast: null,
  tip: null, //        edge hover tooltip { id, x, y }

  // ---------- actions ----------
  /** Read FSM text (JSON or relaxed syntax), build the graph, lint it. */
  load(text) {
    text = text.replace(/^﻿/, '')
    let parsed, how
    try {
      parsed = JSON.parse(text)
      how = 'JSON'
    } catch (jsonError) {
      try {
        parsed = parseRelaxed(text)
        how = 'relaxed syntax'
      } catch (relaxedError) {
        return {
          ok: false,
          msg: `Could not read this file.\n\nAs JSON: ${jsonError.message}\nAs relaxed syntax: ${relaxedError.message}`,
        }
      }
    }
    let doc
    try {
      doc = normalizeDocument(parsed)
    } catch (e) {
      return { ok: false, msg: e.message }
    }
    if (!doc.states.length) return { ok: false, msg: 'The file has no states.' }

    const G = buildGraph(doc)
    set({
      G,
      start: G.start,
      issues: runLint(G, G.start),
      sel: null,
      q: '',
      tab: 'details',
      pf: { from: null, to: null, pick: null },
      traceRaw: null,
      traceMsg: null,
      modal: null,
      tip: null,
      fitTick: get().fitTick + 1,
    })
    get().showToast(`Loaded ${G.states.length} states (${how})`)
    return { ok: true }
  },

  setStart: (id) => set({ start: id, issues: runLint(get().G, id), fitTick: get().fitTick + 1 }),
  setDir: (dir) => set({ dir, fitTick: get().fitTick + 1 }),
  setLabels: (labels) => set({ labels }),
  setLite: (lite) => set({ lite }),
  setQ: (q) => set({ q }),
  setTab: (tab) => set({ tab }),
  setPf: (changes) => set({ pf: { ...get().pf, ...changes } }),
  setView: (view) => set({ view }),
  fit: () => set({ fitTick: get().fitTick + 1 }),
  centerOn: (id) => set({ focus: { id, tick: (get().focus?.tick || 0) + 1 } }),
  setTip: (tip) => set({ tip }),

  /** Select a state (or null to deselect). */
  select(id, center = true) {
    set({ sel: id, tab: 'details' })
    if (id && center) get().centerOn(id)
  },

  /** Draw a call's route from log text. */
  loadTrace(text) {
    if (!get().G) return get().showToast('Load an FSM first.')
    if (!extractNames(text).names.length) {
      set({
        traceRaw: null,
        traceMsg:
          'I found no "current" or "previous" fields in that text. Paste a few log lines containing them and I can adjust.',
        tab: 'trace',
        sel: null,
      })
    } else {
      set({ traceRaw: text, traceMsg: null, tab: 'trace', sel: null, fitTick: get().fitTick + 1 })
    }
  },
  clearTrace: () => set({ traceRaw: null, traceMsg: null }),
  setTraceReverse: (traceReverse) => set({ traceReverse }),

  openData: (id) => set({ modal: { kind: 'data', id } }),
  openLoad: () => set({ modal: { kind: 'load' } }),
  closeModal: () => set({ modal: null }),

  showToast(toast) {
    set({ toast })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 3500)
  },

  /** Esc key: close a popup, otherwise clear search / selection. */
  escape() {
    const s = get()
    if (s.modal) return set({ modal: null })
    set({ q: '', sel: null, pf: { ...s.pf, pick: null } })
  },
}))
