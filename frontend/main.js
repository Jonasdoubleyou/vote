(function () {
    const loadedFrom = new URL(document.currentScript.src ?? window.location.href);
    const POLLURL = loadedFrom.protocol + "//" + loadedFrom.host;

    const params = new URLSearchParams(window.location.search);

    const poll = document.createElement("div");
    poll.className = "poll-container";

    document.body.appendChild(poll);

    function show(el) {
        poll.innerHTML = "";
        poll.appendChild(el);
    }

    function btn(container, classname, textContent, click) {
        const btn = document.createElement("button");
        btn.className = classname;
        btn.textContent = textContent;
        btn.addEventListener("click", click);
        container.appendChild(btn);
    }

    const toggle = btn(document.body, "poll-toggle", "Vo te", () => {
        if (open) closePopup(); else openPopup();
    });

    let open;
    function openPopup() {
        open = true;
        poll.className = "poll-container poll-container__open";
    }

    function closePopup() {
        open = false;
        poll.className = "poll-container";
    }

    function heading(parent, text) {
        const el = document.createElement("h1");
        el.className = "poll-heading";
        el.textContent = text;
        parent.appendChild(el);
    }

    function delay(time = 1000) {
        return new Promise(res => setTimeout(res, time));
    }

    function getGroupname() {
        return (params.has("group") && params.get("group")) || (window.getGroupname && window.getGroupname());
    }

    async function createPoll(answers) {
        isHost = true;

        const group = getGroupname();
        const response = await fetch("/api/create", {
            method: "POST",
            body: JSON.stringify({ answers, group }),
            headers: {
                'Content-Type': 'application/json'
            },
        });
        const { pollid, secret } = await response.json();

        fetchResults(secret, pollid);
        window.localStorage.setItem("vote", JSON.stringify({ pollid, secret }));
    }

    let updateResults = false;

    async function fetchResults(secret, pollid) {

        updateResults = true;
        while (updateResults) {
            const response = await fetch(POLLURL + "/api/get-result", {
                method: "POST",
                body: JSON.stringify({ secret }),
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                localStorage.removeItem("poll");
                showStart();
                return;
            }

            const { answers } = await response.json();
            showResults(answers, pollid);

            await delay();
        }
    }

    function showResults(answers, pollid) {
        const container = document.createElement("div");
        container.className = "poll-results__container";
        heading(container, "Results");

        const url = `${POLLURL}/?vote=${pollid}`;
        btn(container, "poll-link", "Copy link and send it around", () => {
            navigator.clipboard.writeText(url);
        });


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

        btn(container, "poll-link", "new poll", () => { updateResults = false; showStart(); });

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
            btn(container, "poll-vote__answer", answer, () => vote(pollid, answer));
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

    function showStart() {
        isHost = false;

        const container = document.createElement("div");
        heading(container, "Vote!");

        if (getGroupname()) {
            const link = `${POLLURL}/?group=${getGroupname()}`;
            btn(container, "poll-link", "Share group link", () => {
                navigator.clipboard.writeText(link);
            });
        }

        const templates = [
            ["yes", "no"],
        ];

        for (const template of templates) {
            btn(container, "poll-link", template.join("/"), () => createPoll(template))
        }

        show(container);
    }



    // used to not poll for questions to show
    let isHost = false;

    async function pollGroup(group) {
        let currentPollid = undefined;
        while (true) {
            if (!isHost) {
                const response = await fetch(POLLURL + "/api/get-group", {
                    method: "POST",
                    body: JSON.stringify({ group }),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });

                const { pollid } = await response.json();

                if (pollid !== currentPollid) {
                    currentPollid = pollid;
                    openPopup();
                    await showVote(pollid);
                }
            }

            await delay();
        }
    }


    if (localStorage.getItem("vote")) {
        const { pollid, secret } = JSON.parse(localStorage.getItem("vote"));
        fetchResults(secret, pollid);
    } else if (getGroupname()) {
        pollGroup(getGroupname());
        showStart();
    } else if (params.has("vote")) {
        showVote(params.get("vote"));
    } else {
        showStart();
    }

})();

// TODO: Create new Poll
// TODO: Create Poll group
// TODO: Customize Answers
// TODO: Error handling