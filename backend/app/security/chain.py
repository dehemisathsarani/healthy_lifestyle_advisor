from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
import json
import os

from .prompts import SecurityAgentPrompts

class HealthDataAnalysis(BaseModel):
    """Schema for health data analysis output"""
    privacy_risks: List[str] = Field(description="Identified privacy risks")
    sensitive_data: List[str] = Field(description="Identified sensitive data points")
    security_measures: List[str] = Field(description="Recommended security measures")
    sharing_recommendations: Dict[str, List[str]] = Field(description="Data sharing recommendations")

class WeeklyHealthReport(BaseModel):
    """Schema for weekly health report"""
    diet_summary: Dict[str, Any] = Field(description="Diet analysis including calories and macros")
    fitness_summary: Dict[str, Any] = Field(description="Fitness analysis including activities and calories")
    mental_health_summary: Dict[str, Any] = Field(description="Mental health analysis including mood trends")
    recommendations: List[str] = Field(description="Privacy-aware health recommendations")

class SecurityChain:
    def __init__(self, openai_api_key: Optional[str] = None):
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.3,
            openai_api_key=openai_api_key or os.getenv("OPENAI_API_KEY")
        )
        self.prompts = SecurityAgentPrompts()
        self._setup_output_parsers()
        self._setup_chains()

    def _setup_output_parsers(self):
        """Initialize Pydantic output parsers"""
        self.health_data_parser = PydanticOutputParser(pydantic_object=HealthDataAnalysis)
        self.weekly_report_parser = PydanticOutputParser(pydantic_object=WeeklyHealthReport)

    def _setup_chains(self):
        """Initialize LangChain chains"""
        self.health_analysis_chain = LLMChain(
            llm=self.llm,
            prompt=self.prompts.HEALTH_DATA_ANALYSIS,
            output_parser=self.health_data_parser
        )

        self.weekly_report_chain = LLMChain(
            llm=self.llm,
            prompt=self.prompts.WEEKLY_REPORT,
            output_parser=self.weekly_report_parser
        )

        self.gdpr_chain = LLMChain(
            llm=self.llm,
            prompt=self.prompts.GDPR_ANALYSIS
        )

        self.privacy_chain = LLMChain(
            llm=self.llm,
            prompt=self.prompts.PRIVACY_PREFERENCES
        )

        self.backup_chain = LLMChain(
            llm=self.llm,
            prompt=self.prompts.BACKUP_STRATEGY
        )

    async def analyze_health_data(self, health_data: Dict[str, Any], privacy_level: str) -> HealthDataAnalysis:
        """Analyze health data for privacy concerns and security measures"""
        response = await self.health_analysis_chain.arun(
            health_data=json.dumps(health_data, indent=2),
            privacy_level=privacy_level
        )
        return self.health_data_parser.parse(response)

    async def generate_weekly_report(
        self,
        diet_data: Dict[str, Any],
        fitness_data: Dict[str, Any],
        mental_health_data: Dict[str, Any]
    ) -> WeeklyHealthReport:
        """Generate a comprehensive weekly health report"""
        response = await self.weekly_report_chain.arun(
            diet_data=json.dumps(diet_data, indent=2),
            fitness_data=json.dumps(fitness_data, indent=2),
            mental_health_data=json.dumps(mental_health_data, indent=2)
        )
        return self.weekly_report_parser.parse(response)

    async def analyze_gdpr_request(
        self,
        user_data: Dict[str, Any],
        deletion_scope: str
    ) -> Dict[str, Any]:
        """Analyze GDPR data deletion request"""
        return await self.gdpr_chain.arun(
            user_data=json.dumps(user_data, indent=2),
            deletion_scope=deletion_scope
        )

    async def analyze_privacy_preferences(
        self,
        user_preferences: Dict[str, Any],
        data_types: List[str]
    ) -> Dict[str, Any]:
        """Analyze and provide recommendations for privacy preferences"""
        return await self.privacy_chain.arun(
            user_preferences=json.dumps(user_preferences, indent=2),
            data_types=json.dumps(data_types, indent=2)
        )

    async def generate_backup_strategy(
        self,
        data_volume: str,
        sensitivity_level: str,
        backup_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a secure backup strategy"""
        return await self.backup_chain.arun(
            data_volume=data_volume,
            sensitivity_level=sensitivity_level,
            backup_preferences=json.dumps(backup_preferences, indent=2)
        )
