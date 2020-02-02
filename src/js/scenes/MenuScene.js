import Store from '../store'
import apollo from '../apollo'
import { CreateRoom } from '../apollo'

export default class MenuScene extends Phaser.Scene
{
  constructor ()
  {
    super('MenuScene')
  }

  /**
   * Used to create a button element
   * that is used for the menu
   *
   * @param {String} text
   */
  buttonFactory (text)
  {
    const elem = document.createElement('button')
    elem.innerHTML = text
    elem.style = 'width: 220px; height: 100px; font: 48px; background-color: orange'
    return elem
  }

  preload ()
  {
    this.load.setBaseURL('/game_assets/')

    this.load.image('like', 'like.png')
    this.load.image('funny', 'funny.png')
    this.load.image('smart', 'smart.png')

    this.load.image('left', 'left.png')
    this.load.image('right', 'right.png')
  }

  create ()
  {
    const width = window.innerWidth
    const height = window.innerHeight

    this.add.rectangle(width/2, height/2, width, height, 0xFFFFFFC)

    const title = document.createElement('h2')
    title.style = 'height: 100px'
    title.innerHTML = 'REstorE<br />DIstorT'
    this.add.dom(width/2, 100, title)

    const createGameBtn = this.buttonFactory('Create Game')
    createGameBtn.addEventListener('click', () => this.createGameHandler())

    const joinGameBtn = this.buttonFactory('Join Game')
    joinGameBtn.addEventListener('click', () => this.scene.start('JoinScene'))

    const testBtn = this.buttonFactory('Single Player')
    testBtn.addEventListener('click', () => {
      this.scene.start('DrawScene', { mode: 'SINGLE' })
      // this.scene.start('ResultsScene', { room_id: '_hEQuM'  })
    })

    this.add.dom(width/2, 200, createGameBtn)
    this.add.dom(width/2, 350, joinGameBtn)
    this.add.dom(width/2, 500, testBtn)
  }

  async createGameHandler ()
  {
    const data = await apollo.mutate({
      mutation: CreateRoom,
      variables: {
        token: Store.getValue('idToken')
      }
    })
    Store.setValue('room_id', data.data.CreateRoom.id)
    this.scene.start('RoomScene', { master: Store.getValue('user').uid, mode: 'MASTER' })
  }
}