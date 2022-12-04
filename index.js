const needle = require("needle");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");

const token = process.env.BEARER_TOKEN;

const rulesURL = "https://api.twitter.com/2/tweets/search/stream/rules";
const streamURL =
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=public_metrics&expansions=author_id";

const rules = [{ value: "@pratikautomated" }];

async function getRules() {
  const response = await needle("get", rulesURL, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  return response.body;
}

async function setRules() {
  const data = {
    add: rules,
  };
  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  return response.body;
}

async function deleteRules(rules) {
  if (!Array.isArray(rules.data)) {
    return null;
  }
  const data = {
    delete: {
      ids: rules.data.map((rule) => rule.id),
    },
  };
  const response = await needle("post", rulesURL, data, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  return response.body;
}

function streamTweet() {
  const stream = needle.get(streamURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  stream.on("data", (data) => {
    try {
      const json = JSON.parse(data);
      console.log(json);
      fs.writeFile("tweet.json", JSON.stringify(json), (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    } catch (e) {}
  });
}

(async () => {
  let currentRules;
  try {
    currentRules = await getRules();
    await deleteRules(currentRules);
    await setRules();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  streamTweet();
})();
