export type StorageDurability = 'persistent' | 'best-effort' | 'unsupported'

export async function requestPersistentStorage(): Promise<StorageDurability> {
  if (!navigator.storage?.persist) return 'unsupported'
  try {
    const alreadyPersistent = await navigator.storage.persisted?.()
    if (alreadyPersistent) return 'persistent'
    return (await navigator.storage.persist()) ? 'persistent' : 'best-effort'
  } catch {
    return 'best-effort'
  }
}
