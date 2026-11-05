# Painel de Ocorrências — Tenda Atacado

Aplicativo web simples (Node.js + Express) para registrar ocorrências de
roubo. Acesso protegido por senha, com três níveis:

- **Senha comum** (funcionários): só vê e usa o formulário de registro
  de ocorrência — não enxerga a lista de registros de outras pessoas,
  os painéis por regional/loja nem os gráficos.
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
administrador. Quem entrar com a senha comum vê apenas o formulário
de registro.

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
