import type { User } from "@/modules/auth/interfaces/user.interface";

export interface Product {
    id:          string;
    title:       string;
    price:       number;
    description: string;
    slug:        string;
    stock:       number;
    sizes:       Size[];
    gender:      Gender;
    tags:        string[]; //arreglo de strings
    images:      string[];
    user:        User;
}

export enum Gender {
    Kid = "kid",
    Men = "men",
    Women = "women",
}

export enum Size {
    L = "L",
    M = "M",
    S = "S",
    Xl = "XL",
    Xs = "XS",
    Xxl = "XXL",
}

export enum Tag {
    Hoodie = "hoodie",
    Shirt = "shirt",
    Sweatshirt = "sweatshirt",
}


{/*export enum Email {
    Test1GoogleCOM = "test1@google.com",
}

export enum FullName {
    TestOne = "Test One",
}

export enum Role {
    Admin = "admin",
}*/}
