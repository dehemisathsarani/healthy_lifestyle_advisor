
# Config your username and email before commit
go to the repository folder and enter below commands

git config user.name "username"

git config user.email "example@email.com"

git config --global user.name "username"

git config --global user.email "example@email.com"

# After clone the repository, Install dependencies by running:
npm install

# Run the app using
npm run dev


# Healthy Lifestyle Adviso

healthy Lifestyle Advisor (Agentic AI Project)
 niwarthana-backup

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

## 🧩 Agent Responsibilities

- **🥗 Diet Agent (Nutrition Scientist)**  
  Inputs: biometrics, text meals, food images.  
  Processing: NLP, YOLOv8, calorie needs.  
  Outputs: weekly nutrition summary + RAG chatbot.  

- **🏋️ Fitness Agent (Coach & Motivator)**  
  Inputs: diet summaries.  
  Processing: goal tracking, calorie burn vs intake.  
  Outputs: fitness reports + motivational badges.  

- **🧘 Mental Health Agent (Supportive Friend)**  
  Inputs: mood logs.  
  Processing: jokes, cartoons, meditation.  
  Outputs: wellness summaries + mood history.  

- **🔐 Data & Security Agent (Guardian)**  
  Inputs: all agent data.  
  Processing: AES/RSA encryption, OAuth2/JWT, privacy manager.  
  Outputs: secure storage in MongoDB + weekly consolidated reports.  

---

## 🛠️ System Flow

1. User logs meals, uploads images, or enters mood in the **React frontend**.  
2. Data is sent to **FastAPI** endpoints (`/api/diet`, `/api/fitness`, `/api/mental`, `/api/security`, `/api/rag/chat`).  
3. Messages are routed via **RabbitMQ** to the correct agent.  
4. Agents process data using **LangChain + LangGraph**.  
5. All data is securely stored in **MongoDB**.  
6. Users get **weekly reports + badges + wellness insights**.  

---

## 📊 Explainer Project Architecture

```mermaid
flowchart TD
    %% FRONTEND
    subgraph FE[💻 Frontend - React and TypeScript]
        UI[🧑 User Interface: meals uploads mood biometrics chat]
        UI --> FEAPI[📡 API Calls to FastAPI]
    end

    %% BACKEND
    subgraph BE[⚡ Backend - FastAPI + LangChain + RabbitMQ]
        FEAPI --> API[🌐 FastAPI Endpoints: api-diet api-fitness api-mental api-security api-rag-chat]
        API --> MQ[📬 RabbitMQ Broker: message passing]

        %% Diet Agent
        subgraph DA[🥗 Diet Agent - Nutrition Scientist]
            BMI[📊 Biometric Processor: BMI BMR TDEE]
            NLP[📝 NLP Parser: meal text]
            YOLO[🤖 YOLOv8: food image analysis]
            RAG[RAG Chatbot: diet questions]
            DSUM[📅 Weekly Diet Summary: calories macros]
            BMI --> DSUM
            NLP --> DSUM
            YOLO --> DSUM
            RAG --> DSUM
        end

        %% Fitness Agent
        subgraph FA[🏋️ Fitness Agent - Coach]
            FREC[⬅️ Receives Diet Summary]
            ACH[🎯 Goal Tracker]
            BADGE[🏅 Badge System]
            FREP[📑 Fitness Report]
            FREC --> ACH --> BADGE --> FREP
        end

        %% Mental Health Agent
        subgraph MA[🧘 Mental Health Agent - Friend]
            MOOD[🙂 Mood Input]
            JOKE[😂 Mood Booster: jokes meditation]
            MSUM[🧾 Mental Wellness Summary]
            MOOD --> JOKE --> MSUM
        end

        %% Security Agent
        subgraph SA[🔐 Data and Security Agent - Guardian]
            ENC[🔑 Encrypt Data AES RSA]
            AUTH[🔏 Auth OAuth2 JWT]
            PRIV[⚙️ Privacy Manager]
            STORE[💾 Store in MongoDB]
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
        UCOL[(users)]
        DCOL[(diet_logs)]
        FCOL[(fitness_reports)]
        MCOL[(mental_health)]
        SCOL[(security_prefs)]
        RCOL[(rag_history)]
    end

    SA --> UCOL
    SA --> DCOL
    SA --> FCOL
    SA --> MCOL
    SA --> SCOL
    SA --> RCOL

    %% OUTPUT
    subgraph OUT[📤 Outputs to User]
        WREP[📊 Weekly Report: diet fitness mental]
        BADGES[🏆 Badges and Achievements]
    end

    FA --> WREP
    MA --> WREP
    FA --> BADGES
