import type { AnaliseRow,PurchaseRow,RadarConfigRow } from '../types/database'
import type { View } from '../components/BottomNav'
import { daysSince,purchaseTotalCost } from './purchase'
import { money } from './format'

export type RadarAlert={
  id:string
  severity:'high'|'medium'|'info'
  title:string
  detail:string
  recommendation:string
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
    return{key:'reserved',label:'Reservado',detail:reserved>=3?'Reserva há '+reserved+' dias. Confirme o comprador.':'Venda encaminhada.'}
  }
  const days=daysSince(item.data_compra)
  if(days>=alertDays)return{key:'stuck',label:'Capital parado',detail:days+' dias em estoque. Revise preço e anúncio.'}
  if(days>=Math.max(4,Math.round(alertDays*.6)))return{key:'attention',label:'Atenção ao giro',detail:days+' dias em estoque. Acompanhe procura e propostas.'}
  return{key:'healthy',label:'Girando bem',detail:days+' dias em estoque.'}
}

function resalePrice(p:PurchaseRow){
  const ad=p.anuncio_revenda
  if(!ad||typeof ad!=='object'||Array.isArray(ad))return 0
  return Number((ad as any).preco_equilibrado||0)
}

export function buildRadarAlerts(analyses:AnaliseRow[],purchases:PurchaseRow[],config:RadarConfigRow){
  const alerts:RadarAlert[]=[]
  const stock=purchases.filter(p=>p.status!=='vendido')
  const invested=stock.reduce((sum,p)=>sum+purchaseTotalCost(p),0)

  if(config.capital_disponivel>0&&invested>=config.capital_disponivel*.85){
    const stuck=stock.filter(p=>inventoryHealth(p,config.dias_alerta_estoque).key==='stuck').length
    alerts.push({
      id:'capital',severity:invested>config.capital_disponivel?'high':'medium',
      title:'Caixa muito comprometido',
      detail:money(invested)+' estão presos no estoque de um capital configurado de '+money(config.capital_disponivel)+'.',
      recommendation:stuck?'Priorize a saída dos '+stuck+' item(ns) parados antes de assumir outra compra.':'Evite novas compras até liberar caixa ou registrar uma venda.',
      action:'Revisar estoque',view:'bought'
    })
  }

  for(const p of stock){
    const health=inventoryHealth(p,config.dias_alerta_estoque)
    if(health.key==='stuck'){
      const current=resalePrice(p)
      const floor=Math.max(Number(p.preco_minimo_venda||0),purchaseTotalCost(p))
      const suggested=current?Math.max(floor,Math.round(current*.95)):0
      alerts.push({
        id:'stock-'+p.id,severity:'high',title:'Capital parado · '+p.produto,detail:health.detail,
        recommendation:suggested&&suggested<current?'Teste reduzir o anúncio de '+money(current)+' para perto de '+money(suggested)+' sem atravessar seu piso.':'Revise a foto principal, descrição e preço. Se não houver procura, reduza em pequenos passos sem passar do seu piso.',
        action:'Abrir item',view:'bought'
      })
    }else if(health.key==='attention'){
      alerts.push({
        id:'stock-attention-'+p.id,severity:'medium',title:'Giro começando a desacelerar · '+p.produto,detail:health.detail,
        recommendation:'Confira visualizações, propostas e preço agora. Uma correção pequena cedo costuma ser melhor do que esperar o item virar estoque parado.',
        action:'Revisar item',view:'bought'
      })
    }else if(health.key==='reserved'&&p.data_reserva&&daysSince(p.data_reserva)>=3){
      alerts.push({
        id:'reserve-'+p.id,severity:'medium',title:'Reserva parada · '+p.produto,detail:health.detail,
        recommendation:'Confirme hoje se o comprador mantém interesse e defina um horário limite antes de segurar o item por mais tempo.',
        action:'Revisar reserva',view:'bought'
      })
    }

    const photos=Array.isArray(p.fotos)?p.fotos:[]
    if(photos.length===0){
      alerts.push({
        id:'photos-'+p.id,severity:'info',title:'Faltam fotos reais',detail:'Adicione fotos de '+p.produto+' para preparar a revenda e manter o histórico do item.',
        recommendation:'Faça 4–6 fotos em boa luz: frente, laterais, etiqueta/modelo, acessórios e qualquer marca de uso relevante.',
        action:'Adicionar fotos',view:'bought'
      })
    }else if(!p.anuncio_revenda){
      alerts.push({
        id:'resale-'+p.id,severity:'info',title:'Revenda ainda não preparada · '+p.produto,
        detail:'As fotos já estão no sistema, mas o anúncio de revenda ainda não foi preparado.',
        recommendation:'Use Vender com IA para montar título, descrição e faixa de preço antes de publicar.',
        action:'Preparar venda',view:'bought'
      })
    }
  }

  for(const a of analyses.filter(a=>a.pipeline_status==='aguardando_negociacao')){
    const days=daysSince(a.data_atualizacao)
    if(days>=2)alerts.push({
      id:'neg-'+a.id,severity:'medium',title:'Negociação sem atualização',
      detail:a.titulo_anuncio+' está aguardando há '+days+' dias. Registre a resposta ou uma contraproposta.',
      recommendation:'Retome a conversa com uma mensagem curta e um valor objetivo. Se o vendedor não responder, libere atenção para outra oportunidade.',
      action:'Abrir negociação',view:'history'
    })
  }

  for(const a of analyses.filter(a=>a.pipeline_status==='analisado')){
    const score=Number((a.analise_ia as any)?.calculado?.score_oportunidade??0)
    const days=daysSince(a.data_atualizacao)
    if(score>=80&&days>=1)alerts.push({
      id:'hot-'+a.id,severity:'medium',title:'Oportunidade forte sem decisão',
      detail:a.titulo_anuncio+' tem score '+score+' e está sem atualização há '+days+' dia(s).',
      recommendation:'Reabra a análise, confirme se o anúncio ainda está ativo e decida entre negociar ou descartar para não deixar oportunidade esquecida.',
      action:'Revisar análise',view:'history'
    })
  }

  return alerts.sort((a,b)=>rank(b.severity)-rank(a.severity))
}

function rank(s:RadarAlert['severity']){return s==='high'?3:s==='medium'?2:1}
