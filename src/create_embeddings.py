import os

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# --------------------------------------------------------
# Paths
# --------------------------------------------------------

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

doc_path = os.path.join(
    project_root,
    "docs",
    "sample_docs",
    "knowledge-assistant-platform_Knowledge_Base_v1.md",
)

vector_db_path = os.path.join(
    project_root,
    "vector_db"
)

# --------------------------------------------------------
# Load Markdown
# --------------------------------------------------------

loader = TextLoader(
    doc_path,
    encoding="utf-8"
)

documents = loader.load()

markdown_text = documents[0].page_content

# --------------------------------------------------------
# STEP 1
# Split by Markdown Headers
# --------------------------------------------------------

headers_to_split_on = [
    ("#", "Title"),
    ("##", "Section"),
    ("###", "Subsection"),
]

markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=headers_to_split_on,
    strip_headers=False
)

header_docs = markdown_splitter.split_text(markdown_text)

print(f"Header Sections Created: {len(header_docs)}")

# --------------------------------------------------------
# STEP 2
# Split only large sections
# --------------------------------------------------------

recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=900,
    chunk_overlap=150,
    separators=[
        "\n### ",
        "\n## ",
        "\n\n",
        "\n",
        ". ",
        " ",
        ""
    ]
)

chunks = []

for doc in header_docs:

    smaller_docs = recursive_splitter.split_text(
        doc.page_content
    )

    for text in smaller_docs:

        chunks.append(
            Document(
                page_content=text,
                metadata=doc.metadata
            )
        )

print(f"Final Chunks Created: {len(chunks)}")

# --------------------------------------------------------
# Embeddings
# --------------------------------------------------------

embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)

print("Creating Vector Database...")

db = Chroma.from_documents(
    documents=chunks,
    embedding=embedding_model,
    persist_directory=vector_db_path
)

print("Vector Database created successfully!")