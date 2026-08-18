import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { deleteBodyRecord, getBodyRecord, listBodyRecords, saveBodyRecord } from '../../lib/db'
import { formatDate, localDateKey } from '../../lib/date'
import type { BodyRecord } from '../../types/models'

export function BodyPage() {
  const [date, setDate] = useState(localDateKey())
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const [records, setRecords] = useState<BodyRecord[]>([])

  async function refresh() {
    const all = await listBodyRecords()
    setRecords(all.sort((a, b) => b.date.localeCompare(a.date)))
  }

  useEffect(() => { void refresh() }, [])
  useEffect(() => {
    void getBodyRecord(date).then(r => {
      setWeight(r ? String(r.weightKg) : '')
      setFat(r ? String(r.bodyFatPercent) : '')
    })
  }, [date])

  const latest = records[0]
  const previous = records[1]
  const delta = useMemo(() => latest && previous ? latest.weightKg - previous.weightKg : undefined, [latest, previous])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!weight || !fat) return
    await saveBodyRecord({ date, weightKg: Number(weight), bodyFatPercent: Number(fat), updatedAt: new Date().toISOString() })
    await refresh()
  }

  async function remove(d: string) {
    await deleteBodyRecord(d)
    if (d === date) { setWeight(''); setFat('') }
    await refresh()
  }

  return <section>
    <header className="page-header"><div><p className="eyebrow">BODY</p><h1>身体記録</h1></div></header>

    {latest && <div className="summary-grid">
      <article className="card summary-card"><small>最新体重</small><strong>{latest.weightKg}<em>kg</em></strong>{delta !== undefined && <span>{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg</span>}</article>
      <article className="card summary-card"><small>体脂肪率</small><strong>{latest.bodyFatPercent}<em>%</em></strong><span>{formatDate(latest.date)}</span></article>
    </div>}

    <form className="card form-card" onSubmit={submit}>
      <label className="date-input"><CalendarDays size={18}/><input type="date" value={date} max={localDateKey()} onChange={e => setDate(e.target.value)} /></label>
      <div className="field-row">
        <label>体重<input inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="102.4" /><span>kg</span></label>
        <label>体脂肪率<input inputMode="decimal" value={fat} onChange={e => setFat(e.target.value)} placeholder="28.3" /><span>%</span></label>
      </div>
      <button className="primary" type="submit">{records.some(r => r.date === date) ? 'この日の記録を更新' : '記録を保存'}</button>
      <p className="hint">1日1件。同じ日のデータはいつでも修正できます。</p>
    </form>

    <div className="section-title"><h2>履歴</h2><span>{records.length}件</span></div>
    <div className="stack">
      {records.length === 0 ? <div className="empty">まだ記録がありません。</div> : records.map(r => <article className="card history-row" key={r.date}>
        <button className="history-main" onClick={() => setDate(r.date)}>
          <div><strong>{formatDate(r.date)}</strong><small>{r.date}</small></div>
          <div className="metrics"><b>{r.weightKg} kg</b><b>{r.bodyFatPercent} %</b></div>
        </button>
        <div className="row-actions"><button onClick={() => setDate(r.date)} aria-label="編集"><Pencil size={17}/></button><button onClick={() => void remove(r.date)} aria-label="削除"><Trash2 size={17}/></button></div>
      </article>)}
    </div>
  </section>
}
