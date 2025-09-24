# 🧑‍⚕️ Healthy Lifestyle Advisor (Agentic AI Project)

An **AI-powered multi-agent system** for promoting healthy living through **diet analysis, fitness tracking, and mental well-being support**, built with **LangChain + LangGraph**, **FastAPI**, **React + TypeScript**, **RabbitMQ**, and **MongoDB**.  

The system uses **specialized AI agents** that communicate asynchronously through RabbitMQ and store structured insights securely.  

---

## 🚀 Tech Stack

### Frontend
- **React + TypeScript**
- Tailwind CSS / Shadcn UI
- Axios for API communication

### Backend
- **FastAPI** (REST API)
- **LangChain + LangGraph** (agent workflows & RAG chatbot)
- **RabbitMQ** (message broker for async agent communication)
- **MongoDB** (persistent storage)

### AI / ML
- **YOLOv8** (food image recognition)
- **NLP techniques** for text-based food analysis
- **RAG Chatbot** for health-related queries

### Security
- **AES / RSA Encryption**
- **OAuth2 + JWT authentication**
- Privacy preference management

---

## 🧩 Agents Overview

- **🥗 Diet Agent**
  - Analyzes biometric data (weight, height, BMI, BMR, TDEE).
  - Processes meals via NLP (text input) and YOLOv8 (images).
  - Provides **weekly calorie/macronutrient summaries**.
  - Has its own **RAG chatbot** for diet questions.

- **🏋️ Fitness Agent**
  - Receives weekly diet summaries.
  - Tracks goals, calories burned, workouts.
  - Awards badges 🏅 and achievements.
  - Generates fitness reports.

- **🧘 Mental Health Agent**
  - Accepts user mood inputs (happy, sad, stressed, etc.).
  - Suggests jokes 😂, cartoons 🖼️, meditation 🧘, or exercises.
  - Summarizes emotional wellness.

- **🔐 Data & Security Agent**
  - Encrypts and stores all data securely.
  - Handles authentication & authorization.
  - Manages user privacy settings.
  - Generates consolidated weekly reports.

---

## 🗂️ API Endpoints

| Endpoint             | Description                                |
|----------------------|--------------------------------------------|
| `/api/diet/`         | Log meals, biometrics, and analyze inputs |
| `/api/fitness/`      | Track workouts, goals, achievements       |
| `/api/mental/`       | Log moods, provide mental health support  |
| `/api/security/`     | Manage auth, encryption, and preferences  |
| `/api/rag/chat/`     | Query RAG chatbot for knowledge insights  |

---

## 🛠️ Project Architecture

```mermaid
flowchart TD
    subgraph FE[Frontend - React + TypeScript]
        UI[🧑‍💻 User Interface]
        UI -->|Inputs: meals, images, biometrics, mood| FEAPI[📡 API Calls]
    end

    subgraph BE[Backend - FastAPI + LangChain + RabbitMQ]
        FEAPI --> API[⚡ FastAPI Endpoints]
        API --> MQ[(RabbitMQ Broker 📨)]

        subgraph DA[🥗 Diet Agent]
            BMI[📊 Biometric Processor]
            NLP[📝 NLP Parser]
            YOLO[🤖 YOLOv8 Image Analysis]
            RAG[RAG Chatbot]
            DSUM[📅 Weekly Summary]
            BMI --> DSUM
            NLP --> DSUM
            YOLO --> DSUM
            RAG --> DSUM
        end

        subgraph FA[🏋️ Fitness Agent]
            FREC[⬅️ Receives Diet Summary]
            ACH[🎯 Track Goals]
            BADGE[🏅 Award Badges]
            FREP[📑 Fitness Report]
            FREC --> ACH --> BADGE --> FREP
        end

        subgraph MA[🧘 Mental Health Agent]
            MOOD[🙂 Mood Input]
            JOKE[😂 Suggestions]
            MSUM[🧾 Wellness Summary]
            MOOD --> JOKE --> MSUM
        end

        subgraph SA[🔐 Security Agent]
            ENC[🔑 Encrypt Data]
            AUTH[🔏 OAuth2/JWT]
            PRIV[⚙️ Privacy Settings]
            STORE[💾 Store in MongoDB]
            ENC --> STORE
            AUTH --> STORE
            PRIV --> STORE
        end

        MQ --> DA
        DA --> MQ
        MQ --> FA
        FA --> MQ
        MQ --> MA
        DA --> SA
        FA --> SA
        MA --> SA
    end

    subgraph DB[(MongoDB Database)]
        UCOL[(👤 users)]
        DCOL[(🥗 diet_logs)]
        FCOL[(🏋️ fitness_reports)]
        MCOL[(🧘 mental_health)]
        SCOL[(🔐 security_prefs)]
        RCOL[(💬 rag_history)]
    end

    SA --> UCOL
    SA --> DCOL
    SA --> FCOL
    SA --> MCOL
    SA --> SCOL
    SA --> RCOL

    subgraph OUT[📤 Outputs]
        WREP[📊 Weekly Reports]
        BADGES[🏆 Badges & Achievements]
    end

    FA --> WREP
    MA --> WREP
    FA --> BADGES
