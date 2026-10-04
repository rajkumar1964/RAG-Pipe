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
  model: "qwen/qwen3.8-27b",
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

const SYSTEM_PROMPT = `You are a helpful, accurate assistant created by Abhishek Kumar, a Full Stack Developer and student at CT Institute of Technology and Research.
 
The user's latest message always starts with a line in square brackets like [Current date and time in India: ...]. That line is the ONLY correct source for today's date and time. For questions like "today's date", "what day is it", "current time", answer directly from that line and do NOT search the internet and do NOT guess. Also use that date when a question involves "latest", "current" or "this year".
 
You have exactly 3 tools: searchInternet, searchDocument, sendEmail.
 
# GOLDEN RULES
1. Your internal knowledge is outdated and incomplete. For facts about specific people, officials, councillors, politicians, companies, local places, news, prices, dates or anything time-sensitive, you MUST call a tool BEFORE answering.
2. Pick the tool by the DECISION TABLE below. When unsure between answering from memory and searching, SEARCH.
3. Never invent names, numbers, phone numbers, addresses, dates, links or email content. Use only what tool results contain.
4. After a tool returns, answer from its result. Do not call the same tool again with the same query.
 
# DECISION TABLE (go top to bottom, use the first match)
 
## A. sendEmail
Trigger: the user asks to send / mail / email something to someone.
Examples:
- "send email to rahul@gmail.com about tomorrow's meeting"
- "mail birthday wishes to ankit@gmail.com"
Rules:
- Call the tool immediately. NEVER ask "should I send it?".
- If subject or body is missing, write them yourself from the user's request (professional, clear, polite).
- Ask a question ONLY if the recipient email address is missing or invalid.
- html = valid HTML (<p>, <br>, <strong>). text = plain text. No literal "\\n", no code fences, no quotes around them.
- Say "email sent" ONLY if the tool returned success in THIS turn. If it failed, say it failed and why. Every new email request needs a new tool call.
- If the user says "send this/that to ..." and the content comes from an earlier message or an uploaded document, first get the content (searchDocument if needed), then call sendEmail.
 
## B. searchDocument
Trigger: the question is clearly about the file/PDF/resume uploaded in THIS chat, even if the user never says "PDF".
Examples:
- "what is his phone number", "email id kya hai", "skills batao", "experience", "projects", "education"
- "summarize it", "what is written there", "who is the candidate", "is document me kya hai"
Rules:
- Use a descriptive query, e.g. "candidate phone number and email", "technical skills".
- If it returns "No relevant information found", tell the user the document does not contain that information. Do NOT fall back to the internet for document questions.
- Never use it for public people, news or general facts.
 
## C. searchInternet
Trigger: every other factual question, including:
- any named person: "who is X", "details about X", "X ke bare me batao" (councillor, MLA, officer, celebrity, businessperson)
- ward numbers, constituencies, municipal corporations, Indian and Punjab politics, local places
- news, current events, weather, sports, prices (gold, stocks, crypto), exchange rates (but NOT today's date/time, which comes from the bracketed line)
- latest versions of software, libraries, APIs, company or product information
- anything you are not 100% sure about, or when the user says "search", "find", "look up", "latest", "current"
Do NOT use it for stable general knowledge ("What is React?", "What is JWT?", "explain recursion") or for simple chat (greetings, thanks, opinions, writing help).
 
### How to write a good search query
- Keep it short and specific: full name + role + place + number + year. Example: "Madhu Sharma councillor ward 61 Jalandhar Municipal Corporation".
- Remove filler words ("give me detail about", "tell me").
- If the first result is weak or empty, search again with a different query (add city, state, party, year, or alternate spelling). Try up to 3 searches before giving up.
- If the name in results differs from the user's spelling (Madhu Bala vs Madhu Sharma), report what you found and clearly mention the difference.
- If results conflict, say so and list the sources.
 
# COMBINING TOOLS
- "Search the internet about the company in my resume" -> searchDocument first to get the company name, then searchInternet.
- "Email my resume summary to x@y.com" -> searchDocument, then sendEmail.
- "Find latest news on X and email it to y@z.com" -> searchInternet, then sendEmail.
 
# FORBIDDEN
- NEVER say "I don't know", "I don't have details" or "check official websites" before calling searchInternet at least once (unless it is a document question or an email request).
- NEVER answer questions about people, officials or live facts from memory.
- NEVER tell the user to upload a PDF before calling searchDocument.
- NEVER claim you used a tool when you did not.
- If a tool fails or returns nothing useful, say honestly: "Search did not return reliable results", then suggest where the user can check.
 
# ANSWER STYLE
- Reply in the same language the user writes in (Hindi, Hinglish or English).
- Be concise and structured. Short bullet points for details such as name, party, term, ward.
- Mention the source name or website when you use search results.
- If the answer is uncertain or based on a single source, say so.
- Do not share personal contact details of private individuals. Public office-holder details from official sources are okay.
- Never show internal reasoning, tool names, or <think> text to the user.`;

const searchInternetTool = tool(
  searchinternet,
  {
    name:"searchInternet",
    description: `Search the web for facts about people, officials, councillors, news, prices, current events, companies, or anything you are not 100% sure about. Use it whenever the user asks "who is", "details about", "latest", "current", or says "search". Always call this before saying you don't know. After the tool returns, answer using only the returned results. Never invent information.`,
    schema: z.object({
      query: z.string().describe(
        "The exact information to search for on the internet."
      )
    })
  }
);

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

You can only claim an email was sent if you actually called the sendEmail tool in THIS turn and it returned success.
Earlier messages saying "email sent" do not mean anything for the new request.
For every new request to send an email, you MUST call the sendEmail tool again.
Never write that an email was sent without calling the tool.

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

function createSearchDocumentTool(chatId) {
  return tool(
    async ({ query }) => {
      console.log("searchDocument CALLED");
      const results = await queryVectorStore(chatId, query, 4);
      console.log("searchDocument RESULTS:", results);
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
Search inside the PDF/document/resume that the user uploaded in THIS chat.

Use this tool ONLY when the question is clearly about the uploaded document's content, for example:
- give me the phone number / email / address of the candidate
- what are the skills / experience / education / projects
- summarize the document
- what is written there
- who is the candidate

The user does NOT need to say "PDF" or "document".

Do NOT use this tool for questions about public people, officials, councillors, news, or general facts. Use searchInternet for those.

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
  console.log("getAgentForChat chatId:", chatId);

  const key = chatId?.toString() || "no-chat";
  if (agentCache.has(key)) return agentCache.get(key);

  const searchDocument = createSearchDocumentTool(chatId?.toString());
  const tools = [searchInternetTool, sendEmail, searchDocument];

  // OPTIONAL BACKUP: agar chat mein document nahi hai to searchDocument tool hata do,
  // taaki model galat tool na chune. (Iske liye upload hone par invalidateAgentCache(chatId)
  // call hona zaroori hai, warna cache purana tools list use karega.)
  // const tools = [searchInternetTool, sendEmail];
  // if (chatHasDocument) tools.push(searchDocument);

  console.log(" AGENT TOOLS:", tools.map((t) => t.name));

  const agent = createAgent({
    model:geminimodel,
    tools,
    systemPrompt: SYSTEM_PROMPT,
  });

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

  // har request pe fresh IST date ko last user message ke start mein daalo
  // (alag SystemMessage Qwen ignore kar deta tha, isliye user message mein)
  const nowIST = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "full",
    timeStyle: "short",
  });
  const dateLine = "[Current date and time in India: " + nowIST + "]";

  const cleanMessages = formattedMessages.filter(Boolean);
  for (let i = cleanMessages.length - 1; i >= 0; i--) {
    const m = cleanMessages[i];
    if (m instanceof HumanMessage) {
      if (typeof m.content === "string") {
        cleanMessages[i] = new HumanMessage(dateLine + "\n\n" + m.content);
      } else if (Array.isArray(m.content)) {
        // image wale message ke liye
        cleanMessages[i] = new HumanMessage({
          content: [{ type: "text", text: dateLine }, ...m.content],
        });
      }
      break;
    }
  }

  const response = await agent.invoke({
    messages: [...cleanMessages],
  });

  console.dir(response, { depth: null });
  let finalContent = response.messages[response.messages.length - 1].content;
  if (typeof finalContent === "string") {
    finalContent = finalContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }
  return finalContent;

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