import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Address{

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: false,
        length: 30
    })
    country: string

     @Column({
        type: String,
        nullable: false,
        length: 50
    })
    province: string

     @Column({
        type: String,
        nullable: false,
        length: 40
    })
    city: string

     @Column({
        type: String,
        nullable: false,
        length: 60
    })
    street: string
}

