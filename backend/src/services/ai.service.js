import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain"
import * as z from "zod"
import { searchinternet } from "../services/internet.service.js";
import { sendEmail as sendEmailService } from "./mail.service.js";
import { queryVectorStore } from "./vectorstore.services.js";
import { ChatGroq } from "@langchain/groq"

const Chatgroq = new ChatGroq({
  apiKey: process.env.CHATGROQ_API_KEY,
  model: "qwen/qwen3.6-27b",
  temperature: 0,
  timeout: 60000,


})

const geminimodel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-2.5-flash",
  timeout: 60000,
});

const mistralmodel = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY,
  model: "mistral-large-latest",
  timeout: 60000,
})

const searchInternetTool = tool(
  searchinternet,
  {
    name:"searchInternet",
    description: `
Search the internet for current, recent, latest, or real-world information.

USE THIS TOOL whenever the user asks about information that may have changed or requires live web data.

Examples:
- today's news
- latest news
- current date or time
- current Prime Minister or other officials
- current company CEOs
- latest software/library/API versions
- current prices or exchange rates
- current weather
- current sports results
- recent events or announcements
- latest updates about a company, product, technology, or person
- any question containing today, now, current, latest, recent, or similar time-sensitive wording

If the answer could be outdated from your internal knowledge, use this tool first.

Do NOT use this tool for stable general knowledge such as:
"What is React?"
"What is JWT?"
"What is MongoDB?"

If the user explicitly asks to search the internet, ALWAYS use this tool.

After calling the tool, answer using the returned search results. Never invent information that was not found.
`,

    schema: z.object({
      query: z.string().describe(
        "The exact information to search for on the internet."
      )
    })
  }
);
// const sendemail = tool(
//   sendEmail,
//   {
//     name: "sendEmail",

//     description: `
// Send an email immediately whenever the user explicitly asks to send an email.

// The user's request is authorization to send the email. Never ask for confirmation before sending.

// The user can provide any combination of recipient, subject, content, topic, or purpose.

// Rules:
// 1. If the user explicitly asks to send an email, call this tool immediately.
// 2. If the user provides only the recipient and a topic/purpose, generate a suitable subject and email content yourself, then send it.
// 3. If the user provides a recipient and subject but no body, generate the body yourself based on the subject, then send it.
// 4. If the user provides recipient, subject, and body, use the provided information and send it.
// 5. If the user provides a recipient and instructions about what to say, generate a suitable subject and complete email content yourself.
// 6. Handle any type of email request: meetings, birthday wishes, job applications, follow-ups, leave requests, reminders, invitations, professional emails, personal emails, announcements, etc.
// 7. Do not ask "Should I send it?", "Do you want me to send it?", or any other confirmation question.
// 8. Do not merely draft the email when the user explicitly asks to send it. Actually call this tool.
// 9. Only ask a clarification if the recipient email address is genuinely missing or ambiguous and cannot be determined.
// 10. Generate both HTML and plain-text versions of the email when they are not provided by the user.

// Examples:

// User: "Send an email to rahul@example.com about tomorrow's meeting"
// Action: Generate subject and email body, then call this tool immediately.

// User: "Send email to rahul@example.com, subject is Meeting Tomorrow"
// Action: Generate the email body, then call this tool immediately.

// User: "Send an email to rahul@example.com saying the meeting is at 10 AM"
// Action: Generate a suitable subject and email body, then call this tool immediately.

// User: "Send birthday wishes to rahul@example.com"
// Action: Generate subject and birthday message, then call this tool immediately.

// User: "Send this email to rahul@example.com: The meeting has been moved to 3 PM"
// Action: Generate a suitable subject, preserve the intended message, generate HTML/plain text, then call this tool immediately.

//    IMPORTANT EMAIL FORMATTING RULES:

// - The html field must contain valid HTML.
// - Never put literal \n or \n\n characters/sequences in the HTML output.
// - Never return HTML insidehtml ... code fences.
// - Never wrap the entire HTML content in quotes.
// - Use <p>, <br>, <strong>, <h1>, etc. for formatting.
// - The  text field must contain normal plain text with real line breaks.
// - Do not use escaped newline sequences such as \n as visible content. `

// ,

//     schema: z.object({
//       to: z.string()
//         .email()
//         .describe("The recipient's email address. Required to send the email."),

//       subject: z.string()
//         .describe("Email subject. Generate an appropriate subject from the user's request if the user did not provide one."),

//       html: z.string()
//         .describe(`
// Complete HTML email body.

// Generate REAL HTML, not escaped text.

// Use HTML tags such as:
// <p>...</p>
// <br>
// <strong>...</strong>
// <h2>...</h2>

// DO NOT output literal escape sequences such as \\n, \\n\\n, or \\r\\n inside the HTML.

// Do not wrap the HTML in quotation marks or markdown code fences.
// `),

//       text: z.string()
//         .describe(`
// Plain-text version of the email.

// Use actual line breaks, not the literal characters \\n or \\r\\n.
// Do not wrap the content in quotation marks.
// `)
//     })
//   }
// );

const sendEmail = tool(
  sendEmailService,
  {
    name:"sendEmail",

    description: `
Send an email immediately when the user explicitly asks to send one.

Rules:
1. Never ask for confirmation before sending.
2. If subject or body is missing, generate them from the user's request.
3. Handle all types of emails such as professional, personal, meetings, birthdays, applications, reminders, invitations, etc.
4. If the user provides the email content, preserve its intended meaning.
5. Generate both HTML and plain-text versions when not provided.
6. Only ask for clarification if the recipient email is missing or unclear.
7. When the user asks to send an email, actually call this tool instead of only drafting it.

Email formatting:
- html must contain valid HTML.
- Do not use literal \\n or \\n\\n inside html.
- Do not use markdown code fences or wrap HTML in quotes.
- Use HTML tags such as <p>, <br>, <strong>, and <h2>.
- text must be normal plain text with actual line breaks.
`,

    schema: z.object({

      to: z.string()
        .email()
        .describe(
          "Recipient email address. Required."
        ),

      subject: z.string()
        .describe(
          "Email subject. Generate one if the user did not provide it."
        ),

      html: z.string()
        .describe(`
Valid HTML email body.
Generate it yourself if the user does not provide HTML.
Do not use literal \\n, \\n\\n, or \\r\\n.
Do not use markdown code fences or quotes.
Use HTML tags such as <p>, <br>, <strong>, and <h2>.
`),

      text: z.string()
        .describe(`
Plain-text email body.
Generate it yourself if not provided.
Use actual line breaks, not literal \\n or \\r\\n.
`)
    })
  }
);


// ye mere wala hia 
// function createSearchDocumentTool(chatId) {
//   return tool(
//     async ({ query }) => {
//       const results = await queryVectorStore(chatId, query, 4);
//       if (!results.length) {
//         return "No relevant information found in the uploaded document.";
//       }
//       return results.map(r => `[${r.source}] ${r.text}`).join("\n\n");
//     },
//     {
//       name: "searchDocument",
//       description:
//         "Use this tool to search inside the PDF document(s) the user uploaded in this chat, whenever the question could relate to that document's content.",
//       schema: z.object({
//         query: z.string().describe("The search query to look up in the uploaded document."),
//       }),
//     }
//   );
// }

function createSearchDocumentTool(chatId) {
  return tool(
    async ({ query }) => {
      console.log("🔎 searchDocument CALLED");
      console.log("chatId:", chatId);
      console.log("query:", query);

      const results = await queryVectorStore(chatId, query, 4);

      console.log("📄 searchDocument RESULTS:", results);

      if (!results.length) {
        return "No relevant information found in the uploaded document.";
      }

      return results
        .map(r => `[${r.source}] ${r.text}`)
        .join("\n\n");
    },
    {
      name: "searchDocument",
      description: `
You are the document search tool.

IMPORTANT:
If a document/PDF has been uploaded in the current chat, use this tool whenever
the user's question could possibly be answered from that document.

The user does NOT need to say "PDF", "document", "uploaded", or "file".

For example, if the user says:
- give me the phone number
- what is his email
- what are the skills
- what technologies are mentioned
- what is his experience
- what is written there
- summarize it
- tell me the address
- who is the candidate

and the answer could be inside the uploaded document, ALWAYS call this tool FIRST.

Do NOT tell the user to upload the PDF if a document may already exist in this chat.
Do NOT answer from your own knowledge.
Search the document first and use the returned content to answer.

Search query should describe what information the user is asking for.
`,
      schema: z.object({
        query: z
          .string()
          .describe("The search query to look up in the uploaded document."),
      }),
    }
  );
}

const agentCache = new Map();

function getAgentForChat(chatId) {
  const key = chatId?.toString() || "no-chat";
  if (agentCache.has(key)) return agentCache.get(key);
  const searchDocument = createSearchDocumentTool(chatId);
const tools = [
  searchInternetTool,
  sendEmail,
  searchDocument
];

  console.log("🛠️ AGENT TOOLS:", tools.map(t => t.name));

  // if (chatId) tools.push(createSearchDocumentTool(chatId));

  const agent = createAgent({ model: Chatgroq, tools });
  agentCache.set(key, agent);
  return agent;
}

export function invalidateAgentCache(chatId) {
  agentCache.delete(chatId?.toString());
}

export async function generateresponse(messages, chatId) {
  console.log(messages);

  const agent = getAgentForChat(chatId);

  const formattedMessages = await Promise.all(
    messages.map(async (msg) => {
      if (msg.role === "user") {
        if (msg.imageurl) {
          const imageResponse = await fetch(msg.imageurl);
          const buffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${base64}`;

          return new HumanMessage({
            content: [
              { type: "text", text: msg.content || "Describe the Image." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          });
        }
        return new HumanMessage(msg.content);
      } else if (msg.role === "ai") {
        return new AIMessage(msg.content);
      }
    })
  );

  const response = await agent.invoke({
    messages: [
      new SystemMessage(`
You are a helpful and precise assistant.

If you don't know the answer, say "I don't know".

you are created by Abhishek kumar a Full stack developer Student at CT Institute of Technology and Research.

IF anyone ask to send and email or email send to sendemail tool activate and send the email to the recipient.

If the question requires up-to-date information (current date, time, weather, latest news, sports scores, stock prices, gold prices, exchange rates, or any live information), ALWAYS use the "searchInternet" tool before answering.

If the user's question could relate to a document they uploaded in this chat, ALWAYS use the "searchDocument" tool first to check for relevant content before answering.

Never guess current information. Always use the tool first and answer using the tool results.
`),

      ...formattedMessages,
    ],
  });

  console.dir(response, { depth: null });

  return response.messages[response.messages.length - 1].content;
}


// thsi si working with mistral and gemini model
// export async function genratechattitle(message) { 
//   const response = await Chatgroq.invoke([ 
//     new SystemMessage(`you are helpful assistant that generates concise and descriptive titlesfor chat conversations. User will provide you wuth first message of a chat convesation and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear , relevant , and engaging giving users a quick undestanding of the chat's topic `), 
//     new HumanMessage(`Generate a title for a chat conversation based on the following first message :"${message} "`) 
//   ]) 
//   return response.content 
// }

export async function genratechattitle(message) {
  const response = await Chatgroq.invoke([
    new SystemMessage(`
      Generate a concise and descriptive title for the conversation.

      Rules:
      - Return ONLY the title.
      - Use 2-4 words.
      - Do not explain anything.
      - Do not include reasoning.
      - Do not include <think> tags.
    `),
    new HumanMessage(
      `Generate a title based on this first message: "${message}"`
    )
  ]);

  let title = response.content.toString();

  // Remove <think>...</think>
  title = title.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  return title;
}