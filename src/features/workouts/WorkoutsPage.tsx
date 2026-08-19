import { ChevronLeft, ChevronRight, Copy, Dumbbell, Plus, Save, TimerReset, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '../../components/Modal'
import { NumberField } from '../../components/NumberField'
import { deleteWorkout, listExerciseCatalog, listWorkouts, saveExerciseCatalogItem, saveWorkout } from '../../lib/db'
import { formatDate, formatTime, localDateKey, shiftDate } from '../../lib/date'
import { ensureSeedData } from '../../lib/seed'
import { swipeDateHandlers } from '../../lib/swipe'
import type { ExerciseCatalogItem, WorkoutExercise, WorkoutRecord, WorkoutSet } from '../../types/models'

export function WorkoutsPage() {
  const [records,setRecords]=useState<WorkoutRecord[]>([])
  const [catalog,setCatalog]=useState<ExerciseCatalogItem[]>([])
  const [editing,setEditing]=useState<WorkoutRecord|null>(null)
  const [date,setDate]=useState(localDateKey())

  async function refresh(){await ensureSeedData();setRecords((await listWorkouts()).sort((a,b)=>b.startedAt.localeCompare(a.startedAt)));setCatalog((await listExerciseCatalog()).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name)))}
  useEffect(()=>{void refresh()},[])

  function newWorkout(){const now=new Date().toISOString();setEditing({id:crypto.randomUUID(),date:localDateKey(),startedAt:now,createdAt:now,exercises:[]})}
  function copyLast(){if(!records[0])return newWorkout();const now=new Date().toISOString();setEditing({...records[0],id:crypto.randomUUID(),date:localDateKey(),startedAt:now,endedAt:undefined,durationMin:undefined,createdAt:now,exercises:records[0].exercises.map(e=>({...e,id:crypto.randomUUID(),sets:e.sets.map(s=>({...s,id:crypto.randomUUID(),actualRestSec:undefined,completedAt:undefined}))}))})}

  const totalSets=(w:WorkoutRecord)=>w.exercises.reduce((n,e)=>n+e.sets.length,0)
  const volume=(w:WorkoutRecord)=>w.exercises.reduce((n,e)=>n+e.sets.reduce((s,x)=>s+x.weightKg*x.reps,0),0)
  const dayRecords=records.filter(record=>record.date===date)
  const previousDay=()=>setDate(value=>shiftDate(value,-1))
  const nextDay=()=>setDate(value=>value<localDateKey()?shiftDate(value,1):value)
  const swipe=swipeDateHandlers(previousDay,nextDay)

  return <section>
    <header className="page-header"><div><p className="eyebrow">WORKOUT</p><h1>筋トレ</h1></div><button className="icon-button" onClick={newWorkout}><Plus size={22}/></button></header>
    <div className="quick-actions"><button className="card action-card" onClick={newWorkout}><Dumbbell/><span><b>トレーニング開始</b><small>セットごとにリアルタイム記録</small></span></button><button className="card action-card" onClick={copyLast} disabled={!records.length}><Copy/><span><b>前回をコピー</b><small>{records[0]?formatDate(records[0].date):'履歴なし'}</small></span></button></div>

    <div className="date-pager" aria-label="筋トレ履歴の日付"><button onClick={previousDay} aria-label="前日"><ChevronLeft/></button><div><small>左右にスワイプ</small><strong>{formatDate(date)}</strong></div><button onClick={nextDay} disabled={date>=localDateKey()} aria-label="翌日"><ChevronRight/></button></div>
    <div className="section-title"><h2>履歴</h2><span>{dayRecords.length}件</span></div>
    <div className="stack swipe-history" {...swipe}>{dayRecords.length===0?<div className="empty">この日の筋トレ記録はありません。</div>:dayRecords.map(r=><article className="card workout-history" key={r.id}><button className="history-main" onClick={()=>setEditing(r)}><div><strong>{formatTime(r.startedAt)}</strong><small>{r.exercises.map(e=>e.name).join('、')}</small></div><div className="metrics vertical"><b>{totalSets(r)} set</b><small>{Math.round(volume(r)).toLocaleString()} kg</small></div></button><button className="delete-inline" onClick={()=>void deleteWorkout(r.id).then(refresh)} aria-label="削除"><Trash2 size={17}/></button></article>)}</div>

    {editing&&<WorkoutEditor
      initial={editing}
      catalog={catalog}
      records={records}
      onClose={()=>setEditing(null)}
      onSaved={async()=>{setEditing(null);await refresh()}}
      onCatalogChanged={refresh}
    />}
  </section>
}

function WorkoutEditor({initial,catalog,records,onClose,onSaved,onCatalogChanged}:{initial:WorkoutRecord;catalog:ExerciseCatalogItem[];records:WorkoutRecord[];onClose:()=>void;onSaved:()=>void;onCatalogChanged:()=>void}){
  const [workout,setWorkout]=useState(initial)
  const [exercisePicker,setExercisePicker]=useState(false)
  const [rest,setRest]=useState<{exerciseId:string;setId:string;planned:number}|null>(null)
  const [elapsed,setElapsed]=useState(0)
  const startedRef=useRef<number>(0)

  useEffect(()=>{if(!rest)return;startedRef.current=Date.now();setElapsed(0);const id=window.setInterval(()=>setElapsed(Math.floor((Date.now()-startedRef.current)/1000)),1000);return()=>window.clearInterval(id)},[rest])

  function addExercise(item:ExerciseCatalogItem){setWorkout(w=>({...w,exercises:[...w.exercises,{id:crypto.randomUUID(),catalogId:item.id,name:item.name,sets:[]}]}));setExercisePicker(false)}
  function updateSet(exId:string,setId:string,patch:Partial<WorkoutSet>){setWorkout(w=>({...w,exercises:w.exercises.map(e=>e.id===exId?{...e,sets:e.sets.map(s=>s.id===setId?{...s,...patch}:s)}:e)}))}
  function addSet(ex:WorkoutExercise){const prev=ex.sets.at(-1);const set:WorkoutSet={id:crypto.randomUUID(),weightKg:prev?.weightKg??0,reps:prev?.reps??10,rpe:prev?.rpe??8,plannedRestSec:prev?.plannedRestSec??90};setWorkout(w=>({...w,exercises:w.exercises.map(e=>e.id===ex.id?{...e,sets:[...e.sets,set]}:e)}))}
  function duplicateSet(exId:string,set:WorkoutSet){setWorkout(w=>({...w,exercises:w.exercises.map(e=>e.id===exId?{...e,sets:[...e.sets,{...set,id:crypto.randomUUID(),actualRestSec:undefined,completedAt:undefined}]}:e)}))}
  function removeSet(exId:string,setId:string){setWorkout(w=>({...w,exercises:w.exercises.map(e=>e.id===exId?{...e,sets:e.sets.filter(s=>s.id!==setId)}:e)}))}
  function removeExercise(exId:string){setWorkout(w=>({...w,exercises:w.exercises.filter(e=>e.id!==exId)}))}
  function completeSet(exId:string,set:WorkoutSet){updateSet(exId,set.id,{completedAt:new Date().toISOString()});setRest({exerciseId:exId,setId:set.id,planned:set.plannedRestSec??90})}
  function stopRest(){if(!rest)return;updateSet(rest.exerciseId,rest.setId,{actualRestSec:elapsed});setRest(null)}
  async function save(){const ended=new Date();const started=new Date(workout.startedAt);await saveWorkout({...workout,endedAt:ended.toISOString(),durationMin:Math.max(0,Math.round((ended.getTime()-started.getTime())/60000))});await onSaved()}

  const previousFor=(name:string)=>records.find(r=>r.id!==workout.id&&r.exercises.some(e=>e.name===name))?.exercises.find(e=>e.name===name)
  function copyPrevious(exId:string,name:string){const prev=previousFor(name);if(!prev)return;setWorkout(w=>({...w,exercises:w.exercises.map(e=>e.id===exId?{...e,sets:prev.sets.map(s=>({...s,id:crypto.randomUUID(),actualRestSec:undefined,completedAt:undefined}))}:e)}))}

  return <Modal title="トレーニング記録" onClose={onClose}>
    <label className="date-input standalone"><input type="date" value={workout.date} max={localDateKey()} onChange={e=>setWorkout(w=>({...w,date:e.target.value}))}/></label>
    <div className="workout-editor-head"><span>開始 {formatTime(workout.startedAt)}</span><button className="secondary small-button" onClick={()=>setExercisePicker(true)}><Plus size={16}/> 種目</button></div>
    <div className="stack workout-exercises">{workout.exercises.map(ex=><article className="exercise-block" key={ex.id}><header><div><strong>{ex.name}</strong>{previousFor(ex.name)&&<small>前回記録あり</small>}</div><div>{previousFor(ex.name)&&<button onClick={()=>copyPrevious(ex.id,ex.name)}><Copy size={16}/></button>}<button onClick={()=>removeExercise(ex.id)}><X size={18}/></button></div></header>
      <div className="set-list">{ex.sets.map((set,index)=><div className={`set-card ${set.completedAt?'complete':''}`} key={set.id}><div className="set-title"><b>SET {index+1}</b>{set.completedAt&&<span>完了</span>}<div><button onClick={()=>duplicateSet(ex.id,set)}><Copy size={15}/></button><button onClick={()=>removeSet(ex.id,set.id)}><Trash2 size={15}/></button></div></div><div className="set-fields"><NumberField label="重量" value={set.weightKg} onChange={v=>updateSet(ex.id,set.id,{weightKg:v})} step={2.5} unit="kg" decimal/><NumberField label="回数" value={set.reps} onChange={v=>updateSet(ex.id,set.id,{reps:v})} unit="回"/><NumberField label="RPE" value={set.rpe??8} onChange={v=>updateSet(ex.id,set.id,{rpe:v})} step={0.5} min={1} decimal/><NumberField label="休憩" value={set.plannedRestSec??90} onChange={v=>updateSet(ex.id,set.id,{plannedRestSec:v})} step={15} unit="秒"/></div>{set.actualRestSec!==undefined&&<div className="rest-result">実測インターバル {set.actualRestSec}秒</div>}<button className="set-complete" onClick={()=>completeSet(ex.id,set)}>{set.completedAt?'もう一度タイマー開始':'セット完了 → タイマー開始'}</button></div>)}</div>
      <button className="outline full" onClick={()=>addSet(ex)}><Plus size={17}/> セット追加</button>
    </article>)}</div>
    {workout.exercises.length===0&&<button className="empty exercise-empty" onClick={()=>setExercisePicker(true)}>＋ 種目を追加して開始</button>}
    <label className="editor-form note-field">メモ<textarea value={workout.note??''} onChange={e=>setWorkout(w=>({...w,note:e.target.value}))} placeholder="フォームや体調など"/></label>
    <button className="primary save-workout" onClick={()=>void save()} disabled={workout.exercises.length===0}><Save size={18}/> トレーニングを保存</button>

    {rest&&<div className="rest-overlay"><div><small>インターバル</small><strong>{String(Math.floor(elapsed/60)).padStart(2,'0')}:{String(elapsed%60).padStart(2,'0')}</strong><span>設定 {rest.planned}秒 {elapsed>=rest.planned?'· 完了':''}</span><button className="primary" onClick={stopRest}>次のセットへ</button><button className="ghost full" onClick={()=>{setElapsed(0);startedRef.current=Date.now()}}><TimerReset size={17}/> リセット</button></div></div>}
    {exercisePicker&&<ExercisePicker
      catalog={catalog}
      onPick={addExercise}
      onClose={()=>setExercisePicker(false)}
      onAdded={onCatalogChanged}
    />}
  </Modal>
}

function ExercisePicker({catalog,onPick,onClose,onAdded}:{catalog:ExerciseCatalogItem[];onPick:(x:ExerciseCatalogItem)=>void;onClose:()=>void;onAdded:()=>void}){
  const [name,setName]=useState('')
  async function addCustom(){if(!name.trim())return;const item={id:crypto.randomUUID(),name:name.trim(),favorite:true,createdAt:new Date().toISOString()};await saveExerciseCatalogItem(item);await onAdded();onPick(item)}
  return <div className="nested-sheet"><header className="modal-header"><h2>種目を選択</h2><button className="icon-button" onClick={onClose}><X size={20}/></button></header><div className="stack compact">{catalog.map(item=><button className="card picker-row" key={item.id} onClick={()=>onPick(item)}><span>{item.name}</span><Plus size={18}/></button>)}</div><div className="custom-exercise"><input value={name} onChange={e=>setName(e.target.value)} placeholder="新しい種目名"/><button className="secondary" onClick={()=>void addCustom()}>追加</button></div></div>
}
