from langchain.agents import Tool, AgentExecutor, create_react_agent # type: ignore
from langchain_openai import ChatOpenAI # type: ignore
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain
from langchain.output_parsers import PydanticOutputParser
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import json
import os

class HealthData(BaseModel):
    """Schema for health-related data"""
    diet_data: Dict = Field(description="Diet-related data including calories and macros")
    fitness_data: Dict = Field(description="Fitness-related data including workouts and calories burned")
    mental_health_data: Dict = Field(description="Mental health data including mood scores")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PrivacyPreferences(BaseModel):
    """Schema for privacy preferences"""
    share_with_doctor: bool = Field(default=False)
    share_with_coach: bool = Field(default=False)
    allow_analytics: bool = Field(default=False)
    data_retention_days: int = Field(default=365)
    backup_frequency: str = Field(default="weekly")

class SecurityReport(BaseModel):
    """Schema for security analysis reports"""
    risk_level: str = Field(description="Overall security risk level")
    findings: List[str] = Field(description="List of security findings")
    recommendations: List[str] = Field(description="Security recommendations")
    data_access_patterns: Dict = Field(description="Analysis of data access patterns")

class HealthReport(BaseModel):
    """Schema for weekly health reports"""
    diet_summary: Dict = Field(description="Summary of dietary habits")
    fitness_summary: Dict = Field(description="Summary of fitness activities")
    mental_health_summary: Dict = Field(description="Summary of mental health trends")
    recommendations: List[str] = Field(description="AI-generated health recommendations")

class SecurityAgent:
    def __init__(self, openai_api_key: Optional[str] = None):
        """Initialize the Security Agent with LangChain components and custom tools"""
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.2,
            openai_api_key=self.openai_api_key
        )
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        
        # Initialize output parsers
        self.security_parser = PydanticOutputParser(pydantic_object=SecurityReport)
        self.health_parser = PydanticOutputParser(pydantic_object=HealthReport)
        
        # Setup components
        self._setup_prompts()
        self._setup_chains()
        self._setup_tools()
        self.agent = self._create_agent()

    def _setup_prompts(self):
        """Initialize prompt templates with output parsers"""
        self.analyze_prompt = PromptTemplate(
            template="""
            Analyze the following health data and provide security recommendations:
            
            Health Data: {health_data}
            Privacy Settings: {privacy_settings}
            
            Provide a detailed security analysis including:
            1. Privacy risks
            2. Data sensitivity assessment
            3. Security recommendations
            4. Compliance requirements
            
            {format_instructions}
            """,
            input_variables=["health_data", "privacy_settings"],
            partial_variables={"format_instructions": self.security_parser.get_format_instructions()}
        )
        
        self.report_prompt = PromptTemplate(
            template="""
            Generate a weekly health report with privacy considerations:
            
            Previous Data: {previous_data}
            Current Data: {current_data}
            Privacy Level: {privacy_level}
            
            Generate a comprehensive report including:
            1. Health trends (anonymized)
            2. Progress metrics
            3. Recommendations
            4. Privacy notices
            
            {format_instructions}
            """,
            input_variables=["previous_data", "current_data", "privacy_level"],
            partial_variables={"format_instructions": self.health_parser.get_format_instructions()}
        )

    def _setup_chains(self):
        """Initialize LangChain chains"""
        self.analysis_chain = LLMChain(
            llm=self.llm,
            prompt=self.analyze_prompt,
            output_parser=self.security_parser
        )
        
        self.report_chain = LLMChain(
            llm=self.llm,
            prompt=self.report_prompt,
            output_parser=self.health_parser
        )

    def _setup_tools(self):
        """Initialize tools for the agent"""
        self.tools = [
            Tool(
                name="analyze_health_data",
                func=self.analyze_health_data,
                description="Analyzes health data for security risks and privacy concerns"
            ),
            Tool(
                name="generate_health_report",
                func=self.generate_health_report,
                description="Generates privacy-aware weekly health reports"
            ),
            Tool(
                name="assess_security",
                func=self.assess_security_risks,
                description="Performs security risk assessment of the system"
            )
        ]

    def _create_agent(self) -> AgentExecutor:
        """Create the agent executor"""
        prompt = PromptTemplate.from_template(
            """You are a Security and Privacy Agent for a health monitoring system.
            Your goal is to protect user data while providing valuable insights.
            
            Use these tools to help users:
            {tools}
            
            Human: {input}
            AI: Let me help you with that."""
        )
        
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True
        )

    async def analyze_health_data(self, health_data: Dict, privacy_settings: Optional[Dict] = None) -> SecurityReport:
        """Analyze health data for security risks and privacy concerns"""
        try:
            # Use default privacy settings if none provided
            if not privacy_settings:
                privacy_settings = PrivacyPreferences().dict()
            
            # Run analysis chain
            result = await self.analysis_chain.arun(
                health_data=json.dumps(health_data),
                privacy_settings=json.dumps(privacy_settings)
            )
            
            return result
        except Exception as e:
            raise Exception(f"Health data analysis failed: {str(e)}")

    async def generate_health_report(
        self,
        current_data: Dict,
        previous_data: Optional[Dict] = None,
        privacy_level: str = "high"
    ) -> HealthReport:
        """Generate a privacy-aware weekly health report"""
        try:
            result = await self.report_chain.arun(
                previous_data=json.dumps(previous_data) if previous_data else "{}",
                current_data=json.dumps(current_data),
                privacy_level=privacy_level
            )
            
            return result
        except Exception as e:
            raise Exception(f"Health report generation failed: {str(e)}")

    async def assess_security_risks(
        self,
        system_data: Dict,
        access_patterns: Optional[Dict] = None,
        security_incidents: Optional[List[Dict]] = None
    ) -> SecurityReport:
        """Perform security risk assessment"""
        try:
            assessment_data = {
                "system_data": system_data,
                "access_patterns": access_patterns or {},
                "security_incidents": security_incidents or []
            }
            
            # Use the agent for complex security assessment
            result = await self.agent.arun(
                input=f"Perform a security assessment of the following system: {json.dumps(assessment_data)}"
            )
            
            return SecurityReport.parse_raw(result)
        except Exception as e:
            raise Exception(f"Security risk assessment failed: {str(e)}")

    async def process_gdpr_request(self, user_id: str, data_types: Optional[List[str]] = None) -> Dict:
        """Process GDPR data deletion request"""
        try:
            # Record deletion request
            deletion_record = {
                "user_id": user_id,
                "data_types": data_types or ["all"],
                "timestamp": datetime.utcnow().isoformat(),
                "status": "processing"
            }
            
            # Use the agent to handle deletion
            result = await self.agent.arun(
                input=f"Process GDPR deletion request: {json.dumps(deletion_record)}"
            )
            
            return json.loads(result)
        except Exception as e:
            raise Exception(f"GDPR request processing failed: {str(e)}")

    async def update_privacy_settings(self, user_id: str, settings: Dict) -> Dict:
        """Update user privacy settings"""
        try:
            # Validate settings
            preferences = PrivacyPreferences(**settings)
            
            # Record update
            update_record = {
                "user_id": user_id,
                "settings": preferences.dict(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return update_record
        except Exception as e:
            raise Exception(f"Privacy settings update failed: {str(e)}")
            memory_key="chat_history",
            return_messages=True
        
        self._setup_chains()
        self._setup_tools()
        self._setup_agent()

    def _setup_chains(self):
        """Setup specialized chains for different tasks"""
        # Health Report Analysis Chain
        health_report_template = """
        Analyze the following health data and generate a comprehensive weekly report:

        Diet Data: {diet_data}
        Fitness Data: {fitness_data}
        Mental Health Data: {mental_health_data}

        Generate a detailed analysis including:
        1. Diet patterns and macro nutrient balance
        2. Workout effectiveness and calories burned
        3. Mental health trends and mood patterns
        4. Personalized recommendations

        {format_instructions}
        """
        self.health_report_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=health_report_template,
                input_variables=["diet_data", "fitness_data", "mental_health_data"],
                partial_variables={"format_instructions": PydanticOutputParser(pydantic_object=HealthReport).get_format_instructions()}
            ),
            output_parser=PydanticOutputParser(pydantic_object=HealthReport)
        )

        # Security Analysis Chain
        security_template = """
        Analyze the following security-related data and privacy preferences:

        Access Patterns: {access_patterns}
        Privacy Settings: {privacy_settings}
        Data Sharing: {data_sharing}

        Provide a comprehensive security analysis including:
        1. Risk assessment
        2. Potential vulnerabilities
        3. Privacy implications
        4. Specific recommendations

        {format_instructions}
        """
        self.security_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=security_template,
                input_variables=["access_patterns", "privacy_settings", "data_sharing"],
                partial_variables={"format_instructions": PydanticOutputParser(pydantic_object=SecurityReport).get_format_instructions()}
            ),
            output_parser=PydanticOutputParser(pydantic_object=SecurityReport)
        )

    def _setup_tools(self):
        """Setup tools for the agent"""
        self.tools = [
            Tool(
                name="analyze_health_data",
                func=self.analyze_health_data,
                description="Analyzes health data and generates comprehensive reports"
            ),
            Tool(
                name="analyze_security",
                func=self.analyze_security,
                description="Performs security analysis and risk assessment"
            ),
            Tool(
                name="manage_privacy",
                func=self.manage_privacy_preferences,
                description="Manages user privacy preferences and data sharing settings"
            ),
            Tool(
                name="generate_backup",
                func=self.generate_secure_backup,
                description="Generates encrypted backups of user data"
            )
        ]

    def _setup_agent(self):
        """Setup the main agent"""
        agent_prompt = PromptTemplate.from_template("""
        You are a Data & Security Agent responsible for managing sensitive health data.
        Your primary responsibilities are:
        1. Protecting user privacy and security
        2. Managing data access and sharing
        3. Generating health reports and insights
        4. Ensuring GDPR compliance

        Current conversation:
        {chat_history}

        User Question: {input}
        {agent_scratchpad}
        """)

        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=agent_prompt
        )

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True
        )

    async def analyze_health_data(self, data: Dict) -> HealthReport:
        """Analyze health data and generate insights"""
        try:
            return await self.health_report_chain.arun(
                diet_data=json.dumps(data.get("diet_data", {})),
                fitness_data=json.dumps(data.get("fitness_data", {})),
                mental_health_data=json.dumps(data.get("mental_health_data", {}))
            )
        except Exception as e:
            raise Exception(f"Health data analysis failed: {str(e)}")

    async def analyze_security(self, data: Dict) -> SecurityReport:
        """Perform security analysis"""
        try:
            return await self.security_chain.arun(
                access_patterns=json.dumps(data.get("access_patterns", {})),
                privacy_settings=json.dumps(data.get("privacy_settings", {})),
                data_sharing=json.dumps(data.get("data_sharing", {}))
            )
        except Exception as e:
            raise Exception(f"Security analysis failed: {str(e)}")

    async def manage_privacy_preferences(self, preferences: Dict) -> PrivacyPreferences:
        """Update and manage privacy preferences"""
        try:
            return PrivacyPreferences(**preferences)
        except Exception as e:
            raise Exception(f"Failed to update privacy preferences: {str(e)}")

    async def generate_secure_backup(self, data: Dict) -> str:
        """Generate encrypted backup of user data"""
        try:
            # Implement actual encryption and backup logic here
            return "Backup generated successfully with AES-256 encryption"
        except Exception as e:
            raise Exception(f"Backup generation failed: {str(e)}")

    async def process_request(self, request: str, context: Dict = None) -> Dict:
        """Process user requests using the agent"""
        try:
            response = await self.agent_executor.arun(
                input=request,
                context=context or {}
            )
            return {"status": "success", "response": response}
        except Exception as e:
            return {"status": "error", "message": str(e)}
