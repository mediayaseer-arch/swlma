import type { DirectedStepAction } from "./directed-step-action";

export type DirectedStepExecutorDeps = {
  navigate: (path: string) => void;
  onRestaurantInternal: (step: number) => void;
  clear: () => Promise<void> | void;
};

export async function executeDirectedStepAction(
  action: DirectedStepAction,
  deps: DirectedStepExecutorDeps,
): Promise<boolean> {
  if (action.kind === "ignore") return false;

  try {
    if (action.kind === "navigate") deps.navigate(action.path);
    else deps.onRestaurantInternal(action.step);
    return true;
  } finally {
    await deps.clear();
  }
}
