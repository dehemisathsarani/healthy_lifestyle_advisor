from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import json
import os

class SecurityRecommendation(BaseModel):
    risk_level: str = Field(description="Risk level: LOW, MEDIUM, or HIGH")
    findings: List[str] = Field(description="List of security findings")
    recommendations: List[str] = Field(description="List of recommended actions")
    priority: str = Field(description="Priority level for implementing recommendations")

class DataAnalysisInsight(BaseModel):
    pattern_type: str = Field(description="Type of pattern identified")
    description: str = Field(description="Description of the insight")
    impact: str = Field(description="Potential impact on user's health/privacy")
    suggested_actions: List[str] = Field(description="Suggested actions based on the insight")

class SecurityAIAgent:
    def __init__(self, openai_api_key: Optional[str] = None):
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.llm = ChatOpenAI(
            model_name="gpt-4",
            temperature=0.3,
            openai_api_key=self.openai_api_key
        )
        self._setup_chains()

    def _setup_chains(self):
        """Setup different LangChain chains for various security tasks"""
        # Security Analysis Chain
        security_template = """
        Analyze the following user security profile and data usage patterns to identify potential security risks and provide recommendations:

        Security Profile:
        {security_profile}

        Data Usage Patterns:
        {usage_patterns}

        Provide a detailed security analysis with specific recommendations.

        {format_instructions}
        """
        security_parser = PydanticOutputParser(pydantic_object=SecurityRecommendation)
        self.security_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=security_template,
                input_variables=["security_profile", "usage_patterns"],
                partial_variables={"format_instructions": security_parser.get_format_instructions()}
            ),
            output_parser=security_parser
        )

        # Data Analysis Chain
        analysis_template = """
        Analyze the following health data patterns to identify meaningful insights and potential privacy implications:

        Health Data Summary:
        {health_data}

        Current Privacy Settings:
        {privacy_settings}

        Identify patterns, correlations, and potential privacy concerns.

        {format_instructions}
        """
        analysis_parser = PydanticOutputParser(pydantic_object=DataAnalysisInsight)
        self.analysis_chain = LLMChain(
            llm=self.llm,
            prompt=PromptTemplate(
                template=analysis_template,
                input_variables=["health_data", "privacy_settings"],
                partial_variables={"format_instructions": analysis_parser.get_format_instructions()}
            ),
            output_parser=analysis_parser
        )

    async def analyze_security_profile(self, security_profile: Dict, usage_patterns: Dict) -> SecurityRecommendation:
        """Analyze security profile and provide recommendations"""
        try:
            result = await self.security_chain.arun(
                security_profile=json.dumps(security_profile, indent=2),
                usage_patterns=json.dumps(usage_patterns, indent=2)
            )
            return result
        except Exception as e:
            raise Exception(f"Security analysis failed: {str(e)}")

    async def analyze_health_data(self, health_data: Dict, privacy_settings: Dict) -> DataAnalysisInsight:
        """Analyze health data for patterns and privacy implications"""
        try:
            result = await self.analysis_chain.arun(
                health_data=json.dumps(health_data, indent=2),
                privacy_settings=json.dumps(privacy_settings, indent=2)
            )
            return result
        except Exception as e:
            raise Exception(f"Data analysis failed: {str(e)}")

    async def generate_privacy_report(
        self, 
        user_data: Dict,
        security_profile: Dict,
        health_data: Dict
    ) -> Dict:
        """Generate a comprehensive privacy and security report"""
        # Analyze security profile
        security_rec = await self.analyze_security_profile(
            security_profile,
            {"login_times": user_data.get("login_history", []),
             "data_access_patterns": user_data.get("access_patterns", [])}
        )

        # Analyze health data
        data_insight = await self.analyze_health_data(
            health_data,
            security_profile.get("privacy_settings", {})
        )

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "security_analysis": {
                "risk_level": security_rec.risk_level,
                "findings": security_rec.findings,
                "recommendations": security_rec.recommendations,
                "priority": security_rec.priority
            },
            "data_analysis": {
                "pattern_type": data_insight.pattern_type,
                "description": data_insight.description,
                "impact": data_insight.impact,
                "suggested_actions": data_insight.suggested_actions
            },
            "privacy_score": self._calculate_privacy_score(security_rec, data_insight)
        }

    def _calculate_privacy_score(
        self,
        security_rec: SecurityRecommendation,
        data_insight: DataAnalysisInsight
    ) -> int:
        """Calculate a privacy score based on security and data analysis"""
        base_score = 100
        risk_deductions = {
            "HIGH": -30,
            "MEDIUM": -15,
            "LOW": -5
        }

        # Deduct based on risk level
        score = base_score + risk_deductions.get(security_rec.risk_level, 0)

        # Adjust based on number of findings
        score -= len(security_rec.findings) * 2

        # Ensure score stays within bounds
        return max(0, min(100, score))
