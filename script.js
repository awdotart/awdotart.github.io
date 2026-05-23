document.documentElement.classList.add('js-ready');

function setupCarousel(carousel) {
  const windowEl = carousel.querySelector('.carousel-window');
  const track = carousel.querySelector('.track');
  const cards = Array.from(carousel.querySelectorAll('.card'));
  const cardImages = cards
    .map((card) => card.querySelector('img'))
    .filter(Boolean);
  const nextButton = carousel.querySelector('.next');
  const prevButton = carousel.querySelector('.prev');
  const dotsContainer = carousel.querySelector('.dots');
  const autoplayMs = Number(carousel.dataset.autoplay || 0);
  const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!windowEl || !track || cards.length === 0 || !nextButton || !prevButton || !dotsContainer) {
    return;
  }

  let currentIndex = 0;
  let maxIndex = 0;
  let stepSize = 0;
  let timer = null;
  let dots = [];
  let resizeTimer = null;
  let isInViewport = true;
  const visibilityBuffer = 2;

  function markImageAsLoaded(img) {
    img.dataset.loaded = 'true';
  }

  function prepareImage(img, index) {
    if (index < 4) {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    } else {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    }

    img.decoding = 'async';
    img.dataset.loaded = img.dataset.loaded || 'false';

    img.addEventListener('load', () => {
      if (img.dataset.src) {
        return;
      }

      markImageAsLoaded(img);
    });

    if (!img.dataset.src && img.complete && img.naturalWidth > 0) {
      markImageAsLoaded(img);
    }

    if (index < 4 && img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
  }

  function loadImageAt(index) {
    const image = cardImages[index];

    if (!image || !image.dataset.src) {
      return;
    }

    image.src = image.dataset.src;
    image.removeAttribute('data-src');
  }

  function getVisibleCards() {
    const wideScreen = typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 960px)').matches
      : window.innerWidth >= 960;

    return wideScreen ? 3 : 2;
  }

  function clampOrWrap(index) {
    if (maxIndex === 0) {
      return 0;
    }

    const totalSteps = maxIndex + 1;
    return ((index % totalSteps) + totalSteps) % totalSteps;
  }

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function show(index) {
    currentIndex = clampOrWrap(index);
    loadVisibleImages(currentIndex);
    track.style.transform = `translateX(-${stepSize * currentIndex}px)`;
    updateDots();
  }

  function loadVisibleImages(index) {
    const visibleCards = getVisibleCards();
    const start = Math.max(0, index - visibilityBuffer);
    const end = Math.min(cards.length - 1, index + visibleCards - 1 + visibilityBuffer);

    for (let i = start; i <= end; i += 1) {
      loadImageAt(i);
    }
  }

  function renderDots() {
    dotsContainer.innerHTML = '';
    dots = [];

    for (let i = 0; i <= maxIndex; i += 1) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => {
        show(i);
        restartAutoplay();
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    }
  }

  function next() {
    show(currentIndex + 1);
  }

  function prev() {
    show(currentIndex - 1);
  }

  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startAutoplay() {
    if (autoplayMs <= 0 || maxIndex === 0 || !isInViewport || document.hidden || reducedMotion) {
      return;
    }

    stopAutoplay();
    timer = setInterval(next, autoplayMs);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  function measure() {
    const visibleCards = getVisibleCards();
    const gap = Number.parseFloat(getComputedStyle(track).gap || '0') || 0;
    let viewportWidth = windowEl.clientWidth;

    if (viewportWidth <= 0) {
      const carouselWidth = carousel.clientWidth;
      viewportWidth = Math.max(0, carouselWidth - 32);
    }

    const maxViewportWidth = window.innerWidth || viewportWidth;

    if (maxViewportWidth > 0 && viewportWidth > maxViewportWidth) {
      viewportWidth = maxViewportWidth;
    }

    if (viewportWidth <= 0) {
      return;
    }

    const cardWidth = (viewportWidth - gap * (visibleCards - 1)) / visibleCards;

    cards.forEach((card) => {
      card.style.flex = `0 0 ${cardWidth}px`;
    });

    stepSize = cardWidth + gap;
    track.style.width = `${cards.length * cardWidth + gap * (cards.length - 1)}px`;
    maxIndex = Math.max(0, cards.length - visibleCards);

    if (currentIndex > maxIndex) {
      currentIndex = 0;
    }
  }

  function refresh() {
    measure();
    renderDots();
    show(currentIndex);
    restartAutoplay();
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopAutoplay();
      return;
    }

    startAutoplay();
  }

  nextButton.addEventListener('click', () => {
    next();
    restartAutoplay();
  });

  prevButton.addEventListener('click', () => {
    prev();
    restartAutoplay();
  });

  window.addEventListener('resize', () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }

    resizeTimer = setTimeout(refresh, 130);
  });

  window.addEventListener('orientationchange', refresh);

  cardImages.forEach((img, index) => prepareImage(img, index));

  if ('IntersectionObserver' in window) {
    const viewportObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isInViewport = Boolean(entry && entry.isIntersecting);

        if (isInViewport) {
          requestAnimationFrame(refresh);
        } else {
          stopAutoplay();
        }
      },
      { threshold: 0.2 }
    );

    viewportObserver.observe(carousel);
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  window.addEventListener('load', refresh);
  refresh();
}

document.querySelectorAll('.carousel').forEach(setupCarousel);

function setupScrollCarousel(carousel) {
  const scrollArea = carousel.querySelector('.talks-grid, .posters-grid');
  const prevButton = carousel.querySelector('.scroll-arrow-prev');
  const nextButton = carousel.querySelector('.scroll-arrow-next');

  if (!scrollArea || !prevButton || !nextButton) {
    return;
  }

  function getStep() {
    const firstCard = scrollArea.querySelector('.talk-card, .poster-card');
    const styles = getComputedStyle(scrollArea);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return firstCard ? firstCard.getBoundingClientRect().width + gap : scrollArea.clientWidth * 0.8;
  }

  function updateButtons() {
    const maxScroll = scrollArea.scrollWidth - scrollArea.clientWidth - 2;
    prevButton.disabled = scrollArea.scrollLeft <= 2;
    nextButton.disabled = scrollArea.scrollLeft >= maxScroll;
  }

  function scrollByDirection(direction) {
    scrollArea.scrollBy({
      left: getStep() * direction,
      behavior: 'smooth',
    });
  }

  prevButton.addEventListener('click', () => scrollByDirection(-1));
  nextButton.addEventListener('click', () => scrollByDirection(1));
  scrollArea.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  window.addEventListener('load', updateButtons);
  updateButtons();
}

document.querySelectorAll('[data-scroll-carousel]').forEach(setupScrollCarousel);

function setupLightbox() {
  const carouselImages = Array.from(document.querySelectorAll('.carousel .card img'));

  if (carouselImages.length === 0) {
    return;
  }

  const groups = new Map();

  carouselImages.forEach((img) => {
    const carousel = img.closest('.carousel');

    if (!carousel) {
      return;
    }

    if (!groups.has(carousel)) {
      groups.set(carousel, []);
    }

    groups.get(carousel).push(img);
  });

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('hidden', '');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="lightbox-backdrop" data-close="true"></div>
    <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image viewer">
      <button class="lightbox-close" type="button" aria-label="Close image viewer">&times;</button>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">&#10094;</button>
      <figure class="lightbox-figure">
        <img class="lightbox-image" alt="" />
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
      <button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">&#10095;</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const dialog = overlay.querySelector('.lightbox-dialog');
  const lightboxImage = overlay.querySelector('.lightbox-image');
  const caption = overlay.querySelector('.lightbox-caption');
  const closeButton = overlay.querySelector('.lightbox-close');
  const prevButton = overlay.querySelector('.lightbox-prev');
  const nextButton = overlay.querySelector('.lightbox-next');
  const backdrop = overlay.querySelector('.lightbox-backdrop');

  if (!dialog || !lightboxImage || !caption || !closeButton || !prevButton || !nextButton || !backdrop) {
    return;
  }

  let activeGroup = [];
  let activeIndex = 0;
  let opener = null;
  let isOpen = false;

  function getImageSrc(img) {
    return img.dataset.src || img.currentSrc || img.src;
  }

  function getImageCaption(img) {
    const card = img.closest('.card');
    let text = '';

    if (card) {
      const caption = card.querySelector('.caption');
      text = caption ? caption.textContent.trim() : '';
    }

    return text || '';
  }

  function updateNavigationState() {
    const singleImage = activeGroup.length < 2;
    prevButton.disabled = singleImage;
    nextButton.disabled = singleImage;
  }

  function renderActiveImage() {
    if (activeGroup.length === 0) {
      return;
    }

    const img = activeGroup[activeIndex];
    const src = getImageSrc(img);
    const text = getImageCaption(img);
    lightboxImage.src = src;
    lightboxImage.alt = img.alt || '';
    caption.textContent = text;
    caption.hidden = !text;
    updateNavigationState();
  }

  function openLightbox(group, index, trigger) {
    activeGroup = group;
    activeIndex = index;
    opener = trigger;
    isOpen = true;

    renderActiveImage();
    overlay.removeAttribute('hidden');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  }

  function closeLightbox() {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    overlay.classList.remove('is-open');
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');

    if (opener) {
      opener.focus();
    }
  }

  function showNext() {
    if (activeGroup.length < 2) {
      return;
    }

    activeIndex = (activeIndex + 1) % activeGroup.length;
    renderActiveImage();
  }

  function showPrev() {
    if (activeGroup.length < 2) {
      return;
    }

    activeIndex = (activeIndex - 1 + activeGroup.length) % activeGroup.length;
    renderActiveImage();
  }

  groups.forEach((group) => {
    group.forEach((img, index) => {
      img.classList.add('lightbox-trigger');
      img.setAttribute('role', 'button');
      img.tabIndex = 0;
      img.setAttribute('aria-label', `Open image ${index + 1} in viewer`);

      img.addEventListener('click', () => {
        openLightbox(group, index, img);
      });

      img.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(group, index, img);
        }
      });
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  nextButton.addEventListener('click', showNext);
  prevButton.addEventListener('click', showPrev);
  backdrop.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!isOpen) {
      return;
    }

    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }

    if (event.key === 'ArrowRight') {
      showNext();
      return;
    }

    if (event.key === 'ArrowLeft') {
      showPrev();
    }
  });
}

setupLightbox();

function setupImageCompare(compare) {
  const range = compare.querySelector(".image-compare-range");
  const beforeWrap = compare.querySelector(".image-compare-before-wrap");
  const handle = compare.querySelector(".image-compare-handle");

  if (!range || !beforeWrap || !handle) {
    return;
  }

  function clamp(value) {
    return Math.min(100, Math.max(0, Number(value)));
  }

  function syncOverlayWidth() {
    const baseWidth = compare.clientWidth;

    if (baseWidth > 0) {
      beforeWrap.style.setProperty("--compare-image-width", baseWidth + "px");
    }
  }

  function apply(value) {
    const percent = clamp(value);
    beforeWrap.style.width = percent + "%";
    handle.style.left = percent + "%";
  }

  const initial = Number.isFinite(Number(compare.dataset.start))
    ? clamp(compare.dataset.start)
    : clamp(range.value || 50);

  range.value = String(initial);
  syncOverlayWidth();
  apply(initial);

  range.addEventListener("input", (event) => {
    apply(event.target.value);
  });

  range.addEventListener("change", (event) => {
    apply(event.target.value);
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      syncOverlayWidth();
    });

    resizeObserver.observe(compare);
  } else {
    window.addEventListener("resize", syncOverlayWidth);
  }
}

document.querySelectorAll(".image-compare").forEach(setupImageCompare);

function setupVideoOverlayCompare(compare) {
  const image = compare.querySelector(".video-overlay-image");
  const range = compare.querySelector(".video-overlay-range");
  const handle = compare.querySelector(".video-overlay-handle");
  const minScale = 0.34;

  if (!image || !range || !handle) {
    return;
  }

  function clamp(value) {
    return Math.min(100, Math.max(0, Number(value)));
  }

  function clampPx(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function percentFromClientX(clientX) {
    const rect = compare.getBoundingClientRect();

    if (rect.width <= 0) {
      return clamp(range.value || 100);
    }

    const x = clampPx(clientX - rect.left, 0, rect.width);
    const scaleRaw = 1 - x / rect.width;
    const scale = Math.min(1, Math.max(minScale, scaleRaw));
    const progress = (scale - minScale) / (1 - minScale);

    return 100 - progress * 100;
  }

  function placeHandle(scale) {
    const width = compare.clientWidth;
    const height = compare.clientHeight;

    if (width <= 0 || height <= 0) {
      return;
    }

    const handleHalf = (handle.offsetWidth || 40) / 2;
    const borderCornerX = width - width * scale;
    const borderCornerY = 0;
    const x = clampPx(borderCornerX + 1, handleHalf + 2, width - handleHalf - 2);
    const y = clampPx(borderCornerY + 1, handleHalf + 2, height - handleHalf - 2);

    handle.style.left = x + "px";
    handle.style.top = y + "px";
  }

  function apply(value) {
    const percent = clamp(value);
    const progress = 1 - percent / 100;
    const scale = minScale + (1 - minScale) * progress;
    const radius = 10 * (1 - progress);
    const borderWidth = 1 * (1 - progress);
    const shadowAlpha = 0.45 * (1 - progress);

    image.style.setProperty("--overlay-scale", String(scale));
    image.style.borderRadius = radius.toFixed(2) + "px";
    image.style.borderWidth = borderWidth.toFixed(2) + "px";
    image.style.boxShadow =
      shadowAlpha > 0.01
        ? `0 10px 24px rgba(0, 0, 0, ${shadowAlpha.toFixed(3)})`
        : "none";
    placeHandle(scale);
  }

  function setFromPointer(clientX) {
    const percent = percentFromClientX(clientX);
    range.value = String(percent);
    apply(percent);
  }

  const initial = Number.isFinite(Number(compare.dataset.overlayStart))
    ? clamp(compare.dataset.overlayStart)
    : clamp(range.value || 0);

  range.value = String(initial);
  apply(initial);

  range.addEventListener("input", (event) => {
    apply(event.target.value);
  });

  range.addEventListener("change", (event) => {
    apply(event.target.value);
  });

  let activePointerId = null;

  handle.addEventListener("pointerdown", (event) => {
    activePointerId = event.pointerId;
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
    setFromPointer(event.clientX);
  });

  handle.addEventListener("pointermove", (event) => {
    if (activePointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    setFromPointer(event.clientX);
  });

  function stopPointerDrag(event) {
    if (activePointerId !== event.pointerId) {
      return;
    }

    activePointerId = null;

    try {
      handle.releasePointerCapture(event.pointerId);
    } catch (_) {
      // Ignore if capture is already released.
    }
  }

  handle.addEventListener("pointerup", stopPointerDrag);
  handle.addEventListener("pointercancel", stopPointerDrag);

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      apply(range.value);
    });

    resizeObserver.observe(compare);
  } else {
    window.addEventListener("resize", () => {
      apply(range.value);
    });
  }
}

document.querySelectorAll(".video-overlay-compare").forEach(setupVideoOverlayCompare);

function setupCardYears() {
  document.querySelectorAll(".card").forEach((card) => {
    if (card.querySelector(".card-year")) {
      return;
    }

    const year = (card.dataset.year || "").trim();

    if (!year) {
      return;
    }

    const badge = document.createElement("span");
    badge.className = "card-year";
    badge.textContent = year;
    badge.setAttribute("aria-hidden", "true");
    card.appendChild(badge);
  });
}

setupCardYears();

function setupAcrylicVideoAutoplay() {
  const videos = Array.from(document.querySelectorAll('.acrylic-video'));

  if (videos.length === 0) {
    return;
  }

  function tryPlay(video) {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }

  function isMostlyVisible(video) {
    const rect = video.getBoundingClientRect();
    const viewportTop = 0;
    const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
    const visible = Math.max(0, Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop));
    const ratio = visible / Math.max(rect.height, 1);
    return ratio >= 0.55;
  }

  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.55 && !document.hidden) {
            tryPlay(video);
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: [0, 0.25, 0.55, 0.8]
      }
    );

    videos.forEach((video) => observer.observe(video));
  } else {
    const onScroll = () => {
      videos.forEach((video) => {
        if (!document.hidden && isMostlyVisible(video)) {
          tryPlay(video);
        } else {
          video.pause();
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videos.forEach((video) => video.pause());
      return;
    }

    videos.forEach((video) => {
      if (isMostlyVisible(video)) {
        tryPlay(video);
      }
    });
  });
}

setupAcrylicVideoAutoplay();
