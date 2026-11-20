---
title: "RAG basics: letting an LLM look things up before it answers"
description: LLMs hallucinate, their knowledge has a cutoff date, and they can't see your internal documents. RAG retrieves relevant documents first and hands them to the model as context. This post covers the basic architecture, a LangChain example, and Adaptive RAG, which adds self-checks.
date: 2026-11-20
category: ai
tags: [AI, LLM, RAG, LangChain]
translationKey: rag-basics
---

## Four limits of LLMs

Large language models (LLMs) are trained on huge amounts of web data. They do well on most NLP tasks and carry a lot of knowledge. But if you ask one questions directly, you run into these problems:

| Problem | What it means |
| --- | --- |
| Hallucination | When a question falls outside the training data, or the model misreads it, the model may produce an answer that sounds plausible but is wrong. |
| Knowledge cutoff | The model only knows what was in its training data, so its knowledge stops at that point unless it is retrained. For example, GPT-4o's knowledge cutoff is October 2023. |
| No access to private data | The model has never seen your company's documents, knowledge base, or databases, so it can't answer from them. |
| Limited context length | There is a cap on how many tokens the model can read at once (128k for GPT-4o). Even when the cap is large enough, stuffing a whole document library into every request is slow and expensive. |

RAG (Retrieval-Augmented Generation) was designed to address these problems. The core idea: **before generating an answer, search a database or knowledge base for documents relevant to the user's question (retrieval), pass what you find to the LLM as context, and have it generate the answer from that content (generation).** The name comes from a 2020 paper by Lewis et al.

## The flow of one question

1. The user asks a question in natural language.
2. The system turns the question into a vector with an embedding model, then measures its semantic similarity to the vector of every document in the vector database (usually with cosine similarity).
3. It takes the `top_k` most similar documents. `top_k` is an important hyperparameter: too few and you may miss the answer; too many and you pay for more tokens and risk mixing in irrelevant content.
4. It combines the question and those documents into a prompt and asks the LLM to generate an answer.

## The basic architecture

A typical RAG system has two stages.

### 1. Indexing

Convert documents into vectors and store them. This is usually done ahead of time, offline:

- **Load**: Sources may be HTML, TXT, PDF, and so on. Use the right loader for each format to turn everything into plain text.
- **Split**: Common strategies split by length (tokens or characters), by text structure (paragraphs, sentences), by document structure (the hierarchy of HTML, Markdown, or JSON), or by meaning (keeping semantically similar sentences together). There are three reasons to split:
  - **Models have input limits**: Both embedding models and LLMs cap their input length, so a whole document may not fit.
  - **Better vectors**: When a long passage is squeezed into one vector, it covers too many topics and the vector gets blurry. Smaller chunks give more focused vectors and more accurate retrieval.
  - **Less compute**: Small chunks use less memory to process.
- **Embed**: Turn each chunk into a vector with an embedding model.
- **Store**: Save the vectors, either in memory (such as LangChain's `InMemoryVectorStore`) or in a vector database (such as Chroma or PostgreSQL with pgvector).

### 2. Retrieval and generation

This is the part that actually serves users: when a question comes in, retrieve relevant data from the index and pass it to the model along with the question.

## Example implementation

The code below is adapted from LangChain's official RAG tutorial. It loads a blog post, splits it into chunks, stores them in an in-memory vector store, and uses LangGraph to chain the "retrieve → generate" steps. It uses Azure OpenAI and reads the endpoint and key from environment variables, so nothing secret is hard-coded.

```python
import os
os.environ.setdefault("USER_AGENT", "rag-demo")  # WebBaseLoader sends this as its User-Agent

import bs4
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from typing_extensions import List, TypedDict

endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
api_key = os.environ["AZURE_OPENAI_API_KEY"]

llm = AzureChatOpenAI(
    azure_endpoint=endpoint,
    azure_deployment="gpt-4o",
    openai_api_version="2024-12-01-preview",
    api_key=api_key,
)
embeddings = AzureOpenAIEmbeddings(
    azure_endpoint=endpoint,
    azure_deployment="text-embedding-3-large",
    openai_api_version="2024-02-01",
    api_key=api_key,
)
vector_store = InMemoryVectorStore(embeddings)

# Load and chunk the contents of the blog post
loader = WebBaseLoader(
    web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(
            class_=("post-content", "post-title", "post-header")
        )
    ),
)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
all_splits = text_splitter.split_documents(docs)

# Index the chunks
_ = vector_store.add_documents(documents=all_splits)

# Prompt for question answering
prompt = ChatPromptTemplate.from_template(
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, just say that you don't know. "
    "Use three sentences maximum and keep the answer concise.\n"
    "Question: {question}\nContext: {context}\nAnswer:"
)

# State passed between the steps
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str

# Two steps: retrieve, then generate
def retrieve(state: State):
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}

def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}

# Build the graph and test it
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()

response = graph.invoke({"question": "What is Task Decomposition?"})
print(response["answer"])
```

A few notes:

- `chunk_size=1000, chunk_overlap=200` means each chunk is about 1,000 characters and neighboring chunks share 200 characters, so a sentence that straddles a boundary can still be found.
- `similarity_search` returns 4 documents by default, so `top_k = 4` here. Change it with the `k=` argument.
- Older tutorials fetched the prompt with `from langchain import hub` and `hub.pull("rlm/rag-prompt")`. Since LangChain 1.0, `hub` lives in the `langchain-classic` package and is marked deprecated, so this version writes the same prompt inline.

## Going further: Adaptive RAG with self-checks

Basic RAG has two weak spots: the retrieved documents may be irrelevant, and the model may not stick to them. A more advanced approach has the LLM check the quality of both retrieval and generation, and try again when either falls short. LangGraph's Adaptive RAG example combines two ideas: **query analysis** (from Adaptive-RAG) and **self-corrective RAG** (from Self-RAG and Corrective RAG).

### 1. Query analysis: choosing a tool

First, build a router. The router is itself an LLM that decides which tool should answer the question. Its system prompt might look like this:

```text
You are an expert at routing a user question to a vectorstore or web search.
The vectorstore contains documents related to agents, prompt engineering, and adversarial attacks.
Use the vectorstore for questions on these topics. Otherwise, use web-search.
```

In the Cohere version of the example, the router has three choices: the vector store, web search, or no tool at all, letting the LLM answer directly.

### 2. Three graders that check quality

Next, use an LLM to build three graders. Each one answers only "yes" or "no":

- **Retrieval grader**
  - Prompt: You are a grader assessing whether a retrieved document is relevant to a user question. If the document contains keywords or semantic meaning related to the question, grade it as relevant. Give a binary score, "yes" or "no", to indicate whether the document is relevant.
  - Purpose: Filter out retrieved documents that aren't relevant.
- **Hallucination grader**
  - Prompt: You are a grader assessing whether an LLM generation is grounded in, or supported by, the retrieved documents. Give a binary score, "yes" or "no". "Yes" means the answer is supported by the documents.
  - Purpose: Make sure the LLM answered from the documents instead of making things up.
- **Answer grader**
  - Prompt: You are a grader assessing whether an answer resolves a question. Give a binary score, "yes" or "no". "Yes" means the answer resolves the question.
  - Purpose: Make sure the answer actually addresses what the user asked.

### The full flow

In the Cohere version of the example:

1. The router decides whether the question goes to the vector store, to web search, or straight to the LLM with no tool (in which case the flow ends there).
2. For the vector store, retrieve first, then use the retrieval grader to drop irrelevant documents. If none are relevant, fall back to web search.
3. Generate an answer from the remaining documents (or the web search results).
4. The hallucination grader checks whether the answer is supported by the documents. If not, generate again.
5. The answer grader checks whether the answer addresses the question. If not, fall back to web search and generate again.

The official LangGraph tutorial differs slightly: when no relevant documents are found, it rewrites the question and retrieves again first. The real code is fairly involved and is easier to follow alongside the example notebook, linked in the references below.

## References

- Lewis et al., "[Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)", 2020
- LangChain, "[LangChain v1 migration guide](https://docs.langchain.com/oss/python/migrate/langchain-v1)" (`hub` moved to `langchain-classic`)
- LangGraph, "[Adaptive RAG](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_adaptive_rag/)"; [Cohere example notebook](https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_adaptive_rag_cohere.ipynb)
- Jeong et al., "[Adaptive-RAG](https://arxiv.org/abs/2403.14403)"; Asai et al., "[Self-RAG](https://arxiv.org/abs/2310.11511)"; Yan et al., "[Corrective RAG](https://arxiv.org/abs/2401.15884)"
- OpenAI, "[GPT-4o model page](https://developers.openai.com/api/docs/models/gpt-4o)" (knowledge cutoff and context length)
