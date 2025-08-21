import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { FaHeartbeat, FaLeaf, FaRunning } from 'react-icons/fa'

export const HomePage = () => {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-r from-brand to-emerald-500 text-white p-10 shadow-lg">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Modern Healthy Fitness Care Advisor</h1>
        <p className="mt-4 text-lg text-emerald-100 max-w-2xl">
          Personalized nutrition, workouts, and wellness insights. Track your routine with a built-in planner and smart recommendations.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-md bg-white/10 px-5 py-2.5 backdrop-blur hover:bg-white/20">Get Started</button>
          <button className="rounded-md bg-black/20 px-5 py-2.5 backdrop-blur hover:bg-black/30">Explore Services</button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{ icon: <FaHeartbeat />, title: 'Wellness Insights', desc: 'Daily tips to keep you energized.' }, { icon: <FaLeaf />, title: 'Nutrition Plans', desc: 'Balanced meals for your goals.' }, { icon: <FaRunning />, title: 'Workout Routines', desc: 'Smart training tailored to you.' }].map((c, idx) => (
          <div key={idx} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-brand text-2xl">{c.icon}</div>
            <h3 className="mt-3 text-lg font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{c.desc}</p>
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
    </div>
  )
}


