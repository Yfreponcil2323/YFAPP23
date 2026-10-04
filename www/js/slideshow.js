(() => {
  document.querySelectorAll('[data-slideshow]').forEach((box) => {
    const slides = [...box.querySelectorAll('img')];
    const dots = [...box.querySelectorAll('.slide-counter span')];
    if (!slides.length) return;

    let index = Math.max(0, slides.findIndex(x => x.classList.contains('is-active')));
    if (index < 0) index = 0;
    let timer = null;
    let sx = 0, sy = 0, dragging = false, moved = false;

    const setNaturalSize = (img) => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      // The box always follows the real image ratio: no crop and no stretch.
      box.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    };

    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((img, i) => img.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      const active = slides[index];
      if (active.complete) setNaturalSize(active);
      else active.addEventListener('load', () => setNaturalSize(active), { once: true });
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(() => show(index + 1), 4500);
    }
    function next() { show(index + 1); restart(); }
    function prev() { show(index - 1); restart(); }

    slides.forEach(img => img.addEventListener('load', () => {
      if (slides[index] === img) setNaturalSize(img);
    }));

    // The dots are real controls: they work on phone and desktop.
    dots.forEach((dot, i) => dot.addEventListener('click', (e) => {
      e.stopPropagation();
      show(i);
      restart();
    }));

    // Touch swipe for real phones/tablets.
    box.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      sx = t.clientX; sy = t.clientY; moved = false;
    }, { passive: true });
    box.addEventListener('touchend', e => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        moved = true;
        dx < 0 ? next() : prev();
      }
    }, { passive: true });

    // Mouse / trackpad drag too, so testing the mobile layout on a laptop works.
    box.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; dragging = true; moved = false;
      box.setPointerCapture?.(e.pointerId);
      box.style.cursor = 'grabbing';
    });
    box.addEventListener('pointerup', e => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      dragging = false;
      box.style.cursor = 'grab';
      if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        moved = true;
        dx < 0 ? next() : prev();
      }
    });
    box.addEventListener('pointercancel', () => {
      dragging = false;
      box.style.cursor = 'grab';
    });

    // A normal click on the picture advances to the next picture.
    box.addEventListener('click', () => {
      if (!moved) next();
      moved = false;
    });

    // Do NOT pause on mouse hover: this is important when testing the phone view
    // from a laptop/desktop browser. The slideshow keeps changing automatically.
    show(index);
    restart();
  });
})();
