// ========================
// ULTIMATE FINGERPRINT COLLECTOR
// ========================

// Main collection function
const collectAllData = async () => {
  return {
    basic: getBasicData(),
    hardware: await getHardwareData(),
    graphics: await getGraphicsData(),
    behavior: getBehaviorData(),
    timestamp: new Date().toISOString()
  };
};

// ========================
// DATA COLLECTION METHODS
// ========================

// 1. BASIC SYSTEM DATA
function getBasicData() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    appVersion: navigator.appVersion,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type
    },
    window: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    }
  };
}

// 2. HARDWARE CAPABILITIES
async function getHardwareData() {
  return {
    gpu: await getGPUInfo(),
    cpu: {
      cores: navigator.hardwareConcurrency,
      architecture: detectCPUArchitecture(),
      endianness: detectEndianness()
    },
    battery: await getBatteryInfo(),
    storage: await getStorageInfo(),
    mediaDevices: await getMediaDevices(),
    sensors: await getSensorData()
  };
}

async function getGPUInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      extensions: gl.getSupportedExtensions()
    };
  } catch (e) {
    return null;
  }
}

function detectCPUArchitecture() {
  try {
    return new Function('try{return new WebAssembly.Memory({initial:0,maximum:0}).buffer.byteLength===0}catch(e){}')() ? 
      'WASM supported' : 'No WASM';
  } catch(e) {
    return 'Unknown';
  }
}

function detectEndianness() {
  const arrayBuffer = new ArrayBuffer(2);
  const uint8Array = new Uint8Array(arrayBuffer);
  const uint16array = new Uint16Array(arrayBuffer);
  uint8Array[0] = 0xAA;
  uint8Array[1] = 0xBB;
  return uint16array[0] === 0xBBAA ? 'LE' : 'BE';
}

async function getBatteryInfo() {
  if (!navigator.getBattery) return null;
  try {
    const battery = await navigator.getBattery();
    return {
      charging: battery.charging,
      level: battery.level,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime
    };
  } catch(e) {
    return null;
  }
}

async function getStorageInfo() {
  if (!navigator.storage?.estimate) return null;
  try {
    return await navigator.storage.estimate();
  } catch(e) {
    return null;
  }
}

async function getMediaDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return null;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.map(d => ({
      kind: d.kind,
      groupId: d.groupId,
      label: d.label
    }));
  } catch(e) {
    return null;
  }
}

async function getSensorData() {
  const results = {};
  
  // Accelerometer
  if ('Accelerometer' in window) {
    try {
      const sensor = new Accelerometer();
      await new Promise(resolve => {
        sensor.addEventListener('reading', () => {
          results.accelerometer = {
            x: sensor.x,
            y: sensor.y,
            z: sensor.z
          };
          resolve();
        });
        sensor.start();
      });
    } catch(e) {}
  }

  // Gyroscope
  if ('Gyroscope' in window) {
    try {
      const sensor = new Gyroscope();
      await new Promise(resolve => {
        sensor.addEventListener('reading', () => {
          results.gyroscope = {
            x: sensor.x,
            y: sensor.y,
            z: sensor.z
          };
          resolve();
        });
        sensor.start();
      });
    } catch(e) {}
  }

  return Object.keys(results).length ? results : null;
}

// 3. GRAPHICS FINGERPRINTING
async function getGraphicsData() {
  return {
    canvas: getCanvasFingerprint(),
    webgl: await getWebGLFingerprint(),
    webgl2: await getWebGL2Info(),
    video: getVideoCapabilities(),
    fonts: await getFontList(),
    css: getCSSFeatures()
  };
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#069';
    ctx.fillText('CANVAS-FP', 2, 15);
    return canvas.toDataURL();
  } catch(e) {
    return null;
  }
}

async function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return null;

    return {
      parameters: {
        VENDOR: gl.getParameter(gl.VENDOR),
        RENDERER: gl.getParameter(gl.RENDERER),
        MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE)
      },
      extensions: gl.getSupportedExtensions()
    };
  } catch(e) {
    return null;
  }
}

async function getWebGL2Info() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return null;
    
    return {
      parameters: {
        MAX_3D_TEXTURE_SIZE: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE),
        MAX_ARRAY_TEXTURE_LAYERS: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS)
      },
      extensions: gl.getSupportedExtensions()
    };
  } catch(e) {
    return null;
  }
}

function getVideoCapabilities() {
  try {
    const video = document.createElement('video');
    return {
      formats: video.canPlayType('video/webm') ? 'webm' : null,
      codecs: {
        h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
        vp9: video.canPlayType('video/webm; codecs="vp9"')
      }
    };
  } catch(e) {
    return null;
  }
}

async function getFontList() {
  const fontList = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
'Times New Roman', 'Times', 'Times Roman',
'Courier New', 'Courier',
'Georgia', 'Georgia Pro',
'Verdana', 'Verdana Pro',
'Tahoma', 'Tahoma Pro',
'Helvetica', 'Helvetica Neue', 'Helvetica Now',
'Gill Sans', 'Gill Sans MT', 'Gill Sans Nova',
'Futura', 'Futura PT', 'Futura Md BT',
'Myriad Pro', 'Myriad Web',
'Lucida Grande', 'Lucida Sans', 'Lucida Console',
'Palatino', 'Palatino Linotype', 'Book Antiqua',
'Garamond', 'Garamond Premier Pro',
'Baskerville', 'Baskerville Old Face',
'Bodoni MT', 'Bodoni 72',
'Rockwell', 'Rockwell Nova',
'Franklin Gothic', 'Franklin Gothic Medium',
'Century Gothic', 'Avant Garde Gothic',
'Optima', 'Optima Nova',
'Didot', 'Didot LT STD',
'Calibri', 'Calibri Light',
'Candara', 'Corbel', 'Constantia', 'Cambria',
'Segoe UI', 'Segoe Print', 'Segoe Script', 'Microsoft Sans Serif', 'Microsoft Yi Baiti',
'MS Gothic', 'MS Mincho', 'MS PGothic', 'MS PMincho',
'MS Reference Sans Serif', 'MS Reference Specialty',
'MV Boli', 'MingLiU', 'PMingLiU', 'SimSun',
'SimHei', 'KaiTi', 'FangSong', 'YouYuan',
'Microsoft JhengHei', 'Microsoft YaHei',
'Malgun Gothic', 'Gulim', 'Dotum', 'Roboto', 'Roboto Condensed', 'Roboto Mono',
'Open Sans', 'Open Sans Condensed',
'Lato', 'Lato Hairline',
'Montserrat', 'Montserrat Alternates',
'Source Sans Pro', 'Source Serif Pro',
'PT Sans', 'PT Serif', 'PT Mono',
'Oswald', 'Raleway', 'Merriweather',
'Playfair Display', 'Playfair Display SC',
'Ubuntu', 'Ubuntu Mono', 'Ubuntu Condensed',
'Noto Sans', 'Noto Serif', 'Noto Sans JP',
'Droid Sans', 'Droid Serif', 'Droid Sans Mono',
'Fira Sans', 'Fira Code', 'Fira Mono', 'Adobe Garamond Pro', 'Adobe Caslon Pro',
'Minion Pro', 'Myriad Pro', 'Trajan Pro',
'Birch Std', 'Blackoak Std', 'Brush Script Std',
'Chaparral Pro', 'Charlemagne Std',
'Cooper Std', 'Coronet', 'Cottonwood Std',
'Cronos Pro', 'Delicious', 'Ex Ponto',
'Frutiger', 'Frutiger LT Std',
'Kozuka Gothic Pro', 'Kozuka Mincho Pro',
'Lithos Pro', 'Mesquite Std', 'Mistral Std',
'Moonglow', 'Neue Haas Grotesk', 'OCR A Std',
'Poplar Std', 'Prestige Elite Std',
'Rosewood Std', 'Sanvito Pro', 'Sava Pro',
'Silom', 'Souvenir Std', 'Tekton Pro',
'Vag Rounded', 'Warnock Pro', 'Wood Type Std', 'San Francisco', 'SF Pro', 'SF Mono', 'SF Compact',
'New York', 'SF Pro Rounded', 'SF UI',
'Apple Chancery', 'Apple Garamond',
'Chicago', 'Geneva', 'Monaco',
'Hoefler Text', 'Skia', 'Capitals',
'Herculanum', 'Marker Felt', 'Optima',
'Papyrus', 'Sand', 'SignPainter', 'Consolas', 'Inconsolata', 'Fira Code',
'Menlo', 'Monaco', 'DejaVu Sans Mono',
'Droid Sans Mono', 'Liberation Mono',
'Source Code Pro', 'Hack', 'Input Mono',
'Anonymous Pro', 'Cascadia Code', 'JetBrains Mono',
'IBM Plex Mono', 'Courier Prime', 'Roboto Mono',
'Ubuntu Mono', 'PT Mono', 'Space Mono', 'Impact', 'Haettenschweiler',
'Copperplate', 'Copperplate Gothic',
'Bauhaus 93', 'Berlin Sans FB', 'Bernard MT',
'Blackadder ITC', 'Bodoni MT Poster',
'Bradley Hand', 'Britannic Bold',
'Broadway', 'Brush Script MT',
'Chiller', 'Colonna MT', 'Currier',
'Edwardian Script', 'Elephant',
'Engravers MT', 'Eras ITC', 'Felix Titling',
'Freestyle Script', 'French Script',
'Gigi', 'Goudy Stout', 'Harrington',
'Jokerman', 'Juice ITC', 'Kunstler Script',
'Magneto', 'Maiandra GD', 'Matura MT',
'Mistral', 'Modern No. 20', 'Niagara',
'Old English Text', 'Onyx', 'Parchment',
'Pristina', 'Rage Italic', 'Ravie',
'Script MT Bold', 'Showcard Gothic',
'Snap ITC', 'Stencil', 'Viner Hand ITC',
'Vivaldi', 'Vladimir Script', // Arabic
'Traditional Arabic', 'Arabic Typesetting',
'Simplified Arabic', 'Aldhabi', 'Andalus',
// Cyrillic
'Times New Roman Cyr', 'Arial Cyr',
'Courier New Cyr', 'Calibri Cyr',
// Greek
'GreekC', 'GreekS', 'Palatino Linotype',
// Hebrew
'Arial Hebrew', 'David', 'FrankRuehl',
// Indic
'Mangal', 'Latha', 'Gautami',
// Japanese
'MS Gothic', 'MS Mincho', 'Meiryo',
// Korean
'Batang', 'Gulim', 'Dotum',
// Thai
'Angsana New', 'Cordia New', 'Browallia New',
// Vietnamese
'Times New Roman Viet', 'Arial Viet', 'American Typewriter', 'Antique Olive',
'Arnoldboecklin', 'Bembo', 'Bickham Script',
'BlairMdITC TT', 'Bodoni Egyptian',
'Bookman Old Style', 'Braggadocio',
'Calisto MT', 'Castellar', 'Centaur',
'Century Schoolbook', 'Charcoal',
'Charter', 'Cheltenham', 'Clarendon',
'Coliseum', 'Cornerstone', 'Cushing',
'Dom Casual', 'Ehrhardt', 'Engravers Old English',
'Espy Sans', 'Espy Serif', 'Fette Fraktur',
'Florence', 'Folio', 'Footlight MT',
'Forum', 'Garth Graphic', 'Goudy Old Style',
'Goudy Text MT', 'Harlow Solid', 'Imprint MT',
'Kabel', 'Kaufmann', 'Kino MT', 'Klang',
'Kuenstler Script', 'Leawood', 'Letter Gothic',
'Lithograph', 'Lubalin Graph', 'Lucida Calligraphy',
'Lucida Fax', 'Lucida Handwriting',
'Lucida Sans Typewriter', 'Magneto',
'Medici Script', 'Memphis', 'Mesquite',
'Monotype Corsiva', 'Neuland', 'News Gothic',
'Novarese', 'OCR A Extended', 'Oldtown',
'Omnia', 'Othello', 'Peignot', 'Penumbra',
'Pepita MT', 'Perpetua', 'Pioneer',
'Plantagenet Cherokee', 'Present',
'Pump', 'Quirinus', 'Raleigh', 'Romic',
'Rotis Sans', 'Rotis Serif', 'Saloon',
'Serifa', 'Slogan', 'Souvenir',
'Stylus BT', 'Swiss 721', 'Tekton',
'Tempus Sans ITC', 'Thorndale', 'Umbra',
'Univers', 'Utopia', 'VAGRounded',
'Wilhelm Klingspor Gotisch', 'Windsor',
'Zapf Chancery', 'Zapfino'
  ];
  
  const detector = document.createElement('div');
  detector.style.position = 'absolute';
  detector.style.left = '-9999px';
  detector.style.fontSize = '100px';
  document.body.appendChild(detector);

  const available = [];
  for (const font of fontList) {
    detector.style.fontFamily = `'${font}', monospace`;
    if (detector.offsetWidth > 0) available.push(font);
  }

  document.body.removeChild(detector);
  return available;
}

function getCSSFeatures() {
  return {
    flexbox: 'flex' in document.documentElement.style,
    grid: 'grid' in document.documentElement.style,
    transforms: 'transform' in document.documentElement.style
  };
}

// 4. BEHAVIORAL DATA
function getBehaviorData() {
  return {
    mouse: captureMouseMovements(),
    scroll: captureScrollPattern(),
    keyboard: captureKeystrokes(),
    touch: captureTouchEvents()
  };
}

function captureMouseMovements() {
  const movements = [];
  const startTime = Date.now();
  
  const handler = e => {
    movements.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now() - startTime
    });
    if (movements.length >= 50) {
      document.removeEventListener('mousemove', handler);
    }
  };
  
  document.addEventListener('mousemove', handler);
  return movements;
}

function captureScrollPattern() {
  const pattern = [];
  const handler = () => {
    pattern.push({
      y: window.scrollY,
      t: Date.now()
    });
  };
  
  window.addEventListener('scroll', handler);
  setTimeout(() => {
    window.removeEventListener('scroll', handler);
  }, 1000);
  return pattern;
}

function captureKeystrokes() {
  const strokes = [];
  const handler = e => {
    strokes.push({
      key: e.key,
      code: e.code,
      t: performance.now()
    });
  };
  
  document.addEventListener('keydown', handler);
  setTimeout(() => {
    document.removeEventListener('keydown', handler);
  }, 1000);
  return strokes;
}

function captureTouchEvents() {
  if (!('ontouchstart' in window)) return null;
  
  const touches = [];
  const handler = e => {
    touches.push({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: performance.now()
    });
  };
  
  document.addEventListener('touchstart', handler);
  setTimeout(() => {
    document.removeEventListener('touchstart', handler);
  }, 1000);
  return touches;
}

// ========================
// MAIN EXECUTION
// ========================

(async () => {
  try {
    const startTime = performance.now();
    const collectedData = await collectAllData();
    
    // Add collection duration
    collectedData.meta = {
      collectionTime: performance.now() - startTime
    };

    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: window.TRACKING_ID,
        clientData: {
          basic: collectedData.basic,
          hardware: collectedData.hardware,
          graphics: collectedData.graphics
        },
        behavior: collectedData.behavior,
        nuclearData: collectedData // Complete dataset
      })
    });

  } catch (error) {
    console.error('Tracking error:', error);
  } finally {
    // Guaranteed redirect
    window.location.href = window.TARGET_URL;
  }
})();