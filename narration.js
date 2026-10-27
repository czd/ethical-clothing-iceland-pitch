(() => {
  const dock = document.querySelector('#narration');
  const audio = document.querySelector('#slide-audio');
  const select = document.querySelector('#audio-slide');
  const status = document.querySelector('#audio-status');
  const transcript = document.querySelector('#audio-transcript');
  const sections = [...document.querySelectorAll('.slides > section')];
  const toggle = document.querySelector('#audio-toggle');
  const seek = document.querySelector('#audio-seek');
  const more = document.querySelector('#audio-more');
  const options = document.querySelector('#audio-options');
  const clock = seconds => { const n = Number.isFinite(seconds) ? Math.floor(seconds) : 0; return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
  const update = () => {
    toggle.textContent = audio.paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', audio.paused ? 'Play narration' : 'Pause narration');
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    seek.disabled = !duration;
    seek.max = String(duration || 100);
    seek.value = String(audio.currentTime || 0);
    seek.setAttribute('aria-valuetext', `${clock(audio.currentTime)} of ${clock(duration)}`);
    document.querySelector('#audio-time').textContent = `${clock(audio.currentTime)} / ${clock(duration)}`;
  };
  const play = () => audio.play().catch(() => { status.textContent = 'Playback could not start. Read the transcript or try downloading the MP3 there.'; });
  toggle.addEventListener('click', () => audio.paused ? play() : audio.pause());
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value); update(); });
  more.addEventListener('click', () => { const open = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', String(open)); options.hidden = !open; });
  document.querySelector('#audio-hide').addEventListener('click', () => { audio.pause(); dock.open = false; dock.querySelector('summary').focus(); });
  for (const event of ['play', 'pause', 'ended', 'timeupdate', 'durationchange', 'loadedmetadata', 'emptied', 'error']) audio.addEventListener(event, update);
  new MutationObserver(() => { document.querySelector('#compact-status').textContent = status.textContent; }).observe(status, {childList:true});
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
    document.querySelector('#audio-title').textContent = `${index + 1} / ${slides.length} · ${slides[index].title}`;
    update();
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
    options.hidden = true;
    dock.classList.add('enhanced');
    audio.controls = false;
    toggle.disabled = false;
    sync();
  }).catch(() => {status.textContent='Narration list unavailable. The transcript includes all audio download links.';});
})();
