-- Backup de ocorrências (gerado a partir de backup-ocorrencias-2026-11-06.xlsx)
-- Cole no SQL Editor do Supabase e execute. Pode rodar mais de uma vez:
-- "on conflict (id) do nothing" evita duplicar registros que já existem.
-- Rode antes o schema.sql (ou suba o servidor uma vez) para criar as tabelas.
-- Obs.: a planilha só diz se havia foto (Sim/Não), não traz a imagem; por isso "foto" fica nulo.

begin;

insert into ocorrencias
  (id, data, loja, regional, descricao, "valorRecuperado", quadrilha, nome, inibido, "apoioCopia", monitoramento, confirmado, "confirmadoPor", "confirmadoEm", "criadoEm", "faceId", produtos)
values
('mvzsz8w0dw6v', '2026-11-01', 'CT09', 'Vale e Litoral Norte', 'furto inibido.', 7.58, false, 'Alencar', true, true, true, true, 'Caue', '2026-11-02 19:01:26-03', '2026-11-02 19:00:52-03', true, '[]'::jsonb),
('mvzsz1sekrl0', '2026-11-01', 'CT41', 'Interior Grande SP e Litoral Sul', 'furto inibido.', 92.66, false, 'Alencar', true, true, true, true, 'Caue', '2026-11-02 19:01:20-03', '2026-11-02 19:00:43-03', true, '[]'::jsonb),
('mvzsrfwqdaol', '2026-11-01', 'CT53', 'Interior Grande SP e Litoral Sul', 'furto inibido.', 109.0, false, 'Jessica', true, true, true, true, 'Caue', '2026-11-02 18:56:34-03', '2026-11-02 18:54:48-03', true, '[]'::jsonb),
('mw0hwxz8tngx', '2026-11-02', 'CT39', 'Interior Noroeste', 'LOJA PASSA TRÊS INDIVÍDUOS SUSPEITOS QUE ESTÃO COM CARRINHOS, LOGO QUE ELES PERCEBEM QUE ESTÃO SENDO COPIADOS ABANDONAM OS MESMO.', 369.45, true, 'GABRIEL', true, true, true, true, 'Caue', '2026-11-03 12:24:44-03', '2026-11-03 06:38:55-03', false, '[]'::jsonb),
('mvzv9yl5mng5', '2026-11-02', 'CT43', 'Interior Grande SP e Litoral Sul', '2 rapazes QRU de chocolate', 472.71, false, 'Jessica', true, false, false, true, 'Henry', '2026-11-02 20:05:41-03', '2026-11-02 20:05:11-03', false, '[]'::jsonb),
('mvzufslm6yy8', '2026-11-02', 'CT54', 'Interior e Campinas', 'furto inibido. ', 164.08, false, 'Deivys', true, true, true, true, 'Caue', '2026-11-02 19:52:32-03', '2026-11-02 19:41:44-03', true, '[]'::jsonb),
('mw2dcwwq6kuc', '2026-11-03', 'CT09', 'Vale e Litoral Norte', 'furto inibido.', 25.6, false, 'Jessica', true, true, true, true, 'Caue', '2026-11-04 14:07:32-03', '2026-11-04 14:06:54-03', false, '[]'::jsonb),
('mw23d2hu20b2', '2026-11-03', 'CT50', 'Interior e Campinas', 'Na manha de ontem  Qru entra pela p1 prevenção  suspeita  e pede apoio  qru pega as qtc e começa  a procurar  lugar  para enpenha o mercado estava lotado então  ele vai para frente  de caixa e tenta  passar pela operadora    matriz   avisa  e qru abandona  o carrinho ', 511.0, false, 'STEFFANE', true, true, true, true, 'Caue', '2026-11-05 12:41:41-03', '2026-11-04 09:27:05-03', true, '[]'::jsonb),
('mw1yh9w6wiv7', '2026-11-03', 'CT16', 'Interior e Campinas', 'A LOJA PASSOU UM QRU PARA A MATRIZ, E O MESMO PEGA UM CHINELO E FICA RODANDO A LOJA PRA VER SE VAI CONSEGUIR EMPENHAR, MAS O MESMO DA QTA PELA P3 E ABANDONA A QTC NA FRENTE DE CAIXA.', 33.0, false, 'Arthur', true, true, true, true, 'Henry', '2026-11-05 12:41:49-03', '2026-11-04 07:10:23-03', true, '[]'::jsonb),
('mw1c4osgcjr8', '2026-11-03', 'CT51', 'Interior Grande SP e Litoral Sul', 'Batom conhecida entra na lima e pega uma peça de queijo.', 160.0, false, 'Deivys', true, false, true, true, 'cAUE', '2026-11-04 12:35:12-03', '2026-11-03 20:44:45-03', true, '[]'::jsonb),
('mw0wgztgryzc', '2026-11-03', 'CT28', 'Interior Noroeste', 'Qra suspeito adentra a loja com uma mochila no carrinho ,loja comunica a matriz monitoramento que segue no visual ,e começa a rondar próximo ao açougue e perecíveis após um bom tempo abandona o carrinho com as Qtc''s', 56.83, false, 'Wesley', true, true, true, true, 'Caue', '2026-11-03 14:18:16-03', '2026-11-03 13:26:25-03', true, '[]'::jsonb),
('mw0t9bbku5t2', '2026-11-03', 'CT63', 'Interior Noroeste', 'GLOBAL DA LOJA INFORMA A MATRIZ DE UM QRA SUSPEITO COM BOLSA, COPIADO E VISTO EMPENHANDO VARIAS QTCS NA MOCHILA E DEU QTA, ABORDADO NO ESTACIONAMENTO ', 267.92, false, 'GABRIEL', true, true, true, true, 'Caue', '2026-11-03 12:25:11-03', '2026-11-03 11:56:28-03', true, '[]'::jsonb),
('mw0rnr6rhors', '2026-11-03', 'CT16', 'Interior e Campinas', 'QRU DE CARNE JA CONHECIDO DA LOJA  ENTRA NA LOJA E VAI DIRETO AO HORTFRUT, O MESMO PEGA 2 CARNE SECA E OUTROS QTCS. AO IR AO CAIXA EMPENHAR UMA CARNE SECA NA CINTURA ABANDONA OS OUTROS  QTCS PASSO A INFORMAÇÃO PARA LOJA QUE ABORDA O MESMO E RECUPERA O QTC.', 63.6, false, 'IZA', true, true, true, true, 'Caue', '2026-11-03 12:25:00-03', '2026-11-03 11:11:42-03', true, '[]'::jsonb),
('mw4895vd3hw4', '2026-11-04', 'CT14', 'Vale e Litoral Norte', 'QUADRILHA', 800.0, false, 'Deivys', true, true, true, false, '', null, '2026-11-05 21:19:34-03', false, '[]'::jsonb),
('mw2dt4tav0fc', '2026-11-04', 'CT09', 'Vale e Litoral Norte', 'Loja passa a copia do QRA que estava no corredor 13 muito entranho, o mesmo passa no corredor de 13 pega 11 barrinha de chocolate e empenha no corredor de bebidas e tenta dar QTA pela P2.', 106.42, false, 'Arthur', true, true, true, true, 'Henry', '2026-11-04 20:15:58-03', '2026-11-04 14:19:31-03', true, '[]'::jsonb),
('mw2a3r0xc26d', '2026-11-04', 'CT16', 'Interior e Campinas', 'QUADRILHA ENTRA NA LOJA, E AS BATON VAI DIRETO NA GELADEIRA DE CARNE E PEGA 4 PEÇA DE CARNE DEPOIS FICA PROCURANDO ALGUM LUGAR PARA EMPENHAR, E AS MESMA EMPENHA NO CORREDOR 5 E TENTA DAR QTA PELA P3.', 754.14, true, 'GABRIEL', true, true, true, true, 'Irakitan', '2026-11-05 11:49:06-03', '2026-11-04 12:35:48-03', true, '[]'::jsonb),
('mw2a1lp3ggr1', '2026-11-04', 'CT16', 'Interior e Campinas', 'QUADRILHA ENTRA NA LOJA, E AS BATON VAI DIRETO NA GELADEIRA DE CARNE E PEGA 4 PEÇA DE CARNE DEPOIS FICA PROCURANDO ALGUM LUGAR PARA EMPENHAR, E AS MESMA EMPENHA NO CORREDOR 5 E TENTA DAR QTA PELA P3.', 754.14, true, 'ARTHUR', true, true, true, true, 'Irakitan', '2026-11-05 11:48:48-03', '2026-11-04 12:34:08-03', true, '[]'::jsonb),
('mw3yx6sh62n1', '2026-11-05', 'CT51', 'Interior Grande SP e Litoral Sul', '.', 601.03, false, 'Deivys', true, true, true, true, 'Henry', '2026-11-05 19:41:34-03', '2026-11-05 16:58:18-03', false, '[]'::jsonb),
('mw3t8hyy6d1b', '2026-11-05', 'CT62', 'Interior e Campinas', 'furto inibido.', 89.9, false, 'Iza', true, true, true, false, '', null, '2026-11-05 14:19:08-03', true, '[]'::jsonb),
('mw3q2ra5pcbw', '2026-11-05', 'CT51', 'Interior Grande SP e Litoral Sul', 'QRU ENTRA NA LOJA COM UMA BOLSA TÉRMICA E VAI DIRETO NO CORREDOR DE CHOCOLATE E LÁ EMPENHA VÁRIAS BARRINHA DE CHOCOLATE.', 360.62, false, 'Arthur', true, true, true, true, 'Caue', '2026-11-05 14:17:34-03', '2026-11-05 12:50:42-03', true, '[]'::jsonb),
('mw51n96rk751', '2026-11-06', 'CT16', 'Interior e Campinas', 'QRU COLOCA VARIAS QTC DENTRO DO CARRINHO, O MESMO ABANDONA AS QTC  E PASSA PELO PDV COM UMA ÁGUA E UMA NUTELLA DENTRO DO BOLSO, MAS É ABORDADO NA P3.', 174.0, false, 'Iza', true, true, true, true, 'Irakitan', '2026-11-06 11:29:05-03', '2026-11-06 11:02:20-03', true, '[]'::jsonb),
('mw4zijwu8fe7', '2026-11-06', 'CT51', 'Interior Grande SP e Litoral Sul', 'qra pegou uma grande quantidade de chocolate pp da loja pede apoio para a matriz e o mesmo ao perceber que estava sendo monitorado descarta as qtc no corredor 09 ', 127.35, false, 'Steffane C.', true, true, true, true, 'Irakitan', '2026-11-06 11:28:01-03', '2026-11-06 10:02:41-03', false, '[]'::jsonb)
on conflict (id) do nothing;

insert into faceid_testes
  (id, data, regional, avaliador, resultados, "atualizadoPor")
values
('2026-10-30|Interior Grande SP e Litoral Sul', '2026-10-30', 'Interior Grande SP e Litoral Sul', 'Claudio', '{"CT17": ["", "", "", ""], "CT20": ["", "", "", ""]}'::jsonb, 'backup 2026-11-06'),
('2026-10-30|Interior e Campinas', '2026-10-30', 'Interior e Campinas', 'Douglas', '{"CT03": ["", "", "", ""], "CT16": ["", "", "", ""], "CT30": ["", "", "", ""], "CT31": ["", "", "", ""], "CT38": ["", "", "", ""], "CT50": ["", "", "", ""], "CT54": ["", "", "", ""], "CT62": ["", "", "", ""], "CT65": ["", "", "", ""], "CT66": ["", "", "", ""]}'::jsonb, 'backup 2026-11-06'),
('2026-10-30|Vale e Litoral Norte', '2026-10-30', 'Vale e Litoral Norte', 'Aparecida', '{"CT06": ["", "", "", ""], "CT08": ["", "", "", ""], "CT09": ["", "", "", ""], "CT13": ["", "", "", ""], "CT14": ["", "", "", ""], "CT15": ["", "", "", ""], "CT18": ["", "", "", ""], "CT34": ["", "", "", ""], "CT47": ["", "", "", ""], "CT48": ["", "", "", ""]}'::jsonb, 'backup 2026-11-06'),
('2026-11-02|Vale e Litoral Norte', '2026-11-02', 'Vale e Litoral Norte', 'Aparecida', '{"CT06": ["", "", "", ""]}'::jsonb, 'backup 2026-11-06'),
('2026-11-03|Interior Noroeste', '2026-11-03', 'Interior Noroeste', 'Fabio', '{"CT25": ["", "", "", ""], "CT27": ["", "", "", ""]}'::jsonb, 'backup 2026-11-06'),
('2026-11-05|Vale e Litoral Norte', '2026-11-05', 'Vale e Litoral Norte', 'Aparecida', '{"CT06": ["", "", "", ""], "CT08": ["", "", "", ""]}'::jsonb, 'backup 2026-11-06')
on conflict (id) do nothing;

commit;
