import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Cidade, Regiao } from '../entities';

export class RegiaoSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const cidadesRepository = dataSource.getRepository(Cidade);
    const regiaoRepository = dataSource.getRepository(Regiao);

    // Array com todos os registros que você forneceu
    const regioes = [
      // Região Pouso Alegre
      { cidade: 'BORDA DA MATA', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'BRAZOPOLIS', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'CACHOEIRA DE MINAS', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'CONCEICAO DOS OUROS', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'GONCALVES', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'ITAJUBA', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'MARIA DA FE', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'PARAISOPOLIS', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'PEDRALVA', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'PIRANGUCU', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'PIRANGUINHO', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'POUSO ALEGRE', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'SANTA RITA DO SAPUCAI', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'SAO JOSE DO ALEGRE', regiao: 'Região Pouso Alegre', id_regiao: 5 },
      { cidade: 'SAPUCAI MIRIM', regiao: 'Região Pouso Alegre', id_regiao: 5 },

      // Região Poços de Caldas
      { cidade: 'AGUAS DA PRATA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'ALBERTINA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'ANDRADAS', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'BANDEIRA DO SUL', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'BOTELHOS', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'BUENO BRANDAO', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'CABO VERDE', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'CACONDE', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'CALDAS', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'CAMPESTRE', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'DIVINOLANDIA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'IBITIURA DE MINAS', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'INCONFIDENTES', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'IPUIUNA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'JACUTINGA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'MONTE BELO', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'MONTE SIAO', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'OURO FINO', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'POCOS DE CALDAS', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'SANTA RITA DE CALDAS', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'SAO JOAO DA BOA VISTA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'SAO SEBASTIAO DA GRAMA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'TAPIRATIBA', regiao: 'Região Poços de Caldas', id_regiao: 6 },
      { cidade: 'VARGEM GRANDE DO SUL', regiao: 'Região Poços de Caldas', id_regiao: 6 },

      // Região Alfenas
      { cidade: 'ALFENAS', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'ALTEROSA', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'AREADO', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'BOA ESPERANCA', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'CAMPO DO MEIO', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'CAMPOS GERAIS', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'CARMO DO RIO CLARO', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'CARVALHOPOLIS', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'CONCEICAO DA APARECIDA', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'DIVISA NOVA', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'ELOI MENDES', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'ESPIRITO SANTO DO DOURADO', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'FAMA', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'MACHADO', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'PARAGUACU', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'POCO FUNDO', regiao: 'Região Alfenas', id_regiao: 7 },
      { cidade: 'SAO JOAO DA MATA', regiao: 'Região Alfenas', id_regiao: 7 },

      // Região São Lourenço
      { cidade: 'AIURUOCA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'BAEPENDI', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'BOM JARDIM DE MINAS', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CAMBUQUIRA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CAMPANHA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CARMO DE MINAS', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CARVALHOS', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CAXAMBU', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CONCEICAO DO RIO VERDE', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CRISTINA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'CRUZILIA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'DOM VICOSO', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'ITAMONTE', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'ITANHANDU', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'JESUANIA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'LAMBARI', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'LIBERDADE', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'MINDURI', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'OLIMPIO NORONHA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'PASSA QUATRO', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'POUSO ALTO', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SANTANA DO CAPIVARI', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SAO LOURENCO', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SAO SEBASTIAO DO RIO VERDE', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SAO VICENTE DE MINAS', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SERITINGA', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SERRANOS', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'SOLEDADE DE MINAS', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'TRES CORACOES', regiao: 'Região São Lourenço', id_regiao: 8 },
      { cidade: 'VIRGINIA', regiao: 'Região São Lourenço', id_regiao: 8 },

      // Região Piumhi
      { cidade: 'ALPINOPOLIS', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'ARCOS', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'BAMBUI', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'CAPITOLIO', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'CORREGO FUNDO', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'FORMIGA', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'GUAPE', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'IGUATAMA', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'ILICINEA', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'LAGOA DA PRATA', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'PAINS', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'PIMENTA', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'PIUMHI', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'SAO JOSE DA BARRA', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'SAO ROQUE DE MINAS', regiao: 'Região Piumhi', id_regiao: 1 },
      { cidade: 'VARGEM BONITA', regiao: 'Região Piumhi', id_regiao: 1 },

      // Região Extrema
      { cidade: 'BOM REPOUSO', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'CAMANDUCAIA', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'CAMBUI', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'CAREACU', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'CONGONHAL', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'CORREGO DO BOM JESUS', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'ESTIVA', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'EXTREMA', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'ITAPEVA', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'MONTE VERDE', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'MUNHOZ', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'SAO GONCALO DO SAPUCAI', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'SAO SEBASTIAO DA BELA VISTA', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'SENADOR AMARAL', regiao: 'Região Extrema', id_regiao: 2 },
      { cidade: 'TOLEDO', regiao: 'Região Extrema', id_regiao: 2 },

      // Região Zona da Mata
      { cidade: 'ABRE CAMPO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'ALTO CAPARAO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'ALTO JEQUITIBA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'BOM JESUS DO GALHO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'CAPARAO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'CAPUTIRA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'CARANGOLA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'CARATINGA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'ESPERA FELIZ', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'IPANEMA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'LAJINHA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'LUISBURGO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'MANHUACU', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'MANHUMIRIM', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'MARTINS SOARES', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'MATIPO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'MUTUM', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'ORIZANIA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'PONTE NOVA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'REDUTO', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'RIO CASCA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SANTA BARBARA DO LESTE', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SANTA MARGARIDA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SANTA RITA DE MINAS', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SANTANA DO MANHUACU', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SANTO ANTONIO DO GRAMA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SAO JOAO DO MANHUACU', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SAO PEDRO DO AVAI', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SERECITA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SILVEIRANIA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'SIMONESIA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'UBA', regiao: 'Região Zona da Mata', id_regiao: 3 },
      { cidade: 'VILA NOVA', regiao: 'Região Zona da Mata', id_regiao: 3 },

      // Região Passos
      { cidade: 'ARCEBURGO', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'CAPETINGA', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'CASSIA', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'CLARAVAL', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'DELFINOPOLIS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'FORTALEZA DE MINAS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'GUARANESIA', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'GUAXUPE', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'IBIRACI', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'ITAMOGI', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'ITAU DE MINAS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'JACUI', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'JURUAIA', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'MONTE SANTO DE MINAS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'MUZAMBINHO', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'NEPOMUCENO', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'NOVA RESENDE', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'PASSOS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'PRATAPOLIS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'SANTANA DA VARGEM', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'SAO JOAO BATISTA DO GLORIA', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'SAO PEDRO DA UNIAO', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'SAO SEBASTIAO DO PARAISO', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'TRES PONTAS', regiao: 'Região Passos', id_regiao: 4 },
      { cidade: 'VARGINHA', regiao: 'Região Passos', id_regiao: 4 },
    ];

    for (const item of regioes) {
      try {
        // 1) Verifica se a cidade existe no banco
        const cidadeExiste = await cidadesRepository.findOneBy({
          nome: item.cidade,
        });

        // Se não achar a cidade, pula
        if (!cidadeExiste) {
          console.log(`A cidade '${item.cidade}' não existe no banco. Nenhuma alteração foi feita.`);
          continue;
        }

        // 2) Tenta encontrar a Regiao pelo nome (ou pelo ID, se você preferir)
        let regiaoEntity = await regiaoRepository.findOneBy({ nome: item.regiao });
        if (!regiaoEntity) {
          // Caso não exista, cria.
          // Se você utiliza auto-increment, *não defina* `regiao_id = item.id_regiao`,
          // apenas salve 'nome' que o ID será gerado automaticamente.
          regiaoEntity = regiaoRepository.create({
            nome: item.regiao,
            codigo: item.id_regiao,
          });
          await regiaoRepository.save(regiaoEntity);
          console.log(`Região '${item.regiao}' foi criada.`);
        }

        // 3) Atualiza a cidade apontando a regiao
        cidadeExiste.regiao = regiaoEntity;

        // 4) Salva a alteração na cidade
        await cidadesRepository.save(cidadeExiste);

        console.log(`A cidade '${cidadeExiste.nome}' foi vinculada à região '${regiaoEntity.nome}'.`);
      } catch (error) {
        console.error(`Erro ao processar a cidade '${item.cidade}':`, error);
      }
    }
  }
}
