import React from 'react';
import type { NutritionInfo, DetectedFood, DietAdvice } from '../api';

interface AnalysisResultsProps {
  detectedFoods: DetectedFood[];
  totalNutrition: NutritionInfo;
  advice: DietAdvice;
  onSaveMeal: () => void;
  onNewAnalysis: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  detectedFoods,
  totalNutrition,
  advice,
  onSaveMeal,
  onNewAnalysis
}) => {
  return (
    <div className="space-y-6">
      {/* Detected Foods */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🍽️ Detected Foods</h3>
        <div className="grid gap-4">
          {detectedFoods.map((food, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{food.name}</h4>
                <p className="text-sm text-gray-600">Portion: {food.estimated_portion}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs text-gray-500">
                    Confidence: {(food.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              {food.nutrition && (
                <div className="text-right text-sm text-gray-600">
                  <p>{food.nutrition.calories.toFixed(0)} cal</p>
                  <p className="text-xs">
                    P: {food.nutrition.protein.toFixed(1)}g | 
                    C: {food.nutrition.carbs.toFixed(1)}g | 
                    F: {food.nutrition.fat.toFixed(1)}g
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Nutrition Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {totalNutrition.calories.toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {totalNutrition.protein.toFixed(1)}g
            </div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {totalNutrition.carbs.toFixed(1)}g
            </div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {totalNutrition.fat.toFixed(1)}g
            </div>
            <div className="text-sm text-gray-600">Fat</div>
          </div>
        </div>

        {/* Additional Nutrients */}
        {(totalNutrition.fiber || totalNutrition.sugar || totalNutrition.sodium) && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-700 mb-3">Additional Nutrients</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {totalNutrition.fiber && (
                <div className="text-center">
                  <div className="font-medium text-gray-800">{totalNutrition.fiber.toFixed(1)}g</div>
                  <div className="text-gray-600">Fiber</div>
                </div>
              )}
              {totalNutrition.sugar && (
                <div className="text-center">
                  <div className="font-medium text-gray-800">{totalNutrition.sugar.toFixed(1)}g</div>
                  <div className="text-gray-600">Sugar</div>
                </div>
              )}
              {totalNutrition.sodium && (
                <div className="text-center">
                  <div className="font-medium text-gray-800">{totalNutrition.sodium.toFixed(0)}mg</div>
                  <div className="text-gray-600">Sodium</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 AI Recommendations</h3>
        
        {/* Main Recommendation */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Analysis Summary</h4>
          <p className="text-blue-700">{advice.recommendation}</p>
          {advice.reasoning && (
            <p className="text-sm text-blue-600 mt-2 italic">{advice.reasoning}</p>
          )}
        </div>

        {/* Warnings */}
        {advice.warnings.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Health Warnings</h4>
            <ul className="space-y-1">
              {advice.warnings.map((warning, index) => (
                <li key={index} className="text-red-700 text-sm flex items-start">
                  <span className="mr-2">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Healthier Alternatives */}
        {advice.healthier_alternatives.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">🥗 Healthier Alternatives</h4>
            <ul className="space-y-1">
              {advice.healthier_alternatives.map((alternative, index) => (
                <li key={index} className="text-green-700 text-sm flex items-start">
                  <span className="mr-2">•</span>
                  <span>{alternative}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Macro Suggestions */}
        {Object.keys(advice.macro_suggestions).length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">📈 Macro Suggestions</h4>
            <div className="space-y-2">
              {Object.entries(advice.macro_suggestions).map(([macro, suggestion], index) => (
                <div key={index} className="text-yellow-700 text-sm">
                  <span className="font-medium capitalize">{macro}:</span> {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hydration Reminder */}
        {advice.hydration_reminder && (
          <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <h4 className="font-semibold text-cyan-800 mb-2">💧 Hydration Reminder</h4>
            <p className="text-cyan-700 text-sm">{advice.hydration_reminder}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onSaveMeal}
          className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          ✅ Save to Meal Log
        </button>
        <button
          onClick={onNewAnalysis}
          className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
        >
          🔄 Analyze Another Meal
        </button>
      </div>
    </div>
  );
};

export default AnalysisResults;
