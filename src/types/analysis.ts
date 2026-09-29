export type RiskLevel = 'baixo' | 'medio' | 'alto'
export type Classification = 'excelente' | 'boa' | 'atencao' | 'arriscada' | 'evitar'
export interface AnalysisResult {
  produto:string; marca:string; modelo:string; categoria:string; condicao_estimada:string; resumo:string;
  pontos_fortes:string[]; pontos_fracos:string[]; confianca_geral:number; confianca_identificacao:number; confianca_preco:number;
  mercado:{preco_min:number;preco_mediano:number;preco_max:number;demanda:'baixa'|'media'|'alta';liquidez_score:number;justificativa:string;referencias:{titulo:string;preco:number;observacao:string}[]};
  precos:{preco_anunciado:number;oferta_agressiva:number;oferta_equilibrada:number;teto_compra:number;revenda_conservadora:number;revenda_provavel:number;revenda_otimista:number;custos_estimados:number};
  risco_score:number; negociabilidade_score:number;
  riscos:{titulo:string;nivel:RiskLevel;detalhe:string;como_verificar:string;impacto_financeiro_estimado:number}[];
  estrategias_negociacao:{nome:string;quando_usar:string;valor_sugerido:number;mensagem:string}[];
  mensagens_prontas:{primeiro_contato:string;contraproposta:string;fechamento:string;pos_visita:string};
  checklist_antes_compra:string[]; alertas_fraude:string[]; observacoes:string;
  calculado:{score_oportunidade:number;classificacao:Classification;lucro_potencial:number;roi_percentual:number;margem_percentual:number;vantagem_preco_percentual:number;desconto_oferta_percentual:number};
  fontes_verificadas:{title:string;url:string}[];
  meta?:{modelo:string;analisado_em:string;aviso:string};
}
