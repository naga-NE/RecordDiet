export type BodyRecord = {
  date: string
  weightKg: number
  bodyFatPercent: number
  updatedAt: string
}

export type FoodItem = {
  id: string
  name: string
  kcal: number
  protein: number
  fat: number
  carbs: number
  favorite?: boolean
  createdAt?: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

export type MealItem = FoodItem & {
  amount: number
}

export type MealRecord = {
  id: string
  date: string
  type: MealType
  name: string
  items: MealItem[]
  createdAt: string
}

export type ExerciseCatalogItem = {
  id: string
  name: string
  favorite?: boolean
  createdAt: string
}

export type WorkoutSet = {
  id: string
  weightKg: number
  reps: number
  rpe?: number
  plannedRestSec?: number
  actualRestSec?: number
  completedAt?: string
}

export type WorkoutExercise = {
  id: string
  catalogId?: string
  name: string
  sets: WorkoutSet[]
}

export type WorkoutRecord = {
  id: string
  date: string
  startedAt: string
  endedAt?: string
  durationMin?: number
  exercises: WorkoutExercise[]
  note?: string
  createdAt: string
}
