import {Manager, Socket} from 'socket.io-client'

let socket: Socket

export const connectToServer = (token: string)=>{
    const manager = new Manager('localhost:3000/socket.io/socket.io.js', {
        extraHeaders:{
            authentication: token 
        }
    })

    socket?.removeAllListeners()
    socket = manager.socket('/') //conexión al namespace

    addListeners()
}


const addListeners = () =>{
    const serverStatusLabel = document.querySelector('#server-status')!
    const clientsUL= document.querySelector('#clients-ul')!
    const messageForm = document.querySelector<HTMLFormElement>('#message-form')!
    const messageInput = document.querySelector<HTMLInputElement>('#message-input')!
    const messageUl = document.querySelector<HTMLUListElement>('#messages-ul')!

    socket.on('connect', ()=>{
        serverStatusLabel.innerHTML = 'connected'
    })

    socket.on('disconnect', ()=>{
        serverStatusLabel.innerHTML = 'disconnected'

    })

    socket.on('clients-updated', (clients: string[])=>{
        let clientsHTML=''

        clients.forEach(clientId=>{
            clientsHTML += `
            <li>${clientId}</li>`
        }) 

        clientsUL.innerHTML = clientsHTML
    })

    //voy a estar escuchando el evento submit del formulario (cuando alguien le de al intro)
    messageForm.addEventListener('submit', (event)=>{
        event.preventDefault()
        if(messageInput.value.trim().length <= 0) return 

        socket.emit('message-from-client', {
            id: 'YO!',
            message: messageInput.value
        })

        messageInput.value =''
    })

    socket.on('message-from-server', (payload: {fullName: string, message: string})=>{
        const newMessage = `
            <li>
                <strong>${payload.fullName}</strong>
                <span>${payload.message}</span>
            </li>
        `
        const li = document.createElement('li')
        li.innerHTML = newMessage

        messageUl.append(li)
    })
}