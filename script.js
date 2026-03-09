const promptInput = document.getElementById("prompt");
const secondsInput = document.getElementById("secondsPerScene");
const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("status");
const canvas = document.getElementById("movieCanvas");
const previewVideo = document.getElementById("moviePreview");
const downloadLink = document.getElementById("downloadLink");

const ctx = canvas.getContext("2d");

function splitScenes(text) {
  return text
    .split(/[。！？!?\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function fitLines(text, maxWidth) {
  const chars = [...text];
  const lines = [];
  let current = "";

  for (const char of chars) {
    const next = current + char;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawScene({ sceneText, elapsedMs, durationMs, index }) {
  const progress = Math.min(elapsedMs / durationMs, 1);
  const w = canvas.width;
  const h = canvas.height;

  const hueA = (index * 47 + 210) % 360;
  const hueB = (index * 67 + 290) % 360;
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, `hsl(${hueA}, 60%, 20%)`);
  gradient.addColorStop(1, `hsl(${hueB}, 70%, 12%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const particles = 18;
  for (let i = 0; i < particles; i += 1) {
    const drift = Math.sin((elapsedMs / 500) + i) * 16;
    const x = ((i * 163 + elapsedMs * 0.05) % (w + 100)) - 50;
    const y = ((i * 83 + elapsedMs * 0.03 + drift) % (h + 100)) - 50;
    const radius = 12 + ((i * 7) % 18);
    ctx.fillStyle = `hsla(${(hueA + i * 13) % 360}, 80%, 70%, 0.16)`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const scale = 0.95 + progress * 0.05;
  const alpha = Math.min(progress * 2, 1);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-w * 0.42, -62, w * 0.84, 124);

  ctx.fillStyle = "#f6f8ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 36px 'Microsoft YaHei', sans-serif";

  const lines = fitLines(sceneText, w * 0.72).slice(0, 3);
  lines.forEach((line, lineIndex) => {
    const y = (lineIndex - (lines.length - 1) / 2) * 44;
    ctx.fillText(line, 0, y);
  });
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 18px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Scene ${index + 1}`, w - 18, h - 18);
}

async function generateMovie() {
  const text = promptInput.value.trim();
  const secondsPerScene = Number(secondsInput.value);

  if (!text) {
    statusText.textContent = "请先输入电影描述。";
    return;
  }

  const scenes = splitScenes(text);
  if (!scenes.length) {
    statusText.textContent = "没有识别到有效场景，请换一种写法。";
    return;
  }

  generateBtn.disabled = true;
  downloadLink.classList.remove("ready");
  statusText.textContent = `正在生成，共 ${scenes.length} 个场景...`;

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.start();

  for (let i = 0; i < scenes.length; i += 1) {
    const durationMs = Math.max(1, secondsPerScene) * 1000;
    const start = performance.now();

    await new Promise((resolve) => {
      const frame = (now) => {
        const elapsed = now - start;
        drawScene({
          sceneText: scenes[i],
          elapsedMs: elapsed,
          durationMs,
          index: i,
        });

        if (elapsed < durationMs) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });

    statusText.textContent = `已完成 ${i + 1}/${scenes.length} 个场景...`;
  }

  recorder.stop();

  const blob = await new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  const url = URL.createObjectURL(blob);
  previewVideo.src = url;
  previewVideo.play();

  downloadLink.href = url;
  downloadLink.classList.add("ready");
  statusText.textContent = `生成完成！时长约 ${(scenes.length * secondsPerScene).toFixed(1)} 秒。`;
  generateBtn.disabled = false;
}

generateBtn.addEventListener("click", generateMovie);
