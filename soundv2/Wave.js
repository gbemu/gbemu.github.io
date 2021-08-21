class Wave extends Channel {
  constructor(ctx) {
    super(ctx);
    this.waveRam = new Array(16);
    this.waveTable = new Array(32);
    this.waveRamPosition = 0;
    this.channelName = "wave";
  }
  
  get NR30() { return this._NR30 }
  get NR31() { return this._NR31 }
  get NR32() { return this._NR32 }
  get NR33() { return this._NR33 }
  get NR34() { return this._NR34 }

  set NR30(value) {
    this._NR30 = value;
    this.dacEnabled = isSet(value, 7);
  }

  set NR31(value) {
    this._NR31 = value;
  }

  set NR32(value) {
    this._NR32 = value;
    this.outputLevel = (value >> 5) & 0x03;
    if (this.outputLevel === 0) {
      this.outputShift = 4;
    } else if (this.outputLevel === 2) {
      this.outputShift = 1;
    } else if (this.outputLevel === 3) {
      this.outputShift = 2;
    } else {
      this.outputShift = 0;
    }
  }

  set NR33(value) {
    this._NR33 = value;
    this.frequency = (this.frequency & ~0xFF) + value;
  }

  set NR34(value) {
    this._NR34 = value;
    this.lengthEnabled = isSet(value, 6);
    this.frequency = (value & 7) * 0x100 + (this.frequency & 0xFF);

    if (isSet(value, 7) && this.dacEnabled) {
      this.trigger();
    }
  }

  setWaveRam(address, byte) {
    this.waveRam[address] = byte;
    let upperNibble = byte >> 4;
    let lowerNibble = byte & 0x0F;
    this.waveTable[(address * 2)] = upperNibble;
    this.waveTable[(address * 2) + 1] = lowerNibble;
  }

  clockLength() {
    if (this.lengthEnabled && this.soundLength) {
      this.soundLength--;
      if (this.soundLength === 0) {
        this.enabled = false;
      }
    }
  }

  readSample() {
    if (!this.enabled || !this.dacEnabled) {
      this.buffer.push(0);
    } else {
      this.buffer.push((this.currentSample || 0) / 15);
    }
    if (this.buffer.length > BUF_SIZE) {
      this.createBuffer();
      this.buffer = [];
    }
  }

  updateCycles(cycles) {
    this.timer -= cycles;
    if (this.timer <= 0) {
      this.advancePosition();
      this.timer += (2048 - this.frequency) * 2;
    }
  }

  advancePosition() {
    this.waveRamPosition++;
    if (this.waveRamPosition === 32) {
      this.waveRamPosition = 0;
    }
    this.currentSample = (this.waveTable[this.waveRamPosition] >> this.outputShift) || 0;
  }

  trigger() {
    this.enabled = true;
    this.timer = (2048 - this.frequency) * 2;
    this.soundLength = 256 - this._NR31;
    if (!this.soundLength) {
      if (this.frame % 2 === 1 && this.lengthEnabled) {
        this.soundLength = 255;
      } else {
        this.soundLength = 256;
      }
    }
    this.waveRamPosition = 0;
  }

  stop() {
    this.enabled = false;
  }

  clear() {
    this.NR30 = 0;
    this.NR31 = 0;
    this.NR32 = 0;
    this.NR33 = 0;
    this.NR34 = 0;
    this.currentSample = 0;
  }
}