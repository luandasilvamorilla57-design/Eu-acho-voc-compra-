import { clamp } from '../utils/format'
export function ScoreRing({score,size=108}:{score:number,size?:number}){
  const s=clamp(score)
  const r=42
  const c=2*Math.PI*r
  const dash=c*(1-s/100)
  return <div className="relative grid shrink-0 place-items-center" style={{width:size,height:size}}>
    <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(45,212,165,.18),transparent_65%)] blur-md"/>
    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 drop-shadow-[0_8px_24px_rgba(16,185,129,.18)]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(148,163,184,.14)" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={dash}/>
      <defs><linearGradient id="scoreGradient"><stop stopColor="#34d399"/><stop offset="1" stopColor="#60a5fa"/></linearGradient></defs>
    </svg>
    <div className="absolute text-center">
      <strong className="font-display block text-2xl font-extrabold tracking-[-.04em] text-white">{Math.round(s)}</strong>
      <span className="text-[9px] uppercase tracking-[.18em] text-slate-300/85">score</span>
    </div>
  </div>
}
