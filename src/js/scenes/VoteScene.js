import firebase from 'firebase/app'
import Store from '../store'

export default class VoteScene extends Phaser.Scene
{
  constructor ()
  {
    super('VoteScene')
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
      this.scene.start('ResultsScene', { room_id: this.room_id })
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
    labelElem.innerHTML = 'VOTE TIME'
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

  async fillImageList (players)
  {
    const currentVotes = (await firebase.database().ref('rooms/' + this.room_id + '/rounds_data/0/' + Store.getValue('user').uid).once('value')).val()
    this.listElem.innerHTML = ''
    for (const playerId in players) {
      const player = players[playerId]
      if (playerId === Store.getValue('user').uid) {
        continue
      }
      if (player.state === 'VOTING') {
        const imgURL = await firebase.storage().ref('images/' + this.room_id + '/' + playerId + '.png').getDownloadURL()
        console.log(imgURL)
        const liElem = document.createElement('li')
        const previewPhoto = document.createElement('span')
        previewPhoto.innerHTML = `
          <div uk-lightbox>
            <a class="uk-button uk-button-default" href="${imgURL}">Preview</a>
          </div>
        `
        liElem.appendChild(previewPhoto)
        const voteButtons = document.createElement('span')
        voteButtons.classList = 'uk-flex uk-flex-between uk-padding-small'
        voteButtons.appendChild(this.generateRadioBtn(playerId, 'funny', 'Funny', currentVotes.funny === playerId))
        voteButtons.appendChild(this.generateRadioBtn(playerId, 'like', 'Like', currentVotes.like === playerId))
        voteButtons.appendChild(this.generateRadioBtn(playerId, 'smart', 'Smart', currentVotes.smart === playerId))
        liElem.appendChild(voteButtons)
        this.listElem.appendChild(liElem)
      }
    }
  }

  generateRadioBtn(playerId, group, text, checked)
  {
    const labelElem = document.createElement('label')

    const textSpan = document.createElement('span')
    textSpan.innerHTML = text

    const radioInput = document.createElement('input')
    radioInput.classList = 'uk-radio'
    radioInput.setAttribute('type', 'radio')
    radioInput.setAttribute('name', group)
    radioInput.checked = checked
    radioInput.addEventListener('input', () => {
      firebase.database().ref('rooms/' + this.room_id + '/rounds_data/0/' + Store.getValue('user').uid + '/' + group).set(playerId)
    })

    labelElem.appendChild(radioInput)
    labelElem.appendChild(textSpan)

    return labelElem
  }

  setupFirebase () {
    console.log('firebase', Store.getValue('user').uid)
    const playersRef = firebase.database().ref('rooms/' + this.room_id + '/players')

    const playersListener = playersRef.on('value', (snapshot) => {
      const playerData = snapshot.val()
      this.fillImageList(playerData)
    })

    this.events.on('shutdown', () => {
      playersRef.off('value', playersListener)
    })
  }

}