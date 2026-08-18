import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listBodyRecords, listMeals, listWorkouts } from '../../lib/db'
import { dateDaysAgo, formatDate, localDateKey } from '../../lib/date'
import { mealTotals } from '../../lib/nutrition'
import type { BodyRecord, MealRecord, WorkoutRecord } from '../../types/models'

type Range = '1W'|'1M'|'3M'|'ALL'|'CUSTOM'
type Metric = 'weight'|'fat'|'kcal'|'pfc'|'frequency'|'volume'|'strength'

export function ChartsPage(){
  const [body,setBody]=useState<BodyRecord[]>([]);const [meals,setMeals]=useState<MealRecord[]>([]);const [workouts,setWorkouts]=useState<WorkoutRecord[]>([])
  const [range,setRange]=useState<Range>('1M');const [from,setFrom]=useState(dateDaysAgo(30));const [to,setTo]=useState(localDateKey());const [metric,setMetric]=useState<Metric>('weight');const [exercise,setExercise]=useState('')
  useEffect(()=>{void Promise.all([listBodyRecords(),listMeals(),listWorkouts()]).then(([b,m,w])=>{setBody(b);setMeals(m);setWorkouts(w)})},[])
  const bounds=useMemo(()=>{if(range==='ALL')return {start:'0000-01-01',end:'9999-12-31'};if(range==='CUSTOM')return{start:from,end:to};const days=range==='1W'?7:range==='1M'?30:90;return{start:dateDaysAgo(days-1),end:localDateKey()}},[range,from,to])
  const inRange=useCallback((date:string)=>date>=bounds.start&&date<=bounds.end,[bounds])
  const exerciseNames=useMemo(()=>Array.from(new Set(workouts.flatMap(w=>w.exercises.map(e=>e.name)))).sort(),[workouts])
  useEffect(()=>{if(!exercise&&exerciseNames[0])setExercise(exerciseNames[0])},[exerciseNames,exercise])

  const data=useMemo(()=>{
    if(metric==='weight'||metric==='fat')return body.filter(r=>inRange(r.date)).sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({date:formatDate(r.date),rawDate:r.date,weight:r.weightKg,fat:r.bodyFatPercent}))
    if(metric==='kcal'||metric==='pfc'){
      const map=new Map<string,{date:string;kcal:number;protein:number;fat:number;carbs:number}>();meals.filter(m=>inRange(m.date)).forEach(m=>{const n=mealTotals(m);const x=map.get(m.date)??{date:m.date,kcal:0,protein:0,fat:0,carbs:0};x.kcal+=n.kcal;x.protein+=n.protein;x.fat+=n.fat;x.carbs+=n.carbs;map.set(m.date,x)});return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({...x,rawDate:x.date,date:formatDate(x.date)}))
    }
    if(metric==='frequency'||metric==='volume')return workouts.filter(w=>inRange(w.date)).sort((a,b)=>a.date.localeCompare(b.date)).map(w=>({date:formatDate(w.date),rawDate:w.date,sets:w.exercises.reduce((n,e)=>n+e.sets.length,0),volume:Math.round(w.exercises.reduce((n,e)=>n+e.sets.reduce((s,x)=>s+x.weightKg*x.reps,0),0))}))
    return workouts.filter(w=>inRange(w.date)).sort((a,b)=>a.date.localeCompare(b.date)).flatMap(w=>w.exercises.filter(e=>e.name===exercise).map(e=>({date:formatDate(w.date),rawDate:w.date,maxWeight:Math.max(0,...e.sets.map(s=>s.weightKg)),maxReps:Math.max(0,...e.sets.map(s=>s.reps))})))
  },[body,meals,workouts,metric,inRange,exercise])

  const title:Record<Metric,string>={weight:'体重',fat:'体脂肪率',kcal:'摂取カロリー',pfc:'PFC',frequency:'筋トレ頻度',volume:'トレーニングボリューム',strength:'種目ごとの成長'}
  return <section><header className="page-header"><div><p className="eyebrow">CHARTS</p><h1>グラフ</h1></div></header>
    <div className="metric-grid">{([['weight','体重'],['fat','体脂肪'],['kcal','カロリー'],['pfc','PFC'],['frequency','筋トレ'],['volume','ボリューム'],['strength','種目成長']] as [Metric,string][]).map(([k,l])=><button key={k} className={metric===k?'active':''} onClick={()=>setMetric(k)}>{l}</button>)}</div>
    <div className="segmented">{(['1W','1M','3M','ALL'] as Range[]).map(r=><button className={range===r?'active':''} onClick={()=>setRange(r)} key={r}>{r}</button>)}<button className={range==='CUSTOM'?'active':''} onClick={()=>setRange('CUSTOM')}>期間指定</button></div>
    {range==='CUSTOM'&&<div className="range-fields"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><span>〜</span><input type="date" value={to} max={localDateKey()} onChange={e=>setTo(e.target.value)}/></div>}
    {metric==='strength'&&<select className="select-field" value={exercise} onChange={e=>setExercise(e.target.value)}>{exerciseNames.map(n=><option key={n}>{n}</option>)}</select>}
    <article className="card chart-card"><div className="section-title inline"><div><small>{title[metric]}</small><h2>{latestLabel(metric,data)}</h2></div><span>{data.length}点</span></div><div className="chart-area">{data.length===0?<div className="empty chart-empty">この期間の記録がありません。</div>:<Chart metric={metric} data={data}/>}</div></article>
    <article className="card stats-card"><strong>見方</strong><p>{metric==='weight'?'日々の体重推移。短期の上下より、数週間の傾向を見る用途です。':metric==='fat'?'日々の体脂肪率の推移です。':metric==='kcal'?'日ごとの食事記録から摂取カロリーを自動集計しています。':metric==='pfc'?'日ごとのタンパク質・脂質・炭水化物を並べて確認できます。':metric==='frequency'?'筋トレ実施日ごとのセット数です。':metric==='volume'?'重量 × 回数を全セット合算したトレーニングボリュームです。':'選択種目で、その日の最大重量と最大回数を追えます。'}</p></article>
  </section>
}

function latestLabel(metric:Metric,data:any[]){const x=data.at(-1);if(!x)return '--';if(metric==='weight')return `${x.weight} kg`;if(metric==='fat')return `${x.fat} %`;if(metric==='kcal')return `${Math.round(x.kcal)} kcal`;if(metric==='pfc')return `P ${x.protein.toFixed(0)} / F ${x.fat.toFixed(0)} / C ${x.carbs.toFixed(0)}`;if(metric==='frequency')return `${x.sets} set`;if(metric==='volume')return `${x.volume.toLocaleString()} kg`;return `${x.maxWeight} kg`}

function Chart({metric,data}:{metric:Metric;data:any[]}){const common={data,margin:{top:8,right:8,bottom:0,left:-12}};if(metric==='kcal'||metric==='frequency'||metric==='volume')return <ResponsiveContainer width="100%" height="100%"><BarChart {...common}><CartesianGrid vertical={false}/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey={metric==='kcal'?'kcal':metric==='frequency'?'sets':'volume'} fill="currentColor" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer>;if(metric==='pfc')return <ResponsiveContainer width="100%" height="100%"><LineChart {...common}><CartesianGrid vertical={false}/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Line type="monotone" dataKey="protein" stroke="currentColor" strokeWidth={2}/><Line type="monotone" dataKey="fat" stroke="currentColor" strokeWidth={2} strokeDasharray="5 3"/><Line type="monotone" dataKey="carbs" stroke="currentColor" strokeWidth={2} strokeDasharray="2 3"/></LineChart></ResponsiveContainer>;return <ResponsiveContainer width="100%" height="100%"><LineChart {...common}><CartesianGrid vertical={false}/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis domain={['auto','auto']} tick={{fontSize:10}}/><Tooltip/><Line type="monotone" dataKey={metric==='weight'?'weight':metric==='fat'?'fat':'maxWeight'} stroke="currentColor" strokeWidth={2.5} dot={{r:3}}/>{metric==='strength'&&<Line type="monotone" dataKey="maxReps" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 3"/>}</LineChart></ResponsiveContainer>}
