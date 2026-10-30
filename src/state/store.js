/** One write boundary for the calculator. Published snapshots are immutable. */
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export function createCalculatorStore(initial = {}, onError = console.error) {
  let state = freeze(structuredClone(initial));
  let revision = 0, dirty = true, notifying = false;
  const listeners = new Set();
  function getState() { return freeze({ ...state, revision }); }
  function publish() {
    if (!dirty || notifying) return;
    notifying = true;
    try {
      while (dirty) {
        dirty = false;
        const snapshot = getState();
        for (const listener of listeners) {
          try { listener(snapshot); } catch (error) { onError(error); }
          // A derived-result subscriber may dispatch a newer coherent state.
          // Never deliver the now-obsolete snapshot to the remaining views.
          if (dirty) break;
        }
      }
    } finally { notifying = false; }
  }
  function dispatch(action, { notify = true } = {}) {
    if (!action || action.type !== 'patch' || !action.patch || typeof action.patch !== 'object') {
      throw new TypeError('Unknown calculator action');
    }
    const patch = action.patch;
    const changed = Object.keys(patch).some(key => !Object.is(state[key], patch[key]));
    if (!changed) return getState();
    state = freeze({ ...state, ...structuredClone(patch) });
    revision += 1;
    dirty = true;
    if (notify) publish();
    return getState();
  }
  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Listener must be a function');
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }
  // Local migration adapter: every legacy assignment still goes through dispatch.
  // The adapter is never exposed to chart/render consumers.
  const editor = new Proxy({}, {
    get: (_, key) => state[key],
    set: (_, key, value) => { dispatch({ type: 'patch', patch: { [key]: value } }, { notify: false }); return true; },
    ownKeys: () => Reflect.ownKeys(state),
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  });
  return Object.freeze({ getState, dispatch, subscribe, publish, editor });
}
