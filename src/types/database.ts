export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Status = 'analisado' | 'visitei' | 'comprei' | 'vendi'
export type AdOrigin = 'olx' | 'facebook' | 'manual'
export type PurchaseStatus = 'comprado' | 'vendido'
export type PurchaseOrigin = 'analise' | 'externo'
export type InventoryStatus = 'em_estoque'|'reservado'|'vendido'|'prejuizo'
export type RadarDecision = 'compensa' | 'nao_compensa'
export type PipelineStatus = 'analisado'|'aguardando_negociacao'|'descartado'|'negociacao_falhou'|'comprado'|'vendido'
export type ProfitGoalMode='valor'|'percentual'
export type AccountPlan='start'|'pro'|'max'
export type ResaleDraftOrigin='radar'|'externo'
export type ResaleDraftStatus='rascunho'|'pronto'

export type Database = { public: { Tables: {
analises: {
 Row: { id:string;user_id:string;origem:AdOrigin;titulo_anuncio:string;preco_anunciado:number;categoria:string|null;link_anuncio:string|null;texto_anuncio:string;analise_ia:Json;margem_lucro_potencial:number|null;oferta_recomendada:number|null;status:Status;preco_compra_real:number|null;preco_venda_real:number|null;lucro_realizado:number|null;pipeline_status:PipelineStatus;veredito_radar:RadarDecision|null;inspecao_notas:string|null;inspecao_data:string|null;teto_compra_reavaliado:number|null;historico_negociacao:Json;referencias_usuario:Json;data_criacao:string;data_atualizacao:string }
 Insert: { id?:string;user_id?:string;origem?:AdOrigin;titulo_anuncio:string;preco_anunciado:number;categoria?:string|null;link_anuncio?:string|null;texto_anuncio?:string;analise_ia?:Json;margem_lucro_potencial?:number|null;oferta_recomendada?:number|null;status?:Status;preco_compra_real?:number|null;preco_venda_real?:number|null;pipeline_status?:PipelineStatus;veredito_radar?:RadarDecision|null;inspecao_notas?:string|null;inspecao_data?:string|null;teto_compra_reavaliado?:number|null;historico_negociacao?:Json;referencias_usuario?:Json;data_criacao?:string;data_atualizacao?:string }
 Update: { origem?:AdOrigin;titulo_anuncio?:string;preco_anunciado?:number;categoria?:string|null;link_anuncio?:string|null;texto_anuncio?:string;analise_ia?:Json;margem_lucro_potencial?:number|null;oferta_recomendada?:number|null;status?:Status;preco_compra_real?:number|null;preco_venda_real?:number|null;pipeline_status?:PipelineStatus;veredito_radar?:RadarDecision|null;inspecao_notas?:string|null;inspecao_data?:string|null;teto_compra_reavaliado?:number|null;historico_negociacao?:Json;referencias_usuario?:Json;data_atualizacao?:string }
 Relationships:[]
}
compras: {
 Row: { id:string;user_id:string;analise_id:string|null;origem_compra:PurchaseOrigin;produto:string;categoria:string|null;preco_compra:number;preco_venda:number|null;status:PurchaseStatus;situacao_estoque:InventoryStatus;custo_transporte:number;custo_reparo:number;custo_limpeza:number;custo_taxas:number;outros_custos:number;custos_observacao:string|null;preco_minimo_venda:number|null;observacoes:string|null;historico_negociacao:Json;data_reserva:string|null;fotos:Json;anuncio_revenda:Json|null;lucro_realizado:number|null;roi_realizado:number|null;data_compra:string;data_venda:string|null;data_criacao:string;data_atualizacao:string }
 Insert: { id?:string;user_id?:string;analise_id?:string|null;origem_compra?:PurchaseOrigin;produto:string;categoria?:string|null;preco_compra:number;preco_venda?:number|null;status?:PurchaseStatus;situacao_estoque?:InventoryStatus;custo_transporte?:number;custo_reparo?:number;custo_limpeza?:number;custo_taxas?:number;outros_custos?:number;custos_observacao?:string|null;preco_minimo_venda?:number|null;observacoes?:string|null;historico_negociacao?:Json;data_reserva?:string|null;fotos?:Json;anuncio_revenda?:Json|null;data_compra?:string;data_venda?:string|null;data_criacao?:string;data_atualizacao?:string }
 Update: { analise_id?:string|null;origem_compra?:PurchaseOrigin;produto?:string;categoria?:string|null;preco_compra?:number;preco_venda?:number|null;status?:PurchaseStatus;situacao_estoque?:InventoryStatus;custo_transporte?:number;custo_reparo?:number;custo_limpeza?:number;custo_taxas?:number;outros_custos?:number;custos_observacao?:string|null;preco_minimo_venda?:number|null;observacoes?:string|null;historico_negociacao?:Json;data_reserva?:string|null;fotos?:Json;anuncio_revenda?:Json|null;data_compra?:string;data_venda?:string|null;data_atualizacao?:string }
 Relationships:[]
}
radar_config:{
 Row:{user_id:string;capital_disponivel:number;lucro_minimo:number;lucro_minimo_modo:ProfitGoalMode;lucro_minimo_percentual:number;roi_minimo:number;dias_alerta_estoque:number;plano_atual:AccountPlan;acesso_total:boolean;data_atualizacao:string}
 Insert:{user_id?:string;capital_disponivel?:number;lucro_minimo?:number;lucro_minimo_modo?:ProfitGoalMode;lucro_minimo_percentual?:number;roi_minimo?:number;dias_alerta_estoque?:number;plano_atual?:AccountPlan;data_atualizacao?:string}
 Update:{capital_disponivel?:number;lucro_minimo?:number;lucro_minimo_modo?:ProfitGoalMode;lucro_minimo_percentual?:number;roi_minimo?:number;dias_alerta_estoque?:number;plano_atual?:AccountPlan;data_atualizacao?:string}
 Relationships:[]
}
anuncios_revenda:{
 Row:{id:string;user_id:string;origem_item:ResaleDraftOrigin;compra_id:string|null;analise_id:string|null;produto:string;categoria:string|null;marca:string|null;modelo:string|null;condicao:string|null;tempo_uso:string|null;observacoes:string|null;preco_minimo:number|null;preco_ideal:number|null;fotos:Json;resultado_ia:Json|null;titulo:string|null;descricao:string|null;preco_venda_rapida:number|null;preco_equilibrado:number|null;preco_premium:number|null;status:ResaleDraftStatus;data_criacao:string;data_atualizacao:string}
 Insert:{id?:string;user_id?:string;origem_item:ResaleDraftOrigin;compra_id?:string|null;analise_id?:string|null;produto:string;categoria?:string|null;marca?:string|null;modelo?:string|null;condicao?:string|null;tempo_uso?:string|null;observacoes?:string|null;preco_minimo?:number|null;preco_ideal?:number|null;fotos?:Json;resultado_ia?:Json|null;titulo?:string|null;descricao?:string|null;preco_venda_rapida?:number|null;preco_equilibrado?:number|null;preco_premium?:number|null;status?:ResaleDraftStatus;data_criacao?:string;data_atualizacao?:string}
 Update:{origem_item?:ResaleDraftOrigin;compra_id?:string|null;analise_id?:string|null;produto?:string;categoria?:string|null;marca?:string|null;modelo?:string|null;condicao?:string|null;tempo_uso?:string|null;observacoes?:string|null;preco_minimo?:number|null;preco_ideal?:number|null;fotos?:Json;resultado_ia?:Json|null;titulo?:string|null;descricao?:string|null;preco_venda_rapida?:number|null;preco_equilibrado?:number|null;preco_premium?:number|null;status?:ResaleDraftStatus;data_atualizacao?:string}
 Relationships:[]
}
assinaturas:{
 Row:{id:string;user_id:string;plano:AccountPlan;gateway:string;ambiente:'test'|'production';mercadopago_subscription_id:string|null;mercadopago_plan_id:string|null;external_reference:string|null;payer_email:string|null;status:string;valor:number|null;currency_id:string;proxima_cobranca:string|null;ultimo_pagamento_em:string|null;valido_ate:string|null;cancelada_em:string|null;dados_gateway:Json;created_at:string;updated_at:string}
 Insert:{id?:string;user_id:string;plano:AccountPlan;gateway?:string;ambiente?:'test'|'production';mercadopago_subscription_id?:string|null;mercadopago_plan_id?:string|null;external_reference?:string|null;payer_email?:string|null;status?:string;valor?:number|null;currency_id?:string;proxima_cobranca?:string|null;ultimo_pagamento_em?:string|null;valido_ate?:string|null;cancelada_em?:string|null;dados_gateway?:Json;created_at?:string;updated_at?:string}
 Update:{plano?:AccountPlan;status?:string;valor?:number|null;proxima_cobranca?:string|null;ultimo_pagamento_em?:string|null;valido_ate?:string|null;cancelada_em?:string|null;dados_gateway?:Json;updated_at?:string}
 Relationships:[]
}
planos_catalogo:{
 Row:{slug:AccountPlan;nome:string;preco_mensal:number;analises_mes:number;analises_dia:number;destaque:boolean;descricao:string;recursos:Json;ordem:number;ativo:boolean;updated_at:string}
 Insert:{slug:AccountPlan;nome:string;preco_mensal:number;analises_mes:number;analises_dia:number;destaque?:boolean;descricao?:string;recursos?:Json;ordem?:number;ativo?:boolean;updated_at?:string}
 Update:{nome?:string;preco_mensal?:number;analises_mes?:number;analises_dia?:number;destaque?:boolean;descricao?:string;recursos?:Json;ordem?:number;ativo?:boolean;updated_at?:string}
 Relationships:[]
}
client_errors:{
 Row:{id:string;user_id:string;context:string;message:string;stack:string|null;metadata:Json;created_at:string}
 Insert:{id?:string;user_id?:string;context?:string;message:string;stack?:string|null;metadata?:Json;created_at?:string}
 Update:{}
 Relationships:[]
}
};Views:{};Functions:{};Enums:{analise_status:Status};CompositeTypes:{} } }

export type AnaliseRow=Database['public']['Tables']['analises']['Row']
export type PurchaseRow=Database['public']['Tables']['compras']['Row']
export type RadarConfigRow=Database['public']['Tables']['radar_config']['Row']
export type ResaleDraftRow=Database['public']['Tables']['anuncios_revenda']['Row']
