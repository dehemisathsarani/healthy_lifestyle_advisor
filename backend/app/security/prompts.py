from typing import List
from langchain.prompts import PromptTemplate

class SecurityAgentPrompts:
    HEALTH_DATA_ANALYSIS = PromptTemplate(
        input_variables=["health_data", "privacy_level"],
        template="""
        Analyze the following health data with privacy level {privacy_level}:

        {health_data}

        Generate a comprehensive analysis including:
        1. Privacy risks and concerns
        2. Sensitive data identification
        3. Recommended security measures
        4. Data sharing implications

        Format your response as a structured analysis with clear sections.
        """
    )

    WEEKLY_REPORT = PromptTemplate(
        input_variables=["diet_data", "fitness_data", "mental_health_data"],
        template="""
        Generate a weekly health report based on the following data:

        Diet Data:
        {diet_data}

        Fitness Data:
        {fitness_data}

        Mental Health Data:
        {mental_health_data}

        Provide a comprehensive analysis including:
        1. Diet Summary (average calories, macronutrient breakdown)
        2. Fitness Summary (calories burned, workout patterns)
        3. Mental Health Trends (mood patterns, stress levels)
        4. Privacy-Aware Recommendations

        Ensure all sensitive personal information is properly anonymized.
        """
    )

    GDPR_ANALYSIS = PromptTemplate(
        input_variables=["user_data", "deletion_scope"],
        template="""
        Analyze the following user data deletion request:

        User Data Scope:
        {user_data}

        Deletion Scope:
        {deletion_scope}

        Provide:
        1. Data categories to be deleted
        2. Impact analysis of deletion
        3. Verification steps needed
        4. Compliance requirements
        5. Post-deletion verification process
        """
    )

    PRIVACY_PREFERENCES = PromptTemplate(
        input_variables=["user_preferences", "data_types"],
        template="""
        Analyze privacy preferences for health data sharing:

        User Preferences:
        {user_preferences}

        Data Types:
        {data_types}

        Provide:
        1. Access control recommendations
        2. Data sharing boundaries
        3. Security measures needed
        4. Compliance requirements
        5. Privacy risk assessment
        """
    )

    BACKUP_STRATEGY = PromptTemplate(
        input_variables=["data_volume", "sensitivity_level", "backup_preferences"],
        template="""
        Generate a secure backup strategy for health data:

        Data Volume: {data_volume}
        Sensitivity Level: {sensitivity_level}
        Backup Preferences: {backup_preferences}

        Provide:
        1. Recommended backup frequency
        2. Encryption requirements
        3. Storage location strategy (cloud/local split)
        4. Retention policy
        5. Recovery procedures
        """
    )
