const dreamAudio = (() => {
  const tracks = {sdl:.23,surge:.25,lover:.26,wherever:.18};
  const voiceNames = [
    '01_intro_jagiya','02_come_with_me','03_greenhouse_intro','05_tarot_lovers',
    '06_rose_quartz','07_amethyst','08_clear_quartz','09_citrine',
    'cake_01_first_countdown','cake_02_teasing_interrupt','cake_03_second_countdown',
    '15_ring_pulltab','16_ring_silverband','17_ring_green_gem','18_ring_main_ring','19_birthday_wish'
  ];
  const buffers = new Map();
  let context, musicBus, voiceBus, decks, voice, active, enabled = true;
  let track = 'sdl', quiet = false, musicRequest = 0, voiceRequest = 0;
  function ramp(node, value, seconds) {
    const now = context.currentTime;
    const gain = node.gain;
    if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(now);
    else { const current = gain.value; gain.cancelScheduledValues(now); gain.setValueAtTime(current,now); }
    gain.linearRampToValueAtTime(value,now + seconds);
  }
  function updateDuck(attack = .13) {
    if (musicBus) ramp(musicBus, voice ? .27 : quiet ? .52 : 1, voice || quiet ? attack : 1);
  }
  function stopVoice() {
    voiceRequest++;
    if (!voice) return;
    const previous = voice;
    voice = null;
    previous.onended = null;
    try { previous.stop(); } catch {}
    previous.disconnect();
    updateDuck();
  }
  function playVoice(key) {
    stopVoice();
    if (!enabled || !context || context.state !== 'running') return false;
    const buffer = buffers.get(key);
    if (!buffer) return false;
    const request = voiceRequest;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(voiceBus);
    voice = source;
    updateDuck(.08);
    source.onended = () => {
      source.disconnect();
      if (voice !== source || request !== voiceRequest) return;
      voice = null;
      updateDuck();
    };
    source.start(context.currentTime + .08);
    return true;
  }
  function prepare() {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) throw Error('Web Audio unavailable');
    context = new AudioEngine();
    musicBus = context.createGain();
    voiceBus = context.createGain();
    voiceBus.gain.value = .86;
    musicBus.connect(context.destination);
    voiceBus.connect(context.destination);
    decks = Array.from({length:2}, () => {
      const media = new Audio();
      media.loop = true;
      media.preload = 'auto';
      const gain = context.createGain();
      gain.gain.value = 0;
      context.createMediaElementSource(media).connect(gain).connect(musicBus);
      return {media,gain,name:null,stopTimer:undefined};
    });
    for (const key of voiceNames) {
      fetch('assets/audio/voice/'+key+'.mp3').then(response => {
        if (!response.ok) throw Error(key);
        return response.arrayBuffer();
      }).then(bytes => context.decodeAudioData(bytes)).then(buffer => buffers.set(key,buffer)).catch(() => {});
    }
  }
  function selectTrack(name, restart = false) {
    track = name;
    if (!enabled || !decks) return;
    if (active?.name === name && !active.media.paused) {
      if (restart) active.media.currentTime = 0;
      return;
    }
    const previous = active;
    const target = decks.find(deck => deck !== previous);
    const request = ++musicRequest;
    clearTimeout(target.stopTimer);
    if (target.name !== name) {
      target.name = name;
      target.media.src = 'assets/audio/bgm/'+name+'.mp3';
    } else if (restart) target.media.currentTime = 0;
    ramp(target.gain,0,.04);
    target.media.play().then(() => {
      if (!enabled || request !== musicRequest) return;
      active = target;
      ramp(target.gain,tracks[name],previous ? 1.15 : 1.35);
      if (previous) {
        ramp(previous.gain,0,1.15);
        previous.stopTimer = setTimeout(() => { if (active !== previous) previous.media.pause(); },1200);
      }
    }).catch(() => {});
  }
  function start(fromGesture = false) {
    if (!enabled) return;
    if (!(window.AudioContext || window.webkitAudioContext)) return;
    if (!context) prepare();
    if (context.state !== 'running') context.resume().catch(() => {});
    if (active?.name === track && !active.media.paused) return;
    selectTrack(track);
    if (fromGesture && !active) {
      // Safari may require a gesture for each media element, including the spare deck.
      const spare = decks[1];
      const request = musicRequest;
      spare.name = track;
      spare.media.src = 'assets/audio/bgm/'+track+'.mp3';
      spare.media.play().then(() => {
        if (musicRequest === request && active !== spare) spare.media.pause();
      }).catch(() => {});
    }
  }
  function toggle() {
    enabled = !enabled;
    if (enabled) start(true);
    else {
      ++musicRequest;
      stopVoice();
      for (const deck of decks || []) {
        clearTimeout(deck.stopTimer);
        deck.gain.gain.cancelScheduledValues(context.currentTime);
        deck.gain.gain.value = 0;
        deck.media.pause();
      }
      active = undefined;
    }
    return enabled;
  }
  return {start,toggle,selectTrack,playVoice,stopVoice,setQuiet(value){quiet=value;updateDuck();}};
})();
