---
title: RAG 入門：讓 LLM 先查資料再回答
description: 大型語言模型會幻覺、知識有截止日、讀不到公司內部文件。RAG 的做法是先檢索相關文件，再把它們交給模型生成答案。這篇整理基本架構、一份 LangChain 範例，以及加上自我檢查的 Adaptive RAG。
date: 2026-11-20
category: ai
tags: [AI, LLM, RAG, LangChain]
translationKey: rag-basics
---

## LLM 的四個限制

大型語言模型（LLM）用大量網路資料訓練，在多數 NLP 任務上表現很好，也記得很多知識。但直接拿來回答問題，會碰到下面這些問題：

| 問題 | 說明 |
| --- | --- |
| 幻覺（Hallucination） | 訓練資料沒涵蓋到的領域，或模型理解錯問題時，可能會編出看似合理、實際上錯誤的答案。 |
| 知識有截止日 | 模型的知識來自訓練資料，沒有重新訓練就停在那個時間點。例如 GPT-4o 的知識截止日是 2023 年 10 月。 |
| 讀不到私有資料 | 模型沒看過公司的文件、知識庫和資料庫，自然無法根據它們回答。 |
| 上下文長度有限 | 一次能讀的 token 數有上限（GPT-4o 是 128k tokens）。就算上限夠大，把整份文件庫塞進去也很貴、很慢。 |

RAG（Retrieval-Augmented Generation，檢索增強生成）就是為了解決這些問題。核心概念是：**生成答案之前，先根據使用者的問題去資料庫或知識庫檢索（Retrieval）相關文件，把找到的內容當作上下文（Context）交給 LLM，讓它根據這些內容生成（Generation）答案。** 這個名稱來自 Lewis 等人在 2020 年發表的論文。

## 一次問答的流程

1. 使用者輸入一個自然語言問題。
2. 系統用 embedding model 把問題轉成向量，跟向量資料庫裡每份文件的向量計算語意相似度（通常用 cosine similarity）。
3. 取出相似度最高的 `top_k` 份文件。`top_k` 是重要的超參數：取太少可能漏掉答案，取太多會增加 token 成本，也可能混進不相關的內容。
4. 把問題和這些文件組成 prompt，交給 LLM 生成答案。

## 基本架構

一個典型的 RAG 系統分成兩個階段。

### 1. Indexing（建立索引）

把文件轉成向量並存起來，通常是事先離線做好：

- **Load（載入）**：資料來源可能是 HTML、TXT、PDF 等格式，要用對應的工具把它們統一轉成文字。
- **Split（切分）**：常見的切法有依長度（token 或字元數）、依文字結構（段落、句子）、依文件結構（HTML、Markdown、JSON 的階層），以及依語意（把語意相近的句子放在同一塊）。要切分的原因有三個：
  - **模型的輸入有上限**：embedding model 和 LLM 都有輸入長度限制，整份文件可能太大塞不進去。
  - **向量品質比較好**：一段很長的文字壓成一個向量，會因為包含太多主題而變得模糊。切小之後，每個向量代表的內容比較集中，檢索也比較準。
  - **節省計算資源**：處理小區塊比較省記憶體。
- **Embed（向量化）**：用 embedding model 把每個區塊轉成向量。
- **Store（儲存）**：把向量存起來，可以放在記憶體（例如 LangChain 的 `InMemoryVectorStore`），或放進向量資料庫（例如 Chroma、PostgreSQL 的 pgvector）。

### 2. Retrieval and generation（檢索與生成）

這是實際提供服務的部分：收到使用者的問題後，從索引中檢索相關資料，再連同問題一起交給模型生成答案。

## 實作範例

下面的程式改寫自 LangChain 官方的 RAG 教學：讀取一篇部落格文章、切塊、存進記憶體中的向量庫，再用 LangGraph 串起「檢索 → 生成」兩個步驟。模型用的是 Azure OpenAI，端點和金鑰從環境變數讀取，不要寫死在程式碼裡。

```python
import os
os.environ.setdefault("USER_AGENT", "rag-demo")  # WebBaseLoader 會用這個值當 User-Agent

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

# 載入文章並切塊
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

# 建立索引
_ = vector_store.add_documents(documents=all_splits)

# 問答用的 prompt
prompt = ChatPromptTemplate.from_template(
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer the question. "
    "If you don't know the answer, just say that you don't know. "
    "Use three sentences maximum and keep the answer concise.\n"
    "Question: {question}\nContext: {context}\nAnswer:"
)

# 流程中傳遞的狀態
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str

# 兩個步驟：檢索、生成
def retrieve(state: State):
    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}

def generate(state: State):
    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}

# 組成流程並測試
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()

response = graph.invoke({"question": "What is Task Decomposition?"})
print(response["answer"])
```

幾個說明：

- `chunk_size=1000, chunk_overlap=200` 表示每塊約 1000 個字元，相鄰兩塊重疊 200 個字元，避免一句話剛好被切斷、兩邊都檢索不到。
- `similarity_search` 預設回傳 4 份文件，也就是 `top_k = 4`，可以用 `k=` 參數調整。
- 舊版教學用 `from langchain import hub` 和 `hub.pull("rlm/rag-prompt")` 下載 prompt。LangChain 1.0 之後 `hub` 搬到 `langchain-classic` 套件，而且已標示為棄用，所以這裡直接把同樣內容的 prompt 寫在程式裡。

## 進階：加上自我檢查的 Adaptive RAG

基本的 RAG 有兩個弱點：檢索到的文件可能不相關，模型也可能沒照著文件回答。進階做法是讓 LLM 自己檢查檢索和生成的品質，不合格就重來。LangGraph 的 Adaptive RAG 範例結合了兩個想法：**查詢分析**（Adaptive-RAG），以及**自我修正的 RAG**（Self-RAG、Corrective RAG）。

### 1. 查詢分析：決定要用什麼工具

先建立一個 router。router 本身也是一個 LLM，負責判斷這個問題該用哪個工具回答，它的系統提示可能像這樣：

```text
You are an expert at routing a user question to a vectorstore or web search.
The vectorstore contains documents related to agents, prompt engineering, and adversarial attacks.
Use the vectorstore for questions on these topics. Otherwise, use web-search.
```

在 Cohere 版的範例中，router 有三個選擇：向量資料庫、網路搜尋，以及不用任何工具、直接讓 LLM 回答。

### 2. 用三個評分器檢查品質

再用 LLM 建立三個評分器，每個都只回答「是」或「否」：

- **Retrieval Grader（檢索評分器）**
  - 提示：你是一名評分員，負責評估檢索到的文件與使用者問題是否相關。如果文件包含與問題相關的關鍵字或語意，就評為相關。用「是」或「否」表示文件是否與問題相關。
  - 用途：過濾掉檢索回來但不相關的文件。
- **Hallucination Grader（幻覺評分器）**
  - 提示：你是一名評分員，負責評估 LLM 的回答是否有檢索到的文件作為根據。用「是」或「否」表示，「是」代表答案有文件支持。
  - 用途：確認 LLM 是根據文件回答，而不是自己編造。
- **Answer Grader（答案評分器）**
  - 提示：你是一名評分員，負責評估答案是否解決了問題。用「是」或「否」表示，「是」代表答案解決了問題。
  - 用途：確認回答真的有回應使用者的提問。

### 整體流程

以 Cohere 版的範例為例：

1. router 判斷問題要走向量資料庫、網路搜尋，還是不用工具直接回答（直接回答就到此結束）。
2. 走向量資料庫時，先檢索，再用 Retrieval Grader 過濾掉不相關的文件。如果一份相關的都沒有，就改用網路搜尋。
3. 用留下來的文件（或網路搜尋的結果）生成答案。
4. Hallucination Grader 檢查答案是否有文件支持，沒有的話重新生成。
5. Answer Grader 檢查答案是否回應了問題，沒有的話改用網路搜尋再生成一次。

LangGraph 官方教學的版本稍有不同：一份相關文件都沒有時，會先改寫問題、重新檢索。實際的程式結構比較繁雜，搭配範例程式碼看會比較好懂，連結在下面的參考資料。

## 參考資料

- Lewis et al.，〈[Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)〉，2020
- LangChain，〈[LangChain v1 migration guide](https://docs.langchain.com/oss/python/migrate/langchain-v1)〉（`hub` 搬到 `langchain-classic`）
- LangGraph，〈[Adaptive RAG](https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_adaptive_rag/)〉；[Cohere 版範例 notebook](https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_adaptive_rag_cohere.ipynb)
- Jeong et al.，〈[Adaptive-RAG](https://arxiv.org/abs/2403.14403)〉；Asai et al.，〈[Self-RAG](https://arxiv.org/abs/2310.11511)〉；Yan et al.，〈[Corrective RAG](https://arxiv.org/abs/2401.15884)〉
- OpenAI，〈[GPT-4o model page](https://developers.openai.com/api/docs/models/gpt-4o)〉（知識截止日與上下文長度）
