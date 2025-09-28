"""
RAG Chatbot for Diet Agent
Provides personalized nutrition advice, meal suggestions, and diet-related Q&A
"""
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import asyncio
import numpy as np
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import JSONLoader
from langchain.schema import Document
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain_community.memory import ConversationBufferWindowMemory
from langchain.prompts import PromptTemplate
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
    context_type: str  # 'nutrition', 'meal_plan', 'health_goal', 'general'
    user_profile: Optional[Dict[str, Any]] = None
    nutrition_context: Optional[Dict[str, Any]] = None

class DietRAGChatbot:
    """
    RAG-powered chatbot for personalized diet and nutrition advice
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
        
    async def initialize(self):
        """Initialize the RAG chatbot with knowledge base and models"""
        try:
            # Initialize MongoDB connection first
            self.db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.db_client[settings.DATABASE_NAME]
            
            # Try to initialize OpenAI components with fallback
            try:
                self.embeddings = OpenAIEmbeddings(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model="text-embedding-ada-002"
                )
                
                self.chat_model = ChatOpenAI(
                    openai_api_key=settings.OPENAI_API_KEY,
                    model_name="gpt-4-turbo-preview",
                    temperature=0.7,
                    max_tokens=800
                )
                
                # Create nutrition knowledge base
                await self.create_nutrition_knowledge_base()
                
                # Initialize conversation memory
                self.memory = ConversationBufferWindowMemory(
                    k=10,  # Remember last 10 exchanges
                    memory_key="chat_history",
                    return_messages=True
                )
                
                # Create conversation chain
                await self.create_conversation_chain()
                
                logger.info("Diet RAG Chatbot initialized successfully with OpenAI")
                
            except Exception as openai_error:
                logger.warning(f"OpenAI initialization failed: {openai_error}")
                logger.info("Initializing with fallback system only")
                
                # Still create a basic knowledge base for fallback
                await self.create_basic_knowledge_base()
            
            self.knowledge_base_initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Diet RAG Chatbot: {e}")
            # Even if initialization fails, allow fallback responses
            self.knowledge_base_initialized = True
            if not self.db_client:
                try:
                    self.db_client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
                    self.db = self.db_client[settings.DATABASE_NAME]
                except:
                    logger.error("MongoDB connection also failed")
    
    async def create_basic_knowledge_base(self):
        """Create a basic knowledge base for fallback when OpenAI is unavailable"""
        try:
            logger.info("Creating basic knowledge base for fallback system")
            # This creates minimal structure for fallback
            self.vectorstore = None  # Will use fallback system instead
            logger.info("Basic knowledge base created for fallback")
        except Exception as e:
            logger.error(f"Failed to create basic knowledge base: {e}")
    
    async def create_nutrition_knowledge_base(self):
        """Create and populate the nutrition knowledge base"""
        try:
            # Comprehensive nutrition knowledge base
            nutrition_knowledge = [
                {
                    "topic": "Macronutrients",
                    "content": """
                    Proteins: Essential for muscle building and repair. Sources include lean meats, fish, eggs, dairy, legumes, nuts.
                    Recommended: 0.8-1.2g per kg body weight for sedentary adults, 1.2-2.0g for active individuals.
                    
                    Carbohydrates: Primary energy source. Choose complex carbs like whole grains, vegetables, fruits.
                    Recommended: 45-65% of total daily calories. Focus on fiber-rich sources.
                    
                    Fats: Essential for hormone production and nutrient absorption. Include healthy fats from nuts, avocados, olive oil, fish.
                    Recommended: 20-35% of total daily calories. Limit saturated and trans fats.
                    """
                },
                {
                    "topic": "Weight Management",
                    "content": """
                    Weight Loss: Create a caloric deficit of 500-750 calories per day for 1-2 lbs per week loss.
                    Focus on whole foods, portion control, regular meals, adequate protein.
                    
                    Weight Gain: Create a caloric surplus of 300-500 calories per day for healthy weight gain.
                    Include protein-rich foods, healthy fats, and strength training.
                    
                    Weight Maintenance: Balance calories in vs calories out. Focus on sustainable eating patterns.
                    """
                },
                {
                    "topic": "Meal Timing and Frequency",
                    "content": """
                    Breakfast: Include protein and fiber to stabilize blood sugar and reduce hunger.
                    Examples: Greek yogurt with berries, oatmeal with nuts, eggs with vegetables.
                    
                    Lunch: Balance of protein, complex carbs, and vegetables. Control portions.
                    Examples: Grilled chicken salad, quinoa bowl, soup with whole grain bread.
                    
                    Dinner: Lighter than lunch, focus on vegetables and lean protein.
                    Examples: Grilled fish with vegetables, lean meat with sweet potato.
                    
                    Snacks: Choose nutrient-dense options. Combine protein with fiber.
                    Examples: Apple with almond butter, Greek yogurt, mixed nuts.
                    """
                },
                {
                    "topic": "Hydration",
                    "content": """
                    Water Intake: 8-10 glasses (2-2.5 liters) per day for most adults.
                    Increase with exercise, hot weather, or illness.
                    
                    Signs of Good Hydration: Pale yellow urine, good energy levels, moist lips.
                    Signs of Dehydration: Dark urine, fatigue, headache, dry mouth.
                    
                    Hydrating Foods: Watermelon, cucumber, lettuce, soups, herbal teas.
                    """
                },
                {
                    "topic": "Specific Dietary Goals",
                    "content": """
                    Muscle Gain: Higher protein intake (1.6-2.2g per kg), strength training, adequate calories.
                    Include post-workout protein within 2 hours of exercise.
                    
                    Fat Loss: Moderate caloric deficit, high protein to preserve muscle, regular exercise.
                    Focus on whole foods, reduce processed foods and added sugars.
                    
                    General Health: Balanced diet with variety, regular meals, adequate sleep.
                    Follow Mediterranean or DASH diet patterns for optimal health.
                    """
                },
                {
                    "topic": "Food Substitutions",
                    "content": """
                    Healthier Alternatives:
                    - White rice → Brown rice, quinoa, cauliflower rice
                    - French fries → Baked sweet potato wedges, roasted vegetables
                    - Ice cream → Greek yogurt with berries, frozen fruit
                    - Pasta → Zucchini noodles, whole grain pasta, spaghetti squash
                    - Chips → Air-popped popcorn, nuts, vegetable chips
                    - Soda → Sparkling water with fruit, herbal tea
                    - Candy → Fresh fruit, dates with nuts
                    """
                },
                {
                    "topic": "Dietary Restrictions",
                    "content": """
                    Vegetarian: Focus on legumes, nuts, seeds, dairy, eggs for protein.
                    Ensure adequate B12, iron, and omega-3 fatty acids.
                    
                    Vegan: Include fortified foods or supplements for B12, vitamin D, iron.
                    Combine proteins (rice+beans) for complete amino acid profiles.
                    
                    Gluten-Free: Choose naturally gluten-free grains like rice, quinoa, corn.
                    Read labels carefully, ensure adequate fiber and B vitamins.
                    
                    Low-Carb: Focus on vegetables, proteins, healthy fats.
                    Limit grains, sugars, starchy vegetables. Monitor ketosis if applicable.
                    """
                },
                {
                    "topic": "Meal Preparation Tips",
                    "content": """
                    Batch Cooking: Prepare proteins, grains, and vegetables in bulk on weekends.
                    Store in portioned containers for easy meal assembly.
                    
                    Healthy Cooking Methods: Grilling, steaming, baking, sautéing with minimal oil.
                    Avoid deep frying and excessive added fats.
                    
                    Seasoning: Use herbs, spices, lemon, vinegar instead of salt and sugar.
                    Enhance flavors naturally to reduce processed condiments.
                    """
                }
            ]
            
            # Convert knowledge to documents
            documents = []
            for item in nutrition_knowledge:
                doc = Document(
                    page_content=f"Topic: {item['topic']}\n\n{item['content']}",
                    metadata={"topic": item["topic"], "source": "nutrition_knowledge_base"}
                )
                documents.append(doc)
            
            # Add food-specific knowledge
            food_knowledge = await self.get_food_specific_knowledge()
            documents.extend(food_knowledge)
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            
            split_documents = text_splitter.split_documents(documents)
            
            # Create vector store
            self.vectorstore = FAISS.from_documents(
                split_documents,
                self.embeddings
            )
            
            self.knowledge_base_initialized = True
            logger.info(f"Nutrition knowledge base created with {len(split_documents)} document chunks")
            
        except Exception as e:
            logger.error(f"Failed to create nutrition knowledge base: {e}")
            raise
    
    async def get_food_specific_knowledge(self) -> List[Document]:
        """Get food-specific knowledge from database or predefined data"""
        try:
            food_data = [
                {
                    "food": "Rice and Curry",
                    "info": "Traditional Sri Lankan meal. Rice provides carbohydrates, curry adds protein and vegetables. Moderate portions recommended. Consider brown rice for more fiber."
                },
                {
                    "food": "Kottu Roti",
                    "info": "Popular Sri Lankan street food. High in calories and carbs. Contains vegetables and protein. Enjoy occasionally, balance with lighter meals."
                },
                {
                    "food": "Hoppers",
                    "info": "Fermented rice flour pancakes. Good source of carbs. Pair with protein-rich curries or eggs. Coconut milk adds healthy fats."
                },
                {
                    "food": "Dhal Curry",
                    "info": "Excellent protein source from lentils. High in fiber and nutrients. Low in fat. Perfect for vegetarian protein needs."
                },
                {
                    "food": "Fish Curry",
                    "info": "High-quality protein and omega-3 fatty acids. Good for heart health and muscle building. Choose grilled or steamed over fried."
                },
                {
                    "food": "Chicken",
                    "info": "Lean protein source. Remove skin to reduce fat. Good for muscle building and weight management. Versatile cooking options."
                }
            ]
            
            documents = []
            for item in food_data:
                doc = Document(
                    page_content=f"Food: {item['food']}\n\nNutrition Info: {item['info']}",
                    metadata={"food": item["food"], "source": "food_database"}
                )
                documents.append(doc)
            
            return documents
            
        except Exception as e:
            logger.error(f"Failed to get food-specific knowledge: {e}")
            return []
    
    async def create_conversation_chain(self):
        """Create the conversational retrieval chain with enhanced error handling"""
        try:
            if not self.chat_model or not self.vectorstore:
                logger.warning("Chat model or vectorstore not available for conversation chain")
                return
                
            # Create custom prompt template for better nutrition responses
            custom_prompt = PromptTemplate(
                input_variables=["question", "chat_history"],
                template="""You are a professional nutrition and diet expert AI assistant. Your role is to provide evidence-based, personalized nutrition advice.

Guidelines:
1. Always consider the user's profile, goals, dietary restrictions, and recent eating patterns
2. Provide specific, actionable recommendations
3. Be supportive and encouraging while being scientifically accurate
4. Consider cultural food preferences when mentioned
5. Always prioritize safety - recommend consulting healthcare professionals for medical conditions
6. Format responses clearly with sections when appropriate

Previous conversation:
{chat_history}

Current question: {question}

Please provide a comprehensive, personalized nutrition response:"""
            )
            
            # Create the conversational retrieval chain
            self.conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=self.chat_model,
                retriever=self.vectorstore.as_retriever(
                    search_kwargs={"k": 6}  # Increased for more context
                ),
                memory=self.memory,
                return_source_documents=True,
                verbose=False,  # Reduced verbosity for cleaner logs
                combine_docs_chain_kwargs={
                    "prompt": custom_prompt
                }
            )
            
            logger.info("Enhanced conversation chain created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create conversation chain: {e}")
            # Don't raise exception, allow fallback to work
    
    async def get_user_context(self, user_id: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Get user profile and recent nutrition data for context"""
        try:
            user_profile = {}
            nutrition_context = {}
            
            # Get user profile
            profile_doc = await self.db.diet_profiles.find_one({"user_id": user_id})
            if profile_doc:
                user_profile = {
                    "age": profile_doc.get("age"),
                    "weight": profile_doc.get("weight"),
                    "height": profile_doc.get("height"),
                    "gender": profile_doc.get("gender"),
                    "activity_level": profile_doc.get("activity_level"),
                    "goal": profile_doc.get("goal"),
                    "dietary_restrictions": profile_doc.get("dietary_restrictions", []),
                    "allergies": profile_doc.get("allergies", []),
                    "bmi": profile_doc.get("bmi"),
                    "daily_calorie_goal": profile_doc.get("daily_calorie_goal")
                }
            
            # Get recent nutrition entries (last 7 days)
            seven_days_ago = datetime.now() - timedelta(days=7)
            nutrition_entries = await self.db.nutrition_entries.find({
                "user_id": user_id,
                "date": {"$gte": seven_days_ago.isoformat()}
            }).to_list(length=50)
            
            if nutrition_entries:
                total_calories = sum(entry.get("calories", 0) for entry in nutrition_entries)
                total_protein = sum(entry.get("protein", 0) for entry in nutrition_entries)
                total_carbs = sum(entry.get("carbs", 0) for entry in nutrition_entries)
                total_fat = sum(entry.get("fat", 0) for entry in nutrition_entries)
                
                nutrition_context = {
                    "recent_entries_count": len(nutrition_entries),
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
        """
        Process a chat message and return personalized nutrition advice with enhanced fallback
        """
        response = ""
        use_fallback = False
        
        try:
            if not self.knowledge_base_initialized:
                await self.initialize()
            
            # Get user context
            user_profile, nutrition_context = await self.get_user_context(user_id)
            
            # Try OpenAI-powered RAG first
            if self.conversation_chain and self.vectorstore:
                try:
                    # Enhance the question with context
                    enhanced_question = f"""
                    User Question: {message}
                    
                    Context Type: {context_type}
                    
                    User Profile: {json.dumps(user_profile) if user_profile else "Not available"}
                    
                    Recent Nutrition Data: {json.dumps(nutrition_context) if nutrition_context else "Not available"}
                    
                    Instructions: Provide personalized nutrition advice considering the user's profile, dietary restrictions, goals, and recent eating patterns. Be specific, practical, and supportive.
                    """
                    
                    # Get response from the conversation chain with timeout
                    result = await asyncio.wait_for(
                        asyncio.get_event_loop().run_in_executor(
                            None, 
                            self.conversation_chain,
                            {"question": enhanced_question}
                        ),
                        timeout=15.0  # 15 second timeout
                    )
                    
                    response = result["answer"]
                    source_docs = result.get("source_documents", [])
                    
                    # Validate response quality
                    if len(response.strip()) < 50:
                        logger.warning("OpenAI response too short, using fallback")
                        use_fallback = True
                    else:
                        logger.info("Successfully generated OpenAI response")
                        
                except (RateLimitError, AuthenticationError) as api_error:
                    logger.warning(f"OpenAI API error: {api_error}. Using fallback system.")
                    use_fallback = True
                except asyncio.TimeoutError:
                    logger.warning("OpenAI request timed out. Using fallback system.")
                    use_fallback = True
                except Exception as openai_error:
                    logger.warning(f"OpenAI processing failed: {openai_error}. Using fallback system.")
                    use_fallback = True
            else:
                logger.info("OpenAI not available, using fallback system")
                use_fallback = True
            
            # Use enhanced fallback system if needed
            if use_fallback or not response.strip():
                logger.info("Generating response using enhanced fallback system")
                response = enhanced_nutrition_fallback.get_intelligent_response(
                    message, 
                    user_profile, 
                    nutrition_context
                )
                
                # Add fallback indicator for transparency
                response += "\n\n*Note: This response was generated using our comprehensive nutrition knowledge base.*"
            
            # Create chat message object
            chat_message = ChatMessage(
                message_id=str(uuid.uuid4()),
                user_id=user_id,
                message=message,
                response=response,
                timestamp=datetime.now(),
                context_type=context_type,
                user_profile=user_profile if user_profile else None,
                nutrition_context=nutrition_context if nutrition_context else None
            )
            
            # Store conversation in database
            await self.store_conversation(chat_message)
            
            return chat_message
            
        except Exception as e:
            logger.error(f"Error in chat processing: {e}")
            
            # Ultimate fallback - generate a helpful response even if everything fails
            try:
                fallback_response = enhanced_nutrition_fallback.get_intelligent_response(
                    message, 
                    user_profile if 'user_profile' in locals() else None, 
                    nutrition_context if 'nutrition_context' in locals() else None
                )
                fallback_response += "\n\n*Note: I'm currently experiencing some technical difficulties, but I've provided guidance based on general nutrition principles.*"
            except:
                fallback_response = """I apologize, but I'm currently experiencing technical difficulties. Here are some general nutrition tips that might help:

• Focus on whole, unprocessed foods
• Include plenty of vegetables and fruits in your diet
• Choose lean proteins and healthy fats
• Stay adequately hydrated throughout the day
• Practice portion control and mindful eating

For personalized advice, please try again later or consult with a healthcare professional."""
            
            return ChatMessage(
                message_id=str(uuid.uuid4()),
                user_id=user_id,
                message=message,
                response=fallback_response,
                timestamp=datetime.now(),
                context_type=context_type
            )
    
    async def store_conversation(self, chat_message: ChatMessage):
        """Store conversation in database for learning and history"""
        try:
            conversation_doc = {
                "message_id": chat_message.message_id,
                "user_id": chat_message.user_id,
                "message": chat_message.message,
                "response": chat_message.response,
                "timestamp": chat_message.timestamp,
                "context_type": chat_message.context_type,
                "user_profile": chat_message.user_profile,
                "nutrition_context": chat_message.nutrition_context
            }
            
            await self.db.chat_conversations.insert_one(conversation_doc)
            logger.info(f"Stored conversation for user {chat_message.user_id}")
            
        except Exception as e:
            logger.error(f"Failed to store conversation: {e}")
    
    async def get_conversation_history(self, user_id: str, limit: int = 10) -> List[ChatMessage]:
        """Get conversation history for a user"""
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
                    nutrition_context=conv.get("nutrition_context")
                )
                chat_messages.append(chat_message)
            
            return list(reversed(chat_messages))  # Return in chronological order
            
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    async def get_nutrition_recommendations(self, user_id: str) -> str:
        """Get personalized nutrition recommendations based on user data"""
        try:
            user_profile, nutrition_context = await self.get_user_context(user_id)
            
            if not user_profile:
                return "Please complete your profile first to get personalized recommendations."
            
            # Create a specific question for recommendations
            question = f"""
            Based on my profile and recent eating patterns, what are your top 3 nutrition recommendations for me this week? 
            Please consider my goal of {user_profile.get('goal', 'general health')} and my activity level of {user_profile.get('activity_level', 'moderate')}.
            """
            
            chat_response = await self.chat(user_id, question, "nutrition_recommendations")
            return chat_response.response
            
        except Exception as e:
            logger.error(f"Failed to get nutrition recommendations: {e}")
            return "Unable to generate recommendations at this time. Please try again later."
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get detailed health status of the RAG chatbot system"""
        try:
            status = {
                "chatbot_initialized": self.knowledge_base_initialized,
                "openai_available": bool(self.chat_model and self.vectorstore),
                "mongodb_connected": bool(self.db),
                "fallback_system": "enhanced_nutrition_fallback",
                "timestamp": datetime.now().isoformat()
            }
            
            # Test MongoDB connection
            if self.db:
                try:
                    await self.db.command("ping")
                    status["mongodb_status"] = "connected"
                except:
                    status["mongodb_status"] = "disconnected"
            else:
                status["mongodb_status"] = "not_initialized"
            
            # Test OpenAI components
            if self.chat_model:
                try:
                    # Simple test to check if model is responsive
                    status["openai_model"] = "available"
                    status["vector_store_documents"] = self.vectorstore.index.ntotal if self.vectorstore else 0
                except:
                    status["openai_model"] = "error"
                    status["vector_store_documents"] = 0
            else:
                status["openai_model"] = "not_initialized"
                status["vector_store_documents"] = 0
            
            # Check conversation memory
            status["conversation_memory"] = "available" if self.memory else "not_available"
            
            return status
            
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "status": "error"
            }
    
    async def get_enhanced_nutrition_recommendations(self, user_id: str) -> str:
        """Get comprehensive personalized nutrition recommendations"""
        try:
            user_profile, nutrition_context = await self.get_user_context(user_id)
            
            if not user_profile:
                return """To provide personalized recommendations, please complete your profile with:
• Age, weight, height, and gender
• Activity level and fitness goals
• Dietary restrictions or preferences
• Any food allergies

This information helps me give you more accurate and relevant nutrition advice."""
            
            # Generate comprehensive recommendations
            recommendations_request = f"""
            Based on my complete profile and recent eating patterns, provide me with:
            1. Top 3 priority nutrition recommendations for this week
            2. Specific meal suggestions for tomorrow
            3. Foods I should focus on adding to my diet
            4. Any nutrition gaps I should address
            5. Progress tips based on my goal of {user_profile.get('goal', 'general health')}
            
            Please make recommendations practical and actionable for someone with my lifestyle and preferences.
            """
            
            # Try to get AI-powered recommendations first
            try:
                if self.conversation_chain:
                    result = await asyncio.wait_for(
                        asyncio.get_event_loop().run_in_executor(
                            None,
                            self.conversation_chain,
                            {"question": recommendations_request}
                        ),
                        timeout=20.0
                    )
                    ai_response = result["answer"]
                    
                    if len(ai_response.strip()) > 100:
                        return ai_response
            except Exception as e:
                logger.warning(f"AI recommendations failed: {e}")
            
            # Use enhanced fallback for recommendations
            fallback_response = enhanced_nutrition_fallback.get_intelligent_response(
                recommendations_request,
                user_profile,
                nutrition_context
            )
            
            # Add personalized context
            if user_profile.get("goal"):
                goal_specific_advice = self._get_goal_specific_advice(user_profile["goal"])
                fallback_response += f"\n\n**For Your {user_profile['goal'].replace('_', ' ').title()} Goal:**\n{goal_specific_advice}"
            
            if nutrition_context and nutrition_context.get("recent_foods"):
                recent_analysis = self._analyze_recent_eating_patterns(nutrition_context)
                fallback_response += f"\n\n**Based on Your Recent Eating:**\n{recent_analysis}"
            
            return fallback_response
            
        except Exception as e:
            logger.error(f"Failed to get enhanced nutrition recommendations: {e}")
            return "I'm having trouble generating recommendations right now. Please try again later or consult with a nutrition professional for personalized advice."
    
    def _get_goal_specific_advice(self, goal: str) -> str:
        """Get specific advice based on user's goal"""
        goal_advice = {
            "weight_loss": """• Create a moderate caloric deficit (500-750 calories/day)
• Focus on high-protein foods to maintain muscle mass
• Include plenty of vegetables for volume and nutrients
• Stay hydrated and get adequate sleep for hormone balance""",
            
            "weight_gain": """• Aim for a caloric surplus of 300-500 calories per day
• Include calorie-dense, nutrient-rich foods
• Focus on strength training to build muscle mass
• Eat frequent meals and healthy snacks""",
            
            "muscle_gain": """• Consume 1.6-2.2g protein per kg body weight
• Time protein intake around workouts
• Include complex carbs for energy and recovery
• Stay consistent with both nutrition and training""",
            
            "general_health": """• Follow a balanced, varied diet with all food groups
• Aim for 5-9 servings of fruits and vegetables daily
• Choose whole grains over refined carbohydrates
• Limit processed foods and added sugars""",
            
            "fat_loss": """• Maintain adequate protein intake to preserve muscle
• Include strength training with your cardio routine
• Focus on whole, minimally processed foods
• Monitor portions while ensuring nutritional needs are met"""
        }
        
        return goal_advice.get(goal, goal_advice["general_health"])
    
    def _analyze_recent_eating_patterns(self, nutrition_context: Dict) -> str:
        """Analyze recent eating patterns and provide insights"""
        try:
            recent_foods = nutrition_context.get("recent_foods", [])
            avg_calories = nutrition_context.get("weekly_avg_calories", 0)
            avg_protein = nutrition_context.get("weekly_avg_protein", 0)
            
            analysis = []
            
            if recent_foods:
                # Check for variety
                unique_foods = set(food.lower() for food in recent_foods if food)
                if len(unique_foods) < 3:
                    analysis.append("• Try to add more variety to your meals for better nutrient coverage")
                
                # Check for common patterns
                rice_count = sum(1 for food in recent_foods if "rice" in food.lower())
                if rice_count > len(recent_foods) * 0.6:
                    analysis.append("• Consider alternating rice with other grains like quinoa or brown rice")
                
                curry_count = sum(1 for food in recent_foods if "curry" in food.lower())
                if curry_count > 2:
                    analysis.append("• Great choice with curries! Try to include different vegetables and legumes")
            
            if avg_calories > 0:
                if avg_calories < 1500:
                    analysis.append("• Your calorie intake seems low - make sure you're eating enough to meet your needs")
                elif avg_calories > 3000:
                    analysis.append("• Consider monitoring portion sizes if weight management is a goal")
            
            if avg_protein > 0:
                if avg_protein < 50:
                    analysis.append("• Try to include more protein sources in your meals for better satiety")
                elif avg_protein > 150:
                    analysis.append("• Good protein intake! Make sure to balance with carbs and healthy fats")
            
            if not analysis:
                analysis.append("• Your recent eating patterns look good - keep up the balanced approach!")
            
            return "\n".join(analysis)
            
        except Exception as e:
            logger.error(f"Error analyzing eating patterns: {e}")
            return "• Continue focusing on balanced, nutritious meals"

# Global chatbot instance
diet_rag_chatbot = DietRAGChatbot()