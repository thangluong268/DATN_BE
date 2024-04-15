import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EMAIL_ADMIN, PASSWORD_ADMIN, SALT_ROUNDS } from 'app.config';
import * as bcrypt from 'bcrypt';
import { Category } from 'domains/category/schema/category.schema';
import { seedDataPolicy } from 'domains/policy/data-seed/data-seed';
import { Policy } from 'domains/policy/schema/policy.schema';
import { User } from 'domains/user/schema/user.schema';
import { Model } from 'mongoose';
import { ROLE_NAME } from 'shared/enums/role-name.enum';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,

    @InjectModel(Policy.name)
    private readonly policyModel: Model<Policy>,
  ) {}

  async onModuleInit() {
    const adminExists = await this.userModel.countDocuments();
    if (adminExists === 0) {
      this.seedAdmin();
    }

    const categoriesExists = await this.categoryModel.countDocuments();
    if (categoriesExists === 0) {
      this.seedCategories();
    }

    const policyExists = await this.policyModel.countDocuments();
    if (policyExists === 0) {
      this.seedPolicy();
    }
  }

  async seedAdmin() {
    const hashedPassword = await bcrypt.hash(PASSWORD_ADMIN, SALT_ROUNDS);
    await this.userModel.create({
      avatar: '',
      fullName: 'Admin',
      email: EMAIL_ADMIN,
      address: [],
      phone: '',
      gender: 'Khác',
      birthday: new Date(),
      password: hashedPassword,
      role: [ROLE_NAME.ADMIN],
      socialId: null,
      socialApp: null,
    });
  }

  async seedCategories() {
    await this.categoryModel.create([
      {
        name: 'Đồ Chơi - Mẹ & Bé',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/13/64/43/226301adcc7660ffcf44a61bb6df99b7.png.webp',
      },
      {
        name: 'Đồ điện tử',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/54/c0/ff/fe98a4afa2d3e5142dc8096addc4e40b.png.webp',
      },
      {
        name: 'Đồ gia dụng, nội thất, cây cảnh',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/61/d4/ea/e6ea3ffc1fcde3b6224d2bb691ea16a2.png.webp',
      },
      {
        name: 'Thời trang, đồ dùng cá nhân',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/cf/ed/e1/96216aae6dd0e2beeb5e91d301649d28.png.webp',
      },
      {
        name: 'Đồ dùng văn phòng',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/75/34/29/d900f845e51e95a2c41b5b035468f959.png.webp',
      },
      {
        name: 'Xe cộ',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/69/f5/36/c6cd9e2849854630ed74ff1678db8f19.png.webp',
      },
      {
        name: 'Điện lạnh',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/c8/82/d4/64c561c4ced585c74b9c292208e4995a.png.webp',
      },
      {
        name: 'Giải trí, thể thao, sở thích',
        url: 'https://salt.tikicdn.com/cache/100x100/ts/category/0b/5e/3d/00941c9eb338ea62a47d5b1e042843d8.png.webp',
      },
      {
        name: 'Thú cưng',
        url: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fstatic.chotot.com%2Fstorage%2Fchapy-pro%2Fnewcats%2Fv8%2F12000.png&w=256&q=95',
      },
      {
        name: 'Cho tặng miễn phí',
        url: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fstatic.chotot.com%2Fstorage%2Fchapy-pro%2Fnewcats%2Fv8%2Fcho-tang-mien-phi.png&w=256&q=95',
      },
    ]);
  }

  async seedPolicy() {
    await this.policyModel.create(seedDataPolicy());
  }
}
