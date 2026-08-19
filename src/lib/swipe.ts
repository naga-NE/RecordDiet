import type { TouchEventHandler } from 'react'

export function swipeDateHandlers(onPrevious: () => void, onNext: () => void) {
  let startX = 0
  const onTouchStart: TouchEventHandler<HTMLElement> = event => {
    startX = event.changedTouches[0]?.clientX ?? 0
  }
  const onTouchEnd: TouchEventHandler<HTMLElement> = event => {
    const distance = (event.changedTouches[0]?.clientX ?? startX) - startX
    if (Math.abs(distance) < 50) return
    if (distance < 0) onPrevious()
    else onNext()
  }
  return { onTouchStart, onTouchEnd }
}
