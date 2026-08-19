import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { BodyPage } from './features/body/BodyPage'
import { MealsPage } from './features/meals/MealsPage'
import { WorkoutsPage } from './features/workouts/WorkoutsPage'
import { ChartsPage } from './features/charts/ChartsPage'

export default function App() {
  return <Routes><Route element={<AppShell/>}><Route index element={<Navigate to="/charts" replace/>}/><Route path="body" element={<BodyPage/>}/><Route path="meals" element={<MealsPage/>}/><Route path="workouts" element={<WorkoutsPage/>}/><Route path="charts" element={<ChartsPage/>}/></Route></Routes>
}
