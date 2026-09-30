import type { AnaliseRow } from '../types/database'
import { dateBR } from './format'

const statusLabel:Record<string,string>={
  analisado:'Analisado',
  visitei:'Visitei',
  comprei:'Comprei',
  vendi:'Vendi'
}

function cell(value:unknown){
  const text=String(value??'')
    .replace(/\r?\n/g,' ')
    .replaceAll('"','""')
  return '"'+text+'"'
}

function decimal(value:number|null|undefined){
  if(value==null||Number.isNaN(Number(value)))return ''
  return Number(value).toLocaleString('pt-BR',{useGrouping:false,maximumFractionDigits:2})
}

/**
 * Gera CSV em UTF-16 LE com BOM.
 * Essa codificação é detectada com mais consistência por
 * Google Sheets/Excel no Android e evita texto como "PreÃ§o".
 */
function utf16LeBlob(content:string){
  const bytes=new Uint8Array(2+content.length*2)
  bytes[0]=0xff
  bytes[1]=0xfe
  const view=new DataView(bytes.buffer)
  for(let i=0;i<content.length;i++)view.setUint16(2+i*2,content.charCodeAt(i),true)
  return new Blob([bytes],{type:'text/csv;charset=utf-16le'})
}

export function exportHistoryCsv(items:AnaliseRow[]){
  const headers=[
    'Produto',
    'Categoria',
    'Preço original',
    'Preço compra',
    'Preço venda',
    'Lucro',
    'Status',
    'Data'
  ]

  const rows=items.map(i=>[
    i.titulo_anuncio,
    i.categoria??'',
    decimal(i.preco_anunciado),
    decimal(i.preco_compra_real),
    decimal(i.preco_venda_real),
    decimal(i.lucro_realizado),
    statusLabel[i.status]??i.status,
    dateBR(i.data_criacao)
  ])

  const csv=[headers,...rows]
    .map(row=>row.map(cell).join(';'))
    .join('\r\n')

  const blob=utf16LeBlob(csv)
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a')
  link.href=url
  link.download='brike-radar-historico.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1500)
}
