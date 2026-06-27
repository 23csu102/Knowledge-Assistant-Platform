import os
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM

app = Flask(__name__)
CORS(app)  # Enable CORS to allow the frontend to access the API

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

        print("Initializing Ollama LLM (llama3:8b)...")
        llm = OllamaLLM(
            model="llama3:8b",
            base_url="http://localhost:11434"
        )
        print("Models initialized successfully!")
    except Exception as e:
        print(f"Error during model initialization: {e}")

@app.route("/api/health", methods=["GET"])
def health_check():
    """Check the health status of the backend services."""
    db_loaded = db is not None
    ollama_ok = False
    
    # Try calling Ollama's local status API
    try:
        response = requests.get("http://localhost:11434", timeout=2)
        if response.status_code == 200:
            ollama_ok = True
    except Exception:
        pass

    return jsonify({
        "status": "healthy" if (db_loaded and ollama_ok) else "degraded",
        "database_loaded": db_loaded,
        "ollama_connected": ollama_ok,
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
            k=10
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
- Give complete answers whenever the question asks for an explanation, summary, achievements, objectives, challenges, or comparison.
- Include all relevant points available in the information.
- Use bullet points for multiple items.
- Keep the response clear and well-structured rather than unnecessarily brief.
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
                    yield chunk
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
    app.run(host="127.0.0.1", port=5000, debug=True)
