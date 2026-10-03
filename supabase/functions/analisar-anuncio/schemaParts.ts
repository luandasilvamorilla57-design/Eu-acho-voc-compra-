export const market={type:'object',properties:{
  preco_min:{type:'number'},preco_mediano:{type:'number'},preco_max:{type:'number'},demanda:{type:'string'},liquidez_score:{type:'number'},justificativa:{type:'string'},
  base_preco:{type:'string'},amostra_util:{type:'number'},observacao_amostra:{type:'string'},
  referencias:{type:'array',items:{type:'object',properties:{
    titulo:{type:'string'},preco:{type:'number'},observacao:{type:'string'},url:{type:'string'},fonte:{type:'string'}
  },required:['titulo','preco','observacao','url','fonte']}}
},required:['preco_min','preco_mediano','preco_max','demanda','liquidez_score','justificativa','base_preco','amostra_util','observacao_amostra','referencias']}

export const prices={type:'object',properties:{
  preco_anunciado:{type:'number'},oferta_agressiva:{type:'number'},oferta_equilibrada:{type:'number'},teto_compra:{type:'number'},
  revenda_conservadora:{type:'number'},revenda_provavel:{type:'number'},revenda_otimista:{type:'number'},custos_estimados:{type:'number'}
},required:['preco_anunciado','oferta_agressiva','oferta_equilibrada','teto_compra','revenda_conservadora','revenda_provavel','revenda_otimista','custos_estimados']}

export const risks={type:'array',items:{type:'object',properties:{titulo:{type:'string'},nivel:{type:'string'},detalhe:{type:'string'},como_verificar:{type:'string'},impacto_financeiro_estimado:{type:'number'}},required:['titulo','nivel','detalhe','como_verificar','impacto_financeiro_estimado']}}

export const negotiation={type:'array',items:{type:'object',properties:{nome:{type:'string'},quando_usar:{type:'string'},valor_sugerido:{type:'number'},mensagem:{type:'string'}},required:['nome','quando_usar','valor_sugerido','mensagem']}}

export const productDiagnosis={type:'object',properties:{
  identificacao_visual:{type:'string'},estado_aparente:{type:'string'},confianca_visual:{type:'number'},
  sinais_desgaste:{type:'array',items:{type:'string'}},itens_presentes:{type:'array',items:{type:'string'}},
  duvidas_visuais:{type:'array',items:{type:'string'}},testes_criticos:{type:'array',items:{type:'string'}},
  reparos_provaveis:{type:'array',items:{type:'string'}}
},required:['identificacao_visual','estado_aparente','confianca_visual','sinais_desgaste','itens_presentes','duvidas_visuais','testes_criticos','reparos_provaveis']}

export const resalePlan={type:'object',properties:{
  publico_alvo:{type:'string'},preco_publicacao:{type:'number'},preco_fechamento_alvo:{type:'number'},preco_liquidacao:{type:'number'},
  ganho_valorizacao_estimado:{type:'number'},estrategia_preco:{type:'string'},
  preparacao:{type:'array',items:{type:'object',properties:{acao:{type:'string'},custo_estimado:{type:'number'},ganho_valor_estimado:{type:'number'},prioridade:{type:'string'}},required:['acao','custo_estimado','ganho_valor_estimado','prioridade']}},
  fotos:{type:'array',items:{type:'object',properties:{foto:{type:'string'},como_fazer:{type:'string'},objetivo:{type:'string'}},required:['foto','como_fazer','objetivo']}},
  anuncio:{type:'object',properties:{titulo_sugerido:{type:'string'},destaques:{type:'array',items:{type:'string'}},evitar:{type:'array',items:{type:'string'}}},required:['titulo_sugerido','destaques','evitar']}
},required:['publico_alvo','preco_publicacao','preco_fechamento_alvo','preco_liquidacao','ganho_valorizacao_estimado','estrategia_preco','preparacao','fotos','anuncio']}
