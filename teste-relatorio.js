#!/usr/bin/env node

/**
 * Script de teste para o sistema de relatórios semanais
 * 
 * Como usar:
 * node teste-relatorio.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function testarRelatorio() {
    console.log('🚀 Iniciando teste do sistema de relatórios...\n');

    const baseUrl = 'http://localhost:3000';
    const startDate = '2025-01-06';
    const endDate = '2025-01-12';

    // Testar PDF
    console.log('📄 Testando geração de relatório PDF...');
    try {
        const pdfUrl = `${baseUrl}/reports/weekly?startDate=${startDate}&endDate=${endDate}&format=pdf`;
        await baixarArquivo(pdfUrl, `relatorio_semanal_${startDate}_${endDate}.pdf`);
        console.log('✅ PDF gerado com sucesso!\n');
    } catch (error) {
        console.error('❌ Erro ao gerar PDF:', error.message, '\n');
    }

    // Testar Excel
    console.log('📊 Testando geração de relatório Excel...');
    try {
        const xlsxUrl = `${baseUrl}/reports/weekly?startDate=${startDate}&endDate=${endDate}&format=xlsx`;
        await baixarArquivo(xlsxUrl, `relatorio_semanal_${startDate}_${endDate}.xlsx`);
        console.log('✅ Excel gerado com sucesso!\n');
    } catch (error) {
        console.error('❌ Erro ao gerar Excel:', error.message, '\n');
    }

    console.log('🎉 Teste concluído! Verifique os arquivos gerados na pasta atual.');
}

function baixarArquivo(url, nomeArquivo) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(nomeArquivo);
        
        http.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                const stats = fs.statSync(nomeArquivo);
                console.log(`   💾 Arquivo salvo: ${nomeArquivo} (${Math.round(stats.size / 1024)}KB)`);
                resolve();
            });
        }).on('error', (error) => {
            fs.unlink(nomeArquivo, () => {});
            reject(error);
        });
    });
}

// Verificar se servidor está rodando
async function verificarServidor() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function main() {
    console.log('🔍 Verificando se o servidor está rodando...');
    
    const servidorRodando = await verificarServidor();
    
    if (!servidorRodando) {
        console.log('❌ Servidor não está rodando na porta 3000!');
        console.log('   Inicie o servidor com: npm run start:dev');
        console.log('   Aguarde alguns segundos para o JsReport inicializar.');
        return;
    }
    
    console.log('✅ Servidor está rodando!\n');
    await testarRelatorio();
}

main().catch(console.error);