import { describe, expect, it } from 'vitest'
import { itemTotals, mealTotals, mealsTotals } from './nutrition'
import type { MealItem, MealRecord } from '../types/models'

const rice: MealItem = { id: 'rice', name: '白米', kcal: 200, protein: 4, fat: 1, carbs: 45, amount: 1.5 }
const chicken: MealItem = { id: 'chicken', name: '鶏肉', kcal: 100, protein: 20, fat: 2, carbs: 0, amount: 2 }

function meal(id: string, items: MealItem[]): MealRecord {
  return { id, date: '2026-08-18', type: 'other', name: '食事', items, createdAt: '2026-08-18T12:00:00+09:00' }
}

describe('nutrition totals', () => {
  it('scales a food by amount', () => {
    expect(itemTotals(rice)).toEqual({ kcal: 300, protein: 6, fat: 1.5, carbs: 67.5 })
  })

  it('totals a meal', () => {
    expect(mealTotals(meal('1', [rice, chicken]))).toEqual({ kcal: 500, protein: 46, fat: 5.5, carbs: 67.5 })
  })

  it('totals multiple meals', () => {
    expect(mealsTotals([meal('1', [rice]), meal('2', [chicken])])).toEqual({ kcal: 500, protein: 46, fat: 5.5, carbs: 67.5 })
  })
})
