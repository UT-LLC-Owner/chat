let _id
let socket

const config = {
    url: `http://localhost:3000`,
    io: {
        options: {
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'x-unsuccessful': JSON.stringify({_id})
                    }
                }
            }
        }
    }
}

function ShowLogin (root) {
    const LoginCard = document.createElement('div')
    LoginCard.id = 'login_card'
    LoginCard.classList.add('card','flex-grow-1')
    LoginCard.innerHTML = `
        <div class="card-body">
            <h3 class="card-title">Login</h3>
            <form id="LoginForm">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" class="form-control" id="username">
                </div>
                <button type="submit" class="btn btn-primary">Submit</button>
            </form>
        </div>`
    root.append(LoginCard)
    document.forms['LoginForm'].addEventListener('submit', SubmitLogin)
}

async function SubmitLogin(e) {
    e.preventDefault()
    const username = e.target['username'].value ? e.target['username'].value : ""
    const options = {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            name: username.toLowerCase()
        })
    }
    try {
        const response = await fetch(config.url + "/auth/login", options)
        const data = await response.json()
        _id = data._id
        socket = getSocket(data._id)
        await GoToMessages({user:data})
    } catch (e) {
        console.log(e)
    }
}

async function GoToMessages(config) {
    const root = EmptyRoot()
    console.log(`${arguments.callee.name}:\t`,config)
    const { user } = config
    const MessagesCard = document.createElement('div')
    MessagesCard.id = "messages_card"
    MessagesCard.classList.add("card")
    MessagesCard.style.flex = "2"
    MessagesCard.innerHTML = `
        <div class="card-body">
            <div class="p-2 mb-2 border-bottom d-flex flex-row justify-content-between">
                <h1 class="font-weight-bold">Messages</h1>
                <button id="new_message" class="btn btn-success btn-small">New Message</button>
            </div>
        </div>
    `
    root.append(MessagesCard)
    const CardBody = document.querySelector("#messages_card .card-body")
    user.messages.forEach(message => {
        const MessageLink = CreateMessageLink(message)
        CardBody.append(MessageLink)
    })
    document.querySelector("#new_message").addEventListener('click', NewMessage)
}

function CreateMessageLink(config) {
    console.log(`${arguments.callee.name}:\t`,config)
    const { name, unread, _id, last_message } = config

    const result = document.createElement('button')

    result.id = "Friend_Link_" + _id
    result.textContent = name

    result.addEventListener('click',function (e) {
        e.preventDefault()
        OpenMessage({recipient_id: _id, name, unread: unread ? unread.messages : null})
    })

    return result
}

function NewMessage(e) {
    e.preventDefault()
    const root = GetRoot()
    console.log(`${arguments.callee.name}:\t`, e)
    const SingleMessageCard = document.createElement('div')
    SingleMessageCard.id = "single_message_card"
    SingleMessageCard.classList.add("card")
    SingleMessageCard.style.flex = "3"
    SingleMessageCard.innerHTML = `
        <div class="card-body">
            <form id="newMessage">
                <div class="p-2 mb-2 border-bottom d-flex flex-row justify-content-end">
                    <div class="form-group">
                        <label for="name">To: </label>
                        <input type="text" class="form-control position-relative" id="name" placeholder="Name" autocomplete="off">
                    </div>
                </div>
                <div class="form-group">
                    <textarea rows="5" class="form-control" id="message" placeholder="Message..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-small">Send</button>
            </form>
        </div>
    `
    root.append(SingleMessageCard)
    document.forms['newMessage'].addEventListener('submit', SubmitNewMessage)
    const input = document.querySelector("#name")
    input.addEventListener('input', SearchUser)
}

function SubmitNewMessage(e){
    e.preventDefault()
    console.log(e.target['name'].value,e.target['message'].value)
}

async function GetMessages() {

    const api = new URL(config.url + "/users")
    const params = { search: "cas" }
    Object.keys(params).forEach(key => {
        api.searchParams.append(key, params[key])
    })
    const response = await fetch(api)
    const data = await response.json()
    return data
}

async function SearchUser(e) {
    const input = e.target
    const { value } = input
    const api = new URL(config.url + "/users")
    const params = { search: value }
    Object.keys(params).forEach(key => {
        api.searchParams.append(key, params[key])
    })
    const response = await fetch(api)
    const data = await response.json()
    console.log(data)
    let suggestions
    if(document.querySelector('#name_suggestions')){
        suggestions = document.querySelector('#name_suggestions')
    } else {
        suggestions = document.createElement('div')
        suggestions.id = "name_suggestions"
        suggestions.classList.add('position-absolute')
        suggestions.style.top = 100
        suggestions.style.width = `${input.offsetWidth}px`
        suggestions.style.border = "1px solid #d4d4d4"
        suggestions.style.borderTop = "none"
        suggestions.style.borderBottom = "none"
        suggestions.style.zIndex = 99
        input.parentNode.insertBefore(suggestions,input.nextSibling)
    }

    data.forEach(x => {
        if(!document.querySelector(`#${x.firstName}`)){
            suggestions.append(CreateSuggestion(x))
        }
    })
}

function CreateSuggestion(config){
    const {firstName, _id} = config
    const result = document.createElement('div')
    result.id = firstName
    result.innerText = firstName
    result.classList.add('p-1')
    result.style.backgroundColor = "#fff"
    result.style.borderBottom = "1px solid #d4d4d4"
    return result
}

function PutConversationToStorage(config) {
    const {recipient_id} = config
    const key = `${_id}:conversations`
    let conversations = JSON.parse(window.sessionStorage.getItem(key))
    conversations = conversations ? conversations : {}
    if(!conversations[recipient_id]){
        conversations[recipient_id] = config
    }
    window.sessionStorage.setItem(key, JSON.stringify(conversations))
}

function OpenMessage (config) {
    const { recipient_id, name, unread } = config
    const SendBtn = document.createElement("button")
    const Message = document.createElement("input")
    const Header = document.createElement('h1')
    const List = document.createElement("ul")
    SendBtn.id = 'send'
    Message.id = 'msg'
    List.id = 'messages'
    Header.textContent = "Message With " + name
    List.style.width = "100%"
    SendBtn.textContent = "Send"

    document.querySelector("#friends_container").remove()
    document.body.append(Header,List,Message,SendBtn)

    PutConversationToStorage({recipient_id, name})

    if(unread){
        const _ids = []
        unread.forEach(x => {
            AddToMessages({...x,name})
            _ids.push(x._id)
        })
        MessagesRead({_ids})
    }

    SendBtn.addEventListener('click', (e) => {
        e.preventDefault()
        const msg = Message.value
        const data = {
            sender_id: _id,
            recipient_id,
            name,
            msg
        }
        Message.value = ""
        socket.emit('send message', data)
        AddToMessages(data, true)
    })
}

function AddToMessages(data, isMe) {
    const { name, msg, _id, date, time } = data
    const Messages = document.querySelector('#messages')

    let listItem = document.createElement('li')
    let textAlign = (isMe) ? "right" : "left"
    listItem.innerHTML = `
        <div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: center; width: 100%">
            <div style="flex: 1;">${(isMe) ? '': name}</div>
            <div style="flex: 5; text-align: ${textAlign}; padding-right: 20px">${msg}</div>
            <div style="flex: 1;">${new Date(date ? `${date} ${time} GMT`: Date.now()).toLocaleTimeString()}</div>
        </div>
    `
    listItem.style.width = "100%"
    listItem.style.listStyle = "none"
    Messages.append(listItem)
}

function MessagesRead(config) {
    socket.emit("message read", config)
}

function getSocket(_id) {
    const socket = io(config.url, createSocketOptions(_id))
    socket.on('receive message', function (data) {
        console.log(data)
        AddToMessages(data)
    })
    return socket
}

function createSocketOptions(_id) {
    return {
        transportOptions: {
            polling: {
                extraHeaders: {
                    'x-unsuccessful': JSON.stringify({_id})
                }
            }
        }
    }
}

function MakeRootDiv(){
    const root = document.createElement('div')
    root.id = 'root'
    root.classList.add('container',"pt-5","d-flex","flex-row")
    document.body.append(root)
    return root
}

function EmptyRoot() {
    const root = GetRoot()
    root.innerHTML = ""
    return root
}

function GetRoot() {
    return document.querySelector("#root")
}

function Main() {
    const root = MakeRootDiv()
    ShowLogin(root)
}

Main()

