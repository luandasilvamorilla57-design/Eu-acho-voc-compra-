export function Brand({compact=false}:{compact?:boolean}){
  return (
    <div className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''}`}>
      <div className={`brand-emblem ${compact ? 'brand-emblem--compact' : ''}`} aria-hidden="true">
        <span className="brand-emblem__glow" />
        <span className="brand-emblem__ring brand-emblem__ring--outer" />
        <span className="brand-emblem__ring brand-emblem__ring--inner" />
        <span className="brand-emblem__core" />
        <span className="brand-emblem__dot" />
        <span className="brand-emblem__sweep" />
      </div>
      <div className="brand-wordmark">
        <div className="brand-wordmark__top">BRIKE</div>
        <div className="brand-wordmark__bottom">RADAR</div>
      </div>
    </div>
  )
}
