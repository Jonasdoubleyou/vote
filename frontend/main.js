const loadedFrom = new URL(document.currentScript.src ?? window.location.href);
const POLLURL = loadedFrom.protocol + "//" + loadedFrom.host;

const poll = document.createElement("div");
poll.className = "poll-container";

document.body.appendChild(poll);

function show(el) {
    poll.innerHTML = "";
    poll.appendChild(el);
}

function heading(parent, text) {
    const el = document.createElement("h1");
    el.className = "poll-heading";
    el.textContent = text;
    parent.appendChild(el);
}

async function createPoll() {
    const answers = ["yes", "no"];
    const response = await fetch("/api/create", {
        method: "POST",
        body: JSON.stringify({ answers }),
        headers: {
            'Content-Type': 'application/json'
        },
    });
    const { pollid, secret } = await response.json();

    window.location = POLLURL + `/?pollid=${pollid}&secret=${secret}`;
}

async function fetchResults(secret, pollid) {
    while (true) {
        const response = await fetch(POLLURL + "/api/get-result", {
            method: "POST",
            body: JSON.stringify({ secret }),
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const { answers } = await response.json();
        showResults(answers, pollid);

        await new Promise(res => setTimeout(res, 1000));
    }
}

function showResults(answers, pollid) {
    const container = document.createElement("div");
    container.className = "poll-results__container";
    heading(container, "Results");

    const url = `${POLLURL}/?vote=${pollid}`;
    const link = document.createElement("button");
    link.className = "poll-link";
    link.textContent = "Copy link and send it around";
    link.addEventListener("click", () => {
        navigator.clipboard.writeText(url);
    });

    container.appendChild(link);

    for (const [answer, votes] of Object.entries(answers)) {
        const answerContainer = document.createElement("div");
        answerContainer.className = "poll-results__answer-container";

        const answerEl = document.createElement("div");
        answerEl.className = "poll-results__answer";
        answerEl.textContent = answer;
        answerContainer.appendChild(answerEl);

        const votesEl = document.createElement("div");
        votesEl.className = "poll-results__vote";
        votesEl.textContent = votes;
        answerContainer.appendChild(votesEl);

        container.appendChild(answerContainer);
    }

    show(container);
}

async function showVote(pollid) {
    const response = await fetch(POLLURL + "/api/get-answers", {
        method: "POST",
        body: JSON.stringify({ pollid }),
        headers: {
            'Content-Type': 'application/json'
        },
    });

    const { answers } = await response.json();

    const container = document.createElement("div");
    container.className = "poll-vote__container";

    heading(container, "Vote now!");

    for (const answer of answers) {
        const btn = document.createElement("button");
        btn.className = "poll-vote__answer";
        btn.textContent = answer;
        btn.addEventListener("click", () => vote(pollid, answer));
        container.appendChild(btn);
    }

    show(container);
}

async function vote(pollid, answer) {
    await fetch(POLLURL + "/api/vote", {
        method: "POST",
        body: JSON.stringify({ pollid, answer }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    showVoted();
}

function showVoted() {
    const el = document.createElement("div");
    heading(el, "Voted!");
    show(el);
}


const params = new URLSearchParams(window.location.search);

if (params.has("vote")) {
    showVote(params.get("vote"));
} else if (params.has("pollid") && params.has("secret")) {
    fetchResults(params.get("secret"), params.get("pollid"));
} else {
    createPoll();
}