import { openDB, type DBSchema } from 'idb'
import type { BodyRecord, ExerciseCatalogItem, FoodItem, MealRecord, WorkoutRecord } from '../types/models'

interface DietLogDB extends DBSchema {
  bodyRecords: { key: string; value: BodyRecord }
  foods: { key: string; value: FoodItem; indexes: { 'by-name': string } }
  meals: { key: string; value: MealRecord; indexes: { 'by-date': string; 'by-created': string } }
  workouts: { key: string; value: WorkoutRecord; indexes: { 'by-date': string; 'by-created': string } }
  exerciseCatalog: { key: string; value: ExerciseCatalogItem; indexes: { 'by-name': string } }
}

const dbPromise = openDB<DietLogDB>('diet-log-db', 2, {
  upgrade(db, oldVersion, _newVersion, tx) {
    if (oldVersion < 1) {
      db.createObjectStore('bodyRecords')
      const foods = db.createObjectStore('foods', { keyPath: 'id' })
      foods.createIndex('by-name', 'name')
      const meals = db.createObjectStore('meals', { keyPath: 'id' })
      meals.createIndex('by-date', 'date')
      const workouts = db.createObjectStore('workouts', { keyPath: 'id' })
      workouts.createIndex('by-date', 'date')
    }
    if (oldVersion < 2) {
      const meals = tx.objectStore('meals')
      if (!meals.indexNames.contains('by-created')) meals.createIndex('by-created', 'createdAt')
      const workouts = tx.objectStore('workouts')
      if (!workouts.indexNames.contains('by-created')) workouts.createIndex('by-created', 'createdAt')
      const catalog = db.createObjectStore('exerciseCatalog', { keyPath: 'id' })
      catalog.createIndex('by-name', 'name')
    }
  },
})

export async function saveBodyRecord(record: BodyRecord) { return (await dbPromise).put('bodyRecords', record, record.date) }
export async function deleteBodyRecord(date: string) { return (await dbPromise).delete('bodyRecords', date) }
export async function getBodyRecord(date: string) { return (await dbPromise).get('bodyRecords', date) }
export async function listBodyRecords() { return (await dbPromise).getAll('bodyRecords') }

export async function saveFood(food: FoodItem) { return (await dbPromise).put('foods', food) }
export async function deleteFood(id: string) { return (await dbPromise).delete('foods', id) }
export async function listFoods() { return (await dbPromise).getAll('foods') }

export async function saveMeal(meal: MealRecord) { return (await dbPromise).put('meals', meal) }
export async function deleteMeal(id: string) { return (await dbPromise).delete('meals', id) }
export async function listMeals() { return (await dbPromise).getAll('meals') }

export async function saveExerciseCatalogItem(item: ExerciseCatalogItem) { return (await dbPromise).put('exerciseCatalog', item) }
export async function listExerciseCatalog() { return (await dbPromise).getAll('exerciseCatalog') }

export async function saveWorkout(workout: WorkoutRecord) { return (await dbPromise).put('workouts', workout) }
export async function deleteWorkout(id: string) { return (await dbPromise).delete('workouts', id) }
export async function listWorkouts() { return (await dbPromise).getAll('workouts') }
