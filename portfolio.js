const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.navlinks');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navLinks.classList.toggle('is-open', open);
});
navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.main-nav')) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

document.addEventListener('click', (event) => {
  const button = event.target.closest('.video-play');
  if (!button) return;
  const id = button.dataset.video;
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
  const player = document.createElement('iframe');
  player.title = button.getAttribute('aria-label').replace(/^Play: /, '');
  player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  player.allowFullscreen = true;
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  player.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1`;
  button.replaceWith(player);
  player.focus();
});

document.querySelectorAll('.project-gallery').forEach((gallery) => {
  const slides = [...gallery.querySelectorAll('.gallery-slide')];
  const stage = gallery.querySelector('.gallery-stage');
  const count = gallery.querySelector('.gallery-count');
  const status = gallery.querySelector('.gallery-status');
  const announcement = gallery.querySelector('.gallery-status .sr-only');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const autoRotate = gallery.dataset.autoplay !== 'false';
  const videoPosters = new Map(
    slides.map((slide) => [slide, slide.querySelector('.video-play')?.cloneNode(true)]),
  );
  let current = 0;
  let pointerStart = null;
  let suppressClickUntil = 0;
  let hovered = gallery.matches(':hover');
  let focused = gallery.contains(document.activeElement);
  let inView = !('IntersectionObserver' in window);
  let rotationTimer = null;

  function updateRotation() {
    window.clearTimeout(rotationTimer);
    status.setAttribute(
      'aria-live',
      !autoRotate || focused || reducedMotion.matches ? 'polite' : 'off',
    );
    if (
      !autoRotate ||
      reducedMotion.matches ||
      hovered ||
      focused ||
      !inView ||
      document.hidden ||
      gallery.querySelector('iframe')
    )
      return;
    rotationTimer = window.setTimeout(() => showSlide(current + 1), 7000);
  }

  function showSlide(index) {
    const next = (index + slides.length) % slides.length;
    if (next === current) return;
    const outgoing = slides[current];
    const direction = index > current ? 1 : -1;
    if (outgoing.contains(document.activeElement)) gallery.focus({ preventScroll: true });
    // Unloading the player stops playback; restore its poster for the next visit.
    const player = outgoing.querySelector('iframe');
    if (player) player.replaceWith(videoPosters.get(outgoing).cloneNode(true));
    outgoing.hidden = true;
    outgoing.classList.remove('gallery-enter');
    slides[next].hidden = false;
    slides[next].style.setProperty('--slide-from', `${direction * 18}px`);
    slides[next].classList.add('gallery-enter');
    current = next;
    count.textContent = `${current + 1} / ${slides.length}`;
    announcement.textContent = `Slide ${current + 1} of ${slides.length}: ${slides[current].querySelector('figcaption').textContent.trim()}`;
    updateRotation();
  }

  gallery.addEventListener('mouseenter', () => {
    hovered = true;
    updateRotation();
  });
  gallery.addEventListener('mouseleave', () => {
    hovered = false;
    updateRotation();
  });
  gallery.addEventListener('focusin', () => {
    focused = true;
    updateRotation();
  });
  gallery.addEventListener('focusout', (event) => {
    focused = gallery.contains(event.relatedTarget);
    updateRotation();
  });
  document.addEventListener('visibilitychange', updateRotation);
  reducedMotion.addEventListener('change', updateRotation);
  // Player insertion suspends rotation, including when focus stays in an iframe.
  new MutationObserver(updateRotation).observe(stage, { childList: true, subtree: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        updateRotation();
      },
      { threshold: [0, 0.35] },
    ).observe(gallery);
  }
  updateRotation();

  gallery
    .querySelector('.gallery-previous')
    .addEventListener('click', () => showSlide(current - 1));
  gallery.querySelector('.gallery-next').addEventListener('click', () => showSlide(current + 1));
  gallery.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const targets = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: slides.length - 1,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    showSlide(targets[event.key]);
  });

  stage.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  stage.addEventListener('pointercancel', () => {
    pointerStart = null;
  });
  stage.addEventListener('pointerleave', () => {
    pointerStart = null;
  });
  stage.addEventListener('pointerup', (event) => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
    suppressClickUntil = performance.now() + 350;
    showSlide(current + (dx < 0 ? 1 : -1));
  });
  stage.addEventListener(
    'click',
    (event) => {
      if (performance.now() >= suppressClickUntil) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
});

// Short sections near the page bottom cannot reach a fixed observation band.
// Use the reading position, with the final section selected at the page bottom.
const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]')];
const sections = sectionLinks.map((link) => document.querySelector(link.hash));
let navigationFrame = null;
function updateNavigation() {
  navigationFrame = null;
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  let activeSection = atBottom ? sections[sections.length - 1] : null;
  if (!atBottom) {
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.35) activeSection = section;
    }
  }
  for (const link of sectionLinks) {
    if (link.hash === `#${activeSection?.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}
function queueNavigationUpdate() {
  if (navigationFrame === null) navigationFrame = window.requestAnimationFrame(updateNavigation);
}
window.addEventListener('scroll', queueNavigationUpdate, { passive: true });
window.addEventListener('resize', queueNavigationUpdate);
window.addEventListener('load', queueNavigationUpdate);
updateNavigation();
