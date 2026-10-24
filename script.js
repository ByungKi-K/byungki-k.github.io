(() => {
  const filters = document.querySelector('.publication-filters');
  const papers = [...document.querySelectorAll('.paper')];
  const heading = document.getElementById('research-title');
  const status = document.getElementById('publication-status');
  const showAll = document.getElementById('show-all');
  const publications = document.getElementById('publications');
  function setFilter(filter, announce = true) {
    publications.dataset.view = filter;
    const ordered = papers;
    ordered.forEach(paper => publications.append(paper));
    let visible = 0;
    for (const paper of papers) {
      paper.hidden = filter === 'selected' && paper.dataset.selected !== 'true';
      if (!paper.hidden) visible++;
      else paper.querySelectorAll('video').forEach(video => video.pause());
    }
    filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    heading.textContent = filter === 'selected' ? 'Selected publications' : 'Publications';
    showAll.hidden = filter === 'all';
    if (announce) status.textContent = `${visible} publications shown.`;
  }
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (button) setFilter(button.dataset.filter);
  });
  showAll.addEventListener('click', () => {
    setFilter('all');
    filters.querySelector('[data-filter="all"]').focus({ preventScroll: true });
    document.getElementById('research').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  function revealLinkedPaper(announce = false) {
    const hashPaper = papers.find(paper => '#' + paper.id === location.hash);
    if (!hashPaper) return;
    if (hashPaper.hidden) setFilter('all', announce);
    requestAnimationFrame(() => hashPaper.scrollIntoView());
  }
  setFilter('selected', false);
  revealLinkedPaper();
  window.addEventListener('hashchange', () => revealLinkedPaper(true));

  // Inline previews follow the viewport and the visitor's motion/data preferences.
  // Native controls remain available without JavaScript, and in the expanded view.
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const previews = [...document.querySelectorAll('.paper .video-play')].map(button => {
    const video = button.parentElement.querySelector('video');
    const title = button.closest('figure').querySelector('.media-expand').dataset.title;
    video.controls = false;
    button.hidden = false;
    const state = { video, button, title, inView: false, userPaused: false };
    const updateControl = () => {
      const playing = !video.paused;
      button.replaceChildren();
      const icon = document.createElement('span');
      icon.className = 'play-symbol';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = playing ? 'Ⅱ' : '▶';
      button.append(icon, document.createTextNode(playing ? 'Pause' : 'Play demo'));
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} demonstration: ${title}`);
    };
    button.addEventListener('click', () => {
      state.userPaused = !video.paused;
      if (video.paused) video.play().catch(updateControl);
      else video.pause();
    });
    video.addEventListener('play', updateControl);
    video.addEventListener('pause', updateControl);
    return state;
  });
  const canAutoplay = () => !motionPreference.matches && !navigator.connection?.saveData && !document.hidden && !document.getElementById('media-dialog').open;
  function resumePreviews() {
    if (!canAutoplay()) return;
    for (const state of previews) {
      if (state.inView && !state.userPaused && !state.video.closest('.paper').hidden) state.video.play().catch(() => {});
    }
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const state = previews.find(item => item.video === entry.target);
        state.inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        if (!state.inView) state.video.pause();
      }
      resumePreviews();
    }, { threshold: [0, 0.25] });
    previews.forEach(state => observer.observe(state.video));
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) previews.forEach(state => state.video.pause());
    else resumePreviews();
  });

  const dialog = document.getElementById('media-dialog');
  const mediaContent = document.getElementById('media-content');
  let openedFrom;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-media]');
    if (!link || !dialog.showModal || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openedFrom = link;
    document.querySelectorAll('.paper video').forEach(video => video.pause());
    const isVideo = link.dataset.media === 'video';
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = link.href;
    if (isVideo) {
      media.controls = true;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.setAttribute('aria-label', `Research demonstration: ${link.dataset.title}`);
      const original = link.closest('figure').querySelector('video');
      if (original.poster) media.poster = original.poster;
    } else {
      media.alt = link.querySelector('img').alt;
    }
    document.getElementById('media-title').textContent = link.dataset.title;
    mediaContent.replaceChildren(media);
    dialog.showModal();
    document.body.classList.add('dialog-open');
    if (isVideo) media.play().catch(() => {});
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    mediaContent.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
    mediaContent.replaceChildren();
    document.body.classList.remove('dialog-open');
    openedFrom?.focus({ preventScroll: true });
    resumePreviews();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('video').forEach(video => video.pause());
    else resumePreviews();
  });
})();
