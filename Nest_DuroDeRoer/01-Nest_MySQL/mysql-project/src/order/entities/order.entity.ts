import { Client } from "src/client/entities/client.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id?: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @Column({
        type: Date,
        nullable: true
    })
    confirmAt: Date

    @ManyToOne(()=> Client,
                client=> client.orders, 
                {eager:true}
                )
    client: Client

    @ManyToMany(()=> Product, {eager:true})
    @JoinTable({name: 'order_products'}) //le especifico el nombre del campo de la tabla
    products: Product[]
                
}

