import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listBodyRecords, listMeals, listWorkouts } from '../../lib/db'
import { dateDaysAgo, formatDate, localDateKey } from '../../lib/date'
import { mealTotals } from '../../lib/nutrition'
import type { BodyRecord, MealRecord, WorkoutRecord } from '../../types/models'

type Range = '1W'|'1M'|'3M'|'ALL'|'CUSTOM'
type Metric = 'weight'|'fat'|'kcal'|'frequency'|'volume'|'strength'
type ChartPoint = { rawDate:string; date:string; [key:string]:string|number|undefined }

const metrics: {key:Metric;label:string;color:string;unit:string}[] = [
  {key:'weight',label:'体重',color:'#111111',unit:'kg'},
  {key:'fat',label:'体脂肪率',color:'#8b5cf6',unit:'%'},
  {key:'kcal',label:'カロリー',color:'#f97316',unit:'kcal'},
  {key:'frequency',label:'筋トレセット数',color:'#0ea5e9',unit:'set'},
  {key:'volume',label:'筋トレボリューム',color:'#10b981',unit:'kg'},
  {key:'strength',label:'種目最大重量',color:'#2563eb',unit:'kg'},
]

export function ChartsPage(){
  const [body,setBody]=useState<BodyRecord[]>([])
  const [meals,setMeals]=useState<MealRecord[]>([])
  const [workouts,setWorkouts]=useState<WorkoutRecord[]>([])
  const [range,setRange]=useState<Range>('1M')
  const [from,setFrom]=useState(dateDaysAgo(30))
  const [to,setTo]=useState(localDateKey())
  const [selected,setSelected]=useState<Metric[]>(['weight'])
  const [exercise,setExercise]=useState('')

  useEffect(()=>{void Promise.all([listBodyRecords(),listMeals(),listWorkouts()]).then(([b,m,w])=>{setBody(b);setMeals(m);setWorkouts(w)})},[])
  const bounds=useMemo(()=>{if(range==='ALL')return{start:'0000-01-01',end:'9999-12-31'};if(range==='CUSTOM')return{start:from,end:to};const days=range==='1W'?7:range==='1M'?30:90;return{start:dateDaysAgo(days-1),end:localDateKey()}},[range,from,to])
  const exerciseNames=useMemo(()=>Array.from(new Set(workouts.flatMap(w=>w.exercises.map(e=>e.name)))).sort(),[workouts])
  useEffect(()=>{if(!exercise&&exerciseNames[0])setExercise(exerciseNames[0])},[exerciseNames,exercise])

  const data=useMemo(()=>{
    const points=new Map<string,ChartPoint>()
    const point=(date:string)=>{const existing=points.get(date);if(existing)return existing;const created:ChartPoint={rawDate:date,date:formatDate(date)};points.set(date,created);return created}
    body.forEach(record=>{const value=point(record.date);value.weight=record.weightKg;value.fat=record.bodyFatPercent})
    meals.forEach(meal=>{const value=point(meal.date);const total=mealTotals(meal);value.kcal=Number(value.kcal??0)+total.kcal})
    workouts.forEach(workout=>{const value=point(workout.date);value.frequency=Number(value.frequency??0)+workout.exercises.reduce((sum,item)=>sum+item.sets.length,0);value.volume=Number(value.volume??0)+workout.exercises.reduce((sum,item)=>sum+item.sets.reduce((setSum,set)=>setSum+set.weightKg*set.reps,0),0);const chosen=workout.exercises.find(item=>item.name===exercise);if(chosen)value.strength=Math.max(Number(value.strength??0),...chosen.sets.map(set=>set.weightKg))})
    return [...points.values()].filter(item=>item.rawDate>=bounds.start&&item.rawDate<=bounds.end).sort((a,b)=>a.rawDate.localeCompare(b.rawDate))
  },[body,meals,workouts,bounds,exercise])

  const pfc=useMemo(()=>meals.filter(meal=>meal.date>=bounds.start&&meal.date<=bounds.end).reduce((sum,meal)=>{const value=mealTotals(meal);return{protein:sum.protein+value.protein,fat:sum.fat+value.fat,carbs:sum.carbs+value.carbs}},{protein:0,fat:0,carbs:0}),[meals,bounds])
  const toggle=(metric:Metric)=>setSelected(current=>current.includes(metric)?(current.length===1?current:current.filter(item=>item!==metric)):[...current,metric])
  return <section>
    <header className="page-header"><div><p className="eyebrow">DASHBOARD</p><h1>グラフ</h1></div></header>
    <p className="chart-help">複数の項目を選ぶと、同じグラフに重ねて表示します。</p>
    <div className="metric-grid multi-select">{metrics.map(metric=><button key={metric.key} className={selected.includes(metric.key)?'active':''} onClick={()=>toggle(metric.key)}><i style={{background:metric.color}}/>{metric.label}</button>)}</div>
    <div className="segmented">{(['1W','1M','3M','ALL'] as Range[]).map(value=><button className={range===value?'active':''} onClick={()=>setRange(value)} key={value}>{value}</button>)}<button className={range==='CUSTOM'?'active':''} onClick={()=>setRange('CUSTOM')}>期間指定</button></div>
    {range==='CUSTOM'&&<div className="range-fields"><input type="date" value={from} onChange={event=>setFrom(event.target.value)}/><span>〜</span><input type="date" value={to} max={localDateKey()} onChange={event=>setTo(event.target.value)}/></div>}
    {selected.includes('strength')&&<select className="select-field" aria-label="筋トレ種目" value={exercise} onChange={event=>setExercise(event.target.value)}>{exerciseNames.map(name=><option key={name}>{name}</option>)}</select>}
    <article className="card chart-card overlay-chart"><div className="section-title inline"><div><small>選択中</small><h2>{selected.map(key=>metrics.find(metric=>metric.key===key)?.label).join('・')}</h2></div><span>{data.length}日</span></div><div className="chart-area">{data.length===0?<div className="empty chart-empty">この期間の記録がありません。</div>:<OverlayChart selected={selected} data={data}/>}</div></article>
    <PfcChart values={pfc}/>
    <article className="card stats-card"><strong>見方</strong><p>単位の違う項目は系列ごとに個別スケールで描画しています。線の高さそのものではなく、増減のタイミングや傾向を比較してください。</p></article>
  </section>
}

function PfcChart({values}:{values:{protein:number;fat:number;carbs:number}}){
  const data=[{name:'P たんぱく質',value:values.protein,color:'#ef4444'},{name:'F 脂質',value:values.fat,color:'#8b5cf6'},{name:'C 炭水化物',value:values.carbs,color:'#eab308'}]
  const total=data.reduce((sum,item)=>sum+item.value,0)
  return <article className="card chart-card pfc-chart"><div className="section-title inline"><div><small>選択期間の合計</small><h2>PFCバランス</h2></div></div><div className="chart-area">{total===0?<div className="empty chart-empty">食事記録がありません。</div>:<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="42%" outerRadius="72%" paddingAngle={2}>{data.map(item=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip formatter={value=>`${Number(value).toFixed(1)} g`}/><Legend/></PieChart></ResponsiveContainer>}</div></article>
}

function OverlayChart({selected,data}:{selected:Metric[];data:ChartPoint[]}){
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:8,right:12,bottom:0,left:0}}><CartesianGrid vertical={false}/><XAxis dataKey="date" tick={{fontSize:10}}/><Tooltip formatter={(value,name)=>{const metric=metrics.find(item=>item.label===name);return [`${Number(value).toLocaleString()} ${metric?.unit??''}`,String(name)]}}/><Legend/>{selected.map(key=><YAxis key={`axis-${key}`} yAxisId={key} hide domain={['auto','auto']}/>) }{selected.map(key=>{const metric=metrics.find(item=>item.key===key)!;return <Line key={key} yAxisId={key} type="monotone" dataKey={key} name={metric.label} stroke={metric.color} strokeWidth={2.5} connectNulls dot={{r:2}}/>})}</LineChart></ResponsiveContainer>
}
