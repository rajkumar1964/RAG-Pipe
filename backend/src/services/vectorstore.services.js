// import { CloudClient } from "chromadb";
// import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";

// const client = new CloudClient({
//   apiKey: process.env.CHROMA_API_KEY,
//   tenant: process.env.CHROMA_TENANT,
//   database: process.env.CHROMA_DATABASE,
// });

// export async function testChroma() {
//   try {
//     console.log("Testing Chroma Cloud...");

//     const collection = await client.getOrCreateCollection({
//       name: "test_connection",
//     });

//     console.log("Chroma connected:", collection.name);
//   } catch (error) {
//     console.error("Chroma connection failed:", error);
//   }
// }

// await testChroma();
// const embedder = new GoogleGeminiEmbeddingFunction({
//   apiKey: process.env.GEMINI_API_KEY,
//   modelName: "gemini-embedding-001",
// });

// function collectionName(chatId) {
//   return `chat_${chatId}`;
// }

// export async function getOrCreateCollection(chatId) {
//   return client.getOrCreateCollection({
//     name: collectionName(chatId),
//     embeddingFunction: embedder,
//   });
// }

// export async function addChunksToVectorStore(chatId, chunks, sourceName) {
//   const collection = await getOrCreateCollection(chatId);

//   const ids = chunks.map((_, i) => `${sourceName}_${Date.now()}_${i}`);
//   const metadatas = chunks.map((_, i) => ({
//     source: sourceName,
//     chunkIndex: i,
//   }));

//   await collection.add({ ids, documents: chunks, metadatas });
//   return { added: chunks.length };
// }

// export async function queryVectorStore(chatId, query, k = 4) {
//   const collection = await getOrCreateCollection(chatId);

//   const results = await collection.query({
//     queryTexts: [query],
//     nResults: k,
//   });

//   const docs = results.documents?.[0] || [];
//   const metas = results.metadatas?.[0] || [];

//   return docs.map((text, i) => ({ text, source: metas[i]?.source }));
// }

// export async function deleteChatCollection(chatId) {
//   try {
//     await client.deleteCollection({ name: collectionName(chatId) });
//   } catch {}
// }

import { CloudClient } from "chromadb";
import { GoogleGeminiEmbeddingFunction } from "@chroma-core/google-gemini";

const client = new CloudClient({
  apiKey: process.env.CHROMA_API_KEY,
  tenant: process.env.CHROMA_TENANT,
  database: process.env.CHROMA_DATABASE,
});

const embedder = new GoogleGeminiEmbeddingFunction({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: "gemini-embedding-001",
});

function collectionName(chatId) {
  return `chat_${chatId}`;
}

export async function getOrCreateCollection(chatId) {
  return client.getOrCreateCollection({
    name: collectionName(chatId),
    embeddingFunction: embedder,
  });
}

export async function addChunksToVectorStore(chatId, chunks, sourceName) {
  const collection = await getOrCreateCollection(chatId);

  const ids = chunks.map((_, i) => `${sourceName}_${Date.now()}_${i}`);

  const metadatas = chunks.map((_, i) => ({
    source: sourceName,
    chunkIndex: i,
  }));

  await collection.add({
    ids,
    documents: chunks,
    metadatas,
  });

  return { added: chunks.length };
}

export async function queryVectorStore(chatId, query, k = 4) {
  const collection = await getOrCreateCollection(chatId);

  const results = await collection.query({
    queryTexts: [query],
    nResults: k,
  });

  const docs = results.documents?.[0] || [];
  const metas = results.metadatas?.[0] || [];

  return docs.map((text, i) => ({
    text,
    source: metas[i]?.source,
  }));
}

export async function deleteChatCollection(chatId) {
  try {
    await client.deleteCollection({
      name: collectionName(chatId),
    });
  } catch {}
}