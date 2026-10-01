export function Brand({compact=false}:{compact?:boolean}){
  return (
    <div className={`brand-lockup ${compact?'brand-lockup--compact':''}`} aria-label="BRIKE RADAR">
      <div className={`brand-emblem ${compact?'brand-emblem--compact':''}`} aria-hidden="true">
        <span className="brand-emblem__grid"/>
        <span className="brand-emblem__halo"/>
        <span className="brand-emblem__cross brand-emblem__cross--h"/>
        <span className="brand-emblem__cross brand-emblem__cross--v"/>
        <span className="brand-emblem__ring brand-emblem__ring--outer"/>
        <span className="brand-emblem__ring brand-emblem__ring--mid"/>
        <span className="brand-emblem__ring brand-emblem__ring--inner"/>
        <span className="brand-emblem__sweep"/>
        <span className="brand-emblem__core"/>
        <span className="brand-emblem__ping"/>
      </div>

      <div className="brand-wordmark">
        <span className="brand-wordmark__brike">BRIKE</span>
        <span className="brand-wordmark__divider" aria-hidden="true"/>
        <span className="brand-wordmark__radar">RADAR</span>
      </div>
    </div>
  )
}
