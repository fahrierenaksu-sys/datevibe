export interface SessionClearPersistence {
  clear: () => Promise<void>
}

export async function logoutCurrentSession(
  persistence: SessionClearPersistence
): Promise<null> {
  await persistence.clear()
  return null
}
