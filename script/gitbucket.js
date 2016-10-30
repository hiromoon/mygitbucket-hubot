const icon_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSSdqE-vPgPENEfMA3QVphojkPN23f2rfZh_PMokSmAudMKOV7DUogN6-U";
const username = "gitbucket";
const incoming_url = process.env.MATTERMOST_INCOME_URL;

module.exports = (robot) => {
  robot.router.post('/gitbucket', (req, res) => {
    res.send('OK');
    const text = [];
    const payload = JSON.parse(req.body.payload);
    const action = payload.action;
    const sender = payload.sender;
    const issue = payload.issue;
    const repository = payload.repository;
    const comment = payload.comment;
    const pusher = payload.pusher;
    const pull_request = payload.pull_request;
    console.log(payload);

    if (action === "created") {
      const target = issue.pull_request ? "pull_request" : "issue";
      const mentions = getMentions(comment.body);
      text.push(`${comment.user.login} commented ${target} ([${repository.name}](${repository.html_url}))`);
      text.push(`[#${issue.number} ${issue.title}](${issue.html_url})`);
      Array.prototype.push.apply(text, mentions);
    } else if (action) {
      const target = pull_request ? "pull_request" : "issue";
      const obj = payload[target];
      const mentions = getMentions(obj.body);
      text.push(`${sender.login} ${action}  ${target} ([${repository.name}](${repository.html_url}))`);
      text.push(`[#${obj.number} ${obj.title}](${obj.html_url})`);
    }
    if (pusher) {
      const branch = /refs\/heads\/(.*)/.exec(payload.ref)[1];
      text.push(`${pusher.name} pushed to ([${repository.name}#${branch}](${repository.html_url}))`);

      const commits = payload.commits.map(e => `[- ${e.message}](${e.url})`);
      Array.prototype.push.apply(text, commits);
    }
    const data = JSON.stringify({icon_url, username, text: text.join('\n')});
    // console.log(data);
    robot.http(incoming_url)
      .header('Content-Type', 'application/json')
      .post(data)((err, res, body) => {
        // console.log({err, res, body});
      })
  });
}

function getMentions(body) {
  const re = new RegExp("(@[a-zA-Z1-9]+) ", "g");
  const mentions = body.match(re);
  return mentions;
}
