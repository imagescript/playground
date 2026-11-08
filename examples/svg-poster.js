const inter = await loadFont('inter');

// The input goes into the SVG as a data: URI
const type = ImageType.getType(input) ?? 'png';
let binary = '';
for (let i = 0; i < input.length; i += 0x8000) binary += String.fromCharCode(...input.subarray(i, i + 0x8000));
const photo = `data:image/${type};base64,${btoa(binary)}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1350" viewBox="0 0 1080 1350">
  <style>
    .title { font: 900 128px Inter; fill: url(#sunset); letter-spacing: -4px; }
    .ring { font: 700 30px Inter; fill: #fde68a; letter-spacing: 9px; }
    .small { font: 500 30px Inter; fill: #e0e7ff; }
  </style>
  <defs>
    <radialGradient id="sky" cx="50%" cy="28%" r="80%">
      <stop offset="0" stop-color="#4c1d95"/><stop offset="0.55" stop-color="#1e1b4b"/><stop offset="1" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="sunset" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fb7185"/><stop offset="0.5" stop-color="#fbbf24"/><stop offset="1" stop-color="#34d399"/>
    </linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="14" cy="14" r="2.2" fill="#a5b4fc" opacity="0.35"/>
    </pattern>
    <!-- film grain: fractal noise, desaturated, as a faint layer -->
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
    </filter>
    <!-- a wobbly blob: a circle displaced by turbulence -->
    <filter id="liquid" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="turbulence" baseFrequency="0.012" numOctaves="2" seed="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="2"/>
    </filter>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#000" flood-opacity="0.6"/>
    </filter>
    <clipPath id="circle"><circle cx="540" cy="520" r="300"/></clipPath>
    <path id="orbit" d="M 540 520 m -350 0 a 350 350 0 1 1 700 0 a 350 350 0 1 1 -700 0"/>
  </defs>

  <rect width="1080" height="1350" fill="url(#sky)"/>
  <rect width="1080" height="1350" fill="url(#dots)"/>
  <circle cx="540" cy="520" r="330" fill="url(#sunset)" opacity="0.85" filter="url(#liquid)"/>

  <g filter="url(#shadow)">
    <image href="${photo}" x="240" y="220" width="600" height="600" preserveAspectRatio="xMidYMid slice" clip-path="url(#circle)"/>
  </g>
  <circle cx="540" cy="520" r="300" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="6"/>

  <text class="ring"><textPath href="#orbit" startOffset="0">RENDERED WITH IMAGESCRIPT · PURE TYPESCRIPT · RUNS EVERYWHERE ·</textPath></text>

  <text class="title" x="540" y="1080" text-anchor="middle">SVG NIGHTS</text>
  <text class="small" x="540" y="1150" text-anchor="middle">gradients · patterns · filters · clip paths · text on a path</text>
  <rect width="1080" height="1350" filter="url(#grain)"/>
</svg>`;

const poster = await Image.renderSVG(svg, { fonts: [inter] });
return poster.encodeJPEG({ quality: 90 });
