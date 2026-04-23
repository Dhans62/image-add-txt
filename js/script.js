/* eslint-disable radix */
/* eslint-disable max-len */
/* eslint-disable no-plusplus */
// A bunch of settings used when converting
const settings = {
  screenWidth: 128,
  screenHeight: 64,
  scaleToFit: true,
  preserveRatio: true,
  centerHorizontally: false,
  centerVertically: false,
  flipHorizontally: false,
  flipVertically: false,
  backgroundColor: 'white',
  scale: 1,
  drawMode: 'horizontal',
  removeZeroesCommas: false,
  ditheringThreshold: 128,
  ditheringMode: 0,
  outputFormat: 'plain',
  invertColors: false,
  rotation: 0,
  colorMode: 'monochrome',
};

function bitswap(b) {
  if (settings.bitswap) {
    // eslint-disable-next-line no-bitwise, no-mixed-operators, no-param-reassign
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
    // eslint-disable-next-line no-bitwise, no-mixed-operators, no-param-reassign
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
    // eslint-disable-next-line no-bitwise, no-mixed-operators, no-param-reassign
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
  }
  return b;
}

const ConversionFunctions = {
  // Output the image as a string for horizontally drawing displays
  horizontal1bit(data, canvasWidth) {
    let stringFromBytes = '';
    let outputIndex = 0;
    let byteIndex = 7;
    let number = 0;

    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      // Get the average of the RGB (we ignore A)
      const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (avg > settings.ditheringThreshold) {
        number += 2 ** byteIndex;
      }
      byteIndex--;

      // if this was the last pixel of a row or the last pixel of the
      // image, fill up the rest of our byte with zeros so it always contains 8 bits
      if ((index !== 0 && (((index / 4) + 1) % (canvasWidth)) === 0) || (index === data.length - 4)) {
        // for(var i=byteIndex;i>-1;i--){
        // number += Math.pow(2, i);
        // }
        byteIndex = -1;
      }

      // When we have the complete 8 bits, combine them into a hex value
      if (byteIndex < 0) {
        let byteSet = bitswap(number).toString(16);
        if (byteSet.length === 1) { byteSet = `0${byteSet}`; }
        if (!settings.removeZeroesCommas) {
          stringFromBytes += `0x${byteSet}, `;
        } else {
          stringFromBytes += byteSet;
        }
        outputIndex++;
        if (outputIndex >= 16) {
          if (!settings.removeZeroesCommas) {
            stringFromBytes += '\n';
          }
          outputIndex = 0;
        }
        number = 0;
        byteIndex = 7;
      }
    }
    return stringFromBytes;
  },

  // Output the image as a string for vertically drawing displays
  // eslint-disable-next-line no-unused-vars
  vertical1bit(data, canvasWidth) {
    let stringFromBytes = '';
    let outputIndex = 0;
    for (let p = 0; p < Math.ceil(settings.screenHeight / 8); p++) {
      for (let x = 0; x < settings.screenWidth; x++) {
        let byteIndex = 7;
        let number = 0;

        for (let y = 7; y >= 0; y--) {
          const index = ((p * 8) + y) * (settings.screenWidth * 4) + x * 4;
          const avg = (data[index] + data[index + 1] + data[index + 2]) / 3;
          if (avg > settings.ditheringThreshold) {
            number += 2 ** byteIndex;
          }
          byteIndex--;
        }
        let byteSet = bitswap(number).toString(16);
        if (byteSet.length === 1) { byteSet = `0${byteSet}`; }
        if (!settings.removeZeroesCommas) {
          stringFromBytes += `0x${byteSet.toString(16)}, `;
        } else {
          stringFromBytes += byteSet.toString(16);
        }
        outputIndex++;
        if (outputIndex >= 16) {
          stringFromBytes += '\n';
          outputIndex = 0;
        }
      }
    }
    return stringFromBytes;
  },

  // Output the image as a string for 565 displays (horizontally)
  // eslint-disable-next-line no-unused-vars
  horizontal565(data, canvasWidth) {
    let stringFromBytes = '';
    let outputIndex = 0;

    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      // Get the RGB values
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      // calculate the 565 color value
      // eslint-disable-next-line no-bitwise
      const rgb = ((r & 0b11111000) << 8) | ((g & 0b11111100) << 3) | ((b & 0b11111000) >> 3);
      // Split up the color value in two bytes
      // const firstByte = (rgb >> 8) & 0xff;
      // const secondByte = rgb & 0xff;

      let byteSet = bitswap(rgb).toString(16);
      while (byteSet.length < 4) { byteSet = `0${byteSet}`; }
      if (!settings.removeZeroesCommas) {
        stringFromBytes += `0x${byteSet}, `;
      } else {
        stringFromBytes += byteSet;
      }
      // add newlines every 16 bytes
      outputIndex++;
      if (outputIndex >= 16) {
        stringFromBytes += '\n';
        outputIndex = 0;
      }
    }
    return stringFromBytes;
  },
  // Output the image as a string for rgb888 displays (horizontally)
  horizontal888(data, canvasWidth) {
    let stringFromBytes = '';
    let outputIndex = 0;

    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      // Get the RGB values
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      // calculate the 565 color value
      // eslint-disable-next-line no-bitwise
      const rgb = (r << 16) | (g << 8) | (b);
      // Split up the color value in two bytes
      // const firstByte = (rgb >> 8) & 0xff;
      // const secondByte = rgb & 0xff;

      let byteSet = bitswap(rgb).toString(16);
      while (byteSet.length < 8) { byteSet = `0${byteSet}`; }
      if (!settings.removeZeroesCommas) {
        stringFromBytes += `0x${byteSet}, `;
      } else {
        stringFromBytes += byteSet;
      }

      // add newlines every 16 bytes
      outputIndex++;
      if (outputIndex >= canvasWidth) {
        stringFromBytes += '\n';
        outputIndex = 0;
      }
    }
    return stringFromBytes;
  },
  // Output the alpha mask as a string for horizontally drawing displays
  horizontalAlpha(data, canvasWidth) {
    let stringFromBytes = '';
    let outputIndex = 0;
    let byteIndex = 7;
    let number = 0;

    // format is RGBA, so move 4 steps per pixel
    for (let index = 0; index < data.length; index += 4) {
      // Get alpha part of the image data
      const alpha = data[index + 3];
      if (alpha > settings.ditheringThreshold) {
        number += 2 ** byteIndex;
      }
      byteIndex--;

      // if this was the last pixel of a row or the last pixel of the
      // image, fill up the rest of our byte with zeros so it always contains 8 bits
      if ((index !== 0 && (((index / 4) + 1) % (canvasWidth)) === 0) || (index === data.length - 4)) {
        byteIndex = -1;
      }

      // When we have the complete 8 bits, combine them into a hex value
      if (byteIndex < 0) {
        let byteSet = bitswap(number).toString(16);
        if (byteSet.length === 1) { byteSet = `0${byteSet}`; }
        if (!settings.removeZeroesCommas) {
          stringFromBytes += `0x${byteSet}, `;
        } else {
          stringFromBytes += byteSet;
        }
        outputIndex++;
        if (outputIndex >= 16) {
          stringFromBytes += '\n';
          outputIndex = 0;
        }
        number = 0;
        byteIndex = 7;
      }
    }
    return stringFromBytes;
  },
};
settings.conversionFunction = ConversionFunctions.horizontal1bit;

// An images collection with helper methods
function Images() {
  const collection = [];
  this.push = (img, canvas, glyph) => { collection.push({ img, canvas, glyph }); };
  this.remove = (image) => {
    const i = collection.indexOf(image);
    if (i !== -1) collection.splice(i, 1);
  };
  this.move = (fromIndex, toIndex) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= collection.length || toIndex >= collection.length) return;
    const item = collection.splice(fromIndex, 1)[0];
    collection.splice(toIndex, 0, item);
  };
  this.indexOf = (image) => collection.indexOf(image);
  this.each = (f) => { collection.forEach(f); };
  this.length = () => collection.length;
  this.first = () => collection[0];
  this.last = () => collection[collection.length - 1];
  this.getByIndex = (index) => collection[index];
  this.setByIndex = (index, img) => { collection[index] = img; };
  this.get = (img) => {
    if (img) {
      for (let i = 0; i < collection.length; i++) {
        if (collection[i].img === img) {
          return collection[i];
        }
      }
    }
    return collection;
  };
  return this;
}

const images = new Images();
// Filetypes accepted by the file picker
// const fileTypes = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'svg'];
// Variable name, when "arduino code" is required
const identifier = 'myBitmap';

// ── REORDER HELPERS ──────────────────────────────────────────────────────────

// Sync DOM order (li list + canvas container + file-input-column entries) to match images collection
function syncDomOrder() {
  const imageSizeSettings = document.getElementById('image-size-settings');
  const canvasContainer = document.getElementById('images-canvas-container');
  const fileInputColumn = document.getElementById('file-input-column');

  for (let i = 0; i < images.length(); i++) {
    const imgObj = images.getByIndex(i);
    const li = imageSizeSettings.querySelector(`li[data-key="${imgObj.entryKey}"]`);
    const fe = fileInputColumn.querySelector(`.file-input-entry[data-key="${imgObj.entryKey}"]`);
    if (li) imageSizeSettings.appendChild(li);
    if (fe) fileInputColumn.appendChild(fe);
    canvasContainer.appendChild(imgObj.canvas);
  }
  updateAllImages();
}

// Move an image up (-1) or down (+1) and sync DOM
function moveImage(imgObj, delta) {
  const idx = images.indexOf(imgObj);
  const newIdx = idx + delta;
  if (newIdx < 0 || newIdx >= images.length()) return;
  images.move(idx, newIdx);
  syncDomOrder();
}

// Sort all images alphabetically by glyph name
// eslint-disable-next-line no-unused-vars
function sortImagesByName() {
  const n = images.length();
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (images.getByIndex(j).glyph > images.getByIndex(j + 1).glyph) {
        images.move(j, j + 1);
      }
    }
  }
  syncDomOrder();
}

// ─────────────────────────────────────────────────────────────────────────────

// Invert the colors of the canvas
function invert(canvas, ctx) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // red
    data[i + 1] = 255 - data[i + 1]; // green
    data[i + 2] = 255 - data[i + 2]; // blue
  }
  ctx.putImageData(imageData, 0, 0);
}

// Draw the image onto the canvas, taking into account color and scaling
function placeImage(_image) {
  const { img } = _image;
  const { canvas } = _image;
  const ctx = canvas.getContext('2d');

  // reset canvas size
  canvas.width = Number.isFinite(settings.screenWidth) && settings.screenWidth > 0 ? settings.screenWidth : 1;
  canvas.height = Number.isFinite(settings.screenHeight) && settings.screenHeight > 0 ? settings.screenHeight : 1;
  // eslint-disable-next-line no-param-reassign
  _image.ctx = ctx;
  ctx.save();

  // Draw background
  if (settings.backgroundColor === 'transparent') {
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    ctx.globalCompositeOperation = 'copy';
  } else {
    if (settings.invertColors) {
      if (settings.backgroundColor === 'white') {
        ctx.fillStyle = 'black';
      } else {
        ctx.fillStyle = 'white';
      }
    } else {
      ctx.fillStyle = settings.backgroundColor;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Offset used for centering the image when requested
  let offsetX = 0;
  let offsetY = 0;
  const imgW = img.width;
  const imgH = img.height;

  switch (settings.scale) {
    case 1: // Original
      if (settings.centerHorizontally) {
        offsetX = Math.round((canvas.width - imgW) / 2);
      }
      if (settings.centerVertically) {
        offsetY = Math.round((canvas.height - imgH) / 2);
      }
      ctx.drawImage(
        img,
        0,
        0,
        imgW,
        imgH,
        offsetX,
        offsetY,
        imgW,
        imgH,
      );
      break;
    case 2: {
      // Fit (make as large as possible without changing ratio)
      const useRatio = Math.min(canvas.width / imgW, canvas.height / imgH);
      if (settings.centerHorizontally) {
        offsetX = Math.round((canvas.width - imgW * useRatio) / 2);
      }
      if (settings.centerVertically) {
        offsetY = Math.round((canvas.height - imgH * useRatio) / 2);
      }

      ctx.drawImage(
        img,
        0,
        0,
        imgW,
        imgH,
        offsetX,
        offsetY,
        imgW * useRatio,
        imgH * useRatio,
      );
      break;
    }
    case 3: // Stretch x+y (make as large as possible without keeping ratio)
      ctx.drawImage(
        img,
        0,
        0,
        imgW,
        imgH,
        offsetX,
        offsetY,
        canvas.width,
        canvas.height,
      );
      break;
    case 4: // Stretch x (make as wide as possible)
      offsetX = 0;
      if (settings.centerVertically) { Math.round(offsetY = (canvas.height - imgH) / 2); }
      // offsetY *= offsetY_dir;
      ctx.drawImage(
        img,
        0,
        0,
        imgW,
        imgH,
        offsetX,
        offsetY,
        canvas.width,
        imgH,
      );
      break;
    case 5: // Stretch y (make as tall as possible)
      if (settings.centerHorizontally) { offsetX = Math.round((canvas.width - imgW) / 2); }
      // offsetX *= offsetX_dir;
      offsetY = 0;
      ctx.drawImage(
        img,
        0,
        0,
        imgW,
        imgH,
        offsetX,
        offsetY,
        imgW,
        canvas.height,
      );
      break;
    default:
      // console.log('unknown scale');
      break;
  }
  ctx.restore();

  if (settings.conversionFunction === ConversionFunctions.horizontal1bit
    || settings.conversionFunction === ConversionFunctions.vertical1bit) {
    // eslint-disable-next-line no-undef
    dithering(ctx, canvas.width, canvas.height, settings.ditheringThreshold, settings.ditheringMode);
    if (settings.invertColors) {
      invert(canvas, ctx);
    }
  }

  // RGB565 mode: quantize preview to show actual 565 color fidelity
  if (settings.colorMode === 'rgb565' || settings.conversionFunction === ConversionFunctions.horizontal565) {
    applyRgb565Preview(ctx, canvas.width, canvas.height);
  }

  if (settings.rotation !== 0) {
    const clone = canvas.cloneNode(true);
    clone.getContext('2d').drawImage(canvas, 0, 0);
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (settings.rotation === 90) {
      canvas.width = settings.screenHeight;
      canvas.height = settings.screenWidth;
      ctx.setTransform(1, 0, 0, 1, canvas.width, 0);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(clone, 0, 0);
    } else if (settings.rotation === 180) {
      ctx.setTransform(1, 0, 0, 1, canvas.width, canvas.height);
      ctx.rotate(Math.PI);
      ctx.drawImage(clone, 0, 0);
    } else if (settings.rotation === 270) {
      canvas.width = settings.screenHeight;
      canvas.height = settings.screenWidth;
      ctx.setTransform(1, 0, 0, 1, 0, canvas.height);
      ctx.rotate(Math.PI * 1.5);
      ctx.drawImage(clone, 0, 0);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  const flipHorizontal = settings.flipHorizontally ? -1 : 1;
  const xOffset = settings.flipHorizontally ? canvas.width : 0;
  const flipVertical = settings.flipVertically ? -1 : 1;
  const yOffset = settings.flipVertically ? canvas.height : 0;

  if (flipHorizontal === -1 || flipVertical === -1) {
    const clone = canvas.cloneNode(true);
    clone.getContext('2d').drawImage(canvas, 0, 0);
    ctx.setTransform(flipHorizontal, 0, 0, flipVertical, xOffset, yOffset); // set the scale and position
    ctx.drawImage(clone, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

// Handle drawing each of our images
function updateAllImages() {
  images.each((image) => {
    placeImage(image);
  });
}

// Easy way to update settings controlled by a textfield
function updateInteger(fieldName) {
  settings[fieldName] = parseInt(document.getElementById(fieldName).value);
  updateAllImages();
}

// Easy way to update settings controlled by a checkbox
// eslint-disable-next-line no-unused-vars
function updateBoolean(fieldName) {
  settings[fieldName] = document.getElementById(fieldName).checked;
  updateAllImages();
}

// Convert hex to binary
function hexToBinary(s) {
  let i;
  let ret = '';
  // lookup table for easier conversion. "0" characters are padded for "1" to "7"
  const lookupTable = {
    0: '0000',
    1: '0001',
    2: '0010',
    3: '0011',
    4: '0100',
    5: '0101',
    6: '0110',
    7: '0111',
    8: '1000',
    9: '1001',
    a: '1010',
    b: '1011',
    c: '1100',
    d: '1101',
    e: '1110',
    f: '1111',
    A: '1010',
    B: '1011',
    C: '1100',
    D: '1101',
    E: '1110',
    F: '1111',
  };
  for (i = 0; i < s.length; i += 1) {
    // eslint-disable-next-line no-prototype-builtins
    if (lookupTable.hasOwnProperty(s[i])) {
      ret += lookupTable[s[i]];
    } else {
      return { valid: false, s };
    }
  }
  return { valid: true, result: ret };
}

// get the type (in arduino code) of the output image
// this is a bit of a hack, it's better to make this a property of the conversion function (should probably turn it into objects)
function getImageType() {
  if (settings.conversionFunction === ConversionFunctions.horizontal565) {
    return 'uint16_t';
  } if (settings.conversionFunction === ConversionFunctions.horizontal888) {
    return 'unsigned long';
  }
  return 'unsigned char';
}

// Use the horizontally oriented list to draw the image
function listToImageHorizontal(list, canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  let index = 0;

  // round the width up to the next byte
  const widthRoundedUp = Math.floor(canvas.width / 8 + (canvas.width % 8 ? 1 : 0)) * 8;
  let widthCounter = 0;

  // Move the list into the imageData object
  for (let i = 0; i < list.length; i++) {
    if (!list[i] || list[i].trim() === '') continue; // eslint-disable-line no-continue
    let binString = hexToBinary(list[i]);
    if (!binString.valid) {
      console.warn('Skipping invalid token:', binString.s); // eslint-disable-line no-console
      continue; // eslint-disable-line no-continue
    }
    binString = binString.result;
    if (binString.length === 4) {
      binString += '0000';
    }

    // Check if pixel is white or black
    for (let k = 0; k < binString.length; k++, widthCounter++) {
      // if we've counted enough bits, reset counter for next line
      if (widthCounter >= widthRoundedUp) {
        widthCounter = 0;
      }
      // skip 'artifact' pixels due to rounding up to a byte
      if (widthCounter < canvas.width) {
        let color = 0;
        if (binString.charAt(k) === '1') {
          color = 255;
        }
        imgData.data[index] = color;
        imgData.data[index + 1] = color;
        imgData.data[index + 2] = color;
        imgData.data[index + 3] = 255;

        index += 4;
      }
    }
  }

  // Draw the image onto the canvas, then save the canvas contents
  // inside the img object. This way we can reuse the img object when
  // we want to scale / invert, etc.
  ctx.putImageData(imgData, 0, 0);
  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  images.first().img = img;
}

// Quick and effective way to draw single pixels onto the canvas
// using a global 1x1px large canvas
function drawPixel(ctx, x, y, color) {
  const singlePixel = ctx.createImageData(1, 1);
  const d = singlePixel.data;

  d[0] = color;
  d[1] = color;
  d[2] = color;
  d[3] = 255;
  ctx.putImageData(singlePixel, x, y);
}

// Use the vertically oriented list to draw the image
function listToImageVertical(list, canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let page = 0;
  let x = 0;
  let y = 7;

  // Move the list into the imageData object
  for (let i = 0; i < list.length; i++) {
    if (!list[i] || list[i].trim() === '') continue; // eslint-disable-line no-continue
    let binString = hexToBinary(list[i]);
    if (!binString.valid) {
      console.warn('Skipping invalid token:', binString.s); // eslint-disable-line no-console
      continue; // eslint-disable-line no-continue
    }
    binString = binString.result;
    if (binString.length === 4) {
      binString += '0000';
    }

    // Check if pixel is white or black
    for (let k = 0; k < binString.length; k++) {
      let color = 0;
      if (binString.charAt(k) === '1') {
        color = 255;
      }
      drawPixel(ctx, x, (page * 8) + y, color);
      y--;
      if (y < 0) {
        y = 7;
        x++;
        if (x >= settings.screenWidth) {
          x = 0;
          page++;
        }
      }
    }
  }
  // Save the canvas contents inside the img object. This way we can
  // reuse the img object when we want to scale / invert, etc.
  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  images.first().img = img;
}

// Handle inserting an image by pasting code
// eslint-disable-next-line no-unused-vars
// Parse raw hex text into clean token list (strips comments, declarations, etc)
function parseByteInput(raw) {
  let s = raw;
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');     // block comments
  s = s.replace(/\/\/[^\r\n]*/g, '');          // line comments
  s = s.replace(/#[^\r\n]*/g, '');             // preprocessor
  s = s.replace(/const\s+[\w\s]+\s*\[[\s\S]*?\]\s*(?:PROGMEM\s*)?=/g, ''); // declarations
  s = s.replace(/[{};]/g, ',');
  s = s.replace(/0[xX]/g, '');
  s = s.replace(/[\s\r\n]+/g, ',');
  s = s.replace(/,{2,}/g, ',');
  s = s.replace(/^,|,$/g, '');
  return s.split(',').filter((t) => /^[0-9a-fA-F]+$/.test(t));
}

// Parse .h file into array of frame objects: [{name, width, height, tokens}]
function parseHFileFrames(content) {
  const frames = [];

  // Match each array block: optional comment with name/size, then const ... = { ... };
  // Supports both: "const unsigned char name[] PROGMEM = {" and "const unsigned char PROGMEM name[] = {"
  const blockRegex = /(?:\/\/\s*'([^']+)',\s*(\d+)\s*x\s*(\d+)\s*px[^\n]*)?\s*const\s+[\w\s]+?\s+(?:PROGMEM\s+)?(\w+)\s*\[[\s\S]*?\]\s*(?:PROGMEM\s*)?=\s*\{([\s\S]*?)\};/g;

  let match;
  // eslint-disable-next-line no-cond-assign
  while ((match = blockRegex.exec(content)) !== null) {
    const commentName = match[1] || null;
    const commentW = match[2] ? parseInt(match[2]) : null;
    const commentH = match[3] ? parseInt(match[3]) : null;
    const varName = match[4];
    const body = match[5];

    // Skip the allArray variable (pointer array, not bitmap data)
    if (/allArray|_LEN/.test(varName)) continue; // eslint-disable-line no-continue

    const tokens = parseByteInput(body);
    if (tokens.length === 0) continue; // eslint-disable-line no-continue

    frames.push({
      name: commentName || varName,
      width: commentW,
      height: commentH,
      tokens,
    });
  }
  return frames;
}

// Create a canvas+image entry for one frame and add it to the page (like handleImageSelection does)
function addFrameToPage(frameName, width, height, tokens, drawMode) {
  const canvasContainer = document.getElementById('images-canvas-container');
  const imageSizeSettings = document.getElementById('image-size-settings');
  const fileInputColumn = document.getElementById('file-input-column');
  const noFileSelected = document.querySelectorAll('.no-file-selected');

  noFileSelected.forEach((el) => { el.style.display = 'none'; }); // eslint-disable-line no-param-reassign

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const glyphName = frameName.replace(/[^a-zA-Z0-9_]/g, '_');
  const entryKey = `${glyphName}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // ── file-input-column entry ──────────────────────────────────────────────
  const fileInputColumnEntry = document.createElement('div');
  fileInputColumnEntry.className = 'file-input-entry';
  fileInputColumnEntry.setAttribute('data-key', entryKey);

  const label = document.createElement('span');
  label.textContent = frameName;
  const removeBtn1 = document.createElement('button');
  removeBtn1.className = 'remove-button';
  removeBtn1.innerHTML = 'remove';

  // ── image-size li ────────────────────────────────────────────────────────
  const imageEntry = document.createElement('li');
  imageEntry.setAttribute('data-img', frameName);
  imageEntry.setAttribute('data-key', entryKey);
  imageEntry.draggable = true;
  imageEntry.style.cursor = 'grab';

  const wInput = document.createElement('input');
  wInput.type = 'number'; wInput.name = 'width'; wInput.min = 0;
  wInput.className = 'size-input'; wInput.value = width;
  wInput.oninput = () => { canvas.width = parseInt(wInput.value); updateAllImages(); };

  const hInput = document.createElement('input');
  hInput.type = 'number'; hInput.name = 'height'; hInput.min = 0;
  hInput.className = 'size-input'; hInput.value = height;
  hInput.oninput = () => { canvas.height = parseInt(hInput.value); updateAllImages(); };

  const fn = document.createElement('span');
  fn.className = 'file-info';
  fn.innerHTML = `${frameName} (${width} x ${height})<br />`;

  const gi = document.createElement('input');
  gi.type = 'text'; gi.name = 'glyph'; gi.className = 'glyph-input';

  const gil = document.createElement('span');
  gil.innerHTML = 'glyph'; gil.className = 'file-info';

  const rb = document.createElement('button');
  rb.className = 'remove-button'; rb.innerHTML = 'remove';

  const btnUp = document.createElement('button');
  btnUp.className = 'order-button'; btnUp.innerHTML = '▲'; btnUp.title = 'Move up';
  btnUp.onclick = () => { moveImage(images.get(img), -1); }; // eslint-disable-line no-use-before-define

  const btnDown = document.createElement('button');
  btnDown.className = 'order-button'; btnDown.innerHTML = '▼'; btnDown.title = 'Move down';
  btnDown.onclick = () => { moveImage(images.get(img), 1); }; // eslint-disable-line no-use-before-define

  const removeButtonOnClick = () => {
    const image = images.get(img); // eslint-disable-line no-use-before-define
    canvasContainer.removeChild(image.canvas);
    images.remove(image);
    imageSizeSettings.removeChild(imageEntry);
    fileInputColumn.removeChild(fileInputColumnEntry);
    if (imageSizeSettings.querySelectorAll('li[data-key]').length <= 1) {
      document.getElementById('all-same-size').style.display = 'none';
    }
    if (images.length() === 0) {
      noFileSelected.forEach((el) => { el.style.display = 'block'; }); // eslint-disable-line no-param-reassign
      document.getElementById('sort-controls').style.display = 'none';
      document.getElementById('clear-all-button').style.display = 'none';
    }
    updateAllImages();
  };
  rb.onclick = removeButtonOnClick;
  removeBtn1.onclick = removeButtonOnClick;

  // drag-and-drop
  imageEntry.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', entryKey);
    imageEntry.classList.add('dragging');
  });
  imageEntry.addEventListener('dragend', () => {
    imageEntry.classList.remove('dragging');
    imageSizeSettings.querySelectorAll('li').forEach((li) => li.classList.remove('drag-over'));
  });
  imageEntry.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageSizeSettings.querySelectorAll('li').forEach((li) => li.classList.remove('drag-over'));
    imageEntry.classList.add('drag-over');
  });
  imageEntry.addEventListener('drop', (e) => {
    e.preventDefault();
    const fromKey = e.dataTransfer.getData('text/plain');
    if (fromKey === entryKey) return;
    let fromIdx = -1; let toIdx = -1;
    for (let k = 0; k < images.length(); k++) {
      if (images.getByIndex(k).entryKey === fromKey) fromIdx = k;
      if (images.getByIndex(k).entryKey === entryKey) toIdx = k;
    }
    if (fromIdx === -1 || toIdx === -1) return;
    images.move(fromIdx, toIdx);
    syncDomOrder();
    imageEntry.classList.remove('drag-over');
  });

  fileInputColumnEntry.appendChild(label);
  fileInputColumnEntry.appendChild(removeBtn1);
  fileInputColumn.appendChild(fileInputColumnEntry);

  imageEntry.appendChild(fn);
  imageEntry.appendChild(wInput);
  imageEntry.appendChild(document.createTextNode(' x '));
  imageEntry.appendChild(hInput);
  imageEntry.appendChild(gil);
  imageEntry.appendChild(gi);
  imageEntry.appendChild(btnUp);
  imageEntry.appendChild(btnDown);
  imageEntry.appendChild(rb);
  imageSizeSettings.appendChild(imageEntry);

  canvasContainer.appendChild(canvas);

  const img = new Image();
  images.push(img, canvas, glyphName);
  images.last().entryKey = entryKey;

  // Draw frame onto canvas
  settings.screenWidth = width;
  settings.screenHeight = height;
  if (drawMode === 'vertical') {
    listToImageVertical(tokens, canvas);
  } else {
    listToImageHorizontal(tokens, canvas);
  }

  gi.onchange = () => { const image = images.get(img); image.glyph = gi.value; };

  if (images.length() > 1) {
    document.getElementById('all-same-size').style.display = 'block';
  }
  document.getElementById('sort-controls').style.display = 'block';
  document.getElementById('clear-all-button').style.display = 'inline-block';
}

// Handle .h / .c file upload → parse each array as a separate frame
// eslint-disable-next-line no-unused-vars
function handleHFileInput(evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    document.getElementById('byte-input').value = content;

    const frames = parseHFileFrames(content);
    if (frames.length === 0) {
      // eslint-disable-next-line no-alert
      alert('No bitmap arrays found in file.');
      return;
    }

    // Use width/height from first frame that has it, fallback to input fields
    const defaultW = parseInt(document.getElementById('text-input-width').value);
    const defaultH = parseInt(document.getElementById('text-input-height').value);

    frames.forEach((frame) => {
      const w = frame.width || defaultW;
      const h = frame.height || defaultH;
      addFrameToPage(frame.name, w, h, frame.tokens, 'horizontal');
    });
  };
  reader.readAsText(file);
}

// eslint-disable-next-line no-unused-vars
function handleTextInput(drawMode) {
  const canvasContainer = document.getElementById('images-canvas-container');
  const canvas = document.createElement('canvas');

  canvas.width = parseInt(document.getElementById('text-input-width').value);
  canvas.height = parseInt(document.getElementById('text-input-height').value);
  settings.screenWidth = canvas.width;
  settings.screenHeight = canvas.height;

  if (canvasContainer.children.length) {
    canvasContainer.removeChild(canvasContainer.firstChild);
  }
  canvasContainer.appendChild(canvas);

  const image = new Image();
  images.setByIndex(0, { img: image, canvas });

  const list = parseByteInput(document.getElementById('byte-input').value);
  if (list.length === 0) {
    // eslint-disable-next-line no-alert
    alert('No valid hex data found.');
    return;
  }

  if (drawMode === 'horizontal') {
    listToImageHorizontal(list, canvas);
  } else {
    listToImageVertical(list, canvas);
  }
}

// eslint-disable-next-line no-unused-vars
function clearAll() {
  const canvasContainer = document.getElementById('images-canvas-container');
  const imageSizeSettings = document.getElementById('image-size-settings');
  const fileInputColumn = document.getElementById('file-input-column');

  while (canvasContainer.firstChild) canvasContainer.removeChild(canvasContainer.firstChild);
  imageSizeSettings.querySelectorAll('li').forEach((li) => imageSizeSettings.removeChild(li));
  fileInputColumn.querySelectorAll('.file-input-entry').forEach((fe) => fileInputColumn.removeChild(fe));
  while (images.length() > 0) images.remove(images.first());

  document.getElementById('all-same-size').style.display = 'none';
  document.getElementById('sort-controls').style.display = 'none';
  document.getElementById('clear-all-button').style.display = 'none';
  document.querySelectorAll('.no-file-selected').forEach((el) => { el.style.display = 'block'; }); // eslint-disable-line no-param-reassign
  document.getElementById('code-output').value = '';
  document.getElementById('copy-button').disabled = true;
  document.getElementById('file-input').value = '';
  document.getElementById('h-file-input').value = '';
  document.getElementById('byte-input').value = '';
}

// eslint-disable-next-line no-unused-vars
function allSameSize() {
  if (images.length() > 1) {
    const inputs = document.querySelectorAll('#image-size-settings input');
    // all images same size button
    for (let i = 2; i < inputs.length; i++) {
      if (inputs[i].name === 'width') {
        inputs[i].value = inputs[0].value;
        inputs[i].oninput();
      }
      if (inputs[i].name === 'height') {
        inputs[i].value = inputs[1].value;
        inputs[i].oninput();
      }
    }
  }
}

// Handle selecting an image with the file picker
function handleImageSelection(evt) {
  const files = Array.from(evt.target.files);

  const autoSort = document.getElementById('auto-sort-name');
  if (autoSort && autoSort.checked) {
    files.sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  const onlyImagesFileError = document.getElementById('only-images-file-error');
  onlyImagesFileError.style.display = 'none';

  const noFileSelected = document.querySelectorAll('.no-file-selected');
  if (files.length > 0) {
    noFileSelected.forEach((el) => { el.style.display = 'none'; }); // eslint-disable-line no-param-reassign
  } else {
    noFileSelected.forEach((el) => { el.style.display = 'block'; }); // eslint-disable-line no-param-reassign
  }

  for (let i = 0; i < files.length; i++) {
    if (!files[i].type.match('image.*')) {
      onlyImagesFileError.style.display = 'block';
      continue; // eslint-disable-line no-continue
    }

    const reader = new FileReader();

    reader.onload = (file) => {
      file.name = reader.name; // eslint-disable-line no-param-reassign
      const img = new Image();

      img.onload = () => {
        const glyphName = file.name.split('.')[0];
        // unique key for DOM lookup — use timestamp+name to avoid collision
        const entryKey = `${glyphName}_${Date.now()}`;

        // ── file-input-column entry ──────────────────────────────────────
        const fileInputColumnEntry = document.createElement('div');
        fileInputColumnEntry.className = 'file-input-entry';
        fileInputColumnEntry.setAttribute('data-key', entryKey);

        const fileInputColumnEntryLabel = document.createElement('span');
        fileInputColumnEntryLabel.textContent = file.name;

        const fileInputColumnEntryRemoveButton = document.createElement('button');
        fileInputColumnEntryRemoveButton.className = 'remove-button';
        fileInputColumnEntryRemoveButton.innerHTML = 'remove';

        // ── canvas ───────────────────────────────────────────────────────
        const canvas = document.createElement('canvas');

        // ── image-size-settings li ───────────────────────────────────────
        const imageEntry = document.createElement('li');
        imageEntry.setAttribute('data-img', file.name);
        imageEntry.setAttribute('data-key', entryKey);
        imageEntry.draggable = true;
        imageEntry.style.cursor = 'grab';

        const w = document.createElement('input');
        w.type = 'number'; w.name = 'width'; w.id = 'screenWidth'; w.min = 0;
        w.className = 'size-input'; w.value = img.width;
        settings.screenWidth = img.width;
        w.oninput = () => { canvas.width = this.value; updateAllImages(); updateInteger('screenWidth'); };

        const h = document.createElement('input');
        h.type = 'number'; h.name = 'height'; h.id = 'screenHeight'; h.min = 0;
        h.className = 'size-input'; h.value = img.height;
        settings.screenHeight = img.height;
        h.oninput = () => { canvas.height = this.value; updateAllImages(); updateInteger('screenHeight'); };

        const gil = document.createElement('span');
        gil.innerHTML = 'glyph'; gil.className = 'file-info';

        const gi = document.createElement('input');
        gi.type = 'text'; gi.name = 'glyph'; gi.className = 'glyph-input';
        gi.onchange = () => { const image = images.get(img); image.glyph = gi.value; };

        const fn = document.createElement('span');
        fn.className = 'file-info';
        fn.innerHTML = `${file.name} (file resolution: ${img.width} x ${img.height})<br />`;

        const rb = document.createElement('button');
        rb.className = 'remove-button'; rb.innerHTML = 'remove';

        // ── ▲▼ buttons ───────────────────────────────────────────────────
        const btnUp = document.createElement('button');
        btnUp.className = 'order-button'; btnUp.innerHTML = '▲'; btnUp.title = 'Move up';
        btnUp.onclick = () => { moveImage(images.get(img), -1); };

        const btnDown = document.createElement('button');
        btnDown.className = 'order-button'; btnDown.innerHTML = '▼'; btnDown.title = 'Move down';
        btnDown.onclick = () => { moveImage(images.get(img), 1); };

        const fileInputColumn = document.getElementById('file-input-column');
        const imageSizeSettings = document.getElementById('image-size-settings');
        const canvasContainer = document.getElementById('images-canvas-container');

        const removeButtonOnClick = () => {
          const image = images.get(img);
          canvasContainer.removeChild(image.canvas);
          images.remove(image);
          imageSizeSettings.removeChild(imageEntry);
          fileInputColumn.removeChild(fileInputColumnEntry);
          if (imageSizeSettings.querySelectorAll('li[data-key]').length <= 1) {
            document.getElementById('all-same-size').style.display = 'none';
          }
          if (images.length() === 0) {
            noFileSelected.forEach((el) => { el.style.display = 'block'; }); // eslint-disable-line no-param-reassign
            document.getElementById('sort-controls').style.display = 'none';
          }
          updateAllImages();
        };

        rb.onclick = removeButtonOnClick;
        fileInputColumnEntryRemoveButton.onclick = removeButtonOnClick;

        // ── drag-and-drop ─────────────────────────────────────────────────
        imageEntry.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', entryKey);
          imageEntry.classList.add('dragging');
        });
        imageEntry.addEventListener('dragend', () => {
          imageEntry.classList.remove('dragging');
          imageSizeSettings.querySelectorAll('li').forEach((li) => li.classList.remove('drag-over'));
        });
        imageEntry.addEventListener('dragover', (e) => {
          e.preventDefault();
          imageSizeSettings.querySelectorAll('li').forEach((li) => li.classList.remove('drag-over'));
          imageEntry.classList.add('drag-over');
        });
        imageEntry.addEventListener('drop', (e) => {
          e.preventDefault();
          const fromKey = e.dataTransfer.getData('text/plain');
          if (fromKey === entryKey) return;
          let fromIdx = -1; let toIdx = -1;
          for (let k = 0; k < images.length(); k++) {
            if (images.getByIndex(k).entryKey === fromKey) fromIdx = k;
            if (images.getByIndex(k).entryKey === entryKey) toIdx = k;
          }
          if (fromIdx === -1 || toIdx === -1) return;
          images.move(fromIdx, toIdx);
          syncDomOrder();
          imageEntry.classList.remove('drag-over');
        });

        // ── assemble ──────────────────────────────────────────────────────
        fileInputColumnEntry.appendChild(fileInputColumnEntryLabel);
        fileInputColumnEntry.appendChild(fileInputColumnEntryRemoveButton);
        fileInputColumn.appendChild(fileInputColumnEntry);

        imageEntry.appendChild(fn);
        imageEntry.appendChild(w);
        imageEntry.appendChild(document.createTextNode(' x '));
        imageEntry.appendChild(h);
        imageEntry.appendChild(gil);
        imageEntry.appendChild(gi);
        imageEntry.appendChild(btnUp);
        imageEntry.appendChild(btnDown);
        imageEntry.appendChild(rb);
        imageSizeSettings.appendChild(imageEntry);

        canvas.width = img.width;
        canvas.height = img.height;
        canvasContainer.appendChild(canvas);

        images.push(img, canvas, glyphName);
        // store entryKey on the imgObj for syncDomOrder lookup
        images.last().entryKey = entryKey;

        document.getElementById('sort-controls').style.display = 'block';
        document.getElementById('clear-all-button').style.display = 'inline-block';
        if (images.length() > 1) {
          document.getElementById('all-same-size').style.display = 'block';
        }
        placeImage(images.last());
      };
      img.src = file.target.result;
    };
    reader.name = files[i].name;
    reader.readAsDataURL(files[i]);
  }
}

function imageToString(image) {
  // extract raw image data
  const { ctx } = image;
  const { canvas } = image;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  return settings.conversionFunction(data, canvas.width);
}

// Get the custom arduino output variable name, if any
function getIdentifier() {
  const vn = document.getElementById('identifier');
  return vn && vn.value.length ? vn.value : identifier;
}

// Output the image string to the textfield
// eslint-disable-next-line no-unused-vars
function generateOutputString() {
  let outputString = '';
  let code = '';

  switch (settings.outputFormat) {
    case 'arduino': {
      const varQuickArray = [];
      let bytesUsed = 0;
      // --
      images.each((image) => {
        code = imageToString(image);

        // Trim whitespace from end and remove trailing comma
        code = code.replace(/,\s*$/, '');

        code = `\t${code.split('\n').join('\n\t')}\n`;
        // const variableCount = images.length() > 1 ? count++ : '';
        const comment = `// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
        bytesUsed += code.split('\n').length * 16; // 16 bytes per line.

        const varname = getIdentifier() + image.glyph.replace(/[^a-zA-Z0-9]/g, '_');
        varQuickArray.push(varname);
        code = `${comment}const ${getImageType()} ${varname} [] PROGMEM = {\n${code}};\n`;
        outputString += code;
      });

      varQuickArray.sort();
      outputString += `\n// Array of all bitmaps for convenience. (Total bytes used to store images in PROGMEM = ${bytesUsed})\n`;
      outputString += `const int ${getIdentifier()}allArray_LEN = ${varQuickArray.length};\n`;
      outputString += `const ${getImageType()}* ${getIdentifier()}allArray[${varQuickArray.length}] = {\n\t${varQuickArray.join(',\n\t')}\n};\n`;
      break;
    }

    case 'arduino_single': {
      let comment = '';
      images.each((image) => {
        code = imageToString(image);
        code = `\t${code.split('\n').join('\n\t')}\n`;
        comment = `\t// '${image.glyph}, ${image.canvas.width}x${image.canvas.height}px\n`;
        outputString += comment + code;
      });

      outputString = outputString.replace(/,\s*$/, '');

      outputString = `const ${getImageType()} ${
        getIdentifier()
      } [] PROGMEM = {`
            + `\n${outputString}\n};`;
      break;
    }

    case 'adafruit_gfx': { // bitmap
      let comment = '';
      let useGlyphs = 0;
      images.each((image) => {
        code = imageToString(image);
        code = `\t${code.split('\n').join('\n\t')}\n`;
        comment = `\t// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
        outputString += comment + code;
        if (image.glyph.length === 1) {
          useGlyphs++;
        }
      });

      outputString = outputString.replace(/,\s*$/, '');
      outputString = `const unsigned char ${
        getIdentifier()
      }Bitmap`
            + ' [] PROGMEM = {'
            + `\n${outputString}\n};\n\n`
            + `const GFXbitmapGlyph ${
              getIdentifier()
            }Glyphs [] PROGMEM = {\n`;

      let firstAschiiChar = document.getElementById('first-ascii-char').value;
      const xAdvance = parseInt(document.getElementById('x-advance').value);
      let offset = 0;
      code = '';

      // GFXbitmapGlyph
      images.each((image) => {
        code += `\t{ ${
          offset}, ${
          image.canvas.width}, ${
          image.canvas.height}, ${
          xAdvance}, `
              + `'${images.length() === useGlyphs
                ? image.glyph
                : String.fromCharCode(firstAschiiChar++)}'`
              + ' }';
        if (image !== images.last()) {
          code += ',';
        }
        code += `// '${image.glyph}'\n`;
        offset += image.canvas.width;
      });
      code += '};\n';
      outputString += code;

      // GFXbitmapFont
      outputString += `\nconst GFXbitmapFont ${
        getIdentifier()
      }Font PROGMEM = {\n`
            + `\t(uint8_t *)${
              getIdentifier()}Bitmap,\n`
            + `\t(GFXbitmapGlyph *)${
              getIdentifier()
            }Glyphs,\n`
            + `\t${images.length()
            }\n};\n`;
      break;
    }
    default: { // plain
      images.each((image) => {
        code = imageToString(image);
        let comment = '';
        if (image.glyph) {
          comment = (`// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`);
        }
        if (image.img !== images.first().img) {
          comment = `\n${comment}`;
        }
        code = comment + code;
        outputString += code;
      });
      // Trim whitespace from end and remove trailing comma
      outputString = outputString.replace(/,\s*$/g, '');
    }
  }

  document.getElementById('code-output').value = outputString;
  document.getElementById('copy-button').disabled = false;
}

// Copy the final output to the clipboard
// eslint-disable-next-line no-unused-vars
function copyOutput() {
  navigator.clipboard.writeText(document.getElementById('code-output').value);
}

// eslint-disable-next-line no-unused-vars
function downloadBinFile() {
  let raw = [];
  images.each((image) => {
    const data = imageToString(image)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((byte) => parseInt(byte, 16));
    raw = raw.concat(data);
  });
  const data = new Uint8Array(raw);
  const a = document.createElement('a');
  a.style = 'display: none';
  document.body.appendChild(a);
  const blob = new Blob([data], { type: 'octet/stream' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = `${getIdentifier()}.bin`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Update color mode (monochrome / rgb565) and force draw mode accordingly
// eslint-disable-next-line no-unused-vars
function updateColorMode(elm) {
  settings.colorMode = elm.value;
  const drawModeSelect = document.getElementById('drawMode');
  const ditheringRow = document.getElementById('dithering-row');
  if (settings.colorMode === 'rgb565') {
    // force drawMode to 565
    drawModeSelect.value = 'horizontal565';
    settings.conversionFunction = ConversionFunctions.horizontal565;
    if (ditheringRow) ditheringRow.style.display = 'none';
  } else {
    // back to default monochrome
    if (drawModeSelect.value === 'horizontal565') {
      drawModeSelect.value = 'horizontal1bit';
      settings.conversionFunction = ConversionFunctions.horizontal1bit;
    }
    if (ditheringRow) ditheringRow.style.display = '';
  }
  updateAllImages();
}

// Apply RGB565 quantization to a canvas for accurate color preview
function applyRgb565Preview(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // quantize to RGB565 and back to RGB888
    const r5 = (r >> 3) & 0x1F;
    const g6 = (g >> 2) & 0x3F;
    const b5 = (b >> 3) & 0x1F;
    data[i] = (r5 << 3) | (r5 >> 2);
    data[i + 1] = (g6 << 2) | (g6 >> 4);
    data[i + 2] = (b5 << 3) | (b5 >> 2);
  }
  ctx.putImageData(imageData, 0, 0);
}

// Download output as a .c source file
// eslint-disable-next-line no-unused-vars
function downloadCFile() {
  const content = document.getElementById('code-output').value;
  if (!content) { alert('Generate code first.'); return; }
  const name = `${getIdentifier()}.c`;
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.style = 'display: none';
  document.body.appendChild(a);
  a.href = window.URL.createObjectURL(blob);
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(a.href);
}

// Download output as a .h header file
// eslint-disable-next-line no-unused-vars
function downloadHFile() {
  const content = document.getElementById('code-output').value;
  if (!content) { alert('Generate code first.'); return; }
  const ident = getIdentifier().toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const guard = `${ident}H`;
  const header = `#ifndef ${guard}\n#define ${guard}\n\n#include <stdint.h>\n\n${content}\n\n#endif /* ${guard} */\n`;
  const blob = new Blob([header], { type: 'text/plain' });
  const a = document.createElement('a');
  a.style = 'display: none';
  document.body.appendChild(a);
  a.href = window.URL.createObjectURL(blob);
  a.download = `${getIdentifier()}.h`;
  a.click();
  window.URL.revokeObjectURL(a.href);
}

// eslint-disable-next-line no-unused-vars
function updateDrawMode(elm) {
  const conversionFunction = ConversionFunctions[elm.value];
  if (conversionFunction) {
    settings.conversionFunction = conversionFunction;
  }
  updateAllImages();
}

// Updates Arduino code check-box
// eslint-disable-next-line no-unused-vars
function updateOutputFormat(elm) {
  let caption = document.getElementById('format-caption-container');
  const adafruitGfx = document.getElementById('adafruit-gfx-settings');
  const arduino = document.getElementById('arduino-identifier');
  const removeZeroesCommasContainer = document.getElementById('remove-zeroes-commas-container');
  document.getElementById('code-output').value = '';

  for (let i = 0; i < caption.children.length; i++) {
    caption.children[i].style.display = 'none';
  }
  caption = document.querySelector(`div[data-caption='${elm.value}']`);
  if (caption) caption.style.display = 'block';

  if (elm.value !== 'plain') {
    arduino.style.display = 'block';
    removeZeroesCommasContainer.style.display = 'none';
    settings.removeZeroesCommas = false;
    document.getElementById('removeZeroesCommas').checked = false;
  } else {
    arduino.style.display = 'none';
    removeZeroesCommasContainer.style.display = 'table-row';
  }
  if (elm.value === 'adafruit_gfx') {
    adafruitGfx.style.display = 'block';
  } else {
    adafruitGfx.style.display = 'none';
  }

  settings.outputFormat = elm.value;
}

// Easy way to update settings controlled by a radiobutton
// eslint-disable-next-line no-unused-vars
function updateRadio(fieldName) {
  const radioGroup = document.getElementsByName(fieldName);
  for (let i = 0; i < radioGroup.length; i++) {
    if (radioGroup[i].checked) {
      settings[fieldName] = radioGroup[i].value;
    }
  }
  updateAllImages();
}

window.onload = () => {
  document.getElementById('copy-button').disabled = true;

  // Add events to the file input button
  const fileInput = document.getElementById('file-input');
  fileInput.addEventListener('click', () => { this.value = null; }, false);
  fileInput.addEventListener('change', handleImageSelection, false);
  document.getElementById('outputFormat').value = 'arduino';
  document.getElementById('outputFormat').onchange();
};
