export const money=(v:number|null|undefined)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v??0)
export const pct=(v:number|null|undefined)=>`${(v??0).toFixed(1)}%`
export const dateBR=(v:string)=>new Date(v).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'2-digit'})
export const clamp=(v:number,min=0,max=100)=>Math.min(max,Math.max(min,v))
