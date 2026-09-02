import { Buffer } from 'buffer';

const ESC = 0x1b;
const GS = 0x1d;

class EscPosProtocol {
  command(values) {
    return Buffer.from(values);
  }

  text(value = '') {
    return Buffer.from(String(value), 'utf8');
  }

  initialize() {
    return this.command([ESC, 0x40]);
  }

  alignLeft() {
    return this.command([ESC, 0x61, 0x00]);
  }

  alignCenter() {
    return this.command([ESC, 0x61, 0x01]);
  }

  alignRight() {
    return this.command([ESC, 0x61, 0x02]);
  }

  bold(enabled = true) {
    return this.command([ESC, 0x45, enabled ? 0x01 : 0x00]);
  }

  normalSize() {
    return this.command([GS, 0x21, 0x00]);
  }

  doubleSize() {
    return this.command([GS, 0x21, 0x11]);
  }

  textSize(widthMultiplier = 1, heightMultiplier = 1) {
    const width = Math.max(1, Math.min(Math.floor(widthMultiplier) || 1, 8));
    const height = Math.max(1, Math.min(Math.floor(heightMultiplier) || 1, 8));

    return this.command([GS, 0x21, (width - 1) * 16 + (height - 1)]);
  }

  rasterImage(data, width, height) {
    const pixelWidth = Math.max(0, Math.floor(Number(width) || 0));
    const pixelHeight = Math.max(0, Math.floor(Number(height) || 0));
    const bytesPerRow = Math.ceil(pixelWidth / 8);
    const rasterData = Buffer.isBuffer(data) ? data : Buffer.from(data || []);

    if (!pixelWidth || !pixelHeight) {
      throw new Error('Raster image width and height must be positive');
    }

    if (rasterData.length !== bytesPerRow * pixelHeight) {
      throw new Error('Raster image data length does not match its dimensions');
    }

    return Buffer.concat([
      this.command([
        GS,
        0x76,
        0x30,
        0x00,
        bytesPerRow % 256,
        Math.floor(bytesPerRow / 256) % 256,
        pixelHeight % 256,
        Math.floor(pixelHeight / 256) % 256,
      ]),
      rasterData,
    ]);
  }

  feed(lines = 3) {
    const safeLines = Math.max(0, Math.min(Number(lines) || 0, 255));

    return this.command([ESC, 0x64, safeLines]);
  }

  fullCut() {
    return this.command([GS, 0x56, 0x00]);
  }

  partialCut() {
    return this.command([GS, 0x56, 0x01]);
  }
}

export default new EscPosProtocol();
