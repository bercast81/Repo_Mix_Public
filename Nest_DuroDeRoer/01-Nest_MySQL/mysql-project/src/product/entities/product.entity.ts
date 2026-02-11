import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
  
        @PrimaryGeneratedColumn()
        id: number
    
        @Column({
        type: String,
        nullable: false, 
        length: 40
        })
        name: string
    
        @Column({
            type: Number,
            nullable: false, 
            default: 0
        })
        stock: number
    
         @Column({
            type: Number,
            nullable: false,
            default: 0
        })
        price: number
    
        @Column({
            type: Boolean,
            nullable: false, 
            default: false
        })
        deleted: boolean

        @Column({
            type: String,
            nullable: false,
            unique: true
        })
        friendlySearch: String

        @BeforeInsert()
        @BeforeUpdate()
        getSearchFriendly(){
            this.friendlySearch = this.name.toLowerCase().replaceAll(" ", "_").replaceAll("'", "")
        }
}
