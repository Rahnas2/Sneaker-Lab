
const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    balance:{
        type:Number,
        default:0
    },
    history:[{
        amount:{type:Number, required:true},
        status:{type:String, required:true, enum: ['credit', 'debit']},
        description:{type:String},
        createdAt: { type: Date, default: Date.now }
    }]
},{timestamps:true})

module.exports = mongoose.model('wallet',walletSchema)