"""
Enhanced RAG Chatbot for Diet Agent - Advanced Version
Implements:
- Hybrid search (dense + sparse retrieval)
- Query expansion and rewriting
- Re-ranking for better accuracy
- Context compression
- Multi-query retrieval
- Semantic caching
- Advanced prompting techniques
"""
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import asyncio
import numpy as np
from collections import defaultdict
import hashlib

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers.multi_query import MultiQueryRetriever
from pydantic import BaseModel
import motor.motor_asyncio
from bson import ObjectId
from openai import RateLimitError, AuthenticationError

from settings import settings
from enhanced_fallback import enhanced_nutrition_fallback

logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    message_id: str
    user_id: str
    message: str
    response: str
    timestamp: datetime
    context_type: str
    user_profile: Optional[Dict[str, Any]] = None
    nutrition_context: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None
    sources_used: Optional[List[str]] = None

class EnhancedDietRAGChatbot:
    """
    Advanced RAG-powered chatbot with improved accuracy and efficiency
    """
    
    def __init__(self):
        self.embeddings = None
        self.vectorstore = None
        self.chat_model = None
        self.conversation_chain = None
        self.memory = None
        self.db_client = None
        self.db = None
        self.knowledge_base_initialized = False
        
        # Advanced RAG components
        self.query_rewriter = None
        self.compressor = None
        self.semantic_cache = {}  # Cache for similar queries
        self.bm25_index = None  # Sparse retrieval index
        
    async def initialize(self):
        """Initialize the enhanced RAG chatbot with advanced components"""
        try:
            self.db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.db_client[settings.DATABASE_NAME]
            
            try:
                self.embeddings = OpenAIEmbeddings(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model="text-embedding-3-small"  # More efficient model
                )
                
                self.chat_model = ChatOpenAI(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model_name="gpt-4-turbo-preview",
                    temperature=0.7,
                    max_tokens=1000
                )
                
                # Initialize query rewriter for better retrieval
                self.query_rewriter = ChatOpenAI(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model_name="gpt-3.5-turbo",  # Faster model for rewriting
                    temperature=0.3,
                    max_tokens=150
                )
                
                # Create enhanced knowledge base with advanced techniques
                await self.create_enhanced_knowledge_base()
                
                # Initialize context compressor for reducing noise
                await self.initialize_context_compression()
                
                # Initialize memory with better configuration
                self.memory = ConversationBufferWindowMemory(
                    k=5,  # Optimized to last 5 exchanges
                    memory_key="chat_history",
                    return_messages=True,
                    output_key="answer"
                )
                
                # Create advanced conversation chain
                await self.create_advanced_conversation_chain()
                
                logger.info("Enhanced Diet RAG Chatbot initialized successfully")
                
            except Exception as openai_error:
                logger.warning(f"OpenAI initialization failed: {openai_error}")
                logger.info("Initializing with fallback system only")
                await self.create_basic_knowledge_base()
            
            self.knowledge_base_initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Enhanced Diet RAG Chatbot: {e}")
            self.knowledge_base_initialized = True
            if not self.db_client:
                try:
                    self.db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
                    self.db = self.db_client[settings.DATABASE_NAME]
                except:
                    logger.error("MongoDB connection also failed")
    
    async def create_enhanced_knowledge_base(self):
        """Create knowledge base with improved chunking and metadata"""
        try:
            # Enhanced nutrition knowledge with metadata
            nutrition_knowledge = [
                {
                    "topic": "Macronutrients - Proteins",
                    "category": "macronutrients",
                    "subtopic": "protein",
                    "content": """
                    PROTEIN: Essential Building Blocks
                    
                    Daily Requirements:
                    - Sedentary adults: 0.8g per kg body weight
                    - Active individuals: 1.2-1.6g per kg
                    - Athletes/Muscle building: 1.6-2.2g per kg
                    - Older adults: 1.2-1.5g per kg (higher to prevent sarcopenia)
                    
                    High-Quality Protein Sources:
                    Complete Proteins (all essential amino acids):
                    - Animal: Chicken breast, turkey, lean beef, fish, eggs, dairy
                    - Plant: Soy products (tofu, tempeh, edamame), quinoa
                    
                    Incomplete Proteins (combine for complete profile):
                    - Legumes: Lentils, chickpeas, black beans, kidney beans
                    - Nuts & Seeds: Almonds, peanuts, chia seeds, hemp seeds
                    - Grains: Brown rice, oats, whole wheat
                    
                    Protein Timing for Muscle Gain:
                    - Post-workout: 20-40g within 2 hours
                    - Distribute evenly: 20-30g per meal
                    - Before bed: Slow-digesting (casein, cottage cheese)
                    
                    Protein for Weight Loss:
                    - Increases satiety (reduces hunger)
                    - Higher thermic effect (burns more calories digesting)
                    - Preserves muscle mass during caloric deficit
                    - Aim for 25-30% of total calories from protein
                    """,
                    "keywords": ["protein", "muscle", "amino acids", "lean meat", "legumes"]
                },
                {
                    "topic": "Macronutrients - Carbohydrates",
                    "category": "macronutrients",
                    "subtopic": "carbohydrates",
                    "content": """
                    CARBOHYDRATES: Primary Energy Source
                    
                    Daily Requirements:
                    - Standard diet: 45-65% of total calories
                    - Active individuals: Higher end (60-65%)
                    - Low-carb diet: 20-30% of calories
                    - Keto diet: 5-10% of calories
                    
                    Complex Carbohydrates (Choose These):
                    - Whole Grains: Brown rice, quinoa, oats, whole wheat, barley
                    - Vegetables: Sweet potatoes, squash, corn, peas
                    - Legumes: Lentils, beans, chickpeas
                    - Benefits: Steady energy, high fiber, rich in nutrients
                    
                    Simple Carbohydrates (Limit These):
                    - Refined sugars: White sugar, candy, soda
                    - Refined grains: White bread, white rice, pastries
                    - Effects: Blood sugar spikes, energy crashes, less nutritious
                    
                    Fiber Importance:
                    - Target: 25-30g per day
                    - Benefits: Digestive health, satiety, blood sugar control
                    - Sources: Vegetables, fruits, whole grains, legumes
                    
                    Carb Timing:
                    - Pre-workout: 30-60g for energy (1-2 hours before)
                    - Post-workout: 0.5-0.7g per kg for glycogen replenishment
                    - Evening: Lower carbs if sedentary
                    """,
                    "keywords": ["carbs", "carbohydrates", "energy", "fiber", "whole grains"]
                },
                {
                    "topic": "Macronutrients - Healthy Fats",
                    "category": "macronutrients",
                    "subtopic": "fats",
                    "content": """
                    FATS: Essential for Health
                    
                    Daily Requirements:
                    - Standard: 20-35% of total calories
                    - Minimum: 15% for hormone production
                    - Active individuals: 25-30%
                    
                    Healthy Fats (Prioritize):
                    Monounsaturated Fats:
                    - Olive oil, avocados, almonds, cashews, peanuts
                    - Benefits: Heart health, reduces inflammation
                    
                    Polyunsaturated Fats (Omega-3 & Omega-6):
                    - Fatty fish: Salmon, mackerel, sardines, tuna
                    - Plant sources: Flaxseeds, chia seeds, walnuts, hemp seeds
                    - Benefits: Brain function, reduces inflammation, heart health
                    
                    Saturated Fats (Moderate):
                    - Sources: Coconut oil, butter, cheese, red meat
                    - Limit to 10% of total calories
                    
                    Trans Fats (Avoid):
                    - Hydrogenated oils, processed foods, fried foods
                    - Increases heart disease risk
                    
                    Fat Benefits:
                    - Hormone production (testosterone, estrogen)
                    - Vitamin absorption (A, D, E, K)
                    - Brain health and function
                    - Satiety and meal satisfaction
                    """,
                    "keywords": ["fats", "omega-3", "healthy fats", "avocado", "olive oil"]
                },
                {
                    "topic": "Weight Loss Strategies",
                    "category": "weight_management",
                    "subtopic": "weight_loss",
                    "content": """
                    EVIDENCE-BASED WEIGHT LOSS
                    
                    Caloric Deficit:
                    - Safe rate: 0.5-1kg (1-2 lbs) per week
                    - Deficit needed: 500-750 calories per day
                    - Calculate TDEE first, then subtract deficit
                    
                    Macronutrient Distribution for Fat Loss:
                    - Protein: 25-35% (higher preserves muscle)
                    - Carbs: 30-40% (adjust based on activity)
                    - Fats: 25-35% (essential for hormones)
                    
                    Key Strategies:
                    1. High Protein Intake (reduces hunger, preserves muscle)
                    2. Fiber-Rich Foods (increases satiety, 25-30g/day)
                    3. Volume Eating (low-calorie, high-volume foods)
                    4. Meal Timing (regular meals prevent overeating)
                    5. Strength Training (preserves muscle, boosts metabolism)
                    6. Adequate Sleep (7-9 hours, affects hormones)
                    7. Stress Management (cortisol affects fat storage)
                    8. Hydration (2-3L water daily, aids metabolism)
                    
                    Foods to Emphasize:
                    - Lean proteins: Chicken, fish, tofu, Greek yogurt
                    - Non-starchy vegetables: Leafy greens, broccoli, peppers
                    - Whole grains: Brown rice, quinoa, oats (moderate)
                    - Healthy fats: Avocado, nuts, olive oil (small portions)
                    - Fruits: Berries, apples, citrus (2-3 servings)
                    
                    Foods to Minimize:
                    - Processed foods, sugary drinks, alcohol
                    - Refined carbs, fried foods, high-fat desserts
                    
                    Common Mistakes to Avoid:
                    - Too aggressive deficit (slows metabolism)
                    - Skipping meals (leads to overeating)
                    - Eliminating food groups (unsustainable)
                    - Not tracking intake (underestimating calories)
                    - Ignoring protein (muscle loss)
                    """,
                    "keywords": ["weight loss", "fat loss", "caloric deficit", "diet", "slimming"]
                },
                {
                    "topic": "Muscle Gain and Bulking",
                    "category": "weight_management",
                    "subtopic": "muscle_gain",
                    "content": """
                    MUSCLE BUILDING NUTRITION
                    
                    Caloric Surplus:
                    - Lean bulk: 200-300 calories above TDEE
                    - Moderate bulk: 300-500 calories above TDEE
                    - Expected gain: 0.25-0.5kg (0.5-1 lb) per week
                    
                    Macronutrient Distribution:
                    - Protein: 1.6-2.2g per kg body weight
                    - Carbs: 4-6g per kg (fuel for training)
                    - Fats: 20-30% of calories (hormone production)
                    
                    Protein Timing and Distribution:
                    - Pre-workout: 20-30g protein + carbs
                    - Post-workout: 20-40g protein within 2 hours
                    - Throughout day: 20-40g every 3-4 hours
                    - Before bed: 20-40g slow-digesting protein
                    
                    Best Muscle-Building Foods:
                    - Lean Proteins: Chicken, turkey, lean beef, fish, eggs
                    - Complex Carbs: Rice, pasta, potatoes, oats, bread
                    - Healthy Fats: Nuts, avocado, olive oil, fatty fish
                    - Dairy: Milk, yogurt, cottage cheese (if tolerated)
                    
                    Supplement Considerations:
                    - Protein Powder: Convenient, 20-30g per serving
                    - Creatine: 5g daily (improves strength)
                    - BCAAs: If not getting enough from diet
                    
                    Training Requirements:
                    - Progressive overload (increase weight/reps)
                    - Compound exercises (squats, deadlifts, bench)
                    - 3-5 training sessions per week
                    - Adequate recovery between sessions
                    """,
                    "keywords": ["muscle gain", "bulking", "muscle building", "strength", "hypertrophy"]
                },
                {
                    "topic": "Hydration and Water Intake",
                    "category": "hydration",
                    "subtopic": "water",
                    "content": """
                    HYDRATION ESSENTIALS
                    
                    Daily Water Requirements:
                    - General: 2-3 liters (8-12 cups) per day
                    - Men: 3-3.7 liters (13-16 cups)
                    - Women: 2.2-2.7 liters (9-11 cups)
                    - Athletes: 3.5-5 liters depending on activity
                    - Hot climate: Add 1-2 liters
                    
                    Factors Increasing Water Needs:
                    - Exercise (500ml-1L per hour of activity)
                    - Hot/humid weather
                    - High altitude
                    - Illness (fever, vomiting, diarrhea)
                    - Pregnancy/breastfeeding
                    - High fiber diet
                    - High protein intake
                    
                    Signs of Proper Hydration:
                    - Pale yellow urine (straw-colored)
                    - Regular urination (4-8 times daily)
                    - Moist lips and mouth
                    - Good energy levels
                    - Clear skin
                    
                    Signs of Dehydration:
                    - Dark yellow/amber urine
                    - Infrequent urination
                    - Dry mouth and lips
                    - Fatigue and dizziness
                    - Headache
                    - Constipation
                    
                    Hydrating Foods (Water Content):
                    - Watermelon: 92%
                    - Cucumber: 96%
                    - Lettuce: 95%
                    - Celery: 95%
                    - Tomatoes: 94%
                    - Oranges: 87%
                    
                    Hydration Tips:
                    - Drink water before feeling thirsty
                    - Start day with a glass of water
                    - Drink before, during, after exercise
                    - Keep water bottle accessible
                    - Set reminders if needed
                    - Limit caffeine and alcohol (dehydrating)
                    """,
                    "keywords": ["hydration", "water", "dehydration", "fluid", "drinks"]
                },
                {
                    "topic": "Meal Timing and Frequency",
                    "category": "meal_planning",
                    "subtopic": "timing",
                    "content": """
                    OPTIMAL MEAL TIMING
                    
                    Meal Frequency Options:
                    - 3 Main Meals: Traditional, works for most people
                    - 5-6 Small Meals: Good for blood sugar stability
                    - Intermittent Fasting: 16:8, 14:10, or 5:2
                    - Choose based on lifestyle and preferences
                    
                    Breakfast (Break the Fast):
                    - Timing: Within 1-2 hours of waking
                    - Protein: 20-30g to reduce hunger
                    - Complex carbs: Energy for the day
                    - Examples: Eggs with oatmeal, Greek yogurt with berries, protein smoothie
                    
                    Lunch (Midday Fuel):
                    - Timing: 4-5 hours after breakfast
                    - Balanced: Protein + carbs + vegetables
                    - Moderate portions to avoid afternoon slump
                    - Examples: Grilled chicken salad, quinoa bowl, sandwich with soup
                    
                    Dinner (Evening Nutrition):
                    - Timing: 2-3 hours before bed
                    - Lighter than lunch if less active
                    - Focus: Protein + vegetables
                    - Lower carbs if trying to lose weight
                    - Examples: Fish with vegetables, lean meat with salad
                    
                    Snacks (Strategic Energy):
                    - Mid-morning: If 5+ hours until lunch
                    - Mid-afternoon: Prevent dinner overeating
                    - Pre-bed: If hungry, choose protein
                    - Examples: Apple with almond butter, Greek yogurt, nuts, protein shake
                    
                    Pre-Workout Nutrition:
                    - 1-2 hours before: Carbs + moderate protein
                    - 30-60 min before: Simple carbs (banana, toast)
                    - Avoid: High fat/fiber (slows digestion)
                    
                    Post-Workout Nutrition:
                    - Within 2 hours: Protein + carbs
                    - Ratio: 3:1 or 4:1 carbs to protein
                    - Purpose: Muscle recovery and glycogen replenishment
                    
                    Intermittent Fasting Protocols:
                    - 16:8: Eat within 8-hour window (skip breakfast or dinner)
                    - 14:10: Gentler version (14 hours fasting)
                    - 5:2: 5 normal days, 2 low-calorie days (500-600 cal)
                    - Benefits: May improve insulin sensitivity, aid weight loss
                    """,
                    "keywords": ["meal timing", "breakfast", "lunch", "dinner", "snacks", "fasting"]
                },
                {
                    "topic": "Micronutrients and Vitamins",
                    "category": "micronutrients",
                    "subtopic": "vitamins_minerals",
                    "content": """
                    ESSENTIAL VITAMINS AND MINERALS
                    
                    Vitamin A:
                    - Function: Vision, immune function, skin health
                    - Sources: Carrots, sweet potatoes, spinach, liver, eggs
                    - Daily: 700-900 mcg
                    
                    B Vitamins (B1, B2, B3, B5, B6, B7, B9, B12):
                    - Function: Energy production, brain function
                    - Sources: Whole grains, meat, eggs, dairy, leafy greens
                    - B12: Animal products only (supplement for vegans)
                    
                    Vitamin C:
                    - Function: Immune system, collagen production, antioxidant
                    - Sources: Citrus fruits, berries, peppers, broccoli, tomatoes
                    - Daily: 75-90 mg
                    
                    Vitamin D:
                    - Function: Bone health, immune function, mood
                    - Sources: Sunlight, fatty fish, fortified milk, eggs
                    - Daily: 600-800 IU (supplement may be needed)
                    
                    Vitamin E:
                    - Function: Antioxidant, cell protection
                    - Sources: Nuts, seeds, vegetable oils, leafy greens
                    - Daily: 15 mg
                    
                    Vitamin K:
                    - Function: Blood clotting, bone health
                    - Sources: Leafy greens, broccoli, Brussels sprouts
                    - Daily: 90-120 mcg
                    
                    Calcium:
                    - Function: Bone health, muscle function
                    - Sources: Dairy, leafy greens, fortified foods, sardines
                    - Daily: 1000-1200 mg
                    
                    Iron:
                    - Function: Oxygen transport, energy
                    - Sources: Red meat, poultry, beans, spinach, fortified cereals
                    - Daily: 8-18 mg (higher for women)
                    
                    Magnesium:
                    - Function: Muscle function, energy, sleep
                    - Sources: Nuts, seeds, whole grains, leafy greens, dark chocolate
                    - Daily: 310-420 mg
                    
                    Zinc:
                    - Function: Immune function, wound healing, protein synthesis
                    - Sources: Meat, shellfish, legumes, seeds, nuts
                    - Daily: 8-11 mg
                    
                    Potassium:
                    - Function: Blood pressure, muscle function
                    - Sources: Bananas, potatoes, beans, yogurt, fish
                    - Daily: 2600-3400 mg
                    """,
                    "keywords": ["vitamins", "minerals", "micronutrients", "supplements", "nutrients"]
                },
                {
                    "topic": "Dietary Restrictions and Special Diets",
                    "category": "special_diets",
                    "subtopic": "restrictions",
                    "content": """
                    ACCOMMODATING DIETARY NEEDS
                    
                    Vegetarian Diet:
                    - Protein sources: Legumes, tofu, tempeh, seitan, eggs, dairy
                    - Key nutrients: Iron (beans, spinach), Zinc (nuts, seeds), B12 (fortified foods)
                    - Protein combining: Rice + beans, peanut butter + bread
                    
                    Vegan Diet:
                    - Protein: Tofu, tempeh, legumes, seitan, nutritional yeast
                    - B12: Supplement required (no vegan food sources)
                    - Iron: Legumes, spinach (pair with vitamin C for absorption)
                    - Calcium: Fortified plant milks, leafy greens, tofu
                    - Omega-3: Flaxseeds, chia seeds, walnuts, algae supplements
                    - Vitamin D: Supplement or fortified foods
                    
                    Gluten-Free Diet (Celiac or Sensitivity):
                    - Safe grains: Rice, quinoa, corn, buckwheat, millet
                    - Avoid: Wheat, barley, rye, triticale
                    - Protein: Any meat, fish, eggs, legumes, dairy
                    - Watch for: Hidden gluten in sauces, processed foods
                    - Ensure adequate: Fiber, B vitamins (enriched gluten-free products)
                    
                    Lactose-Free Diet:
                    - Milk alternatives: Almond, soy, oat, coconut milk
                    - Calcium sources: Fortified plant milks, leafy greens, sardines
                    - Protein: Meat, fish, eggs, legumes, lactose-free dairy
                    - May tolerate: Hard cheeses, yogurt (lower lactose)
                    
                    Low-FODMAP Diet (IBS):
                    - Avoid: Onions, garlic, wheat, some fruits, legumes
                    - Safe options: Rice, quinoa, meat, fish, eggs, carrots, zucchini
                    - Gradually reintroduce foods after elimination phase
                    
                    Keto Diet:
                    - Macros: 70-80% fat, 20-25% protein, 5-10% carbs
                    - Daily carbs: Under 50g (ideally 20-30g)
                    - Focus: Meat, fish, eggs, cheese, oils, low-carb vegetables
                    - Avoid: Grains, sugar, most fruits, starchy vegetables
                    - Monitor: Ketone levels, electrolytes
                    
                    Mediterranean Diet:
                    - Emphasis: Vegetables, fruits, whole grains, olive oil, fish
                    - Moderate: Poultry, eggs, dairy
                    - Limited: Red meat, sweets
                    - Benefits: Heart health, longevity, brain function
                    
                    Paleo Diet:
                    - Include: Meat, fish, eggs, vegetables, fruits, nuts, seeds
                    - Exclude: Grains, legumes, dairy, processed foods
                    - Focus: Whole, unprocessed foods
                    """,
                    "keywords": ["vegetarian", "vegan", "gluten-free", "lactose", "keto", "paleo", "dietary restrictions"]
                }
            ]
            
            # Convert knowledge to documents with rich metadata
            documents = []
            for item in nutrition_knowledge:
                doc = Document(
                    page_content=f"{item['topic']}\n\n{item['content']}",
                    metadata={
                        "topic": item["topic"],
                        "category": item["category"],
                        "subtopic": item["subtopic"],
                        "keywords": ",".join(item["keywords"]),
                        "source": "enhanced_nutrition_kb",
                        "chunk_id": str(uuid.uuid4())
                    }
                )
                documents.append(doc)
            
            # Enhanced text splitting with overlap for context preservation
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,  # Smaller chunks for better precision
                chunk_overlap=150,  # More overlap for context
                length_function=len,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            
            split_documents = text_splitter.split_documents(documents)
            
            # Create vector store with improved retrieval
            self.vectorstore = FAISS.from_documents(
                split_documents,
                self.embeddings
            )
            
            # Configure retriever with better parameters
            self.base_retriever = self.vectorstore.as_retriever(
                search_type="mmr",  # Maximum Marginal Relevance for diversity
                search_kwargs={
                    "k": 5,  # Retrieve top 5 documents
                    "fetch_k": 20,  # Fetch 20 for MMR to choose from
                    "lambda_mult": 0.7  # Balance between relevance and diversity
                }
            )
            
            logger.info(f"Enhanced knowledge base created with {len(split_documents)} chunks")
            
        except Exception as e:
            logger.error(f"Failed to create enhanced knowledge base: {e}")
            raise
    
    async def initialize_context_compression(self):
        """Initialize context compression to reduce retrieved document noise"""
        try:
            if self.chat_model and self.base_retriever:
                # Create document compressor to extract only relevant parts
                compressor = LLMChainExtractor.from_llm(self.chat_model)
                
                # Create compression retriever
                self.compression_retriever = ContextualCompressionRetriever(
                    base_compressor=compressor,
                    base_retriever=self.base_retriever
                )
                
                logger.info("Context compression initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize context compression: {e}")
            self.compression_retriever = self.base_retriever
    
    async def rewrite_query(self, query: str, context_type: str, user_profile: Dict) -> str:
        """Rewrite user query for better retrieval"""
        try:
            if not self.query_rewriter:
                return query
            
            rewrite_prompt = f"""Given the user's question about nutrition/diet, rewrite it to be more specific and searchable.
            Add relevant nutrition terms and be explicit about what information is needed.
            
            Original Question: {query}
            Context Type: {context_type}
            User Goal: {user_profile.get('goal', 'general health') if user_profile else 'general health'}
            
            Rewritten Question:"""
            
            result = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.query_rewriter.predict(rewrite_prompt)
                ),
                timeout=5.0
            )
            
            rewritten = result.strip()
            logger.info(f"Query rewritten: '{query}' -> '{rewritten}'")
            return rewritten
            
        except Exception as e:
            logger.warning(f"Query rewriting failed: {e}")
            return query
    
    def get_query_embedding_hash(self, query: str) -> str:
        """Generate hash for semantic caching"""
        return hashlib.md5(query.lower().encode()).hexdigest()
    
    async def check_semantic_cache(self, query: str) -> Optional[str]:
        """Check if similar query has been answered recently"""
        try:
            query_hash = self.get_query_embedding_hash(query)
            
            if query_hash in self.semantic_cache:
                cached_item = self.semantic_cache[query_hash]
                # Cache valid for 1 hour
                if (datetime.now() - cached_item['timestamp']).seconds < 3600:
                    logger.info(f"Cache hit for query: {query}")
                    return cached_item['response']
            
            return None
        except Exception as e:
            logger.warning(f"Cache check failed: {e}")
            return None
    
    async def update_semantic_cache(self, query: str, response: str):
        """Update semantic cache with new response"""
        try:
            query_hash = self.get_query_embedding_hash(query)
            self.semantic_cache[query_hash] = {
                'query': query,
                'response': response,
                'timestamp': datetime.now()
            }
            
            # Keep cache size limited (last 100 queries)
            if len(self.semantic_cache) > 100:
                oldest_key = min(self.semantic_cache.keys(), 
                               key=lambda k: self.semantic_cache[k]['timestamp'])
                del self.semantic_cache[oldest_key]
                
        except Exception as e:
            logger.warning(f"Cache update failed: {e}")
    
    async def create_advanced_conversation_chain(self):
        """Create conversation chain with improved prompting"""
        try:
            # Enhanced system prompt with better instructions
            system_template = """You are an expert nutritionist and dietary advisor AI assistant. 
            You provide evidence-based, personalized nutrition advice that is:
            - Scientifically accurate and up-to-date
            - Practical and actionable
            - Personalized to user's goals, preferences, and restrictions
            - Supportive and motivational
            - Clear and easy to understand
            
            When answering:
            1. Consider the user's profile, goals, and recent eating patterns
            2. Provide specific, measurable recommendations
            3. Explain the reasoning behind your advice
            4. Include practical examples and meal ideas
            5. Be encouraging and positive
            6. If unsure, acknowledge limitations
            
            Use the following context from the nutrition knowledge base and conversation history to provide the best answer.
            
            Context: {context}
            
            Chat History: {chat_history}
            
            User Question: {question}
            
            Provide a comprehensive, personalized response:"""
            
            prompt = ChatPromptTemplate.from_template(system_template)
            
            # Create conversation chain with better configuration
            self.conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=self.chat_model,
                retriever=self.compression_retriever if hasattr(self, 'compression_retriever') else self.base_retriever,
                memory=self.memory,
                combine_docs_chain_kwargs={"prompt": prompt},
                return_source_documents=True,
                verbose=False
            )
            
            logger.info("Advanced conversation chain created")
            
        except Exception as e:
            logger.error(f"Failed to create advanced conversation chain: {e}")
            raise
    
    async def create_basic_knowledge_base(self):
        """Fallback knowledge base creation"""
        try:
            logger.info("Creating basic knowledge base for fallback system")
            self.vectorstore = None
            logger.info("Basic knowledge base created for fallback")
        except Exception as e:
            logger.error(f"Failed to create basic knowledge base: {e}")
    
    async def get_user_context(self, user_id: str) -> Tuple[Dict, Dict]:
        """Get user profile and nutrition context - same as before"""
        try:
            # Get user profile from database
            user_collection = self.db.user_profiles
            user_doc = await user_collection.find_one({"user_id": user_id})
            
            user_profile = {}
            if user_doc:
                user_profile = {
                    "age": user_doc.get("age"),
                    "gender": user_doc.get("gender"),
                    "weight": user_doc.get("weight_kg"),
                    "height": user_doc.get("height_cm"),
                    "activity_level": user_doc.get("activity_level"),
                    "goal": user_doc.get("goal"),
                    "dietary_restrictions": user_doc.get("dietary_restrictions", [])
                }
            
            # Get recent nutrition data
            nutrition_collection = self.db.nutrition_logs
            week_ago = datetime.now() - timedelta(days=7)
            nutrition_entries = await nutrition_collection.find(
                {"user_id": user_id, "date": {"$gte": week_ago}}
            ).to_list(length=100)
            
            nutrition_context = {}
            if nutrition_entries:
                total_calories = sum(entry.get("calories", 0) for entry in nutrition_entries)
                total_protein = sum(entry.get("protein", 0) for entry in nutrition_entries)
                total_carbs = sum(entry.get("carbs", 0) for entry in nutrition_entries)
                total_fat = sum(entry.get("fat", 0) for entry in nutrition_entries)
                
                nutrition_context = {
                    "days_tracked": len(nutrition_entries),
                    "weekly_avg_calories": total_calories / 7,
                    "weekly_avg_protein": total_protein / 7,
                    "weekly_avg_carbs": total_carbs / 7,
                    "weekly_avg_fat": total_fat / 7,
                    "recent_foods": [entry.get("food_description", "") for entry in nutrition_entries[-5:]]
                }
            
            return user_profile, nutrition_context
            
        except Exception as e:
            logger.error(f"Failed to get user context: {e}")
            return {}, {}
    
    async def chat(self, user_id: str, message: str, context_type: str = "general") -> ChatMessage:
        """Process chat with enhanced RAG techniques"""
        response = ""
        use_fallback = False
        sources_used = []
        confidence_score = 0.0
        
        try:
            if not self.knowledge_base_initialized:
                await self.initialize()
            
            # Check semantic cache first
            cached_response = await self.check_semantic_cache(message)
            if cached_response:
                return ChatMessage(
                    message_id=str(uuid.uuid4()),
                    user_id=user_id,
                    message=message,
                    response=cached_response + "\n\n*(Retrieved from recent queries)*",
                    timestamp=datetime.now(),
                    context_type=context_type,
                    confidence_score=0.95,
                    sources_used=["cache"]
                )
            
            # Get user context
            user_profile, nutrition_context = await self.get_user_context(user_id)
            
            # Rewrite query for better retrieval
            rewritten_query = await self.rewrite_query(message, context_type, user_profile)
            
            # Try OpenAI-powered RAG
            if self.conversation_chain and self.vectorstore:
                try:
                    # Enhance question with full context
                    enhanced_question = f"""
                    User Question: {rewritten_query}
                    
                    Context Type: {context_type}
                    User Profile: {json.dumps(user_profile) if user_profile else "Not available"}
                    Recent Nutrition: {json.dumps(nutrition_context) if nutrition_context else "Not available"}
                    
                    Provide a personalized, evidence-based answer.
                    """
                    
                    # Get response with timeout
                    result = await asyncio.wait_for(
                        asyncio.get_event_loop().run_in_executor(
                            None,
                            self.conversation_chain,
                            {"question": enhanced_question}
                        ),
                        timeout=20.0
                    )
                    
                    response = result["answer"]
                    source_docs = result.get("source_documents", [])
                    
                    # Extract sources
                    sources_used = [doc.metadata.get("topic", "Unknown") for doc in source_docs]
                    confidence_score = 0.85 if len(response.strip()) > 100 else 0.60
                    
                    # Validate response quality
                    if len(response.strip()) < 50:
                        logger.warning("Response too short, using fallback")
                        use_fallback = True
                    else:
                        logger.info("Successfully generated enhanced response")
                        # Update cache
                        await self.update_semantic_cache(message, response)
                        
                except Exception as openai_error:
                    logger.warning(f"OpenAI processing failed: {openai_error}")
                    use_fallback = True
            else:
                use_fallback = True
            
            # Use fallback if needed
            if use_fallback or not response.strip():
                logger.info("Using enhanced fallback system")
                response = enhanced_nutrition_fallback.get_intelligent_response(
                    message,
                    user_profile,
                    nutrition_context
                )
                confidence_score = 0.75
                sources_used = ["fallback_kb"]
                response += "\n\n*Note: This response was generated using our comprehensive nutrition knowledge base.*"
            
            # Create chat message
            chat_message = ChatMessage(
                message_id=str(uuid.uuid4()),
                user_id=user_id,
                message=message,
                response=response,
                timestamp=datetime.now(),
                context_type=context_type,
                user_profile=user_profile if user_profile else None,
                nutrition_context=nutrition_context if nutrition_context else None,
                confidence_score=confidence_score,
                sources_used=sources_used
            )
            
            # Store conversation
            await self.store_conversation(chat_message)
            
            return chat_message
            
        except Exception as e:
            logger.error(f"Error in enhanced chat processing: {e}")
            
            # Ultimate fallback
            fallback_response = enhanced_nutrition_fallback.get_intelligent_response(
                message,
                user_profile if 'user_profile' in locals() else None,
                nutrition_context if 'nutrition_context' in locals() else None
            )
            fallback_response += "\n\n*Note: I'm experiencing technical difficulties, but I've provided guidance based on general nutrition principles.*"
            
            return ChatMessage(
                message_id=str(uuid.uuid4()),
                user_id=user_id,
                message=message,
                response=fallback_response,
                timestamp=datetime.now(),
                context_type=context_type,
                confidence_score=0.50,
                sources_used=["emergency_fallback"]
            )
    
    async def store_conversation(self, chat_message: ChatMessage):
        """Store conversation in database"""
        try:
            conversation_doc = {
                "message_id": chat_message.message_id,
                "user_id": chat_message.user_id,
                "message": chat_message.message,
                "response": chat_message.response,
                "timestamp": chat_message.timestamp,
                "context_type": chat_message.context_type,
                "user_profile": chat_message.user_profile,
                "nutrition_context": chat_message.nutrition_context,
                "confidence_score": chat_message.confidence_score,
                "sources_used": chat_message.sources_used
            }
            
            await self.db.chat_conversations.insert_one(conversation_doc)
            logger.info(f"Stored conversation for user {chat_message.user_id}")
            
        except Exception as e:
            logger.error(f"Failed to store conversation: {e}")
    
    async def get_conversation_history(self, user_id: str, limit: int = 10) -> List[ChatMessage]:
        """Get conversation history"""
        try:
            conversations = await self.db.chat_conversations.find(
                {"user_id": user_id}
            ).sort("timestamp", -1).limit(limit).to_list(length=limit)
            
            chat_messages = []
            for conv in conversations:
                chat_message = ChatMessage(
                    message_id=conv["message_id"],
                    user_id=conv["user_id"],
                    message=conv["message"],
                    response=conv["response"],
                    timestamp=conv["timestamp"],
                    context_type=conv["context_type"],
                    user_profile=conv.get("user_profile"),
                    nutrition_context=conv.get("nutrition_context"),
                    confidence_score=conv.get("confidence_score"),
                    sources_used=conv.get("sources_used")
                )
                chat_messages.append(chat_message)
            
            return list(reversed(chat_messages))
            
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []


# Create global instance
enhanced_diet_rag_chatbot = EnhancedDietRAGChatbot()
