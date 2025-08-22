import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { FaHeartbeat, FaLeaf, FaRunning, FaBrain, FaAppleAlt, FaBolt } from 'react-icons/fa'

import { useNavigate } from 'react-router-dom'
import { startGoogleOAuthPopup } from '../lib/oauth'
import { Chatbot } from '../components/Chatbot'

export const HomePage = () => {
  const navigate = useNavigate()
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-white shadow-xl bg-gradient-to-br from-emerald-500 via-brand to-sky-500">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
            <FaBrain /> <span className="text-sm">Meet your advisor: <strong>VitaCoach AI</strong></span>
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Health, Fitness, and Food — Tailored for You
          </h1>
          <p className="mt-4 text-lg text-emerald-50 max-w-2xl">
            VitaCoach AI crafts daily plans across training and nutrition, aligning with your goals and schedule.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => startGoogleOAuthPopup()} className="rounded-lg bg-white text-gray-900 px-6 py-2.5 shadow hover:shadow-md">Start Free</button>
            <button className="rounded-lg bg-black/20 px-6 py-2.5 backdrop-blur hover:bg-black/30">See How It Works</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <FaHeartbeat />, title: 'Wellness Insights', desc: 'Daily tips to keep you energized.' },
          { icon: <FaAppleAlt />, title: 'Nutrition Plans', desc: 'Balanced meals for your goals.' },
          { icon: <FaRunning />, title: 'Workout Routines', desc: 'Smart training tailored to you.' },
        ].map((c, idx) => (
          <div key={idx} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <div className="text-white text-xl h-10 w-10 grid place-content-center rounded-lg bg-gradient-to-br from-brand to-emerald-500">
                {c.icon}
              </div>
              <h3 className="text-lg font-semibold">{c.title}</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">{c.desc}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Planner Calendar</h2>
          <p className="text-sm text-gray-600 mb-4">Schedule workouts and meals with a simple monthly view.</p>
          <DayPicker mode="single" className="rdp" />
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Featured Programs</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Lean & Strong', desc: '8-week strength and conditioning.' },
              { title: 'Mindful Mobility', desc: 'Daily flexibility and recovery.' },
              { title: 'Cardio Boost', desc: 'Improve endurance and VO2 max.' },
              { title: 'Clean Eating', desc: 'Macro-friendly meal plans.' },
            ].map((card, i) => (
              <div key={i} className="rounded-lg border p-4 hover:border-brand/50">
                <div className="font-medium">{card.title}</div>
                <div className="text-sm text-gray-600">{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl grid place-content-center bg-gradient-to-br from-rose-500 to-orange-400 text-white">
            <FaBolt />
          </div>
          <div>
            <h2 className="text-xl font-semibold">VitaCoach AI — Your Advisor Agent</h2>
            <p className="mt-2 text-sm text-gray-600 max-w-3xl">
              Ask for a meal plan, a 30-minute workout, or recovery tips. VitaCoach AI learns your preferences and adapts.
            </p>
          </div>
        </div>
      </section>
      
      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}


