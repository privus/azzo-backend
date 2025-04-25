import {
    Controller,
    Get,
    Param,
    Post,
    UploadedFiles,
    UseInterceptors,
  } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileService } from '../services/files.service';
import { ApiOperation } from '@nestjs/swagger';
  
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}
  
  @ApiOperation({ summary: 'Upload de Nfe e boleto' })
  @Post('upload/:id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/nfInvoices',
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const originalName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const safeName = `${timestamp}-${originalName}`;
          cb(null, safeName);
        }
      }),
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
      fileFilter: (req, file, cb) => {
          if (file.mimetype !== 'application/pdf') {

          cb(new Error('Only XML files are allowed!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadMultipleFiles(@Param('id') id: number,@UploadedFiles() files: Express.Multer.File[]) {
    return this.fileService.saveMultipleFilesMetadata(files, id);
  }

  @Get('venda/:id')
  async getArquivosPorVenda(@Param('id') id: number) {
    return this.fileService.getArquivosByVenda(id);
  }
}
  