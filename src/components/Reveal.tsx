import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../hooks/useInView'

interface RevealProps {
  as?: 'div' | 'li'
  delay?: number
  className?: string
  children: ReactNode
}

/** Fades and slides its children in the first time they scroll into view. */
export function Reveal({ as: Tag = 'div', delay = 0, className, children }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement & HTMLLIElement>()
  const style = delay ? ({ transitionDelay: `${delay}ms` } as CSSProperties) : undefined

  return (
    <Tag
      ref={ref}
      className={className ? `reveal ${className}` : 'reveal'}
      data-visible={inView}
      style={style}
    >
      {children}
    </Tag>
  )
}
