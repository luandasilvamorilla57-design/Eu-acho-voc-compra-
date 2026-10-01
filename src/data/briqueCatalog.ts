export type GiroPreferido='rapido'|'medio'
export type BriqueTierId='ate100'|'100-150'|'150-250'|'250-400'|'400-700'|'700mais'
export type BriqueOpportunity={
  id:string
  title:string
  tier:BriqueTierId
  giro:GiroPreferido
  marketAsk:[number,number]
  targetBuy:[number,number]
  heat:'muito-quente'|'quente'
  why:string
  risk:string
  signal:string
}

type Kind=
  |'microwave'|'cooktop'|'airfryer'|'controller'|'drill'|'hair'|'fan'|'blender'
  |'monitor'|'pressureWasher'|'coffeeCapsule'|'tv'|'console'|'iphone'|'android'
  |'speaker'|'notebook'|'vacuum'|'bike'|'printer'|'stove'|'washer'|'fridge'
  |'soundbar'|'powerTool'|'pc'|'freezer'|'kitchenSmall'

const riskByKind:Record<Kind,string>={
  microwave:'Teste aquecimento com copo d’água, prato, painel, porta e trava. Ferrugem interna, faiscamento ou porta danificada reprovam; não abra o aparelho por risco de alta tensão.',
  cooktop:'Teste todas as bocas, acendimento e registros. Vidro trincado, cheiro ou vazamento de gás e chama irregular são motivo para recusar.',
  airfryer:'Teste resistência, ventilador, timer/painel e cesto. Antiaderente muito descascado, cheiro elétrico ou aquecimento irregular são alertas.',
  controller:'Confirme originalidade, analógicos sem drift, gatilhos, Bluetooth/USB e bateria. Controle paralelo anunciado como original é risco comum.',
  drill:'Teste reversão, mandril, impacto e funcionamento sob carga. Faísca excessiva, cheiro forte, folga ou bateria fraca reduzem a margem.',
  hair:'Teste aquecimento, ventilação, cabo e seletor. Evite cabo ressecado, cheiro de queimado ou carcaça derretida.',
  fan:'Teste todas as velocidades, oscilação e ruído. Motor pesado, capacitor fraco, cheiro de queimado ou hélice trincada são sinais ruins.',
  blender:'Teste motor, encaixe, copo, tampa e lâmina. Trinca no copo, vazamento no eixo ou cheiro de queimado podem matar a margem.',
  monitor:'Teste fundo branco/preto, pixels, brilho, entradas e fonte. Mancha, linha vertical, tela piscando ou HDMI intermitente podem eliminar a margem.',
  pressureWasher:'Teste pressão contínua, gatilho, mangueira, vazamentos e ruído da bomba. Oscilação forte de pressão ou bomba vazando pode sair caro.',
  coffeeCapsule:'Passe água e teste bomba, aquecimento, alavanca e vazamentos. Máquina sem pressão ou com vazamento interno pode exigir reparo caro.',
  tv:'Teste tela em fundo claro/escuro, HDMI, som, Wi‑Fi e controle. Linhas, manchas, backlight ruim ou painel trincado quase sempre destroem a margem.',
  console:'Teste HDMI, armazenamento, leitor quando houver, rede, aquecimento e controle. Bloqueio de conta, superaquecimento ou reparo malfeito são alertas.',
  iphone:'Antes de pagar: consulte todos os IMEIs, confirme que não há Bloqueio de Ativação/iCloud, teste Face ID ou Touch ID, bateria, câmeras, áudio, microfone, botões, carga, Wi‑Fi/Bluetooth, chip e Histórico de Peças e Serviço quando disponível.',
  android:'Consulte IMEI, remova a conta Google antes de pagar e teste tela, biometria, câmeras, carga, rede e bateria. AMOLED com burn-in e aparelho bloqueado são riscos.',
  speaker:'Teste Bluetooth, bateria, carregamento e som em volume alto. Distorção, bateria que cai rápido e falsificação são riscos principais.',
  notebook:'Teste tela, teclado, touchpad, USB, Wi‑Fi, bateria, carregador, SSD/HD e temperaturas. Dobradiça quebrada, BIOS bloqueada ou placa instável são riscos caros.',
  vacuum:'Teste sucção por alguns minutos, cabo, filtro e mangueira. Ruído de rolamento, cheiro de queimado ou motor fraco elevam o risco.',
  bike:'Confira procedência, quadro, soldas, rodas, freios, câmbio e folgas. Quadro trincado, roda muito empenada ou procedência duvidosa não entra.',
  printer:'Imprima uma página de teste. Verifique toner/cabeçote, puxada de papel e conectividade. Impressora que “liga mas não imprime” pode virar prejuízo.',
  stove:'Teste todas as bocas, forno, acendimento e registros. Vazamento de gás, ferrugem estrutural e porta de forno ruim são alertas.',
  washer:'Teste enchimento, lavagem, drenagem e centrifugação. Vazamento, rolamento ruidoso, painel falhando ou ferrugem estrutural podem eliminar a margem.',
  fridge:'Ligue e confirme refrigeração, vedação, compressor e ruído. Transporte e reparo de refrigeração precisam entrar na conta.',
  soundbar:'Teste HDMI/óptico, Bluetooth, todos os canais e subwoofer quando houver. Estalos, perda de conexão e fonte paralela são riscos.',
  powerTool:'Teste sob carga, bateria, carregador e folgas. Evite ferramenta com cheiro de queimado, bateria inchada ou procedência duvidosa.',
  pc:'Confirme configuração real, armazenamento, RAM, fonte e temperaturas. Teste estabilidade; GPU artefatando ou fonte genérica ruim são alertas.',
  freezer:'Teste refrigeração, termostato, vedação e compressor. Frete e reparo de refrigeração precisam caber na margem.',
  kitchenSmall:'Teste todas as funções, cabo, aquecimento/motor e acessórios. Evite cheiro de queimado, faísca ou peça estrutural quebrada.'
}

const signalByKind:Record<Kind,string>={
  microwave:'Procure exterior encardido, amarelado, foto escura, anúncio curto ou desapego. Isso pode ser recuperável; ferrugem interna e faiscamento não.',
  cooktop:'Gordura, trempes encardidas, foto ruim e mudança/desapego podem derrubar a percepção de valor. Vidro trincado ou vazamento não é oportunidade.',
  airfryer:'Gordura, cesto sujo e fotos ruins podem esconder um bom negócio. Funcionamento e antiaderente mandam na decisão.',
  controller:'Marcas de uso, sujeira e anúncio simples podem abrir margem. Drift ou controle paralelo precisam entrar como risco real.',
  drill:'Ferramenta suja de obra e sem caixa pode ser boa se motor, mandril e bateria estiverem saudáveis.',
  hair:'Priorize peça suja ou mal fotografada, mas com cabo íntegro e funcionamento comprovado.',
  fan:'Sujeira pesada e foto ruim são recuperáveis; motor ruim ou grade quebrada não.',
  blender:'Copo encardido e foto ruim podem baixar o preço. Só compre se motor e conjunto do copo estiverem íntegros.',
  monitor:'Procure modelos funcionais com base marcada, poeira ou anúncio simples. Defeito de tela não é “só estética”.',
  pressureWasher:'Mangueira suja, carcaça marcada e anúncio de desapego podem abrir margem. Pressão fraca e vazamento de bomba não.',
  coffeeCapsule:'Máquina parada e suja pode valer; peça vídeo extraindo água ou café antes de se deslocar.',
  tv:'Moldura riscada, sem controle ou foto ruim pode abrir margem. Qualquer defeito de painel exige cautela extrema.',
  console:'Procure kit funcional mal anunciado, com poeira, fotos fracas ou acessórios misturados. Teste tudo presencialmente antes de valorar.',
  iphone:'Carcaça marcada e foto ruim podem ser margem; preço muito abaixo do padrão exige checagem redobrada e nunca justifica ignorar IMEI ou iCloud.',
  android:'Carcaça marcada e película ruim podem baixar percepção; valide IMEI, tela e contas antes de negociar.',
  speaker:'Sem caixa, empoeirada ou com marcas externas pode ser boa. Bateria e originalidade precisam estar confirmadas.',
  notebook:'Carcaça riscada, bateria fraca e sujeira podem ser negociáveis. Placa, tela e dobradiça são muito mais críticos.',
  vacuum:'Filtro sujo e aparência ruim podem gerar desconto; motor fraco não.',
  bike:'Sujeira, pneus gastos e regulagem podem abrir margem; quadro e procedência precisam estar certos.',
  printer:'Anúncio barato só vale com página de teste legível. Falha de impressão não deve ser tratada como detalhe estético.',
  stove:'Gordura, grelhas encardidas e pintura externa cansada podem baixar preço; vazamento e estrutura podre não.',
  washer:'Sujeira, amarelado e pequenas marcas podem ser resolvidos. Ruído de rolamento e vazamento podem ficar caros.',
  fridge:'Aparência externa ruim pode melhorar muito com limpeza; compressor e refrigeração precisam estar bons.',
  soundbar:'Sem caixa e com poeira pode ser boa; áudio precisa estar limpo em todos os canais.',
  powerTool:'Procure ferramenta profissional mal apresentada, mas valide bateria, carregador e esforço real.',
  pc:'Gabinete feio pode esconder configuração útil; confirme peça por peça antes de valorar.',
  freezer:'Aparência externa pode ser recuperada; refrigeração precisa ser comprovada.',
  kitchenSmall:'Foto ruim, sujeira e falta de caixa podem abrir margem quando funcionamento e acessórios estão certos.'
}

const seeds:Array<[string,string,BriqueTierId,GiroPreferido,number,number,number,number,Kind,'muito-quente'|'quente',string]>=[
  ['micro100','Micro-ondas 18–20 L em oportunidade','ate100','rapido',100,170,60,100,'microwave','muito-quente','Compra de brique clássica: procura ampla, teste simples e forte ganho de apresentação com limpeza.'],
  ['cook100','Cooktop a gás 4 bocas em oportunidade','ate100','rapido',90,170,60,100,'cooktop','muito-quente','Compacto, fácil de transportar e pode ganhar bastante valor visual depois de uma limpeza boa.'],
  ['air100','Air fryer 3–4 L em oportunidade','ate100','rapido',100,170,70,100,'airfryer','muito-quente','Produto conhecido e com público grande; sujeira e apresentação ruim costumam abrir negociação.'],
  ['ds4100','Controle PS4 original em oportunidade','ate100','rapido',110,170,80,100,'controller','muito-quente','Original funcionando tem público claro; o segredo é comprar abaixo do anúncio e testar drift.'],
  ['drill100','Furadeira com fio de marca','ate100','rapido',100,170,70,100,'drill','quente','Ferramenta útil, fácil de demonstrar funcionando e com compradores domésticos e profissionais.'],
  ['taiff100','Secador Taiff / GA.MA em oportunidade','ate100','rapido',100,170,70,100,'hair','quente','Marca conhecida e ticket baixo ajudam no giro quando o aparelho está íntegro.'],
  ['fan100','Ventilador 40 cm funcionando','ate100','rapido',90,160,60,100,'fan','quente','Tem público amplo e pode ser valorizado com higienização; sazonalidade aumenta no calor.'],
  ['blender100','Liquidificador Arno / Oster / Mondial completo','ate100','rapido',80,150,50,100,'blender','quente','Baixo ticket, teste rápido e venda simples quando copo, tampa e lâmina estão completos.'],

  ['vac100','Aspirador compacto','ate100','medio',100,180,60,100,'vacuum','quente','Pode ter boa margem quando o problema é filtro sujo ou apresentação ruim, mas o motor precisa estar forte.'],
  ['nesp100','Dolce Gusto / cafeteira de cápsula em oportunidade','ate100','medio',110,180,70,100,'coffeeCapsule','quente','Tem boa percepção de valor, mas precisa de teste real de bomba e aquecimento.'],
  ['grill100','Sanduicheira / grill de marca','ate100','medio',70,140,45,90,'kitchenSmall','quente','Pequeno, fácil de limpar e bom para complementar caixa baixo.'],
  ['rice100','Panela elétrica de arroz','ate100','medio',90,160,60,100,'kitchenSmall','quente','Produto simples de testar e que melhora muito visualmente após higienização.'],
  ['speaker100','Caixa Bluetooth pequena original','ate100','medio',100,180,70,100,'speaker','quente','Boa se for original e a bateria estiver saudável; falsificação é o principal risco.'],
  ['monitor100','Monitor 17–19 pol. funcional','ate100','medio',100,170,70,100,'monitor','quente','Ainda atende caixa, escritório e computador básico; defeito de painel não compensa.'],
  ['tool100','Esmerilhadeira / serra pequena com fio','ate100','medio',100,180,70,100,'powerTool','quente','Ferramenta de marca pode vender bem, mas exige teste sob carga e procedência.'],
  ['coffee100','Cafeteira de filtro de marca','ate100','medio',80,150,50,100,'kitchenSmall','quente','Fácil de testar, limpar e fotografar; boa como oportunidade secundária.'],

  ['micro150','Micro-ondas 20–25 L funcional','100-150','rapido',140,230,100,150,'microwave','muito-quente','Faixa com bastante oferta; compre funcionamento, não aparência. Limpeza bem feita agrega bastante.'],
  ['cook150','Cooktop 4 bocas de marca','100-150','rapido',140,230,100,150,'cooktop','muito-quente','Boa relação entre tamanho, transporte e valor percebido.'],
  ['air150','Air fryer 3,5–5 L','100-150','rapido',140,230,100,150,'airfryer','muito-quente','Produto de procura ampla e fácil de mostrar funcionando.'],
  ['ds4150','Controle PS4 original testado','100-150','rapido',140,230,110,150,'controller','muito-quente','Original sem drift costuma ter saída; compre bem porque o mercado também tem muitos paralelos.'],
  ['monitor150','Monitor 19–22 pol. HDMI','100-150','rapido',150,240,110,150,'monitor','quente','Procura recorrente para home office, caixa e PC básico. HDMI ajuda.'],
  ['wap150','Lavadora de alta pressão em oportunidade','100-150','rapido',170,260,120,150,'pressureWasher','quente','Pode aparecer em desapego ou suja; se a bomba estiver boa, é um item com uso claro e fácil demonstração.'],
  ['drill150','Furadeira / parafusadeira de marca','100-150','rapido',150,240,110,150,'drill','quente','Marcas conhecidas e bateria boa ampliam muito o público.'],
  ['caps150','Nespresso / Dolce Gusto funcional','100-150','rapido',150,250,110,150,'coffeeCapsule','quente','Marca e praticidade ajudam no giro quando a máquina está limpa e testada.'],

  ['vac150','Aspirador WAP / Electrolux compacto','100-150','medio',150,260,100,150,'vacuum','quente','Boa oportunidade se estiver completo e o motor mantiver sucção forte.'],
  ['printer150','Impressora básica com teste de impressão','100-150','medio',160,280,100,150,'printer','quente','Pode girar para estudo e pequeno escritório, mas só com página de teste.'],
  ['stove150','Fogão 4 bocas simples em oportunidade','100-150','medio',180,300,120,150,'stove','quente','Mercado local existe, mas transporte e estado estrutural pesam.'],
  ['bike150','Bicicleta aro 26 simples','100-150','medio',170,300,120,150,'bike','quente','Lavagem e regulagem ajudam; procedência e quadro íntegro são obrigatórios.'],
  ['sound150','Soundbar básica em oportunidade','100-150','medio',170,280,120,150,'soundbar','quente','Pode valer quando está sem caixa ou mal anunciada; conectividade precisa ser testada.'],
  ['tool150','Kit de ferramentas de marca em oportunidade','100-150','medio',160,280,110,150,'powerTool','quente','Conjunto incompleto pode ficar barato, desde que as peças úteis estejam funcionando.'],
  ['rice150','Panela de pressão elétrica funcional','100-150','medio',150,260,100,150,'kitchenSmall','quente','Boa percepção de valor quando trava, vedação e painel estão bons.'],
  ['speaker150','JBL Go / Clip original em oportunidade','100-150','medio',150,260,110,150,'speaker','quente','Marca ajuda, mas originalidade e bateria precisam ser conferidas.'],

  ['tv250','TV 32 pol. não Smart funcionando','150-250','rapido',250,380,180,250,'tv','muito-quente','Tela boa e tamanho popular criam público amplo; sem controle pode ser negociável.'],
  ['x360250','Xbox 360 completo','150-250','rapido',250,380,180,250,'console','muito-quente','Console de entrada ainda tem público; kit com fonte, HDMI e controle facilita a revenda.'],
  ['ps3250','PS3 Slim em oportunidade','150-250','rapido',260,420,190,250,'console','muito-quente','Boa biblioteca e público conhecido; HDMI, leitor e aquecimento precisam estar bons.'],
  ['monitor250','Monitor 22–24 pol. Full HD / HDMI','150-250','rapido',250,380,180,250,'monitor','muito-quente','Faixa melhor para home office e games básicos; 22–24 pol. tem público bem maior que monitores pequenos.'],
  ['air250','Air fryer digital 5 L ou maior','150-250','rapido',250,380,180,250,'airfryer','quente','Maior capacidade e painel digital melhoram percepção de valor.'],
  ['wap250','Lavadora de alta pressão WAP / Electrolux / Philco','150-250','rapido',250,420,180,250,'pressureWasher','quente','Produto útil e demonstrável; compre só com pressão estável e acessórios principais.'],
  ['cordless250','Parafusadeira a bateria Bosch / Makita / DeWalt / B+D','150-250','rapido',260,430,190,250,'powerTool','quente','Marca e bateria saudável fazem muita diferença na liquidez.'],
  ['micro250','Micro-ondas 28–32 L de marca','150-250','rapido',250,400,180,250,'microwave','quente','Maior capacidade agrega valor; aparência externa pode ser recuperada, ferrugem interna não.'],

  ['bike250','Bicicleta aro 29 de entrada','150-250','medio',260,430,180,250,'bike','quente','Boa quando precisa só de limpeza e regulagem; revisão pesada pode consumir a margem.'],
  ['laser250','Impressora laser básica','150-250','medio',260,430,180,250,'printer','quente','Público de escritório e estudo existe, mas toner e fusor precisam entrar na conta.'],
  ['soundbar250','Soundbar de marca','150-250','medio',250,420,180,250,'soundbar','quente','Boa apresentação e subwoofer completo ajudam; teste todas as entradas.'],
  ['jbl250','JBL Flip antiga original','150-250','medio',250,420,180,250,'speaker','quente','Marca forte, mas falsificação e bateria cansada exigem atenção.'],
  ['stove250','Fogão 4 bocas em bom estado','150-250','medio',250,420,180,250,'stove','quente','Tem mercado local e valor percebido aumenta muito depois de limpeza pesada.'],
  ['washer250','Tanquinho 10–12 kg','150-250','medio',250,420,180,250,'washer','quente','Giro local razoável; timer, motor e vazamentos precisam ser testados.'],
  ['vac250','Aspirador WAP / Electrolux maior','150-250','medio',250,420,180,250,'vacuum','quente','Bom para limpeza doméstica e profissional; acessórios completos ajudam.'],
  ['toolset250','Combo de ferramentas domésticas','150-250','medio',260,450,180,250,'powerTool','quente','Compra boa quando o lote tem peças úteis e marca reconhecida.'],

  ['iphone7400','iPhone 7 / 7 Plus íntegro','250-400','rapido',300,500,250,400,'iphone','muito-quente','Entrada no ecossistema Apple; só vale com IMEI limpo, conta removida e funções testadas.'],
  ['iphone8400','iPhone 8 / 8 Plus íntegro','250-400','rapido',350,600,280,400,'iphone','muito-quente','Ainda tem procura por preço de entrada; bateria e Touch ID pesam muito no valor.'],
  ['smart32400','Smart TV 32 pol.','250-400','rapido',350,550,280,400,'tv','muito-quente','Tamanho popular, Wi‑Fi e apps ampliam o público; painel continua sendo o maior risco.'],
  ['ps3400','PS3 Slim completo','250-400','rapido',350,550,280,400,'console','quente','Kit completo e bem limpo melhora muito a revenda.'],
  ['x360400','Xbox 360 completo com jogos','250-400','rapido',330,520,260,400,'console','quente','Jogos e controle original ajudam; leitor e fonte precisam estar bons.'],
  ['monitor24400','Monitor 24 pol. Full HD / 75 Hz','250-400','rapido',350,550,280,400,'monitor','muito-quente','Formato atual para trabalho e setup básico; HDMI e base íntegra ajudam.'],
  ['android400','Samsung Galaxy A32/A52/A53 em oportunidade','250-400','rapido',350,650,280,400,'android','quente','Linha conhecida e público amplo; tela AMOLED e IMEI precisam ser conferidos.'],
  ['jbl400','JBL Flip / Charge antiga original','250-400','rapido',350,600,280,400,'speaker','quente','Marca forte e fácil demonstração; compre só com bateria e originalidade validadas.'],

  ['iphonex400','iPhone X / SE 2020 em oportunidade','250-400','medio',400,650,320,400,'iphone','quente','Pode surgir perto do caixa com detalhe estético; Face ID/Touch ID e peças precisam ser conferidos.'],
  ['notebook400','Notebook i3/i5 antigo com SSD','250-400','medio',400,650,300,400,'notebook','quente','SSD e 8 GB quando disponível ajudam bastante; bateria e dobradiça podem abrir negociação.'],
  ['bike400','Bicicleta aro 29 de marca de entrada','250-400','medio',400,650,300,400,'bike','quente','Boa quando precisa só de revisão leve e limpeza.'],
  ['stove400','Fogão 4–5 bocas de marca','250-400','medio',400,650,300,400,'stove','quente','Marca, forno íntegro e limpeza bem feita elevam valor percebido.'],
  ['sound400','Soundbar Samsung / LG / JBL de entrada','250-400','medio',400,650,300,400,'soundbar','quente','Boa compra se conectividade e subwoofer estiverem certos.'],
  ['printer400','Impressora laser Wi‑Fi','250-400','medio',400,650,300,400,'printer','quente','Tem público de escritório; toner e fusor são decisivos.'],
  ['washer400','Tanquinho premium / máquina simples em oportunidade','250-400','medio',400,700,300,400,'washer','quente','Pode ter boa diferença entre anúncio feio e produto higienizado, mas teste ciclo completo.'],
  ['tools400','Combo de ferramentas Bosch / Makita / DeWalt','250-400','medio',420,700,320,400,'powerTool','quente','Conjunto profissional tem público claro; bateria e carregador originais agregam.'],

  ['iphonex700','iPhone X / XR íntegro','400-700','rapido',550,850,450,700,'iphone','muito-quente','Faixa com procura ampla; Face ID, bateria, tela e procedência determinam o negócio.'],
  ['se700','iPhone SE 2020 íntegro','400-700','rapido',550,850,450,700,'iphone','muito-quente','Compacto e ainda atual para uso básico; Touch ID e bateria precisam estar bons.'],
  ['iphone11700','iPhone 11 em oportunidade','400-700','rapido',650,950,550,700,'iphone','muito-quente','Mercado muito ativo; preço baixo exige checagem redobrada de IMEI, iCloud e peças.'],
  ['xone700','Xbox One / One S em oportunidade','400-700','rapido',650,950,500,700,'console','muito-quente','Console conhecido e fácil de demonstrar; controle original ajuda muito.'],
  ['tv43700','Smart TV 43 pol. em oportunidade','400-700','rapido',650,950,500,700,'tv','muito-quente','Tamanho muito procurado para sala/quarto; painel é o maior risco.'],
  ['washer700','Máquina de lavar 10–12 kg funcional','400-700','rapido',550,900,450,700,'washer','quente','Demanda local forte e ticket bom; teste lavagem e centrifugação completas.'],
  ['fridge700','Geladeira 1 porta funcionando','400-700','rapido',550,900,450,700,'fridge','quente','Necessidade básica e mercado local amplo; frete e refrigeração entram na conta.'],
  ['notebook700','Notebook i5 antigo + SSD + 8 GB','400-700','rapido',650,950,500,700,'notebook','quente','Configuração útil para estudo e trabalho ainda tem público, desde que esteja estável.'],

  ['switch700','Nintendo Switch Lite em oportunidade','400-700','medio',700,950,550,700,'console','quente','Produto desejado, mas exige teste rigoroso de drift, tela, Wi‑Fi e carga.'],
  ['ps4fat700','PS4 Fat em oportunidade','400-700','medio',700,1000,550,700,'console','quente','Pode caber com negociação; aquecimento e histórico de manutenção importam muito.'],
  ['bike700','Bicicleta aro 29 de marca','400-700','medio',600,950,500,700,'bike','quente','Quadro e componentes definem valor; revisão precisa caber na margem.'],
  ['jbl700','JBL Charge / Extreme antiga original','400-700','medio',600,950,500,700,'speaker','quente','Boa marca, mas bateria e originalidade precisam ser 100% confirmadas.'],
  ['pc700','Desktop i5 de escritório + SSD','400-700','medio',600,950,500,700,'pc','quente','Pode girar para estudo e trabalho; confirme configuração real e fonte.'],
  ['tool700','Combo profissional de ferramentas','400-700','medio',650,1000,500,700,'powerTool','quente','Bom público profissional; bateria e carregador originais fazem diferença.'],
  ['freezer700','Freezer / cervejeira pequena em oportunidade','400-700','medio',650,1000,500,700,'freezer','quente','Ticket maior e giro mais local; compressor e transporte precisam ser considerados.'],
  ['sound700','Soundbar premium com subwoofer','400-700','medio',650,1000,500,700,'soundbar','quente','Boa percepção de valor, mas precisa estar completa e sem falhas de conexão.'],

  ['iphone111000','iPhone 11 64/128 GB íntegro','700mais','rapido',850,1300,700,1100,'iphone','muito-quente','Mercado muito ativo e produto conhecido; procedência e teste completo são obrigatórios.'],
  ['ps4slim1000','PS4 Slim 500 GB / 1 TB','700mais','rapido',950,1400,750,1100,'console','muito-quente','Kit com controle original e cabos tem público amplo; console silencioso e leitor bom ajudam.'],
  ['xones1000','Xbox One S','700mais','rapido',850,1300,700,1050,'console','muito-quente','Boa liquidez dentro de games quando está completo e testado.'],
  ['switch1000','Nintendo Switch Lite','700mais','rapido',850,1200,700,1000,'console','quente','Compacto e fácil de vender se estiver sem drift e com carregador.'],
  ['tv431000','Smart TV 43 pol.','700mais','rapido',850,1300,700,1050,'tv','muito-quente','Tamanho com público grande; painel perfeito é essencial.'],
  ['notebook1000','Notebook i5 8 GB + SSD','700mais','rapido',900,1400,700,1100,'notebook','muito-quente','Configuração útil para estudo e trabalho; SSD e bateria aceitável ajudam bastante.'],
  ['washer1000','Máquina de lavar 11–14 kg','700mais','rapido',850,1300,700,1050,'washer','quente','Necessidade doméstica, ticket bom e procura local; teste ciclo completo.'],
  ['fridge1000','Geladeira frost free em oportunidade','700mais','rapido',900,1500,700,1100,'fridge','quente','Produto necessário e com mercado local, mas refrigeração e transporte são críticos.'],

  ['iphone1281000','iPhone 11 128 GB bem conservado','700mais','medio',950,1500,800,1200,'iphone','muito-quente','Armazenamento maior ajuda na revenda; mantenha a mesma checagem rígida de procedência.'],
  ['ps4bundle1000','PS4 Slim 1 TB com jogos / 2 controles','700mais','medio',1100,1700,850,1200,'console','quente','Bundle aumenta valor percebido, mas só pague por acessórios realmente testados e originais.'],
  ['bike1000','Bicicleta aro 29 intermediária','700mais','medio',900,1500,700,1100,'bike','quente','Componentes e quadro definem valor; revisão cara pode consumir a margem.'],
  ['pcgamer1000','PC gamer de entrada','700mais','medio',1000,1600,800,1200,'pc','quente','Pode ter margem boa, mas exige validar GPU, fonte, temperaturas e configuração real.'],
  ['tools1000','Combo Bosch / Makita / DeWalt','700mais','medio',1000,1700,800,1200,'powerTool','quente','Conjunto profissional tem mercado, principalmente com baterias e carregadores originais.'],
  ['party1000','JBL PartyBox / Boombox antiga original','700mais','medio',1000,1700,800,1200,'speaker','quente','Marca forte, mas falsificação, bateria e alto-falantes cansados podem gerar prejuízo.'],
  ['freezer1000','Freezer horizontal pequeno','700mais','medio',900,1500,700,1100,'freezer','quente','Giro local e mais lento; compressor, vedação e frete precisam entrar na conta.'],
  ['galaxy1000','Samsung Galaxy S20/S21 ou A54 em oportunidade','700mais','medio',900,1500,700,1100,'android','quente','Boa alternativa a iPhone; IMEI, AMOLED, bateria e conta Google precisam ser verificados.']
]

function makeOpportunity(row:typeof seeds[number]):BriqueOpportunity{
  const [id,title,tier,giro,askMin,askMax,buyMin,buyMax,kind,heat,why]=row
  return {id,title,tier,giro,marketAsk:[askMin,askMax],targetBuy:[buyMin,buyMax],heat,why,risk:riskByKind[kind],signal:signalByKind[kind]}
}

export const briqueCatalog:BriqueOpportunity[]=seeds.map(makeOpportunity)
export const briqueCapitalPresets=[100,150,250,400,700,1000] as const

const tierLabel:Record<BriqueTierId,string>={
  ate100:'Até R$ 100',
  '100-150':'R$ 100–150',
  '150-250':'R$ 150–250',
  '250-400':'R$ 250–400',
  '400-700':'R$ 400–700',
  '700mais':'R$ 700+'
}

export function tierForCapital(capital:number):BriqueTierId{
  if(capital<=100)return 'ate100'
  if(capital<=150)return '100-150'
  if(capital<=250)return '150-250'
  if(capital<=400)return '250-400'
  if(capital<=700)return '400-700'
  return '700mais'
}

export function tierName(capital:number){return tierLabel[tierForCapital(capital)]}

export function opportunitiesFor(capital:number,giro:GiroPreferido){
  if(!Number.isFinite(capital)||capital<=0)return []
  const tier=tierForCapital(capital)
  return briqueCatalog.filter(item=>item.tier===tier&&item.giro===giro).slice(0,8)
}

export const catalogGuideNote='Tabela estratégica revisada do BRike Radar. As faixas são limites de garimpo e negociação definidos para cada nível de caixa; não são uma cotação ao vivo nem garantia de lucro ou prazo de venda. O anúncio real sempre deve passar pelo Analisar antes de qualquer pagamento.'
