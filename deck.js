(() => {
  const params = new URLSearchParams(location.search);
  const reader = params.get('view') === 'read' || (params.get('view') !== 'slides' && matchMedia('(max-width: 760px)').matches);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode = document.querySelector('#mode');
  const sections = [...document.querySelectorAll('.slides > section')];
  document.documentElement.classList.toggle('reader-root', reader);
  mode.textContent = reader ? 'Slide view' : 'Read / mobile view';
  mode.setAttribute('aria-label', reader ? 'Switch from scrolling reader to slide view' : 'Switch to scrolling reader view');
  const readerSlide = () => sections.find(s => s.getBoundingClientRect().bottom > 70)?.id || sections.at(-1).id;
  // Snapshot before native button focus can scroll the document on mobile.
  mode.addEventListener('pointerdown', () => { if (reader) mode.dataset.slide = readerSlide(); });
  mode.addEventListener('click', () => {
    const id = reader ? (mode.dataset.slide || readerSlide()) : Reveal.getCurrentSlide()?.id || 'possibility';
    location.href = `${location.pathname}?view=${reader ? 'slides' : 'read'}#${reader ? '/' : ''}${id}`;
  });
  if (reader) {
    document.body.classList.add('reader');
    document.querySelector('#overview').hidden = true;
    const id = location.hash.replace(/^#\/?/, '');
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    document.querySelector('.brand').href = '#possibility';
    const previous = document.querySelector('#reader-prev');
    const next = document.querySelector('#reader-next');
    const position = document.querySelector('#reader-position');
    const updateNavigation = () => {
      const index = sections.findIndex(s => s.id === readerSlide());
      previous.href = '#' + sections[Math.max(0, index - 1)].id;
      next.href = '#' + sections[Math.min(sections.length - 1, index + 1)].id;
      previous.setAttribute('aria-disabled', String(index === 0));
      next.setAttribute('aria-disabled', String(index === sections.length - 1));
      position.textContent = `Scroll · ${index + 1} / ${sections.length}`;
    };
    let scheduled = false;
    addEventListener('scroll', () => {
      if (!scheduled) requestAnimationFrame(() => { updateNavigation(); scheduled = false; });
      scheduled = true;
    }, {passive:true});
    addEventListener('resize', updateNavigation);
    updateNavigation();
  } else {
    document.body.classList.remove('reader');
    document.fonts.ready.then(() => Reveal.initialize({ width: 1440, height: 900, margin: 0.015, minScale: 0.1, maxScale: 2,
      hash: true, respondToHashChanges: true, history: true, controls: true, progress: true,
      slideNumber: 'c/t', showSlideNumber: 'all', keyboard: true, touch: true,
      center: false, transition: reduced ? 'none' : 'fade', transitionSpeed: 'default',
      backgroundTransition: reduced ? 'none' : 'fade', autoAnimate: !reduced,
      autoSlide: 0, overview: true, help: true, fragments: true, embedded: false,
      scrollActivationWidth: null,
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
