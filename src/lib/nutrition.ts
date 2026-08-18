import type { MealItem, MealRecord } from '../types/models'

export type NutritionTotals = { kcal: number; protein: number; fat: number; carbs: number }

export const emptyNutrition: NutritionTotals = { kcal: 0, protein: 0, fat: 0, carbs: 0 }

export function itemTotals(item: MealItem): NutritionTotals {
  return {
    kcal: item.kcal * item.amount,
    protein: item.protein * item.amount,
    fat: item.fat * item.amount,
    carbs: item.carbs * item.amount,
  }
}

export function mealTotals(meal: MealRecord): NutritionTotals {
  return meal.items.reduce((sum, item) => {
    const n = itemTotals(item)
    return { kcal: sum.kcal + n.kcal, protein: sum.protein + n.protein, fat: sum.fat + n.fat, carbs: sum.carbs + n.carbs }
  }, { ...emptyNutrition })
}

export function mealsTotals(meals: MealRecord[]): NutritionTotals {
  return meals.reduce((sum, meal) => {
    const n = mealTotals(meal)
    return { kcal: sum.kcal + n.kcal, protein: sum.protein + n.protein, fat: sum.fat + n.fat, carbs: sum.carbs + n.carbs }
  }, { ...emptyNutrition })
}
