import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma

# Get the project root directory (one level up from this script's directory)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

# Construct absolute paths
doc_path = os.path.join(project_root, "docs", "sample_docs", "knowledge-assistant-platform_Knowledge_Base_v1.md")
vector_db_path = os.path.join(project_root, "vector_db")

loader = TextLoader(
    doc_path,
    encoding="utf-8"
)

documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100
)

chunks = splitter.split_documents(documents)

print(f"Chunks Created: {len(chunks)}")

embedding_model = FastEmbedEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)

print("Creating vector database...")

db = Chroma.from_documents(
    documents=chunks,
    embedding=embedding_model,
    persist_directory=vector_db_path
)

print("Vector DB created successfully!")