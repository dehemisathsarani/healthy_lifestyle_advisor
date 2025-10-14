"""
Frontend Component State Checker
Verifies EnhancedFoodAnalysisFixed.tsx has all required code
"""

import os
import re

FRONTEND_FILE = r"frontend\src\components\EnhancedFoodAnalysisFixed.tsx"

def check_code_exists(file_path):
    """Check if all required code exists in the file"""
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    checks = {
        "State Declaration": [
            "const [showWorkoutSuggestion, setShowWorkoutSuggestion] = useState",
            "const [lastAnalysisResult, setLastAnalysisResult] = useState"
        ],
        "Function Definition": [
            "const sendToFitnessAgent = async (analysisResult: any) => {",
            "setShowWorkoutSuggestion(true)"
        ],
        "Function Call": [
            "await sendToFitnessAgent(transformedResult)",
            "setLastAnalysisResult(transformedResult)"
        ],
        "JSX Rendering": [
            "{showWorkoutSuggestion && lastAnalysisResult && (",
            "Checkout Workout Sessions"
        ],
        "Debug Logging": [
            "console.log('🔄 sendToFitnessAgent called",
            "console.log('🎯 Setting showWorkoutSuggestion to TRUE')",
            "console.log('🔍 Render check"
        ]
    }
    
    print("\n" + "="*60)
    print("🔍 FRONTEND COMPONENT VERIFICATION")
    print("="*60)
    print(f"File: {file_path}\n")
    
    all_passed = True
    
    for category, patterns in checks.items():
        print(f"\n📋 {category}:")
        for pattern in patterns:
            if pattern in content:
                print(f"  ✅ Found: {pattern[:50]}...")
            else:
                print(f"  ❌ MISSING: {pattern[:50]}...")
                all_passed = False
    
    print("\n" + "="*60)
    
    if all_passed:
        print("✅ ALL CHECKS PASSED!")
        print("The code is correctly implemented in the file.")
    else:
        print("❌ SOME CHECKS FAILED!")
        print("The file might be missing required code.")
    
    print("="*60)
    
    # Count occurrences
    print("\n📊 CODE STATISTICS:")
    print(f"  • showWorkoutSuggestion mentions: {content.count('showWorkoutSuggestion')}")
    print(f"  • lastAnalysisResult mentions: {content.count('lastAnalysisResult')}")
    print(f"  • sendToFitnessAgent mentions: {content.count('sendToFitnessAgent')}")
    print(f"  • Console logs: {content.count('console.log')}")
    print(f"  • File size: {len(content):,} characters")
    print(f"  • File lines: {content.count(chr(10)) + 1}")
    
    return all_passed

def find_component_in_project():
    """Find all instances of EnhancedFoodAnalysisFixed component"""
    print("\n" + "="*60)
    print("🔍 SEARCHING FOR COMPONENT FILES")
    print("="*60)
    
    found_files = []
    
    for root, dirs, files in os.walk("frontend"):
        for file in files:
            if file == "EnhancedFoodAnalysisFixed.tsx":
                full_path = os.path.join(root, file)
                found_files.append(full_path)
                print(f"  📄 Found: {full_path}")
    
    if not found_files:
        print("  ❌ No files found!")
    
    return found_files

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 FRONTEND VERIFICATION SCRIPT")
    print("="*60)
    
    # Find all component files
    component_files = find_component_in_project()
    
    if component_files:
        print(f"\nℹ️  Found {len(component_files)} component file(s)")
        
        # Check each file
        for file_path in component_files:
            check_code_exists(file_path)
    else:
        print("\n❌ Could not find EnhancedFoodAnalysisFixed.tsx")
        print("   Make sure you're running this from the project root directory")
    
    print("\n" + "="*60)
    print("💡 NEXT STEPS:")
    print("="*60)
    print("1. If all checks passed: Frontend code is ready")
    print("2. Open: http://localhost:3000")
    print("3. Go to: Diet Agent → Food Analysis tab")
    print("4. Test: Analyze a meal and check console (F12)")
    print("5. If still not working: Check browser console for errors")
    print("="*60 + "\n")
