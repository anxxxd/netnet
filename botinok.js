const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const Eris = require("eris");
const maps = require("mineflayer-maps");
const Jimp = require("jimp");
const fs = require("fs");
const { GoalNear } = goals;

const expectedFile = './captcha/maps/map_3.png';
const discordToken = 'MTE0MjE2MTE4OTQxODMxMTg2NA.Ga7DzU.DEOTHp0AiOXcyPfxgE_cBLyX-jd0zIUk0gwavk';
const discordChannelId = '1107697035894853646';

const client = new Eris.Client(discordToken);
client.connect();

function startBot(username) {
    const bot = mineflayer.createBot({
        username: username,
        host: 'mc.luckydayz.ru',
        port: '',
        version: '1.12.2',
        maps_outputDir: "captcha/maps",
        maps_saveToFile: true,
    });

    bot.loadPlugin(maps.inject)

    let authorized = false;
    let stop = false;
    let stopMessageSent = false;

    let isCheckingAllPlayersStat = false;

    bot.loadPlugin(pathfinder);

    // Задайте координаты, к которым бот должен идти
    const targetPosition = { x: 372, y: 60, z: 778 };

    bot.on('windowOpen', (window) => {
        console.log('Открылось окно:', window.title); // добавьте эту строку для отладки
        // Дополнительная проверка, чтобы убедиться, что GUI имеет слоты
        if (window.slots && window.slots.length > 0) {
            // Выберите первый слот для нажатия
            const slotToClick = 1;

            // Нажмите левую кнопку мыши (0) на выбранном слоте без пропуска взаимодействия (false)
            bot.clickWindow(slotToClick, 0, 0, (err) => {
                if (err) {
                    console.error(`Ошибка при нажатии на предмет в GUI: ${err}`);
                } else {
                    console.log(`Бот ${username} нажал на предмет в GUI.`);
                }
            });
        }
    });

    bot.on('message', (message) => {
        if (message.toString().includes('Вы авторизированы!')) {
            authorized = true;
        }
    });

    bot.on('actionBar', (message) => {
        if (message.toString().includes('Вернуться на прошлую позицию: /ret')) {
            stop = true;
            checkAllPlayersStat();
        }
    });

    function removeFormatting(string) {
        return string.replace(/\x1b\[[0-9;]*m|§[0-9a-fklmnorA-FKLMNOR]/g, '');
    }
    // Обработчики событий для записи форматированного текста в консоль
    bot.once('spawn', () => {
        // Обработчик события 'chat'
        bot.on('chat', function (username, message) {
            const cleanMessage = removeFormatting(message);
            console.log(`<${username}> ${cleanMessage}`);
        });

        // Обработчик события 'message'
        bot.on('message', (message) => {
            const cleanMessage = removeFormatting(message.toAnsi());

            // Проверяем наличие "extra" в сообщении и тип сообщения (если он есть)
            const isActionBarMessage = message.extra && message.extra.some(part => part && part.type === 'actionbar');

            // Если сообщение не содержит тип 'actionbar' и не начинается с '<'
            if (!isActionBarMessage && !cleanMessage.startsWith('<')) {
                console.log(`[SERVER] ${cleanMessage}`);
            }
        });
    })

    bot.on('physicTick', () => {
        if (authorized = true) {
            if (!bot.pathfinder.goal && targetPosition) {
                const { x, y, z } = bot.entity.position;
                const movements = new Movements(bot, bot.entity.onGround);
                const goal = new GoalNear(targetPosition.x, targetPosition.y, targetPosition.z, 1);
                bot.pathfinder.setMovements(movements);
                bot.pathfinder.setGoal(goal);
            }

            if (stop && !stopMessageSent) {
                bot.pathfinder.setGoal(null);
            }
        }
    });

    const ignoredUsernames = [
        "§9❖ §fUghagiPro",
        "§9❖ §fGidi",
        "§9❖ §fNuz1",
        "§9❖ §fMaherA",
        "§9❖ §fTutukon",
        "§9❖ §fZapeRep",
        "§9❖ §fMax_pro",
        "§9❖ §fFedyana100",
        "§9❖ §fKuzya_ads",
        "§9❖ §fSuprimer",
        "§9❖ §fZaya4ka",
        "§9❖ §fKars0N",
        "§9❖ §fBugaxad",
        "§9❖ §fViza_Grizl",
        "§9❖ §fMaxamed",
        "§9❖ §fFaksio",
        "§9❖ §f324poz23",
        "§9❖ §fTor4ik",
        "§9❖ §fMaster_top",
        "§9❖ §fHolod",
        "§9❖ §fPikolyan",
        "§9❖ §fZareY",
        "§9❖ §fHelilvian",
        "§9❖ §fArTel1l",
        "§9❖ §fHellMan",
        "§9❖ §fJekins0N",
        "§9❖ §fMan0k0",
        "§9❖ §fLetenanT",
        "§9❖ §fHex_Belive",
        "§9❖ §fViz0R",
        "§9❖ §f0MeGa",
        "§9❖ §fTataRs0",
        "§9❖ §fDigidu",
        "§9❖ §fGruzya",
        "§9❖ §fKiller_113"
    ];

    function escapeMarkdown(text) {
        const markdownSymbols = "*_|~`";
        let newText = "";

        for (const char of text) {
            if (markdownSymbols.includes(char)) {
                newText += '\\';
            }
            newText += char;
        }
        return newText;
    }

    let checkCounter = 0;

    async function checkAllPlayersStat() {
        if (isCheckingAllPlayersStat) {
            console.log('Проверка статистики игроков уже выполняется, пропуск...');
            return;
        }

        isCheckingAllPlayersStat = true;
        await delay(3500);

        const players = Object.values(bot.players);
        const filteredPlayers = players.filter(player => !ignoredUsernames.includes(player.username));

        let counter = 0;
        for (const player of filteredPlayers) {
            await testt(player.username);
            await delay(1500);

            counter++;

            if (counter === filteredPlayers.length) {
                console.log('Все проверки статистики игроков завершены');
                await removeDuplicateMessages();
                switchServer();
            }
        }
        isCheckingAllPlayersStat = false;
    }

        async function switchServer() {
            if (checkCounter < 5) {
                checkCounter++;

                switch (checkCounter) {
                    case 1:
                        bot.chat('/serv delta');
                        console.log("Я на дельте, проверяю!");
                        break;
                    case 2:
                        bot.chat('/serv alpha');
                        console.log("Я на альфе, проверяю!");
                        break;
                    case 3:
                        bot.chat('/serv epsilon');
                        console.log("Я на епсилоне, проверяю!");
                        break;
                    case 4:
                        bot.chat('/serv charli');
                        console.log("Я на чарли, проверяю!");
                        break;
                }

                checkAllPlayersStat();
            } else {
                checkCounter = 0;
                await removeDuplicateMessages();

                // Ожидать один час перед следующей проверкой
                setTimeout(async () => {
                    bot.chat("/serv gamma");
                    checkAllPlayersStat();
                }, 1000 * 60 * 120);
            }
        }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function testt(playerUsername) {
        bot.removeAllListeners('message');
        checkPlayerStat(playerUsername);
        bot.chat(`/stat ${playerUsername}`);
    }

    client.on('messageCreate', async (message) => {
        const commandPrefix = '/ch';

        if (message.author.bot) return;

        if (message.channel.id === '871316869724897341') {
            if (message.content.startsWith(commandPrefix)) {
                const commandArgument = message.content.substring(commandPrefix.length).trim();
                bot.chat(commandArgument);
                console.log(`Отправлено сообщение в чат: ${commandArgument}`);
            }
        } else {
            return;
        }
    });

    function checkPlayerStat(playerUsername) {
        bot.removeAllListeners('message');
        bot.on('message', async (message) => {
            const cleanMessage = removeFormatting(message.toAnsi());
            const playerStatMessagePattern = /^\s*■\s+Донат:\s+.*$/;

            if (playerStatMessagePattern.test(cleanMessage)) {
                bot.removeListener('message', arguments.callee);
                bot.emit('onPlayerStatMessage', cleanMessage, playerUsername);
            }
        });
    }

    bot.on('onPlayerStatMessage', async (cleanMessage, playerUsername) => {
        const donateValue = cleanMessage.split('Донат: ')[1];
        if (donateValue.trim() == 'нет') {
            const channel = client.getChannel(discordChannelId);
            if (channel) {
            } else {
                console.error(`Ошибка: Не удалось найти канал с ID ${discordChannelId}.`);
            }
        } else if (donateValue.trim() == '[Майор]') {
            console.log(`Донат со значением: ${donateValue}`);
            client.createMessage('1147952413991514213', `---${escapeMarkdown(playerUsername)}---`);
        } else if (donateValue.trim() == '[Капитан]') {
            console.log(`Донат со значением: ${donateValue}`);
            client.createMessage('1147952483335934113', `---${escapeMarkdown(playerUsername)}---`);
        } else if (donateValue.trim() == '[Маршал]') {
            console.log(`Донат со значением: ${donateValue}`);
            client.createMessage('1147953086560747622', `---${escapeMarkdown(playerUsername)}---`);
        } else if (donateValue.trim() == '[Сталкер]') {
            console.log(`Донат со значением: ${donateValue}`);
            client.createMessage('1147953163924680825', `---${escapeMarkdown(playerUsername)}---`);
        } else if (donateValue.trim() == '[Сталкер+]') {
            console.log(`Донат со значением: ${donateValue}`);
            client.createMessage('1147953317415239872', `---${escapeMarkdown(playerUsername)}---`);
        } else if (donateValue.trim() == '[Монолит]') {
            console.log(`Донат со значением: ${donateValue}`);
            client.createMessage('1147953408393883759', `---${escapeMarkdown(playerUsername)}---`);
        }
    });

    bot.on('kicked', (reason, loggedIn) => {
        console.log(`Бот ${username} был кикнут с сервера. Причина: ${reason}`);
    });

    bot.on('end', () => {
        console.log(`Бот ${username} был отключен от сервера.`);
    });
}

async function sendCaptchaToDiscord() {
    try {
        const channel = client.getChannel(discordChannelId);
        if (channel) {
            const captcha = fs.readFileSync('./ready/abema.png');
            await client.createMessage('871316869724897341', 'Помогите пож-ста с капчей(((', {
                file: captcha,
                name: 'abema.png',
            });
            console.log('Капча отправлена в Discord.');
        } else {
            console.error(`Ошибка: Не удалось найти канал с ID ${discordChannelId}.`);
        }
    } catch (error) {
        console.error(`Ошибка при отправке капчи в Discord: ${error.message}`);
    }
}

function chistka() {
    fs.unlink('./captcha/maps/map_8.png', function (err) {
        if (err) return console.log(err);
        console.log('MAP8ClEARED');
    });

    fs.unlink('./captcha/maps/map_7.png', function (err) {
        if (err) return console.log(err);
        console.log('MAP7ClEARED');
    });

    // И так далее для всех остальных файлов…

    fs.unlink('./ready/abema.png', function (err) {
        if (err) return console.log(err);
        console.log('READYMAPClEARED');
    });
}

async function combaba() {
    try {
        const width = 3 * 128;
        const height = 3 * 128;

        const result = new Jimp(width, height);

        const images = ['./captcha/maps/map_8.png', './captcha/maps/map_7.png', './captcha/maps/map_6.png', './captcha/maps/map_5.png', './captcha/maps/map_4.png', './captcha/maps/map_3.png', './captcha/maps/map_2.png', './captcha/maps/map_1.png', './captcha/maps/map_0.png'];

        for (let i = 0; i < images.length; i++) {
            const image = await Jimp.read(images[i]);
            result.composite(image, i % 3 * 128, Math.floor(i / 3) * 128);
        }

        result.write('./ready/abema.png');
        console.log('Картинки успешно объединены!');
        setTimeout(sendCaptchaToDiscord, 2500);
    } catch (e) {
        console.error('Произошла ошибка:', e);
    }
    setTimeout(chistka, 7000);
}

function checkFile() {
    fs.readFile(expectedFile, (err, data) => {
        if (err) {
            setTimeout(checkFile, 2000);
        } else {
            setTimeout(async () => {
                await combaba();
            }, 2500);
        }
    });
}
const discordChannelsIds = ['1147953408393883759', '1147953317415239872', '1147953163924680825', '1147953086560747622', '1147952413991514213', '1147952483335934113'];

async function removeDuplicateMessages() {
    return new Promise(async (resolve) => {
    for (const channelId of discordChannelsIds) {
        const channel = client.getChannel(channelId);

        if (!channel) {
            console.error(`Не удалось найти канал с ID ${channelId}`);
            return;
        }

        // Получение сообщений из канала
        const messages = await channel.getMessages(500); // Загружаем до 100 сообщений
        const messagesMap = new Map();

        // Проверка каждого сообщения на дубли
        for (const message of messages) {
            console.log("Чистим чистим чистим...")
            if (!messagesMap.has(message.content)) {
                messagesMap.set(message.content, [message]);
            } else {
                messagesMap.get(message.content).push(message);
            }
        }

        // Удаление дублированных сообщений
        for (const messageDuplicates of messagesMap.values()) {
            if (messageDuplicates.length > 1) {
                for (let i = 1; i < messageDuplicates.length; i++) {
                    // Удаляем дубликаты, оставляя только первое сообщение
                    messageDuplicates[i].delete();

                }

            }
        }
    }
        resolve();
    });
}

// Запуск бота с заданным именем пользователя
checkFile()
startBot('rabanxd');