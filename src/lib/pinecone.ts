import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document, RecursiveCharacterTextSplitter} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import md5 from 'md5'
import { Vector } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/db_data";
import { convertToAscii } from "./utils";

export const getPineconeClient = () => {
    return new Pinecone({
      apiKey: process.env.PINCONE_API_KEY!,
    });
};

type PDFPage = {
    pageContent: string;
    metadata: {
      loc:{pageNumber: number}
    }
};

export async function loadS3intoPinecone(file_key: string) {
    console.log("Loading S3 file into Pinecone"); 
    const file_name = await downloadFromS3(file_key);
    if (!file_name) {
        throw new Error("could not download from s3");
    }
    console.log("loading pdf into memory" + file_name);
    try {
        const loader = new PDFLoader(file_name);
        const pages = (await loader.load()) as PDFPage[];
        console.log("PDF loaded into memory", pages.length);

        const documents = await Promise.all(pages.map(prepareDocument));
        const vectors = await Promise.all(documents.flat().map(embedDocument));  

        const client = getPineconeClient();
        const pineconeIndex = client.Index('chatpdf');

        console.log('adding vectors to pinecone');
        const namespace = convertToAscii(file_key);
        await chunkedUpsert(pineconeIndex, vectors, namespace, 10);

        return documents[0];
    } catch (pdfError) {
        console.error("Error loading PDF:", pdfError);
        throw new Error("Failed to process PDF");
    }
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent);
        const hash = md5(doc.pageContent);

        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }
        } as Vector;
    } catch (error) {
        console.log('error embedding documents', error);
        throw error;
    }
}

export const truncateStringByBytes = (str: string, length: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, length));
};

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/(\r\n|\n|\r)/gm, " ");
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ]);
    return docs;
}

async function chunkedUpsert(pineconeIndex: any, vectors: Vector[], namespace: string, batchSize: number) {
    const chunkArray = (arr: any[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

    const chunks = chunkArray(vectors, batchSize);
    for (const [i, chunk] of chunks.entries()) {
        console.log(`Upserting batch ${i + 1}/${chunks.length}...`);
        await pineconeIndex.upsert({ vectors: chunk, namespace });
    }
    console.log("All vectors upserted successfully!");
}
