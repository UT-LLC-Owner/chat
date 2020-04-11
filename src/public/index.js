let _id
let socket

const global_config = {
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
        const response = await fetch(global_config.url + "/auth/login", options)
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
            <div id="conversations" class="card">
                <ul class="list-group list-group-flush">
                
                </ul>
            </div>
        </div>
    `
    root.append(MessagesCard)
    document.querySelector("#new_message").addEventListener('click', NewMessage)

    const list = document.querySelector("#conversations ul")
    user.conversations.forEach(convo => {
        const ConvoLink = CreateConvoLink(convo)
        list.append(ConvoLink)
    })
}

function CreateConvoLink(config) {
    console.log(`${arguments.callee.name}:\t`,config)
    const {participant_1, last_message } = config
    const FriendIndex = (participant_1 === _id) ? "participant_2_data" : "participant_1_data"
    const conversation_id = config._id
    const result = document.createElement('li')
    const name = config[FriendIndex].firstName
    const recipient_id = config[FriendIndex]._id

    result.id = `convo_${conversation_id}`
    result.classList.add('list-group-item')
    result.innerHTML = `
        <h3 style="text-transform: capitalize">${name}</h3>
        <p>${last_message}</p>
    `

    result.addEventListener('click',async function (e) {
        e.preventDefault()
        const response = await fetch(`${global_config.url}/users/conversations/${conversation_id}`)
        const messages = await response.json()
        const config = {conversation_id, recipient_id, name, messages }
        OpenMessage(config)
    })

    return result
}

function AddToMessages(config) {
    console.log(`${arguments.callee.name}:\t`,config)
    const { sender_id, recipient_id, msg, timestamp, conversation_id } = config
    const isMe = sender_id === _id
    const CurrentConversation = document.querySelector('#conversation')
    const current_recipient = (CurrentConversation) ? CurrentConversation.dataset.id : null
    if(current_recipient === recipient_id || current_recipient === sender_id){
        const message = document.createElement('div')
        CurrentConversation.append(message)
        message.style.width = "100%"
        message.classList.add('d-flex','flex-row')
        if(isMe){
            message.classList.add('justify-content-end')
        } else {
            message.classList.add('justify-content-start')
        }
        message.innerHTML = `
            <h3 style="max-width: 75%"><span style="white-space: normal; text-align: left; line-height: 1.2;" class="badge ${isMe ? "badge-primary":"badge-secondary"}">${msg}</span></h3>
        `
    } else {
        if(!conversation_id){
            throw new Error('conversation_id is null or undefined')
        } else {
            const previewMessage = document.querySelector(`#convo_${conversation_id} p`)
            if(previewMessage){
                previewMessage.textContent = msg
            } else {
                NewConversationMessage(config)
            }
        }
    }
}

async function NewConversationMessage(config) {
    const { conversation_id } = config
    const response = await fetch(`${global_config.url}/users/conversations/${conversation_id}/data`)
    const data = await response.json()
    const list = document.querySelector("#conversations ul")
    list.append(CreateConvoLink(data))
}


function OpenMessage (config) {
    console.log(`${arguments.callee.name}:\t`,config)
    const { recipient_id, name, messages } = config
    const Messages = document.querySelector("#messages_card")
    const CurrentMessageCard = Messages.nextElementSibling
    if(!CurrentMessageCard){
        const SingleMessageCard = CreateSingleMessageCard()
        SetMessageCardHTML(SingleMessageCard, config)
        Messages.insertAdjacentElement('afterend', SingleMessageCard)
    } else {
        SetMessageCardHTML(CurrentMessageCard, config)
    }

    messages.forEach(x => {
        AddToMessages(x)
    })

    document.forms['message_to_send'].addEventListener('submit', (e) => {
        e.preventDefault()
        const msg = e.target['msg'].value
        e.target['msg'].value = ""
        const data = {
            sender_id: _id,
            recipient_id,
            name,
            msg
        }
        console.log(data)
        socket.emit('send message', data)
        AddToMessages(data)
    })

}

function SetMessageCardHTML(element, config){
    const {recipient_id,name} = config

    element.innerHTML = `
        <div class="card-body">
            <div class="p-2 mb-2 border-bottom d-flex flex-row justify-content-end">
                <h1 class="font-weight-bold" style="text-transform: capitalize">${name}</h1>
            </div>
            <div id="conversation" class="container-fluid" data-id="${recipient_id}">
            </div>
            <form id="message_to_send">
                <div class="form-group">
                    <input type="text" class="form-control" id="msg" placeholder="Message..." autocomplete="off">
                </div>
                <button type="submit" class="btn btn-primary btn-small">Send</button>
            </form>
        </div>
    `

    return element
}

function NewMessage(e) {
    e.preventDefault()
    const root = GetRoot()
    console.log(`${arguments.callee.name}:\t`, e)
    const SingleMessageCard = CreateSingleMessageCard()
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

function CreateSingleMessageCard(){
    const result = document.createElement('div')
    result.id = "single_message_card"
    result.classList.add("card")
    result.style.flex = "3"
    return result
}

function SubmitNewMessage(e){
    e.preventDefault()
    const name = e.target['name'].value
    const msg = e.target['message'].value
    const recipient_id = e.target['name'].dataset.id
    const data = {
        sender_id: _id,
        recipient_id,
        name,
        msg
    }
    socket.emit('send message', data)
    OpenMessage({recipient_id, name, messages:[data]})
}

async function SearchUser(e) {
    const input = e.target
    const { value } = input
    const api = new URL(global_config.url + "/users")
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
    result.style.textTransform = 'capitalize'
    result.addEventListener('click', function(e){
        e.preventDefault()
        document.querySelector('#name_suggestions').remove()
        const selectedName = document.createElement('input')
        selectedName.id = 'name'
        selectedName.readOnly = true
        selectedName.value = firstName
        selectedName.setAttribute('data-id',_id)
        selectedName.classList.add('btn','btn-primary')
        selectedName.style.textTransform = 'capitalize'
        console.log(selectedName)
        const input = document.querySelector('#name')
        input.replaceWith(selectedName)
        selectedName.addEventListener('click',function (e) {
            e.preventDefault()
            input.value = ''
            selectedName.replaceWith(input)
        })

    })
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




function MessagesRead(config) {
    socket.emit("message read", config)
}

function getSocket(_id) {
    const socket = io(global_config.url, createSocketOptions(_id))
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

