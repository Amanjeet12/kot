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
