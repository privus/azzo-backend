import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('bling_tokens')
export class BlingTokens {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column('text')
    access_token: string;

    @Column('text')
    refresh_token: string;

    @Column('varchar', { length: 10 })
    company: string;

    @Column('timestamp')
    expires_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}