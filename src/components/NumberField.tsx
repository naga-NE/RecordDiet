import { Minus, Plus } from 'lucide-react'

export function NumberField({ label, value, onChange, step = 1, min = 0, unit, decimal = false }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; unit?: string; decimal?: boolean }) {
  const digits = decimal ? 1 : 0
  const set = (v: number) => onChange(Math.max(min, Number(v.toFixed(digits))))
  return <div className="number-field">
    <span className="number-label">{label}</span>
    <div className="number-control">
      <button type="button" onClick={() => set(value - step)} aria-label={`${label}を減らす`}><Minus size={18}/></button>
      <label><input inputMode="decimal" value={value} onChange={e => set(Number(e.target.value) || 0)} /><small>{unit}</small></label>
      <button type="button" onClick={() => set(value + step)} aria-label={`${label}を増やす`}><Plus size={18}/></button>
    </div>
  </div>
}
