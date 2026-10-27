(() => {
  const params = new URLSearchParams(location.search);
  const reader = params.get('view') === 'read' || (params.get('view') !== 'slides' && matchMedia('(max-width: 760px)').matches);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode = document.querySelector('#mode');
  const sections = [...document.querySelectorAll('.slides > section')];
  mode.textContent = reader ? 'Slide view' : 'Read / mobile view';
  mode.addEventListener('click', () => {
    const id = reader ? (sections.find(s => s.getBoundingClientRect().top <= 60 && s.getBoundingClientRect().bottom > 60)?.id || 'possibility') : Reveal.getCurrentSlide().id;
    location.href = `${location.pathname}?view=${reader ? 'slides' : 'read'}#${reader ? '/' : ''}${id}`;
  });
  if (reader) {
    document.body.classList.add('reader');
    document.querySelector('#overview').hidden = true;
    const id = location.hash.replace(/^#\/?/, '');
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    document.querySelector('.brand').href = '#possibility';
  } else {
    document.body.classList.remove('reader');
    document.fonts.ready.then(() => Reveal.initialize({ width: 1440, height: 900, margin: 0.015, minScale: 0.1, maxScale: 2,
      hash: true, respondToHashChanges: true, history: true, controls: true, progress: true,
      slideNumber: 'c/t', showSlideNumber: 'all', keyboard: true, touch: true,
      center: false, transition: reduced ? 'none' : 'fade', transitionSpeed: 'default',
      backgroundTransition: reduced ? 'none' : 'fade', autoAnimate: !reduced,
      autoSlide: 0, overview: true, help: true, fragments: true, embedded: false,
      disableLayout: false, viewDistance: 3, fragmentInURL: true, autoAnimateDuration: 0.8,
      autoAnimateEasing: 'cubic-bezier(.2,.7,.1,1)', controlsTutorial: false
    })).then(() => syncInert());
    function syncInert() {
      if (Reveal.isOverview()) { sections.forEach(s => s.inert = false); return; }
      sections.forEach(s => s.inert = !s.classList.contains('present'));
    }
    Reveal.on('slidechanged', e => { syncInert(); if(e.previousSlide?.id === 'possibility') document.body.classList.add('hero-drawn'); });
    Reveal.on('overviewshown', syncInert);
    Reveal.on('overviewhidden', syncInert);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => Reveal.configure({transition:e.matches?'none':'fade',backgroundTransition:e.matches?'none':'fade',autoAnimate:!e.matches}));
    document.querySelector('#overview').addEventListener('click', () => Reveal.toggleOverview());
  }
})();
