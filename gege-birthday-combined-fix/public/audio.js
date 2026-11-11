
const dreamAudio = (() => {
  const tracks = {sdl:.23,surge:.25,lover:.26,wherever:.18};
  const music = new Audio();
  const speech = new Audio();
  music.loop = true;
  music.preload = 'auto';
  speech.preload = 'auto';
  let enabled = true, track = 'sdl', quiet = false, speaking = false;
  let musicRequest = 0, voiceRequest = 0;
  function notify() {
    window.dispatchEvent(new Event('dream-audio-state'));
  }
  function updateDuck() {
    music.volume = tracks[track] * (speaking ? .27 : quiet ? .52 : 1);
  }
  function stopVoice() {
    voiceRequest++;
    speech.pause();
    speech.removeAttribute('src');
    speech.load();
    speaking = false;
    updateDuck();
  }
  function playVoice(key) {
    stopVoice();
    if (!enabled) return false;
    const request = voiceRequest;
    speech.src = 'assets/audio/voice/'+key+'.mp3';
    speech.volume = .86;
    speaking = true;
    updateDuck();
    speech.play().catch(() => {
      if (request !== voiceRequest) return;
      speaking = false;
      updateDuck();
      notify();
    });
    return true;
  }
  function start() {
    if (!enabled) return;
    if (!music.getAttribute('src')) music.src = 'assets/audio/bgm/'+track+'.mp3';
    updateDuck();
    if (!music.paused) return;
    const request = ++musicRequest;
    music.play().then(() => {
      if (!enabled || request !== musicRequest) return;
      notify();
    }).catch(notify);
  }
  function selectTrack(name, restart = false) {
    if (track !== name || !music.getAttribute('src')) {
      musicRequest++;
      track = name;
      music.src = 'assets/audio/bgm/'+name+'.mp3';
    } else if (restart) music.currentTime = 0;
    updateDuck();
    if (enabled) start();
  }
  function toggle() {
    enabled = !enabled;
    if (enabled) start();
    else {
      musicRequest++;
      music.pause();
      stopVoice();
    }
    notify();
    return enabled;
  }
  speech.addEventListener('ended',() => { speaking = false; updateDuck(); });
  speech.addEventListener('error',() => { speaking = false; updateDuck(); });
  for (const event of ['playing','waiting','pause','error','canplay']) music.addEventListener(event,notify);
  document.addEventListener('visibilitychange',() => {
    if (!document.hidden && enabled) start();
  });
  return {
    start,toggle,selectTrack,playVoice,stopVoice,
    setQuiet(value){quiet=value;updateDuck();},
    state(){return !enabled ? 'off' : !music.paused && music.readyState >= 3 ? 'playing' : 'waiting';}
  };
})();
