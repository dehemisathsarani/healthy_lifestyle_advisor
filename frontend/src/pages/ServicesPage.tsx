export const ServicesPage = () => {
  const services = [
    { title: 'Personalized Nutrition', desc: 'AI-driven meal plans based on your goals and preferences.' },
    { title: 'Workout Programming', desc: 'Periodized plans for strength, hypertrophy, and endurance.' },
    { title: 'Habit Coaching', desc: 'Build sustainable habits with weekly check-ins.' },
    { title: 'Sleep Optimization', desc: 'Improve recovery and energy with tailored routines.' },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Services</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s, i) => (
          <div key={i} className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
            <button className="mt-4 rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark">Learn More</button>
          </div>
        ))}
      </div>
    </div>
  )
}


