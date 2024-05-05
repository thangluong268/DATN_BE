import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ELASTICSEARCH_NODE } from 'app.config';
import { ESService } from './elastic-search.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useFactory: () => ({
        node: ELASTICSEARCH_NODE,
        maxRetries: 10,
        requestTimeout: 60000,
      }),
    }),
  ],
  providers: [ESService],
  exports: [ElasticsearchModule, ESService],
})
// export class ElasticSearchModule implements OnModuleInit {
//   constructor(private readonly esService: ESService) {}
//   public async onModuleInit() {
//     await this.esService.createIndex();
//   }
// }
export class ElasticSearchModule {}
