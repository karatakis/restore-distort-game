const store = {
  room_id: 'single-player'
}

export default {
  setValue (key, value)
  {
    store[key] = value
  },
  getValue (key)
  {
    if (!store[key]) {
      throw new Error('Missing key', key)
    }
    return store[key]
  },
  getStore ()
  {
    return store
  }
}