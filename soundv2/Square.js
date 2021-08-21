class Square extends Channel {
  constructor(ctx) {
    super(ctx);
    this.dutyTable = {
      0: [0,0,0,0,0,0,0,1],
      1: [1,0,0,0,0,0,0,1],
      2: [1,0,0,0,0,1,1,1],
      3: [0,1,1,1,1,1,1,0],
    }
    this.currentDuty = 0;
    this.volume = 0;
    this.enabled = false;
  }

  updateCycles(cycles) {
    this.dutyTimer -= cycles;
    if (this.dutyTimer <= 0) {
      this.advanceDuty();
      this.dutyTimer += (2048 - this.frequency) * 4;
    }
  }

  readSample() {
    if (!this.dacEnabled || !this.enabled) {
      this.buffer.push(0);
    } else {
      let amp = this.dutyTable[this.waveDuty || 0][this.currentDuty || 0];
      amp = amp * (this.volume / 15);
      this.buffer.push(amp);
    }
    if (this.buffer.length > BUF_SIZE) {
      this.createBuffer();
      this.buffer = [];
    }
  }

  advanceDuty() {
    if (!this.dutyEnabled) {
      return;
    }
    this.currentDuty++;
    if (this.currentDuty === 8) {
      this.currentDuty = 0;
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

  //4194304
  trigger() {
    this.enabled = true;
    this.dutyEnabled = true; // disable duty advance until first trigger
    this.dutyTimer = (2048 - this.frequency) * 4;
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

  stop() {
    this.enabled = false;
    this.volume = 0;
  }
}