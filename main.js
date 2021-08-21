

let db = new Dexie("games");
db.version(1).stores({
  game: 'name'
});
db.open();

var restart = async function() {
  try {
    console.log("restart")
    audio.restart();
    frames = [];
    Module._restartPress();
    await this.loadSave();
  } catch (e) {
    console.error(e);
  }
}

var loadSave = async function() {
  let title = "";
  for (let i = 0x134; i <= 0x143; ++i) {
    title += String.fromCharCode(memory[i]);
  }
  window.game = await db.game.get(title);
  if (!window.game) {
    await db.game.put({ name: title, ram: new Uint8Array(131072) });
    window.game = await db.game.get(title);
  }
  console.log(title, game);
  for (let i = 0; i < 131072; ++i) {
    cartRam[i] = game.ram[i];
  }
}

var loadCart = async function(arr) {
  let buffer = new Uint8Array(arr);
  let j = 0;
  for (let i = 0; i < 0x10000; ++i, ++j) {
    memory[j] = buffer[i];
  }
  j = 0;
  for (let i = 0; i < arr.byteLength; ++i, ++j) {
    cartRom[j] = buffer[i];
  }
  console.log(arr);
  await loadSave();
  audio = new SoundController();
  Module._startCpu();
  fn();
}

var Module = {
  preRun: [],
  postRun: [],
  print(text) {
    console.log(text);
  },
  printErr: function(text) {
    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
    console.error(text);
  },
  canvas: document.createElement("canvas")
};

let setBit = function(byte, n) {
  byte |= 1 << n;
  return byte;
}

let clearBit = function(byte, n) {
  byte &= ~(1 << n);
  return byte;
}

let getBit = function(byte, n) {
  return 0x01 & (byte >> n)
}

let isSet = function(byte, n) {
  return getBit(byte, n) === 1;
}

let getImageData = function() {
  Module._getNextFrame();
  let buffer = new Uint8ClampedArray(Module.HEAPU8.buffer, Module._getScreenSurfacePtr(), 69120);
  let bufIdx = 0;
  let pixelBuffer = new ArrayBuffer(92160);
  let view = new Uint8ClampedArray(pixelBuffer);
  for (let i = 0; i < view.length; i += 4) {
    view[i] = buffer[bufIdx];
    view[i + 1] = buffer[bufIdx + 1];
    view[i + 2] = buffer[bufIdx + 2];
    view[i + 3] = 255;
    bufIdx += 3;
  }
  return new ImageData(view, 160);
}

let ram_changed = function(address, byte) {
  if (window.game) {
    window.game.ram[address] = byte;
  }
}

let write_memory = function(address, byte) {
  if (address >= 0xff10 && address <= 0xff3f) {
    audio.write(address, byte);
  }
}

let update_sound = function(cycles) {
  audio.updateCycles(cycles);
}

let frames = [];
let saving = false;

let draw = function() {
  if (!frames.length) {
    window.nextFrame = requestAnimationFrame(draw);
    return;
  }
  smallCtx.putImageData(frames.shift(), 0, 0);
  mainCtx.imageSmoothingEnabled = false;
  mainCtx.drawImage(smallCanvas, 0, 0, 160, 144, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // audio.endFrame();
  if (!saving) {
    saving = true;
    db.game.put(window.game).then(() => {
      saving = false;
    });
  }
  window.nextFrame = requestAnimationFrame(draw);
}

let memory;

let fn = function() {
  running = true;
  setInterval(() => {
    if (!audio.channel1.sources.length && !audio.channel1.currentlyPlaying.length) {
      frames.push(getImageData());
    } else if (frames.length == 0 && audio.channel1.currentlyPlaying.length <= 2) {
      let imageData = getImageData();
      frames.push(imageData);
    }
    audio.play();
  }, 1)
  window.nextFrame = requestAnimationFrame(draw);
}

Module.onRuntimeInitialized = function() {
  memory = new Uint8Array(Module.HEAPU8.buffer, Module._getMemoryPtr(), 0x10000);
  cartRom = new Uint8Array(Module.HEAPU8.buffer, Module._getCartPtr(), 4194304);
  cartRam = new Uint8Array(Module.HEAPU8.buffer, Module._getRamPtr(), 131072);
  vm.loaded = true;
};

var isTouchEventWithElement = function(e, element) {
  const item = e.changedTouches.item(0);
  if (element === null || item === null) return false;
  let withElement;
  for (let item of e.changedTouches) {
    withElement = element.getBoundingClientRect().right > item.clientX &&
    element.getBoundingClientRect().left < item.clientX &&
    element.getBoundingClientRect().top < item.clientY &&
    element.getBoundingClientRect().bottom > item.clientY;
    if (withElement) {
      return item;
    }
  }
}

var initialiseCanvas = function() {
  window.CANVAS_WIDTH = 160;
  window.CANVAS_HEIGHT = 144;
  
  mainCanvas = document.getElementsByClassName("canvas")[0];
  mainCanvas.width = CANVAS_WIDTH;
  mainCanvas.height = CANVAS_HEIGHT;
  smallCanvas = document.createElement("canvas");
  smallCanvas.width = 160;
  smallCanvas.height = 144;
  mainCtx = mainCanvas.getContext("2d");
  smallCtx = smallCanvas.getContext("2d");
}

var initialiseTouch = function() {
  let upButton = document.getElementById("button-up");
  let downButton = document.getElementById("button-down");
  let rightButton = document.getElementById("button-right");
  let leftButton = document.getElementById("button-left");
  let startButton = document.getElementById("button-start");
  let selectButton = document.getElementById("button-select");
  let aButton = document.getElementById("button-a");
  let bButton = document.getElementById("button-b");
  
  upButton.press = () => pressButton("up");
  upButton.release = () => releaseButton("up");
  rightButton.press = () => pressButton("right");
  rightButton.release = () => releaseButton("right");
  downButton.press = () => pressButton("down");
  downButton.release = () => releaseButton("down");
  leftButton.press = () => pressButton("left");
  leftButton.release = () => releaseButton("left");
  aButton.press = () => pressButton("a");
  aButton.release = () => releaseButton("a");
  bButton.press = () => pressButton("b");
  bButton.release = () => releaseButton("b");
  startButton.press = () => pressButton("start");
  startButton.release = () => releaseButton("start");
  selectButton.press = () => pressButton("select");
  selectButton.release = () => releaseButton("select");
  
  let pressedButtons = {}

  let pressButton = (button => {
    if (button == "up") {
      Module._keyPress(2);
      upButton.classList.add("pressed");
      pressedButtons.up = true;
    } else if (button == "right") {
      Module._keyPress(0);
      rightButton.classList.add("pressed");
      pressedButtons.right = true;
    } else if (button == "down") {
      Module._keyPress(3);
      downButton.classList.add("pressed");
      pressedButtons.down = true;
    } else if (button == "left") {
      Module._keyPress(1);
      leftButton.classList.add("pressed");
      pressedButtons.left = true;
    } else if (button == "a") {
      Module._keyPress(5);
      aButton.classList.add("pressed");
      pressedButtons.a = true;
    } else if (button == "b") {
      Module._keyPress(4);
      bButton.classList.add("pressed");
      pressedButtons.b = true;
    } else if (button == "start") {
      Module._keyPress(7);
      startButton.classList.add("pressed");
      pressedButtons.start = true;
    } else if (button == "select") {
      Module._keyPress(6);
      selectButton.classList.add("pressed");
      pressedButtons.select = true;
    }
  })
  
  let releaseButton = (button => {
    if (button == "up") {
      Module._keyRelease(2);
      upButton.classList.remove("pressed");
      pressedButtons.up = false;
    } else if (button == "right") {
      Module._keyRelease(0);
      rightButton.classList.remove("pressed");
      pressedButtons.right = false;
    } else if (button == "down") {
      Module._keyRelease(3);
      downButton.classList.remove("pressed");
      pressedButtons.down = false;
    } else if (button == "left") {
      Module._keyRelease(1);
      leftButton.classList.remove("pressed");
      pressedButtons.left = false;
    } else if (button == "a") {
      Module._keyRelease(5);
      aButton.classList.remove("pressed");
      pressedButtons.a = false;
    } else if (button == "b") {
      Module._keyRelease(4);
      bButton.classList.remove("pressed");
      pressedButtons.b = false;
    } else if (button == "start") {
      Module._keyRelease(7);
      startButton.classList.remove("pressed");
      pressedButtons.start = false;
    } else if (button == "select") {
      Module._keyRelease(6);
      selectButton.classList.remove("pressed");
      pressedButtons.select = false;
    }
  })

  document.getElementById("actions").addEventListener("touchmove", (e) => {
    let upButtonTouchItem = isTouchEventWithElement(e, upButton);
    let rightButtonTouchItem = isTouchEventWithElement(e, rightButton);
    let downButtonTouchItem = isTouchEventWithElement(e, downButton);
    let leftButtonTouchItem = isTouchEventWithElement(e, leftButton);
    let aButtonTouchItem = isTouchEventWithElement(e, aButton);
    let bButtonTouchItem = isTouchEventWithElement(e, bButton);
    let startButtonTouchItem = isTouchEventWithElement(e, startButton);
    let selectButtonTouchItem = isTouchEventWithElement(e, selectButton);

    if (upButtonTouchItem) {
      upButton.touchId = upButtonTouchItem.identifier;
      upButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === upButton.touchId) {
      upButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === upButton.touchId) {
      upButton.release();
    }

    if (rightButtonTouchItem) {
      rightButton.press();
      rightButton.touchId = rightButtonTouchItem.identifier;
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === rightButton.touchId) {
      rightButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === rightButton.touchId) {
      rightButton.release();
    }

    if (downButtonTouchItem) {
      downButton.touchId = downButtonTouchItem.identifier;
      downButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === downButton.touchId) {
      downButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === downButton.touchId) {
      downButton.release();
    }

    if (leftButtonTouchItem) {
      leftButton.touchId = leftButtonTouchItem.identifier;
      leftButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === leftButton.touchId) {
      leftButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === leftButton.touchId) {
      leftButton.release();
    }

    if (aButtonTouchItem) {
      aButton.touchId = aButtonTouchItem.identifier;
      aButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === aButton.touchId) {
      aButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === aButton.touchId) {
      aButton.release();
    }

    if (bButtonTouchItem) {
      bButton.touchId = bButtonTouchItem.identifier;
      bButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === bButton.touchId) {
      bButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === bButton.touchId) {
      bButton.release();
    }

    if (startButtonTouchItem) {
      startButton.touchId = startButtonTouchItem.identifier;
      startButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === startButton.touchId) {
      startButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === startButton.touchId) {
      startButton.release();
    }

    if (selectButtonTouchItem) {
      selectButton.touchId = selectButtonTouchItem.identifier;
      selectButton.press();
    } else if (e.changedTouches[0] && e.changedTouches[0].identifier === selectButton.touchId) {
      selectButton.release();
    } else if (e.changedTouches[1] && e.changedTouches[1].identifier === selectButton.touchId) {
      selectButton.release();
    }
  })

  document.getElementById("actions").addEventListener("touchend", (e) => {
    var myLocation = e.changedTouches[0];
    var realTarget = document.elementFromPoint(myLocation.clientX, myLocation.clientY);
    if (realTarget && realTarget.release) {
      realTarget.release();
    }
  })

  upButton.addEventListener("touchstart", () => {
    upButton.press();
  })
  upButton.addEventListener("touchend", () => {
    upButton.release();
  })

  rightButton.addEventListener("touchstart", () => {
    rightButton.press();
  })
  rightButton.addEventListener("touchend", () => {
    rightButton.release();
  })

  downButton.addEventListener("touchstart", () => {
    downButton.press();
  })
  downButton.addEventListener("touchend", () => {
    downButton.release();
  })

  leftButton.addEventListener("touchstart", () => {
    leftButton.press();
  })
  leftButton.addEventListener("touchend", () => {
    leftButton.release();
  })

  startButton.addEventListener("touchstart", () => {
    startButton.press();
  })
  startButton.addEventListener("touchend", () => {
    startButton.release();
  })

  selectButton.addEventListener("touchstart", () => {
    selectButton.press();
  })
  selectButton.addEventListener("touchend", () => {
    selectButton.release();
  })

  aButton.addEventListener("touchstart", () => {
    aButton.press();
  })
  aButton.addEventListener("touchend", () => {
    aButton.release();
  })

  bButton.addEventListener("touchstart", () => {
    bButton.press();
  })
  bButton.addEventListener("touchend", () => {
    bButton.release();
  })

  document.addEventListener("keydown", function(e) {
    if (e.keyCode === 13) { //START
      Module._keyPress(7);
    }
    if (e.keyCode === 38) { //UP
      Module._keyPress(2);
    }
    if (e.keyCode === 39) { //RIGHT
      Module._keyPress(0);
    }
    if (e.keyCode === 40) { //DOWN
      Module._keyPress(3);
    }
    if (e.keyCode === 37) { //LEFT
      Module._keyPress(1);
    }
    if (e.keyCode === 90) { //Z
      Module._keyPress(5);
    }
    if (e.keyCode === 88) { //X
      Module._keyPress(4);
    }
    if (e.keyCode === 16) { //RSHIFT
      Module._keyPress(6);
    }
    if (e.keyCode === 82) { //R
      window.restart();
    }
  })

  document.addEventListener("keyup", function(e) {
    if (e.keyCode === 13) {
      Module._keyRelease(7);
    }
    if (e.keyCode === 38) {
      Module._keyRelease(2);
    }
    if (e.keyCode === 39) {
      Module._keyRelease(0);
    }
    if (e.keyCode === 40) {
      Module._keyRelease(3);
    }
    if (e.keyCode === 37) {
      Module._keyRelease(1);
    }
    if (e.keyCode === 90) {
      Module._keyRelease(5);
    }
    if (e.keyCode === 88) {
      Module._keyRelease(4);
    }
    if (e.keyCode === 16) {
      Module._keyRelease(6);
    }
  })
}
