import { CheckCircle2,Eye,Search,ShieldAlert,Wrench } from 'lucide-react'
import type { AnalysisResult } from '../../types/analysis'

export function ProductForensics({a}:{a:AnalysisResult}){
  const d=a.diagnostico_produto
  if(!d)return null
  const confidence=Math.max(0,Math.min(100,Number(d.confianca_visual||0)))
  return <section className="product-forensics">
    <div className="product-forensics__head">
      <div><span className="premium-eyebrow">RAIO-X DO PRODUTO</span><h3>O que as fotos realmente mostram</h3><p>{d.identificacao_visual}</p></div>
      <div className="product-forensics__confidence"><Eye size={16}/><strong>{Math.round(confidence)}</strong><span>/100 visual</span></div>
    </div>
    <div className="product-forensics__condition"><span>ESTADO APARENTE</span><strong>{d.estado_aparente}</strong></div>
    <div className="product-forensics__grid">
      <ForensicList icon={ShieldAlert} title="Desgaste visível" items={d.sinais_desgaste} empty="Nenhum desgaste relevante confirmado nas imagens."/>
      <ForensicList icon={CheckCircle2} title="Itens presentes" items={d.itens_presentes} empty="Acessórios não confirmados pelas imagens."/>
      <ForensicList icon={Search} title="Ainda precisa confirmar" items={d.duvidas_visuais} empty="Sem dúvidas visuais importantes registradas."/>
      <ForensicList icon={Wrench} title="Testes antes de pagar" items={d.testes_criticos} empty="Faça um teste funcional completo antes de pagar."/>
    </div>
  </section>
}

function ForensicList({icon:Icon,title,items,empty}:{icon:any;title:string;items:string[];empty:string}){
  const list=Array.isArray(items)&&items.length?items.slice(0,5):[empty]
  return <div className="product-forensics__list"><div><Icon size={15}/><strong>{title}</strong></div>{list.map((item,i)=><p key={i}>{item}</p>)}</div>
}
