const guards=new WeakMap();

/** Let the page scroll without the browser stepping a focused number input. */
export function preventNumberInputWheelChanges(root) {
  if (!root) return Object.freeze({destroy(){}});
  if (guards.has(root)) return guards.get(root);
  const onWheel=event=>{
    const input=event.target?.closest?.('input[type="number"]');
    if (input&&root.contains(input)&&root.ownerDocument.activeElement===input&&!input.readOnly) input.blur();
  };
  root.addEventListener('wheel',onWheel,{capture:true,passive:true});
  const api=Object.freeze({destroy(){root.removeEventListener('wheel',onWheel,true);guards.delete(root);}});
  guards.set(root,api);return api;
}
