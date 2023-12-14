import { Controller, Get,Post,Body,Param,Query } from '@nestjs/common';
import { AppService } from './app.service';
import { BodyDto, ParamsDto, QueryDto } from './dto';


@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('user/:id')
  getHello(@Param() params:ParamsDto): string {
    return this.appService.getHello(params.id);
  }

  @Get()
  getQuery(@Query() query:QueryDto): string {
    return this.appService.getHello(query.id);
  }

  @Post()
  setHello(@Body() body:BodyDto):string {
    return this.appService.setHello(body.name);
  }
}
