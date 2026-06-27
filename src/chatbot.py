from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM

# Load Embedding Model
embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)

# Load Vector Database
db = Chroma(
    persist_directory="vector_db",
    embedding_function=embedding_model
)

# LLM
llm = OllamaLLM(
    model="llama3:8b",
    base_url="http://localhost:11434"
)

print("\n" + "=" * 60)
print("Knowledge Assistant Ready!")
print("Type 'exit' to quit.")
print("=" * 60 + "\n")

while True:

    question = input("You: ")

    # Exit condition
    if question.lower().strip() == "exit":
        print("\nGoodbye!")
        break

    # Empty question check
    if not question.strip():
        print("\nBot:")
        print("Please enter a question.")
        print("\n" + "=" * 60 + "\n")
        continue

    # Greeting handling
    greetings = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening"
    ]

    if question.lower().strip() in greetings:
        print("\nBot:")
        print("Hello! How can I assist you today?")
        print("\n" + "=" * 60 + "\n")
        continue

    # Thanks handling
    thanks = [
        "thanks",
        "thank you",
        "thx"
    ]

    if question.lower().strip() in thanks:
        print("\nBot:")
        print("You're welcome! Let me know if I can help with anything else.")
        print("\n" + "=" * 60 + "\n")
        continue

    # Similarity Search with Relevance Score
    results = db.similarity_search_with_relevance_scores(
        question,
        k=5
    )

    # If no relevant information found
    if not results or results[0][1] < 0.5:
        print("\nBot:")
        print("I'm unable to answer that question at the moment.")
        print("\n" + "=" * 60 + "\n")
        continue

    docs = [doc for doc, score in results]

    context = "\n\n".join(
        [doc.page_content for doc in docs]
    )

    prompt = f"""
You are a professional AI assistant.

Rules:

- Answer ONLY using the information provided.
- Never mention:
  - context
  - document
  - documents
  - knowledge base
  - source
  - provided information
- Never explain where the information came from.
- Never explain why an answer is unavailable.
- Never suggest alternative questions.

- Answer naturally and professionally.

- If the question asks for:
  • objectives
  • pillars
  • achievements
  • challenges
  • phases
  • governance
  • timeline
  • initiatives
  then explain EACH point in 1–2 concise sentences instead of only listing headings.

- Use bullet points whenever multiple items are involved.

- Use numbered lists only when describing a sequence or process.

- Do not omit relevant information if it is available.

- Keep explanations informative but not overly lengthy.

- If information is unavailable, respond exactly with:

I'm unable to answer that question at the moment.

Information:
{context}

Question:
{question}

Answer:
"""

    response = llm.invoke(prompt)

    print("\nBot:")
    print(response)
    print("\n" + "=" * 60 + "\n")