import React, { useState, useEffect, useCallback } from 'react'
import { 
  FaBrain, 
  FaLightbulb, 
  FaChartLine, 
  FaExchangeAlt, 
  FaTrophy,
  FaCalendarWeek,
  FaQuoteLeft,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaFlag
} from 'react-icons/fa'

interface NutritionInsight {
  category: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  action: string
  confidence: number
}

interface DailyCard {
  date: string
  calories: {
    actual: number
    target: number
    percentage: number
  }
  macros: {
    protein: { grams: number; percentage: number }
    carbs: { grams: number; percentage: number }
    fat: { grams: number; percentage: number }
  }
  summary: string
  smart_swap: string
  insights_count: number
  top_priority: string
}

interface WeeklyReport {
  week_period: string
  trend_data: {
    dates: string[]
    calories: number[]
    calorie_targets: number[]
    protein: number[]
    fiber: number[]
    water: number[]
  }
  weekly_stats: {
    avg_calories: number
    avg_protein: number
    avg_fiber: number
    days_logged: number
    total_meals: number
    calorie_accuracy: number
  }
  narrative: string
  insight_summary: Record<string, { total: number; high_priority: number }>
  achievement_badges: string[]
  next_week_focus: string
}

interface NLPNutritionInsightsProps {
  nutritionData: {
    date: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sodium: number
    sugar: number
    water_intake: number
    meals_count: number
    calorie_target: number
    activity_level: string
  }
  userId: string
}

export const NLPNutritionInsights: React.FC<NLPNutritionInsightsProps> = ({ 
  nutritionData, 
  userId 
}) => {
  const [insights, setInsights] = useState<NutritionInsight[]>([])
  const [dailyCard, setDailyCard] = useState<DailyCard | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [abstractiveSummary, setAbstractiveSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'insights' | 'daily' | 'weekly' | 'summary'>('insights')

  const loadNLPData = useCallback(async () => {
    setLoading(true)
    try {
      // Load insights
      const insightsResponse = await fetch('/api/nutrition/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutritionData)
      })
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData.analysis.insights)
      }

      // Load daily card
      const cardResponse = await fetch('/api/nutrition/daily-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutritionData)
      })
      if (cardResponse.ok) {
        const cardData = await cardResponse.json()
        setDailyCard(cardData.daily_card)
      }

      // Load weekly report
      const weeklyResponse = await fetch(`/api/nutrition/weekly-report?user_id=${userId}`)
      if (weeklyResponse.ok) {
        const weeklyData = await weeklyResponse.json()
        setWeeklyReport(weeklyData.weekly_report)
      }

      // Load abstractive summary
      const summaryResponse = await fetch(`/api/nutrition/abstractive-summary/${userId}?date=${nutritionData.date}`)
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setAbstractiveSummary(summaryData.summary)
      }

    } catch (error) {
      console.error('Error loading NLP data:', error)
    } finally {
      setLoading(false)
    }
  }, [nutritionData, userId])

  useEffect(() => {
    if (nutritionData) {
      loadNLPData()
    }
  }, [nutritionData, userId, loadNLPData])

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <FaTimesCircle className="text-red-600" />
      case 'high': return <FaExclamationTriangle className="text-orange-500" />
      case 'medium': return <FaInfoCircle className="text-yellow-500" />
      case 'low': return <FaCheckCircle className="text-green-500" />
      default: return <FaInfoCircle className="text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-200 bg-red-50'
      case 'high': return 'border-orange-200 bg-orange-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaBrain className="text-2xl text-purple-500 animate-pulse" />
          <h2 className="text-2xl font-bold">AI Nutrition Insights</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      {/* Header with tabs */}
      <div className="border-b p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaBrain className="text-2xl text-purple-500" />
          <h2 className="text-2xl font-bold">AI Nutrition Insights</h2>
        </div>
        
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'insights', label: 'Smart Insights', icon: FaLightbulb },
            { id: 'daily', label: 'Daily Card', icon: FaChartLine },
            { id: 'weekly', label: 'Weekly Report', icon: FaCalendarWeek },
            { id: 'summary', label: 'AI Summary', icon: FaQuoteLeft }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'insights' | 'daily' | 'weekly' | 'summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="text-sm" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Smart Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rule-Based Analysis</h3>
              <span className="text-sm text-gray-500">{insights.length} insights generated</span>
            </div>
            
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
                <p>No nutrition concerns detected today!</p>
                <p className="text-sm">Your nutrition is well-balanced.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}>
                    <div className="flex items-start gap-3">
                      {getPriorityIcon(insight.priority)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-600">{insight.category}</span>
                          <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-500">
                            {Math.round(insight.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-gray-800 mb-2">{insight.message}</p>
                        {insight.action && (
                          <div className="flex items-start gap-2 text-sm">
                            <FaLightbulb className="text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{insight.action}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily Card Tab */}
        {activeTab === 'daily' && dailyCard && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Daily Nutrition Card</h3>
              <p className="text-gray-600">{dailyCard.date}</p>
            </div>

            {/* Calorie Progress */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Calorie Target</h4>
                <span className="text-sm text-gray-600">
                  {dailyCard.calories.actual.toFixed(0)} / {dailyCard.calories.target.toFixed(0)} kcal
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(dailyCard.calories.percentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {dailyCard.calories.percentage.toFixed(1)}% of target
              </p>
            </div>

            {/* Macro Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(dailyCard.macros).map(([macro, data]) => (
                <div key={macro} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{data.grams.toFixed(0)}g</div>
                  <div className="text-sm text-gray-600 capitalize">{macro}</div>
                  <div className="text-xs text-gray-500 mt-1">{data.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>

            {/* Smart Swap */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaExchangeAlt className="text-yellow-600" />
                <span className="font-medium text-yellow-800">Smart Swap Suggestion</span>
              </div>
              <p className="text-yellow-800">{dailyCard.smart_swap}</p>
            </div>

            {/* Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">AI Summary</h4>
              <div className="text-purple-800 whitespace-pre-line">{dailyCard.summary}</div>
            </div>
          </div>
        )}

        {/* Weekly Report Tab */}
        {activeTab === 'weekly' && weeklyReport && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Weekly Progress Report</h3>
              <p className="text-gray-600">{weeklyReport.week_period}</p>
            </div>

            {/* Achievement Badges */}
            {weeklyReport.achievement_badges.length > 0 && (
              <div className="bg-gradient-to-r from-gold-50 to-yellow-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaTrophy className="text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">This Week's Achievements</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {weeklyReport.achievement_badges.map((badge, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-sm text-yellow-800 font-medium">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  {weeklyReport.weekly_stats.avg_calories.toFixed(0)}
                </div>
                <div className="text-sm text-blue-600">Avg Calories</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  {weeklyReport.weekly_stats.avg_protein.toFixed(0)}g
                </div>
                <div className="text-sm text-green-600">Avg Protein</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-800">
                  {weeklyReport.weekly_stats.days_logged}
                </div>
                <div className="text-sm text-purple-600">Days Logged</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-800">
                  {(weeklyReport.weekly_stats.calorie_accuracy * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-orange-600">Target Accuracy</div>
              </div>
            </div>

            {/* Narrative */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Weekly Analysis</h4>
              <p className="text-gray-700">{weeklyReport.narrative}</p>
            </div>

            {/* Next Week Focus */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaFlag className="text-emerald-600" />
                <span className="font-medium text-emerald-800">Focus for Next Week</span>
              </div>
              <p className="text-emerald-800">{weeklyReport.next_week_focus}</p>
            </div>
          </div>
        )}

        {/* AI Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Abstractive AI Summary</h3>
              <p className="text-sm text-gray-600">70-word structured summary with actionable insights</p>
            </div>
            
            {abstractiveSummary ? (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <FaQuoteLeft className="text-purple-500 text-xl mt-1 flex-shrink-0" />
                  <div className="text-gray-800 whitespace-pre-line leading-relaxed">
                    {abstractiveSummary}
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                    Generated by AI • {abstractiveSummary.split(' ').length} words
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaQuoteLeft className="text-4xl text-gray-300 mx-auto mb-2" />
                <p>No summary available for this date.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NLPNutritionInsights
