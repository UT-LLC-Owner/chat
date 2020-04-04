
// Helper Functions

const GetArgVariables = () => {
    const Items = process.argv.slice(2)
    const result: { [propName:string] : string } = {}
    Items.forEach(item => {
        const [key,value] = item.trim().split("=")
        result[key] = value.toLowerCase()
    })
    return result
}


// Main Process

const { PORT, REDIS_HOST, REDIS_PORT } = GetArgVariables()

const config = {
    port: PORT || process.env.PORT || 3000,
    redis: {
        host: REDIS_HOST || 'localhost',
        port: REDIS_PORT || 6379
    }
}

export default config
