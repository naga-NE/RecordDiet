import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="modal-sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}>
      <header className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="閉じる"><X size={21}/></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>
}
