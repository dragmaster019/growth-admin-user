import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import PublicFooter from '../components/PublicFooter'
import PublicHeader from '../components/PublicHeader'

const stats = [
  { value: '3', label: 'legs per member', hint: 'Left, Middle and Right' },
  { value: '50', label: 'points per join', hint: 'credited up the referral line' },
  { value: '25%', label: 'first-level share', hint: 'on every product purchase' },
  { value: '0', label: 'joining fee', hint: 'start with one invite' },
]

const benefits = [
  {
    title: 'Earn between lectures',
    body: 'No fixed shifts and no monthly targets. Share your invite code when you have a free minute and let your circle grow while you study.',
  },
  {
    title: 'No sales scripts',
    body: 'You are not cold-calling strangers. You invite classmates, clubmates and hostel friends who already trust you.',
  },
  {
    title: 'Build a real network',
    body: 'Every member gets three legs. When a leg fills up, the next join spills over automatically, so your team keeps growing without you micromanaging it.',
  },
  {
    title: 'Rewards you actually use',
    body: 'Points sit in your wallet and can be spent on product drops or topped up by the admin team for consistent activity.',
  },
  {
    title: 'Learn marketing by doing',
    body: 'Referral links, positioning, follow-up and community building are real skills you can put on a resume after college.',
  },
  {
    title: 'Your schedule, your pace',
    body: 'Exams, internships, fest season, placements — you decide how much time you give it. Nothing is locked in.',
  },
]

const inspiration = (name: string) => `${import.meta.env.BASE_URL}inspiration/${name}`

const steps = [
  {
    title: 'Get an invite code',
    body: 'Ask a friend who is already in the network for their referral code, or open an invite link they share with you.',
    image: inspiration('step-invite.jpg'),
    alt: 'Students laughing together around a laptop in a campus library',
  },
  {
    title: 'Create your account',
    body: 'Sign up with your name, email and password. You instantly get your own referral code and a place in the tree.',
    image: inspiration('step-account.jpg'),
    alt: 'Two people pointing at a laptop while setting up an account',
  },
  {
    title: 'Grow your three legs',
    body: 'Share your code with people you know. Each new member joins under your line and fills the first open leg — Left, Middle or Right.',
    image: inspiration('step-team.jpg'),
    alt: 'Three friends collaborating around a table with laptops',
  },
  {
    title: 'Earn and redeem',
    body: 'Join bonuses and product activity credit points to your wallet. Use them on drops or keep growing your circle.',
    image: inspiration('step-reward.jpg'),
    alt: 'A collaborative table filled with laptops, notebooks and phones',
  },
]

const earnWays = [
  {
    title: 'Join bonuses',
    body: 'Every new member credits 50 points to each upline in their referral chain. The bigger the circle you help build, the more often this lands.',
  },
  {
    title: 'Product activity',
    body: 'When someone buys a product, 25% of the purchase value goes to their direct upline, then 18.75% to the next level, decaying up the chain. Any remainder goes to the founder pool.',
  },
  {
    title: 'Team depth',
    body: 'Your downline is counted across the whole tree, not just direct invites. Deep, healthy legs mean steady activity over time.',
  },
  {
    title: 'Admin rewards',
    body: 'Campus leads and admins can credit bonus points to members who consistently show up, support their team and keep things clean.',
  },
]

const campusPlays = [
  {
    title: 'Hostel floor challenge',
    body: 'Get your floor to join under one code and track which wing grows fastest. It turns a dorm into a friendly leaderboard.',
  },
  {
    title: 'Club and society growth',
    body: 'Use the network to bring in volunteers and members, then reward the people who invite the most genuine sign-ups.',
  },
  {
    title: 'Fest teams',
    body: 'Build your fest or event crew through referral chains so each team captain owns a leg and can see their own branch.',
  },
  {
    title: 'Study groups',
    body: 'Turn a study group into a small earning circle. Everyone invites one or two people and the tree fills itself.',
  },
]

const testimonials = [
  {
    name: 'Ananya',
    role: '3rd year, Computer Science',
    quote:
      'I started with two friends from my hostel. Six weeks later my first leg is full and the points paid for almost all of my last product order.',
  },
  {
    name: 'Rohit',
    role: '2nd year, Commerce',
    quote:
      'The best part is that I am not selling anything in DMs. I just share my code with people who ask what I am doing, and the app tracks everything.',
  },
  {
    name: 'Sneha',
    role: 'Final year, Design',
    quote:
      'I used it to grow my college fest team. Everyone could see their own branch, which made the whole thing feel fair and transparent.',
  },
]

const faqs = [
  {
    q: 'Do I have to pay to join?',
    a: 'No. Creating an account is free. You only need a valid referral code from someone already in the network.',
  },
  {
    q: 'Do I have to sell products to my friends?',
    a: 'No. Sharing your code is the main action. Buying and selling products is optional, and the shop is just one way to use your points.',
  },
  {
    q: 'How are the three legs decided?',
    a: 'Every member has three slots: Left, Middle and Right. When you invite someone they take the first open slot. If a slot is already taken, the system spill over to the next open place in your branch.',
  },
  {
    q: 'How much can I earn?',
    a: 'There is no fixed or guaranteed amount. Results depend on how many genuine people you invite, how active they are, and how much product activity happens in your network. Treat it as a side project, not a salary.',
  },
  {
    q: 'What are points worth?',
    a: 'Points are the in-app reward currency. You can spend them on product drops and receive bonus credits from the admin team. They are not a bank balance and have no cash value outside the platform.',
  },
  {
    q: 'What happens if my friend already has a sponsor?',
    a: 'They join under their own sponsor. The tree then places them in the first open slot under that sponsor, so nobody has to fight for a position.',
  },
]

export default function WhyJoin() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    interest: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (!target) return
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [hash])

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSent(false)
    try {
      const message = [
        form.college ? `College / year: ${form.college}` : '',
        form.interest ? `Interested in: ${form.interest}` : '',
        form.message ? `Question: ${form.message}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      await api.post('/contact', {
        name: form.name,
        email: form.email,
        message,
      })
      setSent(true)
      setForm({ name: '', email: '', college: '', interest: '', message: '' })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-lime/15 blur-3xl animate-floaty" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-neon/10 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute left-1/3 top-[38rem] h-72 w-72 rounded-full bg-magenta/10 blur-3xl" />

      <PublicHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6">
        <section className="fade-up grid items-center gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <span className="pill border-lime/30 !bg-lime/10 !text-lime">
              Built for college students
            </span>
            <h1 className="mt-5 text-balance text-3xl font-black leading-[1.06] tracking-tight text-white min-[420px]:text-4xl sm:text-5xl lg:text-6xl">
              Your campus circle
              <br />
              is your first <span className="text-gradient">income stream.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Growth is a student-first referral network. Invite classmates you actually know, build a
              three-leg team, and earn points you can spend on rewards — between lectures, not instead
              of them.
            </p>
            <div className="mt-7 grid gap-2.5 sm:flex sm:flex-wrap">
              <Link to="/join" className="btn-primary w-full sm:w-auto">
                Join the network
              </Link>
              <a href="#interest" className="btn-ghost w-full sm:w-auto">
                Talk to a campus lead
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-neon" />
                No joining fee
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Start with one invite
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
                Points tracked in one wallet
              </span>
            </div>
          </div>

          <div className="hero">
            <div className="flex items-center justify-between">
              <span className="pill">Your first 30 days</span>
              <span className="pill mono !text-lime">GROWTH</span>
            </div>
            <div className="mt-5 space-y-3">
              {[
                { day: 'Day 1', title: 'You join with a friend’s code', body: 'Your account and referral code are created instantly.' },
                { day: 'Day 3', title: 'You invite two classmates', body: 'They fill your Left and Middle legs automatically.' },
                { day: 'Day 14', title: 'Your first join bonus lands', body: '50 points are credited to each upline in the chain.' },
                { day: 'Day 30', title: 'Your circle starts shopping', body: 'Product purchases move 25% shares up the referral line.' },
              ].map((item) => (
                <div key={item.day} className="rounded-2xl border border-edge bg-panel2/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{item.title}</span>
                    <span className="pill !py-0.5 text-[10px] uppercase tracking-wider">{item.day}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
              Illustrative timeline. Actual activity depends on how many people you invite and how
              active they are.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="card card-hover">
              <div className="text-3xl font-black tracking-tight text-white">{item.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-300">{item.label}</div>
              <div className="mt-1 text-xs text-slate-500">{item.hint}</div>
            </div>
          ))}
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="max-w-2xl">
            <span className="pill">Why students join</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              A side project that fits <span className="text-gradient">student life.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Most earning options on campus ask for shifts, sales targets or upfront money. Growth is
              deliberately different: one code, a clear tree and a wallet that shows exactly what
              happened.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item, index) => (
              <div key={item.title} className="card card-hover">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime/30 bg-lime/10 text-xs font-black text-lime">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mt-12 scroll-mt-28 sm:mt-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="pill">How it works</span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Four steps, no guesswork.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                The tree does the placement. You focus on inviting genuine people and keeping your
                circle active.
              </p>
            </div>
            <Link to="/join" className="btn-primary hidden shrink-0 sm:inline-flex">
              Create my account
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((item, index) => (
              <article key={item.title} className="card card-hover group overflow-hidden !p-0">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/70 to-transparent" />
                  <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-lime/40 bg-ink/80 font-mono text-[11px] font-semibold text-lime backdrop-blur">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </div>
              </article>
            ))}
          </div>

          <Link to="/join" className="btn-primary mt-5 w-full sm:hidden">
            Create my account
          </Link>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="pill">Ways to earn</span>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Points move when your circle moves.
                </h2>
              </div>
              <span className="pill self-start sm:self-auto">4 ways to earn</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {earnWays.map((item) => (
                <div key={item.title} className="rounded-2xl border border-edge bg-panel2/40 p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-lime/30 bg-lime/5 p-4 text-xs leading-relaxed text-slate-400">
              <strong className="text-lime">Honest note:</strong> this is a referral and community
              model, not a guaranteed income. Points are an in-app reward currency, and results depend
              entirely on how many real people you invite and how active they choose to be.
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="max-w-2xl">
            <span className="pill">On campus</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Ways students actually use it.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              The network is a tool. These are the plays that work best when you are surrounded by the
              same people every day.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {campusPlays.map((item) => (
              <div key={item.title} className="card card-hover">
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="stories" className="mt-12 scroll-mt-28 sm:mt-16">
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="card">
                <div className="flex items-center gap-3">
                  <span className="avatar">{item.name.slice(0, 1)}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-slate-500">{item.role}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">“{item.quote}”</p>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mt-12 scroll-mt-28 grid gap-6 sm:mt-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <span className="pill">Questions</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              Straight answers.
            </h2>
            <div className="mt-5 space-y-2">
              {faqs.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-edge bg-panel2/40 p-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-white">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-slate-500 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div id="interest" className="card scroll-mt-28">
            <span className="pill">Interested?</span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
              Request a callback.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Not ready to sign up yet? Share your details and a campus lead will reach out to explain
              the tree, points and how to start with your own circle.
            </p>

            {sent ? (
              <div className="mt-6 rounded-2xl border border-lime/40 bg-lime/10 p-5">
                <div className="text-sm font-semibold text-lime">Request received.</div>
                <p className="mt-1 text-sm text-slate-300">
                  Thanks for reaching out. A campus lead will contact you within two working days.
                  You can also join right away with your friend’s code.
                </p>
                <Link to="/join" className="btn-primary mt-4 w-full">
                  Join with a code
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="lead-name">
                      Full name
                    </label>
                    <input
                      id="lead-name"
                      required
                      className="field"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ada Lovelace"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="lead-email">
                      Email
                    </label>
                    <input
                      id="lead-email"
                      type="email"
                      required
                      className="field"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@college.edu"
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="lead-college">
                    College and year
                  </label>
                  <input
                    id="lead-college"
                    className="field"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    placeholder="e.g. St. Xavier’s, 2nd year"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="lead-interest">
                    What are you interested in?
                  </label>
                  <select
                    id="lead-interest"
                    className="field"
                    value={form.interest}
                    onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  >
                    <option value="">Select one</option>
                    <option value="Joining with a friend's code">Joining with a friend’s code</option>
                    <option value="Building a campus team">Building a campus team</option>
                    <option value="Rewards and products">Rewards and products</option>
                    <option value="Just learning more">Just learning more</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="lead-message">
                    Anything specific?
                  </label>
                  <textarea
                    id="lead-message"
                    rows={3}
                    className="field"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your circle, club or question."
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? 'Sending…' : 'Request a callback'}
                </button>
                <p className="text-center text-[11px] text-slate-600">
                  We only use your details to respond to this request.
                </p>
              </form>
            )}
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
