import React from 'react';

interface XpRule {
  id: string;
  activity: string;
  description: string;
  xpAmount: number;
  category: 'workout' | 'goal' | 'health' | 'social' | 'special';
  frequency: 'once' | 'daily' | 'weekly' | 'unlimited';
  bonusMultiplier?: number;
}

interface XpRulesProps {
  rules: XpRule[];
}

const XpRules: React.FC<XpRulesProps> = ({ rules }) => {
  // Group rules by category
  const categories = [...new Set(rules.map(rule => rule.category))];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold mb-4">Ways to Earn XP</h3>
      
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <h4 className="text-lg font-semibold mb-3 capitalize">{category} Activities</h4>
            <div className="space-y-3">
              {rules.filter(rule => rule.category === category).map(rule => (
                <div 
                  key={rule.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center">
                    <div className="mr-4 rounded-full p-2 bg-blue-100 text-blue-700">
                      {category === 'workout' && '💪'}
                      {category === 'goal' && '🎯'}
                      {category === 'health' && '❤️'}
                      {category === 'social' && '👥'}
                      {category === 'special' && '⭐'}
                    </div>
                    <div>
                      <h5 className="font-medium">{rule.activity}</h5>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                      
                      {/* Frequency badge */}
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rule.frequency === 'unlimited' ? 'bg-green-100 text-green-800' :
                          rule.frequency === 'daily' ? 'bg-blue-100 text-blue-800' :
                          rule.frequency === 'weekly' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.frequency === 'unlimited' && 'Unlimited'}
                          {rule.frequency === 'daily' && 'Daily'}
                          {rule.frequency === 'weekly' && 'Weekly'}
                          {rule.frequency === 'once' && 'One-time'}
                        </span>
                        
                        {rule.bonusMultiplier && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                            {(rule.bonusMultiplier * 100).toFixed(0)}% bonus
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-indigo-600">
                    +{rule.xpAmount} XP
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default XpRules;
