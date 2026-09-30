export type PhotoQuality='boa'|'atencao'|'refazer'

export type PhotoReview={
  indice:number
  nota:number
  qualidade:PhotoQuality
  pontos_fortes:string[]
  problemas:string[]
  acao_recomendada:string
}

export type PhotoAudit={
  nota_geral:number
  nitidez_score:number
  iluminacao_score:number
  apresentacao_score:number
  pronta_para_publicar:boolean
  resumo:string
  foto_principal_indice:number
  avaliacoes:PhotoReview[]
  problemas_gerais:string[]
  plano_de_fotos:string[]
}

export type ResaleAd={
  titulo:string
  descricao:string
  preco_venda_rapida:number
  preco_equilibrado:number
  preco_premium:number
  pontos_destaque:string[]
  checklist_fotos:string[]
  resposta_negociacao:string
  foto_auditoria:PhotoAudit
  gerado_em:string
}
