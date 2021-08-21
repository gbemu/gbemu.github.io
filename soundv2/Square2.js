class Square2 extends Square {

  constructor(ctx) {
    super(ctx);
    this.channelName = "channel2";
  }

  get NR21() { return this._NR21; };
  get NR22() { return this._NR22; };
  get NR23() { return this._NR23; };
  get NR24() { return this._NR24; };

  set NR21(value) {
    this._NR21 = value;
    this.waveDuty = value >> 6;
    this.soundDuration = (64 - (value & 0x3F)) * (1 / 256); //seconds
    this.soundLength = value & 0x3F;
  }

  set NR22(value) {
    this._NR22 = value;
    this.envelopeVolume = value >> 4;
    this.increaseVolume = isSet(value, 3);
    this.envelopeDuration = (value & 0x07) * (1 / 64); //seconds
    this.envelopePeriod = (value & 0x07);
    if ((value >> 3) == 0) {
      this.dacEnabled = false;
    } else {
      this.dacEnabled = true;
    }
  }

  set NR23(value) {
    this._NR23 = value;
    this.frequency = ((this.frequency || 0) & ~0xFF) + value;
  }

  set NR24(value) {
    this._NR24 = value;
    this.lengthEnabled = isSet(value, 6);
    this.frequency = (value & 7) * 0x100 + ((this.frequency || 0) & 0xFF);

    if (isSet(value, 7) && this.dacEnabled) {
      this.trigger();
    }
  }

  clear() {
    this.NR21 = 0;
    this.NR22 = 0;
    this.NR23 = 0;
    this.NR24 = 0;
  }
}