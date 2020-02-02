import Store from '../store'
import apollo from '../apollo'
import { JoinRoom } from '../apollo'

export default class JoinScene extends Phaser.Scene
{
  constructor ()
  {
    super('JoinScene')
  }

  init ()
  {
    this.iH = window.innerHeight
    this.iW = window.innerWidth
    this.magic_width = window.innerWidth / 2

    this.inputElement = document.createElement('input')
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
    this.addJoinBtn()

    this.addInput()
  }

  addExitBtn ()
  {
    const exitBtn = this.buttonFactory('BACK', 'red')
    this.add.dom(this.magic_width / 2, this.iH - 50, exitBtn)
    exitBtn.addEventListener('click', () => {
      this.scene.start('MenuScene')
    })
  }

  addJoinBtn ()
  {
    const play = this.buttonFactory('JOIN', 'green')
    this.add.dom(this.iW - (this.magic_width / 2), this.iH - 50, play)
    play.addEventListener('click', async () => {
      if (this.inputElement.value) {
        const response = await apollo.mutate({
          mutation: JoinRoom,
          variables: {
            room_id: this.inputElement.value,
            token: Store.getValue('idToken')
          }
        })
        Store.setValue('room_id', this.inputElement.value)
        this.scene.start('RoomScene', { master: response.data.JoinRoom.master, mode: 'CLIENT' })
      }
    })
  }

  addInput ()
  {
    this.inputElement.classList = 'uk-input'
    this.inputElement.placeholder = 'Enter room code'
    this.inputElement.style = `width: ${this.iW - 100}px; height: ${100}px;`

    this.add.dom(this.iW / 2, 200, this.inputElement)
  }
}