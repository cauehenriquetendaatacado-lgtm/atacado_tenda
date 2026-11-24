# Painel de Ocorrências — Tenda Atacado

Aplicativo web simples (Node.js + Express) para registrar ocorrências de
roubo. Acesso protegido por senha, com três níveis:

- **Senha comum** (funcionários): usa o formulário de registro de
  ocorrência e vê o **Ranking** — não enxerga a lista de registros de
  outras pessoas, os painéis por regional/loja nem os gráficos.
- **Senha da gerência**: mostra um selo "Gerência" e apenas os painéis
  (ocorrências registradas, valor recuperado total e do mês, painel de
  regionais, ocorrências recentes, ocorrências por regional, inibidas
  por mês e regional, apoio de cópia/quadrilha/monitoramento). Não tem
  formulário de registro nem confirma ocorrências.
- **Senha de administrador**: enxerga tudo isso, vê quem registrou cada
  ocorrência, pode **confirmar** (ou desfazer a confirmação de) um
  registro para auditar o que foi lançado, e um novo quadro mostra a
  **estatística mensal de ocorrências inibidas por regional** (uma
  coluna para cada uma das 4 regionais, uma linha por mês).

## Rodar localmente

```bash
npm install
npm start
```

Acesse http://localhost:3001 — senhas padrão:
- Senha comum: `tenda123@` (variável de ambiente `SENHA_PAINEL`)
- Senha da gerência: `gerencia123@` (variável de ambiente `SENHA_GERENCIA`)
- Senha de administrador: `admin123@` (variável de ambiente `SENHA_ADMIN`)

**Troque as três antes de colocar no ar.** Quem entrar com a senha de
administrador vê um selo "Administrador" no topo do painel, o painel
completo de estatísticas e navegação, e em cada ocorrência uma etiqueta
"Confirmada"/"Pendente" com o botão para confirmar o registro (fica
salvo quem confirmou e quando). Um filtro "Só pendentes de confirmação"
também aparece na tela de "Ocorrências recentes" só para o
administrador. Quem entrar com a senha comum vê o formulário de registro
e o botão do Ranking.

## Acesso do Caue (backup + configurações)

Além das três senhas acima, existe um **quarto acesso com usuário e senha**:
na tela de login, toque no ícone de **ferramenta** (canto do cartão) para
abrir o campo **Usuário**, e preencha **Usuário** e **Senha** (funcionários e
gerência não precisam tocar no ícone). Esse acesso tem tudo do administrador (confirmar,
excluir) e é o **único** com **Backup** (planilha e completo) e com o botão **Configurações**:

- **Aparência:** 5 temas prontos e 10 cores ajustáveis (prévia na hora).
- **Textos:** nome da empresa e título do painel.
- **Ranking e atualização:** meta de recuperação em R$ e intervalo de
  atualização automática.
- **Regras do ranking:** data a partir da qual ranking e valores contam
  (botões "Zerar agora" e "Contar todo o histórico") e se só ocorrências
  confirmadas entram no ranking.
- **Produtos recuperados:** lista editável (até 12) das opções do formulário
  e da aba de produtos.
- **Funcionários e turnos:** nomes da manhã e da tarde (ranking e lista de
  nomes do formulário).
- **Verificação do sistema:** só leitura — armazenamento (Postgres ou
  arquivo), totais de ocorrências, pendentes, sem produto e quais senhas já
  foram trocadas.
- **Senhas:** troca a senha de cada perfil (comum, gerência, administrador e
  a do próprio Caue). Ficam guardadas só como hash no banco.
- **Restaurar padrão:** volta cores, textos, meta e atualização ao original.

As configurações valem para todos os acessos e ficam no Postgres (tabela
`configuracoes`) ou em `config.json` no modo local. O usuário e a senha
iniciais podem ser definidos por `USUARIO_CAUE` e `SENHA_CAUE`; depois de
trocar a senha pela tela de Configurações, a nova passa a valer no lugar
da variável.

## Tela cheia (PC e celular)

O painel não tem mais largura máxima: cartões, botões de navegação, formulário e gráficos
ocupam a tela toda. No PC os botões ficam lado a lado (até 4 por linha) e, no celular, um por
linha. Pizzas e barras crescem com a tela (as barras preenchem a coluna e a altura dos
gráficos aumenta em telas altas, até 2x). O gráfico de inibidas por mês mantém barras de largura normal (centralizadas com poucos meses; com muitos, rola e abre no mês mais recente). `sw.js` passou para `tenda-atacado-v21`.

## Apoio de cópia com pessoa (formulário e ranking)

No formulário, ao ligar **Teve apoio de cópia** aparece a lista **Quem deu o apoio de
cópia?** com todos da manhã e da tarde (obrigatório escolher, e precisa ser outra pessoa
que não quem registrou). O **valor recuperado** da ocorrência passa a contar **também no
ranking** dessa pessoa, junto com quem registrou (a cada um vale o valor inteiro): soma no
valor, na barra da meta, na evolução e no líder do mês, dentro do turno e da aba
Com/Sem FaceID da ocorrência. A pessoa do apoio **não ganha ocorrência** no contador.
Painéis, regionais, produtos e totais não mudam. O nome fica na coluna
`apoioCopiaPessoa` (criada sozinha), aparece no detalhe do registro e no backup.
`sw.js` passou para `tenda-atacado-v19`.

## Admin corrige Com/Sem FaceID

Ao abrir um registro (Ocorrências recentes), o administrador e o Caue veem o campo
**FaceID** como dois botões, **Com FaceID** e **Sem FaceID**, e podem trocar a opção que
o funcionário marcou. Salva na hora e o ranking e os gráficos passam a seguir a nova
opção. Outros perfis só veem o texto. `sw.js` passou para `tenda-atacado-v18`.

## Aba "Qualificar chamada" (senha comum, administrador e Caue)

Logo abaixo do topo aparece uma barra com duas abas: **Painel** e **Qualificar chamada**.
A segunda existe para quem entra com a **senha comum (`tenda123@`)**, com a senha de
**administrador** ou com o acesso do **Caue**; a gerência não vê a aba e o servidor recusa
o registro (`POST /api/qualificacoes`) para ela. Quem entra com a senha comum pode
**registrar** qualificações (ficam como "Funcionário"), mas **não vê o botão Excluir** — excluir
continua só para administrador e Caue (o servidor também recusa).

- Duas qualificações fixas: **Sangria** e **Fechamento de Caixa**.
- Cada cartão mostra quantas classificações já houve (total, hoje e no mês).
- Toque num cartão, preencha (se quiser) **Loja** e **Observação** e toque em
  **Registrar qualificação**. A lista "Últimas qualificações" mostra quem e quando
  classificou; é possível excluir um registro (a contagem diminui).
- Fica na tabela `qualificacoes` (criada sozinha pelo servidor; também em
  `schema.sql`) ou em `qualificacoes.json` no modo local. Entra no backup do Caue
  (nova aba "Qualificação de chamadas" na planilha e campo `qualificacoes` no JSON).
- `sw.js` passou para `tenda-atacado-v17`.

## Regionais e CTs editáveis (só o Caue)

O Caue altera a estrutura de regionais e CTs (lojas) sem mexer no código. Dois
caminhos levam ao mesmo editor: **Configurações → Regionais e CTs** ou o botão
**✎ Editar regionais e CTs** na tela *Painel de regionais*.

- **Regionais:** renomear, trocar o responsável, adicionar e excluir (até 30).
- **CTs:** adicionar (código + nome), editar o nome, **mover** para outra regional
  e excluir (até 80 por regional, 400 no total). O código vira maiúsculo; use letras,
  números e hífen.
- **Nada vale até tocar em Salvar.** Depois de salvar, tudo segue a nova estrutura
  na hora: pizza e colunas por regional, inibidas por mês, painel de regionais e
  lojas, aba de produtos, lista de CTs do formulário e a planilha do Face ID (tela e
  download).
- **Histórico preservado:** renomear uma regional ou mover um CT atualiza também as
  ocorrências já registradas (e os testes de Face ID da regional renomeada). Excluir
  **não apaga** ocorrências; a regional excluída continua nos gráficos como
  “Nome (excluída)” enquanto houver ocorrências dela.
- **Nome de regional não pode se cruzar** (A vira B e B vira C na mesma gravação):
  renomeie uma de cada vez. O servidor também recusa nome repetido, CT repetido
  e código inválido.
- A regional de cada ocorrência nova é definida pelo servidor a partir do CT, então
  registros que estavam na fila offline com o nome antigo caem na regional certa.
- Os gráficos por regional têm 8 cores (repetem só a partir da 9ª regional).
- A estrutura fica na tabela `configuracoes` (Postgres) ou em `config.json`. Quem
  nunca salvou nada continua com as 4 regionais originais.
- `sw.js` passou para `tenda-atacado-v13`; o app instalado atualiza ao ser aberto com internet.

## Categorias com itens dentro (só o Caue edita)

Cada produto recuperado é um **botão** (categoria). Ao tocar num botão, abre um
painel com os **itens** dessa categoria (ex.: Chocolate → Bis, Lacta, Garoto) e dá
para marcar **mais de um item** e **mais de uma categoria**. Marcar um item marca
a categoria dele sozinho.

- **Caue** (no formulário e na aba "Produtos recuperados"): campo **＋ Categoria**
  para criar um botão novo, campo **＋ Item** dentro de cada painel, e o botão
  **✎ Editar categorias e itens** (adicionar e remover). Também no botão da tela de
  Configurações. Até 40 categorias e 80 itens por categoria.
- **Aba "Produtos recuperados"**: tocar num cartão de categoria abre os itens dela
  com a quantidade de cada um; marcar vários itens filtra os números e gráficos.
- Nomes não são renomeados (só adicionar/remover) para não quebrar o histórico.
  Remover uma categoria ou item não altera ocorrências já registradas.
- As ocorrências guardam os itens na coluna `subprodutos` (criada sozinha pelo
  servidor; também está em `schema.sql`). O backup em planilha ganhou a coluna
  "Itens dos produtos".

## Servidor offline: aviso e redundância (fila no aparelho)

- **Aviso:** o painel pergunta ao servidor (`/api/ping`) a cada 10 s. Se ele não
  responder (duas tentativas seguidas), aparece uma **faixa vermelha** no topo com
  o horário em que caiu. O acesso do Caue ainda mostra um indicador fixo
  "Servidor online/offline · N na fila" ao lado do selo.
- **Redundância offline (liga/desliga em Configurações, só Caue):** quando ligada,
  o formulário continua aceitando registros com o servidor fora do ar. Eles ficam
  guardados no aparelho (IndexedDB) e, quando o servidor volta, são enviados
  sozinhos, na ordem em que foram lançados, mantendo a hora original do lançamento.
  Desligada, o formulário avisa que o servidor está offline e mantém os dados na tela.
- **Sem duplicar:** cada registro leva um identificador gerado no aparelho; se o
  reenvio chegar duas vezes, o servidor grava só uma.
- **Importante:** ligue a opção com o servidor online. Cada aparelho recebe a opção
  pelo `/api/ping` e a guarda; um aparelho que nunca abriu o app depois de a opção ser
  ligada não sabe dela. A fila é por aparelho: se o usuário sair, os registros
  continuam guardados e vão quando alguém entrar de novo e o servidor estiver online.
- Atualizar o app instalado: o `sw.js` mudou para `tenda-atacado-v12`; o app
  atualiza ao ser aberto com internet (pode precisar abrir duas vezes).

## Ranking só com ocorrências confirmadas

Uma ocorrência registrada com a senha comum (`tenda123@`) nasce como
**Pendente** e **não entra no ranking** (posições, valor recuperado, meta,
evolução, comemoração e líder do mês anterior). Ela só passa a contar
depois que alguém entra com a senha de administrador (`admin123@`) e
clica em **Confirmar registro**. Se o admin desfizer a confirmação, a
ocorrência sai do ranking de novo. Os demais painéis (contagens, listas,
gráficos) continuam mostrando todas as ocorrências.

## Colocar no GitHub

```bash
git init
git add .
git commit -m "Painel de ocorrencias - versao inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/tenda-atacado-painel.git
git push -u origin main
```

(Crie o repositório vazio antes em github.com/new — não marque "adicionar README").

## Colocar no ar (hospedagem gratuita)

O GitHub sozinho não roda o servidor — ele só guarda o código. Para o
painel ficar acessível pela internet 24h, conecte o repositório a um
serviço de hospedagem. Recomendo o **Render**:

1. Crie conta em https://render.com (dá pra logar com o GitHub).
2. "New" → "Web Service" → selecione o repositório `tenda-atacado-painel`.
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Em "Environment", adicione as variáveis `SENHA_PAINEL` (senha comum),
   `SENHA_GERENCIA` (senha da gerência) e `SENHA_ADMIN` (senha de
   administrador) com as senhas que quiser usar.
5. Clique em "Create Web Service". Em alguns minutos o Render dá um link
   tipo `https://tenda-atacado-painel.onrender.com` — esse é o link que
   você compartilha com os funcionários.

## Banco de dados persistente (Postgres — gratuito)

O código já vem preparado para gravar num banco Postgres em vez do
arquivo local, usando a variável `DATABASE_URL`. A tabela é criada
automaticamente na primeira vez que o servidor sobe. Se
`DATABASE_URL` não for configurada, o app continua funcionando com
o arquivo `dados.json` (bom só para testar na sua máquina).

**Atenção:** o Postgres gratuito do próprio Render expira em 30 dias
e é apagado — não sirva para dados que não podem sumir. Recomendo o
**Neon** (Postgres serverless, plano grátis sem prazo de expiração).
O Supabase também funciona igual com esse mesmo código, caso
prefira: basta pegar a connection string Postgres dele em vez da do
Neon.

### 1. Criar o banco no Neon

1. Crie conta grátis em https://neon.tech (dá pra logar com GitHub).
2. Crie um projeto (ex: `tenda-painel`).
3. Na tela do projeto, copie a **Connection String** (algo como
   `postgresql://usuario:senha@ep-xxxx.neon.tech/neondb?sslmode=require`).

### 2. Configurar no Render

No serviço do Render, vá em **Environment** e adicione:
- `DATABASE_URL` = a connection string copiada do Neon

Salve — o Render reinicia o serviço automaticamente. No log de
deploy deve aparecer `Armazenamento: Postgres (persistente)`. A
partir daí os dados ficam guardados no banco, sobrevivendo a
reinícios e ao "sono" do plano gratuito do Render.

O plano gratuito do Neon dá 0,5 GB de armazenamento, o suficiente
para milhares de ocorrências.

## Supabase: RLS e schema opcional

- Ao subir, o servidor liga o **RLS** nas tabelas `ocorrencias`, `faceid_testes` e
  `configuracoes`. Sem policies, a API pública do Supabase (chave anon) fica
  bloqueada; o servidor Node conecta como `postgres` e ignora o RLS.
- `supabase/schema.sql`: opcional, para criar as tabelas antes pelo SQL Editor
  (o servidor também cria tudo sozinho).
- `.env.example`: modelo das variáveis (`DATABASE_URL`, senhas e usuário do Caue).

## Aba "Gráficos" (só Caue e gerência)

Ao lado de "Painel" e "Qualificar chamada" há a aba **Gráficos**, feita para
os gerentes. O administrador (senha de administrador) não vê esta aba. A gerência vê só "Painel" e "Gráficos" (somente leitura). Filtros
de **ano** e **mês de referência** no topo. Conteúdo:

- Indicadores: lucro (valor recuperado) do mês e do ano, furtos inibidos do
  mês e do ano e total de chamadas por qualificação (sangria / fechamento de caixa).
- Lucro por mês (área + linha).
- Chamadas por mês (colunas agrupadas) e proporção das chamadas no ano (rosca).
- Furtos inibidos durante o ano (colunas empilhadas inibidas x não inibidas, com taxa de inibição).
- Lucro do mês e do ano por regional (barras horizontais) e participação de
  cada regional no lucro do ano (rosca).
- Tipo de furto (produtos marcados nas ocorrências) por regional, em barras empilhadas, rosca geral e tabela dos itens mais furtados por regional; período "ano inteiro" ou "só o mês de referência".
- Mapa de calor de furtos inibidos por regional e mês.

Os valores em R$ seguem a regra de zeragem das Configurações (a mesma do
restante do painel); quantidades usam todo o histórico. Para a gerência ler
as chamadas, `GET /api/qualificacoes` agora aceita também a senha da
gerência (criar e excluir continuam só para administrador e Caue).
