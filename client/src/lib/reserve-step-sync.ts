export function shouldSyncReserveStep(isInitialMount: boolean): boolean {
  return !isInitialMount;
}
