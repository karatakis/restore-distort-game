import firebase from 'firebase/app'
import _ from 'lodash'

import assets from '../assets'
import store from '../store'

export default class DrawScene extends Phaser.Scene
{
  constructor ()
  {
    super('DrawScene')
  }

  init ({ mode })
  {
    /**
     * Used for double click gesture
     */
    this.lastClicked = null

    this.iWidth = window.innerWidth
    this.iHeight = window.innerHeight

    this.w2 = window.innerWidth / 2
    this.h2 = window.innerHeight / 2

    this.magicScale = 1

    /**
     * Used to keep the user defined parts
     * Will be kept after submission
     */
    this.componentsGroup = this.physics.add.group()

    this.uiGroup = this.physics.add.group()
    this.tempGroup = this.physics.add.group()

    if (mode === 'PARTY') {
      setTimeout(() => {
        this.tempGroup.clear(true, true)
        this.uiGroup.clear(true, true)
        store.getValue('game').renderer.snapshot((img) => {
          const imageRef = firebase.storage().ref('images/' + store.getValue('room_id') + '/' + store.getValue('user').uid + '.png')
          imageRef.putString(img.src, 'data_url')
            .then(async () => {
              const playerStateRef = firebase.database().ref('/rooms/' + store.getValue('room_id') + '/players/' + store.getValue('user').uid + '/state')
              await playerStateRef.set('VOTING')
              setTimeout(() => {
                this.scene.start('VoteScene', { room_id: store.getValue('room_id') })
              }, 5000)
            })
        })
      }, 30000)
    }
  }

  /**
   * Used to load assets
   */
  preload ()
  {
    this.load.setBaseURL('/game_assets/woman-in-hat-and-fur-collar/')

    this.load.image('base', 'base.png')

    assets.forEach((part) => {
      this.load.image(part, part + '.png')
    })
  }

  /**
   * Used to initialize scene
   */
  create ()
  {
    this.addBaseImage()
    this.createDeleteRect()
    this.createToolbar()
    // this.openPartsTable()

    /**
     * Enable drag an drop for interactive items
     */
    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX
      gameObject.y = dragY
    })
  }

  addBaseImage ()
  {
    const imageWidth = 494
    const newImageHeight = 600

    this.magicScale = this.iWidth / imageWidth

    // const newImageHeight = (imageHeight * this.iWidth) / imageWidth

    const b = this.add.image(this.w2, this.h2, 'base')
      // .setDisplaySize(width, newImageHeight)
      b.setScale(this.magicScale)
  }

  createDeleteRect ()
  {
    // used to indicate delete part area
    const deleteRect = this.add.rectangle(this.w2, this.iHeight - 25, 494, 50, 0xFF8800).setInteractive()

    this.uiGroup.add(deleteRect)

    this.physics.add.existing(deleteRect)

    // used to detect if item of componentsGroup overlaps delete area
    // and deletes area
    this.physics.add.overlap(deleteRect, this.componentsGroup, (rect, part) => {
      this.componentsGroup.remove(part, true, true)
    })

    deleteRect.on('pointerdown', () => {
      this.openPartsTable(this.iWidth, this.iHeight, this.w2, this.h2, this.componentsGroup)
    })
  }

  createToolbar ()
  {
    const step = this.iWidth / 4
    const s2 = step / 2

    /**
     * Used to make transformations @part
     */
    const transform = _.throttle((transformType, rect, part) => {
      if (!rect.getBounds().contains(part.x, part.y)) {
        return
      }
      switch (transformType) {
        case 'increaseSizeRect':
          part.setDisplaySize(part.width += 5, part.height += 5)
          break
        case 'decreaseSizeRect':
          part.setDisplaySize(part.width -= 5, part.height -= 5)
          break
        case 'rotateLeftRect':
          part.setAngle(part.angle -= 4)
          break
        case 'rotateRightRect':
          part.setAngle(part.angle += 4)
          break
        default:
          console.error('Unknown transform type ', transformType)
          break
      }
    }, 100, {
      leading: true
    })

    // used to indicate resize part area
    const decreaseSizeRect = this.add.rectangle(s2, 25, step, 50, 0xFF00000)
    // used to indicate resize part area
    const increaseSizeRect = this.add.rectangle(s2 + (step * 1), 25, step, 50, 0x00FF00)

    // used to indicate rotate part area
    const rotateLeftRect = this.add.rectangle(s2 + (step * 2), 25, step, 50, 0x00EEFF)
    // used to indicate rotate part area
    const rotateRightRect = this.add.rectangle(s2 + (step * 3), 25, step, 50, 0x0000FF)

    this.uiGroup.add(decreaseSizeRect)
    this.uiGroup.add(increaseSizeRect)
    this.uiGroup.add(rotateLeftRect)
    this.uiGroup.add(rotateRightRect)

    /**
     * Register rectangles to physics engine
     */
    this.physics.add.existing(increaseSizeRect)
    this.physics.add.existing(decreaseSizeRect)
    this.physics.add.existing(rotateLeftRect)
    this.physics.add.existing(rotateRightRect)

    /**
     * Used to detect if item of componentsGroup overlaps transformation area
     * and then call transformation function
     */
    this.physics.add.overlap(increaseSizeRect, this.componentsGroup, (rect, part) => {
      transform('increaseSizeRect', rect, part)
    })
    this.physics.add.overlap(decreaseSizeRect, this.componentsGroup, (rect, part) => {
      transform('decreaseSizeRect', rect, part)
    })
    this.physics.add.overlap(rotateLeftRect, this.componentsGroup, (rect, part) => {
      transform('rotateLeftRect', rect, part)
    })
    this.physics.add.overlap(rotateRightRect, this.componentsGroup, (rect, part) => {
      transform('rotateRightRect', rect, part)
    })
  }

  openPartsTable ()
  {
    const bg = this.add.rectangle(this.w2, this.h2, this.iWidth, this.iHeight, 0xEEEE00)

    this.tempGroup = this.physics.add.group()
    const tempGroup = this.tempGroup

    tempGroup.add(bg)


    const createPart = (x, y, part) => {
      const partObj = this.physics.add.image(x, y, part)
      partObj.setScale(this.magicScale)
      tempGroup.add(partObj)
      partObj.setInteractive()
      this.input.setDraggable(partObj)

      /**
       * Used to register double click action
       */
      partObj.on('pointerdown', () => {
        const timeNow = new Date().getTime()
        if (timeNow - this.lastClicked <= 200) {
          partObj.setFlipX(!partObj.flipX)
        }
        this.lastClicked = timeNow
      })

      partObj.once('pointerdown', (pointer) => {
        tempGroup.remove(partObj)
        this.componentsGroup.add(partObj)
        tempGroup.clear(true, true)
        bg.destroy()
      })
    }

    /**
     * Generate painting parts on toolbox bar
     */
    let yDiff = 75
    let xDiff = 75
    assets.forEach((part) => {
      const x = xDiff
      const y = yDiff

      console.log('add part', part, x, y)

      createPart(x, y, part)

      xDiff += 125
      if (xDiff >= this.iWidth - 150) {
        xDiff = 75
        yDiff += 125
      }
    })
  }
}
