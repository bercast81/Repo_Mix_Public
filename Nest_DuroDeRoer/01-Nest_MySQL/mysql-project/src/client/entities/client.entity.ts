import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Address } from "./address.entity";
import { IsString, Min } from "class-validator";
import { Order } from "src/order/entities/order.entity";

@Entity()
export class Client {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: false,
        length: 40
    })
    name: string
    
    @Column({
        type: String,
        nullable: false,
        unique: true,
        length: 40
    })
    email: string


    @OneToOne(()=>Address, {cascade: ['insert', 'update'], eager: true})
    @JoinColumn()
    address: Address

    @OneToMany(()=> Order,
                order=> order.client, {eager: true})
    orders: Order[]
}
