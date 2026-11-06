// Progressive enhancement: nothing is hidden while waiting for JavaScript or scrolling.
export function initMotion() {
  const root=document.documentElement;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const control=document.querySelector('#motion-toggle');
  const revealTargets=[...document.querySelectorAll('.hero-copy,.hero-art,.section-heading,.project-visual,.case-intro,.case-details>div,.service-card,.process-title,.step,.about-mark,.about-copy,.faq-list details,.contact-copy,.contact-panel')];
  const parallaxTargets=[...document.querySelectorAll('.hero-art,.project-visual')];
  const animations=new Set();
  const revealed=new WeakSet();
  let observer;
  let frame=0;
  let paused=false;
  try{paused=sessionStorage.getItem('portfolio-motion')==='off';}catch{/* Storage is optional. */}
  const active=()=>!preference.matches&&!paused;

  function updateBackgrounds(){
    frame=0;
    if(!active())return;
    for(const element of parallaxTargets){
      const rect=element.getBoundingClientRect();
      if(rect.bottom<0||rect.top>innerHeight)continue;
      // Decorative layer only. Text and cards stay aligned with normal scrolling.
      const offset=Math.max(-32,Math.min(32,(innerHeight*.45-rect.top)*.075));
      element.style.setProperty('--parallax-y',`${offset.toFixed(2)}px`);
    }
  }
  function schedule(){if(active()&&!frame)frame=requestAnimationFrame(updateBackgrounds);}
  function refresh(){
    observer?.disconnect();
    if(frame){cancelAnimationFrame(frame);frame=0;}
    for(const animation of animations)animation.cancel();
    animations.clear();
    root.classList.toggle('motion-enabled',active());
    root.classList.toggle('motion-paused',!active());
    for(const element of parallaxTargets)element.style.removeProperty('--parallax-y');
    if(control){
      control.hidden=false;
      control.disabled=preference.matches;
      control.setAttribute('aria-pressed',String(!active()));
      control.textContent=preference.matches?'Движение отключено в системе':paused?'Включить анимацию':'Отключить анимацию';
    }
    if(!active())return;
    if('IntersectionObserver' in window&&typeof Element.prototype.animate==='function'){
      observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting||revealed.has(entry.target))continue;
          revealed.add(entry.target);
          observer.unobserve(entry.target);
          if(entry.target.contains(document.activeElement))continue;
          const animation=entry.target.animate([
            {opacity:0,translate:'0 22px'},
            {opacity:1,translate:'0 0'}
          ],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
          animations.add(animation);
          const cleanup=()=>animations.delete(animation);
          animation.onfinish=cleanup;
          animation.oncancel=cleanup;
        }
      },{threshold:0,rootMargin:'0px 0px -16px 0px'});
      revealTargets.forEach(element=>{if(!revealed.has(element))observer.observe(element);});
    }
    schedule();
  }
  control?.addEventListener('click',()=>{
    paused=!paused;
    try{sessionStorage.setItem('portfolio-motion',paused?'off':'on');}catch{}
    refresh();
  });
  // Keyboard navigation never leaves the focused content mid-reveal.
  document.addEventListener('focusin',event=>{
    for(const animation of animations)if(animation.effect?.target?.contains(event.target))animation.finish();
  });
  preference.addEventListener('change',refresh);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  refresh();
}
