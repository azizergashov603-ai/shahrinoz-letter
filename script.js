/* =========================================================
   ДЛЯ ШАХРИНОЗ — letter logic
   ========================================================= */
(() => {
  'use strict';

  /* ---------- fix mobile viewport height (iOS url bar jump) ---------- */
  function setVH(){document.documentElement.style.setProperty('--vh', (window.innerHeight*0.01)+'px')}
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  /* ---------- содержимое письма (исходная логика сохранена и расширена) ---------- */
  const pages = [
    {
      title: 'Привет, Шахриноз',
      text: `<p>Если ты читаешь это — значит, конверт уже открыт, и пути назад нет. 😄</p>
             <p>Устраивайся поудобнее: это письмо хочется читать медленно, страница за страницей, а не пролистать за три секунды.</p>`
    },
    {
      title: 'Небольшое напоминание',
      text: `<p>Помнишь, я обещал тебе Kinder? Кажется, я немного задержался с выполнением обещания. 😅</p>
             <p>Хорошо, что ты мне напомнила — теперь у меня есть отличный повод наконец сдержать слово, и даже чуть больше.</p>`
    },
    {
      title: 'Немного сладости',
      text: `<p>Это всего лишь маленький Kinder, но пусть он добавит немного сладости в твой день.</p>
             <p>Желаю тебе побольше поводов улыбаться, приятных неожиданностей и хорошего настроения — не только сегодня. 🌷</p>`
    },
    {
      title: 'Если по-честному',
      text: `<p>Если по-честному, Kinder тут скорее повод, а не причина. Мне просто нравится иногда устраивать тебе маленькие сюрпризы.</p>
             <p>Так что считай это письмо не «отчётом по долгу», а просто поводом улыбнуться посреди обычного дня.</p>`
    },
    {
      title: 'И ещё кое-что…',
      text: `<p>Прости, что заставил тебя ждать дольше, чем обещал. Я не забыл о своём обещании — просто немного затянул с его выполнением. 😅</p>
             <p>Спасибо, что напомнила мне. Надеюсь, этот маленький сюрприз хотя бы немного компенсирует опоздание и подарит тебе улыбку. ❤️</p>`
    },
    {
      title: 'Обещание выполнено',
      text: `<p>Вот и всё: долг возвращён, обещание выполнено. 😄</p>
             <p>Надеюсь, этот маленький сюрприз заставил тебя хотя бы немного улыбнуться. Спасибо, что напомнила — и что дочитала до конца.</p>
             <p class="signature">С теплом, Азиз ❤️</p>`
    }
  ];

  /* ---------- экраны ---------- */
  const screens = {
    hero: document.getElementById('screen-hero'),
    envelope: document.getElementById('screen-envelope'),
    letter: document.getElementById('screen-letter')
  };
  let currentScreen = 'hero';

  function showScreen(name){
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    currentScreen = name;
    if (name !== 'hero') revealPlayer();
    saveState();
  }

  /* ---------- сохранение прогресса (защита от случайного сброса) ---------- */
  const STORAGE_KEY = 'shahrinoz_letter_v1';
  function saveState(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({screen: currentScreen, page: currentPage}));
    }catch(e){/* ничего страшного, просто не сохранится */}
  }
  function loadState(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch(e){ return null; }
  }

  /* ---------- конверт ---------- */
  const envelopeWrap = document.getElementById('envelopeWrap');
  const envelope = document.getElementById('envelope');
  const envelopeLabel = document.getElementById('envelopeLabel');
  const btnStart = document.getElementById('btnStart');
  let opened = false;

  function openEnvelope(){
    if (opened) return;
    opened = true;
    envelope.classList.add('open');
    envelopeLabel.style.opacity = '0';
    setTimeout(() => { envelopeLabel.textContent = 'письмо открыто ♡'; envelopeLabel.style.opacity = '.8'; }, 950);
    setTimeout(enterLetter, 820);
  }
  envelopeWrap.addEventListener('click', openEnvelope);
  envelopeWrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
  });
  btnStart.addEventListener('click', () => showScreen('envelope'));

  /* ---------- письмо: рендер страниц с анимацией ---------- */
  const letterSlot = document.getElementById('letterSlot');
  const dotsWrap = document.getElementById('dots');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const swipeHint = document.getElementById('swipeHint');

  let currentPage = 0;
  let isAnimating = false;

  function buildDots(){
    dotsWrap.innerHTML = '';
    pages.forEach((_, i) => {
      const d = document.createElement('span');
      d.className = 'dot' + (i === currentPage ? ' active' : '');
      dotsWrap.appendChild(d);
    });
  }
  function updateDots(){
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === currentPage));
  }

  function renderInitial(){
    letterSlot.innerHTML = '';
    letterSlot.appendChild(buildPageEl(currentPage));
    buildDots();
    updateNavButtons();
  }

  const isLastPage = (i) => i === pages.length - 1;

  function buildPageEl(index){
    const p = pages[index];
    const el = document.createElement('div');
    el.className = 'page';
    el.innerHTML = `
      <p class="page-kicker">письмо · ${index + 1} из ${pages.length}</p>
      <h2>${p.title}</h2>
      ${p.text}
    `;
    if (isLastPage(index)){
      el.insertAdjacentHTML('beforeend', `
        <div class="finale">
          <span class="finale-line" aria-hidden="true"></span>
          <button type="button" class="btn-restart" id="btnRestartInPage">Прочитать ещё раз ♡</button>
        </div>
      `);
    }
    return el;
  }

  function updateNavButtons(){
    btnPrev.disabled = currentPage === 0;
    const last = isLastPage(currentPage);
    btnNext.innerHTML = last
      ? '<svg viewBox="0 0 24 24"><path d="M12 5v2.5M12 5a7 7 0 1 1-6.1 3.6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.6 6v3.2h3.2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btnNext.setAttribute('aria-label', last ? 'Прочитать письмо ещё раз' : 'Следующая страница');
    btnNext.classList.toggle('is-restart', last);
  }

  function restartLetter(){
    goTo(0, 'prev');
  }
  // кнопка «Прочитать ещё раз ♡», которая появляется прямо в тексте последней страницы
  letterSlot.addEventListener('click', (e) => {
    if (e.target.closest('#btnRestartInPage')) restartLetter();
  });

  function goTo(newIndex, direction){
    if (isAnimating || newIndex < 0 || newIndex > pages.length - 1) return;
    isAnimating = true;
    const old = letterSlot.querySelector('.page');
    if (old){
      old.classList.add('leaving');
      if (direction === 'prev') old.classList.add('dir-prev');
    }
    currentPage = newIndex;
    const fresh = buildPageEl(currentPage);
    if (direction === 'prev') fresh.classList.add('dir-prev');
    letterSlot.appendChild(fresh);

    setTimeout(() => { if (old && old.parentNode) old.parentNode.removeChild(old); }, 380);
    setTimeout(() => { isAnimating = false; }, 560);

    updateDots();
    updateNavButtons();
    saveState();
    if (swipeHint && currentPage > 0) swipeHint.style.opacity = '0';
  }

  btnNext.addEventListener('click', () => {
    if (currentPage < pages.length - 1) goTo(currentPage + 1, 'next');
    else restartLetter(); // на последней странице кнопка «далее» читает заново
  });
  btnPrev.addEventListener('click', () => {
    if (currentPage > 0) goTo(currentPage - 1, 'prev');
  });

  function enterLetter(){
    showScreen('letter');
    renderInitial();
  }

  /* ---------- свайп по письму (телефон/планшет) ---------- */
  const letterCard = document.getElementById('letterCard');
  let touchStartX = 0, touchStartY = 0, touchActive = false;

  letterCard.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchActive = true;
  }, { passive: true });

  letterCard.addEventListener('touchmove', (e) => {
    if (!touchActive) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    // если жест явно горизонтальный — гасим, чтобы не триггерить навигацию браузера "назад/вперёд"
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      e.preventDefault();
    }
  }, { passive: false });

  letterCard.addEventListener('touchend', (e) => {
    if (!touchActive) return;
    touchActive = false;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 46 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && currentPage < pages.length - 1) goTo(currentPage + 1, 'next');
    else if (dx > 0 && currentPage > 0) goTo(currentPage - 1, 'prev');
  }, { passive: true });

  /* ---------- восстановление прогресса при случайной перезагрузке ---------- */
  (function restore(){
    const saved = loadState();
    if (saved && saved.screen === 'letter'){
      currentPage = Math.min(Math.max(saved.page || 0, 0), pages.length - 1);
      opened = true;
      envelope.classList.add('open');
      showScreen('letter');
      renderInitial();
    } else if (saved && saved.screen === 'envelope'){
      showScreen('envelope');
    } else {
      showScreen('hero');
    }
  })();

  /* =========================================================
     Музыкальный плеер
     ========================================================= */
  const player = document.getElementById('player');
  const playerToggle = document.getElementById('playerToggle');
  const playerTitle = document.getElementById('playerTitle');
  const playerSub = document.getElementById('playerSub');
  const audio = document.getElementById('audio');
  const fileInput = document.getElementById('audioFile');

  let hasTrack = false;
  let playerRevealed = false;

  function revealPlayer(){
    if (playerRevealed) return;
    playerRevealed = true;
    setTimeout(() => player.classList.add('visible'), 500);
  }

  // Если аудиофайл лежит рядом с index.html, плеер подхватит его автоматически.
  const DEFAULT_TRACK = 'stephanie.m4a';
  function tryLoadDefaultTrack(){
    audio.src = DEFAULT_TRACK;
    audio.load(); // форсируем проверку файла сразу, не дожидаясь первого play()
  }
  audio.addEventListener('loadedmetadata', () => {
    hasTrack = true;
    playerTitle.textContent = 'Stephanie';
    playerSub.textContent = 'Nafeesisboujee';
  });
  audio.addEventListener('error', () => {
    if (hasTrack) return;
    playerTitle.textContent = 'Файл не найден';
    playerSub.textContent = 'добавь разрешённый аудиофайл';
  });
  tryLoadDefaultTrack();

  playerToggle.addEventListener('click', async () => {
    if (!hasTrack) { fileInput.click(); return; }
    if (audio.paused){
      try { await audio.play(); player.classList.add('playing'); }
      catch(e){ fileInput.click(); }
    } else {
      audio.pause();
      player.classList.remove('playing');
    }
  });

  let lastObjectUrl = null;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (lastObjectUrl) URL.revokeObjectURL(lastObjectUrl);
    lastObjectUrl = URL.createObjectURL(file);
    audio.src = lastObjectUrl;
    hasTrack = true;
    const name = file.name.replace(/\.[^.]+$/, '');
    playerTitle.textContent = name || 'Твой трек';
    playerSub.textContent = 'нажми, чтобы слушать';
    audio.play()
      .then(() => { player.classList.add('playing'); playerSub.textContent = 'играет сейчас'; })
      .catch(() => { player.classList.remove('playing'); });
  });

  audio.addEventListener('pause', () => player.classList.remove('playing'));
  audio.addEventListener('play', () => player.classList.add('playing'));

  /* =========================================================
     Парящие сердечки — немного, для атмосферы
     ========================================================= */
  (function spawnHearts(){
    const wrap = document.getElementById('hearts');
    const glyphs = ['♡', '❀', '✦'];
    const count = window.innerWidth < 480 ? 10 : 15;
    for (let i = 0; i < count; i++){
      const h = document.createElement('span');
      h.className = 'heart';
      h.textContent = glyphs[i % glyphs.length];
      h.style.left = Math.random() * 100 + '%';
      h.style.fontSize = (13 + Math.random() * 16) + 'px';
      h.style.animationDuration = (11 + Math.random() * 10) + 's';
      h.style.animationDelay = (Math.random() * 14) + 's';
      h.style.setProperty('--drift', (Math.random() * 48 - 24) + 'px');
      wrap.appendChild(h);
    }
  })();

})();
