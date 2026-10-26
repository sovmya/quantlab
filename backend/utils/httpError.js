// An error that carries an HTTP status, so controllers can just `throw`.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;