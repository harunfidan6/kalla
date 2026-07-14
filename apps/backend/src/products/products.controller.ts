import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Products & Menu')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Tüm menü kategorilerini listeler' })
  @ApiResponse({ status: 200, description: 'Kategoriler listelendi.' })
  async getCategories() {
    return this.productsService.findAllCategories();
  }

  @Get()
  @ApiOperation({ summary: 'Tüm satışta olan ürünleri veya bir kategoriye ait ürünleri listeler' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrelemek için kategori ID' })
  @ApiResponse({ status: 200, description: 'Ürünler listelendi.' })
  async getProducts(@Query('categoryId') categoryId?: string) {
    return this.productsService.findAllProducts(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Belirli bir ürünün detayını döner' })
  @ApiResponse({ status: 200, description: 'Ürün detayı.' })
  @ApiResponse({ status: 404, description: 'Ürün bulunamadı.' })
  async getProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }
}
