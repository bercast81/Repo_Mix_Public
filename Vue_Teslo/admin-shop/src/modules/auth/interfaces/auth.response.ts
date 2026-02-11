import type { User } from "./user.interface";

export interface AuthResponse {
    user:  User;
    token: string;
}

//es el mismo User que el de user.interface.ts

{/*export interface User {
    id:       string;
    email:    string;
    fullName: string;
    isActive: boolean;
    roles:    string[];
}*/}