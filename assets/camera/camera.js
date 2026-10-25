// Shrimply camera helper: runs in a hidden window.
// It looks at the webcam, finds the head and shoulders, and sends back a few numbers.
// The video never leaves this window (only a tiny preview picture while calibrating).
(function () {
  const out = m => (window.shrimpCam ? window.shrimpCam.send(m) : (window.__msgs = window.__msgs || []).push(m));
  let pose, stream, running = false, fast = false, preview = false, lastPreview = 0, last = null;
  const video = document.getElementById('v');
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 96;
  const ctx = canvas.getContext('2d');

  if (window.shrimpCam) window.shrimpCam.onCommand(c => {
    if (c.cmd === 'fast') fast = !!c.on;
    if (c.cmd === 'preview') preview = !!c.on;
  });

  function friendly(e) {
    const n = (e && e.name) || '';
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'The camera is blocked. In Windows Settings > Privacy > Camera, let desktop apps use the camera.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No camera was found on this computer.';
    if (n === 'NotReadableError' || n === 'AbortError') return 'The camera is busy. Another app may be using it.';
    return 'The camera could not start: ' + (e && e.message ? e.message : e);
  }

  async function start() {
    out({ type: 'status', state: 'starting', text: 'Starting the camera...' });
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } }, audio: false });
      video.srcObject = stream; await video.play();
    } catch (e) { out({ type: 'status', state: 'error', text: friendly(e) }); return; }
    try {
      pose = new Pose({ locateFile: f => 'mp/' + f });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      pose.onResults(onResults);
      await pose.initialize();
    } catch (e) { out({ type: 'status', state: 'error', text: 'The pose finder could not start: ' + (e && e.message ? e.message : e) }); return; }
    running = true;
    out({ type: 'status', state: 'ready', text: 'Camera is on' });
    loop();
  }

  async function loop() {
    if (!running) return;
    const t0 = performance.now();
    try { await pose.send({ image: video }); } catch (e) { /* skip this frame */ }
    setTimeout(loop, Math.max(50, (fast ? 250 : 500) - (performance.now() - t0)));
  }

  function onResults(r) {
    const L = r.poseLandmarks;
    let sample = { type: 'sample', present: false };
    if (L) {
      const nose = L[0], le = L[7], re = L[8], ls = L[11], rs = L[12];
      const vis = Math.min(nose.visibility, le.visibility, re.visibility, ls.visibility, rs.visibility);
      const shoulderW = Math.abs(ls.x - rs.x);
      const shoulderMidY = (ls.y + rs.y) / 2, headY = (nose.y + (le.y + re.y) / 2) / 2;
      sample = { type: 'sample', present: vis > 0.5 && shoulderW > 0.1,
        headDrop: (shoulderMidY - headY) / shoulderW,     // how far the head sits above the shoulders (smaller = head dropped)
        faceW: Math.abs(le.x - re.x),                     // how wide the head looks (bigger = leaning toward the screen)
        shoulderW, vis };
      last = L;
    } else last = null;
    out(sample);
    if (preview && performance.now() - lastPreview > 250) { lastPreview = performance.now(); drawPreview(); }
  }

  function drawPreview() {
    ctx.save(); ctx.translate(128, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, 128, 96); ctx.restore();   // mirrored, like a mirror
    if (last) [[0, '#FF9A55'], [7, '#FFD9F2'], [8, '#FFD9F2'], [11, '#FF8FB1'], [12, '#FF8FB1']].forEach(([i, c]) => {
      const x = (1 - last[i].x) * 128, y = last[i].y * 96;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 3, y - 3, 6, 6);          // white edge so the dot shows on any colour
      ctx.fillStyle = c; ctx.fillRect(x - 2, y - 2, 4, 4);
    });
    out({ type: 'preview', url: canvas.toDataURL('image/jpeg', 0.6) });
  }

  window.addEventListener('beforeunload', () => { running = false; if (stream) stream.getTracks().forEach(t => t.stop()); });
  start();
})();
