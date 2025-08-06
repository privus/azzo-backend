import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class OmieService {
    private readonly logger = new Logger(OmieService.name);
    private clientKey: string;
    private clientSecret: string;

    constructor(
        private readonly httpService: HttpService,
    ) {}
}
