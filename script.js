function setupCarousel(carousel) {
  const windowEl = carousel.querySelector('.carousel-window');
  const track = carousel.querySelector('.track');
  const cards = Array.from(carousel.querySelectorAll('.card'));
  const nextButton = carousel.querySelector('.next');
  const prevButton = carousel.querySelector('.prev');
  const dotsContainer = carousel.querySelector('.dots');
  const autoplayMs = Number(carousel.dataset.autoplay || 0);

  if (!windowEl || !track || cards.length === 0 || !nextButton || !prevButton || !dotsContainer) {
    return;
  }

  let currentIndex = 0;
  let maxIndex = 0;
  let stepSize = 0;
  let timer = null;
  let dots = [];
  let resizeTimer = null;

  function getVisibleCards() {
    return window.matchMedia('(min-width: 960px)').matches ? 3 : 2;
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
    track.style.transform = `translateX(-${stepSize * currentIndex}px)`;
    updateDots();
  }

  function renderDots() {
    dotsContainer.innerHTML = '';
    dots = [];

    for (let i = 0; i <= maxIndex; i += 1) {
      const dot = document.createElement('button');
      dot.className = 'dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ver bloque ${i + 1}`);
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
    if (autoplayMs <= 0 || maxIndex === 0) {
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
    const viewportWidth = windowEl.clientWidth;

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

  window.addEventListener('load', refresh);
  refresh();
}

document.querySelectorAll('.carousel').forEach(setupCarousel);
