# 🧑‍⚕️ Healthy Lifestyle Advisor (Agentic AI Project)

This project is a **multi-agent AI-based health advisor** that integrates **Diet, Fitness, Mental Health, and Security agents** into one ecosystem.  
It combines **biometric tracking, food analysis, fitness progress monitoring, and mental wellness support** into a secure system, powered by **LangChain, LangGraph, RabbitMQ, FastAPI, React, and MongoDB**.  

The main idea:  
👉 **your body + mind → one advisor → personalized insights + motivation → secure data storage**

---

## 🚀 Why This Project?

Most people use **separate apps** to track their meals, workouts, and moods.  
But health is **holistic** — diet, exercise, and mental state are deeply connected.  

- Eat too much 🍔 → affects your fitness 🏋️ and mood 🧘.  
- Skip workouts 💤 → changes calorie balance and motivation.  
- Stress levels 😫 → influence eating habits and sleep.  

So why keep these in silos?  
This project solves that by creating **a single ecosystem of agents** that talk to each other.  

💡 Instead of “apps for tasks”, this is an **advisor for life balance**.

---

## 🧩 Agent Responsibilities (Explained Like a Story)

### 🥗 Diet Agent (Nutrition Scientist)
- **Inputs:** Biometric data, text meal logs, food images.  
- **Processing:**  
  - NLP extracts calories/macros from text.  
  - YOLOv8 detects foods in images.  
  - BMI, BMR, TDEE calculations for calorie needs.  
- **Outputs:** Weekly nutrition profile + RAG chatbot for diet Q&A.  
➡️ Feeds summary to the **Fitness Agent**.  

---

### 🏋️ Fitness Agent (Coach & Cheerleader)
- **Inputs:** Diet Agent summaries.  
- **Processing:** Tracks calorie balance vs burn, monitors goals.  
- **Outputs:** Weekly fitness report + motivational badges.  

---

### 🧘 Mental Health Agent (Supportive Friend)
- **Inputs:** Mood entries from users.  
- **Processing:** Provides jokes, cartoons, meditation tips when mood is low.  
- **Outputs:** Emotional wellness summary + mood history trends.  

---

### 🔐 Data & Security Agent (Guardian)
- **Inputs:** Data from all other agents.  
- **Processing:**  
  - Encrypts sensitive data (AES/RSA).  
  - Authenticates/authorizes with OAuth2/JWT.  
  - Manages privacy settings.  
- **Outputs:** Weekly consolidated health report, securely stored in **MongoDB**.  

---

## 🛠️ System Flow (Step by Step)

1. **Frontend (React + TS)**  
   Users log meals, biometrics, moods, and upload images.  

2. **Backend (FastAPI)**  
   Exposes endpoints like `/api/diet`, `/api/fitness`, `/api/mental`, `/api/security`, `/api/rag/chat`.  

3. **RabbitMQ Broker**  
   Acts as a postman 📨 — delivering messages to the right agent.  

4. **Agents (LangChain + LangGraph)**  
   - Diet Agent → food & nutrition analysis.  
   - Fitness Agent → goals & badges.  
   - Mental Agent → jokes & meditation.  
   - Security Agent → encryption & secure storage.  

5. **MongoDB**  
   Stores all logs, summaries, preferences, chatbot history.  

6. **Outputs to User**  
   - Weekly report 📊.  
   - Gamified badges 🏆.  
   - Mental wellness insights 🧘.  

---

## 📊 Explainer Project Architecture

```mermaid
flowchart TD
    %% FRONTEND
    subgraph FE[💻 Frontend - React + TypeScript]
        UI[🧑 User Interface\n- Meal Logging\n- Upload Food Images\n- Mood Input\n- Biometric Data Entry\n- Chat with RAG Bot]
        UI --> FEAPI[📡 API Requests to FastAPI]
    end

    %% BACKEND
    subgraph BE[⚡ Backend - FastAPI + LangChain + RabbitMQ]
        FEAPI --> API[🌐 FastAPI Endpoints\n(/api/diet, /api/fitness,\n/api/mental, /api/security, /api/rag/chat)]
        API --> MQ[📬 RabbitMQ Broker\nDecoupled message passing]

        %% Diet Agent
        subgraph DA[🥗 Diet Agent (Nutrition Scientist)]
            BMI[📊 Biometric Processor\n- BMI, BMR, TDEE Calculation]
            NLP[📝 NLP Parser\n- Analyze meal text input]
            YOLO[🤖 YOLOv8 Image Model\n- Detect food & calories from images]
            RAG[RAG Chatbot\n- Answer diet queries]
            DSUM[📅 Weekly Diet Summary\n- Calorie + Macro Report]

            BMI --> DSUM
            NLP --> DSUM
            YOLO --> DSUM
            RAG --> DSUM
        end

        %% Fitness Agent
        subgraph FA[🏋️ Fitness Agent (Coach & Motivator)]
            FREC[⬅️ Receives Diet Summary]
            ACH[🎯 Goal Tracker]
            BADGE[🏅 Badge System]
            FREP[📑 Fitness Report]

            FREC --> ACH --> BADGE --> FREP
        end

        %% Mental Health Agent
        subgraph MA[🧘 Mental Health Agent (Supportive Friend)]
            MOOD[🙂 Mood Input]
            JOKE[😂 Mood Booster\n(Jokes, Cartoons, Meditation)]
            MSUM[🧾 Mental Wellness Summary]

            MOOD --> JOKE --> MSUM
        end

        %% Security Agent
        subgraph SA[🔐 Data & Security Agent (Guardian)]
            ENC[🔑 Encrypt Data (AES/RSA)]
            AUTH[🔏 Authentication & Authorization\n(OAuth2 / JWT)]
            PRIV[⚙️ Privacy Manager]
            STORE[💾 Store Securely in MongoDB]

            ENC --> STORE
            AUTH --> STORE
            PRIV --> STORE
        end

        %% Communication
        MQ --> DA
        DA --> MQ
        MQ --> FA
        FA --> MQ
        MQ --> MA
        DA --> SA
        FA --> SA
        MA --> SA
    end

    %% DATABASE
    subgraph DB[🗄️ MongoDB Database]
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

    %% OUTPUT
    subgraph OUT[📤 Outputs to User]
        WREP[📊 Weekly Consolidated Report\n(Diet + Fitness + Mental)]
        BADGES[🏆 Badges & Achievements\n(Gamified Motivation)]
    end

    FA --> WREP
    MA --> WREP
    FA --> BADGES
