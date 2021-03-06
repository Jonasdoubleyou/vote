const Express = require("express");
const app = Express();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");

// TODO: recycle old votes to not leak memory
const pollsByID = Object.create(null);
const pollsBySecret = Object.create(null);

const pollsByGroup = Object.create(null);

function getRandom() {
    return crypto.randomBytes(48).toString('hex');
}

app.post("/api/vote", bodyParser.json(), (req, res) => {
    const { answer, pollid } = req.body;

    if(!pollid || !answer)
        return res.status(400).send("Missing answer or pollid");

    if(!(pollid in pollsByID))
        return res.status(403).send("Pollid invalid");

    if(!(answer in pollsByID[pollid].answers))
        return res.status(403).send("Answer invalid");

    pollsByID[pollid].answers[answer] += 1;

    return res.status(200).send("Answer recorded");
});

app.post("/api/get-result", bodyParser.json(), (req, res) => {
    const { secret } = req.body;

    if(!secret)
        return res.status(400).send("Missing secret");

    if(!(secret in pollsBySecret))
        return res.status(403).send("Invalid secret");

    return  res.json({ answers: pollsBySecret[secret].answers });
});

app.post("/api/create", bodyParser.json(), (req, res) => {
    const { answers, group } = req.body;

    if(!answers || !Array.isArray(answers) || answers.some(answer => typeof answer !== "string"))
        return res.status(403).send("Answers must be an array of strings");

    if(Object.keys(pollsByID).length > 10000)
        return res.status(500).send("Seems we're under attack. Please do not create new polls.");

    const pollid = getRandom();
    const secret = getRandom();

    const poll = { pollid, secret, answers: {}, createdAt: Date.now() };

    for(const answer of answers)
        poll.answers[answer] = 0;

    if(group)
        pollsByGroup[group] = pollid;

    pollsByID[pollid] = poll;
    pollsBySecret[secret] = poll;

    return res.json({ pollid, secret });
});

app.post("/api/get-answers", bodyParser.json(), (req, res) => {
    const { pollid } = req.body;

    if(!pollid)
    return res.status(400).send("Missing answer or pollid");

    if(!(pollid in pollsByID))
        return res.status(403).send("Pollid invalid");

    const answers = Object.keys(pollsByID[pollid].answers);

    return res.json({ answers });
});

app.post("/api/get-group", bodyParser.json(), (req, res) => {
    const { group } = req.body;
    if(!group)
        return res.status(400).send("Missing group parameter");

    if(!(group in pollsByGroup))
        return res.json({});

    return res.json({ pollid: pollsByGroup[group] });
});


app.use("/", Express.static(__dirname + "/frontend"));

app.listen(2000);