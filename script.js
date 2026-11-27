(() => {
  const $ = id => document.getElementById(id);
  const musicScene = $('musicScene');
  const apologyScene = $('apologyScene');
  const letterScene = $('letterScene');
  const finaleScene = $('finaleScene');
  const finaleTrigger = $('finaleTrigger');
  const homeButton = $('homeButton');
  const continueButton = $('continueButton');
  const vinyl = $('vinylButton');
  const miniVinyl = $('miniVinyl');
  const audio = $('audio');
  const hint = $('tapHint');
  const indicator = $('playingIndicator');
  const smallPlay = $('smallPlay');

  const TARGET_VOLUME = 0.18;
  const VINYL_SPEED_DEG_PER_SEC = 90; // matches the previous 4s/rotation feel

  let musicOn = false;
  let audioFailed = false;
  let sceneTimer = null;
  let hasOpenedLetterOnce = false;
  let pageIndex = 0;

  // ---------- Letter content (unchanged) ----------
  const pages = [
    {
      title: 'Привет, Шахриноз',
      paragraphs: [
        'Если ты читаешь это — значит, конверт уже открыт, и пути назад нет. 😄',
        'Устраивайся поудобнее: это письмо хочется читать медленно, страница за страницей, а не пролистать за три секунды.'
      ]
    },
    {
      title: 'Немного сладости',
      paragraphs: [
        'Это всего лишь маленький Kinder, но пусть он добавит немного сладости в твой день.',
        'Желаю тебе побольше поводов улыбаться, приятных неожиданностей и хорошего настроения — не только сегодня. 🌷'
      ]
    },
    {
      title: 'Небольшое напоминание',
      paragraphs: [
        'И ещё раз прости, что заставил тебя ждать дольше, чем обещал. Я правда хотел подарить тебе это вовремя. Но в какой-то момент растерялся и так и не смог решиться.',
        'Я не забыл ни обещание, ни тебя. Спасибо, что напомнила мне. Надеюсь, этот маленький сюрприз хотя бы немного компенсирует опоздание и подарит тебе улыбку. ❤️'
      ]
    },
    {
      title: 'Обещание выполнено',
      paragraphs: [
        'Вот и всё: долг возвращён, обещание выполнено. 😄',
        'Надеюсь, этот маленький сюрприз заставил тебя хотя бы немного улыбнуться. Спасибо, что напомнила — и что дочитала до конца.'
      ],
      signature: 'С теплом, Азиз ❤️'
    }
  ];

  // ---------- Vinyl spin: physics-based so pause eases out instead of snapping ----------
  let angle = 0;
  let angularVelocity = 0;
  let spinning = false;
  let lastFrame = null;

  function spinFrame(timestamp) {
    if (lastFrame === null) lastFrame = timestamp;
    const dt = Math.min(timestamp - lastFrame, 48) / 1000;
    lastFrame = timestamp;

    const target = spinning ? VINYL_SPEED_DEG_PER_SEC : 0;
    // Exponential easing towards the target speed: fast spin-up, gentle coast-down.
    const ease = spinning ? 3.2 : 1.1;
    angularVelocity += (target - angularVelocity) * Math.min(ease * dt, 1);
    angle = (angle + angularVelocity * dt) % 360;

    const transform = `rotate(${angle.toFixed(2)}deg)`;
    vinyl.style.transform = transform;
    if (miniVinyl) miniVinyl.style.transform = transform;

    if (!spinning && Math.abs(angularVelocity) < 0.05) {
      angularVelocity = 0;
      requestAnimationFrame(spinFrame);
      return;
    }
    requestAnimationFrame(spinFrame);
  }
  requestAnimationFrame(spinFrame);

  // ---------- Smooth volume fades ----------
  let fadeToken = 0;
  function fadeVolume(target, duration, onDone) {
    const myToken = ++fadeToken;
    const start = audio.volume;
    const startTime = performance.now();
    function step(now) {
      if (myToken !== fadeToken) return; // a newer fade took over
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t < 1 ? 1 - Math.pow(1 - t, 2) : 1;
      audio.volume = start + (target - start) * eased;
      if (t < 1) {
        requestAnimationFrame(step);
      } else if (onDone) {
        onDone();
      }
    }
    requestAnimationFrame(step);
  }

  function setMusicState(on) {
    musicOn = on;
    spinning = on;
    indicator.classList.toggle('active', on);
    smallPlay.textContent = on ? 'Ⅱ' : '♫';
    vinyl.setAttribute('aria-pressed', String(on));
    smallPlay.setAttribute('aria-pressed', String(on));
    if (!audioFailed) {
      hint.textContent = on
        ? 'Музыка играет тихо · нажми ещё раз, чтобы остановить'
        : 'Нажми на пластинку, чтобы включить музыку';
    }
  }

  async function toggleMusic() {
    if (audio.paused) {
      audio.volume = 0;
      try {
        await audio.play();
        audioFailed = false;
        setMusicState(true);
        fadeVolume(TARGET_VOLUME, 650);
      } catch (_) {
        audioFailed = true;
        setMusicState(false);
        hint.textContent = 'Добавь файл stephanie.mp3 рядом с index.html, чтобы включить музыку';
      }
    } else {
      fadeVolume(0, 400, () => {
        audio.pause();
        audio.volume = TARGET_VOLUME;
      });
      setMusicState(false);
    }
  }

  vinyl.addEventListener('click', toggleMusic);
  smallPlay.addEventListener('click', toggleMusic);
  audio.volume = TARGET_VOLUME;
  audio.addEventListener('error', () => {
    audioFailed = true;
    if (!musicOn) hint.textContent = 'Музыку можно добавить файлом stephanie.mp3 рядом с index.html';
  });

  // ---------- Letter pages ----------
  function renderPage() {
    const page = pages[pageIndex];
    const isLast = pageIndex === pages.length - 1;
    $('pageCount').textContent = String(pageIndex + 1).padStart(2, '0') + ' / 04';
    $('letterContent').innerHTML = `<div class="page-anim">` +
      `<h2>${page.title}</h2>` +
      page.paragraphs.map(p => `<p>${p}</p>`).join('') +
      (page.signature ? `<p class="signature">${page.signature}</p>` : '') +
      `</div>`;
    $('pageDots').innerHTML = pages.map((_, i) => `<span class="${i === pageIndex ? 'active' : ''}"></span>`).join('');
    $('prevButton').disabled = pageIndex === 0;
    $('nextButton').textContent = isLast ? '↻' : '→';
    $('nextButton').setAttribute('aria-label', isLast ? 'Прочитать сначала' : 'Следующая страница');
    finaleTrigger.classList.toggle('visible', isLast);
  }
  $('prevButton').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPage(); } });
  $('nextButton').addEventListener('click', () => { pageIndex = pageIndex === pages.length - 1 ? 0 : pageIndex + 1; renderPage(); });

  // ---------- Scene navigation ----------
  function enterApology() {
    musicScene.classList.add('exit');
    apologyScene.classList.add('show');
    homeButton.classList.add('visible');
    sceneTimer = setTimeout(() => {
      apologyScene.classList.remove('show');
      enterLetter();
    }, 5600);
  }

  function enterLetter() {
    musicScene.classList.add('exit');
    apologyScene.classList.remove('show');
    finaleScene.classList.remove('show');
    pageIndex = 0;
    letterScene.classList.add('show');
    homeButton.classList.add('visible');
    hasOpenedLetterOnce = true;
    renderPage();
  }

  function enterFinale() {
    letterScene.classList.remove('show');
    finaleTrigger.classList.remove('visible');
    finaleScene.classList.remove('show');
    // force reflow so the entrance + heart animations restart cleanly
    void finaleScene.offsetWidth;
    finaleScene.classList.add('show');
    homeButton.classList.add('visible');
  }

  function goHome() {
    if (sceneTimer) { clearTimeout(sceneTimer); sceneTimer = null; }
    apologyScene.classList.remove('show');
    letterScene.classList.remove('show');
    finaleScene.classList.remove('show');
    finaleTrigger.classList.remove('visible');
    musicScene.classList.remove('exit');
    homeButton.classList.remove('visible');
    continueButton.textContent = hasOpenedLetterOnce ? 'Открыть письмо снова' : 'Продолжить';
    const arrow = document.createElement('span');
    arrow.textContent = '↓';
    continueButton.appendChild(arrow);
    // Audio keeps playing/paused exactly as it was — nothing touched here.
  }

  continueButton.addEventListener('click', () => {
    if (sceneTimer) { clearTimeout(sceneTimer); sceneTimer = null; }
    if (apologyScene.classList.contains('show') || letterScene.classList.contains('show') || finaleScene.classList.contains('show')) return;
    if (hasOpenedLetterOnce) {
      enterLetter();
    } else {
      enterApology();
    }
  });

  homeButton.addEventListener('click', goHome);
  $('finaleButton').addEventListener('click', enterFinale);

  // Intro sequence: let the vinyl emerge, then show the short apology.
  window.addEventListener('load', () => {
    setTimeout(enterApology, 5200);
  });
  renderPage();
})();
