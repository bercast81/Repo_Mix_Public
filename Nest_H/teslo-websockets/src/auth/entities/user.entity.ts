import { IsEmail, IsString } from "class-validator";
import { Product } from "src/products/entities/product.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id: string


    @Column({
        type: 'text'
    })
    fullName: string

    @Column('text',{
        select: false //para que no me lo devuelva en la peticion
    })
    password: string

    @Column({
        type: 'text',
        unique: true
    })
    email: string

    @Column({
        type: 'bool',
        default: true
    })
    isActive: boolean

    @Column({
        type: 'text',
        array: true,
        default: ['user']
    })
    roles: string[]

    @OneToMany(
        ()=> Product,
        (product)=> product.user,
        {eager: true}
    )
    product: Product

    @BeforeInsert()
    checkFieldsBeforeInsert(){
        this.email = this.email.toLowerCase().trim()
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate(){
        this.checkFieldsBeforeInsert()
    }
}
