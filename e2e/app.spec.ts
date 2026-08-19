import { expect, test } from '@playwright/test'

async function clearLocalData(page: import('@playwright/test').Page) {
  await page.goto('/#/body')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('diet-log-db')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const names = Array.from(db.objectStoreNames)
        if (names.length === 0) { db.close(); resolve(); return }
        const tx = db.transaction(names, 'readwrite')
        names.forEach(name => tx.objectStore(name).clear())
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); reject(tx.error) }
      }
    })
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
}

test.beforeEach(async ({ page }) => {
  await clearLocalData(page)
})

test('トップ画面で体重とカロリーを重ね、PFCを円グラフで表示できる', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible()
  await page.getByRole('button', { name: 'カロリー' }).click()
  await expect(page.getByRole('button', { name: '体重' })).toHaveClass(/active/)
  await expect(page.getByRole('button', { name: 'カロリー' })).toHaveClass(/active/)
  await expect(page.getByRole('heading', { name: 'PFCバランス' })).toBeVisible()
})

test('身体記録を保存し、リロード後も端末内に残る', async ({ page }) => {
  await page.goto('/#/body')
  await page.getByLabel('体重').fill('101.2')
  await page.getByLabel('体脂肪率').fill('27.4')
  await page.getByRole('button', { name: '記録を保存' }).click()
  await expect(page.getByText('101.2 kg')).toBeVisible()
  await page.reload()
  await expect(page.getByText('101.2 kg')).toBeVisible()
  await expect(page.getByText('27.4 %')).toBeVisible()
})

test('食品から食事を保存して日次合計へ反映する', async ({ page }) => {
  await page.goto('/#/meals')
  await page.getByRole('button', { name: /白米 150g/ }).click()
  await page.getByRole('button', { name: /鶏むね肉 100g/ }).click()
  await expect(page.getByText('342 kcal')).toBeVisible()
  await page.getByRole('button', { name: 'この食事を保存' }).click()
  await expect(page.locator('.meal-history b', { hasText: '342 kcal' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('白米 150g、鶏むね肉 100g')).toBeVisible()
})

test('筋トレを開始してセットを保存する', async ({ page }) => {
  await page.goto('/#/workouts')
  await page.getByRole('button', { name: /トレーニング開始/ }).click()
  await page.getByRole('button', { name: /種目を追加して開始/ }).click()
  await page.getByRole('button', { name: /ベンチプレス/ }).click()
  await page.getByRole('button', { name: /セット追加/ }).click()
  await page.getByRole('button', { name: /トレーニングを保存/ }).click()
  await expect(page.getByText('1 set')).toBeVisible()
  await page.reload()
  await expect(page.getByText('ベンチプレス')).toBeVisible()
})

test('本番アプリから外向き fetch ができない', async ({ page }) => {
  await page.goto('/#/body')
  const result = await page.evaluate(async () => {
    try {
      await fetch('https://example.com')
      return 'allowed'
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  })
  expect(result).toContain('local-only')
})

test('PWAキャッシュ後はオフラインでも起動できる', async ({ page, context }) => {
  await page.goto('/#/body')
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: '身体記録' })).toBeVisible()
})
