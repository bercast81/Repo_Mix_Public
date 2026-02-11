import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";
import { User } from "src/auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({name: 'products'})
export class Product {
    
    @ApiProperty({
        example: '9a87a878s98-323ad4m4-3j3j3--Sa86ghs6rs', //uuid
        description: 'Product ID',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string
    
    @ApiProperty({
        example: 'T-Shirt Teslo',
        description: 'Product title',
        uniqueItems: true
    })
    @Column({
        type: 'text',
        unique: true
    })
    title: string

    @ApiProperty()
    @Column({
        type: 'float',
        default: 0
    })
    price: number

    @ApiProperty()
    @Column({
        type: 'text',
        nullable: true
    })
    description: string

    @ApiProperty()
    @Column({
        type: 'text',
        unique: true
    })
    slug: string

    @ApiProperty()
    @Column({
        type: 'int',
        default: 0
    })
    stock: number

    @ApiProperty()
    @Column({
        type: 'text',
        array: true
    })
    sizes: string[]

    @ApiProperty()
    @Column({
        type: 'text'
    })
    gender: string

    @ApiProperty()
    @Column({
        type: 'text',
        array: true,
        default: []
    })
    tags: string[]

    @ApiProperty()
    @OneToMany(
        ()=> ProductImage,
        productImage=> productImage.product,
        {cascade: true, eager: true}
    )
    images: ProductImage[]

    @ApiProperty()
    @ManyToOne(
        ()=> User,
        (user)=> user.product
    )
    user: User
    
    @BeforeInsert()
    checkSlugInsert(){
        if(!this.slug){
            this.slug = this.title //si no viene el slug guardo el titulo en slug
        }

        this.slug = this.slug
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll("'", "")
    }

    @BeforeUpdate()
    checkSlugUpdate(){
        this.slug= this.slug
        .toLowerCase()
        .replaceAll(" ", "_")
        .replaceAll(" ", "")
    }
}
