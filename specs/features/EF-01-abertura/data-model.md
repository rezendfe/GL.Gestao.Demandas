# Modelo — EF-01

Schema `app`. A feature grava a demanda e lê catálogo e locação. Não cria tabela própria de áudio.

| Tabela | Uso nesta feature |
|---|---|
| Demanda | Protocolo, descrição, local, ponto, categoria, subcategoria, empresa, situação inicial |
| Regra_Classificacao | Sugestão de categoria quando o modelo não devolve nome do catálogo |
| Locacao, Espaco | Local da abertura: um aluguel vigente já vem preenchido |
| Categoria, Subcategoria | Seleção e obrigatoriedade da subcategoria em Manutenção |

Leitura da fala (`LeituraSolicitacao`) não é tabela.
