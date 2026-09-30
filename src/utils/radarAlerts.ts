import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../types/database'
import type { View } from '../components/BottomNav'
import { daysSince,purchaseTotalCost } from './purchase'
import { money } from './format'

export type RadarAlert={
  id:string
  severity:'high'|'medium'|'info'
  title:string
  detail:string
  action:string
  view:View
}

export type InventoryHealth={
  key:'healthy'|'attention'|'stuck'|'reserved'|'sold'|'loss'
  label:string
  detail:string
}

export function inventoryHealth(item:PurchaseRow,alertDays:number):InventoryHealth{
  if(item.situacao_estoque==='prejuizo')return{key:'loss',label:'Saiu no prejuízo',detail:'Use este resultado para calibrar as próximas compras.'}
  if(item.status==='vendido')return{key:'sold',label:'Vendido',detail:'Negócio finalizado.'}
  if(item.situacao_estoque==='reservado'){
    const reserved=item.data_reserva?daysSince(item.data_reserva):0
    return{key:'reserved',label:'Reservado',detail:reserved>=3?`Reserva há ${reserved} dias. Confirme o comprador.`:'Venda encaminhada.'}
  }
  const days=daysSince(item.data_compra)
  if(days>=alertDays)return{key:'stuck',label:'Capital parado',detail:`${days} dias em estoque. Revise preço e anúncio.`}
  if(days>=Math.max(4,Math.round(alertDays*.6)))return{key:'attention',label:'Atenção ao giro',detail:`${days} dias em estoque. Acompanhe procura e propostas.`}
  return{key:'healthy',label:'Girando bem',detail:`${days} dias em estoque.`}
}

export function buildRadarAlerts(analyses:AnaliseRow[],purchases:PurchaseRow[],config:RadarConfigRow){
  const alerts:RadarAlert[]=[]
  const stock=purchases.filter(p=>p.status!=='vendido')
  const invested=stock.reduce((sum,p)=>sum+purchaseTotalCost(p),0)

  if(config.capital_disponivel>0&&invested>=config.capital_disponivel*.85){
    alerts.push({id:'capital',severity:invested>config.capital_disponivel?'high':'medium',title:'Caixa muito comprometido',detail:`${money(invested)} estão presos no estoque de um capital configurado de ${money(config.capital_disponivel)}.`,action:'Revisar estoque',view:'bought'})
  }

  for(const p of stock){
    const health=inventoryHealth(p,config.dias_alerta_estoque)
    if(health.key==='stuck')alerts.push({id:'stock-'+p.id,severity:'high',title:p.produto,detail:health.detail,action:'Abrir item',view:'bought'})
    else if(health.key==='reserved'&&p.data_reserva&&daysSince(p.data_reserva)>=3)alerts.push({id:'reserve-'+p.id,severity:'medium',title:'Reserva parada: '+p.produto,detail:health.detail,action:'Revisar reserva',view:'bought'})
    if((Array.isArray(p.fotos)?p.fotos:[]).length===0)alerts.push({id:'photos-'+p.id,severity:'info',title:'Faltam fotos reais',detail:`Adicione fotos de ${p.produto} para preparar a revenda e manter o histórico do item.`,action:'Adicionar fotos',view:'bought'})
  }

  for(const a of analyses.filter(a=>a.pipeline_status==='aguardando_negociacao')){
    const days=daysSince(a.data_atualizacao)
    if(days>=2)alerts.push({id:'neg-'+a.id,severity:'medium',title:'Negociação sem atualização',detail:`${a.titulo_anuncio} está aguardando há ${days} dias. Registre a resposta ou uma contraproposta.`,action:'Abrir negociação',view:'history'})
  }

  return alerts.sort((a,b)=>rank(b.severity)-rank(a.severity))
}
function rank(s:RadarAlert['severity']){return s==='high'?3:s==='medium'?2:1}
