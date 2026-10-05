// Click a chapter to play just that part; "Play all" runs through to the end.
const END_MARGIN_SECONDS = 0.08;
const START_NUDGE_SECONDS = 0.05;

for (const section of document.querySelectorAll('.video')) {
  setUpPlayer(section);
}

function setUpPlayer(section) {
  const video = section.querySelector('video');
  const status = section.querySelector('[data-status]');
  const chapters = [...section.querySelectorAll('.chapter')].map(readChapter);
  let stopAt = null;

  chapters.forEach((chapter) => {
    chapter.element
      .querySelector('.chapter__button')
      .addEventListener('click', () => playFrom(chapter, true));
  });

  section
    .querySelector('[data-play-all]')
    .addEventListener('click', () => playFrom(chapters[0], false));

  video.addEventListener('timeupdate', handleTimeUpdate);

  function playFrom(chapter, singleChapter) {
    stopAt = singleChapter ? chapter.end : null;
    activate(chapter);
    video.currentTime = chapter.start + START_NUDGE_SECONDS;
    video.play();
    video.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    status.textContent = playingMessage(singleChapter);
  }

  function handleTimeUpdate() {
    const time = video.currentTime;
    const current = chapters.find((chapter) => time >= chapter.start && time < chapter.end);

    if (current) activate(current);
    if (stopAt !== null && time >= stopAt - END_MARGIN_SECONDS) stopAtChapterEnd();
  }

  function stopAtChapterEnd() {
    video.pause();
    stopAt = null;
    status.textContent = 'Chapter finished. Pick another, or play all.';
  }

  function activate(active) {
    chapters.forEach((chapter) => {
      chapter.element.classList.toggle('is-active', chapter === active);
    });
  }
}

function readChapter(element) {
  return {
    element,
    start: Number(element.dataset.start),
    end: Number(element.dataset.end),
  };
}

function playingMessage(singleChapter) {
  if (singleChapter) return 'Playing this chapter. "Play all" continues past it.';

  return 'Playing all chapters.';
}
