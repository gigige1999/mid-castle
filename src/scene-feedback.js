/** A single, lightweight acknowledgement at the accepted scene tap. */
export function createSceneFeedback(container) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  return event => {
    if (reducedMotion.matches) return;
    active?.remove();
    const bounds = container.getBoundingClientRect();
    const pulse = document.createElement('span');
    pulse.className = 'scene-tap-feedback';
    pulse.setAttribute('aria-hidden', 'true');
    pulse.style.left = `${event.clientX - bounds.left}px`;
    pulse.style.top = `${event.clientY - bounds.top}px`;
    container.append(pulse);
    active = pulse;
    const animation = pulse.animate?.([
      { opacity: .8, scale: '.35' },
      { opacity: .4, scale: '1', offset: .45 },
      { opacity: 0, scale: '1.45' },
    ], { duration: 390, easing: 'cubic-bezier(.16,.7,.25,1)' });
    const remove = () => { pulse.remove(); if (active === pulse) active = null; };
    if (animation) animation.finished.then(remove, remove);
    else remove();
  };
}
