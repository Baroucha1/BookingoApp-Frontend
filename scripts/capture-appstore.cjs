const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '../app-store-screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Apple App Store 6.7" Super Retina XDR Display: 1290 x 2796 pixels
// Emulating iPhone 15/16 Pro Max: 430 x 932 pt @ 3x scale factor = 1290 x 2796 px
const iphone15ProMax = {
  ...devices['iPhone 15 Pro Max'],
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
};

// Realistic Apple Dynamic Island + Status Bar (9:41, Cellular, Wi-Fi, Battery)
// and iOS Home Indicator (bottom bar)
const getIosChromeHtml = (textColor = '#000000') => `
<div id="ios-status-bar-overlay" style="
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  z-index: 2147483647;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
">
  <!-- Time: 9:41 -->
  <div style="
    position: absolute;
    top: 17px;
    left: 34px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: ${textColor};
    line-height: 1;
  ">9:41</div>

  <!-- Dynamic Island Pill -->
  <div style="
    position: absolute;
    top: 11px;
    left: 50%;
    transform: translateX(-50%);
    width: 126px;
    height: 37px;
    background: #000000;
    border-radius: 20px;
    box-shadow: 0 0 1px 1px rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 12px;
  ">
    <!-- Camera lens sensor reflection inside Dynamic Island -->
    <div style="
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #1a2236 0%, #0d121d 60%, #05070a 100%);
      box-shadow: inset 0 0 1px rgba(255,255,255,0.25);
    "></div>
  </div>

  <!-- Status Icons: Cellular, Wifi, Battery -->
  <div style="
    position: absolute;
    top: 19px;
    right: 32px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: ${textColor};
  ">
    <!-- Cellular signal 4 bars -->
    <svg width="18" height="12" viewBox="0 0 18 12" fill="${textColor}">
      <rect x="0" y="9" width="3" height="3" rx="0.8" />
      <rect x="4.5" y="6" width="3" height="6" rx="0.8" />
      <rect x="9" y="3" width="3" height="9" rx="0.8" />
      <rect x="13.5" y="0" width="3" height="12" rx="0.8" />
    </svg>

    <!-- Wi-Fi -->
    <svg width="16" height="12" viewBox="0 0 16 12" fill="${textColor}">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2.5C10.7 2.5 13.1 3.6 14.8 5.3L16 4.1C13.9 2 11.1 0.7 8 0.7C4.9 0.7 2.1 2 0 4.1L1.2 5.3C2.9 3.6 5.3 2.5 8 2.5ZM8 6.2C9.7 6.2 11.2 6.9 12.3 8L13.5 6.8C12.1 5.4 10.1 4.5 8 4.5C5.9 4.5 3.9 5.4 2.5 6.8L3.7 8C4.8 6.9 6.3 6.2 8 6.2ZM8 9.8C8.8 9.8 9.5 10.1 10 10.6L8 12.6L6 10.6C6.5 10.1 7.2 9.8 8 9.8Z" />
    </svg>

    <!-- Battery (full 100%) -->
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="${textColor}" stroke-opacity="0.4" stroke-width="1" />
      <rect x="2" y="2" width="18" height="8" rx="2" fill="${textColor}" />
      <path d="M23 4.2C23.6 4.6 24 5.3 24 6C24 6.7 23.6 7.4 23 7.8V4.2Z" fill="${textColor}" fill-opacity="0.4" />
    </svg>
  </div>
</div>

<!-- Home Indicator (bottom swipe pill) -->
<div id="ios-home-indicator-overlay" style="
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 5px;
  background: ${textColor === '#ffffff' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'};
  border-radius: 100px;
  z-index: 2147483647;
  pointer-events: none;
"></div>
`;

// Helper: Ensure fonts, layout, and all <img> images are completely loaded
async function ensureEverythingLoaded(page) {
  await page.waitForLoadState('networkidle');

  // Wait for fonts and all <img> tags to complete loading
  await page.evaluate(async () => {
    // 1. Wait for webfonts
    if (document.fonts) {
      await document.fonts.ready;
    }

    // 2. Wait for all <img> tags in the DOM
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 4000);
        });
      })
    );

    // 3. Ensure window is strictly at top (0, 0)
    window.scrollTo(0, 0);
  });

  // Ensure header is in visible state
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (header) {
      header.classList.remove('-translate-y-full');
      header.classList.add('translate-y-0');
    }
  });

  // Small delay to ensure render tree update
  await page.waitForTimeout(500);
}

// Mock data for Visa destinations to ensure cards and imagery load beautifully
const mockVisaCountries = [
  {
    id: '1',
    code: 'tr',
    nameFr: 'Turquie',
    nameEn: 'Turkey',
    nameAr: 'تركيا',
    descriptionFr: 'eVisa Touristique & Affaires officiel',
    descriptionEn: 'Official Tourist & Business eVisa',
    descriptionAr: 'تأشيرة سياحية إلكترونية',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&q=80',
        altTextFr: 'Turquie Istanbul',
        imageType: 'HERO',
        isMain: true,
      },
    ],
    visaTypes: [{ price: 4900, currency: 'DZD' }],
  },
  {
    id: '2',
    code: 'eg',
    nameFr: 'Égypte',
    nameEn: 'Egypt',
    nameAr: 'مصر',
    descriptionFr: 'eVisa Touristique pour Le Caire & Mer Rouge',
    descriptionEn: 'Tourist eVisa for Cairo & Red Sea',
    descriptionAr: 'تأشيرة سياحية إلكترونية',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=900&q=80',
        altTextFr: 'Égypte Pyramides',
        imageType: 'HERO',
        isMain: true,
      },
    ],
    visaTypes: [{ price: 6200, currency: 'DZD' }],
  },
  {
    id: '3',
    code: 'th',
    nameFr: 'Thaïlande',
    nameEn: 'Thailand',
    nameAr: 'تايلاند',
    descriptionFr: 'eVisa Vacances & Séjours Découverte',
    descriptionEn: 'Tourist eVisa Thailand',
    descriptionAr: 'تأشيرة تايلاند',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80',
        altTextFr: 'Thaïlande Bangkok',
        imageType: 'HERO',
        isMain: true,
      },
    ],
    visaTypes: [{ price: 8500, currency: 'DZD' }],
  },
  {
    id: '4',
    code: 'jo',
    nameFr: 'Jordanie',
    nameEn: 'Jordan',
    nameAr: 'الأردن',
    descriptionFr: 'Jordan Pass & eVisa Touristique Pétra',
    descriptionEn: 'Jordan Pass & Tourist eVisa',
    descriptionAr: 'تأشيرة الأردن',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900&q=80',
        altTextFr: 'Jordanie Petra',
        imageType: 'HERO',
        isMain: true,
      },
    ],
    visaTypes: [{ price: 9900, currency: 'DZD' }],
  },
];

// Mock data for eSIM locations
const mockEsimLocations = {
  status: 'success',
  data: {
    countries: [
      {
        code: 'tr',
        name: 'Turquie',
        image: 'https://flagcdn.com/w80/tr.png',
        cover: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
        fromPrice: 1200,
      },
      {
        code: 'sa',
        name: 'Arabie Saoudite',
        image: 'https://flagcdn.com/w80/sa.png',
        cover: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=600&q=80',
        fromPrice: 1600,
      },
      {
        code: 'fr',
        name: 'France',
        image: 'https://flagcdn.com/w80/fr.png',
        cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
        fromPrice: 950,
      },
      {
        code: 'ae',
        name: 'Émirats Arabes Unis',
        image: 'https://flagcdn.com/w80/ae.png',
        cover: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
        fromPrice: 2100,
      },
    ],
    regions: [
      {
        code: 'eu',
        name: 'Europe (35 pays)',
        image: 'https://flagcdn.com/w80/eu.png',
        cover: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
        fromPrice: 2200,
      },
      {
        code: 'asia',
        name: 'Asie Globale',
        image: 'https://flagcdn.com/w80/un.png',
        cover: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
        fromPrice: 2800,
      },
    ],
  },
};

const screens = [
  {
    name: '01_accueil_bookingo.png',
    title: 'Accueil & Recherche de Voyages',
    url: 'http://localhost:8080/',
    async prepare(page) {
      await ensureEverythingLoaded(page);
    },
  },
  {
    name: '02_menu_mobile.png',
    title: 'Menu de Navigation & Services',
    url: 'http://localhost:8080/',
    async prepare(page) {
      await ensureEverythingLoaded(page);
      // Open the mobile drawer menu
      const buttons = await page.$$('header button');
      for (const b of buttons) {
        const aria = await b.getAttribute('aria-label');
        if (aria && (aria.includes('menu') || aria.includes('Menu') || aria.includes('Ouvrir'))) {
          await b.click();
          break;
        }
      }
      await page.waitForTimeout(600);
      await ensureEverythingLoaded(page);
    },
  },
  {
    name: '03_vols_recherche.png',
    title: 'Recherche de Vols & Compagnies',
    url: 'http://localhost:8080/flights',
    async prepare(page) {
      await ensureEverythingLoaded(page);
    },
  },
  {
    name: '04_visa_electronique.png',
    title: 'Demandes de eVisa & Destinations',
    url: 'http://localhost:8080/visa',
    async prepare(page) {
      await ensureEverythingLoaded(page);
    },
  },
  {
    name: '05_hotels_sejour.png',
    title: "Réservation d'Hôtels & Séjours",
    url: 'http://localhost:8080/hotels',
    async prepare(page) {
      await ensureEverythingLoaded(page);
    },
  },
  {
    name: '06_esim_connectivite.png',
    title: 'Boutique eSIM Internationale',
    url: 'http://localhost:8080/esim',
    async prepare(page) {
      await ensureEverythingLoaded(page);
    },
  },
];

async function main() {
  console.log('🚀 Démarrage de la capture des écrans App Store (1290 x 2796 px) avec Dynamic Island...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    ...iphone15ProMax,
    locale: 'fr-FR',
  });

  // Mock API routes for countries and esim so cards render completely
  await context.route('**/api/countries', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockVisaCountries),
    });
  });

  await context.route('**/api/esim/locations*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockEsimLocations),
    });
  });

  const page = await context.newPage();

  for (const screen of screens) {
    try {
      console.log(`📸 [${screen.name}] Chargement de ${screen.url}...`);
      await page.goto(screen.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Run screen preparation and image loader wait
      if (screen.prepare) {
        await screen.prepare(page);
      }

      // Inject iPhone 15/16 Pro Max Safe Area Inset styles (54px top notch, 34px home indicator)
      await page.addStyleTag({
        content: `
          :root {
            --safe-area-inset-top: 54px !important;
            --safe-area-inset-bottom: 34px !important;
          }
          .pt-safe {
            padding-top: 54px !important;
          }
          .pb-safe {
            padding-bottom: 34px !important;
          }
          .h-navbar {
            height: calc(4rem + 54px) !important;
          }
          .pt-navbar {
            padding-top: calc(4rem + 54px) !important;
          }
        `,
      });

      // Inject Dynamic Island, iOS Status Bar, and Home Indicator
      await page.evaluate((html) => {
        // Remove existing if any
        const existingStatus = document.getElementById('ios-status-bar-overlay');
        const existingHome = document.getElementById('ios-home-indicator-overlay');
        if (existingStatus) existingStatus.remove();
        if (existingHome) existingHome.remove();

        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);
      }, getIosChromeHtml('#000000'));

      // Wait a moment for final frame render
      await page.waitForTimeout(300);

      const filePath = path.join(outputDir, screen.name);
      await page.screenshot({
        path: filePath,
        fullPage: false,
      });
      console.log(`✅ [${screen.name}] Enregistré avec succès (${filePath})`);
    } catch (err) {
      console.error(`❌ Erreur sur ${screen.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('\n🎉 Toutes les captures App Store 1290x2796 avec Dynamic Island et images chargées sont prêtes !');
  console.log(`📁 Dossier : ${outputDir}`);
}

main().catch(console.error);
