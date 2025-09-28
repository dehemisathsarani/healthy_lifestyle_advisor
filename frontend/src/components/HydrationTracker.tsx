import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Droplets, 
  Plus, 
  Coffee, 
  Wine, 
  Zap,
  Target,
  Clock,
  RefreshCw
} from 'lucide-react';
import { biometricApi, HydrationSummary, HydrationEntry } from '@/services/biometricApi';

interface HydrationTrackerProps {
  onHydrationLogged?: (entry: HydrationEntry) => void;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({
  onHydrationLogged
}) => {
  const [hydrationSummary, setHydrationSummary] = useState<HydrationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Quick action buttons
  const [customAmount, setCustomAmount] = useState('');
  const [beverageType, setBeverageType] = useState('water');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const loadHydrationData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await biometricApi.getDailyHydrationSummary();
      setHydrationSummary(response.hydration_summary);
      
    } catch (error) {
      console.error('Failed to load hydration data:', error);
      setError('Failed to load hydration data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHydrationData();
  }, []);

  const handleQuickHydration = async (amount: number, type: string = 'water') => {
    try {
      setIsLogging(true);
      setError(null);
      
      const response = await biometricApi.logHydration({
        amount_ml: amount,
        beverage_type: type as 'water' | 'tea' | 'coffee' | 'juice' | 'sports_drink' | 'other',
        date: new Date().toISOString()
      });
      
      if (onHydrationLogged) {
        onHydrationLogged(response.hydration);
      }
      
      // Refresh data
      await loadHydrationData();
      
    } catch (error) {
      console.error('Failed to log hydration:', error);
      setError('Failed to log hydration');
    } finally {
      setIsLogging(false);
    }
  };

  const handleCustomHydration = async () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    await handleQuickHydration(amount, beverageType);
    setCustomAmount('');
    setShowCustomForm(false);
  };

  const getHydrationStatus = (percentage: number) => {
    if (percentage >= 100) return { status: 'Excellent', color: 'text-green-600', emoji: '💧✨' };
    if (percentage >= 80) return { status: 'Good', color: 'text-blue-600', emoji: '💧' };
    if (percentage >= 50) return { status: 'Fair', color: 'text-yellow-600', emoji: '🟡' };
    return { status: 'Needs Attention', color: 'text-red-600', emoji: '🚨' };
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBeverageIcon = (type: string) => {
    switch (type) {
      case 'coffee': return <Coffee className="h-4 w-4" />;
      case 'tea': return <Coffee className="h-4 w-4" />;
      case 'juice': return <Wine className="h-4 w-4" />;
      case 'sports_drink': return <Zap className="h-4 w-4" />;
      default: return <Droplets className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading hydration data...</span>
      </div>
    );
  }

  const hydrationStatus = hydrationSummary ? getHydrationStatus(hydrationSummary.percentage) : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="h-8 w-8 text-blue-600" />
            Hydration Tracker
          </h1>
          <p className="text-gray-600">Stay hydrated for optimal health</p>
        </div>
        <Button onClick={loadHydrationData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Hydration Status */}
      {hydrationSummary && (
        <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Today's Hydration</h2>
                <p className="opacity-90">
                  {hydrationStatus?.emoji} {hydrationStatus?.status}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {(hydrationSummary.total_intake / 1000).toFixed(1)}L
                </div>
                <div className="text-sm opacity-90">
                  of {(hydrationSummary.goal / 1000).toFixed(1)}L goal
                </div>
              </div>
            </div>
            <div className="mb-2">
              <Progress 
                value={hydrationSummary.percentage} 
                className="bg-white/20 h-3"
              />
            </div>
            <div className="flex justify-between text-sm opacity-90">
              <span>{hydrationSummary.percentage.toFixed(0)}% complete</span>
              <span>{hydrationSummary.entries.length} drinks logged</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Button 
              onClick={() => handleQuickHydration(250)}
              disabled={isLogging}
              className="h-16 flex-col"
            >
              <Droplets className="h-6 w-6 mb-1" />
              250ml Water
            </Button>
            <Button 
              onClick={() => handleQuickHydration(500)}
              disabled={isLogging}
              className="h-16 flex-col"
            >
              <Droplets className="h-6 w-6 mb-1" />
              500ml Water
            </Button>
            <Button 
              onClick={() => handleQuickHydration(300, 'coffee')}
              disabled={isLogging}
              variant="outline"
              className="h-16 flex-col"
            >
              <Coffee className="h-6 w-6 mb-1" />
              300ml Coffee
            </Button>
            <Button 
              onClick={() => setShowCustomForm(!showCustomForm)}
              variant="outline"
              className="h-16 flex-col"
            >
              <Plus className="h-6 w-6 mb-1" />
              Custom
            </Button>
          </div>

          {/* Custom Amount Form */}
          {showCustomForm && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customAmount">Amount (ml)</Label>
                    <Input
                      id="customAmount"
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="250"
                      min="1"
                      max="2000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="beverageType">Beverage Type</Label>
                    <Select value={beverageType} onValueChange={setBeverageType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="water">Water</SelectItem>
                        <SelectItem value="tea">Tea</SelectItem>
                        <SelectItem value="coffee">Coffee</SelectItem>
                        <SelectItem value="juice">Juice</SelectItem>
                        <SelectItem value="sports_drink">Sports Drink</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleCustomHydration}
                      disabled={isLogging}
                      className="w-full"
                    >
                      {isLogging ? 'Logging...' : 'Log Drink'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Today's Log */}
      {hydrationSummary && hydrationSummary.entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hydrationSummary.entries.slice().reverse().map((entry, index) => (
                <div key={entry.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getBeverageIcon(entry.beverage_type)}
                    <div>
                      <div className="font-medium">
                        {entry.amount_ml}ml {entry.beverage_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(entry.time)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    +{entry.amount_ml}ml
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hydration Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Hydration Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✅ Good Habits</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Drink water upon waking</li>
                <li>• Keep a water bottle nearby</li>
                <li>• Set hydration reminders</li>
                <li>• Drink before you feel thirsty</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-600">💡 Tips</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Increase intake during exercise</li>
                <li>• Monitor urine color</li>
                <li>• Include water-rich foods</li>
                <li>• Adjust for climate and activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default HydrationTracker;
