# Processador de Planilhas XLSX

Esta aplicação Angular permite processar planilhas XLSX, removendo contatos inválidos com base em regras específicas.

## Funcionalidades

- Upload de arquivos XLSX
- Processamento automático de números de telefone
- Remoção de contatos inválidos:
  - Números que começam com "999999" ou "00000"
  - Números que contêm hífen
  - Números com caracteres especiais como parênteses
- Download da planilha processada

## Regras de Processamento

O processamento segue as mesmas regras do script original em Node.js:

1. Remove todos os caracteres de espaço em branco da coluna "Phone"
2. Remove parênteses, "9999999" e "00000" da coluna "Phone"
3. Remove linhas cujo número de telefone começa com "999999" ou "00000" (após a limpeza)
4. Remove linhas cujo número de telefone contém hífen (após a limpeza)
5. Remove linhas completamente vazias

## Tecnologias Utilizadas

- Angular 20
- Tailwind CSS para estilização
- Biblioteca xlsx para manipulação de arquivos Excel

## Como Usar

1. Execute a aplicação Angular:
   ```
   cd angular-app
   ng serve
   ```

2. Acesse a aplicação em http://localhost:4200

3. Faça upload de uma planilha XLSX contendo uma coluna chamada "Phone"

4. Clique no botão "Processar Planilha"

5. A planilha processada será baixada automaticamente

## Estrutura do Projeto

- `src/app/app.ts` - Componente principal com a interface do usuário
- `src/app/excel-processing.service.ts` - Serviço responsável pelo processamento das planilhas
- `src/styles.css` - Estilos globais com configuração do Tailwind CSS

## Verificação das Funcionalidades

Para verificar que todas as funcionalidades estão funcionando corretamente:

1. Crie uma planilha de teste com dados variados, incluindo:
   - Números de telefone válidos
   - Números de telefone inválidos (iniciando com 999999 ou 00000)
   - Números de telefone com hífen
   - Números de telefone com parênteses
   - Linhas vazias

2. Faça upload da planilha e processe-a

3. Verifique que:
   - Os números de telefone foram limpos corretamente
   - As linhas inválidas foram removidas
   - As linhas válidas foram mantidas
   - O download da planilha processada foi realizado com sucesso
   - Mensagens de sucesso/erro são exibidas adequadamente

## Personalização

Você pode personalizar as regras de processamento modificando o método `processXlsxFile` no `ExcelProcessingService`.
