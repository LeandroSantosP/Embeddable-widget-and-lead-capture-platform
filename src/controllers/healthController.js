function healthCheck(_request, response) {
  response.status(200).json({ status: 'ok' });
}

module.exports = { healthCheck };