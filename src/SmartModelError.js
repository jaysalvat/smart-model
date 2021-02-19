class SmartModelError extends Error {
  constructor(data) {
    super(data.message)
    Object.assign(this, data)
  }
}

export default SmartModelError
