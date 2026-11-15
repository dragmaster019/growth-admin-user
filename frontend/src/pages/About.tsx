import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import SocialLinks from '../components/SocialLinks'

const stats = [
  { value: '3', label: 'legs per member' },
  { value: '0', label: 'joining fee' },
  { value: '1', label: 'wallet for every point' },
]

const values = [
  {
    title: 'Student-first by design',
    body: 'Growth fits around lectures, exams and internships. There are no shifts, monthly targets or pressure to chase strangers.',
  },
  {
    title: 'Your circle, not a cold list',
    body: 'Invite classmates, clubmates and hostel friends who already know you. Real relationships make a healthier network.',
  },
  {
    title: 'Clear rules, visible progress',
    body: 'Referral placement, points, ranks and payouts are tracked in one place so you always know where you stand.',
  },
  {
    title: 'Rewards, not promises',
    body: 'Points are an in-app reward currency. We show the model honestly and never guarantee income.',
  },
]

const steps = [
  {
    title: 'Join with a code',
    body: 'Create your account with a friend’s referral code and get your own invite link instantly.',
  },
  {
    title: 'Build your three legs',
    body: 'Invite people you know. Each new member fills the first open leg under your line.',
  },
  {
    title: 'Earn points',
    body: 'Join bonuses and product activity credit points to your wallet and climb the leaderboard.',
  },
  {
    title: 'Grow together',
    body: 'Track your team, redeem rewards and keep building at your own pace.',
  },
]

export default function About() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-lime/15 blur-3xl animate-floaty" />
      <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-neon/10 blur-3xl animate-floaty-slow" />
      <div className="pointer-events-none absolute left-1/3 top-[42rem] h-72 w-72 rounded-full bg-magenta/10 blur-3xl" />

      <PublicHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="fade-up grid items-center gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <span className="pill border-lime/30 !bg-lime/10 !text-lime">About Growth</span>
            <h1 className="mt-5 text-balance text-3xl font-black leading-[1.06] tracking-tight text-white min-[420px]:text-4xl sm:text-5xl lg:text-6xl">
              A network built
              <br />
              around <span className="text-gradient">real people.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Growth is a student-first referral rewards platform. We help campus communities grow
              through trusted invites, transparent points and a simple three-leg structure.
            </p>
            <div className="mt-7 grid gap-2.5 sm:flex sm:flex-wrap">
              <Link to="/why-join" className="btn-primary w-full sm:w-auto">
                Explore the network
              </Link>
              <Link to="/contact" className="btn-ghost w-full sm:w-auto">
                Talk to us
              </Link>
            </div>
          </div>

          <div className="hero">
            <div className="flex items-center justify-between">
              <span className="pill">Our model</span>
              <span className="pill mono !text-lime">GROWTH</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-edge bg-panel2/50 p-3 text-center">
                  <div className="text-2xl font-black text-lime">{stat.value}</div>
                  <div className="mt-1 text-[10px] leading-tight text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              Every member gets three legs. When a leg fills, the next join spills over automatically,
              so the network grows in a clear, predictable way.
            </p>
            <div className="mt-5 rounded-2xl border border-lime/25 bg-lime/5 p-4 text-xs leading-relaxed text-slate-400">
              <strong className="text-lime">Honest note:</strong> Growth is a referral and community
              model, not a guaranteed income. Results depend on the people you invite and how active
              your circle chooses to be.
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="max-w-2xl">
            <span className="pill">How it works</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Simple by default.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              No complicated funnel. Just a clean referral tree, one wallet and rewards you can see.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="card card-hover">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime/30 bg-lime/10 text-sm font-black text-lime">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <span className="pill">What we care about</span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
                Growth should feel fair.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                We keep the rules visible, the rewards honest and the experience simple enough to use
                between classes.
              </p>
              <Link to="/join" className="btn-primary mt-6 w-full sm:w-auto">
                Start with an invite
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {values.map((value) => (
                <div key={value.title} className="rounded-2xl border border-edge bg-panel2/40 p-5">
                  <h3 className="text-sm font-bold text-white">{value.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{value.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 sm:mt-16">
          <div className="card overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6 sm:p-8">
                <span className="pill">Stay connected</span>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Follow the network.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Campus updates, drops and behind-the-scenes moments live on our socials. Reach out
                  any time — a real person will reply.
                </p>
                <div className="mt-5">
                  <SocialLinks />
                </div>
              </div>
              <div className="border-t border-edge bg-panel2/30 p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Questions?
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Send us a message and we will get back within two working days.
                </p>
                <Link to="/contact" className="btn-primary mt-5 w-full">
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}
