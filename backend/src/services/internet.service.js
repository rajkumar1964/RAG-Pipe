// import { tavily as Tavily } from "@tavily/core"

// const tavily = Tavily({
//     apiKey: process.env.TAVILY_API_KEY,
// })


// export const searchinternet = async ({ query }) => {
//     const results = await tavily.search(query, {
//         maxResults: 5,
//     })

//     console.log(JSON.stringify(results))

//     return JSON.stringify(results)
// }

import { tavily as Tavily } from "@tavily/core"

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
})
export const searchinternet = async ({ query }) => {
  
    console.log("🌐 searchInternet CALLED:", query)

    try {
        const results = await tavily.search(query, {
            maxResults: 5,
        })

        console.log(JSON.stringify(results))

        return JSON.stringify(results)
    } catch (e) {
        console.error("❌ Tavily error:", e)
        return `Search failed: ${e.message}`
    }
}