import os
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Allow all origins — covers Vercel preview URLs and production domain
CORS(app, origins="*")

# Global variables for models and database
embedding_model = None
db = None
llm = None

def init_models():
    global embedding_model, db, llm
    try:
        print("Initializing HuggingFace embeddings model...")
        embedding_model = HuggingFaceEmbeddings(
            model_name="BAAI/bge-small-en-v1.5"
        )

        vector_db_path = os.path.join(os.path.dirname(__file__), "vector_db")
        print(f"Loading Chroma vector DB from: {vector_db_path}")
        
        # Verify if the vector database exists
        if not os.path.exists(vector_db_path):
            print("WARNING: 'vector_db' directory not found. Please run 'src/create_embeddings.py' first.")
            
        db = Chroma(
            persist_directory=vector_db_path,
            embedding_function=embedding_model
        )

        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set.")

        print("Initializing Groq LLM (llama3-8b-8192)...")
        llm = ChatGroq(
            model="llama3-8b-8192",
            groq_api_key=groq_api_key,
            streaming=True
        )
        print("Models initialized successfully!")
    except Exception as e:
        print(f"Error during model initialization: {e}")

@app.route("/api/health", methods=["GET"])
def health_check():
    """Check the health status of the backend services."""
    db_loaded = db is not None
    llm_ready = llm is not None

    return jsonify({
        "status": "healthy" if (db_loaded and llm_ready) else "degraded",
        "database_loaded": db_loaded,
        "llm_ready": llm_ready,
        "llm_provider": "groq",
        "details": {
            "db_path": os.path.join(os.path.dirname(__file__), "vector_db"),
            "db_exists": os.path.exists(os.path.join(os.path.dirname(__file__), "vector_db"))
        }
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat requests from the frontend."""
    # Ensure database and model are initialized
    if db is None or llm is None:
        return jsonify({
            "response": "Backend services are not fully initialized yet. Please check if vector database and Ollama are ready."
        }), 503

    data = request.json or {}
    question = data.get("message", "").strip()

    if not question:
        return jsonify({"response": "Please enter a question."}), 400

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
        def stream_greeting():
            yield "Hello! How can I assist you today?"
        return Response(stream_greeting(), mimetype='text/plain')

    # Thanks handling
    thanks = [
        "thanks",
        "thank you",
        "thx"
    ]

    if question.lower().strip() in thanks:
        def stream_thanks():
            yield "You're welcome! Let me know if I can help with anything else."
        return Response(stream_thanks(), mimetype='text/plain')

    try:
        # Similarity Search with Relevance Score
        results = db.similarity_search_with_relevance_scores(
            question,
            k=5
        )

        # If no relevant information found
        if not results or results[0][1] < 0.5:
            def stream_unable():
                yield "I'm unable to answer that question at the moment."
            return Response(stream_unable(), mimetype='text/plain')

        docs = [doc for doc, score in results]
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"""
You are a professional AI assistant.

Rules:
- Answer only using the information provided.
- Never mention:
  - context
  - document
  - documents
  - knowledge base
  - source
  - provided information
- Never explain where information came from.
- Never explain why an answer is unavailable.
- Never suggest alternative questions.
- Use bullet points for lists.
- Use numbered points for processes.
- Keep answers concise and professional.
- If information is unavailable, respond exactly with:

I'm unable to answer that question at the moment.

Information:
{context}

Question:
{question}

Answer:
"""
        def generate():
            try:
                for chunk in llm.stream(prompt):
                    # ChatGroq yields AIMessageChunk objects; extract text content
                    yield chunk.content
            except Exception as e:
                print(f"Error during stream generation: {e}")
                yield f"\n[Error during generation: {str(e)}]"

        return Response(generate(), mimetype='text/plain')

    except Exception as e:
        print(f"Error processing chat request: {e}")
        return jsonify({
            "response": f"An error occurred while processing your request: {str(e)}"
        }), 500

if __name__ == "__main__":
    init_models()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
