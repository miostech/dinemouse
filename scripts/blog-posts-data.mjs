/** Dados para gerar artigos do blog (node scripts/generate-blog.mjs) */
export const EXISTING_INDEX = [
    {
        slug: 'como-conseguir-reserva-cinderellas-royal-table',
        title: "Como conseguir reserva no Cinderella's Royal Table",
        date: '2025-12-02',
        dateLabel: '2 de dezembro de 2025',
        excerpt:
            'O jantar dentro do castelo da Cinderela é um dos pedidos mais comuns - e um dos mais difíceis. Veja como funciona a janela de reserva, o que esperar do cardápio e estratégias realistas.',
    },
    {
        slug: 'como-reservar-restaurante-disney-rapido',
        title: 'Como reservar restaurante Disney rápido',
        date: '2026-01-18',
        dateLabel: '18 de janeiro de 2026',
        excerpt:
            'Do aplicativo My Disney Experience ao relógio no dia da abertura da janela: checklist para não perder tempo quando as mesas abrirem.',
    },
    {
        slug: 'por-que-nunca-tem-vaga-restaurantes-disney',
        title: 'Por que nunca tem vaga nos restaurantes da Disney',
        date: '2026-02-07',
        dateLabel: '7 de fevereiro de 2026',
        excerpt:
            'Capacidade limitada, procura altíssima e mesas que voltam o tempo todo. Entenda a lógica por trás da “falta de vaga”.',
    },
    {
        slug: 'melhores-restaurantes-disney-reserva',
        title: 'Melhores restaurantes Disney para colocar na lista de reserva',
        date: '2026-03-21',
        dateLabel: '21 de março de 2026',
        excerpt:
            'Personagens, assinatura, vista para fogos: como montar uma lista inteligente - e quais nomes costumam esgotar primeiro na Walt Disney World.',
    },
];

function S(h2, ...paragraphs) {
    return { h2, paragraphs };
}

export const NEW_POSTS = [
    {
        slug: 'como-conseguir-reserva-ultima-hora-disney',
        title: 'Como conseguir reserva de última hora na Disney',
        metaDesc:
            'Reserva de última hora na Disney: walk-up, lista no local, cancelamentos e alertas. Estratégias Walt Disney World.',
        keywords:
            'Disney dining reservations last minute, reserva última hora Disney, vagas canceladas Disney',
        excerpt: 'Cancelamentos, walk-up e ferramentas de alerta: onde ainda há chance quando a viagem está batendo na porta.',
        breadcrumb: 'Última hora',
        lead: 'Última hora na Walt Disney World não significa “impossível”: significa que você vai depender mais de cancelamentos, flexibilidade de horário e, em alguns locais, de fila presencial ou lista no restaurante - sempre conforme a política vigente da Disney.',
        related: ['usar-cancelamentos-vaga-disney', 'reserva-mesmo-dia-disney', 'como-encontrar-vagas-canceladas-disney'],
        sections: [
            S(
                'Por que o app mostra tudo cinza',
                'Muita gente já reservou com meses de antecedência. O inventário que sobra para a sua data pode ser zero até alguém cancelar ou o restaurante liberar horários extras.',
                'Por isso quem busca Disney dining reservations em cima da hora precisa combinar paciência com notificação rápida.'
            ),
            S(
                'Walk-up e listas no local',
                'Alguns restaurantes oferecem fila ou lista no dia; outros não. Isso muda por local e temporada - verifique no My Disney Experience no dia da visita.',
                'Nunca conte com walk-up para experiências muito pequenas (ex.: jantares com personagem no castelo).'
            ),
            S(
                'O papel dos alertas',
                'Serviços de alerta monitoram cancelamentos no sistema oficial. Quando uma mesa volta, quem reage rápido consegue clicar antes da próxima pessoa.',
                'O Dine Mouse faz esse papel com foco em viajantes de língua portuguesa e nos restaurantes mais disputados.'
            ),
        ],
    },
    {
        slug: 'restaurantes-disney-sem-reserva',
        title: 'Restaurantes Disney sem reserva: ainda dá pra entrar?',
        metaDesc:
            'Restaurantes Disney sem reserva prévia: quick service, walk-up onde existe, e table service sem booking. O que é realista em Orlando.',
        keywords: 'Disney restaurant without reservation, quick service Disney, walk up dining Disney',
        excerpt: 'Quick service, lounges e algumas exceções de table service: o que dá para comer sem booking com antecedência.',
        breadcrumb: 'Sem reserva',
        lead: 'Sim, dá para “entrar” na Disney sem Disney restaurant reservations para refeição - mas com limites claros: a maior parte dos restaurantes de mesa (table service) continua pedindo reserva, e os mais famosos raramente aceitam walk-up.',
        related: ['sistema-reservas-disney', 'restaurantes-mais-baratos-disney', 'como-reservar-restaurante-disney-rapido'],
        sections: [
            S(
                'Quick service e mercados',
                'Parques e Disney Springs têm opções de balcão e bandejão com boa qualidade; não precisam de reserva.',
                'São a base de quem não quer lidar com reserva nenhuma.'
            ),
            S(
                'Table service sem reserva',
                'Alguns restaurantes de mesa podem, em certos dias, atender walk-up ou lista virtual - não é garantia.',
                'Para experiências com personagem ou castelo, trate reserva como obrigatória.'
            ),
            S(
                'Lounges e bares',
                'Em vários hotéis há lounges com petiscos e bebidas; regras de idade e entrada seguem políticas da Disney.',
                'Podem ser um plano B romântico ou pós-parque.'
            ),
        ],
    },
    {
        slug: 'como-encontrar-vagas-canceladas-disney',
        title: 'Como encontrar vagas canceladas na Disney',
        metaDesc:
            'Vagas canceladas Disney: quando aparecem, como atualizar o app e por que alertas automáticos ajudam. Disney dining alerts.',
        keywords: 'Disney dining alerts, cancelled reservations Disney, vagas canceladas',
        excerpt: 'Cancelamentos devolvem mesas ao sistema o tempo todo; quem sabe onde olhar aumenta muito as chances.',
        breadcrumb: 'Cancelamentos',
        lead: 'Vagas canceladas na Disney não são sorteio: são mesas que voltam ao My Disney Experience quando outro hóspede altera o plano. Quem atualiza o app o dia todo até enxerga padrões; quem usa alerta reage no segundo em que a vaga aparece.',
        related: ['usar-cancelamentos-vaga-disney', 'por-que-nunca-tem-vaga-restaurantes-disney', 'melhor-horario-tentar-reservas-disney'],
        sections: [
            S(
                'Onde as canceladas aparecem',
                'No app oficial, na mesma busca de reserva que você já usa. Não há “site secreto” - há timing.',
                'Disney dining alerts de terceiros só notificam; a reserva continua sendo sua no app oficial.'
            ),
            S(
                'Horários mais comuns',
                'Muita gente cancela ao reorganizar o roteiro ou após mudança de voo; picos costumam coincidir com noites e fins de semana nos EUA - experimente também manhã cedo em Orlando.',
                'Combine com o artigo sobre melhor horário para tentar reservas.'
            ),
            S(
                'Evite erros',
                'Ter cartão recusado, grupo errado ou app desatualizado faz você perder a mesa que apareceu.',
                'Veja também erros que te impedem de conseguir reservas Disney.'
            ),
        ],
    },
    {
        slug: 'reserva-mesmo-dia-disney',
        title: 'Como conseguir reserva no mesmo dia na Disney',
        metaDesc:
            'Reserva mesmo dia na Disney: app, hotel Disney, e realisticamente onde ainda há chance. Same day dining Disney World.',
        keywords: 'same day Disney dining, reserva mesmo dia Disney, Disney dining day of',
        excerpt: 'Mesmo dia é difícil nos “blockbusters”, mas viável em vários table service com persistência e sorte.',
        breadcrumb: 'Mesmo dia',
        lead: 'Reserva no mesmo dia na Walt Disney World acontece - sobretudo em restaurantes com maior rotação e quando há cancelamentos de última hora. Nos locais mais icônicos, o realistico é ter plano B.',
        related: ['como-conseguir-reserva-ultima-hora-disney', 'melhor-horario-tentar-reservas-disney', 'dicas-reservas-disney'],
        sections: [
            S(
                'Comece cedo no dia',
                'Abra o My Disney Experience assim que acordar no fuso de Orlando; novas mesas podem surgir antes de ir ao parque.',
                'Quem fica só à noite para procurar reduz as chances.'
            ),
            S(
                'Concierge do hotel (se aplicável)',
                'Hóspedes Disney às vezes têm canais no hotel para ajudar com dining - políticas mudam; pergunte na recepção.',
                'Não substitui disponibilidade real no sistema.'
            ),
            S(
                'Alertas no mesmo dia',
                'O Dine Mouse pode monitorar o restaurante e a data que você já está vivendo em Orlando - útil quando o roteiro mudou em cima da hora.',
                'Combine com flexibilidade de parque e horário.'
            ),
        ],
    },
    {
        slug: 'porque-restaurantes-disney-esgotam-rapido',
        title: 'Por que os restaurantes da Disney esgotam tão rápido',
        metaDesc:
            'Por que restaurantes Disney esgotam rápido: capacidade, janela de 60 dias, picos de demanda. Complementa “nunca tem vaga”.',
        keywords: 'why Disney dining books fast, restaurantes Disney esgotam, Disney dining demand',
        excerpt: 'Matemática simples: poucas mesas por hora e muita gente no mesmo segundo em que a janela abre.',
        breadcrumb: 'Demanda',
        lead: 'Os restaurantes da Disney esgotam rápido pela junção de três fatores: capacidade física limitada, data única da sua visita competindo com o mundo inteiro, e abertura da janela de reserva concentrada em um instante.',
        related: ['por-que-nunca-tem-vaga-restaurantes-disney', 'quantos-dias-abre-reserva-disney', 'sistema-reservas-disney'],
        sections: [
            S(
                'Capacidade fixa',
                'Cada turno tem número máximo de lugares; experiências com personagem ainda reduzem rotatividade.',
                'Não há “modo festival” que dobre mesas na mesma cozinha.'
            ),
            S(
                'Picos simultâneos',
                'Na abertura da janela, milhares de contas tentam os mesmos horários nos mesmos nomes famosos.',
                'Segundos de atraso no app podem significar só horário 22h30 ou “não disponível”.'
            ),
            S(
                'Por que alertas ajudam depois da abertura',
                'Depois do pico inicial, a disputa vira corrida por cancelamentos.',
                'É o terreno natural de Disney dining alerts bem configurados.'
            ),
        ],
    },
    {
        slug: 'reserva-be-our-guest-restaurant',
        title: 'Como conseguir reserva no Be Our Guest Restaurant',
        metaDesc:
            'Be Our Guest Restaurant Magic Kingdom: como reservar, refeições do dia e concorrência. Disney restaurant reservations.',
        keywords: 'Be Our Guest reservation, Be Our Guest Disney dining, reserva Be Our Guest',
        excerpt: 'O castelo da Bela e a Fera no Magic Kingdom: estratégia de horário e o que esperar da experiência.',
        breadcrumb: 'Be Our Guest',
        lead: 'O Be Our Guest é um dos restaurantes mais fotografados da Disney em Orlando: salões temáticos no Magic Kingdom e forte demanda em horários de almoço e jantar. Trate como prioridade na sua lista de Disney dining reservations.',
        related: ['melhores-restaurantes-disney-reserva', 'como-reservar-restaurante-disney-rapido', 'restaurantes-mais-dificeis-reservar-disney'],
        sections: [
            S(
                'Quando tentar reservar',
                'Use a mesma janela oficial (cerca de 60 dias antes, conforme regras atuais) e o horário de Orlando.',
                'Flexibilidade entre almoço e jantar aumenta opções.'
            ),
            S(
                'O que esperar',
                'Ambiente é o grande espetáculo; cardápio e preços seguem o que a Disney publicar na época da viagem.',
                'Crianças costumam amar o cenário das salas.'
            ),
            S(
                'Se não aparecer vaga',
                'Monitore cancelamentos nos dias seguintes ou use alertas para o intervalo de datas da viagem.',
                'Combine com visita a outros table service do Magic Kingdom como plano B.'
            ),
        ],
    },
    {
        slug: 'vale-pena-cinderellas-royal-table',
        title: "Vale a pena o Cinderella's Royal Table?",
        metaDesc:
            "Vale a pena CRT? Preço, personagens, tempo no Magic Kingdom e alternativas. Cinderella's Royal Table review em contexto.",
        keywords: "Cinderella's Royal Table worth it, CRT Disney review, vale a pena CRT",
        excerpt: 'Equilíbrio entre custo, magia para crianças e oportunidade de mesa - sem romantizar a dificuldade de reserva.',
        breadcrumb: 'CRT vale a pena',
        lead: "Vale a pena o Cinderella's Royal Table se a combinação castelo + personagens princesas + ‘efeito wow’ for prioridade da família e o orçamento absorver um table service premium. Se o foco é só comer bem, há assinaturas no resort com outro perfil.",
        related: ['como-conseguir-reserva-cinderellas-royal-table', 'melhores-restaurantes-disney-criancas', 'top-10-restaurantes-disney-orlando'],
        sections: [
            S(
                'Para quem brilha mais',
                'Crianças na fase de princesas e quem sonha com foto no castelo tendem a achar o investimento emocionalmente justo.',
                'Grupos só de adultos podem preferir outro tipo de assinatura.'
            ),
            S(
                'Custos e política',
                'Preços e exigência de pagamento antecipado mudam; leia no ato da reserva oficial.',
                'Considere também o tempo dentro do parque no dia do Magic Kingdom.'
            ),
            S(
                'Alternativas',
                'Outros character dining fora do castelo podem entregar encontros com personagens com concorrência diferente.',
                'Use a lista de melhores restaurantes para crianças como guia.'
            ),
        ],
    },
    {
        slug: 'reservar-space-220-restaurant',
        title: 'Como reservar o Space 220 Restaurant',
        metaDesc:
            'Space 220 Epcot: reservas, lounge vs jantar e dicas de horário. Space 220 Disney dining reservations.',
        keywords: 'Space 220 reservation, Space 220 Disney dining, reserva Space 220',
        excerpt: 'Experiência imersiva no Epcot: entenda opções de lounge e refeição completa e como disputar horário.',
        breadcrumb: 'Space 220',
        lead: 'O Space 220, no Epcot, divide atenção entre experiência de “jantar no espaço” e alta demanda por mesas com vista para a “órbita”. Como outros hits da Disney em Orlando, exige reserva cedo ou monitoramento de cancelamentos.',
        related: ['restaurantes-mais-dificeis-reservar-disney', 'como-reservar-restaurante-disney-rapido', 'melhores-restaurantes-disney-reserva'],
        sections: [
            S(
                'Lounge x dining',
                'A Disney já operou lounge e salão com regras diferentes; confira no app o que está disponível na sua data.',
                'Flexibilidade entre os dois aumenta chance de encaixar algo.'
            ),
            S(
                'Estratégia de reserva',
                'Entre na janela oficial com grupo e cartão corretos; tenha segundo horário no mesmo dia em outro restaurante do World Showcase.',
                'Quem insiste só no Space 220 sem plano B sofre mais.'
            ),
            S(
                'Cancelamentos',
                'Mesas voltam; alertas ajudam porque a fila de olhos humanos no refresh não escala.',
                'O Dine Mouse monitora restaurantes selecionados pelo cliente.'
            ),
        ],
    },
    {
        slug: 'melhores-horarios-reservar-ohana-disney',
        title: 'Melhores horários para reservar o Ohana Disney',
        metaDesc:
            "'Ohana Disney's Polynesian: café da manhã com personagens vs jantar, horários para fogos e reserva. Best time Ohana reservation.",
        keywords: "Ohana reservation best time, Ohana Disney dining, reserva Ohana horário",
        excerpt: "Polynesian Resort: como escolher slot entre personagens, pôr do sol e Magic Kingdom ao fundo.",
        breadcrumb: 'Ohana',
        lead: "O 'Ohana no Disney's Polynesian Village Resort alterna perfis de refeição (café com personagens é diferente do jantar clássico). O melhor horário depende do que você quer: personagens, vista, ou voltar cedo do parque.",
        related: ['melhores-restaurantes-disney-reserva', 'reservar-disney-feriados', 'dicas-reservas-disney'],
        sections: [
            S(
                'Café com personagens',
                'Costuma ser altamente concorrido; trate como prioridade no dia da abertura da janela.',
                'Chegue com flexibilidade de 15 em 15 minutos no app.'
            ),
            S(
                'Jantar e fogos',
                'Quem quer alinhar com fogos do Magic Kingdom precisa conferir o horário do show na época da viagem e escolher slot com folga.',
                'Políticas de transporte e saída do parque mudam; planeje deslocamento.'
            ),
            S(
                'Se não achou o horário ideal',
                'Monitore cancelamentos na semana anterior à viagem; mudanças de plano liberam mesas.',
                'Combine com alertas para o Polynesian e datas exatas.'
            ),
        ],
    },
    {
        slug: 'review-chef-mickeys',
        title: "Review completo do Chef Mickey's",
        metaDesc:
            "Chef Mickey's Contemporary: personagens, buffet, barulho, preço e para quem vale. Review Chef Mickeys Disney.",
        keywords: "Chef Mickey's review, Chef Mickey's Disney dining, review Chef Mickey",
        excerpt: 'Personagens clássicos no Contemporary: o que esperar do buffet, do clima familiar e da logística de reserva.',
        breadcrumb: 'Chef Mickeys',
        lead: "O Chef Mickey's é o café da manhã/jantar com Mickey e amigos no topo do resort Contemporary - barulho alto, crianças felizes e fila de autógrafos embutida no preço do buffet. É experiência, não jantar intimista.",
        related: ['melhores-restaurantes-disney-criancas', 'top-10-restaurantes-disney-orlando', 'como-conseguir-reserva-cinderellas-royal-table'],
        sections: [
            S(
                'Ambiente',
                'Salão amplo, ritmo acelerado e música; ideal para famílias que querem “ver os quatro” sem ir parque.',
                'Casais que buscam silêncio podem preferir outro character meal.'
            ),
            S(
                'Comida',
                'Buffet com itens que agradam crianças e opções clássicas americanas; não espere menu assinatura de chef fino.',
                'Qualidade é “parque Disney”, não restaurante estrelado.'
            ),
            S(
                'Reserva e logística',
                'Reserve cedo; combine com monorail do Magic Kingdom ou dia off do parque.',
                'Cancelamentos aparecem - vale alerta se a data for flexível.'
            ),
        ],
    },
    {
        slug: 'top-10-restaurantes-disney-orlando',
        title: 'Top 10 restaurantes da Disney em Orlando',
        metaDesc:
            'Top 10 restaurantes Disney Orlando: lista por tipo (personagem, assinatura, tema) - subjetiva e útil para priorizar reservas.',
        keywords: 'best Disney restaurants Orlando, top Disney dining, melhores restaurantes Disney',
        excerpt: 'Uma lista honesta por categorias - não existe um único ranking absoluto, mas há nomes que sempre lideram listas de viajantes.',
        breadcrumb: 'Top 10',
        lead: 'Qualquer “top 10” da Disney em Orlando é subjetivo: depende de orçamento, idade das crianças e se você prefere personagem, vista ou alta cozinha. Abaixo está uma lista equilibrada de nomes que aparecem com frequência em roteiros exigentes - todos sujeitos à sua própria prova no cardápio oficial.',
        related: ['melhores-restaurantes-disney-reserva', 'restaurantes-mais-dificeis-reservar-disney', 'melhores-restaurantes-disney-criancas'],
        sections: [
            S(
                'Como lemos esta lista',
                'Misturamos Magic Kingdom, Epcot, resorts e Hollywood Studios; não é só um parque.',
                'Use como ponto de partida para Disney restaurant reservations, não como dogma.'
            ),
            S(
                'Nomes que costumam aparecer',
                "Cinderella's Royal Table, Be Our Guest, Space 220, California Grill, 'Ohana, Chef Mickey's, Topolino's Terrace, Tusker House, Sci-Fi Dine-In, Garden Grill - sujeito a mudança de gosto pessoal.",
                'Confirme sempre disponibilidade e cardápio no app oficial.'
            ),
            S(
                'Próximo passo',
                'Depois de escolher 3 favoritos, leia dicas para conseguir reservas e erros comuns.',
                'O Dine Mouse ajuda nos mais disputados com alertas e concierge.'
            ),
        ],
    },
    {
        slug: 'melhores-restaurantes-disney-criancas',
        title: 'Melhores restaurantes da Disney para crianças',
        metaDesc:
            'Restaurantes Disney para crianças: personagens, cardápio amigável e menos fila de autógrafo no parque.',
        keywords: 'best Disney restaurants for kids, restaurantes Disney crianças, character dining kids',
        excerpt: 'Character meals e ambientes temáticos que seguram a atenção dos pequenos enquanto os adultos comem.',
        breadcrumb: 'Crianças',
        lead: 'Os melhores restaurantes da Disney para crianças costumam ser os que combinam personagens, cardápio acessível e um “show” visual - castelo, naves espaciais ou nada de “mesa quieta”.',
        related: ['review-chef-mickeys', 'reserva-be-our-guest-restaurant', 'top-10-restaurantes-disney-orlando'],
        sections: [
            S(
                'Character dining',
                'Tusker House, Chef Mickey’s, Topolino’s (café), Cinderella’s Royal Table - cada um com estilo diferente.',
                'Reserve com antecedência; filas de personagem no parque são outro jogo.'
            ),
            S(
                'Temáticos sem personagem',
                'Sci-Fi, Coral Reef (se aberto), ambientes “cartoon” agradam sem necessidade de princesa.',
                'Útil quando o foco é diversão visual, não autógrafo.'
            ),
            S(
                'Dicas práticas',
                'Reserve no horário em que a criança está descansada; leve lanche de backup se o apetite oscilar.',
                'Veja erros que te impedem de conseguir reservas Disney para não perder a mesa.'
            ),
        ],
    },
    {
        slug: 'restaurantes-mais-dificeis-reservar-disney',
        title: 'Restaurantes mais difíceis de reservar na Disney',
        metaDesc:
            'Restaurantes mais difíceis Disney: CRT, Space 220, Topolinos, Victoria e outras mesas que somem na abertura da janela.',
        keywords: 'hardest Disney dining reservations, restaurantes difíceis Disney',
        excerpt: 'Lista dos nomes que exigem dedicação na janela de 60 dias ou monitoramento de cancelamento.',
        breadcrumb: 'Mais difíceis',
        lead: 'Os restaurantes mais difíceis de reservar na Disney em Orlando mudam um pouco com temporada, mas sempre incluem castelo, cafés com personagens “queridinhos” e experiências com capacidade minúscula. Trate-os como sprint no dia da reserva.',
        related: ['como-conseguir-reserva-cinderellas-royal-table', 'reservar-space-220-restaurant', 'dicas-reservas-disney'],
        sections: [
            S(
                'Por que alguns são extremos',
                'Poucas mesas + alta foto no Instagram + personagens = receita de esgotamento instantâneo.',
                'Quem não usa alerta depende de sorte no refresh.'
            ),
            S(
                'Nomes que costumam liderar listas',
                "Cinderella's Royal Table, Space 220 (quando muito procurado), Topolino's breakfast, Victoria & Albert's (quando operando no esquema de reserva), Chef Mickey's em pico.",
                'Sempre confirme no app o que está ativo na sua data.'
            ),
            S(
                'Estratégia',
                'Priorize um por dia de abertura de janela; não tente oito “impossíveis” no mesmo minuto.',
                'O Dine Mouse foi pensado para esses casos.'
            ),
        ],
    },
    {
        slug: 'restaurantes-mais-baratos-disney',
        title: 'Restaurantes mais baratos da Disney',
        metaDesc:
            'Comer Disney mais barato: quick service, snacks, refeições em hotéis e como equilibrar table service sem estourar orçamento.',
        keywords: 'cheap Disney dining, restaurantes baratos Disney, budget Disney food',
        excerpt: 'Quick service, mercados e escolhas de cardápio: onde o preço por pessoa costuma ser mais amigável.',
        breadcrumb: 'Orçamento',
        lead: 'Os restaurantes “mais baratos” na Disney costumam ser quick service, mercados de resort e algumas opções em Disney Springs - não jantares com personagem. Table service quase sempre carrega taxa de serviço e preço de experiência.',
        related: ['restaurantes-disney-sem-reserva', 'top-10-restaurantes-disney-orlando', 'sistema-reservas-disney'],
        sections: [
            S(
                'Quick service nos parques',
                'Satu’li, Les Halles (Epcot), vários balcões no Animal Kingdom - bons exemplos de custo-benefício por volume.',
                'Preços mudam; veja cardápio com preço no app.'
            ),
            S(
                'Mercados de hotel',
                'Sanduíches, frutas e refeições pré-embaladas ajudam dias inteiros de parque.',
                'Leve garrafa reutilizável e use estações de refill de água onde o parque permitir.'
            ),
            S(
                'Table service mais contido',
                'Almoço em vez de jantar, evitar buffet todo dia, e escolher restaurante fora dos “blockbusters” reduz conta.',
                'Românticos e assinaturas ficam para um ou dois noites especiais.'
            ),
        ],
    },
    {
        slug: 'restaurantes-romanticos-disney',
        title: 'Restaurantes românticos na Disney',
        metaDesc:
            'Jantar romântico Disney: California Grill, Monsieur Paul (se disponível), rooftops e mesas com vista. Disney date night dining.',
        keywords: 'romantic Disney restaurants, jantar romântico Disney, Disney date night',
        excerpt: 'Vista, luz baixa e cardápio adulto: sugestões para casais sem personagem no centro da mesa.',
        breadcrumb: 'Romântico',
        lead: 'Restaurantes românticos na Disney em Orlando costumam combinar vista (lago, fogos, skyline), cardápio adulto e menos “show” infantil. Reserve com folga e confirme dress code se existir.',
        related: ['melhores-restaurantes-disney-reserva', 'restaurantes-mais-baratos-disney', 'top-10-restaurantes-disney-orlando'],
        sections: [
            S(
                'Clássicos citados por casais',
                'California Grill no Contemporary, jantares no topo do World Showcase com janela boa, experiências assinadas quando abertas.',
                'Personagens raramente são o foco aqui.'
            ),
            S(
                'Disney Springs',
                'Há steakhouses e cozinhas internacionais fora dos parques - útil em dia sem ingresso.',
                'Estacionamento e transporte devem entrar no plano.'
            ),
            S(
                'Reserva',
                'Peça mesa para dois, horário após pôr do sol e evite horário de pico de famílias se buscar silêncio relativo.',
                'Alertas ajudam nos rooftops disputados.'
            ),
        ],
    },
    {
        slug: 'sistema-reservas-disney',
        title: 'Como funciona o sistema de reservas da Disney',
        metaDesc:
            'Sistema de reservas Disney: My Disney Experience, 60 dias, cartão, cancelamento e diferença quick vs table service.',
        keywords: 'how Disney dining reservations work, sistema reservas Disney, My Disney Experience dining',
        excerpt: 'O básico que todo mundo precisa antes de brigar com o app: janela, garantia e onde tudo acontece oficialmente.',
        breadcrumb: 'Sistema',
        lead: 'O sistema de reservas da Disney para refeições roda dentro do ecossistema My Disney Experience: você escolhe data, parque ou resort, número de pessoas e horário. Não existe atalho paralegal “VIP” fora do app - serviços como o Dine Mouse ajudam a reagir quando o sistema libera ou devolve mesas.',
        related: ['quantos-dias-abre-reserva-disney', 'dicas-reservas-disney', 'erros-impedem-reservas-disney'],
        sections: [
            S(
                'Table service vs quick service',
                'Table service pede reserva na maioria dos casos; quick service é fila/balcão sem booking.',
                'Lounges e bares têm regras próprias.'
            ),
            S(
                'Pagamento e garantia',
                'Vários restaurantes exigem cartão para segurar a reserva ou pré-pagamento; leia a política de cancelamento.',
                'No-show pode gerar cobrança.'
            ),
            S(
                'Onde o Dine Mouse entra',
                'Nós não “furamos fila”: monitoramos disponibilidade e avisamos ou reservamos dentro das regras, conforme o plano.',
                'Ideal para quem não mora no fuso de Orlando.'
            ),
        ],
    },
    {
        slug: 'quantos-dias-abre-reserva-disney',
        title: 'Quantos dias antes abre reserva na Disney',
        metaDesc:
            'Janela de reserva Disney (~60 dias), hóspedes hotel Disney e regras atuais. Sempre confirme no site oficial.',
        keywords: 'how many days before Disney dining reservations, 60 day Disney dining, quantos dias reserva Disney',
        excerpt: 'A famosa janela móvel e o que muda se você dorme em hotel Disney - com o aviso de sempre checar a fonte oficial.',
        breadcrumb: '60 dias',
        lead: 'Na Walt Disney World, a reserva de restaurantes costuma abrir numa janela em torno de 60 dias antes do dia da visita (e hóspedes de hotel Disney podem ter vantagem em certas reservas ao longo da estadia - regra sujeita a alteração). Este artigo não substitui o comunicado oficial do dia; use-o como mapa mental.',
        related: ['sistema-reservas-disney', 'como-reservar-restaurante-disney-rapido', 'reservar-disney-feriados'],
        sections: [
            S(
                'Por que “60 dias” vira obsessão',
                'É o momento em que a maior parte das mesas entra no sistema para a sua data; a concorrência é máxima.',
                'Fuso horário de Orlando define quando você clica no Brasil.'
            ),
            S(
                'Hóspedes Disney',
                'Em períodos específicos, a Disney permite reservar vários dias da estadia a partir de um único marco - política muda; confira no help center.',
                'Quem fica fora do resort segue a regra geral por dia corrido.'
            ),
            S(
                'Depois dos 60 dias',
                'Ainda há mesas: cancelamentos, ajustes operacionais e dias “mortos” na semana liberam horários.',
                'Leia como usar cancelamentos para conseguir vaga.'
            ),
        ],
    },
    {
        slug: 'dicas-reservas-disney',
        title: 'Dicas para conseguir reservas na Disney',
        metaDesc:
            'Dicas reservas Disney: prioridade, flexibilidade, app atualizado, grupo certo e alertas. Disney dining tips Portuguese.',
        keywords: 'Disney dining tips, dicas reserva restaurante Disney, how to get Disney reservations tips',
        excerpt: 'Checklist mental antes da janela e depois dela - o que separa quem só reclama de quem de fato senta.',
        breadcrumb: 'Dicas',
        lead: 'Dicas para conseguir reservas na Disney se resumem a: preparar o app, reduzir expectativa de horário perfeito, ter plano B no mesmo parque e usar cancelamentos a seu favor com alertas ou paciência extrema no refresh.',
        related: ['erros-impedem-reservas-disney', 'como-reservar-restaurante-disney-rapido', 'melhor-horario-tentar-reservas-disney'],
        sections: [
            S(
                'Antes do dia da janela',
                'Login testado, cartão válido, grupo com idades certas, lista dos três restaurantes sonho.',
                'Durma pouco na véspera se estiver no Brasil competindo com Orlando de manhã.'
            ),
            S(
                'No minuto zero',
                'Entre direto no primeiro restaurante da lista; não navegue por fotos bonitas.',
                'Se travar, reinicie o fluxo sem mudar de estratégia a cada 10 segundos.'
            ),
            S(
                'Depois da janela',
                'Persistência semanal até a viagem; alertas para CRT, Space 220, Topolinos etc.',
                'O Dine Mouse existe para automatizar essa fase.'
            ),
        ],
    },
    {
        slug: 'erros-impedem-reservas-disney',
        title: 'Erros que te impedem de conseguir reservas Disney',
        metaDesc:
            'Erros comuns: grupo errado, app deslogado, cartão recusado, fuso errado e hesitação. Disney dining mistakes.',
        keywords: 'Disney dining reservation mistakes, erros reserva Disney',
        excerpt: 'Os detalhes bobos que fazem você perder a mesa em dez segundos - mesmo quando ela aparece.',
        breadcrumb: 'Erros',
        lead: 'Erros que impedem reservas Disney são quase sempre operacionais: app desatualizado, criança fora da contagem do grupo, cartão que não passa na garantia, ou clicar cinco minutos depois do horário de abertura porque o relógio estava no fuso errado.',
        related: ['dicas-reservas-disney', 'como-reservar-restaurante-disney-rapido', 'sistema-reservas-disney'],
        sections: [
            S(
                'Fuso e alarme',
                'Confundir BRT com horário de Orlando é o erro número um de brasileiros.',
                'Use dois relógios lado a lado na semana da reserva.'
            ),
            S(
                'Dados do grupo',
                'Bebê precisa entrar na mesa? Conta. Adolescente conta como adulto no buffet? Confirme regras do restaurante.',
                'Corrigir depois pode ser impossível em datas lotadas.'
            ),
            S(
                'Pagamento',
                'Cartão internacional bloqueado, limite baixo ou CEP errado travam a finalização.',
                'Teste uma compra pequena ou cadastro antes do dia D.'
            ),
        ],
    },
    {
        slug: 'reserva-disney-dezembro',
        title: 'Como conseguir reserva Disney em dezembro',
        metaDesc:
            'Dezembro na Disney: Natal, crowd alto, dining esgotando cedo. Dicas para reservas em peak season.',
        keywords: 'Disney dining December, reserva Disney dezembro, Christmas Disney dining',
        excerpt: 'Natal e Ano-Novo em Orlando: ajuste de expectativa e quando dobrar esforço no app.',
        breadcrumb: 'Dezembro',
        lead: 'Dezembro na Disney é alta temporada absoluta: parques cheios, hotéis lotados e Disney dining reservations somindo mais rápido que a média do ano. Quem viaja nesse mês precisa de plano A/B/C e, em muitos casos, alertas desde o primeiro dia de janela.',
        related: ['reservar-disney-feriados', 'restaurantes-mais-dificeis-reservar-disney', 'dicas-reservas-disney'],
        sections: [
            S(
                'Por que dezembro é outro patamar',
                'Escolas de férias nos EUA + clima + decorações natalinas = mais gente disputando as mesmas mesas.',
                'Horários “bons” somem primeiro.'
            ),
            S(
                'Estratégia',
                'Reserve o máximo possível na primeira janela; flexibilize parques e horários.',
                'Considere jantar em resort em dia de parque lotado para respirar.'
            ),
            S(
                'Cancelamentos',
                'Ainda existem, mas a fila de quem espera é maior; velocidade importa mais.',
                'O Dine Mouse ajuda a reagir rápido com alertas.'
            ),
        ],
    },
    {
        slug: 'reservar-disney-feriados',
        title: 'Como reservar restaurante Disney em feriados',
        metaDesc:
            'Feriados US e Brasil na Disney: Memorial Day, Thanksgiving, 4 de Julho e picos. Reservas restaurante Disney feriado.',
        keywords: 'Disney dining holidays, reserva Disney feriado, peak season Disney dining',
        excerpt: 'Feriados americanos mudam o mapa de multidão - e a velocidade em que as mesas somem.',
        breadcrumb: 'Feriados',
        lead: 'Reservar restaurante Disney em feriados nos EUA (Thanksgiving, Memorial Day, 4 de Julho, etc.) exige a mesma disciplina de dezembro: abrir a janela no segundo certo e aceitar horários menos “instagramáveis”.',
        related: ['reserva-disney-dezembro', 'melhor-horario-tentar-reservas-disney', 'porque-restaurantes-disney-esgotam-rapido'],
        sections: [
            S(
                'Calendário americano',
                'Feriados locais nem sempre coincidem com feriados brasileiros; use calendário escolar dos EUA como proxy de crowd.',
                'Thanksgiving e Natal costumam ser extremos.'
            ),
            S(
                'Estratégia de reserva',
                'Priorize um restaurante “âncora” por dia de parque; espalhar oito desejos no mesmo minuto não funciona.',
                'Tenha quick service de backup no mesmo parque.'
            ),
            S(
                'Depois da abertura',
                'Alertas e mudanças de plano de outros hóspedes continuam valendo.',
                'O Dine Mouse monitora conforme os restaurantes que você escolher.'
            ),
        ],
    },
    {
        slug: 'melhor-horario-tentar-reservas-disney',
        title: 'Melhor horário para tentar reservas Disney',
        metaDesc:
            'Que horas tentar reserva Disney: abertura oficial, madrugada em Orlando e picos de cancelamento. Best time refresh Disney dining.',
        keywords: 'best time to book Disney dining, melhor horário reserva Disney',
        excerpt: 'Abertura da janela é sagrada; depois dela, há padrões de cancelamento que vale testar.',
        breadcrumb: 'Horário',
        lead: 'O melhor horário para tentar reservas Disney é, sem surpresa, o instante oficial em que a janela abre para a sua data - em horário de Orlando. Depois disso, os melhores “segundos melhores” costumam ser manhã cedo em Orlando e noites após mudanças de roteiro de outros hóspedes.',
        related: ['como-encontrar-vagas-canceladas-disney', 'usar-cancelamentos-vaga-disney', 'dicas-reservas-disney'],
        sections: [
            S(
                'Abertura da janela',
                'Configure dois alarmes e internet estável; teste login na véspera.',
                'Quem está no Brasil compete com sono - planeje.'
            ),
            S(
                'Cancelamentos',
                'Experimente atualizar o app antes de dormir e ao acordar no fuso da viagem.',
                'Mudanças de voo de terceiros liberam mesas em blocos estranhos.'
            ),
            S(
                'Automatizar',
                'Refresh humano 24/7 não escala; por isso existem Disney dining alerts e o Dine Mouse.',
                'Escolha o restaurante e o intervalo de datas com cuidado.'
            ),
        ],
    },
    {
        slug: 'usar-cancelamentos-vaga-disney',
        title: 'Como usar cancelamentos para conseguir vaga Disney',
        metaDesc:
            'Cancelamentos Disney: padrões, paciência e alertas. Como transformar no-show dos outros na sua mesa.',
        keywords: 'Disney cancelled reservations strategy, cancelamentos vaga Disney, snag Disney dining',
        excerpt: 'A mesa que sumiu no seu dia pode ser a que outro acabou de devolver - estratégia e ferramentas.',
        breadcrumb: 'Cancelamentos',
        lead: 'Usar cancelamentos para conseguir vaga na Disney é jogar no mesmo estoque público do My Disney Experience: quando alguém desiste, a mesa reaparece para qualquer conta rápida o suficiente. Por isso cancelamento + alerta é combinação comum entre viajantes experientes.',
        related: ['como-encontrar-vagas-canceladas-disney', 'melhor-horario-tentar-reservas-disney', 'como-conseguir-reserva-ultima-hora-disney'],
        sections: [
            S(
                'Mentalidade',
                'Não é “hack” ilegal: é disponibilidade legítima que volta ao inventário.',
                'Quem desiste ganha flexibilidade; quem observa ganha chance.'
            ),
            S(
                'Rotina manual',
                'Atualize o app em blocos de horário fixos para não enlouquecer.',
                'Funciona, mas cansa em viagem longa.'
            ),
            S(
                'Rotina com alerta',
                'Você recebe aviso e entra para confirmar no app oficial.',
                'O Dine Mouse envia alertas por e-mail ou WhatsApp, conforme plano.'
            ),
        ],
    },
    {
        slug: 'mousedining-vale-a-pena',
        title: 'MouseDining vale a pena?',
        metaDesc:
            'MouseDining vale a pena? O que serviços de alerta fazem, limitações e alternativas em português (Dine Mouse). Comparação informativa.',
        keywords: 'MouseDining worth it, MouseDining alternative, Disney dining alert service',
        excerpt: 'Critérios honestos: frequência de viagem, orçamento e se você precisa de suporte em português com concierge.',
        breadcrumb: 'MouseDining',
        lead: 'MouseDining é um dos nomes conhecidos no mercado de alertas e buscas por disponibilidade em restaurantes da Disney nos EUA. “Vale a pena” depende de quantas vezes por ano você precisa de mesas impossíveis, se o preço do serviço cabe no orçamento e se você está confortável usando uma ferramenta em inglês sem concierge humano focado no Brasil.',
        related: ['melhor-alternativa-mousedining', 'melhor-app-reservas-disney', 'mousewatcher-funciona'],
        sections: [
            S(
                'O que serviços desse tipo costumam fazer',
                'Monitoram o sistema oficial de reservas e avisam quando um horário aparece; a confirmação ainda é sua no app da Disney.',
                'Ninguém pode garantir mesa - só avisar com rapidez.'
            ),
            S(
                'Quando faz mais sentido',
                'Várias viagens ao ano, lista longa de restaurantes disputados ou grupo grande com pouca flexibilidade.',
                'Viagem única e curta pode ou não justificar a assinatura - faça a conta.'
            ),
            S(
                'Alternativa em português',
                'O Dine Mouse combina alertas com comunicação e concierge pensados para clientes de língua portuguesa - sem substituir o app oficial da Disney.',
                'Compare preços, canais de suporte e políticas de cancelamento de cada serviço.'
            ),
        ],
    },
    {
        slug: 'melhor-alternativa-mousedining',
        title: 'Melhor alternativa ao MouseDining',
        metaDesc:
            'Alternativa ao MouseDining: app oficial, alertas e concierge Dine Mouse em PT-BR. Comparação de categorias, não de “ranking secreto”.',
        keywords: 'MouseDining alternative, best alternative MouseDining, Disney dining alert Brazil',
        excerpt: 'Três caminhos: só My Disney Experience, alertas automatizados ou concierge - qual encaixa no seu perfil.',
        breadcrumb: 'Alternativas',
        lead: 'A melhor alternativa ao MouseDining não é uma única URL mágica: é escolher entre (1) fazer tudo sozinho no My Disney Experience, (2) usar um serviço de alertas que fale a sua língua e entenda Orlando, ou (3) contratar concierge para pensar na viagem inteira e não só no refresh do app.',
        related: ['mousedining-vale-a-pena', 'melhor-app-reservas-disney', 'dicas-reservas-disney'],
        sections: [
            S(
                'Camada 1: oficial',
                'Grátis, mas exige seu tempo e sorte nos cancelamentos.',
                'Funciona para muita gente em datas médias.'
            ),
            S(
                'Camada 2: alertas',
                'Reduz trabalho manual; compare taxas, parques cobertos e velocidade de notificação entre fornecedores.',
                'Leia termos de uso e privacidade.'
            ),
            S(
                'Camada 3: Dine Mouse',
                'Alertas + concierge gastronômico em português, com foco nos restaurantes mais disputados da Disney.',
                'Somos independentes da Disney e de terceiros citados apenas como contexto de mercado.'
            ),
        ],
    },
    {
        slug: 'mousewatcher-funciona',
        title: 'MouseWatcher funciona mesmo?',
        metaDesc:
            'MouseWatcher: como funcionam alertas de terceiros, limites realistas e diferença para monitoramento manual. Disney dining watcher.',
        keywords: 'MouseWatcher does it work, MouseWatcher Disney, alertas MouseWatcher',
        excerpt: 'Sim e não: a tecnologia notifica, mas ainda compete com outros usuários no clique final no app Disney.',
        breadcrumb: 'MouseWatcher',
        lead: 'MouseWatcher e serviços parecidos “funcionam” no sentido técnico de detectar mudanças de disponibilidade e enviar alerta. Não “funcionam” no sentido de prometer mesa: quem clica no My Disney Experience ainda é você, e outras pessoas podem ver o mesmo horário ao mesmo tempo.',
        related: ['mousedining-vale-a-pena', 'melhor-app-reservas-disney', 'como-encontrar-vagas-canceladas-disney'],
        sections: [
            S(
                'O que é realista esperar',
                'Menos trabalho de refresh manual e mais chances de notar uma vaga que durou segundos.',
                'Latência de SMS/app e velocidade da sua internet importam.'
            ),
            S(
                'Limites',
                'Shows lotados, grupos grandes e horários “ouro” continuam difíceis mesmo com alerta.',
                'Políticas da Disney vencem qualquer terceiro.'
            ),
            S(
                'Dine Mouse',
                'Oferecemos outro modelo: alertas e concierge com atendimento alinhado ao viajante brasileiro.',
                'Experimente comparar suporte e escopo de restaurantes cobertos.'
            ),
        ],
    },
    {
        slug: 'melhor-app-reservas-disney',
        title: 'Qual o melhor app para reservas Disney?',
        metaDesc:
            'Melhor app reservas Disney: My Disney Experience é obrigatório; o resto é assistente. Disney dining app guide.',
        keywords: 'best app for Disney dining reservations, My Disney Experience dining, app reserva Disney',
        excerpt: 'Não existe substituto legal para o app oficial - serviços de terceiro são complemento, não “app mágico”.',
        breadcrumb: 'Apps',
        lead: 'O melhor app para reservas Disney continua sendo o My Disney Experience (e o site associado): é o único lugar onde a reserva nasce oficialmente. Apps e serviços de terceiros podem avisar, sugerir ou organizar o plano - mas quem confirma a mesa é sempre a conta Disney.',
        related: ['sistema-reservas-disney', 'melhor-alternativa-mousedining', 'erros-impedem-reservas-disney'],
        sections: [
            S(
                'Por que o oficial é obrigatório',
                'Sem login Disney válido, sem reserva; sem respeito às regras de cancelamento, sem mesa garantida.',
                'Tudo passa por lá.'
            ),
            S(
                'O que “apps” de terceiros fazem',
                'Notificação, busca agregada ou planejamento de roteiro - categorias diferentes.',
                'Leia avaliações e política de privacidade antes de dar senha da Disney a qualquer integração.'
            ),
            S(
                'Dine Mouse',
                'Não somos um app que substitui a Disney: somos serviço de alertas e concierge que trabalha em cima do sistema oficial.',
                'Ideal se você quer menos inglês e menos tempo perdido em refresh.'
            ),
        ],
    },
    {
        slug: 'novo-epcot-disney-orlando',
        title: "O 'novo' EPCOT na Disney: o que mudou em Orlando (e o nome certo do parque)",
        metaDesc:
            'EPCOT renovado na Walt Disney World: World Celebration, atrações novas e dicas de reserva. Não é Epic Universe - é o EPCOT da Disney.',
        keywords: 'new EPCOT Disney World, EPCOT transformation, novo EPCOT Orlando, Epcot vs Epicot',
        excerpt:
            'Muita gente chama de “Epicot” o que é o EPCOT da Disney. Resumo do que o parque ganhou nos últimos anos e como isso afeta seu dia e suas reservas.',
        breadcrumb: 'EPCOT',
        lead: 'Se você ouviu falar do “novo parque Epicot” em Orlando, quase sempre o assunto é o **EPCOT** da Walt Disney World (sigla de Experimental Prototype Community of Tomorrow) - e não o Epic Universe da Universal. O EPCOT passou por uma grande transformação: novas áreas no hub, atrações como o passeio Journey of Water Inspired by Moana, espaços de encontro e novos rituais de entretenimento noturno - tudo sujeito ao calendário oficial da Disney na data da sua viagem.',
        related: ['reservar-space-220-restaurant', 'top-10-restaurantes-disney-orlando', 'sistema-reservas-disney'],
        sections: [
            S(
                'Por que parece um “parque novo”',
                'A entrada por Spaceship Earth continua icônica, mas o que havia atrás (grandes áreas de feira e construção) deu lugar a um eixo mais verde, com pavilhões e experiências que a Disney posiciona como futuro do EPCOT.',
                'Para o visitante, a sensação é de parque mais “inteiro” entre Future World antigo e World Showcase.'
            ),
            S(
                'World Showcase e gastronomia',
                'A volta ao mundo em um só parque continua sendo o coração das **Disney dining reservations** mais divertidas: Mexico, Japan, France e outros pavilhões concentram restaurantes de mesa e quick service muito procurados.',
                'Com mais fluxo no centro do parque, vale planejar refeições com folga entre atrações.'
            ),
            S(
                'Reservas no EPCOT',
                'Space 220, jantares no World Showcase e experiências sazonais (festival food booths) competem pela sua atenção - e por horários no app.',
                'Use a mesma janela de reserva oficial e, se um restaurante estiver lotado, monitore cancelamentos ou configure alertas.'
            ),
            S(
                'Checklist rápido',
                'Baixe mapa atualizado no My Disney Experience, confira horário de parque e de shows, e reserve pelo menos um table service com antecedência se o EPCOT for o dia “gourmet” da viagem.',
                'Regras e atrações mudam; confirme sempre no site oficial da Walt Disney World antes de embarcar.'
            ),
        ],
    },
];

/** Datas de publicação variadas (ISO + etiqueta PT) - aplicadas a cada slug gerado */
const PUBLISH_DATES = {
    'como-conseguir-reserva-ultima-hora-disney': { date: '2025-10-08', dateLabel: '8 de outubro de 2025' },
    'restaurantes-disney-sem-reserva': { date: '2025-10-27', dateLabel: '27 de outubro de 2025' },
    'como-encontrar-vagas-canceladas-disney': { date: '2025-11-14', dateLabel: '14 de novembro de 2025' },
    'reserva-mesmo-dia-disney': { date: '2025-11-29', dateLabel: '29 de novembro de 2025' },
    'porque-restaurantes-disney-esgotam-rapido': { date: '2025-12-11', dateLabel: '11 de dezembro de 2025' },
    'reserva-be-our-guest-restaurant': { date: '2025-12-19', dateLabel: '19 de dezembro de 2025' },
    'vale-pena-cinderellas-royal-table': { date: '2026-01-05', dateLabel: '5 de janeiro de 2026' },
    'reservar-space-220-restaurant': { date: '2026-01-14', dateLabel: '14 de janeiro de 2026' },
    'melhores-horarios-reservar-ohana-disney': { date: '2026-01-26', dateLabel: '26 de janeiro de 2026' },
    'review-chef-mickeys': { date: '2026-02-03', dateLabel: '3 de fevereiro de 2026' },
    'top-10-restaurantes-disney-orlando': { date: '2026-02-16', dateLabel: '16 de fevereiro de 2026' },
    'melhores-restaurantes-disney-criancas': { date: '2026-02-22', dateLabel: '22 de fevereiro de 2026' },
    'restaurantes-mais-dificeis-reservar-disney': { date: '2026-03-04', dateLabel: '4 de março de 2026' },
    'restaurantes-mais-baratos-disney': { date: '2026-03-09', dateLabel: '9 de março de 2026' },
    'restaurantes-romanticos-disney': { date: '2026-03-14', dateLabel: '14 de março de 2026' },
    'sistema-reservas-disney': { date: '2026-03-19', dateLabel: '19 de março de 2026' },
    'quantos-dias-abre-reserva-disney': { date: '2026-03-24', dateLabel: '24 de março de 2026' },
    'dicas-reservas-disney': { date: '2026-03-28', dateLabel: '28 de março de 2026' },
    'erros-impedem-reservas-disney': { date: '2026-04-01', dateLabel: '1 de abril de 2026' },
    'reserva-disney-dezembro': { date: '2026-04-04', dateLabel: '4 de abril de 2026' },
    'reservar-disney-feriados': { date: '2026-04-06', dateLabel: '6 de abril de 2026' },
    'melhor-horario-tentar-reservas-disney': { date: '2026-04-09', dateLabel: '9 de abril de 2026' },
    'usar-cancelamentos-vaga-disney': { date: '2026-04-11', dateLabel: '11 de abril de 2026' },
    'mousedining-vale-a-pena': { date: '2026-04-12', dateLabel: '12 de abril de 2026' },
    'melhor-alternativa-mousedining': { date: '2026-04-13', dateLabel: '13 de abril de 2026' },
    'mousewatcher-funciona': { date: '2026-04-14', dateLabel: '14 de abril de 2026' },
    'melhor-app-reservas-disney': { date: '2026-04-15', dateLabel: '15 de abril de 2026' },
    'novo-epcot-disney-orlando': { date: '2026-04-16', dateLabel: '16 de abril de 2026' },
};

for (const post of NEW_POSTS) {
    const d = PUBLISH_DATES[post.slug];
    if (!d) throw new Error(`blog-posts-data: falta data para slug "${post.slug}"`);
    post.date = d.date;
    post.dateLabel = d.dateLabel;
}
