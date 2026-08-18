const NETWORK_ERROR = 'Diet Log is local-only: outbound network access is disabled.'

const isDevelopment = import.meta.env.DEV

export function enableNetworkLockdown() {
  // Vite's dev server needs network access for HMR. Production builds are locked down.
  if (isDevelopment) return

  const blocked = () => {
    throw new Error(NETWORK_ERROR)
  }

  window.fetch = (() => Promise.reject(new Error(NETWORK_ERROR))) as typeof window.fetch

  class BlockedXMLHttpRequest {
    constructor() { blocked() }
  }
  Object.defineProperty(window, 'XMLHttpRequest', { value: BlockedXMLHttpRequest, configurable: false, writable: false })

  class BlockedWebSocket {
    constructor() { blocked() }
  }
  Object.defineProperty(window, 'WebSocket', { value: BlockedWebSocket, configurable: false, writable: false })

  class BlockedEventSource {
    constructor() { blocked() }
  }
  Object.defineProperty(window, 'EventSource', { value: BlockedEventSource, configurable: false, writable: false })

  Object.defineProperty(navigator, 'sendBeacon', {
    value: () => false,
    configurable: false,
    writable: false,
  })
}
