class Noise extends Channel {
  constructor(ctx) {
    super(ctx);
    this.cycles = 0;
    this.channelName = "noise";
  }

  get NR41() { return this._NR41 }
  get NR42() { return this._NR42 }
  get NR43() { return this._NR43 }
  get NR44() { return this._NR44 }

  set NR41(value) { 
    this._NR41 = value;
    this.soundLength = value & 0x3F;
  }

  set NR42(value) { 
    this._NR42 = value;
    this.envelopeVolume = value >> 4;
    this.increaseVolume = isSet(value, 3);
    this.envelopePeriod = value & 0x07;
    if ((value >> 3) == 0) {
      this.dacEnabled = false;
    } else {
      this.dacEnabled = true;
    }
  }

  set NR43(value) { 
    //0000 0000
    this._NR43 = value;
    this.widthMode = isSet(value, 3);
    let divisor = (value & 7) * 16;
		if ( !divisor )
			divisor = 8;
		this.period = divisor << (value >> 4);
  }

  set NR44(value) { 
    this._NR44 = value;
    this.lengthEnabled = isSet(value, 6);
    if (isSet(value, 7) && this.dacEnabled) {
      this.trigger();
    }
  }

  trigger() {
    this.enabled = true;
    this.LSFR = 0x7fff;
    this.periodTimer = this.period;
    this.soundLengthTimer = 64 - this.soundLength;
    if (!this.soundLengthTimer) {
      if (this.frame % 2 === 1 && this.lengthEnabled) {
        this.soundLengthTimer = 63;
      } else {
        this.soundLengthTimer = 64;
      }
    }
    this.envelopeTimer = this.envelopePeriod || 8;
    if (this.frame === 7) {
      this.envelopeTimer++;
    }
    this.volume = this.envelopeVolume;
  }

  updateCycles(cycles) {
    this.periodTimer -= cycles;
    if (this.periodTimer <= 0) {
      this.clock();
      this.periodTimer += this.period;
    }
  }

  clock() {
    let xor = (this.LSFR & 0x1) ^ ((this.LSFR >> 1) & 0x1);
    this.LSFR >>= 1;
    this.LSFR = this.LSFR | (xor << 14);
    if (this.widthMode) {
      this.LSFR = this.LSFR | (xor << 6);
    }
    this.sample = getBit(this.LSFR, 0) ? 0 : 1;
  }

  readSample() {
    if (!this.dacEnabled || !this.enabled || typeof this.sample === "undefined") {
      this.buffer.push(0);
    } else {
      let amp = this.sample * (this.volume / 15);
      this.buffer.push(amp);
    }
    if (this.buffer.length > BUF_SIZE) {
      this.createBuffer();
      this.buffer = [];
    }
  }

  clockLength() {
    if (this.lengthEnabled && this.soundLengthTimer) {
      this.soundLengthTimer--;
      if (this.soundLengthTimer === 0) {
        this.enabled = false;
      }
    }
  }

  clockEnvelope() {
    if (this.envelopePeriod && this.envelopeTimer > 0) {
      this.envelopeTimer--;
      if (this.envelopeTimer === 0) {
        this.envelopeTimer = this.envelopePeriod;
        if (this.increaseVolume && this.volume < 15) {
          this.volume++;
        } else if (this.volume > 0) {
          this.volume--;
        }
      }
    }
  }

  clear() {
    this.NR41 = 0;
    this.NR42 = 0;
    this.NR43 = 0;
    this.NR44 = 0;
  }

  stop() {
    this.enabled = false;
    this.volume = 0;
  }
}