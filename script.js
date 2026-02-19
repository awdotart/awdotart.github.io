function setupCarousel(carousel) {
  const track = carousel.querySelector('.track');
  const cards = Array.from(carousel.querySelectorAll('.card'));
  const nextButton = carousel.querySelector('.next');
  const prevButton = carousel.querySelector('.prev');
  const dotsContainer = carousel.querySelector('.dots');
  const autoplayMs = Number(carousel.dataset.autoplay || 0);

  if (!track || cards.length === 0 || !nextButton || !prevButton || !dotsContainer) {
    return;
  }

  let currentIndex = 0;
  let maxIndex = 0;
  let timer = null;
  let dots = [];
  let resizeTimer = null;

  function getVisibleCards() {
    const value = Number.parseInt(getComputedStyle(carousel).getPropertyValue('--visible-cards'), 10);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function getStepSize() {
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    const cardWidth = cards[0].getBoundingClientRect().width;
    return cardWidth + gap;
  }

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function show(index) {
    currentIndex = Math.max(0, Math.min(maxIndex, index));
    const stepSize = getStepSize();
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
    show(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  }

  function prev() {
    show(currentIndex <= 0 ? maxIndex : currentIndex - 1);
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

  function refresh() {
    const visibleCards = getVisibleCards();
    maxIndex = Math.max(0, cards.length - visibleCards);

    if (currentIndex > maxIndex) {
      currentIndex = maxIndex;
    }

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

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  window.addEventListener('resize', () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }

    resizeTimer = setTimeout(refresh, 130);
  });

  refresh();
}

document.querySelectorAll('.carousel').forEach(setupCarousel);
