export const market={type:'object',properties:{
  preco_min:{type:'number'},preco_mediano:{type:'number'},preco_max:{type:'number'},demanda:{type:'string'},liquidez_score:{type:'number'},justificativa:{type:'string'},
  referencias:{type:'array',items:{type:'object',properties:{
    titulo:{type:'string'},preco:{type:'number'},observacao:{type:'string'},url:{type:'string'},fonte:{type:'string'}
  },required:['titulo','preco','observacao','url','fonte']}}
},required:['preco_min','preco_mediano','preco_max','demanda','liquidez_score','justificativa','referencias']}

export const prices={type:'object',properties:{preco_anunciado:{type:'number'},oferta_agressiva:{type:'number'},oferta_equilibrada:{type:'number'},teto_compra:{type:'number'},revenda_conservadora:{type:'number'},revenda_provavel:{type:'number'},revenda_otimista:{type:'number'},custos_estimados:{type:'number'}},required:['preco_anunciado','oferta_agressiva','oferta_equilibrada','teto_compra','revenda_conservadora','revenda_provavel','revenda_otimista','custos_estimados']}
export const risks={type:'array',items:{type:'object',properties:{titulo:{type:'string'},nivel:{type:'string'},detalhe:{type:'string'},como_verificar:{type:'string'},impacto_financeiro_estimado:{type:'number'}},required:['titulo','nivel','detalhe','como_verificar','impacto_financeiro_estimado']}}
export const negotiation={type:'array',items:{type:'object',properties:{nome:{type:'string'},quando_usar:{type:'string'},valor_sugerido:{type:'number'},mensagem:{type:'string'}},required:['nome','quando_usar','valor_sugerido','mensagem']}}
