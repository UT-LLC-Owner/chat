const friendId = window.location.search.slice((window.location.search.indexOf('id=') + 3))
const myId = window.location.search.slice(6, window.location.search.indexOf('&id='))
const config = {
    url: `http://localhost:3000`,
    io: {
        options: {
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'x-unsuccessful': JSON.stringify({friendId, myId})
                    }
                }
            }
        }
    }
}

function DisplayFriends(config) {
    const { Me } = config
    console.log(Me)
    const friends = GetFriends()
    document.querySelector('#Login_Container').remove()
    const container = document.createElement('div')
    container.id = "friends_container"
    friends.forEach(friend => {
        const link = CreateFriendLink(friend)
        container.append(link)
    })
    document.body.append(container)
}

function CreateFriendLink(config) {
    const { name, _id} = config
    const result = document.createElement('button')

    result.id = "Friend_Link_" + _id
    result.textContent = name

    result.addEventListener('click',function (e) {
        e.preventDefault()
        console.log(name,_id)
        OpenMessage({socket:getSocket(config), name})
    })

    return result
}

function GetFriends() {
    const result = [
        {
            _id: 2,
            name: "Casey"
        },
        {
            _id: 3,
            name: "Shelby"
        }
    ]
    return result
}

function OpenMessage (config) {
    const { socket, name } = config
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

    SendBtn.addEventListener('click', function (e) {
        e.preventDefault()
        const msg = Message.value
        const data = {
            name: myId,
            msg
        }
        Message.value = ""
        socket.emit('message', data)
        AddToMessages(data, true)
    })
}

function CreateLogin () {
    const contain = document.createElement('div')
    const label = document.createElement('label')
    const LoginInput = document.createElement('input')
    const LoginSubmit = document.createElement('button')
    contain.id = 'Login_Container'
    contain.style.display = 'flex'
    contain.style.flexDirection = 'row'
    contain.style.justifyContent = 'center'
    contain.style.alignItems = 'center'
    contain.style.width = '600px'
    contain.style.height = '200px'

    label.id = 'Login_Name_Label'
    label.textContent = "Name"
    label.style.flex = '1'

    LoginInput.id = 'Login_Name_Input'
    LoginInput.style.flex = '3'

    LoginSubmit.id = 'Login_Submit'
    LoginSubmit.textContent = "Login"
    LoginSubmit.style.flex = '1'
    LoginSubmit.addEventListener('click', SubmitLogin.bind(null, LoginInput))

    contain.append(label, LoginInput, LoginSubmit)
    document.body.append(contain)

    async function SubmitLogin(input, e) {
        e.preventDefault()
        const username = input.value
        const options = {
            method: "POST",
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                name: username
            })
        }
        try {
            const response = await fetch(config.url + "/auth/login", options)
            const data = await response.json()
            DisplayFriends({Me:data})
        } catch (e) {
            console.log(e)
        }
    }
}

function AddToMessages(data, isMe) {
    const Messages = document.querySelector('#messages')

    let listItem = document.createElement('li')
    let textAlign = (isMe) ? "right" : "left"
    listItem.innerHTML = `
        <div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: center; width: 100%">
            <div style="width: 10%;">${(isMe) ? '': data.name}</div>
            <div style="width: 50%; text-align: ${textAlign};">${data.msg}</div>
        </div>
    `
    listItem.style.width = "100%"
    listItem.style.listStyle = "none"
    Messages.append(listItem)
}

function getSocket(config) {
    const socket = io(config.url, createSocketOptions(config))
    socket.on('message', function (data) {
        console.log(data)
        AddToMessages(data)
    })
    return socket
}

function createSocketOptions(config) {
    const { friendId, myId } = config
    return {
        transportOptions: {
            polling: {
                extraHeaders: {
                    'x-unsuccessful': JSON.stringify({friendId, myId})
                }
            }
        }
    }
}

function Main() {
    CreateLogin()
}

Main()

