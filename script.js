const XLSX = require('xlsx');

function processarPlanilhaComTodasRegras(caminhoArquivoEntrada, caminhoArquivoSaida, colunasDesejadas, sheetIndex = 0) {
    try {
        // 1. Ler o arquivo XLSX existente
        const workbook = XLSX.readFile(caminhoArquivoEntrada);

        // 2. Acessar a planilha desejada (padrão é a primeira)
        const sheetName = workbook.SheetNames[sheetIndex];
        const worksheet = workbook.Sheets[sheetName];

        // 3. Converter a planilha para um array de arrays (linhas e colunas)
        const dadosPlanilha = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (dadosPlanilha.length === 0) {
            console.warn('A planilha está vazia. Nenhum dado para processar.');
            const novoWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(novoWorkbook, XLSX.utils.aoa_to_sheet([colunasDesejadas]), sheetName);
            XLSX.writeFile(novoWorkbook, caminhoArquivoSaida);
            return;
        }

        // A primeira linha geralmente contém os cabeçalhos
        const cabecalhos = dadosPlanilha[0];
        const indicesColunasDesejadas = {};

        // Mapear os índices das colunas desejadas
        colunasDesejadas.forEach(colName => {
            const index = cabecalhos.findIndex(h => h && typeof h === 'string' && h.trim().toLowerCase() === colName.toLowerCase());
            if (index !== -1) {
                indicesColunasDesejadas[colName] = index;
            } else {
                console.warn(`Coluna "${colName}" não encontrada na planilha. Ela será ignorada.`);
            }
        });

        // Verificar se as colunas essenciais foram encontradas
        if (Object.keys(indicesColunasDesejadas).length === 0) {
            console.error('Nenhuma das colunas desejadas foi encontrada na planilha. Verifique os nomes das colunas.');
            return;
        }

        const novasLinhas = [];
        // Adicionar os cabeçalhos das colunas desejadas como a primeira linha da nova planilha
        const novosCabecalhos = colunasDesejadas.filter(colName => indicesColunasDesejadas.hasOwnProperty(colName));
        if (novosCabecalhos.length > 0) {
            novasLinhas.push(novosCabecalhos);
        }
        
        // Iterar pelas linhas a partir da segunda (ignorando o cabeçalho original)
        for (let i = 1; i < dadosPlanilha.length; i++) {
            const linhaOriginal = dadosPlanilha[i];
            const novaLinha = [];
            let deveRemoverLinha = false; // Flag geral para controle de remoção da linha

            // Preencher a nova linha com os dados das colunas desejadas
            // E aplicar as regras de limpeza e verificação
            novosCabecalhos.forEach(colName => {
                const originalIndex = indicesColunasDesejadas[colName];
                let cellValue = linhaOriginal[originalIndex]; 

                if (colName.toLowerCase() === 'phone' && cellValue !== null && cellValue !== undefined) {
                    let stringValue = String(cellValue);
                    
                    // 1. NOVA REGRA: Remover todos os caracteres em branco da coluna Phone
                    // \s+ corresponde a um ou mais caracteres de espaço em branco (espaços, tabs, quebras de linha)
                    stringValue = stringValue.replace(/\s+/g, ''); 

                    // 2. REGRA DE LIMPEZA: Remover "(", ")", "9999999" e "00000" da coluna Phone
                    stringValue = stringValue.replace(/[\(\)]|9999999|00000/g, '');
                    
                    // 3. REGRA DE REMOÇÃO DE LINHAS: Checar se começa com "999999" ou "00000" (APÓS A LIMPEZA)
                    if (stringValue.startsWith('999999') || stringValue.startsWith('00000')) {
                        deveRemoverLinha = true; // Marca a linha para remoção
                    }

                    // 4. REGRA DE REMOÇÃO DE LINHAS: Checar se contém hífen (APÓS A LIMPEZA)
                    if (stringValue.includes('-')) {
                        deveRemoverLinha = true; // Marca a linha para remoção
                    }

                    cellValue = stringValue; // Atualiza o valor da célula com a versão limpa
                }
                
                novaLinha.push(cellValue !== undefined ? cellValue : '');
            });
            
            // Se a linha já foi marcada para remoção por qualquer uma das condições, pule-a
            if (deveRemoverLinha) {
                continue; 
            }

            // Remova linhas que sejam completamente vazias (das colunas selecionadas)
            const linhaDadosEstaVazia = novaLinha.every(cell =>
                cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '')
            );

            if (!linhaDadosEstaVazia) {
                novasLinhas.push(novaLinha);
            }
        }
        
        // Se a nova planilha contiver apenas os cabeçalhos e nenhum dado, considere-a vazia
        if (novasLinhas.length === 1 && novasLinhas[0].length === 0) {
             console.warn('Após a filtragem, a planilha resultante contém apenas cabeçalhos ou está vazia.');
             const novoWorkbook = XLSX.utils.book_new();
             XLSX.utils.book_append_sheet(novoWorkbook, XLSX.utils.aoa_to_sheet([colunasDesejadas]), sheetName);
             XLSX.writeFile(novoWorkbook, caminhoArquivoSaida);
             return;
        }


        // 5. Criar uma nova planilha a partir das linhas filtradas e com colunas selecionadas
        const novaWorksheet = XLSX.utils.aoa_to_sheet(novasLinhas);

        // 6. Criar um novo workbook e adicionar a nova planilha
        const novoWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(novoWorkbook, novaWorksheet, sheetName); // Mantém o nome da planilha original

        // 7. Salvar o novo arquivo XLSX
        XLSX.writeFile(novoWorkbook, caminhoArquivoSaida);

        console.log(`Arquivo XLSX processado e salvo em: ${caminhoArquivoSaida}`);

    } catch (error) {
        console.error('Ocorreu um erro ao processar o arquivo XLSX:', error);
        console.error('Certifique-se de que o arquivo de entrada existe e está no formato correto.');
    }
}

// --- Exemplo de Uso ---
// Crie um arquivo 'contatos_final_com_espacos.xlsx' com dados para teste:
//
// | ID | Nome       | Email             | Phone          | Data           |
// |----|------------|-------------------|----------------|----------------|
// | 1  | Teste A    | a@example.com     | (11) 98765 4321| 2024-01-15     | <- Phone limpo para '11987654321', linha mantida
// | 2  | Teste B    | b@example.com     | 999999 12345   | 2024-02-20     | <- Phone limpo para '12345', linha REMOVIDA (começa com 999999)
// | 3  | Teste C    | c@example.com     | 00000 67890    | 10/03/2024     | <- Phone limpo para '67890', linha REMOVIDA (começa com 00000)
// | 4  | Teste D    | d@example.com     | (44)00000-5678 |                | <- Phone limpo para '44-5678', linha REMOVIDA (começa com 00000 E tem hífen)
// | 5  | Teste E    | e@example.com     | 12345- 6789    | 10/05/2024     | <- Phone limpo para '12345-6789', linha REMOVIDA (tem hífen)
// | 6  | Teste F    | f@example.com     | 45999 887766   | 2024/06/23     | <- Phone mantido, linha mantida
// | 7  | Teste G    | g@example.com     | 99999 887766   |                | <- Phone mantido, linha mantida (NÃO COMEÇA COM 999999)
// | 8  | Teste H    | h@example.com     | 00001 2345     |                | <- Phone mantido, linha mantida (NÃO COMEÇA COM 00000)
//
const arquivoEntrada = '/home/dev/workspace/labs/remove-invalid-contacts-from-xlsx/dados_entrada.xlsx';
const arquivoSaida = '/home/dev/workspace/labs/remove-invalid-contacts-from-xlsx/dados_saida.xlsx';
const colunasParaManter = ['Nome', 'Phone']; // Adicionei mais colunas para mostrar que só o 'Phone' é afetado

processarPlanilhaComTodasRegras(arquivoEntrada, arquivoSaida, colunasParaManter);
