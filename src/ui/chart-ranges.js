/** Parse an optional display-axis maximum; this does not alter calculator inputs. */
export function parseAxisMaximum(raw, { minimum = 0, maximum = 1e12 } = {}) {
  const text = String(raw).trim();
  if (text === '') return null;
  const value = Number(text);
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum
      || !Number.isFinite(value) || value < 1e-12 || value <= minimum || value > maximum) {
    throw new RangeError(`图轴上限必须大于 ${minimum}，并在 1e-12 至 ${maximum} 的显示范围内。`);
  }
  return value;
}

/** Canvas scales require a finite, increasing interval and a finite span. */
export function hasFiniteRange(minimum, maximum) {
  return Number.isFinite(minimum) && Number.isFinite(maximum)
    && maximum > minimum && Number.isFinite(maximum - minimum);
}

/** Submit endpoint edits once, including browsers that emit change during blur. */
export function bindAxisMaximumInput(input,{commit,sync}={}) {
  let submitting=false;
  const change=()=>{if(!submitting)commit?.();};
  const blur=()=>{if(!submitting)sync?.();};
  const keydown=event=>{
    if(event.key!=='Enter')return;
    event.preventDefault();submitting=true;
    try{commit?.();input.blur();}
    finally{submitting=false;sync?.();}
  };
  input.addEventListener('change',change);
  input.addEventListener('blur',blur);
  input.addEventListener('keydown',keydown);
  return Object.freeze({destroy(){
    input.removeEventListener('change',change);
    input.removeEventListener('blur',blur);
    input.removeEventListener('keydown',keydown);
  }});
}
