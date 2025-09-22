from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import os

from .encryption import EncryptionManager
from .database import HealthDataDB
from .backup import BackupManager

class SecurityAgentPrompts:
    ANALYZE_HEALTH_DATA = """
    Analyze the following health data and generate insights while maintaining privacy:

    Diet Data: {diet_data}
    Fitness Data: {fitness_data}
    Mental Health Data: {mental_health_data}

    Consider:
    1. Privacy concerns in the data
    2. Potential sensitive information
    3. Required encryption levels
    4. Data sharing implications

    Generate a comprehensive analysis including:
    1. Health insights and patterns
    2. Privacy recommendations
    3. Security measures needed
    4. Safe sharing guidelines
    """

    GENERATE_REPORT = """
    Generate a weekly health report from the following data:

    Previous Report: {previous_report}
    New Data: {new_data}
    Privacy Level: {privacy_level}

    Requirements:
    1. Summarize diet metrics (calories, macros)
    2. Analyze fitness progress (workouts, calories)
    3. Track mental health trends (mood patterns)
    4. Ensure privacy compliance
    5. Generate actionable recommendations
    """

    BACKUP_STRATEGY = """
    Create a backup strategy for the following health data:

    Data Types: {data_types}
    Volume: {data_volume}
    Sensitivity: {sensitivity_level}

    Consider:
    1. Encryption requirements
    2. Storage locations (cloud/local)
    3. Backup frequency
    4. Retention policies
    5. Recovery procedures
    """

class HealthSecurityAgent:
    def __init__(self, 
                 openai_api_key: Optional[str] = None,
                 mongodb_url: Optional[str] = None,
                 backup_path: Optional[str] = None,
                 aws_access_key: Optional[str] = None,
                 aws_secret_key: Optional[str] = None):
        """Initialize the Health Security Agent with all components"""
        # Initialize OpenAI and LangChain
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.2,
            openai_api_key=self.openai_api_key
        )
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        # Initialize security components
        self.encryption = EncryptionManager()
        self.db = HealthDataDB(mongodb_url or os.getenv("MONGODB_URL"))
        self.backup_manager = BackupManager(
            backup_path or os.path.join(os.getcwd(), "backups"),
            aws_access_key or os.getenv("AWS_ACCESS_KEY"),
            aws_secret_key or os.getenv("AWS_SECRET_KEY")
        )

        self._setup_chains()
        self._setup_tools()

    def _setup_chains(self):
        """Initialize LangChain chains for different tasks"""
        # Health Data Analysis Chain
        self.analysis_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=SecurityAgentPrompts.ANALYZE_HEALTH_DATA,
                input_variables=["diet_data", "fitness_data", "mental_health_data"]
            )
        )

        # Report Generation Chain
        self.report_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=SecurityAgentPrompts.GENERATE_REPORT,
                input_variables=["previous_report", "new_data", "privacy_level"]
            )
        )

        # Backup Strategy Chain
        self.backup_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=SecurityAgentPrompts.BACKUP_STRATEGY,
                input_variables=["data_types", "data_volume", "sensitivity_level"]
            )
        )

    def _setup_tools(self):
        """Set up tools for the agent"""
        self.tools = [
            Tool(
                name="analyze_health_data",
                func=self._analyze_health_data,
                description="Analyzes health data with privacy considerations"
            ),
            Tool(
                name="generate_health_report",
                func=self._generate_health_report,
                description="Generates privacy-aware weekly health reports"
            ),
            Tool(
                name="create_backup_strategy",
                func=self._create_backup_strategy,
                description="Creates secure backup strategies for health data"
            ),
        ]

    async def analyze_privacy_risks(self, user_id: str, health_data: Dict) -> Dict:
        """Analyze privacy risks in health data and store securely"""
        try:
            # First encrypt the data
            encrypted_data = self.encryption.encrypt_sensitive_data(health_data)
            
            # Store encrypted data
            await self.db.store_health_data(
                user_id=user_id,
                data=encrypted_data,
                data_type="health_analysis"
            )

            # Analyze the data
            analysis = await self.analysis_chain.arun(
                diet_data=json.dumps(health_data.get('diet', {})),
                fitness_data=json.dumps(health_data.get('fitness', {})),
                mental_health_data=json.dumps(health_data.get('mental_health', {}))
            )

            # Create backup of the analysis
            await self.backup_manager.create_local_backup(
                user_id=user_id,
                data={"analysis": analysis, "encrypted_data": encrypted_data}
            )

            return {
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat(),
                "risk_level": self._calculate_risk_level(analysis),
                "encryption_status": "encrypted"
            }
        except Exception as e:
            raise Exception(f"Privacy risk analysis failed: {str(e)}")

    async def generate_weekly_report(
        self,
        new_data: Dict,
        previous_report: Optional[Dict] = None,
        privacy_level: str = "high"
    ) -> Dict:
        """Generate a privacy-aware weekly health report"""
        try:
            report = await self.report_chain.arun(
                previous_report=json.dumps(previous_report) if previous_report else "{}",
                new_data=json.dumps(new_data),
                privacy_level=privacy_level
            )
            return {
                "report": report,
                "generated_at": datetime.utcnow().isoformat(),
                "privacy_level": privacy_level
            }
        except Exception as e:
            raise Exception(f"Report generation failed: {str(e)}")

    async def create_backup_strategy(
        self,
        data_types: List[str],
        data_volume: str,
        sensitivity_level: str = "high"
    ) -> Dict:
        """Create a secure backup strategy"""
        try:
            strategy = await self.backup_chain.arun(
                data_types=json.dumps(data_types),
                data_volume=data_volume,
                sensitivity_level=sensitivity_level
            )
            return {
                "strategy": strategy,
                "created_at": datetime.utcnow().isoformat(),
                "next_backup": self._calculate_next_backup()
            }
        except Exception as e:
            raise Exception(f"Backup strategy creation failed: {str(e)}")

    def _calculate_risk_level(self, analysis: str) -> str:
        """Calculate risk level based on analysis"""
        # Implement risk level calculation logic
        risk_keywords = {
            "high": ["sensitive", "critical", "immediate", "severe"],
            "medium": ["moderate", "potential", "consider", "possible"],
            "low": ["minimal", "minor", "low", "safe"]
        }

        analysis_lower = analysis.lower()
        for level, keywords in risk_keywords.items():
            if any(keyword in analysis_lower for keyword in keywords):
                return level
        return "medium"

    def _calculate_next_backup(self) -> str:
        """Calculate next backup time"""
        return (datetime.utcnow() + timedelta(days=1)).isoformat()

    async def process_gdpr_request(self, user_id: str, data_types: Optional[List[str]] = None) -> Dict:
        """Process GDPR data deletion request with actual data deletion"""
        try:
            # Create backup before deletion (for compliance purposes)
            user_data = await self.db.get_user_health_data(user_id, data_types=data_types)
            backup_result = await self.backup_manager.create_cloud_backup(
                user_id=user_id,
                data={"deleted_data": user_data, "deletion_timestamp": datetime.utcnow().isoformat()},
                bucket_name="gdpr-compliance-backups"
            )

            # Perform actual data deletion
            deletion_result = await self.db.delete_user_data(user_id, data_types)
            
            deletion_scope = "all" if not data_types else "partial"
            message = f"Processing GDPR deletion request for user {user_id}"
            if data_types:
                message += f" for data types: {', '.join(data_types)}"
            
            return {
                "status": "processed",
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
                "confirmation_id": f"gdpr_{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "deleted_records": deletion_result["deleted_count"],
                "backup_reference": backup_result["key"]
            }
        except Exception as e:
            raise Exception(f"GDPR request processing failed: {str(e)}")

    async def update_privacy_preferences(
        self,
        user_id: str,
        preferences: Dict[str, bool]
    ) -> Dict:
        """Update user's privacy preferences"""
        try:
            # Store preferences in database
            await self.db.update_privacy_settings(user_id, preferences)
            return {
                "status": "updated",
                "user_id": user_id,
                "preferences": preferences,
                "updated_at": datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise Exception(f"Privacy preference update failed: {str(e)}")

    async def _analyze_health_data(self, health_data: Dict) -> Dict:
        """Internal method to analyze health data"""
        try:
            return await self.analyze_privacy_risks(
                user_id=health_data.get('user_id'),
                health_data=health_data.get('data', {})
            )
        except Exception as e:
            raise Exception(f"Health data analysis failed: {str(e)}")

    async def _generate_health_report(self, report_data: Dict) -> Dict:
        """Internal method to generate health report"""
        try:
            return await self.generate_weekly_report(
                new_data=report_data.get('new_data', {}),
                previous_report=report_data.get('previous_report'),
                privacy_level=report_data.get('privacy_level', 'high')
            )
        except Exception as e:
            raise Exception(f"Health report generation failed: {str(e)}")

    async def _create_backup_strategy(self, backup_config: Dict) -> Dict:
        """Internal method to create backup strategy"""
        try:
            return await self.create_backup_strategy(
                data_types=backup_config.get('data_types', []),
                data_volume=backup_config.get('data_volume', 'unknown'),
                sensitivity_level=backup_config.get('sensitivity_level', 'high')
            )
        except Exception as e:
            raise Exception(f"Backup strategy creation failed: {str(e)}")
