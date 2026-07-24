import { useEffect } from 'react'
import { backendConfigured, connectEvents, getBackendUrl } from './backend'
import { useEmr } from './emrStore'

/**
 * Subscribe to backend Server-Sent Events and dispatch them into the store.
 * Both /emr and /console mount this, so a call fired from the console shows up
 * live on the /emr projector window (cross-window sync). No-op in simulation
 * mode (no backend configured).
 */
export function useEmrEvents() {
  const handleEvent = useEmr((s) => s.handleEvent)
  useEffect(() => {
    if (!backendConfigured()) return
    const es = connectEvents(getBackendUrl(), handleEvent)
    return () => es.close()
  }, [handleEvent])
}
