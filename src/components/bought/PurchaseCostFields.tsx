export type CostDraft={transport:string;repair:string;cleaning:string;fees:string;other:string;notes:string}

export function PurchaseCostFields({value,onChange}:{value:CostDraft;onChange:(next:CostDraft)=>void}){
  const field=(key:keyof Omit<CostDraft,'notes'>,label:string,placeholder='0,00')=>
    <label className="purchase-cost-field"><span>{label}</span><div><b>R$</b><input inputMode="decimal" value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value.replace(',','.')})} placeholder={placeholder}/></div></label>

  return <div>
    <div className="mb-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Custos extras</div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {field('transport','Transporte')}
      {field('repair','Reparo')}
      {field('cleaning','Limpeza')}
      {field('fees','Taxas')}
      {field('other','Outros')}
    </div>
    <label className="mt-2 block text-[10px] text-slate-500">Observação dos custos
      <input className="purchase-input" value={value.notes} onChange={e=>onChange({...value,notes:e.target.value})} placeholder="Ex.: tinta, peça, combustível..."/>
    </label>
  </div>
}

export const costDraftToNumbers=(c:CostDraft)=>({
  transport:Number(c.transport||0),
  repair:Number(c.repair||0),
  cleaning:Number(c.cleaning||0),
  fees:Number(c.fees||0),
  other:Number(c.other||0),
  notes:c.notes
})

export const sumCostDraft=(c:CostDraft)=>Number(c.transport||0)+Number(c.repair||0)+Number(c.cleaning||0)+Number(c.fees||0)+Number(c.other||0)
