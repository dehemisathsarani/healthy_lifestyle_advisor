// Email Service for Diet Agent Notifications
// This service handles sending profile-related emails and notifications

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface UserDietProfile {
  id?: string
  name: string
  email: string
  age: number
  weight: number
  height: number
  gender: 'male' | 'female' | 'other'
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  goal: 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'general_health'
  dietary_restrictions?: string[]
  allergies?: string[]
  bmi?: number
  bmr?: number
  tdee?: number
  daily_calorie_goal?: number
  created_at?: string
  updated_at?: string
}

class EmailService {
  private apiUrl = '/api/send-email'

  // Send welcome email when profile is created
  async sendWelcomeEmail(profile: UserDietProfile): Promise<boolean> {
    try {
      const emailData = this.generateWelcomeEmailContent(profile)
      await this.sendEmail(emailData)
      return true
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return false
    }
  }

  // Send profile update notification
  async sendProfileUpdateEmail(profile: UserDietProfile): Promise<boolean> {
    try {
      const emailData = this.generateProfileUpdateEmailContent(profile)
      await this.sendEmail(emailData)
      return true
    } catch (error) {
      console.error('Failed to send profile update email:', error)
      return false
    }
  }

  // Send goal achievement notification
  async sendGoalAchievementEmail(profile: UserDietProfile, achievement: string): Promise<boolean> {
    try {
      const emailData = this.generateGoalAchievementEmailContent(profile, achievement)
      await this.sendEmail(emailData)
      return true
    } catch (error) {
      console.error('Failed to send goal achievement email:', error)
      return false
    }
  }

  // Send weekly nutrition summary
  async sendWeeklyNutritionSummary(profile: UserDietProfile, weeklyData: any): Promise<boolean> {
    try {
      const emailData = this.generateWeeklyNutritionSummaryContent(profile, weeklyData)
      await this.sendEmail(emailData)
      return true
    } catch (error) {
      console.error('Failed to send weekly nutrition summary:', error)
      return false
    }
  }

  // Send profile restoration notification
  async sendProfileRestorationEmail(profile: UserDietProfile, restoreMethod: 'session' | 'offline'): Promise<boolean> {
    try {
      const emailData = this.generateProfileRestorationEmailContent(profile, restoreMethod)
      await this.sendEmail(emailData)
      return true
    } catch (error) {
      console.error('Failed to send profile restoration email:', error)
      return false
    }
  }

  // Send session recovery notification
  async sendSessionRecoveryEmail(profile: UserDietProfile): Promise<boolean> {
    try {
      const emailData = this.generateSessionRecoveryEmailContent(profile)
      await this.sendEmail(emailData)
      return true
    } catch (error) {
      console.error('Failed to send session recovery email:', error)
      return false
    }
  }

  // Core email sending method
  private async sendEmail(emailData: EmailData): Promise<void> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`)
    }
  }

  // Generate welcome email content
  private generateWelcomeEmailContent(profile: UserDietProfile): EmailData {
    const goalText = this.getGoalDescription(profile.goal)
    const activityText = this.getActivityLevelDescription(profile.activity_level)
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10B981, #059669); color: white; border-radius: 20px; overflow: hidden;">
        <!-- Header -->
        <div style="padding: 40px 30px; text-align: center; background: rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🍎 Welcome to Your Nutrition Journey!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your personalized diet profile has been created</p>
        </div>

        <!-- Profile Summary -->
        <div style="padding: 30px; background: white; color: #1F2937;">
          <h2 style="color: #10B981; margin-top: 0;">Hello ${profile.name}! 👋</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Congratulations on taking the first step towards a healthier lifestyle! Your personalized nutrition profile has been successfully created and is ready to help you achieve your health goals.
          </p>

          <!-- Profile Details -->
          <div style="background: #F9FAFB; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">📋 Your Profile Summary:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                <strong>Goal:</strong> ${goalText}
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                <strong>Activity Level:</strong> ${activityText}
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                <strong>BMI:</strong> ${profile.bmi?.toFixed(1) || 'Calculating...'}
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
                <strong>Daily Calorie Goal:</strong> ${profile.daily_calorie_goal || 'Calculating...'} kcal
              </li>
              <li style="padding: 8px 0;">
                <strong>TDEE:</strong> ${profile.tdee || 'Calculating...'} kcal/day
              </li>
            </ul>
          </div>

          <!-- Dietary Restrictions & Allergies -->
          ${profile.dietary_restrictions && profile.dietary_restrictions.length > 0 ? `
            <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #92400E; margin-top: 0;">🚫 Dietary Restrictions:</h4>
              <p style="color: #92400E; margin: 0;">${profile.dietary_restrictions.join(', ')}</p>
            </div>
          ` : ''}

          ${profile.allergies && profile.allergies.length > 0 ? `
            <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="color: #DC2626; margin-top: 0;">⚠️ Allergies:</h4>
              <p style="color: #DC2626; margin: 0;">${profile.allergies.join(', ')}</p>
            </div>
          ` : ''}

          <!-- What's Next -->
          <div style="background: #EFF6FF; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #1D4ED8; margin-top: 0;">🚀 What's Next?</h3>
            <ul style="color: #1E40AF; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Start logging your meals using our AI-powered food analysis</li>
              <li style="margin-bottom: 8px;">Upload food images or describe your meals for instant nutrition tracking</li>
              <li style="margin-bottom: 8px;">Monitor your daily progress towards your calorie and macro goals</li>
              <li style="margin-bottom: 8px;">Get personalized insights and recommendations</li>
              <li>Track your journey with our comprehensive nutrition dashboard</li>
            </ul>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}" style="display: inline-block; background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🍽️ Start Tracking Your Nutrition
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: rgba(0,0,0,0.1); padding: 20px; text-align: center; color: rgba(255,255,255,0.8);">
          <p style="margin: 0; font-size: 14px;">
            📧 You're receiving this email because you created a nutrition profile with our Diet Agent.<br>
            🔒 Your data is secure and your sessions last 24 hours with auto-refresh.
          </p>
          <p style="margin: 10px 0 0; font-size: 12px; opacity: 0.7;">
            Healthy Lifestyle Advisor • AI-Powered Nutrition Tracking
          </p>
        </div>
      </div>
    `

    const text = `
Welcome to Your Nutrition Journey, ${profile.name}!

Your personalized diet profile has been successfully created:
- Goal: ${goalText}
- Activity Level: ${activityText}
- BMI: ${profile.bmi?.toFixed(1) || 'Calculating...'}
- Daily Calorie Goal: ${profile.daily_calorie_goal || 'Calculating...'} kcal
- TDEE: ${profile.tdee || 'Calculating...'} kcal/day

${profile.dietary_restrictions && profile.dietary_restrictions.length > 0 ? 
  `Dietary Restrictions: ${profile.dietary_restrictions.join(', ')}\n` : ''
}${profile.allergies && profile.allergies.length > 0 ? 
  `Allergies: ${profile.allergies.join(', ')}\n` : ''
}

What's Next?
- Start logging your meals using our AI-powered food analysis
- Upload food images or describe your meals for instant nutrition tracking
- Monitor your daily progress towards your goals
- Get personalized insights and recommendations

Visit ${window.location.origin} to start tracking your nutrition!
    `

    return {
      to: profile.email,
      subject: `🎉 Welcome ${profile.name}! Your Nutrition Profile is Ready`,
      html,
      text
    }
  }

  // Generate profile update email content
  private generateProfileUpdateEmailContent(profile: UserDietProfile): EmailData {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border-radius: 20px; overflow: hidden;">
        <div style="padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🔄 Profile Updated Successfully!</h1>
        </div>
        
        <div style="padding: 30px; background: white; color: #1F2937;">
          <h2 style="color: #3B82F6; margin-top: 0;">Hi ${profile.name}!</h2>
          
          <p>Your nutrition profile has been updated with your latest information. Your new metrics have been calculated:</p>
          
          <div style="background: #EFF6FF; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #DBEAFE;"><strong>BMI:</strong> ${profile.bmi?.toFixed(1)}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #DBEAFE;"><strong>BMR:</strong> ${profile.bmr} kcal/day</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #DBEAFE;"><strong>TDEE:</strong> ${profile.tdee} kcal/day</li>
              <li style="padding: 8px 0;"><strong>Daily Calorie Goal:</strong> ${profile.daily_calorie_goal} kcal</li>
            </ul>
          </div>
          
          <p>Continue tracking your nutrition to achieve your health goals!</p>
        </div>
      </div>
    `

    return {
      to: profile.email,
      subject: `✅ Profile Updated - ${profile.name}`,
      html
    }
  }

  // Generate goal achievement email content
  private generateGoalAchievementEmailContent(profile: UserDietProfile, achievement: string): EmailData {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border-radius: 20px; overflow: hidden;">
        <div style="padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Goal Achievement!</h1>
        </div>
        
        <div style="padding: 30px; background: white; color: #1F2937;">
          <h2 style="color: #F59E0B; margin-top: 0;">Congratulations ${profile.name}! 🎊</h2>
          
          <p>You've achieved a significant milestone in your nutrition journey:</p>
          
          <div style="background: #FEF3C7; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h3 style="color: #92400E; margin: 0; font-size: 18px;">${achievement}</h3>
          </div>
          
          <p>Keep up the excellent work! Your dedication to healthy nutrition is paying off.</p>
        </div>
      </div>
    `

    return {
      to: profile.email,
      subject: `🏆 Achievement Unlocked - ${achievement}`,
      html
    }
  }

  // Generate weekly nutrition summary email content
  private generateWeeklyNutritionSummaryContent(profile: UserDietProfile, weeklyData: any): EmailData {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border-radius: 20px; overflow: hidden;">
        <div style="padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">📊 Weekly Nutrition Summary</h1>
        </div>
        
        <div style="padding: 30px; background: white; color: #1F2937;">
          <h2 style="color: #8B5CF6; margin-top: 0;">Hi ${profile.name}!</h2>
          
          <p>Here's your nutrition summary for this week:</p>
          
          <div style="background: #F3E8FF; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0;"><strong>Meals Logged:</strong> ${weeklyData.mealsLogged || 0}</li>
              <li style="padding: 8px 0;"><strong>Avg Daily Calories:</strong> ${weeklyData.avgCalories || 0} kcal</li>
              <li style="padding: 8px 0;"><strong>Goal Achievement:</strong> ${weeklyData.goalAchievement || 0}%</li>
            </ul>
          </div>
          
          <p>Keep tracking your nutrition to maintain your progress!</p>
        </div>
      </div>
    `

    return {
      to: profile.email,
      subject: `📈 Your Weekly Nutrition Summary - ${profile.name}`,
      html
    }
  }

  // Generate profile restoration email content
  private generateProfileRestorationEmailContent(profile: UserDietProfile, restoreMethod: 'session' | 'offline'): EmailData {
    const methodText = restoreMethod === 'session' ? 'active session' : 'offline backup'
    const methodIcon = restoreMethod === 'session' ? '🔄' : '💾'
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #06B6D4, #0891B2); color: white; border-radius: 20px; overflow: hidden;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${methodIcon} Profile Restored Successfully!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Welcome back to your nutrition journey</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px; background: white; color: #1F2937;">
          <h2 style="color: #06B6D4; margin-top: 0;">Welcome back, ${profile.name}! 👋</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Great news! Your nutrition profile has been successfully restored from your ${methodText}. 
            You can now continue working towards your health goals right where you left off.
          </p>

          <!-- Restoration Details -->
          <div style="background: #F0F9FF; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #06B6D4;">
            <h3 style="color: #0369A1; margin-top: 0;">📋 Restored Profile Details:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 6px 0; color: #374151;">
                <strong>Goal:</strong> ${this.getGoalDescription(profile.goal)}
              </li>
              <li style="padding: 6px 0; color: #374151;">
                <strong>Daily Calorie Target:</strong> ${profile.daily_calorie_goal || 'Calculating...'} kcal
              </li>
              <li style="padding: 6px 0; color: #374151;">
                <strong>BMI:</strong> ${profile.bmi?.toFixed(1) || 'Calculating...'}
              </li>
              <li style="padding: 6px 0; color: #374151;">
                <strong>Activity Level:</strong> ${this.getActivityLevelDescription(profile.activity_level)}
              </li>
            </ul>
          </div>

          <!-- Next Steps -->
          <div style="background: #ECFDF5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">🎯 Ready to Continue:</h3>
            <ul style="color: #065F46; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Log your meals and track your nutrition</li>
              <li style="margin: 8px 0;">Review your personalized recommendations</li>
              <li style="margin: 8px 0;">Monitor your progress toward your goals</li>
              <li style="margin: 8px 0;">Get AI-powered nutrition insights</li>
            </ul>
          </div>

          <p style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px;">
            Your data is always secure and synchronized across devices when online.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background: rgba(255,255,255,0.1); text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Keep up the great work on your nutrition journey! 🌟
          </p>
        </div>
      </div>
    `

    return {
      to: profile.email,
      subject: `✅ Profile Restored - Welcome Back ${profile.name}!`,
      html
    }
  }

  // Generate session recovery email content
  private generateSessionRecoveryEmailContent(profile: UserDietProfile): EmailData {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border-radius: 20px; overflow: hidden;">
        <!-- Header -->
        <div style="padding: 30px; text-align: center; background: rgba(255,255,255,0.1);">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🔐 Session Recovered Successfully!</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your secure session has been restored</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px; background: white; color: #1F2937;">
          <h2 style="color: #F59E0B; margin-top: 0;">Session Active, ${profile.name}! 🎉</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your nutrition tracking session has been successfully recovered and is now active. 
            You can continue using all features without interruption.
          </p>

          <!-- Session Info -->
          <div style="background: #FFFBEB; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <h3 style="color: #92400E; margin-top: 0;">📅 Session Details:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 6px 0; color: #374151;">
                <strong>Recovered On:</strong> ${currentDate}
              </li>
              <li style="padding: 6px 0; color: #374151;">
                <strong>Session Duration:</strong> 24 hours (auto-renewal)
              </li>
              <li style="padding: 6px 0; color: #374151;">
                <strong>Sync Status:</strong> ${navigator.onLine ? 'Online & Synced' : 'Offline Mode'}
              </li>
              <li style="padding: 6px 0; color: #374151;">
                <strong>Data Security:</strong> Encrypted & Secure
              </li>
            </ul>
          </div>

          <!-- Security Notice -->
          <div style="background: #FEF2F2; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #DC2626; margin-top: 0;">🔒 Security Notice:</h3>
            <p style="color: #7F1D1D; margin: 0; font-size: 14px;">
              If this wasn't you, please contact our support team immediately. 
              Your account security is our top priority.
            </p>
          </div>

          <!-- Quick Actions -->
          <div style="background: #F0FDF4; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #166534; margin-top: 0;">⚡ Quick Actions Available:</h3>
            <ul style="color: #14532D; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Continue food logging and meal tracking</li>
              <li style="margin: 8px 0;">View your nutrition dashboard and insights</li>
              <li style="margin: 8px 0;">Update your profile or goals if needed</li>
              <li style="margin: 8px 0;">Access your complete nutrition history</li>
            </ul>
          </div>

          <p style="text-align: center; color: #6B7280; font-size: 14px; margin-top: 30px;">
            Your session will automatically renew while you're actively using the app.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 30px; background: rgba(255,255,255,0.1); text-align: center;">
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Happy tracking! Let's continue your nutrition journey 🚀
          </p>
        </div>
      </div>
    `

    return {
      to: profile.email,
      subject: `🔐 Session Recovered - ${profile.name}`,
      html
    }
  }

  // Helper methods
  private getGoalDescription(goal: string): string {
    const goals: { [key: string]: string } = {
      'weight_loss': 'Weight Loss - Achieve a sustainable calorie deficit',
      'weight_gain': 'Weight Gain - Build muscle and gain healthy weight',
      'maintain_weight': 'Maintain Weight - Keep your current healthy weight',
      'muscle_gain': 'Muscle Gain - Build lean muscle mass',
      'general_health': 'General Health - Maintain overall wellness'
    }
    return goals[goal] || 'Improve overall health and nutrition'
  }

  private getActivityLevelDescription(level: string): string {
    const levels: { [key: string]: string } = {
      'sedentary': 'Sedentary - Little or no exercise',
      'lightly_active': 'Lightly Active - Light exercise 1-3 days/week',
      'moderately_active': 'Moderately Active - Moderate exercise 3-5 days/week',
      'very_active': 'Very Active - Hard exercise 6-7 days/week',
      'extremely_active': 'Extremely Active - Very hard exercise, physical job'
    }
    return levels[level] || 'Moderate activity level'
  }
}

// Export singleton instance
export const dietAgentEmailService = new EmailService()
export default dietAgentEmailService
