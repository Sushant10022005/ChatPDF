import {OpenAIApi, Configuration} from 'openai-edge'

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const apoenai = new OpenAIApi(config)

export async function getEmbeddings(text: string) {
    try {
        const response = await apoenai.createEmbedding({
            model: 'text-embedding-3-small',
            input: text.replace(/(\r\n|\n|\r)/gm, " ")
        })
        const result = await response.json()
        return result.data[0].embeddingas as number[];
    }
    catch (error) {
        console.log("Error getting embeddings", error)
        throw error
    }
}