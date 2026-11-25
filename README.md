
# FSM Visualizer

Draws your FSM JSON as boxes and lines. Runs fully in the browser; nothing is uploaded.

## Run it

```
npm install          # once
npm run dev          # live development at http://localhost:5173
npm run build        # makes dist/index.html: ONE self-contained file (open offline, email, shared drive)
```

## Where things are

```
src/
  main.jsx            starts the app
  App.jsx             page layout, keyboard shortcuts (Esc, /), drag-and-drop of files
  store.js            ALL shared state + actions (load FSM, select, search, trace ...)
  hooks.js            values worked out from the state: layout, paths, trace, highlighting
  styles.css          all colours and look (colours are variables at the top)

  core/               pure logic, no React. Easiest place to read and change behaviour.
    relaxedParser.js  reads your file when it is not strict JSON (unquoted keys, bare expressions)
    normalize.js      turns the file into one standard shape: states -> data + transitions
    expressions.js    the condition language: tokenizer, parser, short labels, colouring
    graph.js          builds the graph; says which types count as "end" states
    lint.js           the Issues tab checks (dangling, unreachable, no fallback, dead loops ...)
    layout.js         where each box goes (waterfall) and how each line curves
    paths.js          path finder: every route from A to B
    trace.js          reads "current" from log lines and builds the call path
    colors.js         colour per state type
    sample.js         the built-in demo FSM

  components/         the diagram area
    Canvas.jsx        lines + cards + pan/zoom container
    NodeCard.jsx      one state box
    EdgeView.jsx      one line + label
    usePanZoom.js     drag, wheel zoom, fit, centre-on-state
    TopBar.jsx        search, Start, Flow, toggles
    DataModal.jsx     the "Input data" popup
    LoadModal.jsx     the Load FSM popup
    Tooltip.jsx       hover card with the full condition
    ExprView.jsx      coloured condition text
    Modal.jsx, Toast.jsx

  panel/              the right-hand side panel, one file per tab
    Panel.jsx  DetailsTab.jsx  PathsTab.jsx  IssuesTab.jsx  TraceTab.jsx
```

## "I want to change ..."

| Change | File |
|---|---|
| FSM file shape not recognised (different key names) | `core/normalize.js` (key lists at the top: `TK`, `CK`) |
| A condition operator is not understood | `core/expressions.js` |
| Which types count as end/transfer (no fallback needed) | `core/graph.js` (`END_RE`, `TERM_RE`) |
| Add a new lint check | `core/lint.js` |
| Colour for a state type | `core/colors.js` |
| Theme colours | top of `styles.css` |
| Log format for the Trace tab | `core/trace.js` (`extractNames`) |
| Spacing between boxes | top of `core/layout.js` |
=======
# FSM-Visualiser
Visualise FSM to see different states and how transitions flow b/w state, see input data, paths from point to another, log trace and more
>>>>>>> 74f8266f9c8885fe8f3132c81672e6b31e99c2ab
