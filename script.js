// ===============================
// VIDEO — liberar som no primeiro clique
// ===============================
const video = document.querySelector('video');

if (video) {
  video.addEventListener('click', () => {
    video.muted = false;
    video.volume = 1;
  });
}

// ===============================
// GALERIA — abrir imagem em tela cheia
// ===============================
(function () {
  const galleryItems = document.querySelectorAll('.gallery img');
  if (!galleryItems.length) return;

  // criar overlay único com controles
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<button class="lightbox-close" aria-label="Fechar">\u00D7</button>' +
    '<button class="lightbox-prev" aria-label="Anterior">\u2039</button>' +
    '<img alt="" />' +
    '<div class="lightbox-caption" role="status"></div>' +
    '<button class="lightbox-next" aria-label="Próxima">\u203A</button>';
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('img');
  const caption = overlay.querySelector('.lightbox-caption');
  const btnClose = overlay.querySelector('.lightbox-close');
  const btnNext = overlay.querySelector('.lightbox-next');
  const btnPrev = overlay.querySelector('.lightbox-prev');

  let currentIndex = 0;

  function showAtIndex(i) {
    currentIndex = (i + galleryItems.length) % galleryItems.length;
    const it = galleryItems[currentIndex];
    overlayImg.src = it.src;
    overlayImg.alt = it.alt || '';
    caption.textContent = it.alt || it.getAttribute('data-caption') || '';
  }

  function openLightbox(index) {
    showAtIndex(index);
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
  }

  function closeLightbox() {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    overlayImg.src = '';
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') { showAtIndex(currentIndex + 1); }
    if (e.key === 'ArrowLeft') { showAtIndex(currentIndex - 1); }
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  btnClose.addEventListener('click', closeLightbox);
  btnNext.addEventListener('click', (e) => { e.stopPropagation(); showAtIndex(currentIndex + 1); });
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); showAtIndex(currentIndex - 1); });

  galleryItems.forEach((item, idx) => {
    item.style.cursor = 'zoom-in';
    item.addEventListener('click', () => {
      openLightbox(idx);
    });
  });
  
  // --- drag-to-scroll (mouse + touch)
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    let isDown = false; let startX; let scrollLeftDrag; let isDragging = false;
    let touchStartX = 0; let touchScrollLeft = 0;

    // prevent native image drag
    gallery.querySelectorAll('img').forEach(img => img.draggable = false);

    gallery.addEventListener('mousedown', (e) => {
      isDown = true;
      gallery.classList.add('dragging');
      startX = e.pageX - gallery.offsetLeft;
      scrollLeftDrag = gallery.scrollLeft;
      isDragging = false;
    });

    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      const walk = (x - startX) * 1; // scroll speed
      if (Math.abs(walk) > 5) isDragging = true;
      gallery.scrollLeft = scrollLeftDrag - walk;
    });

    const stopDrag = () => {
      isDown = false;
      // keep scrollbar visible briefly after mouse drag
      setTimeout(() => { gallery.classList.remove('dragging'); }, 200);
      // small delay so click doesn't fire immediately after drag
      setTimeout(() => { isDragging = false; }, 50);
    };

    gallery.addEventListener('mouseup', stopDrag);
    gallery.addEventListener('mouseleave', stopDrag);

    // touch support (do not call preventDefault to allow vertical page scroll)
    gallery.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].pageX - gallery.offsetLeft;
      touchScrollLeft = gallery.scrollLeft;
      isDragging = false;
      // show scrollbar during touch drag
      gallery.classList.add('dragging');
    }, { passive: true });

    gallery.addEventListener('touchmove', (e) => {
      const x = e.touches[0].pageX - gallery.offsetLeft;
      const walk = (x - touchStartX) * 1;
      if (Math.abs(walk) > 5) isDragging = true;
      gallery.scrollLeft = touchScrollLeft - walk;
    }, { passive: true });

    gallery.addEventListener('touchend', () => {
      // keep scrollbar visible briefly after touch ends
      setTimeout(() => { gallery.classList.remove('dragging'); }, 200);
      setTimeout(() => { isDragging = false; }, 50);
    }, { passive: true });

    gallery.addEventListener('touchcancel', () => { gallery.classList.remove('dragging'); }, { passive: true });

    // prevent opening lightbox when dragging
    gallery.querySelectorAll('img').forEach((img, i) => {
      img.addEventListener('click', (e) => {
        if (isDragging) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        // otherwise let existing click handler open lightbox (handlers above)
      }, { capture: true });
    });
  }
})();

// Accessibility: mantém foco correto e evita aria-hidden em elemento com foco
(function () {
  const overlay = document.querySelector('.lightbox-overlay');
  if (!overlay) return;

  let lastFocused = null;

  // garante estado inicial
  overlay.setAttribute('aria-hidden', 'true');

  const observer = new MutationObserver(() => {
    if (overlay.classList.contains('show')) openOverlay();
    else closeOverlay();
  });

  observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });

  function setInertForBackground(enable) {
    Array.from(document.body.children).forEach((el) => {
      if (el === overlay) return;
      try {
        el.inert = enable;
      } catch (e) {
        // alguns browsers mais antigos podem não suportar inert — fallback para aria-hidden
      }
      if (enable) el.setAttribute('aria-hidden', 'true');
      else el.removeAttribute('aria-hidden');
    });
  }

  function focusFirstInOverlay() {
    const focusables = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = Array.from(focusables).find((n) => !n.hasAttribute('disabled'));
    if (first) first.focus();
  }

  function trapTab(e) {
    if (e.key !== 'Tab') return;
    const focusables = Array.from(
      overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute('disabled'));
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  function openOverlay() {
    lastFocused = document.activeElement;
    overlay.removeAttribute('aria-hidden');
    overlay.setAttribute('aria-modal', 'true');
    setInertForBackground(true);
    focusFirstInOverlay();
    overlay.addEventListener('keydown', trapTab);
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay() {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.removeAttribute('aria-modal');
    setInertForBackground(false);
    overlay.removeEventListener('keydown', trapTab);
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }
})();

// Back-to-top visibility toggle
(function () {
  const backTop = document.querySelector('.back-top.fixed');
  if (!backTop) return;

  function updateVisibility() {
    // show earlier on shorter pages
    if (window.scrollY > 200) backTop.style.display = 'block';
    else backTop.style.display = 'none';
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  // initial state
  updateVisibility();
})();
