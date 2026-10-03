export type RiskLevel = 'baixo' | 'medio' | 'alto'
export type Classification = 'excelente' | 'boa' | 'atencao' | 'arriscada' | 'evitar'
export type MarketReferenceSource='usuario'|'url_context'|'google_search'|'estimativa'

export interface ProductDiagnosis {
  identificacao_visual:string
  estado_aparente:string
  confianca_visual:number
  sinais_desgaste:string[]
  itens_presentes:string[]
  duvidas_visuais:string[]
  testes_criticos:string[]
  reparos_provaveis:string[]
}

export interface ResalePlan {
  publico_alvo:string
  preco_publicacao:number
  preco_fechamento_alvo:number
  preco_liquidacao:number
  ganho_valorizacao_estimado:number
  estrategia_preco:string
  preparacao:{acao:string;custo_estimado:number;ganho_valor_estimado:number;prioridade:string}[]
  fotos:{foto:string;como_fazer:string;objetivo:string}[]
  anuncio:{titulo_sugerido:string;destaques:string[];evitar:string[]}
}

export interface AnalysisResult {
  produto:string; marca:string; modelo:string; categoria:string; condicao_estimada:string; resumo:string;
  pontos_fortes:string[]; pontos_fracos:string[]; confianca_geral:number; confianca_identificacao:number; confianca_preco:number;
  dados_faltantes?:string[];
  diagnostico_produto?:ProductDiagnosis;
  mercado:{
    preco_min:number;preco_mediano:number;preco_max:number;demanda:'baixa'|'media'|'alta';liquidez_score:number;justificativa:string;
    base_preco?:string;amostra_util?:number;observacao_amostra?:string;
    referencias:{titulo:string;preco:number;observacao:string;url:string;fonte:MarketReferenceSource}[]
  };
  precos:{preco_anunciado:number;oferta_agressiva:number;oferta_equilibrada:number;teto_compra:number;revenda_conservadora:number;revenda_provavel:number;revenda_otimista:number;custos_estimados:number};
  revenda?:ResalePlan;
  risco_score:number; negociabilidade_score:number;
  riscos:{titulo:string;nivel:RiskLevel;detalhe:string;como_verificar:string;impacto_financeiro_estimado:number}[];
  estrategias_negociacao:{nome:string;quando_usar:string;valor_sugerido:number;mensagem:string}[];
  mensagens_prontas:{primeiro_contato:string;contraproposta:string;fechamento:string;pos_visita:string};
  checklist_antes_compra:string[]; alertas_fraude:string[]; observacoes:string;
  calculado:{score_oportunidade:number;classificacao:Classification;lucro_potencial:number;roi_percentual:number;margem_percentual:number;vantagem_preco_percentual:number;desconto_oferta_percentual:number};
  fontes_verificadas:{title:string;url:string}[];
  meta?:{modelo:string;analisado_em:string;aviso:string;origem?:string;fallback_automatico?:boolean;provedor?:'gemini'|'groq';cadeia_provedores?:string[];pesquisa_web?:boolean;consultas_mercado?:number;consultas_web?:string[]};
}
