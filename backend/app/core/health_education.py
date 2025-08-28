"""
Utility functions for accessing medication and health information from trusted sources
"""

import httpx
import logging
import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

async def get_medication_info(medication_name: str) -> Dict[str, Any]:
    """
    Get comprehensive medication information from trusted sources
    
    Uses RxNorm API, openFDA, and MedlinePlus to provide evidence-based information
    """
    result = {
        "medication": medication_name,
        "rxnorm": None,
        "fda_label": None,
        "medlineplus": None,
        "error": None
    }
    
    try:
        # Step 1: Get RxNorm information (normalize drug names, map brand↔generic)
        rxnorm_data = await get_rxnorm_data(medication_name)
        result["rxnorm"] = rxnorm_data
        
        # Step 2: Get FDA label information (official FDA labels)
        if rxnorm_data and "ingredients" in rxnorm_data:
            # Use the normalized active ingredient name if available
            active_ingredient = rxnorm_data["ingredients"][0] if rxnorm_data["ingredients"] else medication_name
            fda_data = await get_fda_label(active_ingredient)
            result["fda_label"] = fda_data
        else:
            # Fall back to using the original medication name
            fda_data = await get_fda_label(medication_name)
            result["fda_label"] = fda_data
            
        # Step 3: Get MedlinePlus information (plain-language health topic summaries)
        medlineplus_data = await get_medlineplus_info(medication_name)
        result["medlineplus"] = medlineplus_data
        
        return result
        
    except Exception as e:
        logger.error(f"Error retrieving medication information: {str(e)}")
        result["error"] = f"Failed to retrieve complete medication information: {str(e)}"
        return result
        result["error"] = f"Failed to retrieve complete medication information: {str(e)}"
        return result

async def get_rxnorm_data(medication_name: str) -> Dict[str, Any]:
    """
    Get normalized medication information from RxNorm API
    """
    try:
        url = f"https://rxnav.nlm.nih.gov/REST/drugs.json?name={medication_name}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.warning(f"RxNorm API returned status code {response.status_code}")
                return {
                    "status": "error",
                    "message": f"RxNorm API returned status code {response.status_code}"
                }
                
            data = response.json()
            
            # Process the RxNorm response to extract key information
            result = {
                "status": "success",
                "rxcuis": [],
                "names": [],
                "ingredients": [],
                "brand_names": [],
                "generic_names": []
            }
            
            if "drugGroup" in data and "conceptGroup" in data["drugGroup"]:
                for group in data["drugGroup"]["conceptGroup"]:
                    if "conceptProperties" in group:
                        for prop in group["conceptProperties"]:
                            if "rxcui" in prop and prop["rxcui"] not in result["rxcuis"]:
                                result["rxcuis"].append(prop["rxcui"])
                            
                            if "name" in prop and prop["name"] not in result["names"]:
                                result["names"].append(prop["name"])
                                
                                # Categorize as brand or generic based on the tty field
                                if "tty" in prop:
                                    if prop["tty"] == "SBD" or prop["tty"] == "SCD":
                                        # Brand name drug
                                        if prop["name"] not in result["brand_names"]:
                                            result["brand_names"].append(prop["name"])
                                    elif prop["tty"] == "IN":
                                        # Ingredient (generic)
                                        if prop["name"] not in result["ingredients"]:
                                            result["ingredients"].append(prop["name"])
                                            if prop["name"] not in result["generic_names"]:
                                                result["generic_names"].append(prop["name"])
            
            return result
            
    except Exception as e:
        logger.error(f"Error retrieving RxNorm data: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to retrieve RxNorm data: {str(e)}"
        }

async def get_fda_label(medication_name: str) -> Dict[str, Any]:
    """
    Get FDA label information from openFDA API
    """
    try:
        # URL encode the medication name
        url = f"https://api.fda.gov/drug/label.json?search=active_ingredient:(\"{medication_name}\")&limit=1"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.warning(f"FDA API returned status code {response.status_code}")
                return {
                    "status": "error",
                    "message": f"FDA API returned status code {response.status_code}"
                }
                
            data = response.json()
            
            # Extract relevant sections from the FDA label
            result = {
                "status": "success",
                "sections": {}
            }
            
            if "results" in data and len(data["results"]) > 0:
                label = data["results"][0]
                
                # Extract key sections
                important_sections = [
                    "indications_and_usage",
                    "dosage_and_administration",
                    "adverse_reactions",
                    "warnings",
                    "warnings_and_precautions",
                    "contraindications",
                    "drug_interactions",
                    "patient_counseling_information",
                    "information_for_patients",
                    "description",
                    "clinical_pharmacology"
                ]
                
                for section in important_sections:
                    if section in label:
                        result["sections"][section] = label[section]
                
                # Add product info
                if "openfda" in label:
                    openfda = label["openfda"]
                    result["product_info"] = {
                        "brand_name": openfda.get("brand_name", []),
                        "generic_name": openfda.get("generic_name", []),
                        "manufacturer_name": openfda.get("manufacturer_name", []),
                        "route": openfda.get("route", []),
                        "product_type": openfda.get("product_type", [])
                    }
            
            return result
            
    except Exception as e:
        logger.error(f"Error retrieving FDA label: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to retrieve FDA label: {str(e)}"
        }

async def get_medlineplus_info(term: str) -> Dict[str, Any]:
    """
    Get health information from MedlinePlus Web Service
    """
    try:
        # Default result with minimal information if API fails
        default_result = {
            "status": "success",
            "topics": [],
            "summary": f"Basic information for {term}",
            "source": "MedlinePlus (fallback)"
        }
        
        # If term is empty, return default
        if not term:
            logger.warning("Empty term provided to MedlinePlus API")
            return default_result
            
        url = f"https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term={term}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                logger.warning(f"MedlinePlus API returned status code {response.status_code}")
                return default_result
                
            # Parse XML response
            try:
                root = ET.fromstring(response.text)
                
                result = {
                    "status": "success",
                    "topics": []
                }
                
                # Extract document elements
                for doc in root.findall(".//document"):
                    topic = {}
                    
                    # Extract title
                    title = doc.find("content[@name='title']")
                    if title is not None:
                        topic["title"] = title.text
            except ET.ParseError:
                logger.warning("Failed to parse XML from MedlinePlus API")
                return default_result
                
                # Extract URL
                url = doc.find("content[@name='url']")
                if url is not None:
                    topic["url"] = url.text
                
                # Extract summary
                summary = doc.find("content[@name='FullSummary']")
                if summary is not None:
                    topic["summary"] = summary.text
                
                if topic:
                    result["topics"].append(topic)
            
            return result
            
    except Exception as e:
        logger.error(f"Error retrieving MedlinePlus information: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to retrieve MedlinePlus information: {str(e)}"
        }

async def get_health_topic_info(topic: str) -> Dict[str, Any]:
    """
    Get general health topic information from MedlinePlus
    """
    return await get_medlineplus_info(topic)
