import { listExerciseCatalog, listFoods, saveExerciseCatalogItem, saveFood } from './db'
import type { ExerciseCatalogItem, FoodItem } from '../types/models'

const foods: FoodItem[] = [
  { id: 'rice-150', name: '白米 150g', kcal: 234, protein: 3.8, fat: 0.5, carbs: 55.7, favorite: true },
  { id: 'chicken-100', name: '鶏むね肉 100g', kcal: 108, protein: 23, fat: 1.5, carbs: 0, favorite: true },
  { id: 'egg', name: 'ゆで卵 1個', kcal: 78, protein: 6.3, fat: 5.3, carbs: 0.3, favorite: true },
  { id: 'natto', name: '納豆 1パック', kcal: 90, protein: 7.4, fat: 4.5, carbs: 5.4 },
  { id: 'protein', name: 'プロテイン 1杯', kcal: 120, protein: 24, fat: 1.8, carbs: 3.2, favorite: true },
  { id: 'banana', name: 'バナナ 1本', kcal: 86, protein: 1.1, fat: 0.2, carbs: 22.5 },
]

const exercises = ['ベンチプレス', 'スクワット', 'デッドリフト', 'ラットプルダウン', 'ショルダープレス', 'レッグプレス', 'ダンベルカール', 'トライセプスプレスダウン']

export async function ensureSeedData() {
  if ((await listFoods()).length === 0) await Promise.all(foods.map(f => saveFood({ ...f, createdAt: new Date().toISOString() })))
  if ((await listExerciseCatalog()).length === 0) {
    const now = new Date().toISOString()
    await Promise.all(exercises.map((name, i) => saveExerciseCatalogItem({ id: `exercise-${i + 1}`, name, favorite: i < 4, createdAt: now } as ExerciseCatalogItem)))
  }
}
