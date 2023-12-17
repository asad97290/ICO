import { Controller, Get,Post,Body,Param,Query } from '@nestjs/common';
import { AppService } from './app.service';
import { BodyDto, ParamsDto,ResponseDto } from './dto';


@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('getTxDetails/:address')
  getTxDetails(@Param() params:ParamsDto): Promise<ResponseDto> {
    return this.appService.getTxDetails(params.address);
  }



  @Post('saveTxData')
  saveTxData(@Body() body:BodyDto):Promise<ResponseDto> {
    return this.appService.saveTxData(body);
  }
}
