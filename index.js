require('dotenv').config();
const {Client, Intents, MessageActionRow, MessageButton, Message, MessageEmbed, MessageAttachment, MessageMentions, Emoji} = require('discord.js');  //importa discord.js
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
        args[0] = args[0].toLowerCase();

        if (comandi[args[0]]){
            comandi[args[0]](args.splice(1), msg);
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
                    description: `Pong description <@!${msg.author.id}>`
                })
            ],
            components: [
                new MessageActionRow({
                    components: [
                        new MessageButton({
                            label: "YES",
                            style: "SUCCESS",
                            customId: "YES"
                        }),
                        new MessageButton({
                            label: "NO",
                            style: "DANGER",
                            customId: "NO"
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
    },
    "addfriend": async (args,msg)=>{
        if (args[0] && args[0].match(MessageMentions.USERS_PATTERN)){
            var target = await bot.users.fetch(args[0].match(/[0-9]+/)[0])
            //console.log(target);
            if (!target.bot && !target.system && !target.equals(msg.author)){
                msg.channel.send({
                    embeds:[
                        {
                            title: "Friend request",
                            description: `${args[0]}!\nDo you want to be <@!${msg.author.id}>'s friend?`,
                            color: "DARK_PURPLE"
                        }
                    ],
                    components: [
                        new MessageActionRow({
                            components: [
                                new MessageButton({
                                    label: "YES",
                                    style: "SUCCESS",
                                    customId: "YES"
                                }),
                                new MessageButton({
                                    label: "NO",
                                    style: "DANGER",
                                    customId: "NO"
                                })
                            ]
                        })
                    ]
                });
            }else{
                msg.channel.send({
                    embeds:[
                        new MessageEmbed({
                            title: "ERROR",
                            description: "Maybe try adding someone else ^^\"",
                            color: "RED"
                        })
                    ]
                });
            }
        }else{
            msg.channel.send({
                embeds:[
                    new MessageEmbed({
                        title: "ERROR",
                        description: "use: \`>addFriend @user\`",
                        color: "RED"
                    })
                ]
            });
        }
    }
}

function updateInteraction(interaction){
    interaction.update({
        components: [
            new MessageActionRow({
                components: [
                    new MessageButton({
                        label: interaction.customId=="YES"?"YES":"   ",
                        style: "SUCCESS",
                        customId: "YES",
                        disabled: true
                    }),
                    new MessageButton({
                        label: interaction.customId=="NO"?"NO":"   ",
                        style: "DANGER",
                        customId: "NO",
                        disabled: true
                    })
                ]
            })
        ]
    });
}
function linkExists(source,target){

}
function userExists(user){

}
bot.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return;

    mentions = []
    for (let o of interaction.message.embeds[0].description.matchAll(/<@!([0-9]+)>/g)){mentions.push(o[1])}
    console.log(mentions)// /\[(.*?)\]/

    if (interaction.user.id == mentions[0]){
        updateInteraction(interaction)
        if (interaction.customId=="YES"){
            switch (interaction.message.embeds[0].title){
                case "Friend request":
                    if (linkExists(mentions[0],mentions[1])){
                        
                    }else{
                        
                    }
                    break;
            }
        }else{

        }
    }else{
        interaction.deferUpdate();
    }
});


bot.on('ready', () => {
    console.log("Avviato!");
    input()
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

bot.login(process.env.botKey);

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