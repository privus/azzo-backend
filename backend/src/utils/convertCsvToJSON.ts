import * as fs from 'fs';
import * as path from 'path';

// Função para ler e converter o conteúdo do CSV
function convertCsvToJSON(csvFilePath: string, jsonFilePath: string) {
  const fileContent = fs.readFileSync(path.resolve(csvFilePath), 'utf-8');
  const outputJsonPath = path.resolve(jsonFilePath);

  // Regex para capturar os dados no formato SQL: (id, 'nome', 'sigla')
  const regex = /\((\d+),\s*'([^']+)',\s*(\d+)\)/g;
  const result = [];
  let match;

  while ((match = regex.exec(fileContent)) !== null) {
    result.push({
      cidade_id: parseInt(match[1], 10),
      nome: match[2],
      estado_id: parseInt(match[3], 10),
    });
  }

  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf-8');
  return result;
}

// Defina o caminho para o arquivo CSV com os dados SQL
const csvFilePath = './cidades.csv';
const jsonFilePath = './cidades.json';

// Converta os dados e exiba como JSON
const jsonData = convertCsvToJSON(csvFilePath, jsonFilePath);
console.log(JSON.stringify(jsonData, null, 2));
