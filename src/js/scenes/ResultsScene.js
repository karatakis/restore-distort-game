import firebase from 'firebase/app'
import _ from 'lodash'

import Store from '../store'

export default class ResultsScene extends Phaser.Scene
{
  constructor ()
  {
    super('ResultsScene')
  }

  init ({ room_id })
  {
    this.iH = window.innerHeight
    this.iW = window.innerWidth
    this.magic_width = window.innerWidth / 2

    this.room_id = room_id

    this.divElem = document.createElement('div')
    this.listElem = document.createElement('ul')

    setTimeout(() => {
      this.scene.start('MenuScene')
    }, 30000)
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

    this.setupDivElement()
    this.setupHeader()
    this.setupImageList()
    this.setupFirebase()
  }

  setupDivElement ()
  {
    this.divElem.style = `width: ${this.iW - 50}px; height: ${this.iH - 150}px; background-color: rgba(255, 255, 255, 0.95)`
    this.add.dom(this.iW / 2, this.iH / 2 - 50, this.divElem)
  }

  setupHeader ()
  {
    const labelElem = document.createElement('h3')
    labelElem.classList = 'uk-padding-small'
    labelElem.innerHTML = 'Results'
    this.divElem.appendChild(labelElem)

    const original = document.createElement('div')
    original.classList = 'uk-flex uk-flex-center'
    original.innerHTML = `
      <div uk-lightbox>
        <a class="uk-button uk-button-default" href="https://oss-ac-ip.firebaseapp.com/game_assets/woman-in-hat-and-fur-collar/woman-in-hat-and-fur-collar.jpg">
          Original
          <!-- <img src="https://oss-ac-ip.firebaseapp.com/game_assets/woman-in-hat-and-fur-collar/woman-in-hat-and-fur-collar.jpg" /> -->
        </a>
      </div>`
    this.divElem.appendChild(original)
  }

  setupImageList ()
  {
    this.listElem.classList = 'uk-list uk-padding-small'
    this.divElem.appendChild(this.listElem)
  }


  calculateStats (votes)
  {
    const finalVotes = {
      like: 0,
      funny: 0,
      smart: 0
    }

    _.forEach(votes, (vote) => {
      finalVotes[vote] += 1
    })

    return finalVotes
  }

  async fillImageList (playersVotes, playersData)
  {
    const currentVotes = (await firebase.database().ref('rooms/' + this.room_id + '/rounds_data/0/' + Store.getValue('user').uid).once('value')).val()
    this.listElem.innerHTML = ''
    for (const playerId in playersVotes) {
      const votes = playersVotes[playerId]
      const finalVotes = this.calculateStats(votes)

      const imgURL = await firebase.storage().ref('images/' + this.room_id + '/' + playerId + '.png').getDownloadURL()

      const liElem = document.createElement('li')

      const previewPhoto = document.createElement('span')
      previewPhoto.innerHTML = `
        <div uk-lightbox>
          <a class="uk-button uk-button-default" href="${imgURL}">${playersData[playerId].name} (${votes.length})</a>
        </div>
      `
      liElem.appendChild(previewPhoto)

      const statistics = document.createElement('span')
      statistics.classList = 'uk-flex uk-flex-between uk-padding-small'
      statistics.innerHTML = `
        <b>${finalVotes.like}</b> Like
        <b>${finalVotes.funny}</b> Funny
        <b>${finalVotes.smart}</b> Smart
      `
      liElem.appendChild(statistics)

      this.listElem.appendChild(liElem)
    }
  }

  async setupFirebase () {
    const playersRef = firebase.database().ref('rooms/' + this.room_id + '/players')
    const playersVotesRef = firebase.database().ref('rooms/' + this.room_id + '/rounds_data/0/')

    const playersData = (await playersRef.once('value')).val()

    const playersVotesListener = playersVotesRef.on('value', (snapshot) => {
      const playersVotes = snapshot.val()

      const votesPlayer = {}

      _.forEach(playersVotes, (votes) => {
        if (votes) {
          _.forEach(votes, (uid, voteType) => {
            if (!votesPlayer[uid]) {
              votesPlayer[uid] = []
            }
            votesPlayer[uid].push(voteType)
          })
        }
      })

      this.fillImageList(votesPlayer, playersData)
    })

    this.events.on('shutdown', () => {
      playersVotesRef.off('value', playersVotesListener)
    })
  }

}