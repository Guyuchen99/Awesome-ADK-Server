// import axios from "axios";
// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import { GoogleAuth } from "google-auth-library";

// dotenv.config();

// async function getAccessToken() {
//   const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
//   const client = await auth.getClient();
//   const { token } = await client.getAccessToken();
//   return token;
// }

// const app = express();

// const PORT = process.env.PORT;
// const PROJECT_ID = process.env.PROJECT_ID;
// const LOCATION = process.env.LOCATION;
// const RESOURCE_ID = process.env.RESOURCE_ID;

// if (!PROJECT_ID || !LOCATION || !RESOURCE_ID) {
//   console.error("Missing required environment variables. Check PROJECT_ID, LOCATION, and RESOURCE_ID.");
//   process.exit(1);
// }

// const AGENT_ENGINE_BASE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${RESOURCE_ID}`;

// app.use(cors());
// app.use(express.json());

// app.post("/api/chat/send-message", async (req, res) => {
//   try {
//     const { message, userId, sessionId, cartId } = req.body;

//     if (!message || !userId || !cartId) {
//       return res.status(400).json({ success: false, message: "Missing required fields." });
//     }

//     const token = await getAccessToken();
//     const requestUrl = `${AGENT_ENGINE_BASE_URL}:streamQuery`;
//     const finalMessage = `cart_id=gid://shopify/Cart/${cartId}\nuser_message=${message}`;

//     const payload = {
//       class_method: "async_stream_query",
//       input: {
//         user_id: userId,
//         session_id: sessionId ?? "",
//         message: finalMessage,
//       },
//     };

//     const response = await fetch(requestUrl, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();

//     let buffer = "";
//     const results = [];

//     while (true) {
//       const { done, value } = await reader.read();

//       if (done) {
//         break;
//       }

//       buffer += decoder.decode(value, { stream: true });

//       let boundary = buffer.indexOf("\n");

//       while (boundary !== -1) {
//         const chunk = buffer.slice(0, boundary).trim();
//         buffer = buffer.slice(boundary + 1);

//         if (chunk) {
//           try {
//             const parsedChunk = JSON.parse(chunk);
//             results.push(parsedChunk);
//           } catch (error) {
//             console.error("Failed to parse chunk: ", chunk, error);
//           }
//         }
//         boundary = buffer.indexOf("\n");
//       }
//     }

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Something went wrong with /api/chat/send-message: ", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// app.post("/api/chat/get-latest-session", async (req, res) => {
//   try {
//     const { userId } = req.body;

//     if (!userId) {
//       return res.status(400).json({ success: false, message: "Missing required fields." });
//     }

//     const token = await getAccessToken();
//     const requestUrl = `${AGENT_ENGINE_BASE_URL}:query`;

//     const payload = {
//       class_method: "async_list_sessions",
//       input: {
//         user_id: userId,
//       },
//     };

//     const response = await axios.post(requestUrl, payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error("Something went wrong with /api/chat/get-latest-session: ", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// app.post("/api/chat/get-history", async (req, res) => {
//   try {
//     const { userId, sessionId } = req.body;

//     if (!userId || !sessionId) {
//       return res.status(400).json({ success: false, message: "Missing required fields." });
//     }

//     const token = await getAccessToken();
//     const requestUrl = `${AGENT_ENGINE_BASE_URL}:query`;

//     const payload = {
//       class_method: "async_get_session",
//       input: {
//         user_id: userId,
//         session_id: sessionId,
//       },
//     };

//     const response = await axios.post(requestUrl, payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error("Something went wrong with /api/chat/get-history: ", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

import axios from "axios";
import nlp from "compromise";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { GoogleAuth } from "google-auth-library";

dotenv.config();

async function getAccessToken() {
  const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

const app = express();

const PORT = process.env.PORT;
const PROJECT_ID = process.env.PROJECT_ID;
const LOCATION = process.env.LOCATION;
const RESOURCE_ID = process.env.RESOURCE_ID;

if (!PROJECT_ID || !LOCATION || !RESOURCE_ID) {
  console.error("Missing required environment variables. Check PROJECT_ID, LOCATION, and RESOURCE_ID.");
  process.exit(1);
}

const AGENT_ENGINE_BASE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${RESOURCE_ID}`;

app.use(cors());
app.use(express.json());

app.post("/api/chat/send-message", async (req, res) => {
  try {
    const { message, userId, sessionId, cartId, userEvents } = req.body;

    if (!message || !userId || !cartId) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const token = await getAccessToken();
    const requestUrl = `${AGENT_ENGINE_BASE_URL}:streamQuery`;

    let recentEvents = userEvents.slice(-3);
    let eventContext = recentEvents.length ? `Recent user interactions: ${JSON.stringify(recentEvents)}.` : "";
    const finalMessage = `${eventContext}\ncart_id=gid://shopify/Cart/${cartId}\nuser_message=${message}`;

    const payload = {
      class_method: "async_stream_query",
      input: {
        user_id: userId,
        session_id: sessionId ?? "",
        message: finalMessage,
      },
    };

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    const results = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n");

      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 1);

        if (chunk) {
          try {
            const parsedChunk = JSON.parse(chunk);
            results.push(parsedChunk);
          } catch (error) {
            console.error("Failed to parse chunk: ", chunk, error);
          }
        }
        boundary = buffer.indexOf("\n");
      }
    }
    res.status(200).json(results);
  } catch (error) {
    console.error("Something went wrong with /api/chat/send-message: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard API Endpoints
// later save this to a db
let userMessageCount = 0;

let positiveFeedback = 0;
let negativeFeedback = 0;

let commonKeywords = {};

let sessionDurations = [];

let conversationLengths = [];

app.post("/api/track-common-keywords", (req, res) => {
  if (req.body && req.body.message) {
    const doc = nlp(req.body.message);
    const keywords = doc
      .nouns()
      .not("#Pronoun")
      .not("#Determiner")
      .not("#Conjunction")
      .not("#Preposition")
      .out("array");

    for (let keyword of keywords) {
      commonKeywords[keyword] = (commonKeywords[keyword] || 0) + 1;
    }
  }
  res.status(200).json({ success: true });
});

app.get("/api/get-common-keywords", (req, res) => {
  const arr = Object.entries(commonKeywords)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
  res.json({ commonKeywords: arr });
});

app.post("/api/track-user-message-count", (req, res) => {
  userMessageCount += 1;
  if (req.body && req.body.message) {
    userMessages.push(req.body.message);
  }
  res.status(200).json({ success: true });
});

app.get("/api/get-user-message-count", (req, res) => {
  res.json({ userMessageCount: userMessageCount });
});

app.post("/api/track-positive-feedback", (req, res) => {
  positiveFeedback += 1;
  res.status(200).json({ success: true });
});

app.get("/api/get-positive-feedback-count", (req, res) => {
  res.json({ positiveFeedbackCount: positiveFeedback });
});

app.post("/api/track-negative-feedback", (req, res) => {
  negativeFeedback += 1;
  res.status(200).json({ success: true });
});

app.get("/api/get-negative-feedback-count", (req, res) => {
  res.json({ negativeFeedbackCount: negativeFeedback });
});

app.post("/api/track-session-durations", (req, res) => {
  let { duration } = req.body;

  if (typeof duration === "number" && duration > 0) {
    sessionDurations.push(duration);
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Invalid Duration" });
  }
});

app.get("/api/get-average-session-durations", (req, res) => {
  let sum = sessionDurations.reduce((a, b) => a + b, 0);
  let averageSessionDuration = sum / sessionDurations.length;

  res.json({ averageSessionDuration: averageSessionDuration });
});

app.get("/api/get-average-conversation-length", (req, res) => {
  let sum = conversationLengths.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  let averageConversationLength = sum / conversationLengths.length;
  res.json({ averageConversationLength: averageConversationLength });
});

app.post("/api/track-average-conversation-length", (req, res) => {
  const conversationLength = req.body.conversationLength;
  if (req.body && conversationLength > 0 && typeof conversationLength === "number") {
    conversationLengths.push(conversationLength);
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, message: "Invalid Length" });
  }
});

app.post("/api/chat/get-latest-session", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const token = await getAccessToken();
    const requestUrl = `${AGENT_ENGINE_BASE_URL}:query`;

    const payload = {
      class_method: "async_list_sessions",
      input: {
        user_id: userId,
      },
    };

    const response = await axios.post(requestUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Something went wrong with /api/chat/get-latest-session: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/chat/get-history", async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const token = await getAccessToken();
    const requestUrl = `${AGENT_ENGINE_BASE_URL}:query`;

    const payload = {
      class_method: "async_get_session",
      input: {
        user_id: userId,
        session_id: sessionId,
      },
    };

    const response = await axios.post(requestUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Something went wrong with /api/chat/get-history: ", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
