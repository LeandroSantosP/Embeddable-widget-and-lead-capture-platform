async function notify(submission) {
  console.log(`Lead notification queued for submission ${submission.id}`);
}

module.exports = { notify };