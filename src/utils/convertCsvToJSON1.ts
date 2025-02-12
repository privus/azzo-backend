const fs = require('fs');
const path = require('path');

// Função para analisar corretamente as linhas do CSV
function parseCsvLine(line) {
  const result = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"'; // Aspas duplas dentro de um campo
          i++;
        } else {
          inQuotes = false; // Fecha o campo
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ';') {
        result.push(field.trim()); // Adiciona o campo atual
        field = '';
      } else {
        field += char;
      }
    }
  }
  result.push(field.trim()); // Adiciona o último campo
  return result;
}

// Função para converter CSV para JSON
function convertCsvToJson(csvFilePath, jsonFilePath) {
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvContent.split(/\r?\n/);

  if (lines.length < 2) {
    throw new Error('O arquivo CSV não possui dados suficientes.');
  }

  const headers = parseCsvLine(lines[0]); // Obtém os cabeçalhos
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue; // Ignora linhas vazias

    const fields = parseCsvLine(line);
    const obj = {};

    headers.forEach((header, index) => {
      obj[header] = fields[index] || null; // Adiciona campos ao objeto
    });

    data.push(obj);
  }

  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Arquivo JSON salvo em: ${jsonFilePath}`);
  return data;
}

// Caminhos dos arquivos
const csvFilePath = path.resolve(__dirname, 'clientes-transformados.csv'); // Nome do arquivo CSV
const jsonFilePath = path.resolve(__dirname, 'clientes-azzo-table.json'); // Nome do arquivo JSON

// Executa a conversão
try {
  const jsonData = convertCsvToJson(csvFilePath, jsonFilePath);
  console.log(JSON.stringify(jsonData, null, 2));
} catch (error) {
  console.error('Erro ao converter CSV para JSON:', error.message);
}
