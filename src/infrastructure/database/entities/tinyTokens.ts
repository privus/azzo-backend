import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tiny_tokens')
export class TinyTokens {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('text')
    access_token: string;

    @Column('text')
    refresh_token: string;

    @Column('varchar', { length: 5 })
    uf: string;

    @Column('timestamp')
    expires_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}