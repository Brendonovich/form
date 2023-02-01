import { Store } from "@tanstack/store";
import { createStore, reconcile } from "solid-js/store";

export function useStore<TState extends object>(store: Store<TState>) {
  const [state, setState] = createStore(store.state);

  store.subscribe((state) => setState(reconcile(state)));

  return state;
}
