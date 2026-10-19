(() => {
  const card = document.getElementById('cm06Card');
  const cover = document.getElementById('cm06Cover');
  const burst = document.getElementById('cm06Burst');
  const detail = document.getElementById('cm06Detail');
  const openBtn = document.getElementById('openBouquetBtn');
  const audio = document.getElementById('bgAudio');
  const musicBtn = document.getElementById('musicToggleBtn');
  const musicIcon = document.getElementById('musicSvgIcon');
  const recipientName = 'Trần Thị Lương';
  document.querySelectorAll('[data-text-style-text]').forEach((element) => {
    element.dataset.textStyleText = element.dataset.textStyleText.replaceAll('Trần Thị Bảo Linh', recipientName);
  });
  document.querySelector('.cm06-cv-name').textContent = recipientName;
  document.querySelector('.cm06-hero-name').textContent = recipientName;
  document.querySelector('.cm06-hero-fromto strong').textContent = recipientName;
  document.querySelector('.cm06-photo').alt = recipientName;
  document.querySelectorAll('.cm06-cv-subtitle, .cm06-hero-subtitle').forEach((element) => {
    element.textContent = 'Gửi tới Trần Thị Lương thân yêu của lớp chúng tớ!';
  });

  let isOpening = false;
  let isOpened = false;
  let autoScrollActive = false;
  let autoScrollRaf = null;
  let lastFrameTime = 0;
  let scrollAccumulator = 0; // Tích lũy số thực sub-pixel để không bị làm tròn về 0
  let pointerStartY = 0;
  let isPointerDragging = false;
  let suppressNextPageClick = false;
  const AUTO_SCROLL_SPEED = 52; // Tốc độ cuộn tự động (52px / giây)

  // 1. Đồng bộ nút Phát / Dừng nhạc
  function syncMusicUI(playing) {
    if (playing) {
      musicBtn.classList.add('is-playing');
      musicBtn.setAttribute('aria-label', 'Tạm dừng nhạc');
      musicIcon.innerHTML = '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>';
    } else {
      musicBtn.classList.remove('is-playing');
      musicBtn.setAttribute('aria-label', 'Phát nhạc');
      musicIcon.innerHTML = '<polygon points="6 3 20 12 6 21 6 3"></polygon>';
    }
  }

  function playMusic() {
    audio.load();
    return audio.play().then(() => {
      syncMusicUI(true);
    }).catch((error) => {
      syncMusicUI(false);
      console.error('Không thể phát music.mp3:', error);
    });
  }

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (audio.paused) {
      playMusic();
    } else {
      audio.pause();
      syncMusicUI(false);
    }
  });

  // 2. IntersectionObserver kích hoạt hiệu ứng hiện thư & các mục khi cuộn trang
  function initScrollReveal() {
    const revealEls = detail.querySelectorAll('.reveal, .reveal-piece');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('is-visible');
          el.setAttribute('data-reveal-visible', 'true');
          if (el.classList.contains('reveal')) {
            el.querySelectorAll('.reveal-piece').forEach((piece) => {
              piece.classList.add('is-visible');
              piece.setAttribute('data-reveal-visible', 'true');
            });
          }
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    revealEls.forEach((el) => observer.observe(el));
  }

  // 3. Hệ thống Tự Động Cuộn Trang (Auto-scroll) mượt mà chuẩn sub-pixel
  function getMaxScrollY() {
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    return Math.max(0, docHeight - window.innerHeight);
  }

  function stepAutoScroll(timestamp) {
    if (!autoScrollActive) return;
    if (!lastFrameTime) lastFrameTime = timestamp;
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    scrollAccumulator += AUTO_SCROLL_SPEED * dt;
    const stepPx = Math.floor(scrollAccumulator);

    if (stepPx >= 1) {
      scrollAccumulator -= stepPx;
      const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const maxScroll = getMaxScrollY();

      if (currentY < maxScroll - 1) {
        window.scrollTo(0, currentY + stepPx);
      } else {
        stopAutoScroll();
        return;
      }
    }

    autoScrollRaf = requestAnimationFrame(stepAutoScroll);
  }

  function startAutoScroll() {
    if (autoScrollActive) return;
    autoScrollActive = true;
    lastFrameTime = 0;
    scrollAccumulator = 0;
    document.documentElement.classList.add('is-invitation-autoscrolling');
    autoScrollRaf = requestAnimationFrame(stepAutoScroll);
  }

  function stopAutoScroll() {
    autoScrollActive = false;
    document.documentElement.classList.remove('is-invitation-autoscrolling');
    if (autoScrollRaf) {
      cancelAnimationFrame(autoScrollRaf);
      autoScrollRaf = null;
    }
  }

  // Dừng tự cuộn khi người dùng chủ động lăn chuột hoặc vuốt tay.
  window.addEventListener('wheel', () => stopAutoScroll(), { passive: true });
  window.addEventListener('touchmove', () => stopAutoScroll(), { passive: true });
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.code)) {
      stopAutoScroll();
    }
  });

  // Kéo trang chỉ dừng cuộn; không để click giả lập sau khi thả tay bật lại ngay.
  detail.addEventListener('pointerdown', (e) => {
    if (!isOpened || e.target.closest('[data-no-autoscroll-toggle]')) return;
    if (e.button === 2) {
      stopAutoScroll();
      return;
    }
    pointerStartY = e.clientY;
    isPointerDragging = false;
  });

  detail.addEventListener('pointermove', (e) => {
    if (!isOpened || e.target.closest('[data-no-autoscroll-toggle]')) return;
    if (e.buttons === 0) return;
    if (Math.abs(e.clientY - pointerStartY) < 8) return;
    isPointerDragging = true;
    stopAutoScroll();
  }, { passive: true });

  detail.addEventListener('pointerup', (e) => {
    if (!isOpened || e.button !== 0 || e.target.closest('[data-no-autoscroll-toggle]')) return;
    if (isPointerDragging) {
      isPointerDragging = false;
      suppressNextPageClick = true;
    }
  });

  // Click chuột trái để bật / tắt tự động cuộn.
  detail.addEventListener('click', (e) => {
    if (!isOpened) return;
    if (e.target.closest('[data-no-autoscroll-toggle]')) return;
    if (e.button !== 0 || suppressNextPageClick) {
      suppressNextPageClick = false;
      return;
    }
    if (autoScrollActive) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  });

  // 4. Sự kiện bấm nút "Mở Bó Hoa" (Canh chuẩn thời gian nở hoa + bắn cánh hoa + mở thiệp + tự cuộn)
  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpening || isOpened) return;
    isOpening = true;

    // Phát nhạc ngay lập tức khi bấm mở
    playMusic();

    // Bước 1 (0ms): Kích hoạt 9 nụ hoa nở bung thành bông hoa (.is-blooming) + 18 cánh hoa bắn tung tóe (.is-active)
    cover.classList.add('is-blooming');
    burst.classList.add('is-active');

    // Bước 2 (1900ms - sau khi hoa đã nở rực rỡ và cánh hoa bung xong): Mở khóa cuộn và thu vòng tròn màn hình chờ
    setTimeout(() => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      detail.style.display = '';
      window.scrollTo(0, 0);
      cover.classList.add('is-closing');
      initScrollReveal();
    }, 1900);

    // Bước 3 (3050ms - sau khi vòng tròn clip-path thu hết 1.15s): Ẩn hẳn màn hình chờ và bắt đầu tự cuộn chậm xuống
    setTimeout(() => {
      cover.style.display = 'none';
      card.classList.add('is-opened');
      isOpened = true;
      startAutoScroll();
    }, 3050);
  });

  // 5. Lightbox xem ảnh phóng to
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const galleryImages = Array.from(document.querySelectorAll('.wedding-album__photo--slide img'));
  let currentImageIndex = 0;

  function updateLightboxImage(index) {
    currentImageIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[currentImageIndex];
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt || `Ảnh ${currentImageIndex + 1}`;
    lightboxCounter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
  }

  galleryImages.forEach((img, index) => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      stopAutoScroll();
      updateLightboxImage(index);
      lightboxModal.classList.add('is-open');
    });
  });

  lightboxPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateLightboxImage(currentImageIndex - 1);
  });
  lightboxNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateLightboxImage(currentImageIndex + 1);
  });
  lightboxCloseBtn.addEventListener('click', () => lightboxModal.classList.remove('is-open'));
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) lightboxModal.classList.remove('is-open');
  });
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') updateLightboxImage(currentImageIndex - 1);
    if (e.key === 'ArrowRight') updateLightboxImage(currentImageIndex + 1);
    if (e.key === 'Escape') lightboxModal.classList.remove('is-open');
  });
})();