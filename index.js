require('dotenv').config();
const {Client, Intents, MessageActionRow, MessageButton, Message, MessageEmbed, MessageAttachment, MessageMentions, Emoji, ButtonInteraction} = require('discord.js');  //importa discord.js
const bot = new Client({intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });       //crea un bot
const fs = require('fs');
const PREFIX = process.env.prefix;
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const cytoscape = require('cytoscape')
var cytosnap = require('cytosnap');
cytosnap.use([ 'cytoscape-dagre', 'cytoscape-cose-bilkent' ]);

const tree = cytosnap();
var treeData = {
        nodes:[],
        edges:[]
};
if (fs.existsSync(process.env.saveFilePath)){
    treeData = JSON.parse(fs.readFileSync(process.env.saveFilePath, "utf8"));
}

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


async function inviaImmagine(elementi, msg){
    const options = {
        elements: elementi,
        layout: { 
            name: 'cose' 
        },
        style: [
            {
                selector: 'node',
                style: {
                    width: 'data(size)',
                    height: 'data(size)',
                    shape: 'elipse',
                    label: 'data(tag)',
                    'border-width': 1,
                    'border-color': "green"
                }
            },
            {
                selector: 'node[image]',
                style: {
                    'background-fit': "contain",
                    'background-image': 'data(image)', // specify some image
                    'background-opacity': 0, // do not show the bg colour
                    //'border-width': 0, // no border that would increase node size
                    'background-clip': 'node' // let image go beyond node shape (also better performance)
                }
            },
            {
                selector: 'edge',
                style: {
                    'line-color': 'black',
                    'line-opacity': 0.25  
                }
            }
        ],
        resolvesTo: 'base64uri',
        format: 'png',
        width: 1280,
        height: 960,
        background: 'transparent'
    };
    const img = await tree.shot(options);
    var base64Data = img.replace("data:image/png;base64,", "");
    const sfbuff = new Buffer.from(base64Data, "base64");
    msg.reply({
        files: [
            new MessageAttachment(sfbuff, "output.png")
        ]
    });
}
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
    "friends": async(args,msg)=>{
        var numero = parseInt(args[0]);
        numero = isNaN(numero)?1:Math.max(1,numero);

        const raggiungibili = cytoscape({elements:treeData}).nodes(`#${msg.author.id}`).successors();
        const dijkstra = raggiungibili.dijkstra({root:`#${msg.author.id}`});
        let amici = cytoscape();
        for (elemento of raggiungibili.nodes()){
            if (dijkstra.distanceTo(`#${elemento.data().id}`) <= numero){
                amici.add(dijkstra.pathTo(elemento));
            }
        }

        inviaImmagine(amici.elements().jsons(),msg);
    },
    "image": async (args, msg)=>{
        inviaImmagine(treeData,msg);
    },
    "addfriend": async (args,msg)=>{
        if (msg.author.tag=="naxy#9157"){
            createLink(msg.author.id,args[0].match(/[0-9]+/)[0])
            return
        }
        if (args[0] && args[0].match(MessageMentions.USERS_PATTERN)){
            var target = await bot.users.fetch(args[0].match(/[0-9]+/)[0])
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
async function calcolaRank(){
    const albero = cytoscape({elements:treeData});
    const rank = albero.elements().pageRank().rank;
    for (nodo of treeData.nodes){
        nodo.data.rank = rank(`#${nodo.data.id}`);
        nodo.data.size = 30+nodo.data.rank*200;
    }
}
function linkExists(source,target){
    for (let l of treeData.edges){
        if ((l.data.source==source && l.data.target==target)||(l.data.source==target && l.data.target==source)){
            return true
        }
    }
    return false;
}
function userExists(user){
    for (let n of treeData.nodes){
        if (n.data.id == user){
            return true;
        }
    }
    return false;
}
async function createUser(userId){
    const user = await bot.users.fetch(userId);
    treeData.nodes.push({
        data:{
            id: userId,
            tag: user.tag,
            image: user.displayAvatarURL({format:"png"})
        }
    });
}
function createLink(a,b){
    if (!userExists(a)){
        createUser(a);
    }
    if (!userExists(b)){
        createUser(b);
    }
    treeData.edges.push({data:{id:String(a)+"-"+String(b),source:a,target:b}})
    treeData.edges.push({data:{id:String(b)+"-"+String(a),source:b,target:a}})
}
bot.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return;

    mentions = []
    for (let o of interaction.message.embeds[0].description.matchAll(/<@!([0-9]+)>/g)){mentions.push(o[1])}
    //console.log(mentions)// /\[(.*?)\]/

    if (interaction.user.id == mentions[0]){
        updateInteraction(interaction)
        if (interaction.customId=="YES"){
            switch (interaction.message.embeds[0].title){
                case "Friend request":
                    if (linkExists(mentions[0],mentions[1])){
                        interaction.message.channel.send({embeds:[{description:"You're already fwiends",color:"RED"}]})
                    }else{
                        createLink(mentions[0],mentions[1]);
                        interaction.message.channel.send({embeds:[{description:"You got a new friend ^^",color:"DARK_PURPLE"}]})
                        calcolaRank();
                    }
                    break;
            }
        }else{
            interaction.message.channel.send({embeds:[{title:"OUCH", description:"That's sad :c", color:"DARK_PURPLE"}]})
        }
    }else{
        interaction.deferUpdate();
    }
});


bot.on('ready', () => {
    tree.start().then((a)=>{
        console.log("tree started");
    });
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
            switch (answere){
                case 'calcolaRank':
                    console.log("Inizio ricalcolo");
                    calcolaRank().then(()=>{console.log("Ricalcolato")});
            }
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