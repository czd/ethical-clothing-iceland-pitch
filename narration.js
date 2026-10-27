(() => {
  const dock = document.querySelector('#narration');
  const audio = document.querySelector('#slide-audio');
  const select = document.querySelector('#audio-slide');
  const status = document.querySelector('#audio-status');
  const transcript = document.querySelector('#audio-transcript');
  const sections = [...document.querySelectorAll('.slides > section')];
  let slides = [], current = -1;
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--narration-height', `${dock.getBoundingClientRect().height}px`);
    if (!document.body.classList.contains('reader') && window.Reveal?.isReady()) Reveal.layout();
  }).observe(dock);
  const visibleIndex = () => document.body.classList.contains('reader')
    ? Math.max(0, sections.findIndex(s => s.getBoundingClientRect().bottom > 70))
    : Math.max(0, sections.findIndex(s => s === window.Reveal?.getCurrentSlide()));
  const load = index => {
    if (!slides.length || index === current) return;
    audio.pause(); current = index;
    audio.src = slides[index].audio; audio.load();
    select.value = String(index);
    audio.setAttribute('aria-label', `Slide ${index + 1}: ${slides[index].title}`);
    transcript.href = `transcript.html#${slides[index].id}`;
    status.textContent = `Slide ${index + 1} of ${slides.length}. Press Play to listen.`;
  };
  // Update only when the actual slide changes: ordinary scroll events never reset pause/seek state.
  let lastVisible = -1, scheduled = false;
  const sync = () => { if (!slides.length) return; const index = visibleIndex(); if(index !== lastVisible) { lastVisible = index; load(index); } };
  addEventListener('scroll', () => {
    if (!document.body.classList.contains('reader') || scheduled) return;
    scheduled = true; requestAnimationFrame(() => { scheduled = false; sync(); });
  }, {passive:true});
  addEventListener('resize', sync);
  window.Reveal?.on('ready', sync);
  window.Reveal?.on('slidechanged', sync);
  select.addEventListener('change', () => load(Number(select.value)));
  document.querySelector('#audio-replay').addEventListener('click', () => {
    audio.currentTime = 0; audio.play().catch(() => {status.textContent = 'Playback could not start. Try the player’s Play button or download the clip from the transcript.';});
  });
  audio.addEventListener('play', () => {status.textContent = `Playing slide ${current + 1} of ${slides.length}.`;});
  audio.addEventListener('pause', () => {if(!audio.ended) status.textContent = `Paused · slide ${current + 1} of ${slides.length}.`;});
  audio.addEventListener('ended', () => {status.textContent = current === slides.length - 1 ? 'Presentation narration complete. Replay or explore the evidence.' : 'Slide finished. Choose your next slide when ready.';});
  audio.addEventListener('error', () => {status.textContent = 'Audio unavailable. Read the transcript or try downloading the MP3 there.';});
  dock.addEventListener('toggle', () => {if(!dock.open) audio.pause();});
  // Keep Reveal shortcuts from hijacking native player/selection keyboard controls.
  dock.addEventListener('keydown', e => e.stopPropagation());
  document.querySelector('#mode').addEventListener('click', () => audio.pause(), {capture:true});
  addEventListener('pagehide', () => audio.pause());
  fetch('narration.json?v=20261027-ml2').then(r => {if(!r.ok) throw Error();return r.json();}).then(data => {
    slides = data.slides;
    slides.forEach((s,i) => {const o = document.createElement('option'); o.value=i;o.textContent=`${i+1} / ${slides.length} · ${s.title}`;select.append(o);});
    select.disabled = false;
    document.querySelector('#audio-replay').disabled = false;
    sync();
  }).catch(() => {status.textContent='Narration list unavailable. The transcript includes all audio download links.';});
})();
