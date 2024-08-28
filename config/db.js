const mongoose = require('mongoose')
const mongo_uri = process.env.MONGO_URI

const connect_db = async()=>{
    try {
        await mongoose.connect(mongo_uri)
        console.log('Databse connected')
    } catch (error) {
        console.log('databse not connected')
    }
}


module.exports = connect_db