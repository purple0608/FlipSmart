import json
import sys
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.prompts import PromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain

def process_pdf(pdf_path, question):
    google_api_key = os.getenv('GOOGLE_API_KEY')
    if not google_api_key:
        return json.dumps({"error": "Google API key is not set"})

    llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=google_api_key)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    loader = PyPDFLoader(pdf_path)
    text_splitter = CharacterTextSplitter(
        separator=".",
        chunk_size=1000,
        chunk_overlap=50,
        length_function=len,
        is_separator_regex=False,
    )
    pages = loader.load_and_split(text_splitter)

    vectordb = Chroma.from_documents(pages, embeddings)
    retriever = vectordb.as_retriever(search_kwargs={"k": 5})

    template = """
    You are a helpful AI assistant.
    Answer based on the context provided. 
    context: {context}
    input: {input}
    answer:
    """
    prompt = PromptTemplate.from_template(template)
    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)

    try:
        response = retrieval_chain.invoke({"input": question})
        return json.dumps({"messages": [{"text": response["answer"]}]})
    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    question = sys.argv[2]

    result = process_pdf(pdf_path, question)
    print(result)
