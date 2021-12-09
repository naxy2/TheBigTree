require('dotenv').config();
const Discord = require('discord.js');  //importa discord.js
const bot = new Discord.Client();       //crea un bot
const fs = require('fs');
const request = require('request');
const PREFIX = process.env.prefix;

bot.on('message', msg => {
    try{
        if (msg.content[0] != PREFIX) return;
        if (!msg.guild.id) return;        
        console.log(new Date().toISOString()+" - "+msg.guild.name+" - "+msg.author.username+"#"+msg.author.discriminator+"> "+msg.content);

        let args = msg.content.substring(PREFIX.length).split(" ");
        while (args.indexOf('') != -1){args.splice(args.indexOf(''), 1);}

        switch (args[0]){
            case "ping":
                msg.reply("pong");
                break;
        }
    }catch(e){
        console.log("Errore");
        console.error(e);
    }
});


bot.login(process.env.botKey);
bot.on('ready', () => {
    console.log("Avviato!");
});