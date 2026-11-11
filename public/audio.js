
const dreamAudio = (() => {
  const tracks = {sdl:.23,surge:.25,lover:.26,wherever:.18};
  const music = new Audio();
  const speech = new Audio();
  music.loop = true;
  music.preload = 'auto';
  speech.preload = 'auto';
  let enabled = true, track = 'sdl', quiet = false, speaking = false;
  let musicRequest = 0, voiceRequest = 0;
  const cached = new Map();
  const pending = new Set();
  const queue = [];
  let fetching = false;
  function downloadNext() {
    if (fetching || !queue.length) return;
    fetching = true;
    const url = queue.shift();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),15000);
    fetch(url,{signal:controller.signal}).then(response => {
      if (!response.ok) throw new Error('Audio unavailable');
      return response.blob();
    }).then(blob => cached.set(url,URL.createObjectURL(blob))).catch(() => {}).finally(() => {
      clearTimeout(timeout);
      pending.delete(url);
      fetching = false;
      downloadNext();
    });
  }
  function warm(url) {
    if (cached.has(url) || pending.has(url)) return;
    pending.add(url);
    queue.push(url);
    downloadNext();
  }
  function preloadScene(name) {
    const groups = {
      sdl:['01_intro_jagiya','02_come_with_me','03_greenhouse_intro'],
      surge:['05_tarot_lovers','06_rose_quartz','07_amethyst','08_clear_quartz','09_citrine',
        'cake_01_first_countdown','cake_02_teasing_interrupt','cake_03_second_countdown'],
      lover:['15_ring_pulltab','16_ring_silverband','17_ring_green_gem','18_ring_main_ring','19_birthday_wish'],
      wherever:[]
    };
    (groups[name] || []).forEach(key => warm('assets/fast/audio/voice/'+key+'.mp3'));
    const next = {sdl:'surge',surge:'lover',lover:'wherever'}[name];
    if (next) warm('assets/fast/audio/bgm/'+next+'.mp3');
  }
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
    const url = 'assets/fast/audio/voice/'+key+'.mp3';
    speech.src = cached.get(url) || url;
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
    if (!music.getAttribute('src')) music.src = 'assets/fast/audio/bgm/'+track+'.mp3';
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
      const url = 'assets/fast/audio/bgm/'+name+'.mp3';
      music.src = cached.get(url) || url;
    } else if (restart) music.currentTime = 0;
    updateDuck();
    if (enabled) start();
    preloadScene(name);
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
