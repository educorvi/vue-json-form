import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Group } from './entities/Group';
import { Form } from './entities/Form';
import { FormRevision } from './entities/FormRevision';
import { Permission } from './entities/Permission';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'form_builder',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [User, Group, Form, FormRevision, Permission],
});
