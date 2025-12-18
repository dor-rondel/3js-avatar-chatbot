export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-400">
        Mischief Managed
      </p>
      <h1 className="text-4xl font-bold text-slate-50">
        3D Avatar Chatbot Coming Soon
      </h1>
      <p className="max-w-2xl text-base text-slate-300">
        We&apos;re conjuring a Harry Potter–inspired conversational experience
        with LangChain, Gemini, HeadTTS, and a fully animated React Three Fiber
        avatar. Stay tuned while we finish wiring the spellwork.
      </p>
    </main>
  );
}
