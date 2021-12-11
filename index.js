require('dotenv').config();
const {Client, Intents, MessageActionRow, MessageButton, Message, MessageEmbed, MessageAttachment} = require('discord.js');  //importa discord.js
const bot = new Client({intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });       //crea un bot
const fs = require('fs');
const request = require('request');
const PREFIX = process.env.prefix;
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

var cytosnap = require('cytosnap');
cytosnap.use([ 'cytoscape-dagre', 'cytoscape-cose-bilkent' ]);

const tree = cytosnap();
const treeData = JSON.parse(fs.readFileSync(process.env.saveFilePath, "utf8"))
tree.start()

bot.on('messageCreate', msg => {
    try{
        if (msg.content[0] != PREFIX) return;
        if (!msg.guild.id) return;        
        console.log(new Date().toISOString()+" - "+msg.guild.name+" - "+msg.author.username+"#"+msg.author.discriminator+"> "+msg.content);

        let args = msg.content.substring(PREFIX.length).split(" ");
        while (args.indexOf('') != -1){args.splice(args.indexOf(''), 1);}

        if (comandi[args[0]]){
            comandi[args[0]](args.splice(0,1), msg);
        }
    }catch(e){
        console.log("Errore");
        console.error(e);
    }
});


const comandi = {
    "p": (args, msg)=>{comandi.ping(args,msg)},
    "ping": async (args, msg)=>{
        
        msg.channel.send({
            embeds:[
                new MessageEmbed({
                    title: "Pong title",
                    description: "Pong description"
                })
            ],
            components: [
                new MessageActionRow({
                    components: [
                        new MessageButton({
                            label: "YES",
                            style: "SUCCESS",
                            customId: "CIAO"
                        }),
                        new MessageButton({
                            label: "NO",
                            style: "DANGER",
                            customId: "CIAO2"
                        })
                    ]
                })
            ]
        });
    },
    "image": async (args, msg)=>{
        const img = await tree.shot({
            elements: treeData,
            layout: { 
                name: 'grid' 
            },
            style: [
                {
                selector: 'node',
                style: {
                    'background-color': 'red',
                    label: 'data(id)'
                }
                },
                {
                selector: 'edge',
                style: {
                    'line-color': 'blue'
                }
                }
            ],
            resolvesTo: 'base64uri',
            format: 'png',
            width: 640,
            height: 480,
            background: 'transparent'
        });

        var base64Data = img.replace("data:image/png;base64,", "");
        const sfbuff = new Buffer.from(base64Data, "base64");
        msg.reply({
            files: [
                new MessageAttachment(sfbuff, "output.png")
            ]
        });
    }
}






bot.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return;
	console.log(interaction);
});


bot.login(process.env.botKey);
bot.on('ready', () => {
    console.log("Avviato!");
});


async function input(){
    readline.question("", answere => {
        if (answere=="stop"){
            console.log("stopping")
            fs.writeFileSync(process.env.saveFilePath, JSON.stringify(treeData));
            readline.close();
            tree.stop();
            bot.destroy();
        }else{
            input()
        }
    })
}
input()

/*
{
    elements: { // http://js.cytoscape.org/#notation/elements-json
        nodes: [
        {
            data: { id: 'A' }
        },
        {
            data: { id: 'B' }
        },
        {
            data: { id: 'C' }
        }
        ],
        edges: [
        {
            data: { id: 'AB', source: 'A', target: 'B' }
        }
        ]
    },
    layout: { // http://js.cytoscape.org/#init-opts/layout
        name: 'grid' // you may reference a `cytoscape.use()`d extension name here
    },
    style: [ // http://js.cytoscape.org/#style
        {
        selector: 'node',
        style: {
            'background-color': 'red',
            label: 'data(id)'
        }
        },
        {
        selector: 'edge',
        style: {
            'line-color': 'blue'
        }
        }
    ],
    resolvesTo: 'base64uri',
    format: 'png',
    width: 640,
    height: 480,
    background: 'transparent'
}
*/