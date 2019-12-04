// dénition des variables globales

const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
var prefix = config.prefix;
var color_primary = config.primary_color;

// définition de la base de donnée

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync("database.json");
const db = low(adapter);

db.defaults({
    xp: [],
    warns: [],
    join: [],
    autorole: [],
    leave: [],
    annoucement: [],
    logs: []
}).write();

// quand le bot est prêt à être lancé

bot.on('ready', () => {
    console.log("Robot lancé avec succès!");
    bot.user.setActivity(`${bot.users.size} utilisateurs`, { type: "WATCHING" });
});

// gestion d'erreur

bot.on('error', () => {
    bot.destroy();
    setTimeout(() => {
        bot.login(config.token)
    }, 1000);
});

// quand un message est envoyé

bot.on('message', message => {
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // conditions

    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    if (message.channel.type === "dm") return;

    // commandes

    function addlog(type, msg) {
        if (db.get("logs").find({guild: message.guild.id}).value()) {
            let LogsChannel = db.get('logs').filter({guild: message.guild.id}).find('channel').value();
            let log = Object.values(LogsChannel);
            let s = message.guild.channels.find("id", log[1]);
            if (!s) return;
            let e = new Discord.RichEmbed()
                .setTitle(`:gear: | Log de \`${message.guild.name}\``)
                .addField("Type", `\`${type}\``)
                .addField("Contenu", msg)
                .setColor(color_primary)
                .setFooter(`SPARKLE (c) 2020`, bot.user.displayAvatarURL);
            s.send(e);
        }
    }


    if (command === "help") {
        console.log(`Commande **${command}** appelée`);
        let embed = new Discord.RichEmbed()
            .setTitle(`:question: | Voici les différentes commandes`)
            .addField(":pick: | Utilitaire", `\`-help, -server-info, -user-info, -bot-info\``)
            .addField(":no_entry: | Administration", `\`-reset-xp, -set-logs, -del-logs, -warn, -unwarn, -warn-list, -set-join-msg, -del-join-msg, -set-leave-msg, -del-leave-msg, -dm, -set-autorole, -del-autorole, -kick, -ban\``)
            .addField(":chart_with_upwards_trend: | Système de niveau", `\`-rank, -leaderboard\``)
            .addField(":video_game: | Amusement", `\`-roll, -8ball, -ascii, -rip\``)
            .setColor(color_primary)
            .setFooter(`Requête envoyée par ${message.author.tag}`, message.author.displayAvatarURL)
            .setThumbnail(bot.user.displayAvatarURL);
        message.author.send(embed);
        let embed2 = new Discord.RichEmbed()
            .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL)
            .setDescription(`Le message d'aide vous a bien été envoyé via MP :white_check_mark:`)
            .setColor(color_primary)
            .setFooter("SPARKLE (c) 2020", bot.user.displayAvatarURL);
        message.channel.send(embed2).then(m => m.react("✅"));
    }

    if (command === "server-info") {
        console.log(`Commande **${command}** appelée`);
        let owner = message.guild.owner.user;
        let members = message.guild.memberCount;
        let bots = 0;
        let humans = 0;
        let onlines = 0;
        message.guild.members.forEach(member => {
            if (member.user.bot) bots++;
            if (member.user.presence.status !== "offline") onlines++;
            humans = members - bots;
        });
        let roles = message.guild.roles.size - 1;
        let textual = 0;
        let voice = 0;
        message.guild.channels.forEach(c => {
            if (c.type === 'text') textual++;
            if (c.type === "voice") voice++;
        });
        message.channel.createInvite().then(inv => {
            let embed = new Discord.RichEmbed()
                .setTitle(`:bookmark: | Informations de \`${message.guild.name}\``)
                .addField("Propriétaire", `${owner}`)
                .addField("Rôles", `\`${roles} rôles.\``)
                .addField("Membres", `\`${members} membres au total, ${bots} robots, ${humans} humains et ${onlines} en ligne.\``)
                .addField("Salons", `\`${textual} salons textuels et ${voice} salons vocaux.\``)
                .addField("Invitation", `https://discord.gg/${inv.code}`)
                .setThumbnail(message.guild.iconURL)
                .setColor(color_primary)
                .setFooter(`Requête envoyée par ${message.author.tag}`, message.author.displayAvatarURL);
            message.channel.send(embed).then(c => c.react("✅"));
        });
    }

    if (command === "user-info") {
        console.log(`Commande **${command}** appelée`);
        let member = message.mentions.members.first();
        if (!member) {
            let user = message.author;
            let roles = message.member.roles.size - 1;
            let best_roles = message.member.highestRole.name.replace("@everyone", "Aucun rôle");
            let statut = user.presence.status.replace("idle", "Inactif").replace("dnd", "Ne pas déranger").replace("online", "En ligne").replace("offline", "Hors ligne");
            let embed = new Discord.RichEmbed()
                .setTitle(":adult: | Votre profil")
                .addField("Votre nom d'utilisateur", `\`${user.tag}\``)
                .addField("Rôles", `\`${roles} rôles.\``)
                .addField("Meilleur rôle", `\`${best_roles}\``)
                .addField("Statut actuel", `\`${statut}\``)
                .setThumbnail(message.author.displayAvatarURL)
                .setColor(color_primary)
                .setFooter(`SPARKLE (c) 2019`, bot.user.displayAvatarURL);
            message.channel.send(embed).then(c => c.react("✅"));
        } else {
            if (member.user.bot) return message.channel.sendCode("", `Erreur - L'utilisateur mentionné n'est pas humain.`);
            let user = member.user;
            let roles = member.roles.size - 1;
            let best_roles = member.highestRole.name.replace("@everyone", "Aucun rôle");
            let statut = user.presence.status.replace("idle", "Inactif").replace("dnd", "Ne pas déranger").replace("online", "En ligne").replace("offline", "Hors ligne");
            let embed = new Discord.RichEmbed()
                .setTitle(":adult: | Profil de `" + user.username + "`")
                .addField("Votre nom d'utilisateur", `\`${user.tag}\``)
                .addField("Rôles", `\`${roles} rôles.\``)
                .addField("Meilleur rôle", `\`${best_roles}\``)
                .addField("Statut actuel", `\`${statut}\``)
                .setThumbnail(user.displayAvatarURL)
                .setColor(color_primary)
                .setFooter(`SPARKLE (c) 2019`, bot.user.displayAvatarURL);
            message.channel.send(embed).then(c => c.react("✅"));
        }
    }

    if (command === "bot-info") {
        console.log(`Commande **${command}** appelée`);
        let botUser = bot.user;
        let guilds = bot.guilds.size;
        let users = bot.users.size;
        let invitation = `https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=2146958847`;
        let ping = Math.floor(bot.ping);
        let embed = new Discord.RichEmbed()
            .setTitle(`:robot: | Information sur \`${botUser.username}\``)
            .setDescription(`Salut :wink:, tu as besoin d'un superbe bot ? Je suis le bot correspondant à tes demandes, voici le lien pour m'inviter :grin: : ${invitation}`)
            .addField("Nom du robot", `\`${botUser.tag}\``)
            .addField("Serveurs", `\`${guilds} serveurs.\``)
            .addField("Utilisateurs", `\`${users} utilisateurs.\``)
            .addField("Latence actuelle", `\`${ping} ms\``)
            .setThumbnail(botUser.displayAvatarURL)
            .setColor(color_primary)
            .setFooter(`Requête envoyée par ${message.author.tag}`, message.author.displayAvatarURL);
        message.channel.send(embed).then(c => c.react("✅"));
    }

    if (command === "set-logs") {
        console.log(`Commande **${command}** appelée`);
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.sendCode("", `Erreur : Vous n'avez pas de droits administrateurs, vous ne pouvez donc pas utiliser les commandes liées à l'administration.`);
        let channel = message.mentions.channels.first();
        if (!channel) return message.channel.sendCode("", `Erreur : Merci de mentionner un salon textuel afin de le définir en tant que salon des logs.`);
        if (db.get("logs").find({guild: message.guild.id}).value()) return message.channel.sendCode('', `Erreur : Le salon des logs est déjà défini sur ce serveur.`);
        db.get("logs").push({guild: message.guild.id, channel: channel.id}).write();
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .setDescription(`La salon des logs vient d'être défini comme #${channel.name}. :white_check_mark:`)
            .setColor(color_primary)
            .setFooter("SPARKLE (c) 2020", bot.user.displayAvatarURL);
        message.channel.send(embed).then(c => c.react("✅"));
    }

    if (command === "del-logs") {
        console.log(`Commande **${command}** appelée`);
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.sendCode("", `Erreur : Vous n'avez pas de droits administrateurs, vous ne pouvez donc pas utiliser les commandes liées à l'administration.`);
        if (!db.get('logs').find({guild: message.guild.id}).value()) return message.channel.sendCode("", `Erreur : Aucun salon des logs n'a été défini.`);
        let LogsChannel = db.get('logs').filter({guild: message.guild.id}).find('channel').value();
        let log = Object.values(LogsChannel);
        db.get('logs').remove({guild: message.guild.id, channel: log[1]}).write();
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .setDescription(`Nous venons de supprimer le salon des logs actif sur votre serveur :white_check_mark:`)
            .setColor(color_primary)
            .setFooter(`SPARKLE (c) 2019`, bot.user.displayAvatarURL);
        message.channel.send(embed).then(c => c.react("✅"));
    }

    if (command === "warn") {
        console.log(`Commande **${command}** appelée`);
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.sendCode("", `Erreur : Vous n'avez pas de droits administrateurs, vous ne pouvez donc pas utiliser les commandes liées à l'administration.`);
        let member = message.mentions.members.first();
        if (member.user.id === message.author.id) return message.channel.sendCode('', `Erreur : Vous ne pouvez pas vous avertir.`)
        if (!member) return message.channel.sendCode("", `Erreur : Merci de mentionner un utilisateur.`);
        if (!db.get('warns').find({guild: message.guild.id, user: member.user.id}).value()) {
            db.get('warns').push({guild: message.guild.id, user: member.user.id, warns: 1}).write();
            let embed = new Discord.RichEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL)
                .setDescription(`${message.author}, nous venons d'avertir ${member.user} avec succès. :white_check_mark:`)
                .setColor(color_primary)
                .setFooter(`Avertissement de ${member.user.username}`, member.user.displayAvatarURL);
            message.channel.send(embed).then(c => c.react("✅"));
        } else {
            let Warns = db.get('warns').filter({guild: message.guild.id, user: member.user.id}).find('user').value();
            let warn = Object.values(Warns);
            db.get('warns').find({guild: message.guild.id, user: member.user.id}).assign({warns: warn[2] += 1}).write();
            let embed = new Discord.RichEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL)
                .setDescription(`${message.author}, nous venons d'avertir ${member.user} avec succès. :white_check_mark:`)
                .setColor(color_primary)
                .setFooter(`Avertissement de ${member.user.username}`, member.user.displayAvatarURL);
            message.channel.send(embed).then(c => c.react("✅"));
        }
        addlog("Avertissement", `${message.author} vient d'avertir \`${member.user.username}\``);
    }

    if (command === "unwarn") {
        console.log(`Commande **${command}** appelée`);
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.sendCode("", `Erreur : Vous n'avez pas de droits administrateurs, vous ne pouvez donc pas utiliser les commandes liées à l'administration.`);
        let member = message.mentions.members.first();
        if (member.user.id === message.author.id) return message.channel.sendCode('', "Erreur : Vous ne pouvez pas vous enlever un avertissement.")
        if (!member) return message.channel.sendCode("", `Erreur : Merci de mentionner le membre auquel enlever un avertissement.`);
        if (!db.get('warns').find({
            guild: message.guild.id,
            user: member.user.id
        }).value() || db.get('warns').find({
            guild: message.guild.id,
            user: member.user.id,
            warns: 0
        }).value()) return message.channel.sendCode('', `Erreur : L'utilisateur mentionné n'a aucun avertissements.`);
        let Warns = db.get("warns").filter({guild: message.guild.id, user: member.user.id}).find('user').value();
        let warn = Object.values(Warns);
        db.get('warns').find({guild: message.guild.id, user: member.user.id}).assign({warns: warn[2] - 1}).write();
        let embed = new Discord.RichEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .setDescription(`${message.author}, nous venons d'enlever un avertissement à ${member.user} :white_check_mark:`)
            .setColor(color_primary)
            .setFooter(`Suppresion d'un avertissement de ${member.user.tag}`, member.user.displayAvatarURL);
        message.channel.send(embed).then(c => c.react("✅"));
        addlog("Suppression d'un avertissement", `${message.author}, vient d'enlever un avertissement à \`${member.user.username}\``);
    }

    if (command === "dm") {
        console.log(`Commande **${command}** appelée`);
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.sendCode("", `Erreur : Vous n'avez pas de droits administrateurs, vous ne pouvez donc pas utiliser les commandes liées à l'administration.`);
        let member = message.mentions.members.first();
        let msg = args.slice(1).join(' ');
        if (!msg) return message.channel.sendCode("", "Erreur : Veuillez entrer le message à dm.");
        if (!member) {
            let memberAll = args.shift();
            console.log(memberAll)
            if (memberAll.toLowerCase() !== "all") return message.channel.sendCode("", 'Erreur : Veuillez entrer la mention du membre à dm ou à écrire all suivit du message pour envoyer à tous les membres');
            let embed = new Discord.RichEmbed()
                .setTitle(`Commande \`${command}\` utilisée sur \`${message.guild.name}\``)
                .setDescription(msg)
                .setThumbnail(message.guild.iconURL)
                .setFooter(`Requête envoyée par ${message.author.tag}`, message.author.displayAvatarURL)
                .setColor(color_primary);
            message.guild.members.forEach(e => e.send(embed));
        } else {
            let embed = new Discord.RichEmbed()
                .setTitle(`Commande \`${command}\` utilisée sur \`${message.guild.name}\``)
                .setDescription(msg)
                .setThumbnail(message.guild.iconURL)
                .setFooter(`Requête envoyée par ${message.author.tag}`, message.author.displayAvatarURL)
                .setColor(color_primary);
            member.send(embed);
        }
    }
    if (command === "kick") {
        console.log(`Commande **${command}** appelée`);
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.sendCode("", `Erreur : Vous n'avez pas de droits administrateurs, vous ne pouvez donc pas utiliser les commandes liées à l'administration.`);
        let member = message.mentions.members.first();

        if (message.mentions.users.size === 0) {
            return message.channel.sendCode("", "Erreur : Vous devez mentionner un membre.");
        }
        if (member.user.id === message.author.id) return message.channel.sendCode('', "Erreur : Vous ne pouvez pas vous expulser.")
        let kickMember = message.guild.member(message.mentions.users.first());
        if (!kickMember) {
            return message.channel.sendCode("", "Erreur : Je n\'ai pas trouvé l\'utilisateur.");
        }
        let kickEmbedMember = new Discord.RichEmbed()
            .setTitle("Expulsion d'un seveur")
            .setColor(color_primary)
            .setDescription(`Vous avez été explusé du serveur **${message.guild.name}** par ${message.author.username}.`)
            .setFooter("SPARKLE (c) 2020", bot.user.displayAvatarURL);


        let kickEmbed = new Discord.RichEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL)
            .setDescription(`${message.author}, nous venons d'expulsé ${member.user} avec succès. :white_check_mark:`)
            .setColor(color_primary)
            .setFooter(`Expulsion de ${member.user.username}`, member.user.displayAvatarURL);
        message.channel.send(kickEmbed).then(c => c.react("✅"));

        kickMember.send(kickEmbedMember)
            .then(() => {
                kickMember.kick()
                    .then((member) => {
                        addlog("Expulsion", `${message.author}, vient d'expulser du serveur \`${member.user.username}\``);
                    })
                    .catch((err) => {
                        if (err) {
                            return console.error(err);
                        }
                    });
            })
    }


if (command === "8ball"){
let args = message.content.split(" ").slice(1);
let tte = args.join(" ")
if (!tte){
return message.channel.sendCode("","Merci de poser une question.")};

var reponses_question = [

    "Oui.",
    "Non.",
    "Peut être...",
    "Je ne sais pas."
];

let reponse = (reponses_question[Math.floor(Math.random() * reponses_question.length)])
var resume = new Discord.RichEmbed()
.setAuthor(message.author.tag, message.author.displayAvatarURL)
.setTitle("Résultat du 8ball !")
.setFooter(`Requête envoyée par ${message.author.tag}`, message.author.displayAvatarURL)
.setDescription("Voici ma réponse à votre question.")
.addField("Question", tte)
.addField("Réponse", reponse)
message.channel.send(resume)
}






});

// connection du bot

bot.login(config.token);
