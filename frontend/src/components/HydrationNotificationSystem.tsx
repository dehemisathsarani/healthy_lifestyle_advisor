import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Droplets,
  Settings,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';

interface NotificationSettings {
  enabled: boolean;
  interval: number; // minutes
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  soundEnabled: boolean;
  reminderText: string;
  weekendsEnabled: boolean;
}

interface HydrationNotificationSystemProps {
  onNotificationTriggered?: (message: string) => void;
}

export const HydrationNotificationSystem: React.FC<HydrationNotificationSystemProps> = ({ 
  onNotificationTriggered 
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    interval: 60, // Every hour
    startTime: '08:00',
    endTime: '22:00',
    soundEnabled: true,
    reminderText: '💧 Time to hydrate! Remember to drink water for your health.',
    weekendsEnabled: true
  });
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('hydrationNotificationSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('hydrationNotificationSettings', JSON.stringify(settings));
    
    // Update reminder schedule
    if (settings.enabled) {
      scheduleNextReminder();
    }
  }, [settings]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    }
    return false;
  };

  const scheduleNextReminder = () => {
    if (!settings.enabled) {
      setNextReminderTime(null);
      return;
    }

    const now = new Date();
    const [startHour, startMinute] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute] = settings.endTime.split(':').map(Number);
    
    let nextReminder = new Date(now);
    nextReminder.setMinutes(now.getMinutes() + settings.interval);
    
    // If next reminder is outside active hours, schedule for next active period
    const reminderHour = nextReminder.getHours();
    const reminderMinute = nextReminder.getMinutes();
    
    if (reminderHour < startHour || 
        (reminderHour === startHour && reminderMinute < startMinute) ||
        reminderHour > endHour ||
        (reminderHour === endHour && reminderMinute > endMinute)) {
      
      // Schedule for next day start time
      nextReminder.setDate(nextReminder.getDate() + 1);
      nextReminder.setHours(startHour, startMinute, 0, 0);
    }

    // Skip weekends if disabled
    if (!settings.weekendsEnabled) {
      const dayOfWeek = nextReminder.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        // Find next Monday
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 2;
        nextReminder.setDate(nextReminder.getDate() + daysUntilMonday);
        nextReminder.setHours(startHour, startMinute, 0, 0);
      }
    }

    setNextReminderTime(nextReminder);
    
    // Schedule the notification
    const timeUntilReminder = nextReminder.getTime() - now.getTime();
    if (timeUntilReminder > 0) {
      setTimeout(() => {
        triggerHydrationReminder();
        scheduleNextReminder(); // Schedule the next one
      }, timeUntilReminder);
    }
  };

  const triggerHydrationReminder = () => {
    if (!settings.enabled) return;

    // Browser notification
    if (permissionStatus === 'granted') {
      const notification = new Notification('Hydration Reminder', {
        body: settings.reminderText,
        icon: '/water-drop-icon.png',
        tag: 'hydration-reminder',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }

    // Sound notification
    if (settings.soundEnabled) {
      // Create a gentle water drop sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Callback for parent component
    onNotificationTriggered?.(settings.reminderText);
  };

  const testNotification = async () => {
    setIsTestingNotification(true);
    
    if (permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setIsTestingNotification(false);
        return;
      }
    }
    
    triggerHydrationReminder();
    
    setTimeout(() => {
      setIsTestingNotification(false);
    }, 1000);
  };

  const toggleNotifications = async () => {
    if (!settings.enabled && permissionStatus !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-500" />
          Hydration Reminders
        </h2>
        <p className="text-lg text-gray-600 mt-2">
          Stay hydrated with smart reminder notifications
        </p>
      </div>

      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Notification Status
            </div>
            <Button
              onClick={toggleNotifications}
              variant={settings.enabled ? "default" : "outline"}
              className={settings.enabled 
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" 
                : ""
              }
            >
              {settings.enabled ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enabled
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Disabled
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissionStatus === 'denied' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Browser notifications are blocked. Please enable notifications for this site in your browser settings.
                </p>
              </div>
            )}
            
            {permissionStatus === 'default' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  🔔 Click "Enable" to set up notifications. We'll ask for permission to send reminders.
                </p>
              </div>
            )}

            {settings.enabled && nextReminderTime && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Clock className="h-4 w-4" />
                  <span>
                    Next reminder: {nextReminderTime.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={testNotification}
              disabled={isTestingNotification || !settings.enabled}
              variant="outline"
              className="w-full"
            >
              {isTestingNotification ? (
                <>
                  <Bell className="h-4 w-4 mr-2 animate-pulse" />
                  Testing...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Test Notification
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Reminder Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interval */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reminder Interval</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={settings.interval}
              onChange={(e) => setSettings(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
              disabled={!settings.enabled}
            >
              <option value={30}>Every 30 minutes</option>
              <option value={60}>Every hour</option>
              <option value={90}>Every 1.5 hours</option>
              <option value={120}>Every 2 hours</option>
              <option value={180}>Every 3 hours</option>
            </select>
          </div>

          {/* Active Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.startTime}
                onChange={(e) => setSettings(prev => ({ ...prev, startTime: e.target.value }))}
                disabled={!settings.enabled}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.endTime}
                onChange={(e) => setSettings(prev => ({ ...prev, endTime: e.target.value }))}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-blue-500" />
              ) : (
                <VolumeX className="h-5 w-5 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700">Sound Notifications</span>
            </div>
            <Button
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              variant="outline"
              size="sm"
              disabled={!settings.enabled}
            >
              {settings.soundEnabled ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Weekend Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Weekend Reminders</span>
            <Button
              onClick={() => setSettings(prev => ({ ...prev, weekendsEnabled: !prev.weekendsEnabled }))}
              variant="outline"
              size="sm"
              disabled={!settings.enabled}
            >
              {settings.weekendsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reminder Message</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={settings.reminderText}
              onChange={(e) => setSettings(prev => ({ ...prev, reminderText: e.target.value }))}
              disabled={!settings.enabled}
              placeholder="Enter your custom reminder message..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💡 Hydration Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Drink water first thing in the morning to kickstart hydration</li>
            <li>• Keep a water bottle visible as a visual reminder</li>
            <li>• Set your reminder interval based on your activity level</li>
            <li>• Increase water intake during exercise or hot weather</li>
            <li>• Listen to your body - thirst is a late indicator of dehydration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default HydrationNotificationSystem;
