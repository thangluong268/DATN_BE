import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ELASTICSEARCH_PRODUCTS_INDEX } from 'app.config';
import { Product } from 'domains/product/schema/product.schema';

@Injectable()
export class ESService {
  private readonly logger = new Logger(ESService.name);
  constructor(private readonly elasticSearchService: ElasticsearchService) {}
  public async createIndex() {
    this.logger.log('Creating index products...');
    const index = ELASTICSEARCH_PRODUCTS_INDEX;
    const checkIndex = (await this.elasticSearchService.indices.exists({ index })) as any;
    if (checkIndex.statusCode === 404) {
      try {
        this.elasticSearchService.indices.create({
          index,
          body: {
            mappings: {
              properties: {
                name: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                  analyzer: 'autocomplete',
                  search_analyzer: 'standard',
                },
                description: {
                  type: 'text',
                  fields: {
                    keyword: {
                      type: 'keyword',
                      ignore_above: 256,
                    },
                  },
                },
                keywords: {
                  properties: {
                    keyword: {
                      type: 'text',
                      fields: {
                        keyword: {
                          type: 'keyword',
                          ignore_above: 256,
                        },
                      },
                      analyzer: 'autocomplete',
                      search_analyzer: 'standard',
                    },
                  },
                },
              },
            },
            settings: {
              analysis: {
                filter: {
                  autocomplete_filter: {
                    type: 'edge_ngram',
                    min_gram: 1,
                    max_gram: 20,
                  },
                },
                analyzer: {
                  autocomplete: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'autocomplete_filter'],
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        this.logger.error('Error creating index products', error.message);
      }
    }
  }
  public async indexProduct(product: Product) {
    return await this.elasticSearchService.index({
      index: ELASTICSEARCH_PRODUCTS_INDEX,
      body: product,
    });
  }
  public async remove(productId: string) {
    this.elasticSearchService.deleteByQuery({
      index: ELASTICSEARCH_PRODUCTS_INDEX,
      body: {
        query: {
          match: {
            id: productId,
          },
        },
      },
    });
  }
}
