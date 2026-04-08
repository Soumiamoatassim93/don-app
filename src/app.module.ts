import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoryModule } from './categories/category.module';
import { DonModule } from './don/don.module';
import { FavoriteModule } from './favorites/favorite.module';
import { RequestModule } from './request/request.module';
import { User } from './users/user.entity';
import { Category } from './categories/category.entity';
import { Don } from './don/don.entity';
import { Favorite } from './favorites/favorite.entity';
import { Request } from './request/request.entity';
import { Image } from './image/image.entity';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [User,Category,Don,Favorite,Request,Image],
        synchronize: true, //  désactiver en production
      }),
    }),

    AuthModule,
    UsersModule,
    CategoryModule,
    DonModule,
    FavoriteModule,
    RequestModule,
    TrackingModule,
  ],
})
export class AppModule {}