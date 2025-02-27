import { Controller, Get, Query, Res } from '@nestjs/common';
import { TinyTokenService } from '../services/tiny-token.service';

@Controller('tiny')
export class TinyAuthController {
    constructor(private readonly tinyTokens: TinyTokenService) {}

    @Get('delete')
    async deleteTokens(){
        await this.tinyTokens.deleteToken()
        return { message: 'Tokens delete' };
    }
}
