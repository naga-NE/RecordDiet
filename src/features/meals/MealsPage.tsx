import { Copy, Plus, Search, Star, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { deleteFood, deleteMeal, listFoods, listMeals, saveFood, saveMeal } from '../../lib/db'
import { formatDate, formatTime, localDateKey } from '../../lib/date'
import { mealTotals, mealsTotals } from '../../lib/nutrition'
import { ensureSeedData } from '../../lib/seed'
import type { FoodItem, MealItem, MealRecord, MealType } from '../../types/models'

const mealLabels: Record<MealType, string> = { breakfast: '朝食', lunch: '昼食', dinner: '夕食', snack: '間食', other: '食事' }

export function MealsPage() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [query, setQuery] = useState('')
  const [date, setDate] = useState(localDateKey())
  const [type, setType] = useState<MealType>('other')
  const [selected, setSelected] = useState<MealItem[]>([])
  const [tab, setTab] = useState<'foods' | 'recent'>('foods')
  const [foodModal, setFoodModal] = useState(false)

  async function refresh() {
    await ensureSeedData()
    setFoods((await listFoods()).sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name)))
    setMeals((await listMeals()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }
  useEffect(() => { void refresh() }, [])

  const dayMeals = useMemo(() => meals.filter(m => m.date === date), [meals, date])
  const dayTotals = useMemo(() => mealsTotals(dayMeals), [dayMeals])
  const filtered = useMemo(() => foods.filter(f => f.name.toLowerCase().includes(query.toLowerCase())), [foods, query])
  const selectedTotals = useMemo(() => mealsTotals(selected.length ? [{ id: 'draft', date, type, name: '', items: selected, createdAt: '' }] : []), [selected, date, type])

  function addFood(food: FoodItem) {
    setSelected(items => {
      const found = items.find(i => i.id === food.id)
      if (found) return items.map(i => i.id === food.id ? { ...i, amount: i.amount + 1 } : i)
      return [...items, { ...food, amount: 1 }]
    })
  }
  function amount(id: string, delta: number) {
    setSelected(items => items.map(i => i.id === id ? { ...i, amount: Math.max(0, Number((i.amount + delta).toFixed(1))) } : i).filter(i => i.amount > 0))
  }

  async function addMeal() {
    if (!selected.length) return
    const now = new Date().toISOString()
    await saveMeal({ id: crypto.randomUUID(), date, type, name: mealLabels[type], items: selected, createdAt: now })
    setSelected([])
    await refresh()
  }

  async function repeatMeal(meal: MealRecord) {
    const now = new Date().toISOString()
    await saveMeal({ ...meal, id: crypto.randomUUID(), date, createdAt: now })
    await refresh()
  }

  async function toggleFavorite(food: FoodItem) {
    await saveFood({ ...food, favorite: !food.favorite })
    await refresh()
  }

  return <section>
    <header className="page-header"><div><p className="eyebrow">MEALS</p><h1>食事</h1></div><button className="icon-button" onClick={() => setFoodModal(true)} aria-label="食品を追加"><Plus size={22}/></button></header>

    <article className="card daily-total">
      <div><small>{formatDate(date)}の合計</small><strong>{Math.round(dayTotals.kcal)} <em>kcal</em></strong></div>
      <div className="pfc"><span>P <b>{dayTotals.protein.toFixed(1)}g</b></span><span>F <b>{dayTotals.fat.toFixed(1)}g</b></span><span>C <b>{dayTotals.carbs.toFixed(1)}g</b></span></div>
    </article>
    <label className="date-input standalone"><input type="date" value={date} max={localDateKey()} onChange={e => setDate(e.target.value)} /></label>

    <div className="segmented meal-tabs">{(['breakfast','lunch','dinner','snack','other'] as MealType[]).map(t => <button key={t} className={type===t?'active':''} onClick={() => setType(t)}>{mealLabels[t]}</button>)}</div>
    <div className="search"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="食品を検索" /></div>
    <div className="chips"><button className={`chip ${tab==='foods'?'active':''}`} onClick={() => setTab('foods')}>食品</button><button className={`chip ${tab==='recent'?'active':''}`} onClick={() => setTab('recent')}>最近の食事</button></div>

    {tab === 'foods' ? <div className="stack compact">
      {filtered.map(food => <article key={food.id} className="card food-row">
        <button className="food-main" onClick={() => addFood(food)}><div><strong>{food.name}</strong><small>{food.kcal} kcal / P {food.protein} / F {food.fat} / C {food.carbs}</small></div><Plus size={20}/></button>
        <button className={`star-button ${food.favorite?'on':''}`} onClick={() => void toggleFavorite(food)} aria-label="お気に入り"><Star size={17} fill={food.favorite?'currentColor':'none'}/></button>
      </article>)}
    </div> : <div className="stack compact">
      {meals.length === 0 ? <div className="empty">再利用できる履歴がまだありません。</div> : meals.slice(0,12).map(meal => { const n=mealTotals(meal); return <button className="card recent-meal" key={meal.id} onClick={() => void repeatMeal(meal)}><Copy size={18}/><div><strong>{mealLabels[meal.type]} · {Math.round(n.kcal)} kcal</strong><small>{meal.items.map(i=>`${i.name}${i.amount!==1?` ×${i.amount}`:''}`).join('、')}</small></div></button> })}
    </div>}

    {selected.length > 0 && <div className="sticky-composer card">
      <div className="selected-list">{selected.map(item => <div className="selected-item" key={item.id}><span>{item.name}</span><div><button onClick={() => amount(item.id,-1)}>-</button><b>{item.amount}</b><button onClick={() => amount(item.id,1)}>+</button></div></div>)}
        <div className="selected-total"><span>{selected.length}品</span><strong>{Math.round(selectedTotals.kcal)} kcal</strong></div>
      </div>
      <button className="primary compact-button" onClick={() => void addMeal()}>この食事を保存</button>
    </div>}

    <div className="section-title"><h2>{formatDate(date)}の記録</h2><span>{dayMeals.length}件</span></div>
    <div className="stack">{dayMeals.length===0?<div className="empty">この日の食事記録はありません。</div>:dayMeals.map(meal=>{const n=mealTotals(meal);return <article className="card meal-history" key={meal.id}><div className="meal-history-head"><div><strong>{mealLabels[meal.type]}</strong><small>{formatTime(meal.createdAt)} · {meal.items.length}品</small></div><div><b>{Math.round(n.kcal)} kcal</b><button onClick={()=>void deleteMeal(meal.id)} aria-label="削除"><Trash2 size={16}/></button></div></div><p>{meal.items.map(i=>`${i.name}${i.amount!==1?` ×${i.amount}`:''}`).join('、')}</p><div className="mini-pfc">P {n.protein.toFixed(1)} / F {n.fat.toFixed(1)} / C {n.carbs.toFixed(1)}</div></article>})}</div>

    {foodModal && <FoodEditor
      onClose={()=>setFoodModal(false)}
      onSaved={async()=>{setFoodModal(false);await refresh()}}
      foods={foods}
    />}
  </section>
}

function FoodEditor({ onClose, onSaved, foods }: { onClose:()=>void; onSaved:()=>void; foods:FoodItem[] }) {
  const [name,setName]=useState(''); const [kcal,setKcal]=useState(''); const [p,setP]=useState(''); const [f,setF]=useState(''); const [c,setC]=useState('')
  async function submit(e:FormEvent){e.preventDefault();if(!name||!kcal)return;await saveFood({id:crypto.randomUUID(),name,kcal:Number(kcal),protein:Number(p)||0,fat:Number(f)||0,carbs:Number(c)||0,favorite:true,createdAt:new Date().toISOString()});await onSaved()}
  async function remove(id:string){await deleteFood(id);await onSaved()}
  return <Modal title="食品を登録" onClose={onClose}><form onSubmit={submit} className="editor-form"><label>食品名<input value={name} onChange={e=>setName(e.target.value)} placeholder="例：オートミール 50g"/></label><div className="editor-grid"><label>kcal<input inputMode="decimal" value={kcal} onChange={e=>setKcal(e.target.value)}/></label><label>P (g)<input inputMode="decimal" value={p} onChange={e=>setP(e.target.value)}/></label><label>F (g)<input inputMode="decimal" value={f} onChange={e=>setF(e.target.value)}/></label><label>C (g)<input inputMode="decimal" value={c} onChange={e=>setC(e.target.value)}/></label></div><button className="primary">お気に入り食品として追加</button></form><div className="section-title"><h2>登録済み食品</h2></div><div className="stack compact">{foods.map(food=><div className="manage-row" key={food.id}><span>{food.name}</span><button onClick={()=>void remove(food.id)}><Trash2 size={16}/></button></div>)}</div></Modal>
}
