import { createElement } from 'react'

interface Props {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  by?: 'chars' | 'words'
  className?: string
  /** Set false when a parent animates the .split__unit elements itself */
  scroll?: boolean
}

/**
 * Splits text into masked characters/words. Reveals on scroll via useReveal()
 * (data-split), or animate `.split__unit` yourself (see Hero).
 * The wrapper keeps the full text in aria-label so screen readers read it normally.
 */
export function SplitText({ text, as = 'span', by = 'words', className = '', scroll = true }: Props) {
  const words = text.split(' ')
  return createElement(
    as,
    { className: `split ${className}`, 'aria-label': text, ...(scroll ? { 'data-split': by } : {}) },
    words.map((w, wi) => (
      <span className="split__word" aria-hidden="true" key={wi}>
        {by === 'chars' ? (
          [...w].map((c, ci) => (
            <span className="split__unit" key={ci}>
              {c}
            </span>
          ))
        ) : (
          <span className="split__unit">{w}</span>
        )}
        {wi < words.length - 1 ? '\u00A0' : ''}
      </span>
    )),
  )
}
