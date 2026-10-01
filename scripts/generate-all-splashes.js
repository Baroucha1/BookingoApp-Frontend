import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function updateAllSplashes() {
  console.log('--- Generating Safe Uncropped Splash Assets ---');

  // 1. Prepare white BookinGO logo buffer
  const logoRaw = await sharp('public/bookingo-logo.png').raw().toBuffer({ resolveWithObject: true });
  const logoBuf = Buffer.from(logoRaw.data);
  for (let i = 0; i < logoBuf.length; i += logoRaw.info.channels) {
    const x = (i / logoRaw.info.channels) % logoRaw.info.width;
    if (x < 720 && logoBuf[i + 3] > 0) {
      logoBuf[i] = 255;
      logoBuf[i + 1] = 255;
      logoBuf[i + 2] = 255;
    }
  }
  const logoWhitePng = await sharp(logoBuf, { raw: logoRaw.info }).png().toBuffer();
  fs.writeFileSync('public/bookingo-logo-white.png', logoWhitePng);

  // 2. Generate splash_icon.png for Android 12+ (512x512)
  // Android 12 enforces a circular mask of diameter ~320px in 512x512.
  // We keep the entire content strictly within radius 150px of center (256, 256).
  const iconSize = 512;
  const iconLogoWidth = 260; // aspect ratio 4.58 -> height = 57px
  const resizedLogoForIcon = await sharp(logoWhitePng)
    .resize({ width: iconLogoWidth })
    .toBuffer({ resolveWithObject: true });

  const iconLogoTop = 200;
  const iconLogoLeft = Math.round((iconSize - iconLogoWidth) / 2);

  const iconSubtitleY = 280;
  const iconBarY = 305;
  const iconBarWidth = 140;
  const iconBarHeight = 4;
  const iconBarX = Math.round((iconSize - iconBarWidth) / 2);

  const iconSvg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${iconSize} ${iconSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
          <stop offset="75%" stop-color="#60a5fa" stop-opacity="0.8" />
          <stop offset="96%" stop-color="#ffb400" />
          <stop offset="100%" stop-color="#ffa000" />
        </linearGradient>
      </defs>

      <!-- Subtitle strictly inside safe circle -->
      <text
        x="${iconSize / 2}"
        y="${iconSubtitleY}"
        font-family="system-ui, -apple-system, 'SF Pro Display', Roboto, Helvetica, Arial, sans-serif"
        font-size="12px"
        font-weight="700"
        letter-spacing="0.14em"
        fill="#FFFFFF"
        text-anchor="middle"
      >VOTRE VOYAGE COMMENCE ICI</text>

      <!-- Progress Track -->
      <rect
        x="${iconBarX}"
        y="${iconBarY}"
        width="${iconBarWidth}"
        height="${iconBarHeight}"
        rx="${iconBarHeight / 2}"
        fill="#FFFFFF"
        fill-opacity="0.2"
      />

      <!-- Progress Fill -->
      <rect
        x="${iconBarX}"
        y="${iconBarY}"
        width="${Math.round(iconBarWidth * 0.6)}"
        height="${iconBarHeight}"
        rx="${iconBarHeight / 2}"
        fill="url(#activeGrad)"
      />
    </svg>
  `;

  const splashIconBuf = await sharp(Buffer.from(iconSvg))
    .composite([
      {
        input: resizedLogoForIcon.data,
        top: iconLogoTop,
        left: iconLogoLeft,
      },
    ])
    .png()
    .toBuffer();

  fs.writeFileSync('android/app/src/main/res/drawable/splash_icon.png', splashIconBuf);
  console.log('Generated safe android/app/src/main/res/drawable/splash_icon.png (Android 12+)');

  // 3. Generate splash_content.png for layer-list (various densities)
  // This content is drawn centered by Android without ANY scaling or cropping!
  async function generateSplashContent(logoW) {
    const resizedLogo = await sharp(logoWhitePng)
      .resize({ width: logoW })
      .toBuffer({ resolveWithObject: true });

    const totalW = Math.round(logoW * 1.2);
    const subtitleY = resizedLogo.info.height + Math.round(logoW * 0.12);
    const subtitleFontSize = Math.max(9, Math.round(logoW * 0.052));

    const barW = Math.round(logoW * 0.65);
    const barH = Math.max(4, Math.round(logoW * 0.018));
    const barY = subtitleY + Math.round(logoW * 0.16);
    const barX = Math.round((totalW - barW) / 2);
    const totalH = barY + barH + 20;

    const logoTop = 0;
    const logoLeft = Math.round((totalW - logoW) / 2);

    const svg = `
      <svg width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
            <stop offset="75%" stop-color="#60a5fa" stop-opacity="0.8" />
            <stop offset="96%" stop-color="#ffb400" />
            <stop offset="100%" stop-color="#ffa000" />
          </linearGradient>
        </defs>

        <text
          x="${totalW / 2}"
          y="${subtitleY}"
          font-family="system-ui, -apple-system, 'SF Pro Display', Roboto, Helvetica, Arial, sans-serif"
          font-size="${subtitleFontSize}px"
          font-weight="700"
          letter-spacing="0.14em"
          fill="#FFFFFF"
          text-anchor="middle"
        >VOTRE VOYAGE COMMENCE ICI</text>

        <rect
          x="${barX}"
          y="${barY}"
          width="${barW}"
          height="${barH}"
          rx="${barH / 2}"
          fill="#FFFFFF"
          fill-opacity="0.22"
        />

        <rect
          x="${barX}"
          y="${barY}"
          width="${Math.round(barW * 0.6)}"
          height="${barH}"
          rx="${barH / 2}"
          fill="url(#activeGrad)"
        />
      </svg>
    `;

    return await sharp(Buffer.from(svg))
      .composite([
        {
          input: resizedLogo.data,
          top: logoTop,
          left: logoLeft,
        },
      ])
      .png()
      .toBuffer();
  }

  const contentDensities = [
    { dir: 'android/app/src/main/res/drawable', logoW: 420 },
    { dir: 'android/app/src/main/res/drawable-port-mdpi', logoW: 200 },
    { dir: 'android/app/src/main/res/drawable-port-hdpi', logoW: 300 },
    { dir: 'android/app/src/main/res/drawable-port-xhdpi', logoW: 400 },
    { dir: 'android/app/src/main/res/drawable-port-xxhdpi', logoW: 550 },
    { dir: 'android/app/src/main/res/drawable-port-xxxhdpi', logoW: 700 },
  ];

  for (const cd of contentDensities) {
    if (!fs.existsSync(cd.dir)) fs.mkdirSync(cd.dir, { recursive: true });
    const cBuf = await generateSplashContent(cd.logoW);
    fs.writeFileSync(path.join(cd.dir, 'splash_content.png'), cBuf);
  }
  console.log('Generated splash_content.png across all densities');

  // 4. Generate fallback full-screen splash.png files with SAFE 21:9 ZONE
  // To ensure the logo is NEVER cropped even on 21:9 phones when center-cropped:
  // safe width = height * (9 / 21)
  async function generateSafeSplash(width, height, isLandscape = false) {
    const isPort = !isLandscape;
    // On portrait, max safe width that is visible on any aspect ratio:
    const safeAspectWidth = isPort ? Math.min(width, height * (9 / 21)) : width;
    const logoRel = isPort ? 0.68 : 0.32;
    const logoWidth = Math.round(safeAspectWidth * logoRel);

    const resized = await sharp(logoWhitePng)
      .resize({ width: logoWidth })
      .toBuffer({ resolveWithObject: true });

    const logoTop = Math.round(height * (isPort ? 0.43 : 0.36));
    const logoLeft = Math.round((width - resized.info.width) / 2);

    const subtitleDist = Math.round(resized.info.height + (isPort ? safeAspectWidth * 0.08 : height * 0.08));
    const subtitleY = logoTop + subtitleDist;
    const subtitleFontSize = Math.max(10, Math.round(isPort ? safeAspectWidth * 0.038 : height * 0.04));

    const barWidth = Math.round(isPort ? safeAspectWidth * 0.45 : width * 0.22);
    const barHeight = Math.max(4, Math.round(isPort ? safeAspectWidth * 0.012 : height * 0.014));
    const barY = subtitleY + Math.round(isPort ? safeAspectWidth * 0.16 : height * 0.16);
    const barX = Math.round((width - barWidth) / 2);
    const activeWidth = Math.round(barWidth * 0.58);

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#011b54" />
            <stop offset="35%" stop-color="#002575" />
            <stop offset="70%" stop-color="#0238a8" />
            <stop offset="100%" stop-color="#0846c1" />
          </linearGradient>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
            <stop offset="75%" stop-color="#60a5fa" stop-opacity="0.8" />
            <stop offset="96%" stop-color="#ffb400" />
            <stop offset="100%" stop-color="#ffa000" />
          </linearGradient>
        </defs>

        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

        <text
          x="${Math.round(width / 2)}"
          y="${subtitleY}"
          font-family="system-ui, -apple-system, 'SF Pro Display', Roboto, Helvetica, Arial, sans-serif"
          font-size="${subtitleFontSize}px"
          font-weight="700"
          letter-spacing="0.14em"
          fill="#FFFFFF"
          text-anchor="middle"
        >VOTRE VOYAGE COMMENCE ICI</text>

        <rect
          x="${barX}"
          y="${barY}"
          width="${barWidth}"
          height="${barHeight}"
          rx="${Math.round(barHeight / 2)}"
          fill="#FFFFFF"
          fill-opacity="0.2"
        />

        <rect
          x="${barX}"
          y="${barY}"
          width="${activeWidth}"
          height="${barHeight}"
          rx="${Math.round(barHeight / 2)}"
          fill="url(#activeGrad)"
        />
      </svg>
    `;

    return await sharp(Buffer.from(svg))
      .composite([
        {
          input: resized.data,
          top: logoTop,
          left: logoLeft,
        },
      ])
      .png()
      .toBuffer();
  }

  const targets = [
    { file: 'android/app/src/main/res/drawable/splash.png', w: 480, h: 800, land: false },
    { file: 'android/app/src/main/res/drawable-port-mdpi/splash.png', w: 320, h: 480, land: false },
    { file: 'android/app/src/main/res/drawable-port-hdpi/splash.png', w: 480, h: 800, land: false },
    { file: 'android/app/src/main/res/drawable-port-xhdpi/splash.png', w: 720, h: 1280, land: false },
    { file: 'android/app/src/main/res/drawable-port-xxhdpi/splash.png', w: 960, h: 1600, land: false },
    { file: 'android/app/src/main/res/drawable-port-xxxhdpi/splash.png', w: 1280, h: 1920, land: false },

    { file: 'android/app/src/main/res/drawable-land-mdpi/splash.png', w: 480, h: 320, land: true },
    { file: 'android/app/src/main/res/drawable-land-hdpi/splash.png', w: 800, h: 480, land: true },
    { file: 'android/app/src/main/res/drawable-land-xhdpi/splash.png', w: 1280, h: 720, land: true },
    { file: 'android/app/src/main/res/drawable-land-xxhdpi/splash.png', w: 1600, h: 960, land: true },
    { file: 'android/app/src/main/res/drawable-land-xxxhdpi/splash.png', w: 1920, h: 1280, land: true },

    { file: 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png', w: 2732, h: 2732, land: false },
    { file: 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png', w: 2732, h: 2732, land: false },
    { file: 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png', w: 2732, h: 2732, land: false },
  ];

  for (const t of targets) {
    const dir = path.dirname(t.file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const buf = await generateSafeSplash(t.w, t.h, t.land);
    fs.writeFileSync(t.file, buf);
    console.log(`Updated safe: ${t.file}`);
  }

  console.log('--- All assets updated successfully! ---');
}

updateAllSplashes().catch(console.error);
