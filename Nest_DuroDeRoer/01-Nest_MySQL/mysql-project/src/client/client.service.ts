import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

@Injectable()
export class ClientService {


  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>

  ){}

 async create(client: CreateClientDto) {
    const clientExists = await this.findClient(client)

    if(clientExists){
      if(clientExists.id){
        throw new BadRequestException("El cliente con este id ya existe")
      }else {
        throw new BadRequestException("El cliente con este mail ya existe")
      }
   }

     let addressExists: Address | null = null

     try {
      if(client.address.id){
        addressExists = await this.addressRepository.findOne({
          where: {
            id: client!.address.id
          }
        })
      }else{
        addressExists = await this.addressRepository.findOne({
          where:{
            country: client.address.country,
            province: client.address.province,
            city: client.address.city,
            street: client.address.street
          }
        })
      }

      if(addressExists) throw new ConflictException('Esta dirección ya está registrada')
     
        return this.clientRepository.save(client)
    
    } catch (error) {
      
      throw new Error(error)
     }
  }

  async findClient(client: CreateClientDto){
    return await this.clientRepository.findOne({
      where: [
        {id: client.id},
        {email: client.email}
      ]
    })
  }

  async findAll() {
    return await this.clientRepository.find({})
  }

  async findOne(id: number) {
   const clientExists = await this.clientRepository.findOne({
    where: {id}
   })

   if(!clientExists) throw new BadRequestException("El cliente no existe")

    return clientExists
  }

  async update(client: UpdateClientDto) {
  
    const clientWithEmail = await this.clientRepository.findOne({
    where: { email: client.email },
  });

  if (clientWithEmail && clientWithEmail.id !== client.id) {
    throw new ConflictException('El id no coincide con el cliente registrado');
  }

  
  const clientExists = await this.clientRepository.findOne({
    where: { id: client.id },
    relations: ['address'], // Asegúrate de cargar address si es necesario
  });

  if (!clientExists) {
    throw new BadRequestException('El cliente no existe');
  }

  let addressExists: Address | null = null;
  let deletedAddress= false

  if (client.address?.id) {
    addressExists = await this.addressRepository.findOne({
      where: { id: client.address.id },
    });
  } else {
    addressExists = await this.addressRepository.findOne({
      where: {
        country: client.address?.country,
        province: client.address?.province,
        city: client.address?.city,
        street: client.address?.street,
      },
    });
  }

  if (
    addressExists &&
    addressExists.id !== clientExists.address?.id // Compara solo si el cliente tiene dirección
  ) {
    throw new ConflictException('La dirección ya existe');
  }else{
    deletedAddress = true
  }

  // Si todo está bien, actualiza el cliente
  const updatedClient= await this.clientRepository.save({ ...clientExists, ...client });

  if(deletedAddress){
    await this.addressRepository.delete({id: clientExists.address.id})
  }

  return updatedClient
}

  async remove(id: number) {
    const clientExists = await this.clientRepository.findOne({
      where: {id}
    })

    if(!clientExists) throw new BadRequestException("El cliente no existe")

    const rows = await this.clientRepository.delete({id})

    if(rows.affected === 1){
      await this.addressRepository.delete({id: clientExists.address.id})
    }

    return
  }
}


