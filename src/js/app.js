import MenuScene from './scenes/MenuScene'
import DrawScene from './scenes/DrawScene'
import JoinScene from './scenes/JoinScene'
import RoomScene from './scenes/RoomScene'
import VoteScene from './scenes/VoteScene'
import ResultsScene from './scenes/ResultsScene'

import Store from './store'
import firebaseSetup from './firebaseSetup'

async function main() {
  const config = {
    parent: 'game',
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    dom: {
      createContainer: true
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: 0
      }
    },
    scene: [ MenuScene, RoomScene, DrawScene, JoinScene, VoteScene, ResultsScene ]
  }

  const firebaseSession = await firebaseSetup()
  Store.setValue('user', firebaseSession.user)
  Store.setValue('idToken', firebaseSession.idToken)

  const game = new Phaser.Game(config)

  Store.setValue('game', game)
}

main()
