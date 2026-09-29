export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Status = 'analisado' | 'visitei' | 'comprei' | 'vendi'
export type AdOrigin = 'olx' | 'facebook' | 'manual'
export type PurchaseStatus = 'comprado' | 'vendido'
export type PurchaseOrigin = 'analise' | 'externo'

export type Database = {
  public: {
    Tables: {
      analises: {
        Row: {
          id:string; user_id:string; origem:AdOrigin; titulo_anuncio:string; preco_anunciado:number; categoria:string|null;
          link_anuncio:string|null; texto_anuncio:string; analise_ia:Json; margem_lucro_potencial:number|null;
          oferta_recomendada:number|null; status:Status; preco_compra_real:number|null; preco_venda_real:number|null;
          lucro_realizado:number|null; data_criacao:string; data_atualizacao:string
        }
        Insert: {
          id?:string; user_id?:string; origem?:AdOrigin; titulo_anuncio:string; preco_anunciado:number; categoria?:string|null;
          link_anuncio?:string|null; texto_anuncio?:string; analise_ia?:Json; margem_lucro_potencial?:number|null;
          oferta_recomendada?:number|null; status?:Status; preco_compra_real?:number|null; preco_venda_real?:number|null;
          data_criacao?:string; data_atualizacao?:string
        }
        Update: {
          origem?:AdOrigin; titulo_anuncio?:string; preco_anunciado?:number; categoria?:string|null; link_anuncio?:string|null;
          texto_anuncio?:string; analise_ia?:Json; margem_lucro_potencial?:number|null; oferta_recomendada?:number|null;
          status?:Status; preco_compra_real?:number|null; preco_venda_real?:number|null; data_atualizacao?:string
        }
        Relationships:[]
      }
      compras: {
        Row: {
          id:string; user_id:string; analise_id:string|null; origem_compra:PurchaseOrigin; produto:string; categoria:string|null;
          preco_compra:number; preco_venda:number|null; status:PurchaseStatus; lucro_realizado:number|null; roi_realizado:number|null;
          data_compra:string; data_venda:string|null; data_criacao:string; data_atualizacao:string
        }
        Insert: {
          id?:string; user_id?:string; analise_id?:string|null; origem_compra?:PurchaseOrigin; produto:string; categoria?:string|null;
          preco_compra:number; preco_venda?:number|null; status?:PurchaseStatus; data_compra?:string; data_venda?:string|null;
          data_criacao?:string; data_atualizacao?:string
        }
        Update: {
          analise_id?:string|null; origem_compra?:PurchaseOrigin; produto?:string; categoria?:string|null; preco_compra?:number;
          preco_venda?:number|null; status?:PurchaseStatus; data_compra?:string; data_venda?:string|null; data_atualizacao?:string
        }
        Relationships:[]
      }
    }
    Views:{}
    Functions:{}
    Enums:{analise_status:Status}
    CompositeTypes:{}
  }
}

export type AnaliseRow = Database['public']['Tables']['analises']['Row']
export type PurchaseRow = Database['public']['Tables']['compras']['Row']
