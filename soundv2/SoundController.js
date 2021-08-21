var BUF_SIZE = 4000;
var SAMPLE_RATE = Math.round(4194304 / 48000);
var SOURCE_SAMPLE_RATE = 1;

class SoundController {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.initChannels();
    this.frame = 0;
    this.cycles = 0;
    this.frameCount = 0;
    this.sampleTimer = SAMPLE_RATE;
  }

  set NR50(value) {
    this._NR50 = value;
    this.SO2 = (value >> 4) & 7;
    this.SO1 = (value & 7);
    for (let channel of this.channels) {
      channel.leftGain.gain.value = this.SO2 / 14;
      channel.rightGain.gain.value  = this.SO1 / 14;
    }
  }

  set NR51(value) {
    this._NR51 = value;
    if (isSet(value, 7) && isSet(value, 3)) {
      this.channel4.panner.pan.value = 0;
    } else if (isSet(value, 7) && !isSet(value, 3)) {
      this.channel4.panner.pan.value = -1;
    } else if (!isSet(value, 7) && isSet(value, 3)) {
      this.channel4.panner.pan.value = 1;
    } else if (!isSet(value, 7) && !isSet(value, 3)) {
      this.channel4.enabled = false;
    }

    if (isSet(value, 6) && isSet(value, 2)) {
      this.channel3.panner.pan.value = 0;
    } else if (isSet(value, 6) && !isSet(value, 2)) {
      this.channel3.panner.pan.value = -1;
    } else if (!isSet(value, 6) && isSet(value, 2)) {
      this.channel3.panner.pan.value = 1;
    } else if (!isSet(value, 6) && !isSet(value, 2)) {
      this.channel3.enabled = false;
    }

    if (isSet(value, 5) && isSet(value, 1)) {
      this.channel2.panner.pan.value = 0;
    } else if (isSet(value, 5) && !isSet(value, 1)) {
      this.channel2.panner.pan.value = -1;
    } else if (!isSet(value, 5) && isSet(value, 1)) {
      this.channel2.panner.pan.value = 1;
    } else if (!isSet(value, 5) && !isSet(value, 1)) {
      this.channel2.enabled = false;
    }

    if (isSet(value, 4) && isSet(value, 0)) {
      this.channel1.panner.pan.value = 0;
    } else if (isSet(value, 4) && !isSet(value, 0)) {
      this.channel1.panner.pan.value = -1;
    } else if (!isSet(value, 4) && isSet(value, 0)) {
      this.channel1.panner.pan.value = 1;
    } else if (!isSet(value, 4) && !isSet(value, 0)) {
      this.channel1.enabled = false;
    }
  }

  get NR50() {
    return this._NR50;
  }

  get NR51() {
    return this._NR51;
  }

  initChannels() {
    this.channels = [];
    this.channel1 = new Square1(this.ctx);
    this.channel2 = new Square2(this.ctx);
    this.channel3 = new Wave(this.ctx);
    this.channel4 = new Noise(this.ctx);
    this.channels.push(this.channel1);
    this.channels.push(this.channel2);
    this.channels.push(this.channel3);
    this.channels.push(this.channel4);
    // this.channel1.start();
  }

  restart() {
    this.frame = 0;
    this.cycles = 0;
    this.sampleTimer = SAMPLE_RATE;
    this.clearRegs();
    this.stop();
    // this.initChannels();
  }

  // 4194304
  updateCycles(cycles) {
    this.cycles += cycles;
    if (this.cycles >= 8192) {
      this.clockFrame();
      this.cycles -= 8192;
    }
    this.channel1.updateCycles(cycles);
    this.channel2.updateCycles(cycles);
    this.channel3.updateCycles(cycles);
    this.channel4.updateCycles(cycles);
    this.sampleTimer -= cycles;
    if (this.sampleTimer <= 0) {
      this.sampleTimer += SAMPLE_RATE;
      this.readSamples();
    }
  }

  readSamples() {
    this.channel1.readSample();
    this.channel2.readSample();
    this.channel3.readSample();
    this.channel4.readSample();
  }

  play() {
    this.channel1.play();
    this.channel2.play();
    this.channel3.play();
    this.channel4.play();
    this.started = true;
  }

  endFrame() {
    if (!this.startFrameTime) {
      this.startFrameTime = performance.now();
    }
    this.frameCount++;
    if (this.frameCount == 60) {
      this.frameCount = 0;
      this.startFrameTime = null;
    }
    this.play();
  }

  clockFrame() {
    this.frame++;
    if (this.frame % 2 === 1) {
      this.channel1.clockLength();
      this.channel2.clockLength();
      this.channel3.clockLength();
      this.channel4.clockLength();
    }
    if (this.frame === 3 || this.frame === 7) {
      this.channel1.clockSweep();
    }
    if (this.frame === 8) {
      this.channel1.clockEnvelope();
      this.channel2.clockEnvelope();
      this.channel4.clockEnvelope();
      this.frame = 0;
    }
    this.channel1.frame = this.frame;
    this.channel2.frame = this.frame;
    this.channel3.frame = this.frame;
    this.channel4.frame = this.frame;
  }

  write(address, byte) {
    if (address >= 0xff30 && address <= 0xff3f) {
      this.channel3.setWaveRam(address - 0xff30, byte);
      return;
    }

    if (address == 0xff26 && !byte) {
      this.powerOff();
      return;
    } else if (address == 0xff26 && isSet(byte, 7)) {
      this.powerOn();
      return;
    } else if (!this.enabled()) {
      return;
    }

    if (address >= 0xff24 && address <= 0xff26) {
      if (address == 0xff24) this.NR50 = byte;
      if (address == 0xff25) this.NR51 = byte;
    } else if (address >= 0xff10 && address <= 0xff14) {
      if (address == 0xff10) this.channel1.NR10 = byte;
      if (address == 0xff11) this.channel1.NR11 = byte;
      if (address == 0xff12) this.channel1.NR12 = byte;
      if (address == 0xff13) this.channel1.NR13 = byte;
      if (address == 0xff14) this.channel1.NR14 = byte;
    } else if (address >= 0xff16 && address <= 0xff19) {
      if (address == 0xff16) this.channel2.NR21 = byte;
      if (address == 0xff17) this.channel2.NR22 = byte;
      if (address == 0xff18) this.channel2.NR23 = byte;
      if (address == 0xff19) this.channel2.NR24 = byte;
    } else if ((address >= 0xff1a && address <= 0xff1e)) {
      if (address == 0xff1a) this.channel3.NR30 = byte;
      if (address == 0xff1b) this.channel3.NR31 = byte;
      if (address == 0xff1c) this.channel3.NR32 = byte;
      if (address == 0xff1d) this.channel3.NR33 = byte;
      if (address == 0xff1e) this.channel3.NR34 = byte;
    } else if (address >= 0xff20 && address <= 0xff23) {
      if (address == 0xff20) this.channel4.NR41 = byte;
      if (address == 0xff21) this.channel4.NR42 = byte;
      if (address == 0xff22) this.channel4.NR43 = byte;
      if (address == 0xff23) this.channel4.NR44 = byte;
    }
  }

  powerOn() {
    this.NR52 = 0xF0;
    this.frame = 0;
    this.cycles = 0;
  }

  powerOff() {
    this.clearRegs();
    this.channel1.stop();
    this.channel2.stop();
    this.channel3.stop();
    this.channel4.stop();
  }

  enabled() { 
    return isSet(this.NR52, 7);
  }

  stop() {
    for (let channel of this.channels) {
      for (let playing of channel.currentlyPlaying) {
        playing.stop();
      }
      channel.currentlyPlaying = [];
    }
  }

  clearRegs() {
    this.NR50 = 0;
    this.NR51 = 0;
    this.NR52 = 0x70;
    this.channel1.clear();
    this.channel2.clear();
    this.channel3.clear();
    this.channel4.clear();
  }
}