import firebase from 'firebase/app'

import Store from '../store'

export default class RoomScene extends Phaser.Scene
{
  constructor ()
  {
    super('RoomScene')
  }

  init ({ master, mode })
  {
    this.iH = window.innerHeight
    this.iW = window.innerWidth
    this.magic_width = window.innerWidth / 2
    this.master = master
    this.mode = mode

    this.divElem = document.createElement('div')
    this.playerCount = document.createElement('label')
    this.playerList = document.createElement('ul')

    this.playersRef = null
    this.playersListener = null
    this.roomRef = null
    this.roomListener = null
  }

  /**
   * Used to create a button element
   * that is used for the menu
   *
   * @param {String} text
   */
  buttonFactory (text, color)
  {
    const elem = document.createElement('button')
    elem.innerHTML = text
    elem.classList = 'uk-button'
    elem.style = `width: ${window.innerWidth / 2}px; height: 100px; font: 48px; color: white; background-color: ${color}`
    return elem
  }

  preload ()
  {
    this.load.setBaseURL('/game_assets/')
  }

  create ()
  {
    this.add.rectangle(this.iW/2, this.iH/2, this.iW, this.iH, 0xFFFFFFC)

    this.addExitBtn()
    if (this.mode === 'MASTER') {
      this.addPlayBtn()
    }
    this.setupDivElement()
    this.setupHeader()
    this.setupPlayerCount()
    this.setupPlayerList()

    this.addFirebaseListeners()

    this.events.on('shutdown', () => this.cleanup())
  }

  addExitBtn ()
  {
    const exitBtn = this.buttonFactory('EXIT', 'red')
    this.add.dom(this.magic_width / 2, this.iH - 50, exitBtn)
    exitBtn.addEventListener('click', () => {
      this.scene.start('MenuScene')
    })
  }

  addPlayBtn ()
  {
    const play = this.buttonFactory('PLAY', 'green')
    this.add.dom(this.iW - (this.magic_width / 2), this.iH - 50, play)
    play.addEventListener('click', () => {
      this.roomRef.set('PLAYING')
    })
  }

  setupDivElement ()
  {
    this.divElem.style = `width: ${this.iW - 50}px; height: ${this.iH - 150}px; background-color: rgba(255, 255, 255, 0.9)`
    this.add.dom(this.iW / 2, this.iH / 2 - 50, this.divElem)
  }

  setupHeader ()
  {
    const labelElem = document.createElement('h3')
    labelElem.classList = 'uk-padding-small'
    labelElem.innerHTML = 'ROOM CODE: ' + Store.getValue('room_id')
    this.divElem.appendChild(labelElem)
  }

  setupPlayerCount ()
  {
    this.playerCount.classList = 'uk-padding-small'
    this.renderPlayersCount('-')
    this.divElem.appendChild(this.playerCount)
  }

  renderPlayersCount (count)
  {
    this.playerCount.innerHTML = `Players: ` + count
  }

  renderPlayerList (players) {
    this.playerList.innerHTML = ''

    for (const key in players) {
      const player = players[key]
      const item = document.createElement('li')
      item.style = 'background-color: rgba(150, 150, 150, 0.9)'
      item.classList = 'uk-padding-small'
      if (key === Store.getValue('user').uid && key === this.master) {
        item.innerHTML = `<h5><b style="color: yellow">${player.name}</b></h5>`
      } else if (key === Store.getValue('user').uid) {
        item.innerHTML = `<h5><b>${player.name}</b></h5>`
      } else if (key === this.master) {
        item.innerHTML = `<h5><span style="color: yellow">${player.name}</span></h5>`
      } else {
        item.innerHTML = `<h5>${player.name}</h5>`
      }

      this.playerList.appendChild(item)
    }
  }

  setupPlayerList ()
  {
    this.playerList.classList = 'uk-list uk-padding-small'
    this.divElem.appendChild(this.playerList)
  }

  async addFirebaseListeners ()
  {
    this.playersRef = firebase.database().ref('/rooms/' + Store.getValue('room_id') + '/players')
    this.playersListener = this.playersRef.on('value', (snapshot) => {
      this.renderPlayersCount(Object.keys(snapshot.val()).length)
      this.renderPlayerList(snapshot.val())
    })

    this.roomRef = firebase.database().ref('/rooms/' + Store.getValue('room_id') + '/state')
    this.roomListener = this.roomRef.on('value', (snapshot) => {
      const state = snapshot.val()
      console.log('current state', state)
      if (state === 'PLAYING') {
        this.scene.start('DrawScene', { mode: 'PARTY' })
      }
    })
  }

  cleanup () {
    console.log('house keeping')
    if (this.playersRef && this.playersListener) {
      this.playersRef.off('value', this.playersListener)
    }
    if (this.roomRef && this.roomListener) {
      this.roomRef.off('value', this.roomListener)
    }
  }

}