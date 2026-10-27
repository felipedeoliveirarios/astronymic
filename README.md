# Astronymic

**Astronymic** é um sistema de escrita baseado em grafos e uma aplicação web para transformar palavras em composições visuais semelhantes a constelações. O objetivo principal da aplicação é **gerar** desenhos válidos a partir de texto, não reconhecer ou decodificar desenhos arbitrários.

> Estado: protótipo funcional de macrogeometria e injeção dos 26 glifos. Parâmetros numéricos são pontos de partida para testes, não calibrações definitivas.

## 1. Alfabeto

Cada glifo é um grafo com vértice de **entrada** e vértice de **saída**. Convenções da notação compacta:

- `o`: vértice;
- `^`: marca circular pequena acima da aresta;
- `_`: marca circular pequena abaixo da aresta;
- `:`: marcas acima e abaixo na mesma posição longitudinal;
- `=`: aresta desenhada com traço duplo, não duas arestas independentes;
- `|`: aresta com dois cortes diagonais (`//`) na região central;
- `/`: separação entre caminhos alternativos de um glifo composto;
- `(...)`: caminhos que partem de uma entrada comum e convergem na saída exterior aos parênteses.

A posição *acima/abaixo* é relativa à vertical global do pôster, não à normal local de uma aresta. A ordem das marcas e dos caminhos alternativos é significativa.

| Letra | Glifo | Letra | Glifo |
|---|---|---|---|
| A | `oo` | N | `o_^_o` |
| B | `o(o/)o` | O | `o^^o` |
| C | `o(/o)o` | P | `o(o/^)o` |
| D | `o^_^_o` | Q | `o(_/o)o` |
| E | `o^o` | R | `o:o` |
| F | `o_^^o` | S | `o^__o` |
| G | `o___o` | T | `o^_o` |
| H | `o(oo/)o` | U | `o__o` |
| I | `o_o` | V | `o=o` |
| J | `o=_o` | W | `o|o` |
| K | `o^:o` | X | `o_^_^_o` |
| L | `o_:o` | Y | `o:_o` |
| M | `o^_^o` | Z | `o^^^o` |

**Adaptação deliberada:** J foi definido como `o=_o` para distingui-lo de I (`o_o`) e oferecer suporte a textos multilíngues. A referência original apresentava ambiguidade entre I e J.

## 2. Composição e leitura

- Há um símbolo próprio de **origem/início**, mas não um marcador de fim.
- Glifos adjacentes conectam-se **somente por vértices de fronteira**: a saída de um glifo coincide com a entrada do seguinte. Nenhuma outra aresta ou vértice interno é compartilhado.
- A composição pode formar uma **árvore de instâncias de glifos**, com vários glifos filhos partindo de uma mesma junção. Não há ciclos entre glifos; ciclos internos de glifos compostos são permitidos.
- Cada ramificação da árvore deve conter ao menos uma letra; não se criam ramos puramente decorativos.
- A ordem de leitura é uma **busca em profundidade (DFS)** com ordenação angular horária dos ramos, tomando como referência a direção de retorno ao vértice de onde se chegou. Ao concluir um ramo, retrocede-se para explorar o próximo.
- O princípio de **separação estrutural** permite tratar pontes e blocos biconexos como indícios da estrutura de glifos, mas a interpretação correta também depende das fronteiras, das marcações e da ordem dos caminhos.
- A definição exata de casos-limite da ordenação angular e a garantia formal de decodificação única ainda requerem validação. A aplicação não precisa implementar um decodificador de imagens.

## 3. Geração procedural: visão geral

Fluxo:

```text
Texto de entrada
  -> normalização e sequência de glifos
  -> geração da topologia da árvore (slots para letras)
  -> atribuição das letras na ordem DFS
  -> layout angular e comprimentos dos segmentos de glifos
  -> injeção da geometria interna de cada glifo
  -> perturbações controladas
  -> validação geométrica e de leitura
  -> renderização SVG do pôster
```

Separar claramente **topologia**, **macrogeometria** (posição de entradas/saídas) e **microgeometria** (interior dos glifos). Não alterar a identidade de um glifo para melhorar o aspecto visual.

### 3.1. Topologia probabilística

1. Começar com probabilidade de ramificação de **50%**.
2. Em cada nó, testar se será criada uma ramificação adicional.
3. Após cada sucesso, **dividir a probabilidade por dois** e testar novamente; assim, um nó pode ter mais de dois filhos.
4. Na primeira falha, encerrar a criação de ramificações naquele nó.
5. Os descendentes herdam a probabilidade final do pai. Quando o pai **não ramificou**, dobrar a probabilidade herdada (máximo de 100%) antes do teste seguinte.
6. Gerar apenas posições necessárias para acomodar todas as letras; garantir a continuidade da árvore até completar a quantidade de slots. Não criar ramificações vazias.
7. Atribuir cada letra **exatamente uma vez**, em ordem DFS, após estabelecer a topologia.

Iniciar com a regra acima **sem jitter extra** na probabilidade herdada. Avaliar regularidade excessiva apenas depois dos primeiros resultados.

**Detalhe de implementação a formalizar:** distinguir a aresta de continuidade obrigatória das ramificações adicionais, sobretudo quando restam poucos slots, para evitar nós ou ramos sem glifos.

### 3.2. Layout angular e reserva espacial

- O nó de origem recebe um setor inicial de **240° orientado para baixo**.
- Cada subárvore possui um **setor reservado** (limite espacial) e uma **direção/setor preferencial de crescimento**.
- Com um filho, ele herda integralmente o setor reservado.
- Com `n` filhos, dividir o setor reservado em `n` partes iguais, respeitando a ordem de leitura.
- Posicionar a próxima saída próximo ao centro do setor correspondente, com deslocamento angular pseudoaleatório de até **±20% da abertura**.
- **Compensar o offset angular anterior**: sortear o novo desvio como `offset_seguinte = -offset_anterior + ruído`, com ruído de até ±20% da abertura do setor atual. O offset anterior é o desvio efetivamente aplicado em relação ao centro do setor do pai. Limitar o resultado a ±45% da abertura do setor atual, sem ampliar a reserva nem invadir o espaço atribuído a irmãos. Isso favorece um percurso serpenteante, sem impor uma alternância rígida; cada ramo filho evolui independentemente.
- Os setores são expressos em uma referência angular global; a direção preferencial pode evoluir de geração em geração.

**Importante:** setores locais não garantem ausência de cruzamentos, porque os vértices de origem dos setores podem ser diferentes. A geometria resultante precisa de validação de colisões/interseções. Definir formalmente a reserva espacial de toda a subárvore (não apenas de uma aresta) é parte do trabalho de implementação.

### 3.3. Comprimentos entre entrada e saída

A regra de comprimento atua **exclusivamente sobre a distância entre a entrada e a saída de cada instância de glifo**. Não se aplica diretamente a cada segmento interno do glifo.

Usar comprimento base `L`, amplitude aleatória `a` e coeficiente de compensação `α`:

```text
comprimento_seguinte = L + α * (L - comprimento_anterior) + ε
ε ~ uniforme(-a*L, +a*L)
```

- Uma aresta curta desloca para cima o centro da faixa de sorteio da seguinte, e vice-versa.
- A compensação é **parcial e probabilística**: não obriga alternância curta/longa.
- Cada ramo filho parte da referência de comprimento do pai e passa a evoluir independentemente.
- Valores iniciais para testes: `L = 100` unidades, `a = 30%`, `α = 50%`, comprimento mínimo absoluto de **30 unidades**.
- Aplicar limites geométricos adequados e testar interação entre compensação e colisões.

### 3.4. Injeção de glifos e deformação

Depois de posicionar os extremos de cada instância:

1. Construir uma **versão regular/uniforme** do glifo em coordenadas locais.
2. Escalar e rotacionar para encaixar os vértices de entrada e saída nos pontos fixos da árvore.
3. Aplicar offsets pseudoaleatórios **aos vértices internos**, nas direções longitudinal e transversal ao segmento de entrada/saída.
4. Aplicar offsets independentes às **marcações**, alterando posição longitudinal na aresta e afastamento transversal.
5. Validar a topologia, a ordem angular dos caminhos, a sequência e o lado global das marcações, e as distâncias/interseções.

Os extremos **não se movem** durante a injeção. Cortes e traços duplos continuam atributos de aresta; não introduzem vértices extras.

Parâmetros iniciais sugeridos para testes:

| Perturbação | Amplitude |
|---|---|
| Vértice interno, longitudinal | ±10% da distância entrada–saída |
| Vértice interno, transversal | ±15% da distância entrada–saída |
| Marcação, posição na aresta | ±8% do comprimento da aresta |
| Marcação, afastamento | ±20% do afastamento padrão |

Impedir inversão de ordem, sobreposição com vértices, troca de lado global ou inversão dos caminhos que diferenciam glifos como B e C. Em arestas verticais ou quase verticais, será preciso escolher uma convenção geométrica consistente para marcações globais acima/abaixo.

## 4. Aleatoriedade reproduzível

- A **seed padrão** deriva deterministicamente do texto normalizado.
- Permitir **seed personalizada** e geração de uma nova seed aleatória, que deve ser exibida e preservada para reprodução.
- Usar hash e PRNG determinísticos explicitamente definidos; não depender diretamente de `Math.random()`.
- Fixar uma **versão do algoritmo**, pois alterações de geração podem mudar o resultado mesmo com a mesma seed.
- Todas as etapas (topologia, ângulos, distâncias e microdeformações) usam a fonte determinística de aleatoriedade.
- Definir posteriormente normalização Unicode, tratamento de acentos, espaços, números e pontuação; o alfabeto formalizado contém A–Z.

## 5. Aplicação web e experiência visual

- Aplicação **inteiramente frontend**, em formato SPA; Angular/TypeScript e SVG são opções adequadas de implementação.
- Visual de **pôster de constelação**: fundo escuro estrelado, traços delicados e estrelas nos vértices.
- **Título editável diretamente no atlas**: o texto do título é a entrada da geração; a constelação aparece abaixo, sem um campo de texto separado. O atlas ocupa a página inteira, com Astronymic no canto superior esquerdo.
- Atualizar após pequeno **debounce** (referência: ~500 ms), com transição/revelação suave, sem espera artificial desnecessária.
- **Menu lateral recolhível de referência:** dicionário completo dos 26 glifos, convenções, regras de escrita/leitura e nota sobre a adaptação de J.
- **Menu lateral recolhível de geração:** seed padrão derivada do texto, seed personalizada e opção de gerar nova seed; parâmetros visuais poderão ser expostos progressivamente.
- **Sem edição manual ou arraste de vértices**: o layout é decidido automaticamente.
- Exportação **SVG/PNG** é desejada para uma etapa posterior.
- Preservar o aspecto de constelação sem adicionar ramos decorativos que não correspondam a letras.

## 6. Validação e pontos ainda abertos

**Invariantes fundamentais**
- Cada letra do texto normalizado aparece uma única vez na árvore, na ordem DFS.
- Toda ramificação possui ao menos um glifo.
- Glifos preservam seus vértices de entrada/saída, conectividade, ordem de caminhos e marcações.
- Glifos distintos não compartilham arestas ou vértices internos.
- Perturbações não alteram a interpretação do alfabeto.
- Mesmos texto, seed e versão de algoritmo geram o mesmo resultado.

**A validar no protótipo**
- Definição geométrica rigorosa da reserva de subárvore e estratégia de resolução de colisões.
- Convenção precisa para orientação/ordenação angular e casos degenerados.
- Construção regular de cada glifo composto e margem de segurança para sua injeção.
- Comportamento de sequências longas, bifurcações profundas e setores muito estreitos.
- Legibilidade de marcas em arestas quase verticais.
- Normalização de texto fora de A–Z.
- Ajuste dos percentuais e dos comprimentos após testes visuais.

## 7. Próxima etapa sugerida

Implementar um protótipo que gere primeiro a **árvore de segmentos de entrada/saída**, sem glifos internos; depois acrescentar a injeção e a validação. Testar com palavras curtas e longas e seeds fixas antes de trabalhar no acabamento visual do pôster.

## 8. Protótipo executável

A árvore e a injeção dos glifos estão implementadas com **TypeScript, Vite e SVG**, sem backend. Angular permanece uma opção para evolução; este protótipo isola o gerador da interface.

### Desenvolvimento

Requer Node.js 24 e npm. Na raiz do repositório:

```sh
npm ci
npm run dev
```

Verificações e build de publicação:

```sh
npm test
npm run build -- --base=./
npm run preview
```

O build é gerado em `dist/`. Não há chaves, banco de dados ou variáveis de ambiente obrigatórias. Em ambientes com diretório pessoal sem escrita, use `npm ci --cache /tmp/astronymic-npm-cache`.

### O que esta versão faz

- Gera a **árvore de segmentos entrada–saída**, com uma letra por segmento e ordem DFS angular horária, e injeta os 26 glifos do alfabeto sem mover as fronteiras. A macrogeometria continua disponível no debug.
- O atlas ocupa a página inteira, com título editável diretamente no pôster e debounce de 500 ms. O menu compacto **Ajustes**, inicialmente recolhido no canto superior direito, reúne seed automática/personalizada, nova seed aleatória, toggles de ordem/letras e debug, e informações de leitura. Fecha com Escape ou clique fora; Enter encerra a edição do título, e colagem usa somente texto simples. Mensagens visíveis ficam reservadas para erros e cruzamentos; contagem de letras, seed efetiva e versão ficam dentro do menu.
- O toggle **Debug: setores e branching** sobrepõe leques dos setores locais de cada segmento e os percentuais realmente testados em cada junção (incluindo a origem). `✓` indica ramo criado e `×` a primeira falha; folhas e esgotamento do orçamento aparecem como `fim` e `sem teste`. Tooltips detalham a abertura, o offset e a probabilidade herdada. Os leques têm raio ilustrativo e não representam uma reserva espacial garantida de toda a subárvore. A instrumentação não consome novos sorteios nem altera a geometria/versão do algoritmo.
- Usa FNV-1a (unidades UTF-16) e Mulberry32, com versão de geração `segments-v3` (compensação angular com ruído de até ±20% da abertura do setor). O namespace de aleatoriedade `segments-v1` foi mantido para isolar a mudança de geometria, preservando os sorteios de topologia e comprimentos por tentativa. A seed aleatória vem de Web Crypto e é mostrada para reprodução; a geração usa exclusivamente o PRNG determinístico.
- Normalização inicial: NFD, remoção de marcas Unicode, conversão para maiúsculas e retenção de A–Z. Espaços, números e pontuação são descartados. Limite: 120 letras após normalização; textos maiores recebem erro sem truncamento silencioso.
- Reserva uma continuação obrigatória, testa ramos adicionais com probabilidade decrescente e distribui o orçamento restante entre ramos não vazios. Setores globais iniciam em 240° para baixo. A atribuição das letras ocorre na travessia final após ordenar os filhos pela direção de retorno.
- Valida interseções entre segmentos sem fronteira compartilhada e tenta até 32 candidatos determinísticos. Se persistirem cruzamentos, mostra um aviso e o candidato com menos cruzamentos. Ainda não garante separação espacial de subárvores, distância mínima, ausência de sobreposição em junções ou de colisões entre rótulos.

### Injeção dos glifos (`glyphs-v1`)

- `src/glyphs.ts` define o alfabeto pela notação compacta, separando grafo, caminhos, atributos de aresta e marcas. `src/glyph-renderer.ts` desenha o modelo em SVG; o atlas e o dicionário **Alfabeto A–Z**, dentro de Ajustes, usam as mesmas definições e renderização. As referências são regulares, sem deformação.
- Glifos compostos partilham somente entrada/saída entre seus caminhos. O primeiro caminho interno ocupa o lado anti-horário do segmento entrada–saída; o segundo, o horário. Assim, B/C e P/Q mantêm a ordem dos caminhos. H possui dois vértices internos. O afastamento regular dos vértices internos é `max(22% da distância entrada–saída, 11 unidades)`, garantindo espaço para marcas em segmentos curtos.
- V e J têm uma aresta lógica com dois traços; J mantém sua marca inferior. W tem uma aresta com dois cortes diagonais. Esses atributos não criam vértices ou letras extras. Marcas são pequenos círculos vazados, distintos das estrelas dos vértices.
- Os extremos permanecem fixos. A microgeometria usa um stream Mulberry32 separado, derivado de `glyphs-v1`, seed, ID da instância, letra e tentativa. Alterar a injeção não consome sorteios da árvore. A versão exibida combina `segments-v3` e `glyphs-v1`.
- Vértices internos recebem offsets de até ±10% longitudinal e ±15% transversal. Marcas recebem jitter longitudinal de até ±8% da aresta (reduzido quando necessário para manter a ordem) e afastamento de até ±20%. Pares `:` usam a mesma posição longitudinal. O lado é sempre global: a marca superior tem Y menor que sua âncora, independentemente da direção de leitura. Em arestas quase verticais (`abs(dx / comprimento) < 0.25`), a convenção é superior acima/direita e inferior abaixo/esquerda, evitando sobreposição à própria aresta.
- A validação verifica cruzamentos, sobreposição de arestas e aproximações entre vértices, marcas e arestas. Pontos de fronteira compartilhados são permitidos; os demais vértices têm IDs próprios. Sete tentativas determinísticas reduzem a deformação até incluir a forma regular. Se persistirem conflitos, o resultado com menos diagnósticos é exibido **com aviso**. O ajuste atual não refaz a macrogeometria para acomodar um glifo largo.
- Os testes cobrem os 26 grafos e suas marcas, ordem de caminhos após rotação, deformações, limites fixos, reprodução e detecção de conflitos. As formas regulares foram verificadas em 24 orientações e comprimentos 30/100 (1.248 casos). A validação ainda não prova decodificação única, não garante reserva espacial de subárvores e não verifica colisões com rótulos ou halos decorativos. As margens para traços duplos/cortes são conservadoras.

Exportação SVG/PNG e resolução global de colisões após a injeção **ainda não estão implementadas**.

### Publicação no GitHub Pages

O workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) executa testes/build em pull requests e publica os pushes para `main` (ou execução manual em `main`). Usa o `GITHUB_TOKEN` automático; não precisa criar PAT nem armazenar segredo.

1. Envie os arquivos do protótipo e workflow ao GitHub, na branch `main`.
2. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**. Se Pages não estiver disponível, verifique o plano e a visibilidade do repositório.
3. Acompanhe o workflow **Deploy to GitHub Pages** em **Actions**. Depois de habilitar Pages, se o push já tiver ocorrido, use **Run workflow** na branch `main`.
4. Use a URL apresentada pelo job `deploy` após a publicação bem-sucedida. Sem domínio personalizado, o endereço esperado é `https://felipedeoliveirarios.github.io/astronymic/`.

GitHub Free oferece Pages para repositórios públicos. Repositórios privados precisam de um plano compatível, como GitHub Pro ou Team. A privacidade do repositório não torna o site privado; no uso comum o site publicado é público. Organizações podem ter restrições adicionais de Actions e Pages.

O build usa base relativa (`./`) para carregar os assets tanto em `/astronymic/` quanto em um domínio próprio. O app não usa rotas de histórico, portanto não exige fallback SPA no Pages.
