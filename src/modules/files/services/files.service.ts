import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Arquivo, Venda } from '../../../infrastructure/database/entities';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(Arquivo) private readonly arquivoRepository: Repository<Arquivo>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
  ) {}
  async saveMultipleFilesMetadata(files: Express.Multer.File[], id: number) {
    const venda = await this.vendaRepository.findOneByOrFail({ venda_id: id });

    const arquivos = files.map(file =>
      this.arquivoRepository.create({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date(),
        venda: venda,
      }),
    );
    venda.anexo = 1;
    await this.vendaRepository.save(venda);
    return this.arquivoRepository.save(arquivos);
  }

  async getArquivosByVenda(id: number) {
    return this.arquivoRepository.find({
      where: { venda: { venda_id: id } },
    });
  }
  
}
