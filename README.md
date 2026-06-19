#  Knowledge Assistant Platform

An AI-powered knowledge assistant that uses Retrieval-Augmented Generation (RAG) to answer questions from an internal knowledge base. Built with a Flask API backend, Ollama LLM inference, and a React (Vite) frontend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Setup Guide](#setup-guide)
5. [Running the Application](#running-the-application)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────┐       HTTP        ┌─────────────────┐      Ollama API     ┌──────────────┐
│   Frontend   │ ◄──────────────► │   Flask Backend  │ ◄─────────────────► │  Ollama LLM  │
│  (React/Vite)│   localhost:5173  │   (main.py)      │   localhost:11434   │  (llama3:8b)  │
└─────────────┘                   └────────┬────────┘                     └──────────────┘
                                           │
                                           │ Similarity Search
                                           ▼
                                  ┌─────────────────┐
                                  │   ChromaDB       │
                                  │  (vector_db/)    │
                                  └─────────────────┘
```

**Flow:**
1. User submits a question through the React frontend.
2. Flask backend performs a similarity search against the ChromaDB vector store.
3. Retrieved context is sent to the Ollama LLM (llama3:8b) with a structured prompt.
4. The response is streamed back to the frontend in real-time.

---

## Prerequisites

| Tool         | Version  | Download Link                                      |
|--------------|----------|----------------------------------------------------|
| Python       | ≥ 3.11   | https://www.python.org/downloads/                  |
| Node.js      | ≥ 18     | https://nodejs.org/                                |
| npm          | ≥ 9      | Included with Node.js                              |
| Ollama       | Latest   | https://ollama.com/download                        |
| Git          | Latest   | https://git-scm.com/downloads                      |

---

## Project Structure

```
Disha/
├── main.py                  # Flask API server (backend entry point)
├── requirements.txt         # Python dependencies
├── README.md                # This file
│
├── src/
│   ├── create_embeddings.py # Script to build the vector database
│   └── chatbot.py           # Chatbot logic module
│
├── docs/
│   └── sample_docs/         # Knowledge base source documents (.md)
│
├── vector_db/               # ChromaDB persistent storage (auto-generated)
│
└── frontend/                # React + Vite frontend
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx         # React entry point
        ├── App.jsx          # Main application component
        └── index.css        # Global styles (KPMG theme)
```

---

## Setup Guide

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
```

### Step 2 — Install & Start Ollama

1. Download and install Ollama from [ollama.com/download](https://ollama.com/download).
2. Pull the required model:

```bash
ollama pull llama3:8b
```

3. Verify Ollama is running:

```bash
curl http://localhost:11434
```

You should see `Ollama is running`.

### Step 3 — Set Up the Python Backend

```bash
# Create a virtual environment
python -m venv .venv

# Activate it
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4 — Build the Vector Database

This step processes the knowledge base documents and creates embeddings stored in `vector_db/`.

```bash
python src/create_embeddings.py
```

**Expected output:**
```
Chunks Created: <N>
Creating vector database...
Vector DB created successfully!
```

> **Note:** This only needs to be run once, or whenever the source documents in `docs/sample_docs/` are updated.

### Step 5 — Set Up the Frontend

```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

You need **three services** running simultaneously:

### Terminal 1 — Ollama (if not already running as a service)

```bash
ollama serve
```

### Terminal 2 — Backend API

```bash
# Activate virtual environment first
.venv\Scripts\Activate.ps1     # Windows
# source .venv/bin/activate    # macOS / Linux

python main.py
```

The Flask server starts at **http://127.0.0.1:5000**.

### Terminal 3 — Frontend Dev Server

```bash
cd frontend
npm run dev
```

The frontend starts at **http://localhost:5173**.

Open your browser and navigate to **http://localhost:5173** to use the application.

---

## API Reference

### `GET /api/health`

Returns the health status of backend services.

**Response:**
```json
{
  "status": "healthy",
  "database_loaded": true,
  "ollama_connected": true,
  "details": {
    "db_path": "/path/to/vector_db",
    "db_exists": true
  }
}
```

### `POST /api/chat`

Send a question and receive a streamed response.

**Request:**
```json
{
  "message": "What are the objectives of NMCG?"
}
```

**Response:** Plain text stream (chunked transfer encoding).

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ModuleNotFoundError` | Ensure the virtual environment is activated: `.venv\Scripts\Activate.ps1` |
| `vector_db` not found | Run `python src/create_embeddings.py` to generate it |
| Ollama connection refused | Ensure Ollama is installed and running: `ollama serve` |
| Model not found | Pull the model: `ollama pull llama3:8b` |
| Frontend won't start | Run `npm install` inside the `frontend/` directory |
| CORS errors in browser | The Flask backend includes CORS support. Ensure `main.py` is running |

---
## Development Journey

### Day 1 – Foundation & Local LLM Setup

* Finalized project architecture and use cases.
* Set up GitHub repository and development environment.
* Installed and configured Ollama locally.
* Downloaded and tested Llama 3 8B.
* Integrated LangChain with Ollama.
* Created initial project structure.
* Prepared first knowledge base documents.
* Designed RAG pipeline workflow.

### Day 2 – Retrieval-Augmented Generation (RAG)

* Implemented document loading and chunking pipeline.
* Generated embeddings using HuggingFace BGE models.
* Integrated ChromaDB vector database.
* Built semantic retrieval functionality.
* Developed terminal-based chatbot prototype.
* Improved prompt engineering and response quality.
* Added fallback handling and conversational behaviour.

### Day 3 – Full Stack Integration

* Developed React + Vite frontend interface.
* Implemented enterprise-style chatbot UI.
* Added collapsible navigation sidebar.
* Integrated Flask backend APIs.
* Connected frontend with RAG pipeline.
* Enabled real-time response streaming.
* Completed end-to-end testing and validation.
* Successfully deployed a working MVP.

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19 · Vite · Inter + Outfit fonts  |
| Backend   | Flask · Flask-CORS                      |
| LLM       | Ollama · Llama 3 8B                     |
| Embeddings| HuggingFace `bge-small-en-v1.5`         |
| Vector DB | ChromaDB                                |
| Framework | LangChain                               |

## Project Status

Current Version: MVP v1.0

### Implemented Features

* Semantic document retrieval
* ChromaDB vector search
* Ollama Llama 3 integration
* React web interface
* Flask API backend
* Streaming chatbot responses
* Knowledge base document ingestion
* Enterprise-ready architecture

### Planned Enhancements

* Multi-document collections
* User authentication
* Source citations
* Advanced analytics dashboard
* Multi-domain knowledge repositories
