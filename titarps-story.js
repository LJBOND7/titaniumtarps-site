'use strict';
document.querySelectorAll('[data-journey]').forEach(journey=>{
  const slides=[...journey.querySelectorAll('.tt-travel-slide')];
  const buttons=[...journey.querySelectorAll('[data-travel]')];
  const pause=journey.querySelector('[data-travel-pause]');
  const status=journey.querySelector('[data-travel-status]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,paused=reduced.matches,inView=false,timer;
  function reflect(){pause.textContent=paused?'Play story':'Pause story';pause.setAttribute('aria-pressed',String(paused));}
  function show(index,announce=false){
    current=(index+slides.length)%slides.length;
    slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===current);slide.setAttribute('aria-hidden',String(i!==current));});
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));
    if(announce)status.textContent=`${current+1} / ${slides.length} · ${slides[current].querySelector('strong').textContent}`;
  }
  function schedule(){clearInterval(timer);if(!paused&&inView&&!document.hidden)timer=setInterval(()=>show(current+1),5200);}
  buttons.forEach((button,i)=>button.addEventListener('click',()=>{paused=true;reflect();show(i,true);schedule();}));
  pause.addEventListener('click',()=>{paused=!paused;reflect();schedule();});
  // Pause when the reader focuses a control so slides never move during keyboard selection.
  journey.addEventListener('focusin',e=>{if(e.target!==pause){paused=true;reflect();schedule();}});
  journey.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();paused=true;reflect();show(current+(e.key==='ArrowRight'?1:-1),true);buttons[current].focus();schedule();}});
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();},{threshold:.2}).observe(journey);
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',e=>{paused=e.matches;reflect();schedule();});
  reflect();show(0);
});
