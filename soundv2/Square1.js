
class Square1 extends Square {
  constructor(ctx) {
    super(ctx);
    this.channelName = "channel1";
  }

  get NR10() { return this._NR10; };
  get NR11() { return this._NR11; };
  get NR12() { return this._NR12; };
  get NR13() { return this._NR13; };
  get NR14() { return this._NR14; };

  set NR10(value) {
    this._NR10 = value;
    this.sweepPeriod = (value >> 4) & 0x07;
    this.sweepIncrease = isSet(value, 3);
    this.sweepShift = value & 0x7;
  }

  set NR11(value) {
    this._NR11 = value;
    this.waveDuty = value >> 6;
    this.soundLength = (value & 0x3F);
  }

  set NR12(value) {
    this._NR12 = value;
    this.envelopeVolume = value >> 4;
    this.increaseVolume = isSet(value, 3);
    this.envelopePeriod = (value & 0x07);
    if ((value >> 3) == 0) {
      this.dacEnabled = false;
    } else {
      this.dacEnabled = true;
    }
  }

  set NR13(value) {
    this._NR13 = value;
    this.frequency = ((this.frequency || 0) & ~0xFF) + value;
    this.soundLengthTimer = 64 - this.soundLength;
  }

  set NR14(value) {
    this._NR14 = value;
    this.lengthEnabled = isSet(value, 6);
    this.frequency = (value & 7) * 0x100 + ((this.frequency || 0) & 0xFF);
    
    if (isSet(value, 7) && this.dacEnabled) {
      this.trigger();
      this.sweepFreq = this.frequency;
      if (this.sweepPeriod && this.sweepShift) {
        this.sweepDelay = 1;
        this.clockSweep();
      }
    }
  }

  clockSweep() {
    if (this.sweepPeriod && this.sweepDelay && !--this.sweepDelay ) {
      this.sweepDelay = this.sweepPeriod;
      this.frequency = this.sweepFreq;
      
      this.dutyTimer = (2048 - this.frequency) * 4;
      
      let offset = this.sweepFreq >> this.sweepShift;
      if (this.sweepIncrease) {
        offset = -offset;
      }
      this.sweepFreq += offset;
      
      if (this.sweepFreq < 0) {
        this.sweepFreq = 0;
      } else if (this.sweepFreq >= 2048 ) {
        this.sweepDelay = 0;
        this.enabled = false;
        this.sweepFreq = 2048; // stop sound output
      }
    }
  }

  clear() {
    this.NR10 = 0;
    this.NR11 = 0;
    this.NR12 = 0;
    this.NR13 = 0;
    this.NR14 = 0;
  }
}