var games = [
  { value: 47, text: "Tetris DX" },
  { value: 48, text: "Donkey Kong Country Color"},
  { value: 49, text: "Crazy Castle 3"},
  { value: 43, text: "Tetris" },
  { value: 44, text: "Donkey Kong Land" },
  { value: 1, text: "Donkey Kong Land 2" },
  { value: 2, text: "Donkey Kong Land 3" },
  { value: 45, text: "Mortal Kombat II" },
  { value: 3, text: "Super Mario Land" },
  { value: 4, text: "Super Mario Land 2" },
  { value: 5, text: "Wario Land: Super Mario Land 3" },
  { value: 6, text: "Kid Icarus - Of Myths and Monsters" },
  { value: 7, text: "Kirby's Dream Land" },
  { value: 8, text: "Qix" },
  { value: 9, text: "Dr. Mario" },
  { value: 10, text: "The Legend Of Zelda: Link's Awakening" },
  { value: 11, text: "Legend of the River King" },
  { value: 12, text: "Solar Striker" },
  { value: 13, text: "Teenage Mutant Ninja Turtles: Fall of the Foot Clan" },
  { value: 14, text: "Teenage Mutant Ninja Turtles II: Back From the Sewers" },
  { value: 15, text: "Teenage Mutant Ninja Turtles III: Radical Rescue" },
  { value: 16, text: "Contra - The Alien Wars" },
  { value: 17, text: "Catrap" },
  { value: 18, text: "Megaman" },
  { value: 19, text: "Megaman 2" },
  { value: 20, text: "Megaman 3" },
  { value: 21, text: "Megaman 4" },
  { value: 22, text: "Megaman 5" },
  { value: 23, text: "Harvest Moon" },
  { value: 24, text: "Lemmings" },
  { value: 25, text: "Lemmings 2" },
  { value: 26, text: "Batman" },
  { value: 27, text: "Operation C" },
  { value: 28, text: "Tetris 2" },
  { value: 29, text: "Tetris Attack" },
  { value: 30, text: "Tetris Blast" },
  { value: 31, text: "Tetris Plus" },
  { value: 32, text: "Final Fantasy Legend" },
  { value: 33, text: "Final Fantasy Legend II" },
  { value: 34, text: "Final Fantasy Legend III" },
  { value: 35, text: "Final Fantasy 4" },
  { value: 36, text: "Final Fantasy Adventure" },
  { value: 37, text: "Castlevania II: Belmont's Revenge" },
  { value: 38, text: "Gargoyle's Quest - Ghosts'n Goblins" },
  { value: 39, text: "Duck Tales" },
  { value: 40, text: "Duck Tales 2" },
  { value: 41, text: "Pokemon Blue" },
  { value: 42, text: "Pokemon Red" },
  { value: 46, text: "Wario Land 2" },
]

Vue.component("gb-screen", {
  template: `
    <div id="screen">
      <canvas class="canvas"></canvas>
    </div>
  `
})

Vue.component("gb-buttons", {
  template: `
    <div id="actions">
      <div class="dpad">
        <button id="button-up"></button>
        <button id="button-right"></button>
        <button id="button-down"></button>
        <button id="button-left"></button>
      </div>
      <div class="start-select">
        <button id="button-select"></button>
        <button id="button-start"></button>
      </div>
      <div class="a-b">
        <button id="button-a"></button>
        <button id="button-b"></button>
      </div>
    </div>
  `
})

Vue.component("gb-control", {
  data() {
    return { options: games }
  },
  methods: {
    async selectedChanged(e) {
      console.log(e.target.value);
      window.cancelAnimationFrame(window.nextFrame);
      if (typeof audio === "undefined") {
        window.audio = new SoundController();
      } else {
        window.audio.restart();
      }
      window.Module._startGame(parseInt(e.target.value));
      await loadSave();
      fn();
    },
    gameSpeedChanged(e) {
      console.log(e.target.value);
      window.audio.stop();
      SOURCE_SAMPLE_RATE = parseInt(e.target.value) / 100;
    }
  },
  template: `
    <div id="control">
      <div class="menu"></div>
      <gb-buttons></gb-buttons>
    </div>
  `
})

Vue.component("gb-main", {
  mounted() {
    initialiseCanvas();
    initialiseTouch();
  },
  template: `
    <div id="gb-main">
      <gb-screen></gb-screen>
      <gb-control></gb-control>
    </div>
  `
})

Vue.component("gb-menu", {
  data() {
    return {
      games: games
    }
  },
  props: {
    selectedGameChanged: Object
  },
  methods: {
    selectGame(e) {
      if (this.selectedGameChanged) {
        this.selectedGameChanged(e);
      }
    }
  },
  template: `
    <div id="gb-menu">
      <div v-for="game in games">
        <div @click="selectGame(game)" class="gb-game">{{game.text}}</div>
      </div>
    </div>
  `
})

Vue.component("gb-root", {
  data() {
    return {
      selectedGame: null
    }
  },
  methods: {
    async selectedGameChanged(game) {
      console.log(game);
      window.cancelAnimationFrame(window.nextFrame);
      if (typeof audio === "undefined") {
        window.audio = new SoundController();
      } else {
        window.audio.restart();
      }
      window.Module._startGame(parseInt(game.value));
      await loadSave();
      fn();
      this.selectedGame = game;
    },
  },
  template: `
    <div id="gb-root">
      <gb-main v-if="selectedGame"></gb-main>
      <gb-menu :selectedGameChanged="selectedGameChanged" v-else></gb-menu>
    </div>
  `
})

window.vm = new Vue({
  el: "#app",
  data: {
    loaded: false
  }
})