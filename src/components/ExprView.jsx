import { highlight } from '../core/expressions'
/** Expression with syntax colouring: strings, operators, platform / configuration / bots paths. */
export function ExprView({ raw }) {
  return (
    <>
      {highlight(raw).map((s, i) =>
        s.cls ? (
          <span key={i} className={s.cls}>
            {s.text}
          </span>
        ) : (
          s.text
        ),
      )}
    </>
  )
}
