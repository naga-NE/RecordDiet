import { Activity, BarChart3, Dumbbell, Utensils } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const items = [
  { to: '/body', label: '身体', icon: Activity },
  { to: '/meals', label: '食事', icon: Utensils },
  { to: '/workouts', label: '筋トレ', icon: Dumbbell },
  { to: '/charts', label: 'グラフ', icon: BarChart3 },
]

export function AppShell() {
  return (
    <div className="app-shell">
      <main className="page"><Outlet /></main>
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={21} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
